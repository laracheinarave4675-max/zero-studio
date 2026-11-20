const MODEL = "@cf/black-forest-labs/flux-1-schnell";
const MAX_BODY_BYTES = 8 * 1024;
const MAX_PROMPT_LENGTH = 2048;
const MAX_IMAGE_BASE64_LENGTH = 8 * 1024 * 1024;
const MAX_STEPS = 4;

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

function isQuotaError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return /quota|neuron|daily limit|rate.?limit|too many requests|exceeded.*limit/.test(message);
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
  if (!constantTimeEqual(token, env.STUDIO_ACCESS_TOKEN)) return json({ error: "unauthorized" }, 401, cors);
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
    const metadata = {
      title: typeof input.title === "string" ? input.title.slice(0, 80) : "صورة مولدة",
      model: typeof input.model === "string" ? input.model.slice(0, 80) : MODEL,
      mimeType: mime,
      bytes: Math.floor(parts[1].length * 3 / 4),
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
async function handle(request, env) {
  const url = new URL(request.url);
  if (url.pathname === "/v1/gallery" || url.pathname.startsWith("/gallery/")) return handleGallery(request, env, url);
  if (request.method === "GET" && url.pathname === "/health") {
    return json({
      ok: true,
      provider: "cloudflare-workers-ai",
      model: MODEL,
      aiBindingConfigured: Boolean(env.AI),
      imageEndpointConfigured: Boolean(env.AI && env.STUDIO_ORIGIN && env.STUDIO_ACCESS_TOKEN),
    });
  }

  const configuredOrigin = String(env.STUDIO_ORIGIN || "").trim();
  const requestOrigin = request.headers.get("Origin") || "";

  if (!configuredOrigin || !env.STUDIO_ACCESS_TOKEN || !env.AI) {
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

  const authorization = request.headers.get("Authorization") || "";
  const suppliedToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!constantTimeEqual(suppliedToken, env.STUDIO_ACCESS_TOKEN)) {
    return json({ error: "unauthorized" }, 401, cors);
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json({ error: "content_type_must_be_json" }, 415, cors);
  }

  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return json({ error: "request_too_large" }, 413, cors);
  }

  let raw;
  try {
    raw = await request.text();
  } catch {
    return json({ error: "invalid_request_body" }, 400, cors);
  }
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return json({ error: "request_too_large" }, 413, cors);
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

  const steps = input.steps === undefined ? MAX_STEPS : input.steps;
  if (!Number.isInteger(steps) || steps < 1 || steps > MAX_STEPS) {
    return json({ error: "invalid_steps", message: "Steps must be an integer from 1 to 4." }, 400, cors);
  }

  let seed;
  if (input.seed !== undefined) {
    if (!Number.isInteger(input.seed) || input.seed < 0 || input.seed > 2147483647) {
      return json({ error: "invalid_seed" }, 400, cors);
    }
    seed = input.seed;
  }

  try {
    const result = await env.AI.run(MODEL, {
      prompt,
      steps,
      ...(seed === undefined ? {} : { seed }),
    });

    if (typeof result?.image !== "string" || !result.image || result.image.length > MAX_IMAGE_BASE64_LENGTH) {
      return json({ error: "invalid_provider_response" }, 502, cors);
    }

    return json({
      ok: true,
      provider: "cloudflare-workers-ai",
      model: MODEL,
      mimeType: "image/jpeg",
      imageDataUrl: "data:image/jpeg;base64," + result.image,
      steps,
      seed: seed ?? null,
    }, 200, cors);
  } catch (error) {
    if (isQuotaError(error)) {
      return json({
        error: "free_quota_exhausted",
        message: "The provider rejected this request because its quota or rate limit was reached. No paid fallback was attempted. Keep the job and retry after the quota resets.",
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
