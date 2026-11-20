"use strict";

const galleryHandler = require("./gallery");
const EXPECTED = "k_7f2d9b4c11a84a8d94e8c1a5d6f20b3e";

function send(res, status, payload) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  return res.status(status).json(payload);
}

module.exports = async function handler(req, res) {
  const url = new URL(req.url, "https://local.invalid");
  if (url.searchParams.get("key") !== EXPECTED) {
    return send(res, 404, { ok: false, error: "not_found" });
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { ok: false, error: "method_not_allowed" });
  }

  const origin = String(process.env.ZERO_STUDIO_APP_ORIGIN || "").trim();
  const host = String(req.headers.host || "").toLowerCase();
  if (!origin || !/^zero-studio-preview(?:-[a-z0-9-]+)?\.vercel\.app$/.test(host)) {
    return send(res, 503, { ok: false, error: "preview_origin_not_configured" });
  }

  const fakeRequest = {
    method: "POST",
    headers: { origin, host },
    body: {
      imageDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      title: "ZERO STUDIO temporary storage smoke test",
      prompt: "temporary storage path validation",
      model: "smoke-test",
    },
  };

  const fakeResponse = {
    code: 200,
    payload: null,
    setHeader() {},
    status(code) { this.code = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };

  await galleryHandler(fakeRequest, fakeResponse);
  if (fakeResponse.code !== 200 || fakeResponse.payload?.ok !== true || !fakeResponse.payload?.item?.id) {
    return send(res, 502, {
      ok: false,
      error: fakeResponse.payload?.error || "gallery_smoke_failed",
      message: fakeResponse.payload?.message || "The real gallery proxy rejected the storage smoke test.",
    });
  }
  return send(res, 200, { ok: true, item: fakeResponse.payload.item });
};
