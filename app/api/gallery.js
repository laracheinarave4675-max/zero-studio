"use strict";

const WORKER_URL = "https://zero-studio.9test4675a26.workers.dev/v1/gallery";
const MAX_BODY_BYTES = 4 * 1024 * 1024;

function send(res, status, payload) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  return res.status(status).json(payload);
}

module.exports = async function handler(req, res) {
  const appOrigin = String(process.env.ZERO_STUDIO_APP_ORIGIN || "").trim();
  const token = String(process.env.ZERO_STUDIO_ACCESS_TOKEN || "").trim();
  const requestOrigin = String(req.headers.origin || "").trim();
  if (!appOrigin || !token) return send(res, 503, { ok: false, error: "gallery_not_configured", message: "إعدادات معرض الصور غير مكتملة." });
  if (requestOrigin !== appOrigin) return send(res, 403, { ok: false, error: "origin_not_allowed" });
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { ok: false, error: "method_not_allowed" });
  }
  let body;
  if (req.method === "POST") {
    const rawLength = Number(req.headers["content-length"] || 0);
    if (rawLength > MAX_BODY_BYTES) return send(res, 413, { ok: false, error: "image_too_large" });
    body = req.body && typeof req.body === "object" ? req.body : {};
    if (JSON.stringify(body).length > MAX_BODY_BYTES) return send(res, 413, { ok: false, error: "image_too_large" });
  }
  try {
    const upstream = await fetch(WORKER_URL, {
      method: req.method,
      headers: {
        "Authorization": "Bearer " + token,
        "Origin": appOrigin,
        ...(req.method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      ...(req.method === "POST" ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
    });
    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return send(res, upstream.status >= 500 ? 502 : upstream.status, {
      ok: false, error: payload.error || "gallery_upstream_error",
      message: payload.message || "تعذر الوصول إلى معرض الصور."
    });
    return send(res, 200, payload);
  } catch {
    return send(res, 502, { ok: false, error: "gallery_unreachable", message: "تعذر الاتصال بمخزن معرض الصور." });
  }
};
