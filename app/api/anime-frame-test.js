"use strict";

const IDENTITY_REFERENCE_ID = "be172712-e073-4d06-9587-eec7e6c62a84";
const TEST_TITLE = "ZERO STUDIO — اختبار إطار مشي واحد — 2026-11-21";
const MAX_REFERENCE_BYTES = 512 * 1024;

function send(res, status, payload) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  return res.status(status).json(payload);
}

async function readJson(response) {
  return response.json().catch(() => ({}));
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { ok: false, error: "method_not_allowed" });
  }

  const expected = String(process.env.ZERO_STUDIO_SINGLE_FRAME_TEST_TOKEN || "");
  const supplied = typeof req.query?.token === "string" ? req.query.token : "";
  if (!expected || supplied.length !== expected.length || supplied !== expected) {
    return send(res, 404, { ok: false, error: "not_found" });
  }

  if (String(process.env.ZERO_STUDIO_AI_FREE_TIER_CONFIRMED || "") !== "true") {
    return send(res, 503, { ok: false, error: "free_tier_not_confirmed", inferenceStarted: false });
  }

  const appOrigin = String(process.env.ZERO_STUDIO_APP_ORIGIN || "").trim();
  const accessToken = String(process.env.ZERO_STUDIO_ACCESS_TOKEN || "").trim();
  const workerBaseUrl = String(process.env.ZERO_STUDIO_IMAGE_WORKER_URL || "https://zero-studio-flux2-preview.9test4675a26.workers.dev").replace(/\/+$/, "");
  if (!appOrigin || !accessToken) {
    return send(res, 503, { ok: false, error: "preview_not_configured", inferenceStarted: false });
  }

  const headers = {
    "Authorization": "Bearer " + accessToken,
    "Origin": appOrigin,
  };

  try {
    const healthResponse = await fetch(workerBaseUrl + "/health", { method: "GET", cache: "no-store", redirect: "error" });
    const health = await readJson(healthResponse);
    if (!healthResponse.ok || health.animeAutoFreeTierGuard !== true || health.animeAutoFreeTierConfirmed !== true) {
      return send(res, 503, {
        ok: false,
        error: "worker_free_tier_guard_not_confirmed",
        inferenceStarted: false,
        guard: health.animeAutoFreeTierGuard === true,
        confirmed: health.animeAutoFreeTierConfirmed === true,
      });
    }

    // Idempotency: reuse the saved test frame rather than performing a second inference.
    const galleryListResponse = await fetch(workerBaseUrl + "/v1/gallery", {
      method: "GET",
      headers,
      cache: "no-store",
      redirect: "error",
    });
    const galleryList = await readJson(galleryListResponse);
    if (galleryListResponse.ok && Array.isArray(galleryList.items)) {
      const existing = galleryList.items.find(item => item.title === TEST_TITLE && item.shareUrl);
      if (existing) {
        return send(res, 200, {
          ok: true,
          generated: true,
          reusedExistingTestFrame: true,
          inferenceStarted: false,
          item: existing,
        });
      }
    }

    const identityResponse = await fetch(workerBaseUrl + "/gallery/" + IDENTITY_REFERENCE_ID, {
      method: "GET",
      cache: "no-store",
      redirect: "error",
    });
    if (!identityResponse.ok) {
      return send(res, 502, { ok: false, error: "identity_reference_unavailable", inferenceStarted: false });
    }
    const identityMime = String(identityResponse.headers.get("content-type") || "").split(";")[0].toLowerCase();
    if (!["image/jpeg", "image/png", "image/webp"].includes(identityMime)) {
      return send(res, 502, { ok: false, error: "invalid_identity_reference_type", inferenceStarted: false });
    }
    const identityBytes = Buffer.from(await identityResponse.arrayBuffer());
    if (!identityBytes.length || identityBytes.length > MAX_REFERENCE_BYTES) {
      return send(res, 413, {
        ok: false,
        error: "identity_reference_too_large",
        referenceBytes: identityBytes.length,
        maxReferenceBytes: MAX_REFERENCE_BYTES,
        inferenceStarted: false,
      });
    }
    const identityDataUrl = "data:" + identityMime + ";base64," + identityBytes.toString("base64");

    const prompt = [
      "Create one finished, independent Japanese 2D anime animation drawing: a full-body walking key drawing.",
      "Use reference image 0 strictly as the character identity and costume model sheet. Preserve this same young woman, her exact face and eye design, long flowing black hair, ivory/cream kimono with the same muted rose-pink floral details, rose obi, and traditional sandals.",
      "Draw a clear three-quarter full-body walking pose: left foot stepping forward, opposite arm naturally swinging, sleeves and long hair trailing gently with the movement.",
      "Professional hand-drawn anime keyframe, clean confident line art, coherent anatomy, refined cel shading, soft warm light, simple unobtrusive pale background.",
      "One character and one single scene only. Keep the entire body and both feet inside the frame. No model-sheet layout, no turnarounds, no panels, no text, no watermark.",
      "This is a pose drawing, not a character redesign. Retain the reference identity."
    ].join(" ");

    const inferenceResponse = await fetch(workerBaseUrl + "/v1/images", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        workload: "anime-auto-drawing",
        model: "flux-2-klein-4b",
        aspectRatio: "16:9",
        prompt,
        references: [identityDataUrl],
        referenceRoles: ["identity"],
      }),
    });
    const inference = await readJson(inferenceResponse);
    if (!inferenceResponse.ok || inference.ok !== true || typeof inference.imageDataUrl !== "string") {
      return send(res, inferenceResponse.status || 502, {
        ok: false,
        error: inference.error || "frame_generation_failed",
        message: inference.message || "The free Cloudflare model did not return an image. No paid fallback was attempted.",
        inferenceStarted: inferenceResponse.status !== 503,
        retryable: Boolean(inference.retryable),
      });
    }

    const saveResponse = await fetch(workerBaseUrl + "/v1/gallery", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        imageDataUrl: inference.imageDataUrl,
        title: TEST_TITLE,
        model: inference.model || "@cf/black-forest-labs/flux-2-klein-4b",
        width: inference.width || 1280,
        height: inference.height || 720,
        prompt,
      }),
    });
    const saved = await readJson(saveResponse);
    if (!saveResponse.ok || saved.ok !== true || !saved.item?.shareUrl) {
      return send(res, 502, {
        ok: false,
        error: "frame_gallery_save_failed",
        generated: true,
        inferenceStarted: true,
        message: "The frame was generated but could not be confirmed as saved to the gallery.",
      });
    }

    return send(res, 200, {
      ok: true,
      generated: true,
      saved: true,
      inferenceStarted: true,
      model: inference.model || "@cf/black-forest-labs/flux-2-klein-4b",
      width: inference.width || 1280,
      height: inference.height || 720,
      referenceCount: inference.referenceCount || 1,
      item: saved.item,
    });
  } catch (error) {
    return send(res, 502, {
      ok: false,
      error: "single_frame_test_failed",
      inferenceStarted: false,
      message: String(error?.message || error).slice(0, 240),
    });
  }
};

module.exports.config = {
  api: { bodyParser: { sizeLimit: "4mb" } },
  maxDuration: 60,
};
