import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const handler = require("../app/api/gallery-image.js");
const ORIGIN = "https://zero-studio-preview.vercel.app";
const IMAGE_ID = "7bae987b-038b-44a2-b89d-5ef905719fc7";

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
function request({ method = "GET", origin = ORIGIN, id = IMAGE_ID } = {}) {
  return { method, headers: { origin }, query: { id } };
}
function restoreEnvironment(oldOrigin, oldToken, oldWorker) {
  if (oldOrigin === undefined) delete process.env.ZERO_STUDIO_APP_ORIGIN;
  else process.env.ZERO_STUDIO_APP_ORIGIN = oldOrigin;
  if (oldToken === undefined) delete process.env.ZERO_STUDIO_ACCESS_TOKEN;
  else process.env.ZERO_STUDIO_ACCESS_TOKEN = oldToken;
  if (oldWorker === undefined) delete process.env.ZERO_STUDIO_IMAGE_WORKER_URL;
  else process.env.ZERO_STUDIO_IMAGE_WORKER_URL = oldWorker;
}

test("gallery image API returns a validated image data URL through the same-origin proxy", async () => {
  const oldOrigin = process.env.ZERO_STUDIO_APP_ORIGIN;
  const oldToken = process.env.ZERO_STUDIO_ACCESS_TOKEN;
  const oldWorker = process.env.ZERO_STUDIO_IMAGE_WORKER_URL;
  const oldFetch = globalThis.fetch;
  process.env.ZERO_STUDIO_APP_ORIGIN = ORIGIN;
  process.env.ZERO_STUDIO_ACCESS_TOKEN = "unit-test-secret";
  process.env.ZERO_STUDIO_IMAGE_WORKER_URL = "https://worker.example";
  let observed;
  const bytes = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  globalThis.fetch = async (url, options) => {
    observed = { url, options };
    return new Response(bytes, { status: 200, headers: { "content-type": "image/png" } });
  };
  try {
    const res = responseRecorder();
    await handler(request(), res);
    assert.equal(res.statusCode, 200);
    assert.equal(observed.url, "https://worker.example/gallery/" + IMAGE_ID);
    assert.equal(observed.options.method, "GET");
    assert.equal(res.body.ok, true);
    assert.equal(res.body.mimeType, "image/png");
    assert.equal(res.body.imageDataUrl, "data:image/png;base64," + bytes.toString("base64"));
  } finally {
    globalThis.fetch = oldFetch;
    restoreEnvironment(oldOrigin, oldToken, oldWorker);
  }
});

test("gallery image API rejects invalid ids and unapproved origins before fetching", async () => {
  const oldOrigin = process.env.ZERO_STUDIO_APP_ORIGIN;
  const oldToken = process.env.ZERO_STUDIO_ACCESS_TOKEN;
  const oldFetch = globalThis.fetch;
  process.env.ZERO_STUDIO_APP_ORIGIN = ORIGIN;
  process.env.ZERO_STUDIO_ACCESS_TOKEN = "unit-test-secret";
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response("not found", { status: 404 }); };
  try {
    const invalidId = responseRecorder();
    await handler(request({ id: "../private" }), invalidId);
    assert.equal(invalidId.statusCode, 400);
    assert.equal(invalidId.body.error, "invalid_gallery_id");

    const denied = responseRecorder();
    await handler(request({ origin: "https://attacker.example" }), denied);
    assert.equal(denied.statusCode, 403);
    assert.equal(denied.body.error, "origin_not_allowed");
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = oldFetch;
    restoreEnvironment(oldOrigin, oldToken, undefined);
  }
});

test("gallery image API rejects unsupported content types", async () => {
  const oldOrigin = process.env.ZERO_STUDIO_APP_ORIGIN;
  const oldToken = process.env.ZERO_STUDIO_ACCESS_TOKEN;
  const oldFetch = globalThis.fetch;
  process.env.ZERO_STUDIO_APP_ORIGIN = ORIGIN;
  process.env.ZERO_STUDIO_ACCESS_TOKEN = "unit-test-secret";
  globalThis.fetch = async () => new Response("text", { status: 200, headers: { "content-type": "text/plain" } });
  try {
    const res = responseRecorder();
    await handler(request(), res);
    assert.equal(res.statusCode, 502);
    assert.equal(res.body.error, "invalid_gallery_image_type");
  } finally {
    globalThis.fetch = oldFetch;
    restoreEnvironment(oldOrigin, oldToken, undefined);
  }
});
