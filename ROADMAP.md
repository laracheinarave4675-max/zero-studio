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

## Current animation direction — D-027 (approved 2026-11-20)

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
