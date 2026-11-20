"use strict";

const DEFAULT_WORKER_BASE_URL = "https://zero-studio.9test4675a26.workers.dev";
const MAX_OUTPUT_BYTES = 4 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sendError(res, status, error, message, retryable = false) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  return res.status(status).json({ ok: false, error, message, retryable });
}

function isAllowedRequestOrigin(req, configuredOrigin) {
  const requestOrigin = String(req.headers.origin || "").trim();
  const requestHost = String(req.headers.host || "").toLowerCase();
  if (!requestOrigin) {
    if (!requestHost) return false;
    const allowedPreviewHost = /^zero-studio-(?:preview|flux2-preview)(?:-[a-z0-9-]+)?\.vercel\.app$/.test(requestHost);
    return allowedPreviewHost || "https://" + requestHost === configuredOrigin;
  }
  let parsed;
  try { parsed = new URL(requestOrigin); } catch { return false; }
  if (parsed.protocol !== "https:" || parsed.origin !== requestOrigin) return false;
  if (requestHost && requestHost !== parsed.host.toLowerCase()) return false;
  const allowedPreviewHost = /^zero-studio-(?:preview|flux2-preview)(?:-[a-z0-9-]+)?\.vercel\.app$/.test(parsed.hostname.toLowerCase());
  return requestOrigin === configuredOrigin || allowedPreviewHost;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendError(res, 405, "method_not_allowed", "هذه الواجهة تقبل POST فقط.");
  }
  const appOrigin = String(process.env.ZERO_STUDIO_APP_ORIGIN || "").trim();
  const token = String(process.env.ZERO_STUDIO_ACCESS_TOKEN || "").trim();
  const workerBaseUrl = String(process.env.ZERO_STUDIO_IMAGE_WORKER_URL || DEFAULT_WORKER_BASE_URL).replace(/\/+$/, "");
  if (!appOrigin || !token) {
    return sendError(res, 503, "segmentation_not_configured", "إعدادات فصل الخلفية غير مكتملة على الخادم.");
  }
  if (!isAllowedRequestOrigin(req, appOrigin)) {
    return sendError(res, 403, "origin_not_allowed", "مصدر الطلب غير مسموح.");
  }
  const input = req.body && typeof req.body === "object" ? req.body : {};
  const sourceId = String(input.sourceId || "").trim();
  if (!UUID.test(sourceId)) return sendError(res, 400, "invalid_source_id", "معرّف صورة المصدر غير صالح.");

  try {
    const upstream = await fetch(workerBaseUrl + "/v1/anime/segment", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Origin": appOrigin,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sourceId }),
      cache: "no-store",
    });
    if (!upstream.ok) {
      const payload = await upstream.json().catch(() => ({}));
      const status = upstream.status === 429 ? 429 : upstream.status >= 500 ? 502 : upstream.status;
      return sendError(
        res,
        status,
        payload.error || "segmentation_failed",
        payload.message || "تعذر فصل الشخصية عن الخلفية. احتُفظ بالصورة الأصلية.",
        Boolean(payload.retryable),
      );
    }
    const mimeType = String(upstream.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (mimeType !== "image/png" || upstream.headers.get("x-zero-segmentation") !== "cloudflare-images-birefnet") {
      return sendError(res, 502, "invalid_segmentation_response", "لم يؤكد العامل أن الصورة ناتجة عن خطوة الفصل المطلوبة.");
    }
    const bytes = Buffer.from(await upstream.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_OUTPUT_BYTES) {
      return sendError(res, 413, "segmented_image_too_large", "ملف PNG الشفاف يتجاوز الحد الآمن للمعالجة.");
    }
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Zero-Segmentation", "cloudflare-images-birefnet");
    return res.status(200).send(bytes);
  } catch (error) {
    console.error("anime_segmentation_proxy_failed", {
      name: error?.name || "Error",
      message: String(error?.message || error).slice(0, 160),
    });
    return sendError(res, 502, "segmentation_unreachable", "تعذر الاتصال بخدمة فصل الخلفية. احتُفظ بالصورة الأصلية.", true);
  }
};

module.exports.config = { api: { bodyParser: { sizeLimit: "1mb" }, responseLimit: "4mb" } };
