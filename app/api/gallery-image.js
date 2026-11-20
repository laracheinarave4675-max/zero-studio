"use strict";

const DEFAULT_WORKER_BASE_URL = "https://zero-studio.9test4675a26.workers.dev";
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function send(res, status, payload) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  return res.status(status).json(payload);
}

function isAllowedRequestOrigin(req, configuredOrigin) {
  const requestOrigin = String(req.headers.origin || "").trim();
  const requestHost = String(req.headers.host || "").toLowerCase();
  if (!requestOrigin) {
    if (!requestHost) return false;
    const allowedPreviewHost =
      /^zero-studio-(?:preview|flux2-preview)(?:-[a-z0-9-]+)?\.vercel\.app$/.test(requestHost);
    return allowedPreviewHost || "https://" + requestHost === configuredOrigin;
  }
  let parsed;
  try { parsed = new URL(requestOrigin); } catch { return false; }
  if (parsed.protocol !== "https:" || parsed.origin !== requestOrigin) return false;
  if (requestHost && requestHost !== parsed.host.toLowerCase()) return false;
  const allowedPreviewHost =
    /^zero-studio-(?:preview|flux2-preview)(?:-[a-z0-9-]+)?\.vercel\.app$/.test(parsed.hostname.toLowerCase());
  return requestOrigin === configuredOrigin || allowedPreviewHost;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { ok: false, error: "method_not_allowed" });
  }

  const appOrigin = String(process.env.ZERO_STUDIO_APP_ORIGIN || "").trim();
  const token = String(process.env.ZERO_STUDIO_ACCESS_TOKEN || "").trim();
  const workerBaseUrl = String(process.env.ZERO_STUDIO_IMAGE_WORKER_URL || DEFAULT_WORKER_BASE_URL).replace(/\/+$/, "");

  if (!appOrigin || !token) {
    return send(res, 503, { ok: false, error: "gallery_not_configured", message: "إعدادات معرض الصور غير مكتملة." });
  }
  if (!isAllowedRequestOrigin(req, appOrigin)) {
    return send(res, 403, { ok: false, error: "origin_not_allowed" });
  }

  const id = String(req.query?.id || "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return send(res, 400, { ok: false, error: "invalid_gallery_id", message: "معرّف الصورة غير صالح." });
  }

  try {
    const upstream = await fetch(workerBaseUrl + "/gallery/" + id, { method: "GET", cache: "no-store", redirect: "error" });
    if (!upstream.ok) {
      return send(res, upstream.status === 404 ? 404 : 502, {
        ok: false,
        error: upstream.status === 404 ? "gallery_image_not_found" : "gallery_image_unavailable",
        message: "تعذر استرجاع الصورة من معرض الإنتاج.",
      });
    }
    const mimeType = String(upstream.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      return send(res, 502, { ok: false, error: "invalid_gallery_image_type" });
    }
    const bytes = Buffer.from(await upstream.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) {
      return send(res, 413, { ok: false, error: "gallery_image_too_large", message: "الصورة كبيرة جداً لتجهيزها كمرجع." });
    }
    return send(res, 200, {
      ok: true,
      mimeType,
      imageDataUrl: "data:" + mimeType + ";base64," + bytes.toString("base64"),
    });
  } catch {
    return send(res, 502, { ok: false, error: "gallery_image_unreachable", message: "تعذر الاتصال بمعرض الصور." });
  }
};

module.exports.config = { api: { responseLimit: "5mb" } };
