// server/index.js
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;

// Trust reverse proxy for correct IP identification on Render
app.set("trust proxy", 1);

// Enable CORS
app.use(cors());

// Express rate limiter to guard our proxy endpoints
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 120, // 120 requests/min per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again in a moment." },
  })
);

// CoinGecko API Configuration
const COINGECKO_PRO_KEY = process.env.COINGECKO_PRO_API_KEY || process.env.CG_PRO_API_KEY || "";
const COINGECKO_DEMO_KEY = process.env.COINGECKO_API_KEY || process.env.CG_API_KEY || "";

const COINGECKO_BASE_URL = COINGECKO_PRO_KEY
  ? "https://pro-api.coingecko.com/api/v3"
  : "https://api.coingecko.com/api/v3";

// Cache Configuration:
// FRESH_TTL: duration where data is returned immediately without hitting CoinGecko (90s)
// STALE_TTL: maximum duration where expired data can still be served as fallback if upstream is 429/down (60m)
const FRESH_TTL_MS = 90_000;
const STALE_TTL_MS = 60 * 60_000;

const cache = new Map();

function getCanonicalKey(subPath, queryObj = {}) {
  const cleanPath = (subPath || "").replace(/^\/+|\/+$/g, "");
  const sortedKeys = Object.keys(queryObj).sort();
  const searchParams = new URLSearchParams();
  for (const k of sortedKeys) {
    const val = queryObj[k];
    if (val !== undefined && val !== null && val !== "") {
      searchParams.append(k, String(val));
    }
  }
  const qs = searchParams.toString();
  return `${cleanPath}${qs ? `?${qs}` : ""}`;
}

function getCacheEntry(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  const now = Date.now();
  if (now > entry.staleUntil) {
    cache.delete(key);
    return null;
  }
  return {
    data: entry.data,
    isFresh: now < entry.freshUntil,
    ageSec: Math.floor((now - entry.createdAt) / 1000),
  };
}

function setCacheEntry(key, data) {
  const now = Date.now();
  cache.set(key, {
    data,
    createdAt: now,
    freshUntil: now + FRESH_TTL_MS,
    staleUntil: now + STALE_TTL_MS,
  });
}

// Upstream rate-limit cooldown tracking
let upstreamRateLimitedUntil = 0;

// Deduplication for simultaneous requests
const inFlight = new Map(); // canonicalKey -> Promise

async function fetchFromCoinGecko(subPath, queryObj) {
  const cleanPath = (subPath || "").replace(/^\/+|\/+$/g, "");
  const searchParams = new URLSearchParams();
  for (const [k, val] of Object.entries(queryObj)) {
    if (val !== undefined && val !== null && val !== "") {
      searchParams.append(k, String(val));
    }
  }
  const qs = searchParams.toString();
  const url = `${COINGECKO_BASE_URL}/${cleanPath}${qs ? `?${qs}` : ""}`;

  const headers = {
    Accept: "application/json",
    "User-Agent": "SparkCryptoHub/1.0",
  };
  if (COINGECKO_PRO_KEY) {
    headers["x-cg-pro-api-key"] = COINGECKO_PRO_KEY;
  } else if (COINGECKO_DEMO_KEY) {
    headers["x-cg-demo-api-key"] = COINGECKO_DEMO_KEY;
  }

  // Safe logging without exposing secrets
  console.log(`[CoinGecko Fetch] /${cleanPath}${qs ? `?${qs}` : ""}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12_000); // 12s timeout

  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// CoinGecko API Proxy Handler
app.get(/^\/api\/(.*)/, async (req, res) => {
  // Strip optional v3/ prefix so both /api/... and /api/v3/... resolve correctly
  const subPath = (req.params[0] || "").replace(/^v3\//, "");
  const canonicalKey = getCanonicalKey(subPath, req.query);
  const cacheEntry = getCacheEntry(canonicalKey);

  // 1. Return fresh cached data if available
  if (cacheEntry && cacheEntry.isFresh) {
    res.set("X-Cache", "HIT");
    res.set("X-Cache-Age", `${cacheEntry.ageSec}s`);
    return res.json(cacheEntry.data);
  }

  const now = Date.now();

  // 2. If CoinGecko is currently in rate-limit cooldown, do not hammer upstream
  if (now < upstreamRateLimitedUntil) {
    const remainingSec = Math.max(1, Math.ceil((upstreamRateLimitedUntil - now) / 1000));
    // Graceful stale fallback
    if (cacheEntry) {
      console.warn(`[CoinGecko Cooldown] Serving stale cache for ${canonicalKey} (${remainingSec}s cooldown remaining)`);
      res.set("X-Cache", "STALE");
      res.set("X-Cache-Age", `${cacheEntry.ageSec}s`);
      res.set("Retry-After", String(remainingSec));
      return res.json(cacheEntry.data);
    }
    // No cache available -> immediately return 429 with Retry-After without blocking
    res.set("Retry-After", String(remainingSec));
    return res.status(429).json({
      error: "CoinGecko API rate limit reached. Please wait before retrying.",
      retryAfter: remainingSec,
      statusCode: 429,
    });
  }

  // 3. Deduplicate simultaneous requests for the exact same resource
  if (inFlight.has(canonicalKey)) {
    try {
      const data = await inFlight.get(canonicalKey);
      res.set("X-Cache", "DEDUP");
      return res.json(data);
    } catch (err) {
      if (cacheEntry) {
        res.set("X-Cache", "STALE");
        res.set("X-Cache-Age", `${cacheEntry.ageSec}s`);
        return res.json(cacheEntry.data);
      }
      return res.status(err.status || 502).json({
        error: err.message || "Failed to fetch data from CoinGecko",
        retryAfter: err.retryAfter,
        statusCode: err.status || 502,
      });
    }
  }

  // 4. Fetch upstream with error handling and non-blocking rate limit response
  const fetchPromise = (async () => {
    try {
      const response = await fetchFromCoinGecko(subPath, req.query);

      if (response.ok) {
        const data = await response.json();
        setCacheEntry(canonicalKey, data);
        upstreamRateLimitedUntil = 0; // reset cooldown on success
        return data;
      }

      // Handle 429 Too Many Requests from CoinGecko
      if (response.status === 429) {
        const retryHeader = response.headers.get("retry-after");
        let retrySec = retryHeader ? parseInt(retryHeader, 10) : 60;
        if (isNaN(retrySec) || retrySec <= 0) retrySec = 60;
        retrySec = Math.min(Math.max(retrySec, 15), 120);

        upstreamRateLimitedUntil = Date.now() + retrySec * 1000;
        console.warn(`[CoinGecko 429] Rate limit hit on /${subPath}. Initiating ${retrySec}s cooldown.`);

        const err = new Error("CoinGecko API rate limit reached. Please wait before retrying.");
        err.status = 429;
        err.retryAfter = retrySec;
        throw err;
      }

      // Handle other non-200 responses
      const errText = await response.text().catch(() => "");
      console.error(`[CoinGecko ${response.status}] Error on /${subPath}: ${errText.slice(0, 100)}`);
      const err = new Error(`CoinGecko returned HTTP ${response.status}`);
      err.status = response.status >= 500 ? 502 : response.status;
      throw err;
    } catch (networkErr) {
      if (networkErr.status) throw networkErr;
      const isAbort = networkErr.name === "AbortError";
      console.error(`[CoinGecko Network] ${isAbort ? "Request timed out" : networkErr.message}`);
      const err = new Error(isAbort ? "CoinGecko request timed out" : "Network error contacting CoinGecko");
      err.status = isAbort ? 504 : 502;
      throw err;
    }
  })();

  inFlight.set(canonicalKey, fetchPromise);

  try {
    const data = await fetchPromise;
    res.set("X-Cache", "MISS");
    return res.json(data);
  } catch (err) {
    // If upstream failed or was 429, but we have stale cache -> serve stale cache!
    if (cacheEntry) {
      console.warn(`[Serving Stale] Using stale cache for ${canonicalKey} after upstream failure: ${err.message}`);
      res.set("X-Cache", "STALE");
      res.set("X-Cache-Age", `${cacheEntry.ageSec}s`);
      if (err.retryAfter) res.set("Retry-After", String(err.retryAfter));
      return res.json(cacheEntry.data);
    }

    const statusCode = err.status || 502;
    if (err.retryAfter) {
      res.set("Retry-After", String(err.retryAfter));
    }
    return res.status(statusCode).json({
      error: err.message || "Failed to fetch data from CoinGecko",
      retryAfter: err.retryAfter,
      statusCode,
    });
  } finally {
    inFlight.delete(canonicalKey);
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve Vite build files
app.use(express.static(path.join(__dirname, "../dist")));

// Fallback for React Router
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// Start Express server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Spark Crypto Hub proxy running on http://0.0.0.0:${PORT}`);
});
