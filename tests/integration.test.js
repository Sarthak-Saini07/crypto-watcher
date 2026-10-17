import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import { spawn } from "node:child_process";
import path from "node:path";

describe("Live Server Integration Test", () => {
  let serverProcess;
  const testPort = 4055;
  const baseUrl = `http://127.0.0.1:${testPort}`;

  before(async () => {
    // Start server with custom PORT
    serverProcess = spawn("node", ["server/index.js"], {
      env: { ...process.env, PORT: String(testPort) },
      stdio: "pipe",
    });

    serverProcess.stdout.on("data", (d) => {
      // console.log(`[Server stdout] ${d.toString()}`);
    });

    serverProcess.stderr.on("data", (d) => {
      // console.error(`[Server stderr] ${d.toString()}`);
    });

    // Wait for server to start listening
    let ready = false;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`${baseUrl}/`);
        if (res.status === 200) {
          ready = true;
          break;
        }
      } catch (e) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    assert.ok(ready, "Server failed to start within 6 seconds");
  });

  after(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  test("Serves Vite frontend index.html on root /", async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes("<div id=\"root\">"), "Root index.html should contain root div");
  });

  test("Serves Vite frontend for client-side routes (SPA fallback)", async () => {
    const res = await fetch(`${baseUrl}/coin/bitcoin`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes("<div id=\"root\">"), "SPA fallback should serve index.html");
  });

  test("Market endpoint returns 200 with coins array or handles rate limit gracefully", async () => {
    const res = await fetch(
      `${baseUrl}/api/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false`
    );

    if (res.status === 200) {
      const data = await res.json();
      assert.ok(Array.isArray(data), "Expected array of coins");
      assert.ok(data.length > 0, "Coins array should not be empty");
      assert.ok(data[0].id, "First coin should have an id");
      assert.ok(res.headers.get("x-cache"), "Should include X-Cache header");
    } else if (res.status === 429) {
      const data = await res.json();
      assert.ok(data.error, "Expected rate limit error message");
      assert.ok(res.headers.get("retry-after"), "Expected Retry-After header on 429");
    } else {
      assert.fail(`Unexpected status code: ${res.status}`);
    }
  });

  test("INR currency market endpoint responds with array or graceful 429", async () => {
    const res = await fetch(
      `${baseUrl}/api/coins/markets?vs_currency=inr&order=market_cap_desc&per_page=20&page=1&sparkline=false`
    );

    if (res.status === 200) {
      const data = await res.json();
      assert.ok(Array.isArray(data), "Expected array of coins for INR");
    } else if (res.status === 429) {
      const data = await res.json();
      assert.ok(data.error, "Expected rate limit message on 429");
    } else {
      assert.fail(`Unexpected status code: ${res.status}`);
    }
  });

  test("Second identical request returns cached result with X-Cache: HIT", async () => {
    const url = `${baseUrl}/api/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false`;
    const res1 = await fetch(url);
    if (res1.status === 200) {
      const res2 = await fetch(url);
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.headers.get("x-cache"), "HIT");
    }
  });
});
