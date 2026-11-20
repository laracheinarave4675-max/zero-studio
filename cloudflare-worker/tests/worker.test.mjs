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

test("supports a non-secret health check but requires configured bindings", async () => {
  const response = await worker.fetch(new Request("https://worker.example/health", {
    headers: { Origin: ORIGIN },
  }), env());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  const unconfigured = await worker.fetch(new Request("https://worker.example/health", {
    headers: { Origin: ORIGIN },
  }), { STUDIO_ORIGIN: ORIGIN });
  assert.equal(unconfigured.status, 503);
});
