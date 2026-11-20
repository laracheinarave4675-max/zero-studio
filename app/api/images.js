"use strict";

const MAX_PROMPT_LENGTH = 1800;
const WORKER_URL = "https://zero-studio.9test4675a26.workers.dev/v1/images";

function send(res, status, payload) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(payload);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "method_not_allowed" });
  }

  const appOrigin = String(process.env.ZERO_STUDIO_APP_ORIGIN || "").trim();
  const requestOrigin = String(req.headers.origin || "").trim();
  if (!appOrigin || requestOrigin !== appOrigin) {
    return send(res, 403, { error: "origin_not_allowed" });
  }

  const token = process.env.ZERO_STUDIO_ACCESS_TOKEN;
  if (!token) return send(res, 503, { error: "image_provider_not_configured" });

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
      body: JSON.stringify({ prompt: "Professional Japanese 2D anime illustration, polished anime art direction, clear composition, expressive hand-painted visual design. " + prompt, steps: 4 }),
    });

    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const status = upstream.status === 429 ? 429 : upstream.status >= 500 ? 502 : upstream.status;
      return send(res, status, {
        error: payload.error || "image_provider_error",
        message: payload.message || (upstream.status === 429
          ? "انتهت الحصة المجانية الحالية. احتفظ بالوصف وأعد المحاولة بعد تجدد الحصة."
          : "تعذر على خدمة الصور تنفيذ الطلب."),
        retryable: Boolean(payload.retryable),
      });
    }

    if (payload.ok !== true || typeof payload.imageDataUrl !== "string" ||
        !/^data:image\\/(?:jpeg|png|webp);base64,/.test(payload.imageDataUrl) ||
        payload.imageDataUrl.length > 4 * 1024 * 1024) {
      return send(res, 502, { error: "invalid_image_response" });
    }

    return send(res, 200, {
      ok: true,
      imageDataUrl: payload.imageDataUrl,
      mimeType: payload.mimeType || "image/jpeg",
      model: payload.model || "unknown",
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
