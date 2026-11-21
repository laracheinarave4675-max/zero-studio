const DEFAULT_MODEL = "@cf/black-forest-labs/flux-1-schnell";
const MODEL_IDS = Object.freeze({
  "flux-1-schnell": DEFAULT_MODEL,
  "flux-2-klein-4b": "@cf/black-forest-labs/flux-2-klein-4b",
});
const IMAGE_PRESETS = Object.freeze({
  "16:9": Object.freeze({ width: 1280, height: 720 }),
  "1:1": Object.freeze({ width: 1024, height: 1024 }),
});
const MAX_BODY_BYTES = 3 * 1024 * 1024;
const MAX_PROMPT_LENGTH = 2600;
const MAX_REFERENCE_COUNT = 4;
const MAX_REFERENCE_IMAGE_BYTES = 512 * 1024;
const MAX_IMAGE_BASE64_LENGTH = 8 * 1024 * 1024;
const MAX_STEPS = 4;
const AUTH_VERIFIER_URL = "https://zero-studio.9test4675a26.workers.dev/v1/images";

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...headers,
    },
  });
}

function corsHeaders(origin) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "authorization, content-type",
    "access-control-max-age": "600",
    vary: "Origin",
  };
}

function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i++) mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return mismatch === 0;
}

function isAllowedOrigin(origin, env) {
  if (!origin) return false;
  if (origin === String(env.STUDIO_ORIGIN || "").trim()) return true;
  return String(env.STUDIO_ALLOWED_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean).includes(origin);
}

async function isAuthorized(request, env) {
  const authorization = request.headers.get("Authorization") || "";
  const suppliedToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!suppliedToken) return false;

  // Use a local secret when configured; the isolated preview Worker delegates
  // credential validation to the existing Worker without triggering inference.
  if (env.STUDIO_ACCESS_TOKEN) {
    return constantTimeEqual(suppliedToken, env.STUDIO_ACCESS_TOKEN);
  }
  if (!env.STUDIO_ORIGIN) return false;

  try {
    const verification = await fetch(AUTH_VERIFIER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authorization,
        "Origin": String(env.STUDIO_ORIGIN).trim(),
      },
      body: JSON.stringify({ prompt: "" }),
    });
    if (verification.status !== 400) return false;
    const payload = await verification.json().catch(() => ({}));
    return payload.error === "invalid_prompt";
  } catch {
    return false;
  }
}

function isQuotaError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return /quota|neuron|daily limit|rate.?limit|too many requests|exceeded.*limit|capacity|resource.?limit/.test(message);
}

function detectImageMime(base64) {
  if (base64.startsWith("iVBOR")) return "image/png";
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

function decodeReferenceImage(dataUrl) {
  if (typeof dataUrl !== "string") throw new Error("invalid_reference_image");
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(dataUrl);
  if (!match) throw new Error("invalid_reference_image");
  const estimatedBytes = Math.floor(match[2].length * 3 / 4);
  if (estimatedBytes < 1 || estimatedBytes > MAX_REFERENCE_IMAGE_BYTES) throw new Error("reference_image_too_large");
  let bytes;
  try { bytes = Uint8Array.from(atob(match[2]), character => character.charCodeAt(0)); }
  catch { throw new Error("invalid_reference_image"); }
  if (!bytes.byteLength || bytes.byteLength > MAX_REFERENCE_IMAGE_BYTES) throw new Error("reference_image_too_large");
  return { mimeType: match[1].toLowerCase(), bytes };
}

async function handleGallery(request, env, url) {
  const requestOrigin = request.headers.get("Origin") || "";
  const cors = corsHeaders(requestOrigin || env.STUDIO_ORIGIN || "*");
  if (!env.GALLERY) return json({ error: "gallery_storage_unavailable" }, 503, cors);
  if (url.pathname.startsWith("/gallery/") && request.method === "GET") {
    const id = url.pathname.slice(9);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "not_found" }, 404);
    const stored = await env.GALLERY.get("gallery:" + id);
    if (!stored) return json({ error: "not_found" }, 404);
    let asset; try { asset = JSON.parse(stored); } catch { return json({ error: "corrupt_asset" }, 500); }
    const parts = String(asset.imageDataUrl || "").split(";base64,");
    const mime = parts[0] && parts[0].startsWith("data:") ? parts[0].slice(5) : "";
    if (!parts[1] || !["image/jpeg", "image/png", "image/webp"].includes(mime)) return json({ error: "corrupt_asset" }, 500);
    const bytes = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));
    return new Response(bytes, { status: 200, headers: { "content-type": mime, "cache-control": "public, max-age=3600, immutable", "content-disposition": "inline", "x-content-type-options": "nosniff" } });
  }
  if (url.pathname !== "/v1/gallery") return json({ error: "not_found" }, 404, cors);
  const origin = String(env.STUDIO_ORIGIN || "").trim();
  if (!isAllowedOrigin(requestOrigin, env)) return json({ error: "origin_not_allowed" }, 403);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!(await isAuthorized(request, env))) return json({ error: "unauthorized" }, 401, cors);
  if (request.method === "GET") {
    const listed = await env.GALLERY.list({ prefix: "gallery:", limit: 100 });
    const items = (listed.keys || []).map(entry => ({ id: entry.name.slice(8), ...(entry.metadata || {}), shareUrl: new URL("/gallery/" + entry.name.slice(8), url.origin).toString() })).sort((a,b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return json({ ok: true, items, truncated: Boolean(listed.list_complete === false) }, 200, cors);
  }
  if (request.method === "POST") {
    let input; try { input = await request.json(); } catch { return json({ error: "invalid_json" }, 400, cors); }
    const data = typeof input.imageDataUrl === "string" ? input.imageDataUrl : "";
    const parts = data.split(";base64,");
    const mime = parts[0] && parts[0].startsWith("data:") ? parts[0].slice(5) : "";
    if (!parts[1] || !["image/jpeg", "image/png", "image/webp"].includes(mime) || data.length > 4 * 1024 * 1024) return json({ error: "invalid_image" }, 400, cors);
    const id = crypto.randomUUID();
    const width = Number.isInteger(input.width) && input.width >= 1 && input.width <= 4096 ? input.width : null;
    const height = Number.isInteger(input.height) && input.height >= 1 && input.height <= 4096 ? input.height : null;
    const metadata = {
      title: typeof input.title === "string" ? input.title.slice(0, 80) : "صورة مولدة",
      model: typeof input.model === "string" ? input.model.slice(0, 80) : DEFAULT_MODEL,
      mimeType: mime,
      bytes: Math.floor(parts[1].length * 3 / 4),
      ...(width && height ? { width, height } : {}),
      createdAt: new Date().toISOString(),
    };
    const storedAsset = {
      imageDataUrl: data,
      ...metadata,
      prompt: typeof input.prompt === "string" ? input.prompt.slice(0, 1800) : "",
    };
    try {
      await env.GALLERY.put("gallery:" + id, JSON.stringify(storedAsset), {
        expirationTtl: 2592000,
        metadata,
      });
    } catch (error) {
      console.error("gallery_write_failed", {
        name: error?.name || "Error",
        message: String(error?.message || error).slice(0, 240),
        imageLength: data.length,
        metadataBytes: new TextEncoder().encode(JSON.stringify(metadata)).byteLength,
      });
      return json({
        error: "gallery_storage_write_failed",
        message: "رفض مخزن الصور كتابة الملف. لم تُسجّل الصورة على أنها محفوظة.",
      }, 502, cors);
    }
    return json({ ok: true, item: { id, ...metadata, shareUrl: new URL("/gallery/" + id, url.origin).toString() }, retentionDays: 30 }, 201, cors);
  }
  return json({ error: "method_not_allowed" }, 405, cors);
}
async function handleAnimeSegmentation(request, env, url) {
  const origin = request.headers.get("Origin") || "";
  const cors = corsHeaders(origin || env.STUDIO_ORIGIN || "*");
  if (request.method === "OPTIONS") {
    if (!isAllowedOrigin(origin, env)) return json({ error: "origin_not_allowed" }, 403);
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405, { ...cors, allow: "POST, OPTIONS" });
  }
  if (!isAllowedOrigin(origin, env)) return json({ error: "origin_not_allowed" }, 403, cors);
  if (!env.GALLERY) return json({ error: "gallery_storage_unavailable" }, 503, cors);
  if (!(await isAuthorized(request, env))) return json({ error: "unauthorized" }, 401, cors);

  let input;
  try { input = await request.json(); }
  catch { return json({ error: "invalid_json" }, 400, cors); }
  const id = String(input?.sourceId || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "invalid_source_id" }, 400, cors);

  const stored = await env.GALLERY.get("gallery:" + id);
  if (!stored) return json({ error: "source_image_not_found" }, 404, cors);
  let asset;
  try { asset = JSON.parse(stored); }
  catch { return json({ error: "corrupt_asset" }, 500, cors); }
  if (!["image/jpeg", "image/png", "image/webp"].includes(String(asset.mimeType || "")) ||
      typeof asset.imageDataUrl !== "string" || asset.imageDataUrl.length > 4 * 1024 * 1024) {
    return json({ error: "invalid_source_asset" }, 400, cors);
  }

  if (String(env.ANIME_SEGMENTATION_FREE_TIER_CONFIRMED || "") !== "true") {
    return json({ error: "free_tier_not_confirmed", message: "يجب تأكيد أن حساب Cloudflare يستخدم خطة Images Free قبل تشغيل أي تحويل." }, 503, cors);
  }

  // Cloudflare Images uses BiRefNet to create a PNG foreground cutout.
  // The Images Free plan includes 5,000 unique transformations/month; after
  // the limit the platform returns an error. Never switch to a paid remover.
  const sourceUrl = new URL("/gallery/" + id, url.origin).toString();
  let transformed;
  try {
    transformed = await fetch(sourceUrl, {
      cf: { image: { segment: "foreground", format: "png" } },
    });
  } catch {
    return json({ error: "segmentation_unavailable", message: "تعذر تشغيل فصل الخلفية المجاني حالياً." }, 502, cors);
  }
  if (!transformed.ok) {
    const detail = await transformed.text().catch(() => "");
    const freeLimit = /9422|transformation.{0,30}limit|limit.{0,30}transformation|exceeded.{0,20}limit/i.test(detail);
    return json({
      error: freeLimit ? "free_transformation_limit_reached" : "segmentation_failed",
      message: freeLimit
        ? "انتهت حصة تحويلات الصور المجانية لهذا الشهر. لم تُفرض رسوم، ولم يتم استخدام بديل مدفوع."
        : "لم يتمكن فصل الخلفية من معالجة هذه الصورة. احتفظ بالصورة الأصلية وجرّب لاحقاً.",
      retryable: !freeLimit && transformed.status >= 500,
    }, freeLimit ? 429 : 502, cors);
  }
  const mime = String(transformed.headers.get("content-type") || "").split(";")[0].toLowerCase();
  if (mime !== "image/png") return json({ error: "invalid_segmentation_output" }, 502, cors);
  const bytes = await transformed.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > 12 * 1024 * 1024) {
    return json({ error: "segmentation_output_too_large" }, 502, cors);
  }
  return new Response(bytes, {
    status: 200,
    headers: {
      ...cors,
      "content-type": "image/png",
      "cache-control": "no-store, max-age=0",
      "content-disposition": "inline",
      "x-content-type-options": "nosniff",
      "x-zero-segmentation": "cloudflare-images-birefnet",
    },
  });
}

async function handle(request, env) {
  const url = new URL(request.url);
  if (url.pathname === "/v1/gallery" || url.pathname.startsWith("/gallery/")) return handleGallery(request, env, url);
  if (url.pathname === "/v1/anime/segment") return handleAnimeSegmentation(request, env, url);
  if (request.method === "GET" && url.pathname === "/health") {
    return json({
      ok: true,
      provider: "cloudflare-workers-ai",
      model: DEFAULT_MODEL,
      aiBindingConfigured: Boolean(env.AI),
      imageEndpointConfigured: Boolean(env.AI && env.STUDIO_ORIGIN),
      authVerifierConfigured: Boolean(env.STUDIO_ACCESS_TOKEN || env.STUDIO_ORIGIN),
    });
  }

  const configuredOrigin = String(env.STUDIO_ORIGIN || "").trim();
  const requestOrigin = request.headers.get("Origin") || "";

  if (!configuredOrigin || !env.AI) {
    return json({ error: "worker_not_configured", message: "Worker configuration is incomplete." }, 503);
  }

  if (!isAllowedOrigin(requestOrigin, env)) {
    return json({ error: "origin_not_allowed" }, 403);
  }

  const cors = corsHeaders(requestOrigin);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== "POST" || url.pathname !== "/v1/images") {
    return json({ error: "not_found" }, 404, cors);
  }

  if (!(await isAuthorized(request, env))) {
    return json({ error: "unauthorized" }, 401, cors);
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json({ error: "content_type_must_be_json" }, 415, cors);
  }

  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return json({ error: "request_too_large", message: "The image request exceeds the Worker 3 MiB payload limit. Remove some reference images or reduce their size." }, 413, cors);
  }

  let raw;
  try {
    raw = await request.text();
  } catch {
    return json({ error: "invalid_request_body" }, 400, cors);
  }
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return json({ error: "request_too_large", message: "The image request exceeds the Worker 3 MiB payload limit. Remove some reference images or reduce their size." }, 413, cors);
  }

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return json({ error: "invalid_json" }, 400, cors);
  }

  const prompt = typeof input?.prompt === "string" ? input.prompt.trim() : "";
  if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
    return json({ error: "invalid_prompt", message: "Prompt must contain 1–2048 characters." }, 400, cors);
  }

  const modelKey = input.model === undefined ? "flux-1-schnell" : input.model;
  const modelId = MODEL_IDS[modelKey];
  if (!modelId) {
    return json({ error: "invalid_model", message: "Choose one of the supported image models." }, 400, cors);
  }

  let outputSize = null;
  if (modelKey === "flux-2-klein-4b") {
    const aspectRatio = input.aspectRatio === undefined ? "16:9" : input.aspectRatio;
    outputSize = IMAGE_PRESETS[aspectRatio];
    if (!outputSize) {
      return json({ error: "invalid_aspect_ratio", message: "Choose 16:9 or 1:1 for FLUX.2 Klein 4B." }, 400, cors);
    }
  } else if (input.aspectRatio !== undefined) {
    return json({ error: "aspect_ratio_requires_flux_2", message: "Explicit aspect ratios are available with FLUX.2 Klein 4B." }, 400, cors);
  }

  let steps = MAX_STEPS;
  if (modelKey === "flux-1-schnell") {
    steps = input.steps === undefined ? MAX_STEPS : input.steps;
    if (!Number.isInteger(steps) || steps < 1 || steps > MAX_STEPS) {
      return json({ error: "invalid_steps", message: "Steps must be an integer from 1 to 4." }, 400, cors);
    }
  } else if (input.steps !== undefined && input.steps !== MAX_STEPS) {
    return json({ error: "invalid_steps", message: "FLUX.2 Klein 4B uses a fixed four-step process." }, 400, cors);
  }

  let references = [];
  if (input.references !== undefined) {
    if (modelKey !== "flux-2-klein-4b") {
      return json({ error: "references_require_flux_2", message: "Character reference images require FLUX.2 Klein 4B." }, 400, cors);
    }
    if (!Array.isArray(input.references) || input.references.length > MAX_REFERENCE_COUNT) {
      return json({ error: "invalid_references", message: "Provide no more than four reference images." }, 400, cors);
    }
    try {
      references = input.references.map(decodeReferenceImage);
    } catch (error) {
      const tooLarge = error?.message === "reference_image_too_large";
      return json({
        error: tooLarge ? "reference_image_too_large" : "invalid_reference_image",
        message: tooLarge ? "Each reference image must be no larger than 512 KB." : "A reference image must be a valid PNG, JPEG, or WebP data URL.",
      }, 400, cors);
    }
    const totalReferenceBytes = references.reduce((sum, reference) => sum + reference.bytes.byteLength, 0);
    if (totalReferenceBytes > MAX_REFERENCE_COUNT * MAX_REFERENCE_IMAGE_BYTES) {
      return json({ error: "reference_images_too_large", message: "The combined reference image payload is too large." }, 413, cors);
    }
  }

  const allowedReferenceRoles = new Set(["identity", "pose", "continuity"]);
  let referenceRoles = references.map(() => "identity");
  if (input.referenceRoles !== undefined) {
    if (!Array.isArray(input.referenceRoles) ||
        input.referenceRoles.length !== references.length ||
        input.referenceRoles.some((role, index) =>
          !allowedReferenceRoles.has(role) || (index === 0 && role !== "identity"))) {
      return json({ error: "invalid_reference_roles", message: "Reference roles must match the image list and start with identity." }, 400, cors);
    }
    referenceRoles = input.referenceRoles;
  }

  let seed;
  if (input.seed !== undefined) {
    if (!Number.isInteger(input.seed) || input.seed < 0 || input.seed > 2147483647) {
      return json({ error: "invalid_seed" }, 400, cors);
    }
    seed = input.seed;
  }

  try {
    let result;
    if (modelKey === "flux-2-klein-4b") {
      const form = new FormData();
      const identityImages = referenceRoles
        .map((role, index) => role === "identity" ? index : -1)
        .filter(index => index >= 0);
      const poseImages = referenceRoles
        .map((role, index) => role === "pose" ? index : -1)
        .filter(index => index >= 0);
      const continuityImages = referenceRoles
        .map((role, index) => role === "continuity" ? index : -1)
        .filter(index => index >= 0);
      const roleInstructions = [
        identityImages.length
          ? "Identity authority images: " + identityImages.join(", ") + ". They define face, eye design, hair, costume, palette, accessories and body proportions. Preserve these exactly."
          : "",
        poseImages.length
          ? "Pose-only images: " + poseImages.join(", ") + ". Use them only for body pose, silhouette, timing and limb placement. Do not copy their character design."
          : "",
        continuityImages.length
          ? "Motion-continuity images: " + continuityImages.join(", ") + ". Use them only for temporal continuity and the immediately preceding action. Redraw the character fully."
          : ""
      ].filter(Boolean).join(" ");
      const conditionedPrompt = references.length
        ? roleInstructions + " User direction: " + prompt
        : prompt;
      form.append("prompt", conditionedPrompt);
      form.append("width", String(outputSize.width));
      form.append("height", String(outputSize.height));
      if (seed !== undefined) form.append("seed", String(seed));
      references.forEach((reference, index) => {
        const extension = reference.mimeType === "image/png" ? "png" : reference.mimeType === "image/webp" ? "webp" : "jpg";
        form.append("input_image_" + index, new Blob([reference.bytes], { type: reference.mimeType }), "character-reference-" + index + "." + extension);
      });

      // FLUX.2 Klein requires multipart input. Response serializes FormData
      // and supplies the boundary in the Content-Type header.
      const multipartResponse = new Response(form);
      result = await env.AI.run(modelId, {
        multipart: {
          body: multipartResponse.body,
          contentType: multipartResponse.headers.get("content-type"),
        },
      });
    } else {
      result = await env.AI.run(modelId, {
        prompt,
        steps,
        ...(seed === undefined ? {} : { seed }),
      });
    }

    if (typeof result?.image !== "string" || !result.image || result.image.length > MAX_IMAGE_BASE64_LENGTH) {
      return json({ error: "invalid_provider_response" }, 502, cors);
    }

    const mimeType = detectImageMime(result.image);
    return json({
      ok: true,
      provider: "cloudflare-workers-ai",
      model: modelId,
      mimeType,
      imageDataUrl: "data:" + mimeType + ";base64," + result.image,
      steps,
      seed: seed ?? null,
      ...(outputSize ? { width: outputSize.width, height: outputSize.height, aspectRatio: input.aspectRatio === undefined ? "16:9" : input.aspectRatio } : {}),
      referenceCount: references.length,
    }, 200, cors);
  } catch (error) {
    if (isQuotaError(error)) {
      return json({
        error: "free_quota_exhausted",
        message: "The provider rejected this request because its free quota, neuron limit, or capacity was reached. No paid fallback or alternate model was attempted.",
        retryable: true,
      }, 429, cors);
    }
    return json({
      error: "inference_failed",
      message: "The image provider could not complete this request. No alternate or paid provider was called.",
      retryable: true,
    }, 502, cors);
  }
}

export default {
  fetch(request, env) {
    return handle(request, env);
  },
};

export { handle as handleWorkerRequest };
