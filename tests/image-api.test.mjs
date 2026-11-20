import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const handler = require("../app/api/images.js");
const ORIGIN = "https://zero-studio-preview.vercel.app";

function responseRecorder() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

function request({ method = "POST", origin = ORIGIN, body = { prompt: "Anime forest house" } } = {}) {
  return { method, headers: { origin }, body };
}

test("image API rejects non-POST requests", async () => {
  const res = responseRecorder();
  await handler(request({ method: "GET" }), res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, "POST");
});

test("image API rejects requests from another origin", async () => {
  const oldOrigin = process.env.ZERO_STUDIO_APP_ORIGIN;
  process.env.ZERO_STUDIO_APP_ORIGIN = ORIGIN;
  const res = responseRecorder();
  await handler(request({ origin: "https://attacker.example" }), res);
  assert.equal(res.statusCode, 403);
  if (oldOrigin === undefined) delete process.env.ZERO_STUDIO_APP_ORIGIN;
  else process.env.ZERO_STUDIO_APP_ORIGIN = oldOrigin;
});

test("image API stays disabled until the bearer secret is configured", async () => {
  const oldOrigin = process.env.ZERO_STUDIO_APP_ORIGIN;
  const oldToken = process.env.ZERO_STUDIO_ACCESS_TOKEN;
  process.env.ZERO_STUDIO_APP_ORIGIN = ORIGIN;
  delete process.env.ZERO_STUDIO_ACCESS_TOKEN;
  const res = responseRecorder();
  await handler(request(), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.error, "image_provider_not_configured");
  if (oldOrigin === undefined) delete process.env.ZERO_STUDIO_APP_ORIGIN;
  else process.env.ZERO_STUDIO_APP_ORIGIN = oldOrigin;
  if (oldToken === undefined) delete process.env.ZERO_STUDIO_ACCESS_TOKEN;
  else process.env.ZERO_STUDIO_ACCESS_TOKEN = oldToken;
});

test("image API proxies securely and returns the generated image payload", async () => {
  const oldOrigin = process.env.ZERO_STUDIO_APP_ORIGIN;
  const oldToken = process.env.ZERO_STUDIO_ACCESS_TOKEN;
  const oldFetch = globalThis.fetch;
  process.env.ZERO_STUDIO_APP_ORIGIN = ORIGIN;
  process.env.ZERO_STUDIO_ACCESS_TOKEN = "unit-test-secret";
  let observed;
  globalThis.fetch = async (url, options) => {
    observed = { url, options };
    return new Response(JSON.stringify({
      ok: true,
      imageDataUrl: "data:image/jpeg;base64,aGVsbG8=",
      mimeType: "image/jpeg",
      model: "@cf/black-forest-labs/flux-1-schnell",
      seed: 7,
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    const res = responseRecorder();
    await handler(request(), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.model, "@cf/black-forest-labs/flux-1-schnell");
    assert.equal(observed.options.headers.Authorization, "Bearer unit-test-secret");
    assert.equal(observed.options.headers.Origin, ORIGIN);
    assert.equal(observed.url, "https://zero-studio.9test4675a26.workers.dev/v1/images");
  } finally {
    globalThis.fetch = oldFetch;
    if (oldOrigin === undefined) delete process.env.ZERO_STUDIO_APP_ORIGIN;
    else process.env.ZERO_STUDIO_APP_ORIGIN = oldOrigin;
    if (oldToken === undefined) delete process.env.ZERO_STUDIO_ACCESS_TOKEN;
    else process.env.ZERO_STUDIO_ACCESS_TOKEN = oldToken;
  }
});

test("image API preserves free-quota exhaustion without a paid fallback", async () => {
  const oldOrigin = process.env.ZERO_STUDIO_APP_ORIGIN;
  const oldToken = process.env.ZERO_STUDIO_ACCESS_TOKEN;
  const oldFetch = globalThis.fetch;
  process.env.ZERO_STUDIO_APP_ORIGIN = ORIGIN;
  process.env.ZERO_STUDIO_ACCESS_TOKEN = "unit-test-secret";
  globalThis.fetch = async () => new Response(JSON.stringify({
    error: "free_quota_exhausted",
    message: "Quota reached",
    retryable: true,
  }), { status: 429 });
  try {
    const res = responseRecorder();
    await handler(request(), res);
    assert.equal(res.statusCode, 429);
    assert.equal(res.body.error, "free_quota_exhausted");
  } finally {
    globalThis.fetch = oldFetch;
    if (oldOrigin === undefined) delete process.env.ZERO_STUDIO_APP_ORIGIN;
    else process.env.ZERO_STUDIO_APP_ORIGIN = oldOrigin;
    if (oldToken === undefined) delete process.env.ZERO_STUDIO_ACCESS_TOKEN;
    else process.env.ZERO_STUDIO_ACCESS_TOKEN = oldToken;
  }
});
