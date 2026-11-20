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
    "access-control-allow-methods": "POST, OPTIONS",
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

function isQuotaError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return /quota|neuron|daily limit|rate.?limit|too many requests|exceeded.*limit/.test(message);
}

async function handle(request, env) {
  const url = new URL(request.url);
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

  if (requestOrigin !== configuredOrigin) {
    return json({ error: "origin_not_allowed" }, 403);
  }

  const cors = corsHeaders(configuredOrigin);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/health") {
    return json({ ok: true, provider: "cloudflare-workers-ai", model: MODEL }, 200, cors);
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
