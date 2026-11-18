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
