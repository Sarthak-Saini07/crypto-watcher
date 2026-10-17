import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import http from "node:http";
import express from "express";

describe("Proxy & Caching Logic", () => {
  // Test canonical query parameter sorting
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

  test("Canonical key is order-independent for query parameters", () => {
    const key1 = getCanonicalKey("coins/markets", {
      vs_currency: "inr",
      order: "market_cap_desc",
      per_page: "20",
    });
    const key2 = getCanonicalKey("coins/markets", {
      per_page: "20",
      vs_currency: "inr",
      order: "market_cap_desc",
    });
    assert.strictEqual(key1, key2);
    assert.strictEqual(
      key1,
      "coins/markets?order=market_cap_desc&per_page=20&vs_currency=inr"
    );
  });

  test("Canonical key handles leading and trailing slashes in path", () => {
    const key = getCanonicalKey("/coins/markets/", { vs_currency: "usd" });
    assert.strictEqual(key, "coins/markets?vs_currency=usd");
  });

  test("Stale-while-revalidate and rate-limit cooldown behavior", async () => {
    let mockCoinGeckoCalls = 0;
    let mockStatus = 200;
    let mockRetryAfter = "30";

    // Create a mock upstream CoinGecko server
    const mockServer = http.createServer((req, res) => {
      mockCoinGeckoCalls++;
      if (mockStatus === 429) {
        res.writeHead(429, {
          "content-type": "application/json",
          "retry-after": mockRetryAfter,
        });
        res.end(JSON.stringify({ error: "Rate limit exceeded" }));
      } else {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify([{ id: "bitcoin", current_price: 100000 }]));
      }
    });

    await new Promise((resolve) => mockServer.listen(0, resolve));
    const mockPort = mockServer.address().port;
    const mockBaseUrl = `http://localhost:${mockPort}`;

    // Create proxy test server with our caching logic
    const cache = new Map();
    let upstreamRateLimitedUntil = 0;

    const proxyApp = express();
    proxyApp.get(/^\/api\/(.*)/, async (req, res) => {
      const subPath = req.params[0] || "";
      const canonicalKey = getCanonicalKey(subPath, req.query);
      const now = Date.now();
      const entry = cache.get(canonicalKey);

      // Check fresh cache
      if (entry && now < entry.freshUntil) {
        res.set("X-Cache", "HIT");
        return res.json(entry.data);
      }

      // Check rate limit cooldown
      if (now < upstreamRateLimitedUntil) {
        const remainingSec = Math.max(1, Math.ceil((upstreamRateLimitedUntil - now) / 1000));
        if (entry && now < entry.staleUntil) {
          res.set("X-Cache", "STALE");
          return res.json(entry.data);
        }
        res.set("Retry-After", String(remainingSec));
        return res.status(429).json({ error: "Rate limited", retryAfter: remainingSec });
      }

      // Fetch upstream
      const url = `${mockBaseUrl}/${subPath}`;
      const upstreamRes = await fetch(url);

      if (upstreamRes.ok) {
        const data = await upstreamRes.json();
        cache.set(canonicalKey, {
          data,
          freshUntil: now + 500, // 500ms fresh for test
          staleUntil: now + 5000, // 5s stale
        });
        res.set("X-Cache", "MISS");
        return res.json(data);
      }

      if (upstreamRes.status === 429) {
        const retryHeader = upstreamRes.headers.get("retry-after") || "30";
        const retrySec = parseInt(retryHeader, 10);
        upstreamRateLimitedUntil = Date.now() + retrySec * 1000;

        // Serve stale if available
        if (entry && now < entry.staleUntil) {
          res.set("X-Cache", "STALE");
          return res.json(entry.data);
        }

        res.set("Retry-After", String(retrySec));
        return res.status(429).json({ error: "Rate limit reached", retryAfter: retrySec });
      }

      return res.status(502).json({ error: "Upstream error" });
    });

    const proxyServer = http.createServer(proxyApp);
    await new Promise((resolve) => proxyServer.listen(0, resolve));
    const proxyPort = proxyServer.address().port;

    try {
      // 1. Initial request -> Cache MISS
      const res1 = await fetch(`http://localhost:${proxyPort}/api/coins/markets?vs_currency=usd`);
      assert.strictEqual(res1.status, 200);
      assert.strictEqual(res1.headers.get("x-cache"), "MISS");
      assert.strictEqual(mockCoinGeckoCalls, 1);

      // 2. Immediate second request -> Cache HIT (no upstream call)
      const res2 = await fetch(`http://localhost:${proxyPort}/api/coins/markets?vs_currency=usd`);
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.headers.get("x-cache"), "HIT");
      assert.strictEqual(mockCoinGeckoCalls, 1); // call count unchanged!

      // 3. Now simulate upstream returning 429
      mockStatus = 429;
      // Wait for fresh cache to expire (500ms)
      await new Promise((r) => setTimeout(r, 600));

      // Request now hits upstream, sees 429, but falls back to STALE cache!
      const res3 = await fetch(`http://localhost:${proxyPort}/api/coins/markets?vs_currency=usd`);
      assert.strictEqual(res3.status, 200);
      assert.strictEqual(res3.headers.get("x-cache"), "STALE");
      assert.strictEqual(mockCoinGeckoCalls, 2);

      // 4. Request during cooldown does NOT call upstream at all and continues serving stale cache!
      const res4 = await fetch(`http://localhost:${proxyPort}/api/coins/markets?vs_currency=usd`);
      assert.strictEqual(res4.status, 200);
      assert.strictEqual(res4.headers.get("x-cache"), "STALE");
      assert.strictEqual(mockCoinGeckoCalls, 2); // No new call!

      // 5. Request for a key with NO cache during cooldown returns 429 immediately without calling upstream
      const res5 = await fetch(`http://localhost:${proxyPort}/api/other/endpoint`);
      assert.strictEqual(res5.status, 429);
      assert.ok(res5.headers.get("retry-after"));
      assert.strictEqual(mockCoinGeckoCalls, 2); // Still 2 calls!
    } finally {
      proxyServer.close();
      mockServer.close();
    }
  });

  test("Synthetic simple/price derived from market cache", () => {
    const cache = new Map();
    cache.set("coins/markets?vs_currency=usd", {
      data: [
        { id: "bitcoin", current_price: 85000 },
        { id: "ethereum", current_price: 2500 },
      ],
      createdAt: Date.now(),
      freshUntil: Date.now() + 60000,
      staleUntil: Date.now() + 120000,
    });

    function trySynthesizeSimplePrice(queryObj) {
      const ids = (queryObj.ids || "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
      const vsCurrencies = (queryObj.vs_currencies || "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
      if (ids.length === 0 || vsCurrencies.length === 0) return null;

      const result = {};
      for (const currency of vsCurrencies) {
        let foundMarketData = null;
        for (const [key, entry] of cache.entries()) {
          if (key.startsWith("coins/markets") && key.includes(`vs_currency=${currency}`) && Array.isArray(entry.data)) {
            foundMarketData = entry.data;
            break;
          }
        }
        if (!foundMarketData) return null;

        for (const id of ids) {
          const match = foundMarketData.find((c) => c.id === id);
          if (!match || match.current_price === undefined) return null;
          if (!result[id]) result[id] = {};
          result[id][currency] = match.current_price;
        }
      }
      return result;
    }

    const synthetic = trySynthesizeSimplePrice({ ids: "bitcoin,ethereum", vs_currencies: "usd" });
    assert.deepStrictEqual(synthetic, {
      bitcoin: { usd: 85000 },
      ethereum: { usd: 2500 },
    });
  });
});
