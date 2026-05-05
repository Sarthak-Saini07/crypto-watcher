// server/index.js
import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors"; // ✅ allow frontend to call this proxy

const app = express();
const PORT = process.env.PORT || 4000;

// CORS (allow all in dev; tighten for prod if you want)
app.use(cors());

// Rate limit to avoid hitting CoinGecko 429 errors
app.use(
  rateLimit({
    windowMs: 60_000, // 1 minute
    max: 100,         // 100 requests/min total
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// In-memory cache
const cache = new Map();
const TTL = 120_000; // 120s cache

function getCached(key) {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, expires: Date.now() + TTL });
}


// server/index.js (replace existing app.get handler with this)
const inFlight = new Map(); // url -> Promise

app.get(/^\/api\/(.*)/, async (req, res) => {
  const path = req.params[0];
  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const url = `https://api.coingecko.com/api/v3/${path}${query}`;
  console.log("Fetching:", url);

  const cached = getCached(url);
  if (cached) return res.json(cached);

  // If there's already an in-flight request for the same URL, wait for it
  if (inFlight.has(url)) {
    try {
      const data = await inFlight.get(url);
      return res.json(data);
    } catch (err) {
      // fall through to error below
      console.error("In-flight fetch failed:", err);
      return res.status(500).json({ error: "Failed to fetch data from CoinGecko" });
    }
  }

  // create a promise for this fetch and store it in inFlight
  const fetchPromise = (async () => {
    try {
      // attempt fetch with exponential backoff on 429
      const maxAttempts = 4;
      let attempt = 0;
      let lastError = null;

      while (attempt < maxAttempts) {
        attempt++;
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          setCache(url, data); // cache it
          return data;
        }

        // If upstream returned 429, use backoff and retry
        if (response.status === 429) {
          const retryAfter = response.headers.get("retry-after");
          const serverMessage = await response.text();
          console.warn(`CoinGecko 429 on ${url}: ${serverMessage}`);
          let delayMs = 1000 * Math.pow(2, attempt); // exponential
          if (retryAfter) {
            const parsed = Number(retryAfter);
            if (!Number.isNaN(parsed)) delayMs = Math.max(delayMs, parsed * 1000);
          }
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }

        // Other non-OK -> throw with body for visibility
        const text = await response.text();
        throw new Error(`Upstream ${response.status}: ${text}`);
      }

      throw lastError || new Error("Max retries reached");
    } finally {
      // nothing
    }
  })();

  // store promise
  inFlight.set(url, fetchPromise);

  try {
    const data = await fetchPromise;
    return res.json(data);
  } catch (err) {
    console.error("Fetch failed:", err.message || err);
    // propagate error status if known (we return 502)
    return res.status(502).json({ error: "Failed to fetch data from CoinGecko" });
  } finally {
    // always clear inFlight to allow future fetches
    inFlight.delete(url);
  }
});

// ✅ LISTEN (bind to all interfaces so http://localhost:4000 works)
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Proxy running on http://localhost:${PORT}`)
);
