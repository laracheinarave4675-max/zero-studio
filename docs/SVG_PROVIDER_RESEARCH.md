# ZERO STUDIO — Free SVG production research

Research date: 2026-11-18  
Purpose: find a legal, genuinely free or free-to-test source of editable SVG artwork and a scalable way to feed the 24-independent-drawings-per-second animation engine.

## First principle: SVG is the drawing output, not a video

ZERO STUDIO does not need a raster image that is later traced. An LLM can write SVG path data or the studio's structured drawing JSON directly; a dedicated SVG model can also emit native SVG. The accepted output must be editable vector geometry and must pass the local path validator. Do not use image/video generation followed by automatic tracing as a shortcut.

The 24-drawing target is unchanged:
- 10 seconds = 240 full-scene vector drawings.
- 1 minute = 1,440 drawings.
- 20 minutes = 28,800 drawings.

With the current six-frame batch default, this means 40 model calls for 10 seconds, 240 calls for one minute, and 4,800 calls for a 20-minute episode if one API call is used for each batch. This is the central cost problem; it is not solved merely by switching from Gemini to another provider.

## Findings

### 1. OmniSVG on Hugging Face — strongest dedicated SVG experiment

Links:
- Space: https://huggingface.co/spaces/OmniSVG/OmniSVG-3B
- Model and project: https://huggingface.co/OmniSVG/OmniSVG
- Code: https://github.com/OmniSVG/OmniSVG

OmniSVG is specifically trained to produce native SVG illustrations from text, and its project describes results ranging from icons to detailed anime characters. The model repository identifies an Apache-2.0 model license. It offers text-to-SVG directly; avoid its optional image-to-SVG mode for ZERO STUDIO.

The hosted Space's current source-code quota warning states 300 seconds of GPU time per free user per day and roughly 20–60 seconds per generation, recommending one candidate and a 512-token maximum to preserve quota. That is approximately 5–15 generations per day at the stated timings, not thousands. The exact quota and Space availability may change.

The model card reports an 8.49 GB download for OmniSVG-3B and about 17 GB GPU memory for inference. That is not a practical local install on the current Android phone; the hosted demo is the relevant way to test it.

**Best use:** make a few high-value vector assets (a car design, a storefront, a tree, a character, or a background element) and assess whether the SVG is genuinely editable and visually useful.  
**Not suitable:** ask it to generate each of the 240 frames separately; the daily quota is far too small.

### 2. OpenRouter free models — practical general-purpose API experiment

Links:
- Free models: https://openrouter.ai/collections/free-models
- Pricing and limits: https://openrouter.ai/pricing
- API documentation: https://openrouter.ai/docs

OpenRouter currently lists free model variants with zero token price and offers an `openrouter/free` router that chooses from available free models. Its published free-account allowance is 20 requests per minute and 50 requests per day. Free variants ending in `:free` are subject to these limits; failed attempts count against the daily cap. The 1,000-request daily limit requires purchasing at least $10 of credits and is therefore not a zero-cost solution.

At the current six-frame batch size, 40 calls for the 10-second street scene would consume 80% of the daily allowance before retries or other tests. A one-minute scene needs 240 calls and does not fit.

**Best use:** compare one or two models for scene planning, vector object descriptions, or a compact drawing-program response. Do not use one request per drawing as the production strategy.

Free model availability, context windows, and output limits can change. The router may choose different models over time, so pin a model when reproducibility matters and keep the output validator in front of project import.

### 3. Groq — promising structured JSON, but do not assume unlimited free use

Links:
- Rate limits: https://console.groq.com/docs/rate-limits
- Structured outputs: https://console.groq.com/docs/structured-outputs
- Model list: https://console.groq.com/docs/models

Groq documents strict JSON-schema output for selected models, including GPT-OSS 20B/120B and Qwen 3.8 27B in its current supported list. This could make production batches more reliable because the result can be required to match the .zbatch structure before the engine sees it.

However, the public rate-limit table labels its displayed model limits as Developer-plan limits; exact free-plan limits are shown in the account console and vary by model and organization. This research does not establish a guaranteed, unlimited free allotment.

**Best use:** a controlled comparison test if the free account dashboard shows enough output-token allowance. Keep it as a candidate, not as a promised free production backend.

### 4. Gemini API — still a useful free test tier, not unlimited

Links:
- Pricing: https://ai.google.dev/gemini-api/docs/pricing
- Rate limits: https://ai.google.dev/gemini-api/docs/rate-limits

Google currently offers a free tier for selected models with free input and output tokens, but request-per-minute, token-per-minute, and requests-per-day limits apply per project and vary by model. Free-tier content may be used to improve Google's products. Exact limits should be checked in AI Studio for the actual project and model.

**Best use:** a limited prototype if a suitable model and free quota are available. It must be compared against alternatives; do not assume an API key means unlimited use.

### 5. Cerebras — one-time test credit, not recurring free production

Link: https://www.cerebras.ai/pricing

Its current pricing page describes a promotional $5 credit after account creation and adding a valid payment method. The credit expires 30 days after activation; the page says users are not automatically charged or enrolled in paid usage, and service pauses when the credit is exhausted or expires unless paid credits are purchased.

**Best use:** optional short performance experiment only if the payment-method requirement is acceptable. It is not a renewable free solution.

### 6. Local Android inference with llama.cpp — no API quota, but device-bound

Link: https://github.com/ggml-org/llama.cpp/blob/master/docs/android.md

The official llama.cpp Android guide documents building and running on Android through Termux without root. A compact quantized language model could generate scene plans or structured vector drawing instructions locally. This avoids per-request cloud charges and daily API request caps, but consumes phone RAM, CPU, battery, and storage. Speed and output quality on the user's exact phone must be measured before depending on it.

A compact local text/code model is not the same thing as OmniSVG: do not claim it has equivalent specialist illustration quality. It is more promising as a scene-planning and drawing-program author than as an autonomous anime illustrator.

### 7. Research projects worth borrowing from, not dropping into production yet

- **StructSVG** (https://github.com/sealost/StructSVG) describes a multi-role pipeline that plans object parts and their spatial relationships, drafts component-aligned SVG, then refines and checks the result. It specifically targets structured, editable, animation-ready vectors with stable IDs. Its published runtime uses an OpenRouter-compatible model endpoint; the repository currently has no declared license in its GitHub metadata and describes itself as a research prototype. Study the architecture, but do not import its code into ZERO STUDIO until its license and stability are clear.
- **LLM4SVG** (https://github.com/ximinng/LLM4SVG) publishes code and SVG datasets under an MIT project license, but its README still says the pretrained-weight link is pending. Its research/training setup is not an Android-ready, free inference service.

### 8. Hugging Face Inference Providers are not a standing free allowance

Current official pricing documentation lists no included monthly inference credits for Free users. Do not confuse older cached pricing pages or the free model demos with a guaranteed, unlimited free API allowance.

## Recommendation for ZERO STUDIO

The most promising free-first direction is a **two-stage drawing system**, to be tested rather than silently adopted:

1. Use a capable model (dedicated SVG model such as OmniSVG for selected assets, or a general LLM for structured planning) to interpret the scene and author a scene-specific vector drawing specification. This may include the street layout, buildings, individual vehicle designs, layer order, object identities, and movement rules.
2. Let ZERO STUDIO's local vector drawing engine execute that scene-specific specification to create and save every required frame as a separate complete SVG/vector drawing document. For example, the road, buildings, cars, wheels, shadows, and other visible objects must be represented in each frame. Their vector geometry is recalculated at that frame's timestamp; no raster frames, SVG `<animate>` elements, static-image tricks, or merely tweened still images are allowed.
3. Validate all 240 frame documents, measure unique visible geometry, and compare the result with the strict 24-drawings-per-second acceptance test. If this approach does not produce coherent full-scene drawings or compromises the artistic requirement, reject it and revise the design.

This approach aims to spend the model's scarce free quota on the creative design work rather than asking it to repeat thousands of similar formatting and geometry calculations. It does **not** lower the 24-drawing target, and it is not yet implemented or artistically proven.

## Next work, in order

- [ ] Test the OmniSVG hosted Space with one carefully written street/car or anime-character brief; inspect and save its raw SVG output.
- [ ] Check whether the resulting SVG can be safely converted into ZERO STUDIO's editable layer/path model without rasterization or loss of important geometry.
- [ ] Test one OpenRouter free text model against the same scene brief and score its SVG/path quality, JSON validity, token length, latency, and actual daily limits.
- [ ] Check Groq's current Free Plan limits in the account console before spending time on an integration.
- [ ] Prototype a scene-specific vector drawing specification and local frame compiler only if it can emit 240 separate complete frame documents with unique geometry and pass the cadence audit.
- [ ] Benchmark the workflow on the actual Android phone, including memory, storage, battery, and generation speed.
- [ ] Select a provider only after these measurements. Do not enter or transmit an API key until the provider, quota, privacy terms, and integration path are understood.

## Important distinction

A free website that produces a few SVG illustrations is not the same as an unlimited API capable of producing 28,800 full-scene vector drawings. No provider found in this research offers a verified, unlimited, free hosted allowance for that workload. The viable route is likely a combination of occasional AI-authored vector design, local generation of separate frame geometry, and carefully rationed free model calls.


## 2026-11-19 — OmniSVG hosted vector test and commercial vector comparison

- Official OmniSVG project documentation describes a multimodal model for native editable SVG with text-to-SVG, image-to-SVG, and character-reference SVG modes; it specifically demonstrates complex SVG and anime-character use cases: https://omnisvg.github.io/ and https://github.com/OmniSVG/OmniSVG.
- The official OmniSVG-3B Hugging Face Space's own UI source warns that free users have **300 GPU seconds/day** and a generation uses approximately **20–60 seconds**. The current hosted UI's model selector exposes **8B** and **4B**; the 4B model is listed at 17 GB GPU memory in the upstream repository. This is a small candidate budget, not a scalable animation provider. The experiment uses one candidate and a 512-token cap for each of three still backgrounds. Sources: https://huggingface.co/spaces/OmniSVG/OmniSVG-3B and https://github.com/OmniSVG/OmniSVG.
- Commercial comparison: Recraft's official site says the free account offers up to 30 generations/day with SVG export, and its vector models are available on Free. This is worth a separate quality experiment if the user wants to sign in to Recraft, but it is not yet integrated into ZERO STUDIO. Sources: https://www.recraft.ai/ai-vector-generator and https://www.recraft.ai/ai-models/recraft.
- Ideogram Vector 1.0 is native SVG, but its official API pricing is per result ($0.13–$0.20 for text-to-SVG; reference-image generation can cost more), and API calls require prepaid credits; therefore it does not meet the current free-first target. Sources: https://ideogram.ai/pricing/?plan=pro and https://ideogram.ai/features/faq/.
- **OmniSVG 4B experiment (2026-11-19):** the hosted Space accepted the prompt and returned one SVG, but it contained only 12 paths and rendered as a generic face/icon rather than the requested convenience-store environment. The next call was rejected with `180s requested vs. 113s left`; the Space reported that the free quota would reset in approximately 24 hours. This is not viable for our current detailed-background workflow. Do not spend more of today's Space quota on additional background prompts.
- **Important quality limitation:** native SVG output alone does not prove that a provider can produce painterly, high-detail anime environments. Every candidate must be rendered, visually inspected, and compared with the three user references before adoption.

## 2026-11-19 — Gemini 3.8 Flash candidate

- Google's current Gemini API pricing/model documentation lists gemini-3.8-flash with free-tier input and output, and describes it as the most intelligent Flash model for complex agentic workflows. Its published output limit is 64K tokens. Sources: https://ai.google.dev/gemini-api/docs/pricing/ and https://ai.google.dev/gemini-api/docs/models.
- This is a stronger candidate for detailed vector layer authoring than Gemini 3 Flash Preview or Flash-Lite. It is now allowlisted in the ZERO STUDIO scene and animation adapters, with a bounded 16K-token per-layer test budget. Actual project access, RPM/RPD, and visual quality remain to be verified by the isolated 2-pass rural-ramen scene test. Free-tier availability in public pricing does not guarantee a specific quota for this user's project.
