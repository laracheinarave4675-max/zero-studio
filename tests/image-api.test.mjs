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

test("image API rejects methods other than GET and POST", async () => {
  const res = responseRecorder();
  await handler(request({ method: "DELETE" }), res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, "GET, POST");
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

const CHARACTER_REFERENCE_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/7Y8AAAAASUVORK5CYII=";

test("image API forwards selected character reference images to the Klein Worker", async () => {
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
      model: "@cf/black-forest-labs/flux-2-klein-4b",
      referenceCount: 1,
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    const res = responseRecorder();
    await handler(request({ body: {
      prompt: "same character from the side",
      model: "flux-2-klein-4b",
      aspectRatio: "1:1",
      references: [CHARACTER_REFERENCE_PNG],
    } }), res);
    assert.equal(res.statusCode, 200);
    const forwarded = JSON.parse(observed.options.body);
    assert.deepEqual(forwarded.references, [CHARACTER_REFERENCE_PNG]);
    assert.equal(forwarded.model, "flux-2-klein-4b");
    assert.equal(res.body.referenceCount, 1);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldOrigin === undefined) delete process.env.ZERO_STUDIO_APP_ORIGIN;
    else process.env.ZERO_STUDIO_APP_ORIGIN = oldOrigin;
    if (oldToken === undefined) delete process.env.ZERO_STUDIO_ACCESS_TOKEN;
    else process.env.ZERO_STUDIO_ACCESS_TOKEN = oldToken;
  }
});

test("image API rejects character references on FLUX.1 and caps references at four", async () => {
  const oldOrigin = process.env.ZERO_STUDIO_APP_ORIGIN;
  const oldToken = process.env.ZERO_STUDIO_ACCESS_TOKEN;
  process.env.ZERO_STUDIO_APP_ORIGIN = ORIGIN;
  process.env.ZERO_STUDIO_ACCESS_TOKEN = "unit-test-secret";
  try {
    const wrongModel = responseRecorder();
    await handler(request({ body: { prompt: "character", references: [CHARACTER_REFERENCE_PNG] } }), wrongModel);
    assert.equal(wrongModel.statusCode, 400);
    assert.equal(wrongModel.body.error, "references_require_flux_2");

    const tooMany = responseRecorder();
    await handler(request({ body: {
      prompt: "character",
      model: "flux-2-klein-4b",
      aspectRatio: "1:1",
      references: Array(5).fill(CHARACTER_REFERENCE_PNG),
    } }), tooMany);
    assert.equal(tooMany.statusCode, 400);
    assert.equal(tooMany.body.error, "invalid_references");
  } finally {
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


test("GET diagnostic verifies the Worker bearer token without starting inference", async () => {
  const oldOrigin = process.env.ZERO_STUDIO_APP_ORIGIN;
  const oldToken = process.env.ZERO_STUDIO_ACCESS_TOKEN;
  const oldFetch = globalThis.fetch;
  process.env.ZERO_STUDIO_APP_ORIGIN = ORIGIN;
  process.env.ZERO_STUDIO_ACCESS_TOKEN = "unit-test-secret";
  let observed;
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith("/health")) {
      return new Response(JSON.stringify({ animeAutoFreeTierGuard: true, animeAutoFreeTierConfirmed: false }), { status: 200 });
    }
    observed = { url, options };
    return new Response(JSON.stringify({ error: "invalid_prompt" }), { status: 400 });
  };
  try {
    const res = responseRecorder();
    await handler(request({ method: "GET" }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.tokenVerified, true);
    assert.equal(res.body.inferenceStarted, false);
    assert.equal(observed.url, "https://zero-studio.9test4675a26.workers.dev/v1/images");
    assert.equal(observed.options.headers.Authorization, "Bearer unit-test-secret");
    assert.equal(JSON.parse(observed.options.body).prompt, "");
    assert.equal(JSON.parse(observed.options.body).workload, "anime-auto-drawing");
    assert.equal(res.body.animeAutoFreeTierConfirmed, false);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldOrigin === undefined) delete process.env.ZERO_STUDIO_APP_ORIGIN;
    else process.env.ZERO_STUDIO_APP_ORIGIN = oldOrigin;
    if (oldToken === undefined) delete process.env.ZERO_STUDIO_ACCESS_TOKEN;
    else process.env.ZERO_STUDIO_ACCESS_TOKEN = oldToken;
  }
});

test("GET diagnostic identifies a mismatched bearer token without inference", async () => {
  const oldOrigin = process.env.ZERO_STUDIO_APP_ORIGIN;
  const oldToken = process.env.ZERO_STUDIO_ACCESS_TOKEN;
  const oldFetch = globalThis.fetch;
  process.env.ZERO_STUDIO_APP_ORIGIN = ORIGIN;
  process.env.ZERO_STUDIO_ACCESS_TOKEN = "wrong-unit-test-secret";
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  try {
    const res = responseRecorder();
    await handler(request({ method: "GET" }), res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.error, "worker_token_mismatch");
    assert.equal(res.body.tokenVerified, false);
    assert.equal(res.body.inferenceStarted, false);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldOrigin === undefined) delete process.env.ZERO_STUDIO_APP_ORIGIN;
    else process.env.ZERO_STUDIO_APP_ORIGIN = oldOrigin;
    if (oldToken === undefined) delete process.env.ZERO_STUDIO_ACCESS_TOKEN;
    else process.env.ZERO_STUDIO_ACCESS_TOKEN = oldToken;
  }
});

test("image API forwards semantic identity, pose and continuity roles", async () => {
  const oldOrigin = process.env.ZERO_STUDIO_APP_ORIGIN;
  const oldToken = process.env.ZERO_STUDIO_ACCESS_TOKEN;
  const oldFetch = globalThis.fetch;
  process.env.ZERO_STUDIO_APP_ORIGIN = ORIGIN;
  process.env.ZERO_STUDIO_ACCESS_TOKEN = "unit-test-secret";
  let forwarded;
  globalThis.fetch = async (_url, options) => {
    forwarded = JSON.parse(options.body);
    return new Response(JSON.stringify({
      ok: true, imageDataUrl: "data:image/jpeg;base64,aGVsbG8=",
      mimeType: "image/jpeg", referenceCount: 4
    }), { status: 200 });
  };
  try {
    const roles = ["identity", "pose", "pose", "continuity"];
    const res = responseRecorder();
    await handler(request({ body: {
      prompt: "redraw the walk frame",
      model: "flux-2-klein-4b",
      references: Array(4).fill(CHARACTER_REFERENCE_PNG),
      referenceRoles: roles,
      aspectRatio: "16:9"
    } }), res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(forwarded.referenceRoles, roles);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldOrigin === undefined) delete process.env.ZERO_STUDIO_APP_ORIGIN;
    else process.env.ZERO_STUDIO_APP_ORIGIN = oldOrigin;
    if (oldToken === undefined) delete process.env.ZERO_STUDIO_ACCESS_TOKEN;
    else process.env.ZERO_STUDIO_ACCESS_TOKEN = oldToken;
  }
});

test("image API rejects invalid semantic reference roles before inference", async () => {
  const oldOrigin = process.env.ZERO_STUDIO_APP_ORIGIN;
  const oldToken = process.env.ZERO_STUDIO_ACCESS_TOKEN;
  const oldFetch = globalThis.fetch;
  process.env.ZERO_STUDIO_APP_ORIGIN = ORIGIN;
  process.env.ZERO_STUDIO_ACCESS_TOKEN = "unit-test-secret";
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response("{}"); };
  try {
    const res = responseRecorder();
    await handler(request({ body: {
      prompt: "redraw",
      model: "flux-2-klein-4b",
      references: [CHARACTER_REFERENCE_PNG],
      referenceRoles: ["pose"]
    } }), res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, "invalid_reference_roles");
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldOrigin === undefined) delete process.env.ZERO_STUDIO_APP_ORIGIN;
    else process.env.ZERO_STUDIO_APP_ORIGIN = oldOrigin;
    if (oldToken === undefined) delete process.env.ZERO_STUDIO_ACCESS_TOKEN;
    else process.env.ZERO_STUDIO_ACCESS_TOKEN = oldToken;
  }
});

test("automatic anime generation is blocked before inference until the free-only account is confirmed", async () => {
  const oldOrigin = process.env.ZERO_STUDIO_APP_ORIGIN;
  const oldToken = process.env.ZERO_STUDIO_ACCESS_TOKEN;
  const oldGuard = process.env.ZERO_STUDIO_AI_FREE_TIER_CONFIRMED;
  const oldFetch = globalThis.fetch;
  process.env.ZERO_STUDIO_APP_ORIGIN = ORIGIN;
  process.env.ZERO_STUDIO_ACCESS_TOKEN = "unit-test-secret";
  delete process.env.ZERO_STUDIO_AI_FREE_TIER_CONFIRMED;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response("{}"); };
  try {
    const res = responseRecorder();
    await handler(request({ body: {
      prompt: "one anime walk frame",
      model: "flux-2-klein-4b",
      aspectRatio: "16:9",
      workload: "anime-auto-drawing"
    } }), res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.error, "anime_free_tier_not_confirmed");
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldOrigin === undefined) delete process.env.ZERO_STUDIO_APP_ORIGIN;
    else process.env.ZERO_STUDIO_APP_ORIGIN = oldOrigin;
    if (oldToken === undefined) delete process.env.ZERO_STUDIO_ACCESS_TOKEN;
    else process.env.ZERO_STUDIO_ACCESS_TOKEN = oldToken;
    if (oldGuard === undefined) delete process.env.ZERO_STUDIO_AI_FREE_TIER_CONFIRMED;
    else process.env.ZERO_STUDIO_AI_FREE_TIER_CONFIRMED = oldGuard;
  }
});
