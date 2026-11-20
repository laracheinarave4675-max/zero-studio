"use strict";

const MAX_PROMPT_LENGTH = 1800;
const WORKER_URL = "https://zero-studio.9test4675a26.workers.dev/v1/images";

function send(res, status, payload) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.status(status).json(payload);
}

async function readPayload(response) {
  return response.json().catch(() => ({}));
}

module.exports = async function handler(req, res) {
  const appOrigin = String(process.env.ZERO_STUDIO_APP_ORIGIN || "").trim();
  const token = String(process.env.ZERO_STUDIO_ACCESS_TOKEN || "").trim();

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
      const upstream = await fetch(WORKER_URL, {
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

  const requestOrigin = String(req.headers.origin || "").trim();
  if (!appOrigin || requestOrigin !== appOrigin) {
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

  try {
    const upstream = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
        "Origin": appOrigin,
      },
      body: JSON.stringify({
        prompt: "Professional Japanese 2D anime illustration, polished anime art direction, clear composition, expressive hand-painted visual design. " + prompt,
        steps: 4,
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
      model: payload.model || "@cf/black-forest-labs/flux-1-schnell",
      seed: payload.seed ?? null,
    });
  } catch {
    return send(res, 502, {
      error: "image_provider_unreachable",
      message: "تعذر الاتصال بمحرك الصور. لم يتم استدعاء أي مزود بديل مدفوع.",
      retryable: true,
    });
  }
};
