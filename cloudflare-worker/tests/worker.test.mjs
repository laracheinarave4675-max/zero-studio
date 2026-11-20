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
    prompt: "anime background",
    model: "test-model"
  }), e);
  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.match(payload.item.shareUrl, /\/gallery\/[0-9a-f-]{36}$/i);
  assert.equal(payload.retentionDays, 30);
  assert.equal(options.expirationTtl, 2592000);
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
