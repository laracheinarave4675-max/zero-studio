# ZERO STUDIO — Roadmap

A staged plan designed around Android-first use and a free-first budget. Milestones are not complete until their acceptance checks pass.

## Phase 0 — Project foundation
- [x] Establish private GitHub repository.
- [x] Record mission, hard constraints, decisions, and current status.
- [ ] Import/rebuild the previous v0.1 prototype in the repository.
- [x] Add a concise test and release process (GitHub Actions syntax checks and Node test suite; manual Vercel static release).

## Phase 1 — Reliable drawing workspace
- [x] Mobile-first Arabic RTL workspace (initial prototype committed; Android testing pending).
- [x] SVG/vector drawing surface with pointer/touch support (physical-device test pending).
- [x] Layer management: add/remove/select, inline rename, visibility, locking, reorder (Android testing pending); [x] basic frame management.
- [x] Vector item selection, drag-to-move, style update, duplication, and delete with stable operation IDs.
- [x] Direct SVG path anchor and cubic/quadratic Bézier control-handle editing (up to 240 handles per path).
- [x] Mobile canvas pan and zoom controls.
- [x] Line, rectangle, ellipse, and optional closed-shape fill.
- [x] Undo/redo and JSON project save/load implementation (browser round-trip test pending).
- [x] SVG sequence JSON export; [x] ZIP archive export (automated archive structure tests; Android download/open test pending).
- [ ] Offline/PWA behavior where supported (service worker caches the drawing and character modules; device test pending).
- [ ] Test on the user's Android browser/device.

## Phase 2 — Drawing brain interface
- [x] Initial versioned drawing-command schema documented in docs/DRAWING_COMMANDS.md.
- [x] SVG path command grammar/arity validation for M/L/H/V/C/S/Q/T/A/Z plus conservative coordinate bounds; exact Bézier extrema/geometry remain out of scope.
- [x] Initial validated path operations convert to editable SVG elements.
- [x] Consume coalesced Pointer Event samples where available; discard cancelled gestures.
- [x] Convert multi-point freehand gestures to smooth cubic Bézier curves; physical-device feel review pending.
- [x] Optional stylus-pressure variable-width outline path; physical stylus behavior pending.
- [x] Add line, rectangle, and ellipse drawing tools with optional shape fill.
- [x] AI-proposed vector operations can be previewed and explicitly approved/rejected.
- [x] AI scene artist can return 2–12 named editable SVG layers (up to 300 paths), preview the complete scene, and commit it as separate layers after approval.
- [x] Raise project frame capacity to 30,000 and paginate the timeline at 24 thumbnails per page.
- [x] Add a 24-unique-drawings/second production plan with ordered, validated .zbatch imports and saved progress.
- [x] Add frame-scoped undo/redo for large projects without copying the entire project per edit.
- [x] Add a provider-neutral sequential worker that validates, retries, cancels, commits, and checkpoints batches; live provider callback remains deferred.
- [ ] Move long-sequence storage to paged IndexedDB/database-backed storage and tune memory-aware export for Android.
- [ ] Run and artist-review the complete 240-frame street test; measure actual time, quality, size, and memory.
- [ ] Connect a live provider adapter and test real-provider scene quality, iterative correction, and continuity; provider choice deferred.
- [ ] Test a hosted native-SVG model (OmniSVG) for editable illustration quality and conversion into ZERO STUDIO paths.
- [ ] Compare current free general-purpose model endpoints for structured scene/vector-plan output; record request, token, and output-size limits before integration.
- [ ] Prototype an AI-authored, scene-specific vector drawing program that emits a complete separate SVG document for every frame; retain the 24-unique-drawings/second acceptance test and reject static-image/tween shortcuts.
- [x] No raster image-generation fallback; final artwork remains editable SVG paths.

## Historical prototype direction — D-027 (superseded by D-028, 2026-11-20)

This section records the earlier per-frame still-image/raster prototype only. Its uncompleted generation tasks are not approved next steps for character animation; use D-028 below.

- [x] Preserve the existing character/background generation departments and Character Bible; animation is a separate missing department.
- [x] Approve motion direction/timing charts → spatial pose guides → complete 2D key drawings → individually reviewed raster in-betweens/cleanup → raster frame assembly.
- [x] Explicitly restrict 3D skeletons/rigs to pose-blocking references; do not render puppet deformation as final artwork.
- [x] Add provider-neutral anime motion plan, key-pose schedule, pose-guide sampler, independent PNG/WebP frame records, and duplicate-raster cadence audit (`app/anime-motion-engine.mjs`).
- [x] Materialize approved PNG/WebP drawings into native ZERO STUDIO project frames through the existing Raster layer engine.
- [x] Add an experimental authenticated Cloudflare Images/BiRefNet foreground-segmentation endpoint and same-origin proxy; live staging and alpha-edge quality review remain pending.
- [x] Gate every transformation behind an explicit `ANIME_SEGMENTATION_FREE_TIER_CONFIRMED=true` flag, disabled by default until the account plan is confirmed.
- [ ] Connect key-pose requests to the existing still-image/reference-conditioning art department.
- [ ] Benchmark identity-preserving key drawing on the existing approved character; check angle changes, face, hair, costume, silhouette and line quality.
- [ ] Evaluate dedicated cartoon keyframe-in-between and frame-specific still-image approaches under the $0 compute rule; no model is selected yet.
- [ ] Build raster contact sheet, per-frame review/replace workflow, and shot compositor integration.
- [ ] Complete the one-second walk with 24 unique approved raster drawings and review the real playback.
- [ ] Validate Android performance, checkpoint/recovery, transparent raster import, storage and export.

The former SVG-generated motion branch is archived as a visually rejected experiment; its code is preserved but it is not the approved output route. See `docs/ANIME_KEYFRAME_MOTION_ENGINE.md`.

## Phase 3 — Character construction and animation proof of concept
- [x] Add reusable Nori vector construction model (12 parts, semantic editable layers, versioned/validated schema).
- [x] Add front/side/back starter model views.
- [x] Add import/export of portable validated .zchar character models.
- [x] Add editable Nori palette controls.
- [x] Export an 11-cell editable SVG model sheet for views, expressions, and poses.
- [x] Add four starter poses and four expressions (48 pre-authored Nori variants).
- [x] Add editable proportion-guide overlays to the 11-cell Nori model-sheet SVG export.
- [x] Allow users to convert their own visible vector drawings in a frame into reusable custom character models, preserving layers.
- [ ] Create an interactive artist-refinable model-sheet editor with customizable anatomy and reviewed turnarounds.
- [x] Add four starter facial expression presets to the Nori vector model.
- [x] Add basic two-bone inverse kinematics for four limb chains with segment-length preservation.
- [x] Add a project-local reusable character library that survives `.zero` save/open.
- [x] Add rig-aware interpolation between compatible saved Nori limb-rig poses.
- [x] Add linked character instance identity across layers and frames, with copy-to-next-frame and per-frame pose replacement.
- [x] Add head-center and torso-center translation anchors with legacy rig migration.
- [x] Add editable head rotation around the head anchor with SVG path transformation.
- [x] Add whole-character lean around the torso anchor while preserving rig joint geometry.
- [ ] Extend rigging to rotational spine/neck articulation, finger/toe controls, collision/ground constraints, and synchronized multi-frame instance editing.
- [x] Produce a one-second, measurable 24-frame vector wave/blink sequence (`examples/24-drawings-one-second.zero`).
- [x] Count unique drawings separately from playback FPS: automated test confirms 24 distinct frame documents at 24 FPS.
- [ ] Evaluate anatomy, line consistency, motion continuity, and correction effort.
- [ ] Complete spine/neck/finger/toe articulation, ground/collision constraints, and linked multi-frame character editing.
- [x] Add a unique-drawing cadence audit that reports actual unique drawings per second separately from playback FPS.
- [ ] Compare a true 24-unique-drawings/second workload with lower drawing counts without redefining the target.

## Anime Digital Artist training — D-031

- [x] Define a 15-skill anime craft curriculum with prerequisites and measurable targets.
- [x] Add detailed Japanese animation drawing studies for every skill: visual principles, step-by-step drills, common mistakes, rubrics, and concrete deliverables.
- [x] Add foundation/intermediate/advanced practice-session generation and connect it to the editor's Arabic training panel.
- [x] Keep final artwork on native editable Canvas2D raster brush layers; the study/session generator never creates final images.
- [x] Add regression tests for curriculum coverage and session contracts.
- [ ] Connect each study rubric to a trustworthy matching raster/anatomy/identity eye before awarding measured mastery.
- [ ] Build a rights-cleared reference library from original/user-authorized model sheets and annotated drawing processes.
- [ ] Add visual examples and progressive exercises using only project-owned or appropriately licensed materials.
- [ ] Execute a complete original character exercise and inspect the actual drawing visually on Android.
- [ ] Expand the artist's measurable eyes to contour topology, face/eye geometry, hair-flow grouping, cel-shadow consistency, and material highlights.

## Phase 4 — Production departments
- [x] Approve 2D-first cinematic anime art direction with selective 3D layout support (D-017).
- [x] Approve static editable background assets plus 24 unique independently drawn moving-art frames per second (D-018).
- [x] Add a vision-based critique adapter and critique-guided vector revision prompts (D-019 foundation).
- [ ] Complete visual critique integration in the Android workflow and visually validate three Gemini-generated background scenes.
- [ ] Refactor animation batches to reference one approved static background asset and store only newly drawn moving layers per timestamp; composite complete visible SVG frames for export.
- [ ] Compare the generated scenes against the three user references and revise the artist until the visual acceptance gate is met.

## Phase 4 — Production departments
- [ ] Story/script and storyboard.
- [ ] Complete character model sheets and expression/pose libraries (initial Nori construction model only).
- [x] Initial editable vector background library: day city, forest, interior room, and night city presets; inserted as separate layers beneath existing artwork and covered by tests.
- [ ] Full background/layout department: perspective guides, reusable props, parallax/depth planes, editable scene templates, and artist-reviewed location sheets.
- [x] Basic topology-matched SVG keyframe in-between generation.
- [ ] General keyframe editor, character rig animation, cleanup and frame-aware interpolation (current topology-matched path tween and compatible Nori pose blend are foundations only).
- [ ] Cleanup, coloring, and continuity checks.
- [ ] Production tracking and human approval gates.

## Phase 5 — Audio and finishing
- [ ] Dialogue and voice workflow.
- [ ] Music and sound effects with rights-aware asset handling.
- [ ] Editing, timing, compositing, and export.
- [ ] Final quality-control checklist.

## Phase 6 — Orchestration
- [ ] Central production planner that interprets episode/storyboard instructions and delegates scene drawing.
- [x] First scene-artist execution step: natural-language scene brief → multi-layer vector artwork proposal → validation → human approval.
- [ ] Specialized task agents with explicit inputs/outputs.
- [ ] Shared project state and asset/version tracking.
- [ ] Retry, review, and approval workflow.
- [ ] Measure reliability and cost before enabling automation at scale.

## Acceptance principles
- A checkbox is completed only after an observable implementation and test.
- Keep a list of known limitations.
- Never trade away the no-image-generation rule or the 24-unique-drawings target without the user's explicit agreement.

## Phase 5 — Human painting department and layered asset interchange (approved 2026-11-19)
- [x] Approve human-authored final artwork; prohibit generative image/video output for final pixels or drawing marks (D-021).
- [x] Define ZERO STUDIO as production management, asset organization, continuity, timeline, compositing and delivery around a professional human painting department.
- [ ] Verify one professional painting app on the user's actual Android phone; check brush, layer, perspective and lossless export features.
- [ ] Create a three-layer test artwork (named transparent layers, different opacity and alpha) in the selected app.
- [ ] Validate PSD import/export round-trip on Android.
- [ ] Validate OpenRaster (.ora) round-trip if supported by both applications.
- [ ] Implement the first proven non-destructive import path (never silently flatten source layers).
- [ ] Add an asset/shot browser with source file, scene, camera, layer and continuity metadata.
- [ ] Integrate imported hand-painted backgrounds with the existing timeline and frame compositor.
- [ ] Physically test the complete round-trip and playback on the target Android phone.
- [ ] Keep 24 independently drawn moving-art images per second as the acceptance target.


## Current animation direction — D-028 (supersedes D-027 for final character motion)

- [x] Record the user's approved direction: one stable Character DNA plus complete artist-authored key drawings and anatomy-guided construction.
- [x] Add measured canonical bone proportions and a validated character-identity record.
- [x] Add smooth guide interpolation, limb-length constraints, center-of-mass sampling, and planted-foot contact anchors.
- [x] Make the anatomy renderer explicitly guide-only; never deform the source artwork or treat guide images as final art.
- [x] Add 24 separate full-redraw tasks per second, independent transparent raster assets, duplicate-hash rejection, and frame-level review gates.
- [x] Add regression tests for the new anatomy engine.
- [x] Add mobile on-canvas Character DNA landmark calibration and save it in the native project.
- [x] Preserve Character DNA through project reopen normalization and large-project undo history.
- [ ] Run the new workflow on the user's actual approved character after annotating its joint landmarks and confirming its canonical view.
- [x] Connect the anatomy guide and per-frame drawing tasks to the Android animation editor and native project timeline.
- [ ] Add artist-editable contour/silhouette correction overlays while preserving the original key drawings.
- [x] Add independent transparent PNG export and storage per native timeline frame, with SHA-256 content/source signatures.
- [x] Add source-staleness checks, duplicate PNG rejection, four-part review gates, 24-frame audit, and ZIP package export with separate static background.
- [ ] Draw and review all 24 distinct raster frames for the one-second walk; verify identity, hands, face, costume, foot contact, line quality, and timing.
- [ ] Complete visual playback, Android performance, persistence, recovery, alpha, and export tests on the user's Android device.

The previous per-frame image-generation request route is legacy-only and not an accepted animation method. See docs/ANIME_ANATOMICAL_DRAWING_ENGINE.md. Passing unit tests does not equal visual acceptance.

## Digital Artist track — D-029 (approved 2026-11-21)

The new primary character-art direction is an AI digital artist that draws through ordered editable strokes and paths, not image generation. See docs/DIGITAL_ARTIST_ARCHITECTURE.md.

- [x] Approve the Digital Artist architecture and record D-029.
- [x] Define a versioned, provider-neutral plan schema with semantic art stages and individual stroke/tool/intent metadata.
- [x] Validate SVG operations, bounds, IDs, layer sequence and reject embedded raster/image payloads.
- [x] Compile plans into editable semantic vector layers and replayable one-stroke steps.
- [x] Pass the Digital Artist module and regression tests in GitHub Actions (Drawing engine run #2318; Hybrid raster/SVG run #577).
- [ ] Connect a vision-capable model planner to produce validated stroke plans from a brief plus approved character reference, without image-generation output.
- [ ] Integrate individual-stroke replay/scrubbing, correction, layer preview, approval/rejection and commit into the Android workspace.
- [ ] Produce one complete full-body character from a blank canvas; inspect the editable paths and visual quality against the approved model sheet.
- [ ] Add visual critique that edits existing vector paths instead of regenerating an image.
- [ ] Collect permitted drawing-process examples and reviewed corrections for supervised/tool-use improvement; do not begin large-scale RL without process data and a reliable evaluator.
- [ ] Only after the still passes visual review, extend the same artist to independently authored animation drawings at the unchanged 24 drawings/second target.

**Non-claims:** the schema and unit tests do not prove autonomous drawing, professional anime quality, or visual identity retention. No image/video generation is permitted in the final-art authoring path.



## D-030 correction — Raster-first Digital Artist (2026-11-21)

This supersedes the vector-first character-art choice in D-029. The character Digital Artist uses native pressure-sensitive Canvas2D raster brush strokes on separate layers as its primary drawing medium. SVG is optional for construction guides, skeletons, simple masks, and selected geometry; it is not required for final line art, flats, shadows, or details.

- [x] Confirm and document the existing raster brush and persistent raster-surface engines as the primary drawing hand.
- [x] Add a versioned raster brush-plan contract with semantic layers, per-point pressure, brush profile, size, color, opacity, texture, blend mode, seed, intent and replay order.
- [x] Compile plans into native raster brush commands with `vectorRequired: false`.
- [x] Add unit tests for the raster-first command contract and validation.
- [x] Verify the raster command contract and regression suite in GitHub Actions (Drawing engine run #2318; Hybrid raster/SVG run #577).
- [x] Add an executor adapter that paints compiled commands into native transparent raster layers, preserves stroke IDs/intents/source/points/options, finalizes layers, and rolls back failed runs.
- [x] Integrate a minimal Digital Artist panel into the editor to load a brush plan, execute it with progress, and create separate raster layers.
- [x] Add a deterministic 56-operation / 7-layer portrait fixture to exercise the editor execution path; this is a test fixture, not an AI-authored drawing.
- [x] Add tests for command ordering, layer finalization, rollback, malformed stream rejection, and native project stroke-history compatibility.
- [x] Export a reproducible 56-operation / 7-layer Canvas2D proof image and separate transparent layer PNGs in GitHub Actions.
- [x] Visually inspect the deterministic proof; record the banded flat-color result as a known quality defect rather than claiming artistic acceptance.
- [x] Add closed polygon region-fill operations in the validated brush plan and native Canvas2D executor.
- [x] Replace the demo flat-color bands with 14 closed semantic fills and add in-bounds/out-of-bounds pixel probes to the CI render.
- [x] Visually inspect the latest render and confirm the broad horizontal flat-color bands are gone; record remaining silhouette/line-art defects.
- [ ] Build the artist’s internal multi-eye perception passes (silhouette/contours, anatomy/construction, line-art quality, color/light, character identity); reports must identify pixel regions, affected layers/stroke IDs and correction targets. External VLMs are optional second opinions, not runtime prerequisites.
- [x] Add per-operation selection, isolated preview, previous/next navigation, approve/reject/reset review controls, and persistent review state.
- [x] Add validated per-operation point/pressure/brush-style correction, replay the full ordered raster layer from a scratch surface, commit atomically, refuse locked layers, and reset edited marks to pending review.
- [ ] Improve the native anime drawing hand: stable tapered inking, speed/pressure response, organic hair/cloth brushes, cleaner boundary fills, cel-shadow masks and controlled highlights.
- [ ] Build the authorized Anime Craft Library: model sheets, construction examples, line-art examples, color/shadow studies, stage annotations and stroke-process examples with provenance and usage rights.
- [ ] Add measurable anime drawing exercises for eyes/heads/expressions, hair masses, anatomy/poses, hands/costume folds, perspective, inking/taper, flat colors and cel shading.
- [ ] Connect perception reports to the existing correction/replay loop and measure before/after quality improvements on the same reference task.
- [ ] Add visual critique that revises existing brush commands and layer content, not a regenerated image.
- [ ] Run the fixture in a real browser, inspect its rendered output, then produce one full-body character from a blank canvas using only native brush commands; visually review identity, anatomy, ink quality, flats, shadows and details.
- [ ] After the still passes visual review, extend the artist to independently authored animation drawings at the unchanged 24 drawings/second target.

**Important:** The older D-029 vector command contract remains optional infrastructure for geometric guides and selected contours. It is not the acceptance route for final anime character art. No generated image/video, no paid compute, no merge/deploy without user approval.

## D-031 — Artist-owned perception and anime craft learning (2026-11-21)

The two governing goals remain: build a real anime production studio, and build its own digital artist that draws editable native marks and ultimately authors 24 independent drawings per second. The artist must have its own internal eyes and learn anime drawing craft; an external vision-language model is optional and never a required dependency.

**Implementation order:** internal silhouette/anatomy/line/color/identity analysis → strengthen brushes, fills, inking, cel shading and highlights → create a rights-cleared anime model-sheet and craft library → connect visual critique to stroke correction/replay → produce and review one complete original character → evaluate the 24-independent-drawings/second animation path.

**Initial implementation delivered — 2026-11-21**
- [x] Add deterministic raster eyes for visible bounds, alpha coverage, centroid, perimeter and dominant palette.
- [x] Add stroke-geometry inspection for sample count, length, bounds, pressure range and sharp turns.
- [x] Add named landmark and named palette comparison primitives for later model-sheet identity checks.
- [x] Add actual region-fill pixel sampling for interior coverage and outside leakage.
- [x] Connect a local eyes report to the editor's current-frame Digital Artist layers, including layer coverage, palette, operation review state and fill checks.
- [x] Add a 15-skill anime craft curriculum with staged prerequisites, lessons, practical exercises and evaluation metrics.
- [x] Add reference provenance/rights validation for study, training and commercial-production purposes, plus native-raster-only practice tasks and an editor curriculum browser.
- [x] Verify the first eyes/curriculum milestone: HEAD 536ee9b49b989fbd5770fea66cadbb0252d80fe6 passed 376/376 tests in both Drawing engine run #2449 and Hybrid raster/SVG run #639; raster proof/export jobs passed.

**Still pending**
- [ ] Connect landmark and palette comparisons to the actual approved Character DNA/model-sheet data.
- [ ] Extend the eyes from metrics to specific visual diagnosis: anatomy, contour defects, line continuity/taper, shadow/light direction and corrective coordinates.
- [ ] Populate the authorized Anime Craft Library with real approved examples, annotated model sheets and legally usable process examples. The curriculum catalog alone is not training data.
- [ ] Let the artist execute curriculum tasks, store its authored stroke logs, compare results and learn only from reviewed/approved corrections.
- [ ] Improve native brush and paint quality, then demonstrate a complete visually reviewed original anime character.


Data acquisition must be rights-aware: record provenance and permitted use for every reference. Manga109 general data is academic non-commercial; Manga109-s has a separate limited commercial-use permission with restrictions. Do not use a non-commercial dataset for commercial learning/output.


**Contour-aware vision bridge — implementation started 2026-11-21**
- [x] Accept optional normalized polygon contours in vision region observations.
- [x] Reject degenerate, repeated-point, out-of-box and self-crossing contours.
- [x] Prefer reviewed contour polygons over rectangular bounds when creating native raster fill commands.
- [x] Update the browser vision prompt to request organic character-part outlines.
- [x] Add focused regression tests for contour conversion and compatibility fallback.
- [x] Run the new tests and full project suites on the corrected latest code head; Drawing engine 402/402 and Hybrid raster/SVG plus raster proof all passed (runs 44942052300 and 44942052319).
- [ ] Inspect a real model-authored contour report against an uploaded character reference and correct contour accuracy before approving fills.
- [ ] Replace point-estimated contours with segmentation/mask-derived boundaries if the small VLM cannot produce reliable outlines.

- [ ] Publish a non-production preview from the corrected head so the new contour prompt and review UI can be checked in a browser.

## Phase 4 — Digital Artist learning loop (D-033)

- [x] Add a bounded evidence-led skill ledger with prerequisite and repeated-assessment mastery gates.
- [x] Persist the ledger inside project files and preserve it through normalization/import/export.
- [x] Connect current-frame inspection reports to explicit user-approved assessment saving.
- [x] Display project learning progress and recommend the next measured curriculum exercise.
- [x] Refuse skill scoring where the required domain-specific measurements are not implemented.
- [ ] Add specialist eyes for face landmarks, hair-mass structure, costume folds, light/shadow grouping and model-sheet identity.
- [ ] Connect the learning ledger to reviewed before/after correction pairs without claiming neural training.
- [ ] Run CI on the integrated editor and validate project round trips in a browser.
- [ ] Test the complete loop on the user's Android device.


## Phase 5 — Japanese anime specialist eyes (D-034)

- [x] Compare left/right anime eye width, aspect ratio, slant, iris/pupil placement, iris containment, and pair spacing against approved landmarks.
- [x] Compare named hair clump root-to-tip direction and length against the approved model sheet.
- [x] Generate targeted eye/gaze and hair-mass correction drills from failed measurements.
- [x] Add Arabic editor controls to compare supplied reference/current landmark maps.
- [x] Include specialist comparison results in the inspection evidence digest.
- [ ] Connect the model-reported landmarks to verified source-reference and current-raster evidence; do not infer mastery from manually typed coordinates.
- [ ] Implement raster-based eye contour/iris segmentation and hair-mass boundary/flow extraction.
- [ ] Extend specialist eyes to face planes, jaw proportions, brows, hands, costume folds, cel-shadow grouping and material response.
- [ ] Run corrected full CI and inspect actual outputs on Android before claiming acceptance.

## Digital Artist quality pass — 2026-11-21

- [x] Repair the anime-eye syntax regression and reject invalid eye comparison tolerances.
- [x] Add character-specific face proportion checks for cheek/jaw, lower-face, nose, mouth, brow and eye spacing.
- [x] Connect face drift to targeted correction actions and anime drawing exercises.
- [x] Turn reviewed vision contours into polygon fills plus separate native ink-brush outlines.
- [x] Preserve explicit warning/fallback behavior when a vision region has only a bounding box.
- [x] Add regression tests for face measurements, contour-to-brush conversion, and invalid inputs.
- [x] Verify Drawing engine run #2748 and Hybrid raster/SVG run #787 on commit `38e128c5`; native brush and portrait proof artifacts uploaded.
- [x] Execute the first controlled three-view character-sheet test through native Canvas2D brush operations and inspect the exported raster/layer report.
- [ ] Run the actual first artist drawing test on the user's Android device and visually accept/revise the resulting artwork.
- [ ] Connect a free vision model successfully on Android, or keep manual observation handoff clearly labeled until that is proven.

- [x] Extract bounded alpha-connected raster components and pixel-boundary contours locally, and include them in the editor inspection report without semantic overclaim.
- [x] Publish the tested artist branch to the isolated Cloudflare Pages preview for the first device-level drawing test.


## Verification and preview refresh — 2026-11-21

- Tightened the raster contour regression so the 2-megapixel safety cap is tested with a correctly sized RGBA buffer, rather than accidentally passing due to a malformed buffer.
- Verified head `d47fc135ad46ffed686ae1d25e5e11358ce8394e`: Drawing engine run #2762 passed; Hybrid raster/SVG run #801 passed. Both native brush proof and deterministic Digital Artist portrait artifacts were generated and uploaded.
- Cloudflare Pages preview deployment `ce5d0058-dfff-4fb6-a825-24f59771e2c1` completed successfully from the same branch and exact commit. Branch preview alias: https://feat-digital-artist-engine.zero-studio-artist-preview.pages.dev
- The preview is isolated from production. Vercel's daily free build limit remains a separate constraint; the Cloudflare Pages preview is the available test deployment.
- PR #14 remains Draft and unmerged. No production Worker or existing image service was modified.
- Remaining acceptance gate: user-side Android drawing test and visual review. No successful embedded vision inference or autonomous neural training is claimed.


## First selected-character brush execution — 2026-11-21

- [x] Retrieve the exact selected gallery reference and preserve its front/side/back views.
- [x] Execute a 1920×1080 three-view study with seven semantic raster layers and export each layer separately.
- [x] Verify 168 operations, 71 region fills, zero stroke-geometry warnings, and successful Drawing engine / Hybrid raster CI runs #2787 / #826.
- [ ] Improve likeness from the visual review: refine face/profile proportions, hair-clump flow, kimono/sleeve contours, and flower detail.
- [ ] Connect successful free on-device vision inference; the current plan is manually authored and must not be described as model-generated observations.
- [ ] Run and accept the result in the user's Android app; this CI render is not the device acceptance test.



## Construction-first anime artist and view continuity — 2026-11-21

- [x] Replace the single fixed-coordinate portrait with a parameterized head/eye/hair/neck/torso construction model.
- [x] Add seven separate tapered root-to-tip hair clumps and yaw-aware far-side compression for hair, ears and face silhouette.
- [x] Increase expressive iris/pupil geometry and add catchlights, lashes, collar seam, hair sheen and iris rim accents.
- [x] Execute the construction plan through the native Canvas2D brush executor and export transparent semantic layers.
- [x] Add left three-quarter/front/right three-quarter model-sheet rendering and continuity tests using one style profile and stable hair-clump IDs.
- [x] Verify commit `8fd924660a8cbd5a3055ae838eea492e5f0e7f09`: Drawing engine and Hybrid raster/SVG CI passed; **469/469 tests** in each Node test job; construction and three-view artifacts uploaded.
- [ ] Improve skull depth, cheek planes, ear attachment, hair overlap/negative spaces and shoulder/torso anatomy until visual review meets the anime acceptance gate.
- [ ] Add pose variation and verify identity across expressions and body poses, not only three head views.
- [ ] Connect successful free vision inference and evidence-backed semantic segmentation; current construction inputs are parameterized, not autonomously recognized.
- [ ] Re-run visual acceptance on Android and obtain user approval before including the gallery character or publishing a production release.
