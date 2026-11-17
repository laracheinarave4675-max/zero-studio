# ZERO STUDIO — Roadmap

A staged plan designed around Android-first use and a free-first budget. Milestones are not complete until their acceptance checks pass.

## Phase 0 — Project foundation
- [x] Establish private GitHub repository.
- [x] Record mission, hard constraints, decisions, and current status.
- [ ] Import/rebuild the previous v0.1 prototype in the repository.
- [ ] Add a concise test and release process.

## Phase 1 — Reliable drawing workspace
- [x] Mobile-first Arabic RTL workspace (initial prototype committed; Android testing pending).
- [x] SVG/vector drawing surface with pointer/touch support (physical-device test pending).
- [x] Layer management: add/remove/select, rename, visibility, locking, reorder (Android testing pending); [x] basic frame management.
- [x] Undo/redo and JSON project save/load implementation (browser round-trip test pending).
- [x] SVG sequence JSON export; [x] ZIP archive export (automated archive structure tests; Android download/open test pending).
- [ ] Offline/PWA behavior where supported (service worker now caches the drawing engine module; device test pending).
- [ ] Test on the user's Android browser/device.

## Phase 2 — Drawing brain interface
- [x] Initial versioned drawing-command schema documented in docs/DRAWING_COMMANDS.md.
- [x] Initial path syntax, numeric bounds, stroke width, and color validation; [ ] full SVG parser and geometric bounds validation.
- [x] Initial validated path operations convert to editable SVG elements.
- [x] Consume coalesced Pointer Event samples where available; discard cancelled gestures.
- [x] AI-proposed vector operations can be previewed and explicitly approved/rejected (Gemini text-only adapter; live API key test pending).
- [ ] No raster image-generation fallback.

## Phase 3 — Animation proof of concept
- [ ] Create one simple character with reusable construction guides.
- [ ] Produce a short, measurable action sequence.
- [ ] Count unique drawings separately from playback FPS.
- [ ] Evaluate anatomy, line consistency, motion continuity, and correction effort.
- [ ] Compare a true 24-unique-drawings/second workload with lower drawing counts without redefining the target.

## Phase 4 — Production departments
- [ ] Story/script and storyboard.
- [ ] Character model sheets and expression/pose libraries.
- [ ] Background/layout department.
- [ ] Keyframe and in-between workflow.
- [ ] Cleanup, coloring, and continuity checks.
- [ ] Production tracking and human approval gates.

## Phase 5 — Audio and finishing
- [ ] Dialogue and voice workflow.
- [ ] Music and sound effects with rights-aware asset handling.
- [ ] Editing, timing, compositing, and export.
- [ ] Final quality-control checklist.

## Phase 6 — Orchestration
- [ ] Central production planner.
- [ ] Specialized task agents with explicit inputs/outputs.
- [ ] Shared project state and asset/version tracking.
- [ ] Retry, review, and approval workflow.
- [ ] Measure reliability and cost before enabling automation at scale.

## Acceptance principles
- A checkbox is completed only after an observable implementation and test.
- Keep a list of known limitations.
- Never trade away the no-image-generation rule or the 24-unique-drawings target without the user's explicit agreement.
