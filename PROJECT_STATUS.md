# ZERO STUDIO — Project Status

Last updated: 2026-11-19 (UTC)

## Approved cinematic anime art direction and new visual-review workflow — 2026-11-19

- The user approved the 2D-first cinematic anime target with selective 3D support. Final artwork must read as richly painted 2D anime, not low-poly 3D, flat clip-art, or generic geometric illustration.
- The user approved the standard anime production split: a fixed-camera background is painted once as a layered editable vector asset; characters and all moving foreground elements are independently redrawn at 24 unique drawings per second. Every visible timepoint is the composite of the approved static background plus that timestamp's new moving artwork. Reused background pixels/paths do not count as new animated drawings. Moving elements may not be replaced with raster transforms, duplicated frames, video, or tween-only motion.
- The user approved a visual critique-and-revision workflow. SVG is rasterized only into a temporary preview; a vision-capable reviewer receives the actual preview, critiques composition/perspective/architecture/foliage/materials/light/atmosphere/linework, and returns corrections that are fed back into the editable vector artist. Raster previews are not final artwork.
- Raster texture layers in final artwork are deferred. The current milestone remains vector-first with gradients, patterns, organic paths and bounded SVG effects.
- Durable decisions recorded in D-018, D-019 and D-020 in DECISIONS.md. The art-direction bible is docs/ANIME_ART_DIRECTION.md.
- The existing 2D local painter in app/anime-background-painter.mjs can render three distinct editable scene studies (urban store, rural ramen shop, forest house) with multiple layers and detailed organic vector marks. It is a procedural prototype with authored scene layouts, not yet a fully general scene-understanding painter and not proof of reference-level quality.
- app/scene-production.mjs now includes a vision-review adapter that sends an actual PNG preview to Gemini and validates a structured critique. The 2D artist accepts critique-guided revision instructions on its layout and layer prompts. It validates path geometry during generation and retries invalid layers with exact coordinate feedback; sky and distant-background layers have a wider clipped bleed allowance than foreground geometry.
- app/app.js now creates a temporary PNG preview from the seven editable SVG layers, sends it to the visual reviewer, and performs one corrective redraw when needed. It presents the score and leading critique points before the user approves the proposed vector layers. This preview is inspection-only and does not enter the final project as raster art.
- The PWA shell cache is now v30 so Android devices fetch the revised artist and review logic.
- scripts/run-gemini-2d-anime-tests.mjs now runs three separate Gemini 2D scene briefs, renders temporary previews, performs up to three critique/revision passes, and exports editable .zero projects, SVGs, PNG review previews, and critique reports. .github/workflows/cinematic-scene-artist.yml runs this test and installs @resvg/resvg-js only in CI.
- A stale fixture in tests/anime-vector-artist.test.mjs was corrected so the layout-repair test recognizes the actual repair prompt. New tests cover image-preview transmission, critique validation, and critique-guided redraw prompts.
- **Not yet verified at this update:** the new GitHub Actions run, whether Gemini 3.5 Flash Lite accepts image inputs in this project/region, the three generated scenes' visual quality, and whether critique-guided revisions improve the images. Do not report the artist as reaching the target until the generated previews are actually inspected.
- **Still pending:** implement the static-background plus independently drawn moving-layer contract in app/animation-production.mjs and the batch importer; connect vision review to the interactive Android artist workflow; visually inspect all three real Gemini outputs; refine the 2D painter based on the actual defects; and verify physical Android performance.

## Artistic validation findings and alternate native-SVG model tests — 2026-11-19

- The full automated test suite now passes **180 tests, 0 failures** on commit `cc9273b3fe05fb290463787f110821d60430660a`.
- The three deterministic local 2D scene studies were rendered and visually inspected at 1280×720. They contain 1,102 paths (urban store), 1,284 (rural ramen), and 2,319 (forest house), but they still look too geometric/cartoon-like and are **not artistically accepted**. Path count is not the target.
- The first real Gemini-generated 2D urban-store draft was visually scored **2/10** by the vision reviewer and marked not convincingly 2D anime. Its first revision response was malformed JSON, so the run stopped before saving a final scene. The failure motivated compact-JSON recovery, per-pass artifact checkpoints, slower request pacing, and a second revision attempt. The old run's artifacts did not preserve that draft; new runs checkpoint every pass.
- A new native-SVG alternative test uses the official OmniSVG Hugging Face Space. Its app advertises 300 GPU seconds/day for free users and approximately 20–60 seconds per generation; the hosted UI currently offers 4B and 8B model variants. The experiment selects 4B, one candidate, 512 max tokens, and tests three reference-matched scene descriptions. The hosted model is a candidate only; it has not yet passed the visual review. Official references: https://huggingface.co/spaces/OmniSVG/OmniSVG-3B and https://github.com/OmniSVG/OmniSVG.
- OmniSVG 4B was tested on the hosted Space. It generated only one 12-path SVG for the urban-store prompt; visual inspection showed a generic face/icon rather than a store scene. The next request was blocked by the free Space quota (`180s requested vs. 113s left`, retry in about 24 hours). **Reject OmniSVG-3B Space as the current environment-background artist**; it may remain a future candidate for simple character/icon assets, not detailed anime backgrounds.
- Gemini 3 Flash was initially called with an invalid model ID (`gemini-3-flash`); the official API ID is `gemini-3-flash-preview`. A subsequent request produced out-of-frame path geometry, so the artist now validates path coordinates inside its retry loop and sends exact coordinate errors back to the model for correction. A two-pass test uses Gemini 3 Flash Preview for the first draft and Gemini 3.5 Flash Lite for the critique-guided revision to respect the separate model quotas.
- Gemini 3.8 Flash (`gemini-3.8-flash`) is now supported by the scene and animation adapters. An isolated two-pass rural-ramen background test is running with a 16K-token per-layer budget, low thinking level, and 180-second request timeout. Its first medium-thinking attempt timed out at 120 seconds; the current low-thinking retry is intended to reduce latency. Public Google documentation lists a free tier and a 64K output limit, but the user's actual project quota and visual quality remain unverified.
- The latest Gemini 2D artist run, Gemini 3 Flash Preview test, and Gemini 3.8 Flash test are under validation; do not call any successful until artifacts are downloaded and visually inspected.

## High-volume frame production infrastructure — 2026-11-18

- Current tested branch commit: `4159c4cdc04e4d2ad91680899e1fbbc0fef05177`; the public Vercel release snapshot includes `animation-worker.mjs` and the large-frame workspace.
- GitHub Actions runs #852 and #853 passed on the provider-research documentation update; the suite reports 141 tests passed and 0 failures, including syntax checks for the production, frame-history, and provider-neutral worker modules. Run #853: https://github.com/laracheinarave4675-max/zero-studio/actions/runs/44310880876.
- Raised the structural project ceiling from 600 to 30,000 frames (20 minutes 50 seconds at 24 drawings/second).
- Reworked the timeline to render only 24 thumbnails at a time, with page navigation and direct frame-number jumping.
- Added a provider-independent animation plan. A 10-second shot is exactly 240 independently drawn frames; default six-frame batches produce 40 ordered batches.
- Added strict `.zbatch` import validation: job identity, next batch order, exact frame indexes/timestamps, consistent layer names/order, 2–12 editable vector layers, path safety, and duplicate full-frame drawing rejection.
- Accepted batches become actual editable SVG frame/layer/operation documents. Progress and compact frame signatures persist in the `.zero` project.
- Added lightweight frame-scoped undo/redo for projects above 600 frames; it stores only the affected frame plus production progress rather than serializing the entire project for each edit.
- Added `docs/ANIMATION_PRODUCTION.md` and automated tests for planning, batch integrity, continuity structure, uniqueness, save/open persistence, high-volume frame capacity, and large-project undo/redo.
- Added `app/animation-worker.mjs`: a provider-neutral sequential batch runner with bounded retries, cancellation, continuity handoff, and post-commit checkpoint callbacks. It is tested with deterministic mock providers but has no live AI service attached yet. The worker now avoids regenerating a batch if its checkpoint callback fails after the batch has already been committed.
- **Not yet implemented:** a live provider adapter, provider-specific quota policy, UI-driven automatic production, IndexedDB-backed paged storage, and large-project memory/performance tuning. The user explicitly deferred provider/API selection and quota analysis.
- Continuity note handoff now travels from each accepted batch into the next batch's instructions; the stored note is preserved when the .zero project is reopened.
- Latest public deployment: `dpl_7PPydR428pifMUv8qt2Yyx2hg6zA` reached READY and the stable alias `https://zero-studio-three.vercel.app/` was assigned. Its file manifest contains the 15 expected app modules under `src/`, including `animation-production.mjs`, `animation-worker.mjs`, and `frame-history.mjs`. It is a manual static snapshot of the private development branch.
- **Not yet verified:** an actual 240-frame street scene, real provider-generated drawings, artistic quality, physical Android performance, large-file save/export behavior. A prepared plan or exported prompt is not a completed animation.

## Free native-SVG provider research — 2026-11-18

- Added `docs/SVG_PROVIDER_RESEARCH.md` with current evidence and a staged free-first recommendation.
- Strongest dedicated SVG test candidate: OmniSVG's Hugging Face Space, which emits native SVG from text. Its hosted Space source currently states 300 GPU-seconds/day and approximately 20–60 seconds per generation, making it suitable for a few vector assets or quality tests, not thousands of frames. Local OmniSVG-3B inference is reported at 8.49 GB model size and about 17 GB GPU memory; this is not a practical install on the Android phone.
- OpenRouter free variants currently have 20 requests/minute and 50 requests/day on a free account. At six frames per batch, this is not enough for a one-minute 24-drawing/second shot (240 calls); a ten-second shot takes 40 calls before retries.
- Groq offers strict JSON-schema output for selected models, but the public table's displayed numeric limits are Developer-plan figures; exact free-plan limits must be checked in the account console.
- Cerebras' current $5 promotion is a one-time credit requiring a valid payment method and expiring after 30 days; not a recurring free backend. Hugging Face Inference Providers currently list no monthly credits for Free accounts.
- Local `llama.cpp` via Termux is a possible no-API-quota path for compact text/code models, but exact Android performance has not been measured.
- **Research conclusion:** no verified unlimited free hosted service was found for 28,800 full-scene SVG drawings. The recommended experiment is occasional AI-authored vector design plus a local scene-specific vector compiler that still emits and validates a separate complete SVG frame document at every timestamp. This is only a proposal to test; it does not reduce the 24-unique-drawings/second requirement and cannot be accepted until a 240-frame prototype passes the cadence and art-quality checks.
- **Next tasks:** test OmniSVG SVG output and import conversion; compare one OpenRouter free model and Groq structured output for drawing-plan quality; then prototype a scene-specific vector compiler and benchmark on Android. No new provider is connected, no API key was used, and no service has been selected.

## Latest AI scene-artist implementation and validation

- Development branch head: `48fa33310424161e86cd236356f57fd25dfa9243`.
- GitHub Actions run #733 passed 117 tests, 0 failures, including syntax checks for `app/scene-production.mjs` and `app/sw.js`: https://github.com/laracheinarave4675-max/zero-studio/actions/runs/44261612590.
- The AI scene artist now requests 2–12 named editable layers and at most 300 vector paths, validates the response, previews the complete proposal, and inserts separate project layers only after approval.
- Service-worker cache version: `zero-studio-shell-v24`.
- Public test deployment: `dpl_5axvQDbxf4okLnoZ8Jpe7HNpnMyd` reached READY; stable alias `https://zero-studio-three.vercel.app/`. Deployment manifest includes `src/scene-production.mjs`, updated `src/app.js`, `src/index.html`, and `src/sw.js`. This remains a manual static snapshot, not automatic Git synchronization.
- Not yet verified: real Gemini API response, Android browser/touch behavior, artistic quality, and scene-to-scene character continuity.

## Updated production direction — 2026-11-18

The AI is intended to act as the scene artist: interpret a natural-language scene brief, plan the composition, divide the artwork into meaningful editable layers, and draw those layers as validated SVG paths. Starter background/character presets are aids only, not the creative boundary. The user should not need to understand technical implementation or coordinate separate tools. Continue autonomously on the agreed goals, explain in plain Arabic, and record progress/limitations here. This direction does not relax the no-raster-generation rule or the target of 24 independent drawings per second.

## Scene artist visual-quality upgrade — 2026-11-18

- Updated `app/scene-production.mjs` with a new cinematic environment-art direction brief: camera/horizon/vanishing points, five depth zones, atmospheric perspective, grounded object placement, consistent sun direction, cast/contact shadows, ambient occlusion, bounce light, reflections, and material-specific treatment for plaster, wood, tile, glass, metal, asphalt, concrete, soil, foliage, and fabric.
- Added explicit composition and style constraints to discourage flat clip-art, repeated oval foliage, primitive-only architecture, and uniform heavy outlines. The target is premium anime background painting with a strong vector-based 2.5D illusion.
- Kept the no-raster rule and 2–12 editable layers / 300-path safety ceiling. This is a stronger prompt, not a true 3D renderer and not proof of professional-quality output.
- Added a regression test that inspects the actual prompt sent to Gemini for required depth, lighting, and material instructions. GitHub Actions now runs this scene-artist test whenever the scene prompt or test changes.
- Added `scripts/run-gemini-scene-artist-test.mjs` and a workflow to request one complete editable countryside ramen-shop scene, export both `.zero` and SVG, and upload the result for visual review. The run was blocked by Gemini 503 high-demand responses; this is a provider-side failure, not a successful art-quality test.
- The provider adapter now supports explicit selection among the configured Gemini models, permits scene briefs up to 2,000 characters, and retries temporary 502/503/504 responses up to three attempts. The real scene test currently targets Gemini 3.5 Flash Lite.
- Regression validation passed: GitHub Actions run #? completed the full Node suite with 145 tests passed, 0 failed, including the scene prompt checks. The separate real scene-generation workflow was executed repeatedly but Gemini returned temporary 503 high-demand responses on the supported Flash Lite model; no new scene artifact was produced. Do not mark visual quality as solved until a real generated SVG is available and reviewed against the user's references.
- Known limitation: Gemini receives text instructions only; the uploaded reference images are not supplied to the provider. True 3D meshes, physically based materials, and a 3D lighting pipeline are not implemented.

## Semantic 3D environment artist milestone — 2026-11-18

- Added `app/mesh-scene-renderer.mjs`: a pure JavaScript 3D mesh builder/projector that creates architecture, gabled roof planes, windows, road, trees, utility poles and vehicles, computes per-face directional lighting, and exports the visible faces as editable SVG path operations. No raster image/video model is used.
- Added `generateMeshEnvironmentProposal` in `app/scene-production.mjs`: Gemini now designs a compact semantic 3D scene blueprint (camera, world dimensions, materials, windows, trees, poles, vehicle, sun) instead of trying to write hundreds of SVG paths itself. The local renderer materializes the blueprint.
- The successful real Gemini run #44339821992 used Gemini 3.5 Flash Lite and produced a 5-layer editable scene with 632 vector paths. Artifact: `zero-studio-cinematic-scene-artist-test`, artifact ID `14441559866`, expires 2026-12-02. It contains `cinematic-ramen-shop.svg` and `cinematic-ramen-shop.zero`.
- A separate deterministic 3D mesh showcase is also included in that artifact. The AI scene and the hand-authored showcase are clearly distinguished in their reports.
- The current mesh renderer has a 2,800-path still-scene limit. The older 2.5D renderer remains available for comparison. The 3D renderer is still a low-poly/stylized prototype, not reference-quality anime background art.
- Added safe reusable SVG gradients for sky, sun, plaster, wood, roof, glass, road, foliage, and shadows. The mobile SVG canvas and exported frame SVGs include the definitions; arbitrary external paint URLs are rejected.
- Added the 3D environment artist button to the Android/mobile workspace and precached both new renderer modules in the PWA service worker.
- A Vercel preview deployment is READY at https://zero-studio-fqyvx0jru-studio-37a2.vercel.app/ (deployment `dpl_6Lu7Vjt2ygAiLMrKydb7UyAdy5yA`, 17 files). It is a preview only; the production alias `zero-studio-three.vercel.app` was not changed.
- Full automated suite passed 160 tests with 0 failures on run #44342195095. The scene-generation workflow's most recent model response exceeded the old 1,500-path cap; the cap is now 2,800 and the runner has bounded fallback across supported Gemini Flash models on temporary overload.

- The earlier successful 3D milestone passed 156 tests; the later full suite now passes 160 tests, 0 failures (run #44342195095).
- **Not yet complete:** the 3D renderer is not integrated into the 24-unique-drawings/sec animation worker. Animation batches still have the earlier 300-path limit. Texture maps, physically based lighting, shadow maps, detailed assets, and mobile performance validation are pending. Do not claim production-quality 3D or the user's reference-image quality yet.

## Mission

Build a practical, mobile-first anime production studio, usable from an Android phone and free or nearly free, with a coordinated workflow for story, character design, backgrounds, animation, cleanup, coloring, sound, editing, and quality review.

The long-term vision includes specialized AI-assisted departments/agents coordinated by a central production brain. These departments are workflow roles, not a claim that dozens of autonomous models are already running.

## Hard requirements

1. **No generative image/video models for artwork.** Do not use image generators to create final characters, scenes, backgrounds, or animation frames. The intended drawing path is explicit vector/SVG paths, brush strokes, or other editable drawing operations executed by the drawing engine.
2. **24 independent drawings per second is the stated creative target.** Distinguish this from 24 FPS playback. At 24 unique drawings/second, production requires 1,440 drawings/minute and 28,800 drawings for a 20-minute episode. Do not silently downgrade this target. Feasibility and quality must be evaluated through small prototypes.
3. Android phone is the user's working device. Keep workflows touch-friendly and avoid requiring a PC.
4. Free-first. Do not assume paid compute, subscriptions, API billing, or a dedicated GPU.
5. Be transparent about what is implemented, tested, untested, or merely planned.
6. Preserve project history and decisions here. At the start of each continuation, review this file and DECISIONS.md before proposing changes.

## User and workflow context

- The user communicates in Arabic; default to Arabic explanations.
- The user wants the assistant to work directly in this GitHub repository wherever the connected tools allow it, minimizing manual file operations by the user.
- The repository is private: laracheinarave4675-max/zero-studio.
- Avoid asking the user to copy/paste code or move files unless there is no supported alternative.

## Previous prototype (outside this repository)

A prototype named **ZERO STUDIO v0.1** was created in a previous session under:
- /mnt/data/zero-studio-v0.1/
- /mnt/data/zero-studio-v0.1.zip

Reported contents:
- Arabic RTL mobile web interface.
- SVG drawing board at 1920×1080.
- Touch/stylus vector paths.
- Frame add/duplicate/delete operations.
- 24 FPS preview.
- Save/open .zero project files.
- ZIP export containing per-frame SVG, project data, and manifest.
- PWA service worker.
- Optional experimental text-to-SVG JSON connector for Gemini 2.5 Flash Lite; not tested with a real user API key.

Validation previously reported:
- JavaScript syntax check passed.
- ZIP integrity test passed.
- Not yet tested on a physical Android device.
- Gemini connector not tested with a real API key.
- Not imported into this GitHub repository yet.
- Not a complete studio and not evidence of professional anime-quality autonomous drawing.

These are historical reports, not a fresh test in this repository. Revalidate before relying on them.

## Related tools previously investigated

- ToonPix on Android was identified as a possible free/offline frame-by-frame animation companion; verify current availability and behavior before depending on it.
- KinetiFrame was identified as an open-source experimental option, but its development-build status makes it unsuitable as a production dependency without testing.
- OpenPhoneUse was identified as an Android phone-control agent, but precise continuous drawing capability was not established.
- Gemini API free-tier availability and data-use caveats were previously researched and are now documented in docs/AI_VECTOR_DRAWING.md. Re-check provider terms and quotas regularly. Never send secrets or confidential project material to a third-party model without explicit review.

## Repository status at baseline

- GitHub repository: https://github.com/laracheinarave4675-max/zero-studio
- Visibility: private.
- Default branch: main.
- Connected GitHub identity has admin/maintain/push permissions.
- Repository was confirmed visible to the connected GitHub integration on 2026-11-17.
- This initial documentation baseline is being committed directly to main because the repository was empty at the time of setup.

## Drawing and character system milestone — feature/mobile-drawing-workspace

### Vector drawing tools
- [x] Freehand vector pen with sampled pointer input and smooth cubic Bézier interpolation.
- [x] Optional pressure-outline brush for pointer devices reporting stylus pressure; finger/mouse input keeps the normal brush path.
- [x] Vector eraser using editable, non-destructive SVG masks.
- [x] Straight line, rectangle, and ellipse tools; closed shapes support optional fill.
- [x] Select a visible vector path, drag to move it, and delete it. Each operation has a stable ID preserved by project normalization and SVG export.
- [x] Drawing-canvas zoom controls and a pan tool for the mobile viewport.
- [x] Inline layer rename, visibility, lock, reorder, add, and delete controls.
- [x] SVG path command grammar/arity checks and cumulative-coordinate limits for M/L/H/V/C/S/Q/T/A/Z paths. Bounds are conservative control-point/radius bounds, not exact Bézier-extrema geometry.
- [x] Topology-matched in-between generation for path-compatible keyframes. It rejects different path commands, layer/operation order, visibility/lock structure, and colors.
- [x] Save/open project v2, v1 migration, SVG sequence export, and ZIP32 bundle export.

### Character tools
- [x] Reusable Nori vector construction template with 12 identified parts grouped into semantic layers.
- [x] Three authored views (front, side, back), four pose presets (neutral, wave, walk, sit), and four expressions (neutral, happy, sad, surprised): 48 validated preset combinations.
- [x] Editable Nori palette controls for line, skin, hair, clothing, and accent colors.
- [x] Import/export standalone `.zchar` character-model files with size and path validation.
- [x] Insert selected character variants into the current frame as editable layer operations.
- [x] Exported model-sheet proportion guide layers for center, eye, shoulder, hip, and ground references.
- [ ] Professional custom model-sheet editor, artist-adjustable proportion guides, and artist-reviewed turnarounds still need extension.
- [x] Basic two-bone inverse kinematics for four limb chains: endpoint drag solves the elbow/knee while preserving segment lengths and a 20°–160° bend range; intermediate-joint drag preserves both segment lengths.
- [x] Added torso-center and head-center translation anchors; torso movement carries head/limb joints and head movement translates the head/face/hair group. Legacy rig models receive default anchor positions.
- [x] Added editable head rotation from −60° to +60° around the head-center anchor, using validated SVG path rotation for head, hair, and facial features.
- [x] Added whole-character lean from −45° to +45° around the torso-center anchor; every editable path and rig joint rotates together, preserving limb lengths.
- [x] Added interactive vector path editing: select an operation, enable node mode, and drag anchors plus cubic/quadratic Bézier control handles (up to 240 total handles) while preserving editable path topology.
- [x] Rig-aware pose blending between compatible saved Nori models, with validation of view/part topology and IK reconstruction of intermediate limb paths.
- [x] Added an in-workspace pose-blend panel to select two saved character models and generate an editable midpoint at a chosen 0–100% progress value.
- [x] Project-local reusable character library with validated save/load/remove and inclusion in `.zero` project save/open (100 models maximum).
- [x] Character layers carry validated instance identity and part membership; copy to next frame and update one frame while retaining instance identity. In-between frames preserve the metadata.
- [x] Added custom character creation from visible hand-drawn frame paths, preserving semantic layer grouping and storing the resulting model in the project library; unsafe/unmerged eraser operations are rejected.
- [x] CI confirms 107 passing tests and 0 failures after Bézier control-handle editing was added.
- [x] Unique-drawing cadence audit distinguishes unique vector artwork from repeated frames, reports the average unique drawings/second, and is included in ZIP manifests.
- [x] Nori's 11-cell SVG model sheet now includes editable proportion-guide lines in every view/expression/pose cell.
- [ ] Full-body rigging still needs rotational spine/neck/head joints, finger/toe articulation, collision/ground constraints, and synchronized linked-instance editing across arbitrary frame ranges.

### Validation and current limitations
- [x] GitHub Actions run #531 passed all 94 tests, 0 failed, and JavaScript syntax checks succeeded on commit `ee3ba74a4a2fa694a0bb0749cd2a750096688aef`.
- [ ] Physical Android browser/touch/stylus tests remain unperformed. The pressure brush is implemented but pressure fidelity depends on device/browser stylus events.
- [ ] Visual quality of Nori's authored geometry and all pose transitions still needs human/artist review.
- The in-between engine only interpolates matching SVG command topology. It is not a general skeletal or drawing-aware animation system.
- The 24-distinct-drawings-per-second production target remains unproven; the one-second sample is a simple pipeline proof, not 24 completely redrawn full-body poses.

## Current implementation status

- [x] Repository access confirmed.
- [x] Durable project README created.
- [x] Project status and constraints documented.
- [ ] Prior v0.1 prototype imported and re-reviewed.
- [x] First mobile vector drawing workspace source committed on `feature/mobile-drawing-workspace`.
- [ ] Android browser/device smoke test (public test URL is live; physical interaction remains pending).
- [x] Initial SVG drawing-command contract documented (`docs/DRAWING_COMMANDS.md`).
- [x] SVG path command grammar/arity and conservative coordinate-bound validation.
- [x] Initial single-layer AI vector proposal adapter implemented.
- [x] Multi-layer AI scene artist: requests a complete scene as named editable layers, validates each path, previews the whole scene, and commits only on approval.
- [ ] Live provider test with a real API key; [ ] Android browser test; [ ] professional art/continuity review.
- [x] First one-second animation proof created: 24 distinct vector frame documents at 24 FPS, with automated uniqueness test; [ ] human quality review and Android playback.
- [ ] Production departments/agents orchestration and central scene planner.
- [ ] Sound, editing, and export pipeline integration.

## Initial implementation baseline — historical, superseded by later milestones

Review pull request: https://github.com/laracheinarave4675-max/zero-studio/pull/1 (draft; not merged into `main`).

Committed an initial browser-based drawing workspace under `app/`:
- Arabic RTL responsive interface.
- SVG 1920×1080 touch drawing surface with pen and prototype white-stroke eraser.
- Frame add/duplicate/delete/select, previous-frame onion-skin preview, and playback at selectable 6/12/24 FPS.
- Undo/redo history.
- Save/open `.zero` JSON project files (local download/upload).
- Export all frames as an SVG-sequence JSON bundle.
- Strictly limited v1 vector-path JSON command input; no image-generation provider is connected.
- PWA manifest and basic app-shell service worker.

### Checks performed in this session
- [x] JavaScript parse check for `app/app.js` passed using the connected execution environment.
- [x] JavaScript parse check for `app/sw.js` passed.
- [x] `app/manifest.webmanifest` parsed as valid JSON.
- [ ] Physical Android interaction and touch testing.
- [ ] Browser/PWA install and offline behavior.
- [ ] Project save/open round-trip in a real browser.
- [ ] SVG export opened in a separate Android drawing/animation app.

At this initial baseline, the eraser was a white stroke and layers, ZIP export, and AI drawing were absent. Later milestones below add a true SVG-mask eraser, editable layers, ZIP export, and an optional text-only Gemini vector proposal adapter. The initial 24 FPS preview did not prove the 24-independent-drawings/sec target.

## Layer and vector eraser milestone — feature/mobile-drawing-workspace

Implemented on the existing development branch:
- Project format v2 with frame-local ordered layers (name, visibility, lock, ordered operations).
- Add/remove/select, rename, show/hide, lock/unlock, and reorder layer controls.
- Non-destructive vector eraser: eraser strokes are stored as ordered vector operations and exported as SVG masks; later strokes remain visible above earlier erase operations.
- v1 `.zero` files with `frames[].paths` migrate to one layer per frame when opened.
- SVG sequence export includes layer visibility and eraser masks.
- ZIP export creates a standalone archive containing the editable project, a manifest, and one SVG file per frame.
- Service-worker cache updated to include the ES module engine and use a new cache version.
- Added 13 engine, 4 Gemini-adapter, 2 workspace DOM, 3 ZIP, and 2 animation-proof tests (24 total).
- Drawing input consumes coalesced pointer samples where supported; pointer cancellation discards the incomplete gesture.
- Added GitHub Actions workflow for Node test execution across all `tests/*.test.mjs` files, including ZIP archive tests.

### Validation record
- Initial GitHub Actions attempt exposed one incorrect test fixture (it attempted to draw after locking the layer); the fixture was corrected.
- GitHub Actions run #102 completed successfully: 24 tests passed, 0 failed. Syntax checks passed for the app controller, engine, ZIP module, Gemini adapter, and service worker.
- Independently executed 12 equivalent engine behavior assertions in the connected JavaScript runtime; all passed.
- JavaScript syntax checks passed for the engine module, app controller, and service worker; all referenced controller DOM IDs exist in the HTML.
- Automated DOM checks confirm all controller IDs exist and the AI proposal controls/preview layer are present. Browser rendering and actual Android touch interaction remain untested.

Known limitations: the eraser is a non-destructive SVG mask, not geometric path splitting; full SVG path parser and pressure-sensitive stylus width are not implemented. The Gemini text-to-vector adapter is implemented but has not been tested with a real API key. No image-generation endpoint is connected.

## Drawing input and layer usability update — feature/mobile-drawing-workspace

- [x] Added validated layer renaming (trimmed, non-empty, maximum 80 characters) with undo history.
- [x] Added a regression test for successful rename and invalid names/IDs.
- [x] Pointer input uses browser-coalesced samples where available; pointer cancellation discards the unfinished gesture.
- [x] ZIP32 archive writer with UTF-8 filenames, CRC32, central directory, and path/duplicate validation.
- [x] ZIP archive tests added to CI.
- [ ] Test downloading and opening the ZIP on the physical Android phone; no device test is claimed.
- [x] Added a text-only Gemini vector proposal adapter with local validation and approve/reject preview.
- [ ] Test the adapter using a real user API key and confirm provider access from the user network.
- [x] Added a one-second original vector character wave/blink sample with 24 unique frames; automated CI confirms 24 distinct frames at 24 FPS; no raster image generation used.

## Public Android test deployment — 2026-11-17

- [x] Created Vercel project `zero-studio` in the user's authorized Hobby team.
- [x] Published the static app files from branch `feature/mobile-drawing-workspace` at commit `52be940755d46d69efc051d2acaa8f8fe711d7e1`.
- [x] Deployment reached `READY`; HTML, app controller, engine module, CSS, service worker, and web manifest each returned HTTP 200 in deployment fetch checks.
- Public test URL: https://zero-studio-three.vercel.app/
- GitHub repository remains private. Vercel password and SSO deployment protection are disabled so the app URL is publicly reachable, as explicitly approved by the user.
- GitHub Login Connection was not available to Vercel, so this is a manual static snapshot upload, not an automatic Git-linked deployment. Future code changes do not appear at this URL until a new deployment is uploaded.
- The deployment is a test copy, not evidence of physical Android validation. Touch/stylus behavior, PWA installation/offline behavior, project round-trip, ZIP download/open, and real Gemini API calls remain to be tested on the user's phone/network.

## Latest drawing/character test deployment — 2026-11-18

- [x] Published the current drawing/character build, including rig-aware pose blending, to Vercel deployment `dpl_G5BboMmASTqRZ5x1nBionsAoBvgP` (`READY`).
- [x] Reassigned stable public test alias https://zero-studio-three.vercel.app/.
- [x] Confirmed deployment file manifest includes `character-library.mjs`, updated `character-model.mjs`, `engine.mjs`, `app.js`, and service worker cache v22.
- [ ] Physical Android testing remains pending; publication is not device validation.

## Next actions

1. Validate the current drawing and character UI on the physical Android phone: zoom/pan, freehand/stylus pressure, selection/move/delete, shape fills, layer management, and character presets.
2. Test .zero and .zchar save/open round trips, SVG/ZIP export, offline PWA behavior, and a longer multi-frame project on Android.
3. Refine character construction into professional editable model sheets and customizable proportions.
4. Implement a real articulated character rig with joint constraints and reusable character instances; then build keyframe/cleanup workflows beyond topology-matched path tweening.
5. Use the cadence audit on a genuinely hand-drawn short action and evaluate whether 24 independent drawings/second can be achieved at acceptable quality and review effort. Do not treat 24 FPS playback as success.
6. Test Gemini with a user-owned API key entered directly in the app; never share the key in chat.

## Change log

### 2026-11-18 — Drawing and character system expansion
- Added constrained two-bone IK for the four Nori limb chains; endpoint movement solves the elbow/knee while preserving segment lengths and bend range.
- Added a project-local character library with validated save/load/remove, undo support, and `.zero` round-trip persistence.
- Added unique-drawing cadence measurement that ignores frame/operation IDs, reports distinct artwork per second, and is embedded in ZIP manifests.
- Added editable proportion-guide overlays to the 11-cell SVG model sheet.
- Added regression tests for IK, rigged pose in-betweens, character-library persistence, cadence analysis, and guide layers.
- GitHub Actions run #411 passed all 77 tests and syntax checks.

### 2026-11-17 — GitHub access recheck and continuity confirmation
- Rechecked the private repository using the connected GitHub integration; `laracheinarave4675-max/zero-studio` is now discoverable.
- GitHub reports `admin`, `maintain`, and `push` permissions for the connected identity.
- Verified that README.md, PROJECT_STATUS.md, DECISIONS.md, and ROADMAP.md exist on the main branch and contain the project constraints and staged plan.
- No app source was changed in this step; importing the previous v0.1 prototype remains the next implementation task.


### 2026-11-17 — GitHub connection and documentation baseline
- Confirmed access to the private repository through the connected GitHub integration.
- Confirmed push/admin permissions.
- Began durable project documentation so future sessions can resume from repository state rather than relying on conversational recall.


## Smooth vector drawing milestone — 2026-11-17

- [x] Replaced straight-line freehand point joining with Catmull–Rom-derived cubic Bézier segments in the drawing engine.
- [x] One-point taps produce a tiny round-capped stroke; two-point gestures remain a straight segment; longer gestures produce cubic curves passing through the sampled points.
- [x] Pointer coalesced samples remain supported; generated paths are stored as ordinary editable SVG paths and continue to work with undo, masks, and SVG/ZIP export.
- [x] Added engine tests for curve generation, endpoint preservation, tap/straight-line handling, and invalid point rejection.
- [ ] Physical Android feel/latency and curve quality review remains pending; smoothing is mathematical interpolation, not stylus pressure or a brush engine.
- [x] Published the smooth-curve update to the existing public Vercel test URL; the deployment returned READY and the deployed app/engine files were checked for the new converter. GitHub Actions run #124 passed all 26 tests.


## 2026-11-17 — Expanded drawing and character editing

- Added operation IDs, path selection/move/delete, and translation support.
- Added touch pan/zoom controls and inline Android-friendly layer rename.
- Added Nori palette customization, with validated line/skin/hair/clothing/accent overrides.
- Expanded CI coverage to 58 passing tests. See GitHub Actions run #322.


## Editable vector background milestone — 2026-11-18

- [x] Added `app/backgrounds.mjs` with four original SVG-path scene presets: daytime city, forest, interior room, and night city.
- [x] Each preset is split into named editable layers; insertion places those layers behind existing character/ink artwork and checks layer/operation limits before mutation.
- [x] Added Arabic mobile workspace controls to select and insert a background; scenes remain ordinary validated vector operations and are included in project save/open and SVG/ZIP export.
- [x] Added `docs/BACKGROUND_LIBRARY.md` and automated tests for preset structure, stacking order, invalid presets/capacity, and project round-trip.
- [x] Uploaded the background-enabled static snapshot to Vercel deployment `dpl_bqibHVJ4qU7daU2jgWA6fYmuLGes` (`READY`) and reassigned the stable alias https://zero-studio-three.vercel.app/.
- [x] Confirmed deployment manifest contains `src/backgrounds.mjs` and all 11 app files.
- [ ] Visual/art review of all four scenes and physical Android interaction remain pending.
- [ ] This is a starter background library, not yet a complete layout department: perspective grid, parallax/depth editing, prop library, reusable location sheets, and scene continuity tools remain planned.

### Remaining drawing/character/animation acceptance gaps
- [ ] Professional adjustable model-sheet editor and artist-reviewed turnarounds.
- [ ] Finish spine/neck/finger/toe articulation, collision/ground constraints, and synchronized linked-character edits across arbitrary frame ranges.
- [ ] Full keyframe/dope-sheet editor, timing/holds, exposure-sheet workflow, cleanup and frame-aware interpolation beyond topology-matched path tweening.
- [ ] Background perspective/layout editor, depth/parallax planes, reusable props and scene continuity.
- [ ] Android device validation, human art review, and a measured action test against the unchanged 24 independent drawings/second target.


## Background-enabled deployment and CI verification — 2026-11-18

- GitHub Actions run #698 passed 112 tests, 0 failures, including the background UI/Service Worker test and all existing engine/character tests. Syntax checks include `app/backgrounds.mjs`.
- Latest public static snapshot: Vercel `dpl_bqibHVJ4qU7daU2jgWA6fYmuLGes`, state `READY`, stable alias `https://zero-studio-three.vercel.app/`.
- Source remains private and deployment remains manual; future commits require a new static upload.
- Latest code/test milestone is committed on `feature/mobile-drawing-workspace`; PR #1 remains draft and unmerged.
