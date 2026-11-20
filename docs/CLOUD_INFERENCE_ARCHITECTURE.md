# ZERO STUDIO — Cloud Inference and Hosting Architecture

**Status:** Research/architecture milestone, 2026-11-20. No cloud account has been connected, no secret has been entered, no provider has been deployed, and no image-generation request has been run.

## Objective

Keep the Android phone as the control, drawing-review, and production-management device. Run heavy image inference on remote compute. Keep the application and project source in GitHub. The studio must not require installing a diffusion model or model weights on the phone.

## Recommended separation of responsibilities

1. **GitHub repository** — source control, issues, pull requests, documentation, and version history. GitHub is not a GPU inference host.
2. **Static app hosting** — serve the ZERO STUDIO PWA from a Git-connected static host. GitHub Pages or Cloudflare Pages are candidates; neither runs diffusion inference.
3. **Inference service** — a replaceable remote adapter calls a hosted model. The first free-tier candidate to test is Cloudflare Workers AI FLUX.1 Schnell; the anime-specialist comparison candidate is a public Hugging Face Anima ZeroGPU Space.
4. **Studio production layer** — preserve original generated files, reference images, provenance, approval state, character bible/model sheets, scene/layer organization, animation timeline, compositing, and export.

Do not conflate static hosting, serverless request handling, and GPU inference: they are separate services with separate quotas and failure modes.

## Candidate 1 — Cloudflare Workers AI (first integration feasibility candidate)

Official documentation currently lists:
- Workers AI included in the Workers Free plan.
- 10,000 Neurons per day free allocation, resetting at 00:00 UTC.
- FLUX.1 Schnell is available as a hosted text-to-image model.
- Current published model rate: 4.8 Neurons per 512×512 tile plus 9.6 Neurons per inference step.
- Requests beyond the free allocation fail on the Free plan; exceeding the allocation requires moving to a paid plan. ZERO STUDIO must never perform that upgrade automatically.

Why test it first:
- It exposes a documented API and can be called from a Cloudflare Worker without exposing the Cloudflare API token in browser JavaScript.
- Its published free allocation is a concrete daily budget rather than a temporary trial.
- It is a general image model, not an anime-specialist guarantee. The visual result must be judged before adoption.

Risks and checks:
- The free allocation is limited and may change; it is not unlimited compute or 24-drawing/second capacity.
- Verify account eligibility, signup/payment-card requirements, region, current API model identifier, image dimensions/step accounting, and current terms before deployment.
- Keep the Cloudflare account on the Free plan. Never configure a paid fallback, paid credits, or an automatic plan upgrade.
- Put the AI binding behind a small Worker endpoint. Keep the API token server-side. Add request authentication, origin restrictions, strict input/output size limits, rate limiting, and a hard daily usage stop. Origin restrictions alone are not authentication.
- If quota is exhausted, return a clear quota-exhausted response and preserve the pending job for later retry.

## Candidate 2 — Hugging Face ZeroGPU Anima Space (anime-quality experiment)

A public Anima ZeroGPU Space was visible as running during this research. Its current README describes a Gradio app using CircleStone Labs Anima and a roughly 5.6 GB base model/text-encoder/VAE download, with additional optional LoRA/upscaler downloads.

Hugging Face currently documents:
- Existing public ZeroGPU Spaces can be used free.
- Free accounts have a 5-minute daily ZeroGPU quota and shared queue priority.
- A qualifying free personal account may host up to two ZeroGPU Spaces, subject to account age, verified email, and good-standing requirements.
- Gradio Spaces expose documented HTTP queue APIs and an OpenAPI schema.

Why keep it as a visual benchmark:
- It is anime-focused, unlike general-purpose FLUX.1 Schnell.
- It can help compare actual anime linework, anatomy, composition, and style.

Limitations:
- The daily GPU quota is too small and variable for continuous production.
- Public Space uptime, API endpoint schema, queue availability, and programmatic access must be checked at test time.
- The Anima model card has a non-commercial restriction; do not use it for commercial production unless the exact model license is reviewed and permits the intended use.
- Do not assume the Space's own Apache-2.0 code license changes the model-weight license.

## Candidates not accepted as production compute

- **Google Colab Free:** interactive notebook compute with dynamic, unguaranteed resource limits and session termination. It is not a stable always-on inference endpoint.
- **Kaggle Notebooks:** free GPU sessions and weekly quotas are useful for experiments/training runs, but notebook sessions are not a production inference API or persistent backend.
- **GitHub Actions:** suitable for tests/builds, not a free always-on GPU inference service.
- **GitHub Pages / Cloudflare Pages:** static hosting only; they do not provide a diffusion GPU.

## Security and Android requirements

- No model weights or diffusion runtime installed on Android.
- Never embed a provider secret in public JavaScript, HTML, source control, or a public repository.
- The Worker must validate requests and return normalized job states; the browser must not receive provider secrets.
- No API key or token is saved to localStorage by default.
- Use explicit user action before any external image is submitted. Show the selected provider, model, quota status, and data-sharing notice.
- Keep jobs resumable: queued, running, succeeded, failed, quota-exhausted, cancelled.
- Preserve the source image, output file, prompt, model/version, seed/settings where available, timestamp, license/provenance metadata, and approval decision.
- Provider-specific response handling must live behind a replaceable adapter.
- Never switch to a paid provider when a free provider is unavailable.

## Animation constraint

The creative target remains **24 independently drawn images per second**. Free inference quotas cannot supply 24 newly generated images every second continuously. Do not claim otherwise, and do not silently replace the target with repeated frames, tween-only motion, or generated video. Remote generation can be used to create and refine approved source artwork and references; the ZERO STUDIO animation department remains responsible for production planning, drawing review, timing, continuity, compositing, and delivery.

## Implementation gates

1. Confirm the exact Cloudflare free account and model/API prerequisites without enabling paid billing.
2. Prototype one image request through a secured Worker and verify the free-tier quota stop.
3. Run a side-by-side visual benchmark: FLUX.1 Schnell versus the anime-focused Anima Space, using the same forest-house scene and character-sheet briefs.
4. Review outputs for anime quality, anatomy, materials, composition, identity consistency, latency, and data/license terms.
5. Only after visual acceptance, integrate the selected provider adapter into ZERO STUDIO.
6. Do not deploy to production or merge PR #6 without explicit user approval.

## Official references

- Cloudflare Workers AI models: https://developers.cloudflare.com/workers-ai/models/
- Cloudflare Workers AI pricing and Neuron quota: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Hugging Face ZeroGPU quota and compatibility: https://huggingface.co/docs/hub/spaces-zerogpu
- Hugging Face Spaces API endpoints: https://huggingface.co/docs/hub/spaces-api-endpoints
- Anima ZeroGPU Space and model setup notes: https://huggingface.co/spaces/ADGNSGNJKS/Anima
- Google Colab resource limits: https://research.google.com/colaboratory/faq.html
- Kaggle notebook GPU notes: https://www.kaggle.com/docs/notebooks
