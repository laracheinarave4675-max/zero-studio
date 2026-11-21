## D-031 anime craft practice expansion — 2026-11-21

- Added `app/anime-drawing-training.mjs`, a detailed anime-specific practice library covering all 15 curriculum skills: gesture/silhouette, head construction, anime eyes/expressions, hair masses, body anatomy, hands/feet, costume/folds, perspective, inking, flat colors, cel shadows, material highlights, model sheets, composition, and independent animation drawings.
- Each study now teaches a concrete Japanese animation drawing principle, a sequenced drill, common visual mistakes, a target deliverable, and skill-specific review criteria. It explicitly avoids treating one set of proportions as universal for every anime style.
- Added session generation with foundation/intermediate/advanced difficulty, recommended layer order, native Canvas2D raster medium, and a distinction between machine-measurable checks and criteria that still require human visual review.
- Connected the editor's Anime Craft panel: skill names are readable, the artist can inspect detailed focus/sequence/mistakes/rubric, choose difficulty, and generate a practical drawing session.
- Added `tests/anime-drawing-training.test.mjs` to verify coverage of every curriculum skill, anime-specific drill content, independent raster drawing requirements, defensive copies, and invalid input rejection.
- This is a real structured practice system and editor integration, not neural-network training. The generated session is a drawing brief; it does not autonomously complete the exercise or claim artistic mastery.
- GitHub Actions were triggered for the current PR head; results are pending verification. No Android device test or visual acceptance has occurred in this pass.
- PR #14 remains Draft and unmerged. No production deployment, paid compute, generated final artwork, or Worker changes.

# ZERO STUDIO — Project Status

Last updated: 2026-11-21 (UTC)

## D-030 Raster-first Digital Artist — contour fill and stroke review milestone

- Native Canvas2D raster brush strokes remain the only required final-art drawing hand. SVG stays optional for guides and selected geometric helpers.
- Added explicit region-fill plan operations. The validator checks polygon points, canvas bounds, color, opacity, blend mode and operation limits; the executor validates them before painting.
- Added fillRasterRegion() to render closed artist-authored polygon boundaries into transparent native raster layers with antialiased Canvas2D edges. The plan contains vector boundary points, not embedded image or bitmap payloads.
- Replaced the 12 horizontal flat-color test bands with 14 closed semantic region fills for hair, face, ears, neck, eye whites, fringe and clothing. The deterministic fixture now contains 56 total operations on seven layers (14 fills plus 42 brush marks).
- Connected polygon fills to the editor, native project stroke history, and the CI Canvas2D renderer. Region type and individual review state survive project normalization.
- Added a stroke-review panel: select an individual artist operation, preview it in isolation, move to previous/next, and mark it approved/rejected/reset to pending. Review decisions use project history/undo and persist in the project.
- Added a JSON correction editor for the selected stroke's intent, points/pressure and brush settings or region-fill color/opacity/blend. The validator preserves stable IDs, bounds, and supported brush profiles, resets edited operations to pending review, and rejects invalid geometry.
- A correction rebuilds the entire target raster layer from its ordered stroke log on a scratch Canvas2D surface, then commits the new PNG only after successful rendering and size validation. Locked layers are refused. Existing manual and Digital Artist strokes in that layer are replayed in sequence; the pre-edit project state remains undoable.
- CI now verifies representative pixels inside face, hair, eye-white and clothing polygons and a control pixel outside the silhouette. This guards against accidental flat-color bands and spill at those probe points; it does not prove every region is anatomically perfect.
- Verified on application HEAD a9f4449b848854623fde0d0172598c86b4ad112a: Drawing engine run #2396 passed syntax checks and all 361 tests (0 failures). The Hybrid raster/SVG run #614 completed the Canvas2D renderer proof successfully for the same code and uploaded the portrait plus seven transparent layer PNGs; its node-test job was still running at the time this note was written. See https://github.com/laracheinarave4675-max/zero-studio/actions/runs/44934080883 and https://github.com/laracheinarave4675-max/zero-studio/actions/runs/44934085875.
- Visual inspection: the latest CI render no longer has the broad horizontal flat-color bands. The face, hair masses, eye whites and clothing regions are visibly filled. Construction and rough-sketch layers remain available but are hidden in the final composite after cleanup. The current deterministic portrait still has rough silhouette/outline alignment and incomplete costume/hair refinement; it is a renderer-and-region-fill proof, not an approved production anime character.
- Not yet implemented/verified: the authorized Anime Craft reference library is not yet populated; the curriculum exercises have not yet been executed as training attempts; landmark/palette comparison is not yet connected to the approved Character DNA; full automatic visual critique/correction, complete full-body character, professional visual approval, and physical Android testing remain pending.
- Deployment: PR #14 remains open as Draft on feat/digital-artist-engine. No merge or production deployment occurred. The Vercel free build-rate limit remains a constraint; no paid upgrade or fallback was used.
- Budget remains $0. The long-term target remains 24 independently authored drawings per second. No generated image/video output is accepted as the final artwork.

## D-031 initial implementation — internal eyes and Anime Craft curriculum

- Added `app/digital-artist-eyes.mjs`, a local deterministic analysis module. It measures raster alpha bounds/coverage/centroid/perimeter and coarse palette; stroke geometry, pressure range, path length and sharp turns; named model-sheet landmark deviations; named palette differences; and inside-coverage/outside-leakage for raster region fills.
- Connected the local eye panel to the editor's current frame. It reads each Digital Artist raster layer locally (downsampled to at most 960×540 for the initial inspection), reports per-layer coverage/bounds, dominant colors, operation counts, stroke geometry and review state. Fills sharing a color are inspected as one union of intended regions to avoid false leakage reports between adjacent same-color hair/clothing shapes.
- The CI renderer now builds a separate transparent composite of visible artwork (without the opaque page background), analyzes the character silhouette against that transparent surface, preserves stable command IDs in line reports, and exports `digital-artist-eyes-report.json` with the portrait and seven layer PNGs.
- The initial eye system is a measurable inspection aid, not a professional art critic yet. The named-landmark and reference-palette comparison helpers are implemented and tested, but they are not yet connected to an approved Character DNA/model-sheet record; detailed facial identity, anatomy scoring, visual hierarchy, line continuity and automated corrections still need work.
- Added `app/anime-artist-curriculum.mjs`: 15 ordered anime craft skills covering gesture/silhouette, head/face, anime eyes/expressions, hair masses, body anatomy, hands/feet, costume/folds, perspective/camera, inking, flat colors, cel shadows/light, materials/highlights, model-sheet identity, shot composition and animation continuity. Each skill includes prerequisites, lessons, exercises and measurable evaluation targets.
- Added reference-card provenance/rights validation for study, training and commercial-production purposes, and practice-task creation that explicitly requires native raster brush operations and forbids final-image generation. This is a curriculum and learning framework; it does not mean a neural artist has already been trained on these examples.
- Added an in-editor skill browser that displays the staged curriculum and its exercises/metrics. Actual execution of exercises, a curated and populated rights-cleared reference library, and learning from approved corrections remain future work.
- Verified on HEAD `536ee9b49b989fbd5770fea66cadbb0252d80fe6`: Drawing engine run #2449 passed all 376 tests (0 failures); Hybrid raster/SVG run #639 passed all 376 tests and its raster-brush proof/export jobs. See https://github.com/laracheinarave4675-max/zero-studio/actions/runs/44935929615 and https://github.com/laracheinarave4675-max/zero-studio/actions/runs/44935929613.
- PR #14 remains open as Draft and unmerged. No production deployment occurred.

## Immediate next steps — D-031 artist-first direction

1. Connect the landmark and palette comparison eyes to approved Character DNA/model-sheet data so identity drift can be measured from real project references.
2. Expand the current eyes from geometric/pixel metrics to stronger silhouette, anatomy, line continuity and cel-shadow/lighting checks with actionable regions and stroke IDs.
3. Improve native anime drawing tools: tapered clean inking, organic hair/cloth brush behavior, robust masks/fills, clean flats, cel shadows and highlights.
4. Populate the authorized Anime Craft Library and let the artist execute exercises, store attempts, compare results and learn from approved corrections.
5. Draw and visually review one complete original character; only after that should we return to independent 24-drawings/second animation.

## Optional external visual-model research — 2026-11-21

- Reviewed Qwen3-VL-2B/4B and public Hugging Face Spaces as potential optional visual-analysis helpers.
- A Qwen3-VL smoke-test inference did not start: the Space requested 60 seconds of ZeroGPU while the connected free account had only 42 seconds remaining in its current daily quota. No inference ran and no paid fallback was used.
- This reinforces D-031: an external VLM is not the artist's eyes and must not be a blocking dependency. Prioritize the native multi-eye perception passes and the anime drawing curriculum first.
- Candidate references remain https://huggingface.co/spaces/baohuynhbk14/Qwen3-VL-Demo and https://huggingface.co/Qwen/Qwen3-VL-2B-Instruct. No Space was modified, and no model was connected to ZERO STUDIO.

## D-029 / D-030 architecture record

- D-029 approved an AI digital artist that authors explicit, editable drawing operations rather than final image/video generation. The initial vector-first command contract remains optional infrastructure for guides and selected geometry.
- D-030 refined the final-art route to raster-first: semantic Canvas2D brush layers and an ordered, editable stroke log are the authored source. A flattened PNG is only a preview/export artifact.
- D-031 establishes the artist-first direction: the artist must have its own measurable visual eyes and anime craft knowledge; no external vision-language model is required to operate it. The two studio goals remain professional anime-series production and the genuine independent-drawing digital artist with the unchanged 24 drawings/second target.
- The architecture, Character DNA requirements, anatomy guidance, critique/correction loop, and visual acceptance gates are documented in `docs/DIGITAL_ARTIST_ARCHITECTURE.md`.
- No vision model inference or image-generation inference was used for this implementation.

## Immediate next steps

1. Implement the internal multi-eye perception passes and measurable critique.
2. Improve anime-specific brush behavior, inking, filling, flat-color coverage, cel shadows and highlights.
3. Build the rights-cleared Anime Craft Library and drawing exercises.
4. Connect the eyes to stroke correction/replay; then validate one full original anime character.
5. Test the artist/animation path against the unchanged 24 independently authored drawings/second target.

---

# ZERO STUDIO — Project Status

Last updated: 2026-11-20 (UTC)

## D-028 anatomy-guided animation engine — 2026-11-20

- The user approved replacing repeated per-frame image generation with a stable Character DNA and anatomy-guided independent drawing workflow.
- Recorded D-028 in DECISIONS.md. It supersedes D-027's per-frame still-image request approach for final character animation; D-027 remains history for the earlier prototype.
- Added docs/ANIME_ANATOMICAL_DRAWING_ENGINE.md as the current source of truth.
- Added app/anime-anatomy-engine.mjs: validated identity/proportion data, approved full key-drawing records, smooth joint construction interpolation, limb-length constraints, planted-foot anchors, center-of-mass sampling, and guide-only anatomical construction previews.
- Added independent 24-FPS artist drawing tasks. Each frame requires a complete redraw, its own transparent PNG/WebP asset, a unique content hash, and explicit identity/anatomy/line-quality/timing review.
- Added tests/anime-anatomy-engine.test.mjs for identity locking, proportion measurement, key-drawing approval, interpolation, foot anchoring, guide-only rendering, duplicate prevention, and the 24-approved-unique-drawings audit.
- The geometry is reference material only. It does not deform the source character, generate final character pixels, or substitute for artist-authored drawings.
- The prior per-frame still-image request builder is legacy-only for this animation direction and must not be used to produce final motion frames.
- Added a mobile-first on-canvas Character DNA calibration panel: annotate 19 anatomical landmarks over the current drawing, set view/foot contact, save the identity into the native .zero project, and export the DNA record.
- Extended native project normalization and large-project undo metadata to preserve Character DNA records.
- Character DNA now stores a SHA-256 signature of its originating timeline drawing. Key-drawing approval, motion-plan creation, and plan restoration refuse to proceed if that original drawing is missing or changed.
- Corrected a malformed async declaration in the motion-plan restoration path and added a regression assertion.
- Android history budgeting now counts final animation PNG payloads as well as raster-layer images. Once heavy raster assets exceed 2 MiB, history uses frame-local snapshots; shared animation-background state is preserved by undo/redo.
- Added regression coverage for the immutable character anchor, raster-aware history selection, and shared-background undo/redo.
- GitHub Actions is green on branch HEAD `fd9ee5c92393f99f41c6551d804cac6274b13d70`: syntax checks passed and 291/291 tests passed (0 failures).
- **Not yet verified:** annotate the user's approved real character, create and approve 24 real artist drawings, play the completed walk on Android, and obtain visual identity/anatomy/line-quality approval from the user.
- The latest READY Vercel preview currently points to older commit `072b27c0`; the newer drawing workflow is not yet deployed. Vercel reported its free-tier deployment rate limit (>100/day). No production deployment, Cloudflare deployment, paid service, or merge to main was initiated.

dation — 2026-11-20

- User-approved decision D-027: preserve the existing character and background generation departments; focus development on the missing anime animation department.
- New workflow: motion/timing chart → spatial pose blocking guide → complete 2D key drawings → individually reviewed raster in-between/cleanup drawings → raster frame assembly.
- 3D pose rigs are references only. Puppet deformation, single-image warping, SVG path animation, held copies, and generic text-to-video output are not accepted as final animation.
- Added `docs/ANIME_KEYFRAME_MOTION_ENGINE.md` and D-027 in `DECISIONS.md`.
- Added `app/anime-motion-engine.mjs`: validated 24 FPS plan, ordered key-pose schedule, guide-only joint sampling, independent PNG/WebP drawing records, duplicate-raster rejection, and materialization into native ZERO STUDIO raster layers.
- Added `tests/anime-motion-engine.test.mjs` for schedule, guide interpolation, image identity/hash uniqueness, missing-frame accounting, native Raster project-frame materialization and input validation.
- Added experimental `POST /v1/anime/segment` on the isolated Worker branch using Cloudflare Images `segment=foreground`/BiRefNet, with gallery-ID validation, origin/token auth, PNG checks, free-limit stop/no-paid-fallback handling, and Vercel proxy `app/api/anime-segment.js`.
- Worker and Vercel proxy tests cover auth, invalid IDs, PNG output, and free-tier cap handling. This is mocked/unit-tested only; it is not deployed and no live transformation has been run.
- The Worker now also requires the explicit runtime flag `ANIME_SEGMENTATION_FREE_TIER_CONFIRMED=true` before any transformation. The flag is intentionally unset by default; no live conversion or billing has been initiated.
- Existing character/background generation, FLUX.2 reference conditioning, raster surface, SVG, and character assets are unchanged.
- The old SVG frame-generation proof is marked as a visually rejected historical experiment; it is preserved, not deleted.
- Branch: `feat/anime-raster-keyframe-motion-engine`. Automated tests must pass before this foundation is considered code-verified. The key drawing provider, in-between model, visual result, UI integration, and Android test are not yet implemented.
- No merge, production deployment, paid endpoint, or GPU rental.

---

# Production gallery milestone — 2026-11-20

- Added a Cloudflare Workers KV namespace named `ZERO STUDIO Production Gallery` (free Workers KV tier; namespace ID is configured in `cloudflare-worker/wrangler.toml`).
- Added Worker routes: authenticated `/v1/gallery` list/save and opaque-ID `/gallery/{id}` image view links. New gallery objects expire automatically after 30 days.
- Added Vercel server proxy `app/api/gallery.js`; browser code never receives the Cloudflare bearer token.
- Added automatic gallery save after successful image generation, gallery refresh/cards, and share-link controls in the Android-first UI.
- Gallery links are unlisted bearer links: anyone possessing a link can view that image. Users should not save sensitive/private images. Images are retained for 30 days, and KV is limited to 1 GB total with daily read/write limits. See Cloudflare's official KV limits and pricing docs.
- R2 is not enabled on this account; it was not activated and no payment method or paid plan was requested.
- Deployed the Worker gallery code to the existing Cloudflare staging Worker using the script-content endpoint, preserving its secret binding. Verified through the Cloudflare API that `GALLERY` KV, AI, the existing secret binding, and both approved app origins are present.
- Deployed a dedicated Vercel preview for branch `feat/production-gallery`; latest deployment `dpl_PBbyNexWeFYtTnn23rp13pvtB4Vf` is `READY` at `https://zero-studio-preview-git-feat-production-gallery-studio-37a2.vercel.app/`. The app root returned HTTP 200 and contains the gallery UI. The API's direct external GET correctly returns 403 without a same-origin browser referrer.
- GitHub Actions on the latest branch commit passed: Cloud inference worker tests, hybrid raster/SVG regression tests, and drawing-engine tests. The worker suite covers gallery upload, 30-day expiration, authenticated listing, and share-link image retrieval.
- **Remaining acceptance test:** a real browser session must generate or upload an image, save it to KV, reload the gallery, open the share link, and verify that the assistant can retrieve it. The connected tools cannot simulate the user's Android browser session, so end-to-end image persistence is not yet claimed.
- PR #7 remains draft/open/unmerged. No primary production app alias was promoted or changed.

---

# Hybrid image-generation integration milestone — 2026-11-20

- Deployed the hybrid application branch to the separate Vercel staging project `zero-studio-preview`, domain `https://zero-studio-preview.vercel.app/`. The primary `zero-studio` project was not changed.
- Set Vercel project root directory to `app`; the live app root returns HTTP 200.
- Added visible image-generation prompt/preview/import UI. Generated results are imported only after user review as an actual Raster layer using the existing `addRasterLayer` engine path.
- Added `app/api/images.js`, a server-side Vercel proxy. The browser never receives the bearer token. GET `/api/images` returns the expected 405; the endpoint accepts POST only.
- Added Cloudflare Worker `STUDIO_ORIGIN` binding set to `https://zero-studio-preview.vercel.app`; Workers AI `AI` binding remains present.
- Added Vercel `ZERO_STUDIO_APP_ORIGIN` environment variable for the staging project.
- **Security gate remains incomplete:** the matching `STUDIO_ACCESS_TOKEN` Cloudflare secret and `ZERO_STUDIO_ACCESS_TOKEN` Vercel sensitive environment variable have not been created. The image API intentionally returns 503 until both are set to the same random value. Do not put the token in source code, GitHub, or chat.
- The latest Vercel staging deployment is READY at commit `c858ff98`; live checks confirmed HTTP 200 for the app root, the new image panel and Raster import controls are present, and GET `/api/images` returns the expected 405 (POST-only route).
- No paid plan, payment method, credit purchase, GPU rental, or fallback provider was used. PR #6 remains open/unmerged; no primary production deployment or merge was performed. The 24 independently drawn images/second target is unchanged.

---

# Cloud inference Worker deployment milestone — 2026-11-20

- Deployed the real source from `cloudflare-worker/src/index.js` on branch `feat/hybrid-human-art-pipeline` to the existing Cloudflare Worker `zero-studio` through the connected Cloudflare account API. The earlier Dashboard Template `Hello world` implementation was replaced; the existing `workers.dev` service identity was preserved.
- Added the Workers AI binding `AI` to the deployed Worker. Verified through the Cloudflare API that the binding is present and the active deployment source is `api`.
- Added a public, non-secret `GET /health` response that reports whether the AI binding and private image endpoint configuration are present. The health check does not invoke image inference.
- Aligned `cloudflare-worker/wrangler.toml` Worker name with the existing deployed Worker: `zero-studio`.
- Added/updated tests for health behavior before private image credentials are configured. Latest Cloud inference worker tests passed on commit `7346da35`; Drawing engine tests also passed.
- The image endpoint remains intentionally unavailable until exact `STUDIO_ORIGIN` and private `STUDIO_ACCESS_TOKEN` are configured. No secret has been created or exposed, and no image inference request has been made.
- The known public test app URL in the README is `https://zero-studio-three.vercel.app/`, but it is a manually uploaded snapshot and the current app source does not yet call `/v1/images`. Do not assume the app integration is complete or expose a bearer secret in public client code.
- No paid plan, card, credit purchase, or provider fallback was used. PR #6 remains open/unmerged; no production app deployment or PR merge was performed. Budget remains $0; animation target remains 24 independently drawn images per second.

---
# Cloud inference architecture milestone — 2026-11-20

- Confirmed the active development branch is `feat/hybrid-human-art-pipeline`; PR #6 remains open/draft and unmerged.
- Added `docs/CLOUD_INFERENCE_ARCHITECTURE.md`: Android is the control/review device; GitHub is source control, not GPU inference; static hosting and remote inference are separate services.
- Added current provider research to `docs/IMAGE_PROVIDER_EVALUATION.md`.
- Cloudflare Workers AI FLUX.1 Schnell is the first candidate for a secured API feasibility prototype: official docs list 10,000 free Neurons/day on Workers Free, with model-specific image-generation charges. It is general-purpose, not accepted as anime-quality yet.
- Hugging Face Anima ZeroGPU remains a limited non-commercial anime visual benchmark only; the model's non-commercial license is separate from the Space code license.
- Colab/Kaggle are classified as manual experiment/training workspaces, not stable production endpoints.
- Clarified the README that old no-generation restrictions are historical and superseded by D-026.
- No Cloudflare/Hugging Face account was created or connected; no API token/secret was entered; no model request was run; no provider was selected; no app code or production deployment was changed.
- Next gate: verify Cloudflare account prerequisites and free-plan setup, then build and test a quota-safe Worker prototype before connecting the studio UI.
- Budget remains exactly $0. No paid plan, credit purchase, GPU rental, trial-based dependency, or automatic paid fallback is allowed.
- Animation target remains 24 independently drawn images per second; free daily inference quotas do not make continuous 24-image/second generation feasible.

---

# ZERO STUDIO — Project Status

Last updated: 2026-11-19 (UTC)

## Human-authored Raster-first studio direction — 2026-11-19

- Final backgrounds, characters, props and animation drawings must be authored through human pointer/stylus input. Generative image/video models are not allowed to create, alter, inpaint, or synthesize final artwork.
- The active drawing workspace opens in native Raster pencil mode. Gouache/ink/graphite multi-point strokes use a continuous pressure-shaped ribbon with variable edges and bristle tracks; watercolor remains a translucent wash and foliage uses directional leaf marks. These are foundational brush algorithms, not a professional natural-media engine.
- Old Gemini/SVG and mesh scene-generation controls are removed from the visible art department. Their legacy modules and hidden compatibility wiring remain temporarily, but they are not an approved final-art path.
- Native SVG remains optional, editable and first-class. Raster/vector layers coexist; imported images remain optional and no external painting app is a prerequisite.
- The immediate visual acceptance target is the user-supplied Japanese forest house: layered curved tile roof, timber/eaves, windows and balcony, dense varied foliage, stone retaining wall, sunlight and atmospheric depth. Path counts and passing unit tests do not constitute artistic acceptance.
- The animation target remains 24 independently drawn moving-art drawings per second. Fixed backgrounds may be reused while the camera remains fixed.
- Physical Android stylus/touch testing, natural-media simulation, visual acceptance, memory benchmarks and lossless package round-trip remain unverified. No PSD/ORA support is claimed.
- Work remains on PR #6's isolated branch; no merge to `main` and no production deployment.

Last updated: 2026-11-19 (UTC)

## Preview deployment and live Gemini acceptance — 2026-11-19

- Created an isolated Vercel preview deployment for the 19 static application files from commit `01638713b846da04682867712301b574eec25523` (branch `feature/fixed-background-visual-review`) in existing project `zero-studio`; no production target or custom domain was assigned.
- Preview URL: https://zero-studio-d7y2l6q77-studio-37a2.vercel.app/
- Deployment ID: `dpl_A7PRKxLy9K3A3oMidg37PfYiJSN8`; Vercel reported `READY`. Build log: 19 files downloaded, static build completed in 85 ms. The root page and app modules/styles/service worker/manifest returned successfully from the preview.
- Deployment was created from inline static files because Vercel's Git-source deployment endpoint repeatedly returned a GitHub API rate-limit 429. This preview is a snapshot of the application files at the commit above, not a live Git-linked auto-deploy.
- Added branch-scoped workflow `.github/workflows/gemini-visual-acceptance.yml` and Playwright runner `scripts/gemini-visual-acceptance.mjs`. It uses the existing repository Actions secret `GEMINI_API_KEY` without printing or persisting it; runs the actual seven-layer SVG artist and Gemini inline-PNG visual reviewer against three original scene briefs; and uploads PNG previews plus JSON critique reports as a 30-day artifact.
- First visual workflow attempt (#1) stopped before making Gemini requests due to a malformed score-parsing regex in the test harness. Corrected the regex in commit `01638713b846da04682867712301b574eec25523`. Second visual workflow attempt (#2), run ID `44514892131`, is in progress at the browser-install step at the time of this update; no visual scene results are claimed yet.
- Latest engine test run #1299 passed all 186 tests with 0 failures on the current branch head at that time.
- Remaining: complete the three live Gemini runs, inspect their PNGs and critique JSON, and if desired later deploy the latest exact branch head to a refreshed preview. No production deployment, alias, or `main` branch was changed.

## Fixed-background animation and visual-review gate implementation — 2026-11-19

- Implemented on the isolated branch `feature/fixed-background-visual-review`, based on `feature/mobile-drawing-workspace`. The existing PR #1 and `main` were not modified or merged.
- Added a project-level `animationBackground` asset. The Android workspace now offers **"اعتماد الإطار الحالي كخلفية ثابتة للحركة"**: it copies the current editable vector layers into a separately persisted, locked background asset and clears the current frame to receive moving artwork.
- The fixed background is rendered beneath every frame, timeline thumbnail, playback frame, and exported SVG/ZIP frame. The background remains a separate editable vector asset in the `.zero` project and is normalized/validated on project reopen (unique layer names, layer/operation limits).
- Animation plans now record `backgroundMode`. When a fixed background exists, the batch prompt requests only moving characters/foreground elements, requires `role: "moving"` on each returned layer, and forbids redrawing static architecture/sky/road/trees. The importer rejects layers without that role and rejects moving frames with fewer than eight vector operations. Frame signatures continue to reject duplicate moving drawings. The original 24 independently drawn moving frames/second requirement is unchanged.
- The onion-skin overlay deliberately excludes the fixed background so an unchanged background is not ghosted over itself.
- Tightened the 2D visual-review gate: Gemini receives the actual temporary PNG preview as inline image data; a reviewer failure aborts the proposal instead of allowing approval. The 2D proposal's approve control is enabled only when the final critique scores at least 8/10, says it reads as 2D anime, and reports no critical issues. Two bounded artist/reviewer passes remain the maximum for this UI action.
- Added regression coverage for background persistence/compositing, moving-only prompt and layer-role validation, Gemini inline-image transmission, and UI quality gating.
- **Verified:** GitHub Actions run #1295 passed all **186 tests, 0 failures**, including JavaScript syntax checks, on commit `0ceb6b92a0efdae4cf1407a1fee1334b6e9c5363`: https://github.com/laracheinarave4675-max/zero-studio/actions/runs/44514376602.
- **Not yet verified:** live Gemini image-review behavior with the user's API key, whether critique-guided revisions materially improve a real scene, the artistic quality of generated outputs, Android touch/performance, and physical-device project round-trips. This implementation is a structural milestone, not proof of reference-level artwork.
- **Deployment:** no Vercel deployment was changed. The public URL remains the previous manual snapshot and does not yet include this branch's changes.

## Approved cinematic anime art direction and new visual-review workflow — 2026-11-19

- The user approved the 2D-first cinematic anime target with selective 3D support. Final artwork must read as richly painted 2D anime, not low-poly 3D, flat clip-art, or generic geometric illustration.
- The user approved the standard anime production split: a fixed-camera background is painted once as a layered editable vector asset; characters and all moving foreground elements are independently redrawn at 24 unique drawings per second. Every visible timepoint is the composite of the approved static background plus that timestamp's new moving artwork. Reused background pixels/paths do not count as new animated drawings. Moving elements may not be replaced with raster transforms, duplicated frames, video, or tween-only motion.
- The user approved a visual critique-and-revision workflow. SVG is rasterized only into a temporary preview; a vision-capable reviewer receives the actual preview, critiques composition/perspective/architecture/foliage/materials/light/atmosphere/linework, and returns corrections that are fed back into the editable vector artist. Raster previews are not final artwork.
- Raster texture layers in final artwork are deferred. The current milestone remains vector-first with gradients, patterns, organic paths and bounded SVG effects.
- Durable decisions recorded in D-018, D-019 and D-020 in DECISIONS.md. The art-direction bible is docs/ANIME_ART_DIRECTION.md.
- The existing 2D local painter in app/anime-background-painter.mjs can render three distinct editable scene studies (urban store, rural ramen shop, forest house) with multiple layers and detailed organic vector marks. It is a procedural prototype with authored scene layouts, not yet a fully general scene-understanding painter and not proof of reference-level quality.
- app/scene-production.mjs now includes a vision-review adapter that sends an actual PNG preview to Gemini and validates a structured critique. It falls back to another allowlisted Gemini model when the primary model hits either English or Arabic quota/rate-limit errors. The 2D artist accepts critique-guided revision instructions on its layout and layer prompts. It validates path geometry during generation and retries invalid layers with exact coordinate feedback; sky and distant-background layers have a wider clipped bleed allowance than foreground geometry.
- app/app.js now creates a temporary PNG preview from the seven editable SVG layers, sends it to the visual reviewer, and performs one corrective redraw when needed. It presents the score and leading critique points before the user approves the proposed vector layers. This preview is inspection-only and does not enter the final project as raster art.
- The PWA shell cache is now v30 so Android devices fetch the revised artist and review logic.
- scripts/run-gemini-2d-anime-tests.mjs now runs three separate Gemini 2D scene briefs, renders temporary previews, performs up to three critique/revision passes, and exports editable .zero projects, SVGs, PNG review previews, and critique reports. .github/workflows/cinematic-scene-artist.yml runs this test and installs @resvg/resvg-js only in CI.
- A stale fixture in tests/anime-vector-artist.test.mjs was corrected so the layout-repair test recognizes the actual repair prompt. New tests cover image-preview transmission, critique validation, and critique-guided redraw prompts.
- **Not yet verified at this update:** the new GitHub Actions run, whether Gemini 3.5 Flash Lite accepts image inputs in this project/region, the three generated scenes' visual quality, and whether critique-guided revisions improve the images. Do not report the artist as reaching the target until the generated previews are actually inspected.
- **Still pending:** implement the static-background plus independently drawn moving-layer contract in app/animation-production.mjs and the batch importer; connect vision review to the interactive Android artist workflow; visually inspect all three real Gemini outputs; refine the 2D painter based on the actual defects; and verify physical Android performance.

## Artistic validation findings and alternate native-SVG model tests — 2026-11-19

- The full automated test suite now passes **181 tests, 0 failures** on commit `c0ffee98a0c3ab871760698960ba7781c07df697`.
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


## Approved hybrid raster/vector direction — 2026-11-19

- The user approved a new hybrid architecture: human-painted layered Raster is the primary route for final art; native SVG remains optional, editable, and first-class. Existing SVG projects/tools/exports must continue to work; no bitmap-only replacement is authorized.
- D-023 was added and supersedes the vector-first requirements of D-012, D-020, and D-022 where they conflict. Earlier decisions remain historical context; D-023 governs current architecture.
- Added docs/HYBRID_ART_ARCHITECTURE.md and docs/LAYERED_ASSET_INTERCHANGE.md. Updated the human art workflow and animation production contract to describe mixed raster/vector assets.
- Created isolated branch feat/hybrid-human-art-pipeline from commit 1e533c13f0e5524a3c63f4d9b6ac6580487b0bfb. No merge to main and no production deployment were performed.
- First code foundation: app/hybrid-assets.mjs validates typed raster/vector layer manifests, source references, dimensions, sizes, opacity, blend modes and mixed layers; it also computes mixed-layer structural frame signatures and enforces the 24 FPS cadence setting. tests/hybrid-assets.test.mjs covers this contract.
- **Not yet implemented:** actual PSD/ORA/PNG-layer archive decoding/import, preservation of source package bytes, raster layer storage inside .zero, mixed raster/vector rendering/compositing/export, integration with the existing frame/batch importer, and physical Android round-trip.
- **Next gate:** identify the painting app actually available on the target Android phone, create the three-layer proof document, inspect its real exported package, then implement only the proven interchange format. Do not claim format support until tests pass.
- The 24 independently authored moving-art drawings/second target is unchanged. Raster and vector can both represent a drawing; duplicates, tween-only motion and transformed stills do not count.
- Current code tests have not yet been run on this branch after these changes. No test result is claimed in this status entry.

## First raster-layer engine integration — 2026-11-19

- Added native raster layer support to the existing .zero frame engine while preserving the existing vector layer representation and SVG tools.
- Raster layers store an embedded PNG/WebP/JPEG data URL, pixel dimensions, visibility, opacity, blend mode, lock state, and a stable layer ID. The project normalizer validates the payload and preserves it across JSON save/open normalization.
- The existing SVG compositor now emits an embedded SVG image element for raster layers; vector layers continue through the original path/mask renderer. Mixed frames therefore remain layered rather than being flattened.
- Added createRasterLayer and addRasterLayer engine APIs.
- Added tests/raster-layer-engine.test.mjs for mixed-layer persistence, SVG compositing, and invalid raster input rejection.
- Latest implementation commit: 145fa6704a4cc47ee26ee2f005618bdf835de837.
- NOT YET VERIFIED: CI on this commit, actual image-file picker/import UI, large-image memory behavior, Android save/open on-device, PSD/ORA decoding, and a visual human-painted sample. No image-generation model creates or modifies the artwork.
- No merge to main and no production deployment were performed.

## Raster import UI integration — 2026-11-19

- Connected the raster engine to the Arabic mobile workspace: the Layers panel now includes an image import control accepting PNG, WebP, and JPEG up to 16 MiB. The browser reads the selected file, validates its decoded dimensions and type, and inserts it as a separate editable/reorderable raster layer.
- Mixed raster/vector frames persist through the existing .zero JSON project save/open path and are composited into SVG output without flattening the source layer records.
- Updated the PWA shell cache from v31 to v32 so Android browsers fetch the new controller and engine modules.
- Current branch head at this update: 55e2e4b6bd3152df0c31d1a853e13e7333124e45.
- Added engine regression tests, but GitHub Actions results for this exact head have not yet been returned by the available commit-run query. Treat automated test execution as pending; do not claim green CI.
- PSD/ORA archive decoding, high-resolution memory optimization, image crop/transform UI, physical Android testing, and artist-supplied sample review remain pending. No merge or production deployment.

## Raster editing safety and regression workflow — 2026-11-19

- Corrected raster preview scaling to preserve source image aspect ratio inside the 1920×1080 canvas.
- Layer list now visibly distinguishes raster image layers from SVG/vector drawing layers.
- When the selected active layer is raster and the user begins a pen/shape/eraser gesture, the editor creates a new vector layer above it before recording operations. This prevents invisible/lost vector operations from being appended to a raster layer. Command-based path insertion follows the same rule.
- Added an assertion that raster SVG output preserves aspect ratio.
- Added `.github/workflows/hybrid-raster-tests.yml`: Node 22 syntax checks and the full native Node test suite run on pushes to this feature branch and pull requests.
- Latest branch head at this update: c31320bc155cd00ddf41aea64590c8367891d4e8.
- GitHub commit-run/status queries currently return no run/status records for this head; CI execution is therefore **unconfirmed**, not green.
- A Vercel preview creation was attempted twice but the Vercel API returned HTTP 429 (GitHub API rate limit exceeded); no new preview deployment was created. Existing production aliases were not changed.
- Still pending: PSD/ORA decoding, raster transform/crop controls, memory/performance testing on large images, real Android save/open, and human-art visual acceptance. No merge to main and no production deployment.

## First authored visual sample and CI failure fixes — 2026-11-19

- Added `samples/first-hand-authored-anime-background.svg`: a 1920×1080 layered SVG illustration of a Japanese old-bookshop street at blue hour. The source is manually authored SVG geometry, gradients, and grouped editable elements; no image-generation model was used to create or modify its artwork.
- Corrected three test assertions discovered in workflow run 44552956563: update the expected PWA cache version from v31 to v32, assert legacy vector-layer operations are preserved (the existing vector schema does not carry `type: vector`), and match the actual Arabic dimension-validation message.
- The run had 200 tests: 197 passed and 3 failed, all three failures were assertion/schema expectation mismatches. The corrected test commit is `7e46510851e1365a0c11dc2354224311d305de9d`; the sample artwork commit is `fde10e87c895d50d8591a7838e791e677be0d8f2`.
- No subsequent successful run has been confirmed yet. The sample is an initial authored scene, not yet artist-approved final anime quality; physical Android preview and raster-import round-trip remain unverified.

## Verified CI result — 2026-11-19

- GitHub Actions run `44553810365` on commit `f23ae88c0205a03359d5ffb8417582e17ae26f2c` completed successfully.
- Node 22 syntax checks passed for application modules and `app/app.js`.
- Full native test suite: **200 tests passed, 0 failed** (run duration about 6.7 seconds).
- A new Vercel preview deployment was retried for this verified commit, but Vercel again returned HTTP 429 rate limiting. No preview deployment was created and production was not changed.
- The authored sample SVG is available at `samples/first-hand-authored-anime-background.svg`.


## Native Raster brush engineering — 2026-11-19

- Added `app/raster-brushes.mjs`: deterministic dab interpolation and Canvas2D pixel rendering for graphite, ink, gouache-like, watercolor-like and foliage brushes.
- Added dedicated Arabic UI controls for Raster pencil/Raster brush, brush material, opacity and texture; existing vector pen remains unchanged.
- Raster brush gestures now create a transparent PNG layer when needed and commit painted pixels into the selected Raster layer rather than SVG paths.
- Imported images are painted in their true pixel coordinates while respecting aspect-ratio letterboxing.
- Large Raster document undo history is bounded to reduce memory exhaustion; a 16-megapixel working-area guard prevents unsafe canvas allocation.
- Automated regression tests cover brush dab determinism, pressure response, invalid inputs, pathological stroke caps, canvas context drawing and source-image coordinate mapping.
- Important limitation: these are textured dab brushes, not yet simulated wet pigment or a professional paint engine. Android hardware testing and visual artist acceptance are still pending.


## Diagnostic follow-up — 2026-11-19

- GitHub access diagnosis: PR #6 and branch `feat/hybrid-human-art-pipeline` are present and readable. Both the branch ref and exact prior head SHA `b8423635588cd1d6aa19d96b6cbbf47dfd27a589` now successfully resolve `samples/first-hand-authored-anime-background.svg` and `app/raster-brushes.mjs`. Therefore the earlier 404 was transient or caused by the earlier request/path context; the available evidence does not isolate a more specific root cause. It was not evidence that the repository or branch had disappeared.
- Current PR #6 head remains `b8423635588cd1d6aa19d96b6cbbf47dfd27a589`; PR remains open, draft, and unmerged.
- Confirmed GitHub Actions run `44568385952` completed successfully. Its `node-tests` job passed both application syntax checks and the complete native Node test command. This is code-level validation only, not visual or Android acceptance.
- Visual diagnosis: the committed sample `samples/first-hand-authored-anime-background.svg` is an evening Japanese bookshop street, not the requested forest-house reference. Its tree crowns use a small number of circles and the architecture is largely broad filled polygons. It therefore cannot be treated as the requested detailed painterly forest-house result.
- The current Raster brush module is a foundational Canvas2D stroke renderer (pressure-shaped ribbons, bristle tracks, wash and leaf marks), not a full natural-media engine. The existence of the brush module and passing unit tests does not prove a professional painterly result.
- Next acceptance gate: create and inspect the actual forest-house scene against the user's reference; verify organic foliage, curved layered roof tiles, timber construction, glazing, balcony, stone retaining wall, light and depth. Do not mark the artwork accepted based on source complexity, path counts, or test results. Keep PR isolated; no merge or production deployment.

## Forest-house artwork study — 2026-11-19

- Added `samples/forest-house-canopy-study.svg` on the isolated hybrid branch. It is a new 1920×1080, self-contained, editable SVG study composed of twelve named scene groups: atmosphere, forest trunks, distant canopy, stone wall, house structure, upper story, ground floor, curved roof, timber eaves, garden, foreground canopy, and light accents.
- The authored scene includes a curved layered tile roof, timber framing, upper glazing and balcony rails, sliding ground-floor doors, varied foliage clusters, stone retaining wall, garden path, sunlight and atmospheric depth.
- Added `tests/forest-house-artwork.test.mjs` to check scene dimensions, required named groups/material definitions, self-contained assets, and minimum path detail.
- Artwork commit: `c576f50dd6b9e5df0256f39be80741a7bb837cfb`. Structural test commit: `22c518e9a54382e69ca65a98d8509b88858e6306`.
- This is a hand-authored vector study, not a raster-painted final background and not yet visually rendered/inspected on an Android device. It does not establish professional painterly quality or artist acceptance. The native raster brush remains a foundational tool.
- CI for these latest commits has not yet been confirmed. No merge to main and no production deployment.


## Natural-media stroke refinement — 2026-11-19

- Updated `app/raster-brushes.mjs` on the isolated PR #6 branch (commit `62fbcf00df8f44699bf5f2c75c817022c6f5ad42`). The pressure-shaped ribbon now uses correlated edge variation rather than only a smooth two-edge contour, adds restrained pigment-edge accumulation, and renders broken, irregular bristle lanes to suggest dry-pigment skips and directional brush loading.
- This is a focused improvement to the human-operated raster stroke primitive. It does not establish wet-pigment mixing, true watercolor diffusion, professional brush-tip dynamics, or reference-level anime painting quality.
- The commit was confirmed on `feat/hybrid-human-art-pipeline`. A new automated test result and visual Android inspection have not yet been confirmed; do not report this refinement as accepted until both code regression tests and an actual painted study are reviewed.
- Next drawing-only gate: refine the watercolor and foliage material behavior, then paint the forest-house reference as a complete layered still and inspect the rendered result at full resolution. No animation, production-management, or deployment work is included in this milestone.

## Watercolor and foliage material pass — 2026-11-19

- Reworked the watercolor brush to lay down a connected translucent wash with irregular edge pigment, overlapping blooms and sparse deterministic granulation instead of relying only on a sequence of round stamps.
- Reworked foliage marks into varied directional leaf shapes with per-leaf color variation, central veins, and occasional companion leaves for clustered canopy texture.
- Added regression tests for connected watercolor wash behavior and deterministic foliage variation.
- Corrected pigment-edge accumulation so the two sides of a stroke are rendered independently rather than joined by a zig-zag line.
- Commits: `c2ff78d989a58b06864bf2be4b12ffa550b1c93e`, `9196c338397abd85dbb1784ba85041635cb176e5`, `1567e6355021572ba041420d9a7e6039c7357a9a`.
- The changes are committed to the isolated `feat/hybrid-human-art-pipeline` branch. GitHub Actions results for these exact commits and visual inspection on Android have not yet been confirmed. These are brush-engine improvements, not evidence that the reference-level forest-house painting has been achieved.
- Next art-only gate: inspect actual rendered watercolor and canopy strokes at full size, tune material behavior against the forest-house reference, and build a complete layered background study before expanding scope.

## CI diagnosis and foliage cluster refinement — 2026-11-19

- Inspected failed GitHub Actions run `44585994842`: syntax checks passed; 213 of 214 native tests passed. The sole failure was a false-positive assertion in `tests/forest-house-artwork.test.mjs`: it rejected the standard SVG namespace URI `http://www.w3.org/2000/svg` as a remote asset.
- Corrected the assertion to reject only external `href`, `xlink:href`, or `src` references. Commit: `19b6b9ae30e8f48eead3855abaccb4449ba584a5`.
- Refined `paintFoliageLeaves` to create deterministic companion leaves with actual scaled geometry, branch offsets, and contrasting green tones. Removed an unused scale calculation from the previous implementation. Commit: `3be9e4d0f767dbb2fa8bc97142e91472e92b40b6`.
- The corrected test has not yet been confirmed by a new successful CI run. Do not mark CI green until a run for the updated branch is visible.
- Artistic limitation remains: these are brush-renderer improvements and an editable SVG study, not yet a visually accepted, painterly raster reproduction of the user's reference.

- Follow-up GitHub Actions run `44586260671` on commit `19b6b9ae30e8f48eead3855abaccb4449ba584a5` completed successfully: syntax checks passed and all 214 native tests passed (0 failures).
- Subsequent foliage-cluster refinement commit `3be9e4d0f767dbb2fa8bc97142e91472e92b40b6` and added cluster-shape assertion `28eb47fed11f2a99edbccc116c1ebbc8107d2e56` are newer than that green run. No CI run for those later commits is currently visible; latest foliage changes therefore still need a fresh CI confirmation.

## Native Artist Engine — absolute no-generation confirmation (2026-11-19)

- User explicitly reconfirmed: **generative image and video models are prohibited entirely**, including helper-only or hidden generation paths. Binding decision recorded as D-024 in `DECISIONS.md`.
- Added `docs/NATIVE_ARTIST_ENGINE_PLAN.md` with staged implementation and visual acceptance gates: stroke dynamics, brush materials, layer compositing/masks, Android memory/input reliability, and a complete human-painted forest-house proof.
- Implemented deterministic per-stroke blend modes in `app/raster-brushes.mjs`: normal, multiply, screen, overlay, darken, lighten. The Raster brush panel now exposes the choice in Arabic; the selected mode is passed to the actual Canvas2D stroke renderer. Erasing always overrides blend mode with destination-out.
- Added regression tests for all supported stroke blend modes, invalid modes, and eraser precedence.
- Commits: `cacd5b7d0849d21d0098e778b1043ccbbb20067d`, `7652f365a49cc4c8a8bee8b6721a8f7b7f276079`, `7c1a29f6315577df89b8800fd58f884ef4606f67`, `a9cd7d6e3de6897052442bd62204e79509d2bc5e`, `bcc3994f39f2afb04e6f113191ec6be069f73966`, `491010a654dc2de71d442771487b1062efdf2840`.
- GitHub Actions has not yet returned a run for the latest application commit; do not claim the new tests are green until that run is inspected.
- Artistic acceptance remains open. These blend modes are compositing primitives, not pigment simulation or proof of reference-level painting. Physical Android testing and full-scene human-painted review remain required.
- Work remains isolated on `feat/hybrid-human-art-pipeline`; no merge to main and no production deployment.

- CI verification for the application changes completed successfully in GitHub Actions run `44587978596` (#79): syntax checks passed and all `216/216` native tests passed, 0 failures. This run includes the brush compositing implementation and Arabic UI control. The subsequent status/decision documentation commits do not change application code.


## New hybrid anime production direction approved — 2026-11-20

- User approved a fundamental shift to a hybrid studio architecture: a specialist image-generation model/service may create anime character, background, prop, and scene artwork; ZERO STUDIO remains responsible for character identity/continuity, scene preparation, asset management, animation planning and control, compositing, audio, and final delivery.
- Recorded the full governing plan in `docs/NEW_HYBRID_PRODUCTION_DIRECTION.md` and decision D-026 in `DECISIONS.md`. The README now points to this as the current direction and labels older no-generation restrictions as historical/superseded.
- No provider has been selected or connected yet. LoRA training and wholesale engine rewrites are deferred pending codebase audit and provider evaluation.
- The 24 independently drawn images/second target remains unchanged. Android-first workflow, free-first evaluation, visual acceptance, source preservation, and no merge/deployment without explicit approval remain in force.
- Next implementation milestone: audit existing code and provider research, compare specialist models/services (quality, reference control, API, Android workflow, quotas/cost, rights, privacy), then build a small visual proof before integrating further.


## Initial image-provider and codebase audit — 2026-11-20

- Added `docs/IMAGE_PROVIDER_EVALUATION.md` with an initial, source-linked comparison of OpenAI GPT Image 2.6, Google Gemini 3.1 Flash Image, and Black Forest Labs FLUX 3 / FLUX 3 Klein. No provider is selected or connected.
- Initial published 1K output prices vary materially: FLUX 3 Klein $0.009/image, GPT Image 2.6 sample calculator estimate $0.02469/image, FLUX 3 Image $0.048/image, and Gemini 3.1 Flash Image $0.067/image. Under a literal 24-new-images/second assumption, a 20-minute sequence of 28,800 outputs would cost approximately $259, $711, $1,382, or $1,930 respectively before retries and input-reference charges. This is a cost model, not an approved production plan.
- First code inspection: `app/scene-production.mjs` uses Gemini `generateContent` to request editable SVG operations; it is not a native image-generation adapter. `app/app.js` currently presents this as an SVG proposal workflow with approval/rejection. `app/anime-background-painter.mjs` remains a procedural path/shape scene painter.
- Existing Canvas2D raster brushes, vector tools, project/layer model, timeline, compositor, and approval flow are potential reusable foundations. A deeper dependency and import/export audit is still required before modifying or retiring any module.
- The former SVG provider research has been marked historical and points to the new evaluation. No image-generation API key has been added, no provider has been connected, and no image has been generated as part of this code audit.
- Next: complete the repository dependency/security audit, verify each candidate's reference-image behavior and terms, then run the same background and character-sheet test brief against shortlisted models before choosing one.


## Zero-budget constraint confirmed — 2026-11-20

- User explicitly confirmed that ZERO STUDIO has a hard total budget of $0. Paid APIs, inference credits, subscriptions, GPU rentals, paid hosting, required payment cards, and automatic paid fallbacks are out of scope.
- Updated the governing architecture and provider evaluation with a free-first strategy. Hugging Face ZeroGPU is a limited experimental route: official docs currently state 5 minutes/day for free accounts, shared queues, and free use of existing ZeroGPU Spaces. This is not unlimited production compute.
- Anima is a promising anime-focused model for tests, but its model card shows a non-commercial license; do not use it for commercial production unless terms are separately cleared. Z-Image-Turbo is marked Apache-2.0 but is not yet shown to meet the anime quality target and still needs GPU compute.
- No paid provider has been selected or connected. No account was created and no service was called to generate images. The next proof should use existing free public Spaces, if available, with a small repeatable background and character-sheet test.
- The 24 independently drawn images/second goal remains unchanged; do not pretend limited free quotas can generate it continuously. Report constraints honestly and preserve the zero-dollar gate.


## Digital Artist eye reliability update — 2026-11-21

- Tightened identity and palette comparison: every landmark and named color in the approved reference must be present in the current drawing. Missing features are reported and force a failed comparison rather than being silently ignored.
- Added regression tests for missing eye landmarks and missing palette swatches.
- Branch `feat/digital-artist-engine` at `ce3651bdbdfda6678eb10d4b7fc72d7b4b21eb4d` passed 381/381 Node tests. Drawing engine runs #2490 and #2491 succeeded; Hybrid raster/SVG run #659 succeeded, including the Canvas2D portrait renderer and artifact upload.
- The existing eye panel still measures pixels, stroke geometry, region fills and approved anatomy guides. This update does not claim neural vision, automatic facial landmark extraction, model training, or professional visual acceptance.
- PR #14 remains Draft and unmerged. No production deployment; $0 budget maintained.


## Vision-to-drawing integration boundary — 2026-11-21

- Added `app/digital-artist-vision-contract.mjs`: strict provider-neutral validation for SHA-256-bound character references, subject/style/composition, normalized landmarks, bounded semantic regions, palette swatches, identity locks, and per-observation confidence.
- Added a drawing brief adapter that separates trusted observations from a human review queue. It deliberately creates no strokes and accepts no image payloads.
- Added regression cases for coordinate bounds, invalid digests/colors, duplicate IDs, low-confidence observations, control-character sanitization, and collection limits. The Drawing engine workflow now syntax-checks this module and runs the full `tests/*.test.mjs` suite.
- A live Qwen2.5-VL-3B-Instruct provider smoke test was attempted through the connected Hugging Face account. The provider returned HTTP 402 Payment Required. No inference ran and no image was analyzed. Do not retry this paid provider path under the project's hard $0 budget.
- SmolVLM-256M-Instruct remains a candidate for a genuinely free local/browser or public Space route, but no successful inference is claimed.
- Next: identify a zero-cost, no-card vision route; run it on an approved character reference; validate its structured observations; then implement a separate geometry planner that produces only native Canvas2D brush commands. Human review remains mandatory.
- No production Worker changes, no paid fallback, no PR merge, and no production deployment.


## Vision-to-native-brush planner milestone — 2026-11-21

- Added `app/digital-artist-vision-brush-planner.mjs`: converts validated, confidence-filtered vision observations into the existing Digital Artist brush-plan schema.
- High-confidence landmarks become small editable graphite crosshair strokes on the construction layer.
- High-confidence semantic regions become native raster region-fill operations, assigned to semantic layers (flat color, shadow, highlight, detail) and colored from matching palette labels when available.
- The resulting plan is passed through the existing `validateDigitalArtistBrushPlan` gate and can be compiled by `compileDigitalArtistBrushPlan` into the native Canvas2D command stream. It carries the reference digest and optional character asset ID.
- Added regression coverage for native command compilation, confidence gating, human-review defaults, and semantic layer ordering. The Drawing engine workflow syntax-checks the planner.
- Important limitation: current region geometry uses rectangular bounding-box approximations; landmarks are crosshair guides. This is not segmentation, organic contour tracing, an AI vision inference, or a finished anime portrait. A human must approve the plan before execution.
- No successful external vision inference is available. Hugging Face's Qwen provider and sandbox attempts returned HTTP 402, so no paid route is used. Model integration remains pending a verified free inference path.
- The GitHub Contents API commits made during this pass have not triggered a fresh Actions run. Do not claim the new planner tests passed in CI until a run on the latest branch head is observed.
- No production Worker changes, no paid compute, no PR merge, and no production deployment.


### Vision bridge UI — 2026-11-21

- Added a Vision Report input to the Digital Artist panel. Users can paste a validated ZERO STUDIO vision JSON report and convert it into the existing brush-plan editor.
- The generated plan remains a draft. The Execute button is disabled until the user explicitly checks the approval control; loading the fixed brush demo returns to the normal manual execution flow.
- The UI explains that this does not yet analyze an image and that region boxes are approximate. No image is uploaded or sent to a model by this bridge.
- This connects the report validator → geometry planner → existing brush-plan editor → native Canvas2D executor as a usable manual pipeline, while actual model inference and organic contour extraction remain unfinished.


### Free browser vision route — 2026-11-21

- Identified the official `HuggingFaceTB/SmolVLM-256M-Instruct-WebGPU` Space, which is listed as Running and uses a static browser app for the SmolVLM-256M-Instruct model. This avoids the paid hosted inference provider path; model inference is intended to run on the user's browser WebGPU device.
- The Digital Artist panel now links to that Space, supplies a structured anime-reference prompt, and lets the user paste its JSON observations back into ZERO STUDIO.
- The user uploads the same reference image into ZERO STUDIO. The app computes its SHA-256 digest locally with Web Crypto and binds the report to that exact file before accepting the observations. A supplied digest mismatch is rejected.
- The generated plan remains an unapproved draft until the user checks the approval control. The report-to-plan step still uses bounding-box approximations and requires visual review.
- This is a manual browser handoff, not an embedded model runtime or automatic Space API connection. The Space may require initial model downloads and a WebGPU-capable browser/device; mobile performance and inference quality have not yet been validated on the user's Android device.


### Raster proof visual inspection — 2026-11-21

- Downloaded and opened the CI portrait proof artifact from run `44941260537`. It contains a 1920×1080 composite PNG, seven separate raster layer PNGs, and the machine-readable eyes/region report.
- Visual review: the fixture reads as a centered anime head-and-shoulders portrait with dark hair, facial features, brown eyes, and teal clothing. It is a coherent basic study, not yet a production-quality character illustration; hair shapes and face/eye construction remain simplified.
- The region audit lists eight fill groups; only one reports `passed: true`. Several other groups show incomplete interior coverage (approximately 49%–88%), while one eye-white group has about 3.1% outside leakage. This confirms the quality eye is catching real fill defects rather than merely reporting success.
- Next visual-engine improvements should target closed contour accuracy and region coverage before adding more decorative detail.


### Organic vision contours — 2026-11-21

- Extended the provider-neutral vision report contract with optional normalized polygon contours for semantic regions (3–512 points), while retaining legacy bounding boxes for backward compatibility.
- Contour validation now checks normalized coordinates, consecutive duplicate points, measurable polygon area, containment inside the declared region box, and proper self-crossings.
- The vision-to-brush planner now converts supplied contours directly into native raster region-fill polygons; it only falls back to a rectangle when no contour is present and emits an explicit warning in that case.
- Updated the SmolVLM handoff prompt to request organic region outlines (8–64 points) for face, hair, eyes and clothing. These remain approximate model observations and require human review.
- Added regression tests for contour preservation, invalid/degenerate/self-crossing/out-of-bounds contours, polygon-to-raster coordinate conversion, and legacy rectangle fallback.
- Important verification limit: these commits were made through the GitHub Contents API; no fresh Actions run has yet been observed for this head. The latest verified green Actions runs remain on the earlier documented commit. No latest-head test pass is claimed.
- Vercel's most recent listed preview for this branch still points to an earlier commit, not this contour update. No production deployment or merge was performed.


### Contour bridge CI verification — 2026-11-21

- The first contour CI run on the intermediate head exposed that the drawing brief dropped the validated contour before the planner received it. The contract mapping was corrected in commit `37079202fc3db8564b06c6ffe0ce78352eda26c3`.
- On that corrected head, Drawing engine workflow run `44942052300` passed all **402/402 tests**; Hybrid raster/SVG workflow run `44942052319` passed, including syntax checks, full native tests and the raster-brush/portrait proof job.
- The contour-specific tests now cover polygon preservation, zero-area and duplicate-point rejection, self-crossing and out-of-box rejection, contour-to-canvas coordinate mapping, and legacy rectangle fallback.
- The Vercel preview listing still points to commit `37668ff3bff28d790c3a913d9fd0175fcb66d6a0`, not the contour implementation. The latest code is in the open Draft PR; no deployment, merge or production change has been made.

## D-032 evidence-led artist progression ledger — 2026-11-21

- Added `app/digital-artist-learning.mjs` and `tests/digital-artist-learning.test.mjs`.
- Assessment entries require a stable unique ID, a SHA-256 inspection-report digest, and 3–32 distinct measured pass/fail checks. Scores are computed from the checks rather than accepted as caller-supplied percentages.
- A skill requires three consecutive assessments at or above 85%, plus mastery of every prerequisite, before it is labelled mastered. The evaluator follows the curriculum prerequisite order.
- The next-practice recommender selects the weakest currently available skill and returns its lessons, exercises and metrics.
- The ledger is bounded to 500 assessments and rejects duplicate IDs, unknown skills, malformed digests and invalid checks.
- Important boundary: this is evidence-led progress tracking, not neural-network training or autonomous self-learning. It does not edit artwork, verify the contents of the referenced report digest, or approve strokes. App UI/persistence integration is still pending.
- New tests were added, but no GitHub Actions run was returned for the latest branch commit at the time of this update; do not treat this milestone as CI-verified yet.
- PR #14 remains draft, unmerged, and unpublished to production.


## D-033 project-persisted learning assessment loop — 2026-11-21

- Integrated the D-032 evidence ledger into the artist editor. The user can select a skill, run the local eyes on the current frame, then explicitly save a measured attempt.
- The editor currently records four metric-backed skill routes: head/face and body anatomy (require an approved Character DNA guide and at least three measured anatomy checks), flat-color groups (requires inspected region fills), and anime inking (measured operation presence, geometry warnings and path lengths).
- Assessment report JSON is SHA-256 hashed locally with Web Crypto. The attempt and its checks are saved in `project.artistLearning`; the project engine now preserves this field through normalization/import/export and rejects malformed ledger envelopes.
- The UI displays recorded attempts, mastered-skill count and the next recommended curriculum exercise. The record is project-scoped, not a cloud account-wide profile.
- Unsupported skills are deliberately refused rather than scored using unrelated measurements. This is an explicit user-triggered evidence ledger, not automatic neural training; the digest links to report content but is not a signature proving the report's truth.
- Added engine round-trip and editor-wiring regression tests. Latest code SHA before documentation reconciliation: `9e91959dc9b97c74820c1a16524f383234d01aec`. Connected Actions lookup returned no PR-triggered workflow runs for this SHA; CI is not yet verified.
- PR #14 remains draft, unmerged and not deployed to production. Android runtime and local model inference remain untested.


## D-033 live learning ledger integration — 2026-11-21

- Connected the evidence-led learning ledger to the live Digital Artist inspection panel and native project state (project.artistLearning), so attempts survive project JSON save/load and undo snapshots.
- Added a progress summary, next-practice recommendation, and recent assessment history to the editor.
- An assessment can only be recorded after inspecting the current frame. The report is canonically serialized and SHA-256 hashed before the ledger records it.
- Important evidence gate: only skill families with direct current measurements can be assessed from this panel: head/body anatomy against a non-skipped Character DNA comparison with at least three measurements; inking from measured brush operations and stroke warnings; flat colors from inspected closed raster fills and explicit coverage/leakage thresholds. Other curriculum skills are rejected rather than assigned fabricated scores.
- The assessment button requires an explicit user action. Recording a result does not edit artwork, approve strokes, or train model weights.
- Added tests/digital-artist-learning-ui.test.mjs to verify the editor integration and truthful learning boundary.
- Verified that the app source imports the ledger, all four UI elements exist, and the project normalizer already preserves the artistLearning field. GitHub Actions results for the newest commits were not returned by the connected workflow-run lookup; CI status remains unconfirmed.
- Physical Android browser testing, model-backed vision inference, and actual artist-quality improvement remain unverified.
- PR #14 remains draft; no merge or production deployment.

## D-034 imported-ledger integrity and editor consolidation — 2026-11-21

- Consolidated the editor around one learning panel and one assessment-save handler. The current-frame eye report enables the assessment action; the user explicitly selects a skill and saves the attempt.
- Removed duplicate imports/handlers introduced during integration.
- Added deep validation for imported assessment entries: unique IDs, known skill IDs, SHA-256 digest format, 3–32 unique boolean checks, and recomputation of score/pass state from the checks. The project normalizer calls this validator, so a hand-edited JSON file cannot claim a mastery score that disagrees with its stored checks.
- This does not cryptographically prove that the report itself was honestly measured; it prevents simple score tampering and malformed records.
- Latest code SHA: `02cd7c8633852b92b9f61e792aa29e8024baeaab`. Drawing engine and Hybrid raster/SVG CI runs were queued for this commit; no pass result has been observed yet.
- PR #14 remains draft; no merge or production deployment.


## D-035 CI feedback and regression fixes — 2026-11-21

- The first integrated Actions run on `02cd7c8633852b92b9f61e792aa29e8024baeaab` completed with 409/413 tests passing. Syntax checks passed; the native raster portrait proof job passed.
- Four test failures were identified: an outdated flat-color correction assertion (expected 88% after the agreed threshold was raised to 90%), a recommender tie-breaking issue that preferred an untouched skill over a weak skill already practiced, an engine test expecting the previous validation error wording, and a DOM test detecting a duplicate temporary assessment button.
- Corrected all four causes: updated the 90% assertion, prioritize previously practiced but weak skills, aligned the engine test with deep validation, and removed the redundant temporary controls/handler/import in favor of the single canonical learning panel.
- Added deep imported-ledger checks and a regression test that rejects a forged score inconsistent with its stored pass/fail checks.
- Latest code/test commits after those fixes have not yet produced a retrievable Actions result. Do not describe the integrated suite as passing until a new run confirms it. The earlier run's renderer proof passed; the node test jobs failed.

### CI verification — anime drawing practice head `d58d2abf784044159467d4d6027dc4d350296bc4`

- Drawing engine run #2686 passed all 420 Node tests (0 failures), including the detailed anime study and UI integration tests.
- Hybrid raster/SVG run #747 passed all 420 Node tests (0 failures); the native five-brush proof and Digital Artist portrait render/artifact upload also succeeded.
- An earlier run caught a stale reference to a removed assessment button; the obsolete reference was removed before the passing runs.
- This confirms software contracts and renderer execution only. It does not establish professional anime drawing quality, autonomous neural learning, or Android device acceptance.

### Anime specialist eyes — D-034 (2026-11-21)

- Added `compareAnimeEyeDesign`: compares approved/current normalized landmarks for left/right eye width relative to face width, eye aspect ratio, eye slant, iris offset, pupil offset, approximate iris containment inside the eye outline, and eye-pair spacing.
- Added `compareAnimeHairFlow`: compares stable named hair clumps by root-to-tip direction and relative length against an approved model sheet; missing and unexpected clumps fail explicitly.
- Added focused correction rules that turn failed eye checks into eye/gaze exercises and failed hair-clump checks into hair-mass/flow exercises.
- Connected an Arabic editor panel for supplied reference/current landmark maps. The user can compare eye and optional hair geometry and see linked corrections.
- Comparison output explicitly identifies its scope: manually/model-reported normalized landmarks, not pixel-based landmark inference or automatic strand segmentation. It does not award mastery.
- Comparison results are included in the canonical inspection digest. The learning ledger still refuses eye/hair skill scoring until actual raster-linked evidence and trustworthy measurements are available.
- CI on commit `a19d0b94fcc42910dcb46b60821f4af64fef5a7e` exposed a syntax error in the new tolerance helper. It was corrected in subsequent commits (`f5db0fa`, `730a46e`, `04e09ea`, `8c1da74`). A fresh CI result for the corrected head is not yet available; do not claim it passes.
- No Android visual test, no autonomous model training, no PR merge, no production deployment, and no production Worker changes.

## Digital Artist completion pass — 2026-11-21 (face, contours, CI repair)

- Repaired a literal escaped-newline syntax defect in the anime-eye comparison module. The defect had blocked the full test suite and deterministic portrait renderer.
- Tightened all anime-eye tolerance options to reject non-finite values instead of allowing NaN to silently bypass comparisons.
- Added character-specific anime face proportion comparison for face aspect, cheek width, jaw width, lower-face ratio, nose/mouth levels, mouth-to-chin spacing, brow-to-eye gap, and eye spacing. It compares against each character's approved landmarks and does not impose a universal anime template.
- Connected face comparison to the Arabic Digital Artist review panel and mapped failed measurements to actionable head-and-face exercises.
- Vision contours supplied in a validated report now generate both polygon region fills and a closed native ink-brush contour stroke on a separate clean-line layer. Missing contours remain an explicitly warned rectangular fallback.
- The editor already includes local alpha-connected raster contour extraction with bounded component/point counts; its report labels this as pixel-boundary geometry, not semantic eye/hair recognition.
- Added regression coverage for face ratios, invalid tolerance rejection, organic contour fill+ink planning, and explicit rectangle fallback.
- Updated the hybrid raster workflow to run on `feat/digital-artist-engine`.
- Verified commit `38e128c5d2515c3606cf9f237798711a535a2afe`: Drawing engine tests run #2748 passed; Hybrid raster/SVG run #787 passed; both brush proof and Digital Artist portrait artifacts uploaded successfully.
- This verifies code paths and deterministic raster rendering only. It does not establish professional anime quality, successful SmolVLM inference, Android WebGPU compatibility, or physical Android touch/stylus performance.
- No PR merge or production deployment has occurred in this pass.

## CI and Cloudflare preview publication — 2026-11-21

- Re-verified the current tested head `38e128c5d2515c3606cf9f237798711a535a2afe`: Drawing engine run #2749 and Hybrid raster/SVG run #788 both completed successfully.
- Each Node test job reported **434/434 passing, 0 failing**. The hybrid workflow also completed the five-brush proof and deterministic Digital Artist portrait render, and uploaded both proof artifacts.
- The alpha-connected raster contour inspector is included in the tested head. It extracts bounded pixel-boundary contours from transparent raster layers; it does not semantically label facial parts.
- Published the tested branch through the existing isolated Cloudflare Pages preview project. Deployment `33e0af55-25e9-4e91-89ab-b11d71a86fcc` completed successfully for commit `38e128c5d2515c3606cf9f237798711a535a2afe`.
- Preview URL: https://feat-digital-artist-engine.zero-studio-artist-preview.pages.dev
- The Vercel integration remains blocked by its free daily deployment limit; Cloudflare Pages was used instead. The existing image Worker and production branch were not changed.
- PR #14 remains Draft and unmerged. This is a published preview, not a production release. Android touch/stylus testing and artistic acceptance remain the next user-facing gate.


## Verification and preview refresh — 2026-11-21

- Tightened the raster contour regression so the 2-megapixel safety cap is tested with a correctly sized RGBA buffer, rather than accidentally passing due to a malformed buffer.
- Verified head `d47fc135ad46ffed686ae1d25e5e11358ce8394e`: Drawing engine run #2762 passed; Hybrid raster/SVG run #801 passed. Both native brush proof and deterministic Digital Artist portrait artifacts were generated and uploaded.
- Cloudflare Pages preview deployment `ce5d0058-dfff-4fb6-a825-24f59771e2c1` completed successfully from the same branch and exact commit. Branch preview alias: https://feat-digital-artist-engine.zero-studio-artist-preview.pages.dev
- The preview is isolated from production. Vercel's daily free build limit remains a separate constraint; the Cloudflare Pages preview is the available test deployment.
- PR #14 remains Draft and unmerged. No production Worker or existing image service was modified.
- Remaining acceptance gate: user-side Android drawing test and visual review. No successful embedded vision inference or autonomous neural training is claimed.


## First selected-character native brush test — 2026-11-21

- Retrieved the user's selected gallery reference from the existing preview image service: asset ID `be172712-e073-4d06-9587-eec7e6c62a84`, source image 1280×720 with front, side and back views.
- Added `app/digital-artist-character-sheet-plan.mjs` and `scripts/render-digital-artist-character-sheet.mjs` to execute a first three-view study through the existing native Canvas2D raster brush engine.
- Output: 1920×1080 PNG, seven semantic layers, 168 total raster operations (97 brush strokes and 71 region fills), plus seven separately exported transparent layer PNGs and an inspection report.
- No source-image pixels were embedded in the drawing, no image-generation service was used, and no vision-model inference was performed. The initial geometry is a manually authored approximation based on the selected reference, not autonomous model understanding.
- The first draft establishes the three-view silhouette, dark hair, ivory/pink kimono, obi, facial features, folds and floral marks. It is not yet a visually accepted likeness: head/profile proportions, hair clumps, sleeve/kimono contours and detailed floral patterns need another quality pass.
- The stroke-geometry report has zero warnings after replacing intentional one-point flower dots with short editable strokes. Transparent character alpha coverage is 25.95% of the 1920×1080 canvas.
- Verified commit `22f8c31a4941ba4ae9f93070f615e29663a10c2e`: Drawing engine run #2787 and Hybrid raster/SVG run #826 both passed. The character-sheet proof artifact was uploaded by the Hybrid workflow.
- This is a CI/engine execution proof, not yet an Android in-app drawing acceptance test. The preview URL and production Worker were not changed by this pass; PR #14 remains Draft and unmerged.
