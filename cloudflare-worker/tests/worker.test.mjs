import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const ORIGIN = "https://zero-studio.example";
const TOKEN = "test-secret-token";

function env(run = async () => ({ image: "aGVsbG8=" })) {
  return {
    STUDIO_ORIGIN: ORIGIN,
    STUDIO_ACCESS_TOKEN: TOKEN,
    AI: { run },
  };
}

function request(path = "/v1/images", body = { prompt: "anime forest house" }, headers = {}) {
  return new Request("https://worker.example" + path, {
    method: "POST",
    headers: {
      Origin: ORIGIN,
      Authorization: "Bearer " + TOKEN,
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

test("uses the primary Worker as a no-inference token verifier when no local secret exists", async () => {
  const originalFetch = globalThis.fetch;
  let verificationCalls = 0;
  let inferenceCalls = 0;
  globalThis.fetch = async (url, options) => {
    verificationCalls++;
    assert.equal(url, "https://zero-studio.9test4675a26.workers.dev/v1/images");
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Authorization, "Bearer " + TOKEN);
    assert.equal(options.headers.Origin, ORIGIN);
    assert.equal(JSON.parse(options.body).prompt, "");
    return Response.json({ error: "invalid_prompt" }, { status: 400 });
  };
  try {
    const response = await worker.fetch(request(), {
      STUDIO_ORIGIN: ORIGIN,
      AI: { run: async () => { inferenceCalls++; return { image: "aGVsbG8=" }; } },
    });
    assert.equal(response.status, 200);
    assert.equal(verificationCalls, 1);
    assert.equal(inferenceCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects a missing or invalid bearer token before inference", async () => {
  let calls = 0;
  const req = request("/v1/images", { prompt: "test" }, { Authorization: "Bearer wrong" });
  const response = await worker.fetch(req, env(async () => { calls++; return { image: "x" }; }));
  assert.equal(response.status, 401);
  assert.equal(calls, 0);
});

test("rejects unapproved origins", async () => {
  const req = new Request("https://worker.example/v1/images", {
    method: "POST",
    headers: { Origin: "https://attacker.example", Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "test" }),
  });
  const response = await worker.fetch(req, env());
  assert.equal(response.status, 403);
});

test("valid request calls only the fixed model with at most four steps", async () => {
  let captured;
  const response = await worker.fetch(request(), env(async (model, input) => {
    captured = { model, input };
    return { image: "aGVsbG8=" };
  }));
  assert.equal(response.status, 200);
  assert.equal(captured.model, "@cf/black-forest-labs/flux-1-schnell");
  assert.equal(captured.input.steps, 4);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.mimeType, "image/jpeg");
  assert.match(payload.imageDataUrl, /^data:image\/jpeg;base64,/);
});

test("FLUX.2 Klein 4B receives explicit 16:9 dimensions using multipart input", async () => {
  let captured;
  const response = await worker.fetch(request("/v1/images", {
    prompt: "wide anime background",
    model: "flux-2-klein-4b",
    aspectRatio: "16:9",
  }), env(async (model, input) => {
    const multipartResponse = new Response(input.multipart.body, {
      headers: { "content-type": input.multipart.contentType },
    });
    const form = await multipartResponse.formData();
    captured = {
      model,
      prompt: form.get("prompt"),
      width: form.get("width"),
      height: form.get("height"),
      contentType: input.multipart.contentType,
    };
    return { image: "iVBORw0KGgo=" };
  }));
  assert.equal(response.status, 200);
  assert.equal(captured.model, "@cf/black-forest-labs/flux-2-klein-4b");
  assert.equal(captured.prompt, "wide anime background");
  assert.equal(captured.width, "1280");
  assert.equal(captured.height, "720");
  assert.match(captured.contentType, /^multipart\/form-data; boundary=/);
  const payload = await response.json();
  assert.equal(payload.width, 1280);
  assert.equal(payload.height, 720);
  assert.equal(payload.aspectRatio, "16:9");
  assert.equal(payload.mimeType, "image/png");
  assert.match(payload.imageDataUrl, /^data:image\/png;base64,/);
});

const CHARACTER_REFERENCE_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/7Y8AAAAASUVORK5CYII=";

test("FLUX.2 Klein receives character references as indexed binary multipart fields", async () => {
  let captured;
  const response = await worker.fetch(request("/v1/images", {
    prompt: "show the same character in side profile",
    model: "flux-2-klein-4b",
    aspectRatio: "1:1",
    references: [CHARACTER_REFERENCE_PNG, CHARACTER_REFERENCE_PNG],
  }), env(async (model, input) => {
    const multipartResponse = new Response(input.multipart.body, {
      headers: { "content-type": input.multipart.contentType },
    });
    const form = await multipartResponse.formData();
    const first = form.get("input_image_0");
    const second = form.get("input_image_1");
    captured = {
      model,
      prompt: form.get("prompt"),
      firstType: first?.type,
      firstSize: first?.size,
      secondType: second?.type,
      secondSize: second?.size,
      missingThird: form.get("input_image_2"),
    };
    return { image: "iVBORw0KGgo=" };
  }));
  assert.equal(response.status, 200);
  assert.equal(captured.model, "@cf/black-forest-labs/flux-2-klein-4b");
  assert.match(captured.prompt, /primary character identity reference/i);
  assert.equal(captured.firstType, "image/png");
  assert.equal(captured.secondType, "image/png");
  assert.ok(captured.firstSize > 0);
  assert.ok(captured.secondSize > 0);
  assert.equal(captured.missingThird, null);
  const payload = await response.json();
  assert.equal(payload.referenceCount, 2);
});

test("rejects character reference images on FLUX.1 Schnell without inference", async () => {
  let calls = 0;
  const response = await worker.fetch(request("/v1/images", {
    prompt: "anime character",
    references: [CHARACTER_REFERENCE_PNG],
  }), env(async () => { calls++; return { image: "x" }; }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "references_require_flux_2");
  assert.equal(calls, 0);
});

test("rejects more than four character references without inference", async () => {
  let calls = 0;
  const response = await worker.fetch(request("/v1/images", {
    prompt: "anime character",
    model: "flux-2-klein-4b",
    aspectRatio: "1:1",
    references: Array(5).fill(CHARACTER_REFERENCE_PNG),
  }), env(async () => { calls++; return { image: "x" }; }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid_references");
  assert.equal(calls, 0);
});

test("rejects oversized or malformed character reference data without inference", async () => {
  let calls = 0;
  const oversized = "data:image/jpeg;base64," + "A".repeat(700000);
  const response = await worker.fetch(request("/v1/images", {
    prompt: "anime character",
    model: "flux-2-klein-4b",
    aspectRatio: "1:1",
    references: [oversized],
  }), env(async () => { calls++; return { image: "x" }; }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "reference_image_too_large");
  assert.equal(calls, 0);
});

test("rejects unknown image models without calling inference", async () => {
  let calls = 0;
  const response = await worker.fetch(request("/v1/images", {
    prompt: "test",
    model: "@cf/attacker/unknown-model",
  }), env(async () => { calls++; return { image: "x" }; }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid_model");
  assert.equal(calls, 0);
});

test("rejects unsupported FLUX.2 aspect ratios without calling inference", async () => {
  let calls = 0;
  const response = await worker.fetch(request("/v1/images", {
    prompt: "test",
    model: "flux-2-klein-4b",
    aspectRatio: "32:9",
  }), env(async () => { calls++; return { image: "x" }; }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid_aspect_ratio");
  assert.equal(calls, 0);
});

test("does not switch models when FLUX.2 Klein 4B quota or capacity is exhausted", async () => {
  let calls = 0;
  const response = await worker.fetch(request("/v1/images", {
    prompt: "test",
    model: "flux-2-klein-4b",
    aspectRatio: "16:9",
  }), env(async () => {
    calls++;
    throw new Error("Workers AI out of capacity");
  }));
  assert.equal(response.status, 429);
  assert.equal(calls, 1);
  const payload = await response.json();
  assert.equal(payload.error, "free_quota_exhausted");
  assert.equal(payload.retryable, true);
});

test("rejects steps above the free-safe cap without inference", async () => {
  let calls = 0;
  const response = await worker.fetch(request("/v1/images", { prompt: "test", steps: 5 }), env(async () => {
    calls++;
    return { image: "x" };
  }));
  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});

test("maps provider quota exhaustion to a retryable 429 and never falls back", async () => {
  let calls = 0;
  const response = await worker.fetch(request(), env(async () => {
    calls++;
    throw new Error("Daily Neuron quota exceeded");
  }));
  assert.equal(response.status, 429);
  assert.equal(calls, 1);
  const payload = await response.json();
  assert.equal(payload.error, "free_quota_exhausted");
  assert.equal(payload.retryable, true);
});

test("does not reveal provider exception details", async () => {
  const response = await worker.fetch(request(), env(async () => {
    throw new Error("sensitive provider internals");
  }));
  assert.equal(response.status, 502);
  assert.doesNotMatch(await response.text(), /sensitive provider internals/);
});

test("health remains available before private image credentials are configured", async () => {
  const response = await worker.fetch(new Request("https://worker.example/health"), {
    AI: { run: async () => ({ image: "aGVsbG8=" }) },
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.aiBindingConfigured, true);
  assert.equal(payload.imageEndpointConfigured, false);
  const noAi = await worker.fetch(new Request("https://worker.example/health"), {});
  assert.equal((await noAi.json()).aiBindingConfigured, false);
});

test("saves generated images to KV with a 30-day TTL and returns an opaque share URL", async () => {
  const store = new Map();
  let options;
  const gallery = {
    async put(key, value, opts) { store.set(key, { value, metadata: opts.metadata }); options = opts; },
    async get(key) { return store.get(key)?.value || null; },
    async list() { return { keys: [...store.entries()].map(([name, item]) => ({ name, metadata: item.metadata })), list_complete: true }; },
  };
  const e = { ...env(), GALLERY: gallery };
  const response = await worker.fetch(request("/v1/gallery", {
    imageDataUrl: "data:image/png;base64,aGVsbG8=",
    title: "اختبار الخلفية",
    prompt: "وصف طويل ".repeat(300),
    model: "test-model"
  }), e);
  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.match(payload.item.shareUrl, /\/gallery\/[0-9a-f-]{36}$/i);
  assert.equal(payload.retentionDays, 30);
  assert.equal(options.expirationTtl, 2592000);
  assert.equal("prompt" in options.metadata, false);
  assert.ok(Buffer.byteLength(JSON.stringify(options.metadata), "utf8") < 1024);
  const savedRecord = JSON.parse(store.get("gallery:" + payload.item.id).value);
  assert.equal(savedRecord.prompt.length, 1800);
  const imageResponse = await worker.fetch(new Request(payload.item.shareUrl), e);
  assert.equal(imageResponse.status, 200);
  assert.equal(imageResponse.headers.get("content-type"), "image/png");
  assert.equal(await imageResponse.text(), "hello");
});

test("lists saved gallery metadata only after bearer authentication", async () => {
  const gallery = {
    async list() { return { keys: [{ name: "gallery:12345678-1234-1234-1234-123456789abc", metadata: { title: "Scene", createdAt: "2026-11-20T12:00:00.000Z" } }], list_complete: true }; },
  };
  const req = new Request("https://worker.example/v1/gallery", {
    method: "GET",
    headers: { Origin: ORIGIN, Authorization: "Bearer " + TOKEN },
  });
  const response = await worker.fetch(req, { ...env(), GALLERY: gallery });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.items.length, 1);
  assert.equal(payload.items[0].title, "Scene");
  assert.match(payload.items[0].shareUrl, /gallery\/12345678/);
});


test("anime foreground segmentation returns a transparent PNG using Cloudflare Images BiRefNet", async () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const store = new Map([["gallery:" + id, JSON.stringify({
    imageDataUrl: "data:image/png;base64,aGVsbG8=",
    mimeType: "image/png",
    bytes: 5,
  })]]);
  const gallery = { async get(key) { return store.get(key) || null; } };
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url: String(url), image: options?.cf?.image };
    return new Response(new Uint8Array([137, 80, 78, 71]), {
      status: 200,
      headers: { "content-type": "image/png" },
    });
  };
  try {
    const response = await worker.fetch(request("/v1/anime/segment", { sourceId: id }), {
      ...env(), GALLERY: gallery, ANIME_SEGMENTATION_FREE_TIER_CONFIRMED: "true",
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.equal(response.headers.get("x-zero-segmentation"), "cloudflare-images-birefnet");
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [137, 80, 78, 71]);
    assert.equal(captured.url, "https://worker.example/gallery/" + id);
    assert.deepEqual(captured.image, { segment: "foreground", format: "png" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("anime foreground segmentation refuses to run until the Images Free tier is explicitly confirmed", async () => {
  const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const gallery = { async get() { return JSON.stringify({
    imageDataUrl: "data:image/png;base64,aGVsbG8=", mimeType: "image/png", bytes: 5,
  }); } };
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response(new Uint8Array([137,80,78,71]), { status: 200, headers: { "content-type": "image/png" } }); };
  try {
    const response = await worker.fetch(request("/v1/anime/segment", { sourceId: id }), {
      ...env(), GALLERY: gallery,
    });
    assert.equal(response.status, 503);
    const payload = await response.json();
    assert.equal(payload.error, "free_tier_not_confirmed");
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("anime foreground segmentation requires auth and an existing gallery source before transformation", async () => {
  let calls = 0;
  const gallery = { async get() { return null; } };
  const e = { ...env(), GALLERY: gallery };
  const unauthorized = await worker.fetch(request("/v1/anime/segment", {
    sourceId: "11111111-1111-4111-8111-111111111111",
  }, { Authorization: "Bearer wrong" }), e);
  assert.equal(unauthorized.status, 401);
  const missing = await worker.fetch(request("/v1/anime/segment", {
    sourceId: "11111111-1111-4111-8111-111111111111",
  }), e);
  assert.equal(missing.status, 404);
  const invalid = await worker.fetch(request("/v1/anime/segment", { sourceId: "not-a-uuid" }), e);
  assert.equal(invalid.status, 400);
  assert.equal(calls, 0);
});

test("anime foreground segmentation stops safely at the free transformation limit without a paid fallback", async () => {
  const id = "22222222-2222-4222-8222-222222222222";
  const gallery = { async get() { return JSON.stringify({
    imageDataUrl: "data:image/png;base64,aGVsbG8=", mimeType: "image/png", bytes: 5,
  }); } };
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response("9422: image transformations free limit exceeded", { status: 400 }); };
  try {
    const response = await worker.fetch(request("/v1/anime/segment", { sourceId: id }), {
      ...env(), GALLERY: gallery, ANIME_SEGMENTATION_FREE_TIER_CONFIRMED: "true",
    });
    assert.equal(response.status, 429);
    const payload = await response.json();
    assert.equal(payload.error, "free_transformation_limit_reached");
    assert.equal(payload.retryable, false);
    assert.match(payload.message, /لم تُفرض رسوم/);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("anime foreground segmentation rejects failed or non-PNG model output", async () => {
  const id = "33333333-3333-4333-8333-333333333333";
  const gallery = { async get() { return JSON.stringify({
    imageDataUrl: "data:image/png;base64,aGVsbG8=", mimeType: "image/png", bytes: 5,
  }); } };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("model temporarily unavailable", { status: 503 });
  try {
    const failed = await worker.fetch(request("/v1/anime/segment", { sourceId: id }), {
      ...env(), GALLERY: gallery, ANIME_SEGMENTATION_FREE_TIER_CONFIRMED: "true",
    });
    assert.equal(failed.status, 502);
    assert.equal((await failed.json()).error, "segmentation_failed");
  } finally {
    globalThis.fetch = originalFetch;
  }
  globalThis.fetch = async () => new Response("not a png", { status: 200, headers: { "content-type": "image/jpeg" } });
  try {
    const invalid = await worker.fetch(request("/v1/anime/segment", { sourceId: id }), {
      ...env(), GALLERY: gallery, ANIME_SEGMENTATION_FREE_TIER_CONFIRMED: "true",
    });
    assert.equal(invalid.status, 502);
    assert.equal((await invalid.json()).error, "invalid_segmentation_output");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
