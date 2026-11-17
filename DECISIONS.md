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
