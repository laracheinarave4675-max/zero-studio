# ZERO STUDIO — Image Provider Evaluation (Initial Research)

**Research date:** 2026-11-20  
**Status:** Initial shortlist only. No provider has been selected, connected, or approved for production.  
**Governing architecture:** [New Hybrid Production Direction](NEW_HYBRID_PRODUCTION_DIRECTION.md), decision D-026.

## Evaluation criteria

A candidate must be evaluated on:
- Anime illustration quality at the target style and resolution.
- Reference-image input, multi-turn editing, pose/composition control, and repeatable character identity.
- Transparent output, image editing/masks, supported formats, and asset handling.
- Public API availability and a practical browser/Android workflow.
- Actual per-image cost, input/reference charges, quotas, concurrency, retries, and latency.
- Commercial-use terms, ownership/licensing, privacy, retention, and whether submitted data can be used for model improvement.
- Provider stability and the ability to replace the service through a provider-neutral adapter.

## Initial shortlist

### A. OpenAI GPT Image 2.6 (Sunburst / Flare)

**Why it is a candidate**
- Official Image API supports text-to-image and edits, multiple reference images, multi-turn image editing, transparent backgrounds for supported models, and markup/mask-guided changes.
- The API reference allows up to 16 input images for image editing/reference workflows.
- The documentation includes a reusable-character-reference workflow, but explicitly warns that recurring character consistency can still fail sometimes. It also warns that precise composition/layout control is not guaranteed.
- The API supports SVG generation as an additional output mode, but this is a separate authoring path and should not be mistaken for layered production artwork.

**Cost evidence**
- The official GPT-Image-2.6 cost calculator currently shows an example estimate of $0.02469 for one image at its displayed sample settings (823 output tokens). This is an example, not a universal fixed per-image price; resolution, quality, input references, and prompt tokens change the total.
- At that sample estimate, 24 independently generated images cost about $0.59 per second of animation, $35.55 per minute, and about $711 for 20 minutes, before retries and reference-input costs.

**Limitations / open checks**
- OpenAI's own documentation says recurring character identity may drift and complex prompts can take up to two minutes.
- Confirm current account/API availability, supported countries, payment method, exact usage terms, image storage/retention, and model-specific commercial rights before integration.
- No evidence yet that this model alone can deliver consistent production-ready anime animation frames.

Official sources:
- https://developers.openai.com/api/docs/guides/image-generation
- https://developers.openai.com/api/docs/guides/image-prompting
- https://developers.openai.com/api/reference/resources/images/methods/edit

### B. Google Gemini 3.1 Flash Image (Nano Banana 2)

**Why it is a candidate**
- Google's current pricing/model documentation describes the model as designed for fast, efficient image generation and conversational editing.
- The model description specifically mentions improved multi-turn character consistency, making it relevant to the Character Bible/reference workflow.
- It may fit a workflow that repeatedly edits an approved character or scene using persistent references.

**Cost evidence**
- The official pricing page lists no free tier for this image model.
- Published output estimates: $0.045 per 0.5K image, $0.067 per 1K, $0.101 per 2K, and $0.151 per 4K, plus input tokens.
- At the published 1K rate, 24 images cost about $1.61 per second, $96.48 per minute, and $1,929.60 for 20 minutes, before retries and input costs.
- Google's pricing page states that free-tier content for other eligible Gemini API services may be used to improve products; this image model itself has no free tier. Paid-tier content is marked not used to improve products.

**Limitations / open checks**
- The per-frame price is high for a literal 24-new-images/second workflow.
- Verify image-reference limits, actual multi-turn behavior through the API, quota/concurrency, regional access, data terms, and commercial rights.
- A model's advertised consistency improvement is not a guarantee of exact character identity.

Official source:
- https://ai.google.dev/gemini-api/docs/pricing

### C. Black Forest Labs FLUX 3 Image / FLUX 3 Image Klein

**Why it is a candidate**
- The official BFL pricing page currently lists both text-to-image and image-to-image for FLUX 3 Image.
- FLUX 3 Image Klein is described as an open-weights 5.6B model that runs on a single consumer GPU; this may offer a future self-hosting/fine-tuning route, but not on the user's Android phone without separate cloud GPU infrastructure.
- FLUX.2 Pro is listed with reference-image input. FLUX.1 Kontext Pro is described as supporting iterative edits intended to maintain character consistency across editing turns.
- BFL's direct API and fal's model API marketplace are possible access routes; fal uses prepaid credits and bills successful outputs.

**Cost evidence**
- BFL official list price at 1K: FLUX 3 Image Klein $0.009/image; FLUX 3 Image $0.048/image.
- At the Klein rate: about $0.22 per second, $12.96 per minute, and $259.20 for 20 minutes of 24 distinct frames per second.
- At the FLUX 3 Image rate: about $1.15 per second, $69.12 per minute, and $1,382.40 for 20 minutes.
- These are raw output estimates only; image references, retries, higher resolution, and any provider-specific extras may change the total. FLUX.2 reference inputs are separately priced by megapixel.

**Limitations / open checks**
- Klein's low price does not prove it meets the visual target; a direct anime-art comparison is required.
- Check the exact model's reference-image capabilities (do not assume all FLUX variants have the same controls), commercial terms, output rights, API quota, and regional availability.
- Open weights do not mean free hosted inference. Running a model requires compatible GPU compute, which is not available locally on the user's Android-only workflow.

Official sources:
- https://bfl.ai/pricing
- https://docs.bfl.ai/
- https://fal.ai/docs/documentation/model-apis/pricing

## Cost reality for the 24-drawing target

The 20-minute comparison assumes exactly 28,800 generated images (24 unique moving-art images per second for 1,200 seconds), one image output per drawing, no retries, no discarded candidates, no reference-input costs, and no audio/compositing/hosting costs.

| Candidate and price basis | Approx. 1K output price | 1 second (24 images) | 1 minute | 20 minutes |
|---|---:|---:|---:|---:|
| FLUX 3 Image Klein | $0.009 | $0.22 | $12.96 | $259.20 |
| GPT Image 2.6 sample calculator output | $0.02469 | $0.59 | $35.55 | $711.07 |
| FLUX 3 Image | $0.048 | $1.15 | $69.12 | $1,382.40 |
| Gemini 3.1 Flash Image | $0.067 | $1.61 | $96.48 | $1,929.60 |

These figures are not a recommendation to generate every frame immediately. They expose the scale of the cost if every one of the 24 unique drawings is produced as a separate paid image output. A keyframe/reference-first workflow may cost less, but it must not silently replace the user's independent-drawing target with repeated frames, tween-only animation, or generated video.

## Existing ZERO STUDIO code audit — first findings

- `app/scene-production.mjs` currently calls the Gemini `generateContent` endpoint and asks for structured editable SVG path/layer proposals. It is a text-to-vector proposal pipeline, not a native image-generation integration.
- `app/app.js` exposes that workflow through the Gemini API-key field and approval/rejection controls. The current proposal is converted into editable stroke/path operations and committed to the frame only after user approval.
- `app/anime-background-painter.mjs` is a deterministic procedural path/shape scene painter. It must not remain the assumed route to professional background art.
- Existing Canvas2D raster brushes, raster layers, vector editor, project serialization, timeline, compositor, and approval UI may remain useful. Their actual compatibility with imported/generated raster assets and layered images still needs an explicit dependency audit.
- No provider-neutral native image-generation adapter has yet been identified in this first inspection. Do not claim one exists until the repository has been searched and its request/response lifecycle verified.

## Decision and next experiment

No model is selected yet. The first controlled comparison should use the same:
1. Forest-house background brief, with the user's supplied reference image.
2. Character model-sheet brief, requiring front/side/back, expressions, and a fixed costume/palette.
3. One reference-based edit to test whether the same character remains recognizable while pose and environment change.

Score each output for drawing quality, anatomy, composition, material detail, reference adherence, identity continuity, edit stability, latency, and actual cost. Review the actual images side by side before selecting a provider. Do not begin LoRA training before this test.
