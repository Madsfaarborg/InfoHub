import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { readPublicRelease } from "../src/lib/publish";

async function availablePort() {
  const listener = createServer().listen(0, "127.0.0.1");
  await once(listener, "listening");
  const address = listener.address();
  await new Promise<void>((resolve, reject) => listener.close(error => error ? reject(error) : resolve()));
  assert(address && typeof address === "object");
  return address.port;
}

function escapeHtml(text: string) {
  const entities: Record<string, string> = {
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;",
  };
  return text.replace(/[&<>"']/g, character => entities[character]);
}

async function smoke() {
  const bundle = await readPublicRelease();
  const port = await availablePort();
  const origin = `http://127.0.0.1:${port}`;
  const data = await mkdtemp(path.join(tmpdir(), "infohub-smoke-"));
  const server = spawn(process.execPath, ["scripts/start-local.mjs"], {
    env: { ...process.env, PORT: String(port), INFOHUB_DATA_DIR: data, NODE_ENV: "production" },
    stdio: ["ignore", "inherit", "inherit"],
  });
  const stopped = once(server, "close");
  const request = (route: string) => fetch(origin + route, { signal: AbortSignal.timeout(5_000) });

  try {
    const health = await Promise.race([
      stopped.then(([code]) => { throw new Error(`Production server exited during smoke tests (${code})`); }),
      (async () => {
        const deadline = Date.now() + 30_000;
        while (Date.now() < deadline) {
          const response = await request("/api/health").catch(() => null);
          if (response) return response;
          await delay(250);
        }
        throw new Error("Production server did not start within 30 seconds");
      })(),
    ]);
    assert.equal(health.status, 200);
    const status = await health.json();
    assert.equal(status.status, "ok");
    assert.equal(status.revision, bundle.revision);
    assert.equal(status.models, bundle.models.length);
    assert.equal(status.news, bundle.news.length);

    const modelUrl = `/models/${encodeURIComponent(bundle.models[0].id)}`;
    const benchmarkModels = bundle.models.filter(model => model.reportedBenchmarks);
    const benchmarkModelRoutes = benchmarkModels.map(model => `/models/${encodeURIComponent(model.id)}`);
    const routes = new Set(["/", "/tasks", "/tasks/coding", "/models", modelUrl, ...benchmarkModelRoutes, "/models/explore", "/compare", "/news", "/about"]);
    for (const route of routes) {
      const response = await request(route);
      assert.equal(response.status, 200, route);
      assert.match(response.headers.get("content-type") ?? "", /text\/html/, route);
      const html = await response.text();
      assert.match(html, /<h1[\s>]/, route);
      if (route === "/compare" || benchmarkModelRoutes.includes(route)) {
        for (const model of benchmarkModels) {
          if (route !== "/compare" && route !== `/models/${encodeURIComponent(model.id)}`) continue;
          assert(html.includes('id="reported-benchmarks"'), `Missing benchmark table on ${route}`);
          for (const result of model.reportedBenchmarks!.results) {
            assert(html.includes(escapeHtml(result.name)) && html.includes(`${result.percent}%`), `Missing ${model.name} score for ${result.name} on ${route}`);
          }
        }
      }
      if (route === "/news") {
        assert(html.includes("AI news for work"));
        for (const item of bundle.news) {
          assert(html.includes(escapeHtml(item.title)), `Missing published headline for ${item.eventKey}`);
        }
      }
    }
    const missing = await request("/infohub-smoke-missing-page");
    assert.equal(missing.status, 404);
    await missing.body?.cancel();
    console.log(`Production smoke checks passed for release ${bundle.revision}.`);
  } finally {
    server.kill();
    try {
      await stopped;
    } finally {
      await rm(data, { recursive: true, force: true });
    }
  }
}

smoke().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
