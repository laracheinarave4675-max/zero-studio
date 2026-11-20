"use strict";

const MAX_PROMPT_LENGTH = 1800;
const DEFAULT_WORKER_BASE_URL = "https://zero-studio.9test4675a26.workers.dev";
const MAX_REFERENCE_COUNT = 4;
const MAX_REFERENCE_IMAGE_BYTES = 512 * 1024;

function send(res, status, payload) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.status(status).json(payload);
}

function isAllowedRequestOrigin(req, configuredOrigin) {
  const requestOrigin = String(req.headers.origin || "").trim();
  if (!requestOrigin || !configuredOrigin) return false;

  let parsed;
  try {
    parsed = new URL(requestOrigin);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" || parsed.origin !== requestOrigin) return false;

  const requestHost = String(req.headers.host || "").toLowerCase();
  if (requestHost && requestHost !== parsed.host.toLowerCase()) return false;

  const allowedPreviewHost =
    /^zero-studio-(?:preview|flux2-preview)(?:-[a-z0-9-]+)?\.vercel\.app$/.test(parsed.hostname.toLowerCase());
  return requestOrigin === configuredOrigin || allowedPreviewHost;
}

async function readPayload(response) {
  return response.json().catch(() => ({}));
}

function validateReferenceImages(value, model) {
  if (value === undefined) return { references: [] };
  if (model !== "flux-2-klein-4b") return { error: "references_require_flux_2", message: "صور مرجع الشخصية تتطلب FLUX.2 Klein 4B." };
  if (!Array.isArray(value) || value.length > MAX_REFERENCE_COUNT) return { error: "invalid_references", message: "يمكن اختيار أربع صور مرجعية كحد أقصى." };
  const references = [];
  let totalBytes = 0;
  for (const dataUrl of value) {
    if (typeof dataUrl !== "string") return { error: "invalid_reference_image", message: "إحدى الصور المرجعية غير صالحة." };
    const match = /^data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(dataUrl);
    if (!match) return { error: "invalid_reference_image", message: "يجب أن تكون الصور المرجعية PNG أو JPEG أو WebP." };
    const bytes = Math.floor(match[1].length * 3 / 4);
    if (bytes < 1 || bytes > MAX_REFERENCE_IMAGE_BYTES) return { error: "reference_image_too_large", message: "يجب ألا يتجاوز حجم كل صورة مرجعية 512 كيلوبايت." };
    totalBytes += bytes;
    references.push(dataUrl);
  }
  if (totalBytes > MAX_REFERENCE_COUNT * MAX_REFERENCE_IMAGE_BYTES) return { error: "reference_images_too_large", message: "الحجم الإجمالي للصور المرجعية كبير جداً." };
  return { references };
}

module.exports = async function handler(req, res) {
  const appOrigin = String(process.env.ZERO_STUDIO_APP_ORIGIN || "").trim();
  const token = String(process.env.ZERO_STUDIO_ACCESS_TOKEN || "").trim();
  const workerBaseUrl = String(process.env.ZERO_STUDIO_IMAGE_WORKER_URL || DEFAULT_WORKER_BASE_URL).replace(/\/+$/, "");
  const workerUrl = workerBaseUrl + "/v1/images";

  // A safe connectivity probe: the Worker validates origin and bearer auth first,
  // then rejects the empty prompt with 400. This deliberately never calls AI.run.
  if (req.method === "GET") {
    if (!appOrigin || !token) {
      return send(res, 503, {
        ok: false,
        error: "image_provider_not_configured",
        message: "إعدادات الوصول إلى محرك الصور غير مكتملة على خادم Vercel.",
        inferenceStarted: false,
      });
    }

    try {
      const upstream = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "Origin": appOrigin,
        },
        body: JSON.stringify({ prompt: "" }),
      });
      const payload = await readPayload(upstream);

      if (upstream.status === 400 && payload.error === "invalid_prompt") {
        return send(res, 200, {
          ok: true,
          routeConfigured: true,
          workerReachable: true,
          tokenVerified: true,
          provider: "cloudflare-workers-ai",
          model: "@cf/black-forest-labs/flux-1-schnell",
          inferenceStarted: false,
          message: "الاتصال ورمز الوصول صحيحان. لم يتم تشغيل النموذج أو استهلاك الحصة.",
        });
      }

      if (upstream.status === 401 || payload.error === "unauthorized") {
        return send(res, 503, {
          ok: false,
          error: "worker_token_mismatch",
          workerReachable: true,
          tokenVerified: false,
          inferenceStarted: false,
          message: "الخادم يصل إلى Cloudflare، لكن رمز الوصول في Vercel لا يطابق الرمز الموجود في Cloudflare.",
        });
      }

      if (upstream.status === 403 || payload.error === "origin_not_allowed") {
        return send(res, 503, {
          ok: false,
          error: "worker_origin_mismatch",
          workerReachable: true,
          tokenVerified: false,
          inferenceStarted: false,
          message: "عنوان الاستوديو المسموح في Cloudflare لا يطابق عنوان Vercel المضبوط.",
        });
      }

      return send(res, 502, {
        ok: false,
        error: payload.error || "worker_probe_failed",
        workerReachable: true,
        inferenceStarted: false,
        message: payload.message || "استجاب عامل Cloudflare برمز غير متوقع أثناء فحص الاتصال.",
      });
    } catch {
      return send(res, 502, {
        ok: false,
        error: "worker_unreachable",
        workerReachable: false,
        inferenceStarted: false,
        message: "تعذر على Vercel الوصول إلى عامل Cloudflare.",
      });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { error: "method_not_allowed" });
  }

  if (!isAllowedRequestOrigin(req, appOrigin)) {
    return send(res, 403, { error: "origin_not_allowed", message: "مصدر الطلب غير مسموح." });
  }
  if (!token) {
    return send(res, 503, {
      error: "image_provider_not_configured",
      message: "لم يتم إعداد رمز الوصول على خادم Vercel.",
    });
  }

  const input = req.body && typeof req.body === "object" ? req.body : {};
  const prompt = typeof input.prompt === "string" ? input.prompt.trim() : "";
  if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
    return send(res, 400, { error: "invalid_prompt", message: "اكتب وصفاً من 1 إلى 1800 حرف." });
  }
  const model = input.model === undefined ? "flux-1-schnell" : input.model;
  if (model !== "flux-1-schnell" && model !== "flux-2-klein-4b") {
    return send(res, 400, { error: "invalid_model", message: "نموذج التوليد المحدد غير مدعوم." });
  }
  const referenceValidation = validateReferenceImages(input.references, model);
  if (referenceValidation.error) {
    return send(res, 400, { error: referenceValidation.error, message: referenceValidation.message });
  }
  const references = referenceValidation.references;
  const aspectRatio = input.aspectRatio === undefined ? "16:9" : input.aspectRatio;
  if (model === "flux-2-klein-4b" && aspectRatio !== "16:9" && aspectRatio !== "1:1") {
    return send(res, 400, { error: "invalid_aspect_ratio", message: "اختر 16:9 أو 1:1." });
  }
  if (model === "flux-1-schnell" && input.aspectRatio !== undefined) {
    return send(res, 400, { error: "aspect_ratio_requires_flux_2", message: "الأبعاد الصريحة متاحة مع FLUX.2 Klein 4B فقط." });
  }

  try {
    const upstream = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
        "Origin": appOrigin,
      },
      body: JSON.stringify({
        prompt: "Professional Japanese 2D anime illustration, polished anime art direction, clear composition, expressive hand-painted visual design. " + prompt,
        model,
        ...(model === "flux-1-schnell" ? { steps: 4 } : { aspectRatio }),
        ...(references.length ? { references } : {}),
      }),
    });

    const payload = await readPayload(upstream);
    if (!upstream.ok) {
      const status = upstream.status === 429 ? 429 : upstream.status >= 500 ? 502 : upstream.status;
      return send(res, status, {
        error: payload.error || "image_provider_error",
        message: payload.message || (upstream.status === 429
          ? "انتهت الحصة المجانية الحالية. احتفظ بالوصف وأعد المحاولة بعد تجدد الحصة."
          : upstream.status === 401
            ? "رمز الوصول بين Vercel وCloudflare غير متطابق."
            : "تعذر على خدمة الصور تنفيذ الطلب (" + upstream.status + ")."),
        retryable: Boolean(payload.retryable),
      });
    }

    if (payload.ok !== true || typeof payload.imageDataUrl !== "string" ||
        !(payload.imageDataUrl.startsWith("data:image/jpeg;base64,") || payload.imageDataUrl.startsWith("data:image/png;base64,") || payload.imageDataUrl.startsWith("data:image/webp;base64,")) ||
        payload.imageDataUrl.length > 4 * 1024 * 1024) {
      return send(res, 502, { error: "invalid_image_response", message: "أعاد محرك الصور استجابة لا تحتوي على صورة صالحة." });
    }

    return send(res, 200, {
      ok: true,
      imageDataUrl: payload.imageDataUrl,
      mimeType: payload.mimeType || "image/jpeg",
      model: payload.model || (model === "flux-2-klein-4b" ? "@cf/black-forest-labs/flux-2-klein-4b" : "@cf/black-forest-labs/flux-1-schnell"),
      seed: payload.seed ?? null,
      width: payload.width ?? null,
      height: payload.height ?? null,
      aspectRatio: payload.aspectRatio ?? null,
      referenceCount: Number.isInteger(payload.referenceCount) ? payload.referenceCount : references.length,
    });
  } catch {
    return send(res, 502, {
      error: "image_provider_unreachable",
      message: "تعذر الاتصال بمحرك الصور. لم يتم استدعاء أي مزود بديل مدفوع.",
      retryable: true,
    });
  }
};

module.exports.config = { api: { bodyParser: { sizeLimit: "4mb" } } };
