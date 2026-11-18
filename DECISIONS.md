# ZERO STUDIO — Architecture and Product Decisions

This file records decisions that must not be changed silently. Add dated entries when decisions evolve.

## D-001 — Drawing, not image generation
**Decision:** Final anime artwork must be created by explicit drawing operations: editable vector paths, strokes, brush actions, or equivalent geometry executed by a drawing engine.

**Implication:** A language model may plan a drawing and output structured drawing commands, but it must not substitute a generated raster image for the requested drawing process.

## D-002 — 24 unique drawings per second remains the target
**Decision:** Preserve the user's requirement of 24 independent drawings per second.

**Clarification:** 24 FPS is only a playback rate. A project can play at 24 FPS while reusing drawings (for example, 12 or fewer unique drawings per second). That is not equivalent to the requested target.

**Scale:** 24 unique drawings/second = 1,440/minute = 28,800 for a 20-minute episode. Test feasibility before making production promises.

## D-003 — Android-first
**Decision:** User workflow must be usable from an Android phone. Do not make a desktop computer a prerequisite.

## D-004 — Free-first
**Decision:** Prefer open formats, local/browser capabilities, and free tiers with clear limits. Never imply that free APIs provide unlimited compute. Disclose data-use and privacy implications before third-party integrations.

## D-005 — Honest status reporting
**Decision:** Clearly label each capability as implemented, tested, untested, experimental, or planned. Do not call a prototype a complete studio.

## D-006 — Durable project memory
**Decision:** GitHub repository documentation is the source of truth for project status and decisions. At each continuation, review PROJECT_STATUS.md and this file, then update the log after meaningful work. Chat memory is supplementary, not the sole record.

## D-007 — Specialized departments are workflow roles until implemented
**Decision:** Departments such as writing, character design, keyframes, in-betweens, cleanup, coloring, continuity review, sound, editing, and production management describe the intended organization. Do not claim autonomous agents exist until their orchestration and outputs are implemented and tested.

## D-008 — Character assets stay portable and project-local
**Decision:** Character models must remain editable and portable. Standalone character files use validated `.zchar` packages; a project may store up to 100 validated character models in `project.characterLibrary`, persisted inside `.zero` files. Do not upload character art to an external service by default.

## D-009 — Measure unique drawings separately from playback
**Decision:** Report the count of distinct visible vector-art signatures and average unique drawings per second separately from playback FPS. Ignore frame and operation IDs when comparing signatures. A cadence report is a structural measurement only; it does not certify artistic quality or prove that every frame was freshly hand-drawn.

## D-010 — Rig pose interpolation requires compatible editable models
**Decision:** Character pose blending may only run when both validated models have compatible rig versions, the same view, part order/visibility, SVG path topology, and per-part colors. Rebuild intermediate limb geometry with the constrained IK solver; reject incompatible models instead of guessing or rasterizing.

## D-011 — Preserve character instance identity across animation frames
**Decision:** Inserted character parts carry a shared instance ID and per-layer part membership. Copying or updating a character in another frame preserves that identity while assigning fresh drawing-operation IDs. In-between frames retain the instance metadata. This provides a foundation for later synchronized multi-frame edits without flattening the artwork.


## D-012 — Background artwork is editable vector geometry
**Decision:** Background presets and final background artwork must be authored as validated editable SVG path operations and remain layered project assets; do not replace them with generated raster imagery.

**Implication:** Starter scenes may be inserted as editable layer groups, but they are not considered a complete background department until perspective/layout, reusable props, depth/parallax, and continuity workflows are implemented and reviewed.


## D-013 — AI is the scene artist, not a preset selector (2026-11-18)
**Decision:** The production workflow must let the AI interpret a scene brief and create the requested artwork as multiple named, editable vector layers. Starter presets are optional references, never a ceiling on what the artist can draw.

**Implication:** The AI may plan composition and layer breakdown, then produce validated SVG path operations for each layer. The studio previews the full proposal and commits it only after approval. Do not use raster image/video generation as a substitute. The user should not need to understand implementation details or manually coordinate technical departments.

## D-014 — User-facing collaboration style (2026-11-18)
**Decision:** The user is not expected to understand software engineering or production terminology. Explain progress in simple Arabic, avoid jargon and unnecessary technical questions, and work directly in the repository wherever possible. The user values deep, creative thinking and expects the assistant to take initiative. Short instructions such as “continue”, “go ahead”, or “okay” mean continue working toward the agreed finished result, not provide only a status update. Do not ask the user to copy/paste code, operate Git, manage files, or coordinate technical departments when the connected tools can do that work.

**Implication:** Keep detailed technical notes, tests, limitations, and continuation state in repository documents. Report meaningful outcomes in plain Arabic, distinguish completed from pending work, and never imply that a project is finished until all acceptance checks are met. The user should be treated as the creative owner/director; the assistant owns the technical execution and should proactively choose the next sensible implementation step within the agreed constraints.
