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
- [ ] Test real-provider scene quality and improve iterative correction/continuity.
- [x] No raster image-generation fallback; final artwork remains editable SVG paths.

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
