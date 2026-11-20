"use strict";

const DEFAULT_WORKER_BASE_URL = "https://zero-studio.9test4675a26.workers.dev";
const CHARACTER_SHEET_ID = "4abf7811-41f8-4436-ba9f-6ca4e211fa80";
const MAX_REFERENCE_IMAGE_BYTES = 512 * 1024;

function send(res, status, payload) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  return res.status(status).json(payload);
}

function getBase64DataUrl(bytes, mimeType) {
  return "data:" + mimeType + ";base64," + Buffer.from(bytes).toString("base64");
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { ok: false, error: "method_not_allowed" });
  }

  if (String(req.query?.run || "") !== "first-four-walk-keys") {
    return send(res, 400, {
      ok: false,
      error: "explicit_run_flag_required",
      message: "Call this preview-only route with ?run=first-four-walk-keys to start the four-frame proof.",
      inferenceStarted: false,
    });
  }

  const appOrigin = String(process.env.ZERO_STUDIO_APP_ORIGIN || "").trim();
  const token = String(process.env.ZERO_STUDIO_ACCESS_TOKEN || "").trim();
  const workerBaseUrl = String(process.env.ZERO_STUDIO_IMAGE_WORKER_URL || DEFAULT_WORKER_BASE_URL).replace(/\/+$/, "");
  if (!appOrigin || !token) {
    return send(res, 503, {
      ok: false, error: "image_provider_not_configured", inferenceStarted: false,
      message: "ZERO STUDIO image gateway environment is incomplete on this preview deployment.",
    });
  }

  const workerUrl = workerBaseUrl + "/v1/images";
  const galleryUrl = workerBaseUrl + "/v1/gallery";
  const workerHeaders = {
    "Authorization": "Bearer " + token,
    "Origin": appOrigin,
  };

  const poses = [
    {
      id: "key-00-contact-left",
      title: "Walk key 1 — left foot contact",
      pose: "Walking contact pose: left leg reaches forward toward screen-right and the left shoe is firmly planted; right leg trails behind with heel lifted. Pelvis slightly forward. Right arm swings forward and left arm back in natural counter-swing. Head level and balanced. Clear first contact drawing."
    },
    {
      id: "key-06-down-compression",
      title: "Walk key 2 — down and compression",
      pose: "Continue the same walk immediately after left-foot contact. Left foot remains firmly planted in the same ground-contact area; left knee bends and the whole body compresses slightly downward. Right heel rises behind. Pelvis and shoulders settle naturally, head lowers subtly, arms counter-swing. Preserve the exact side profile and costume."
    },
    {
      id: "key-12-passing",
      title: "Walk key 3 — passing position",
      pose: "Continue the same walk at the passing position. Body rises toward neutral height. Right leg passes beneath the pelvis, with right knee moving forward toward screen-right while left leg supports the body. Feet remain close to the ground, no floating. Arms pass through natural counter-swing. Hair trails slightly behind."
    },
    {
      id: "key-18-up-recovery",
      title: "Walk key 4 — up and recovery",
      pose: "Continue the same walk after passing. Body lifts into the up/recovery beat; right leg reaches forward toward screen-right and prepares next heel contact, while left leg trails behind and pushes off. Pelvis shifts over supporting leg, arms counter-swing, long hair and skirt follow through with subtle delayed sway. Keep both shoes fully visible."
    }
  ];

  const common = [
    "Create ONE complete finished 2D Japanese anime character drawing, not a model sheet, collage, or sequence.",
    "Use the supplied character sheet as the strict identity and costume reference. Draw the exact same young adult woman: same delicate face, large dark eyes, very long straight glossy black hair with the same fringe, same cream kimono top with red trim, same red waist sash, same red skirt with the same gold motifs, same proportions and shoes.",
    "Full body from head to both shoes, clean side profile facing screen-right, entire silhouette visible, same camera height, same character scale and same centered placement in every frame.",
    "Pure clean white studio background, polished high-quality anime key animation drawing, crisp stable ink contours, refined cel shading, detailed hair strands and fabric folds.",
    "No text, labels, extra characters, props, background scene, alternate costume, front view, or three-quarter view."
  ].join(" ");

  const saved = [];
  const failures = [];
  let inferenceStarted = false;

  try {
    const sourceResponse = await fetch(workerBaseUrl + "/gallery/" + CHARACTER_SHEET_ID, {
      method: "GET",
      cache: "no-store",
      redirect: "error",
    });
    if (!sourceResponse.ok) {
      return send(res, 502, {
        ok: false, error: "character_reference_unavailable", inferenceStarted: false,
        message: "The approved character sheet could not be retrieved from the existing gallery.",
        upstreamStatus: sourceResponse.status,
      });
    }

    const mimeType = String(sourceResponse.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      return send(res, 502, { ok: false, error: "invalid_character_reference_type", inferenceStarted: false });
    }
    const sourceBytes = Buffer.from(await sourceResponse.arrayBuffer());
    if (!sourceBytes.length || sourceBytes.byteLength > MAX_REFERENCE_IMAGE_BYTES) {
      return send(res, 413, {
        ok: false, error: "character_reference_too_large", inferenceStarted: false,
        referenceBytes: sourceBytes.byteLength,
      });
    }
    const reference = getBase64DataUrl(sourceBytes, mimeType);

    for (const item of poses) {
      inferenceStarted = true;
      const generation = await fetch(workerUrl, {
        method: "POST",
        headers: { ...workerHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "flux-2-klein-4b",
          aspectRatio: "16:9",
          references: [reference],
          prompt: common + " " + item.pose,
        }),
      });
      const generated = await generation.json().catch(() => ({}));
      if (!generation.ok || generated.ok !== true ||
          typeof generated.imageDataUrl !== "string" ||
          !/^data:image\/(?:jpeg|png|webp);base64,/i.test(generated.imageDataUrl)) {
        failures.push({
          key: item.id,
          status: generation.status,
          error: generated.error || "image_generation_failed",
          message: generated.message || "FLUX.2 did not return a valid raster image.",
        });
        break;
      }

      const storedResponse = await fetch(galleryUrl, {
        method: "POST",
        headers: { ...workerHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: generated.imageDataUrl,
          title: item.title,
          prompt: item.pose,
          model: generated.model || "@cf/black-forest-labs/flux-2-klein-4b",
          width: generated.width || 1280,
          height: generated.height || 720,
        }),
      });
      const stored = await storedResponse.json().catch(() => ({}));
      if (!storedResponse.ok || stored.ok !== true || !stored.item?.shareUrl) {
        failures.push({
          key: item.id,
          status: storedResponse.status,
          error: stored.error || "gallery_save_failed",
          message: stored.message || "The generated drawing could not be saved to the gallery.",
          generatedButNotSaved: true,
        });
        break;
      }
      saved.push({
        key: item.id,
        title: item.title,
        galleryId: stored.item.id,
        shareUrl: stored.item.shareUrl,
        model: generated.model,
        width: generated.width || 1280,
        height: generated.height || 720,
      });
    }

    return send(res, failures.length ? 502 : 200, {
      ok: failures.length === 0,
      stage: "four-full-raster-key-drawings",
      inferenceStarted,
      sourceCharacterSheetId: CHARACTER_SHEET_ID,
      model: "@cf/black-forest-labs/flux-2-klein-4b",
      target: { durationSeconds: 1, fps: 24, totalFrames: 24, generatedKeyDrawings: 4 },
      saved,
      failures,
      next: failures.length ? "Resolve the reported provider/gallery error before retrying." : "Visually review all four keys for identity, silhouette, anatomy, costume and foot contacts before generating any inbetweens.",
      inbetweensGenerated: 0,
    });
  } catch (error) {
    return send(res, 502, {
      ok: false,
      error: "raster_keyframe_proof_failed",
      message: String(error?.message || error).slice(0, 500),
      inferenceStarted,
      saved,
      failures,
      inbetweensGenerated: 0,
    });
  }
};
