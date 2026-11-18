# ZERO STUDIO

**ZERO STUDIO** is an ambitious, mobile-first anime production workspace. Its core principle is that artwork must be created through explicit drawing operations (vector paths, strokes, and frame-by-frame editing), not by asking an image/video generator to produce finished characters or scenes.

## Non-negotiable project constraints

- Primary working device: Android phone; do not assume a desktop computer.
- Budget target: free-first; do not assume paid APIs, hosting, GPU, or subscriptions.
- Artwork policy: no generative image/video models for final characters, backgrounds, scenes, or animation frames. The drawing system must create editable strokes/paths.
- Animation target: the creative goal is **24 independently drawn images per second**. This is not the same as displaying a smaller number of drawings at 24 FPS. Keep this requirement explicit in planning and explain its production cost.
- Build honestly in testable stages. Do not describe prototypes as a finished professional studio.

## Public Android test copy

Open the currently published test build: https://zero-studio-three.vercel.app/ . The GitHub source repository remains private. This is a manually uploaded snapshot of `feature/mobile-drawing-workspace`; it is not automatically synchronized with later GitHub commits. The 2026-11-18 build includes constrained limb IK, rig-aware pose blending, the project character library, proportion guides, and the unique-drawing cadence audit. Physical Android testing is still pending.

## Drawing and character toolset

The development workspace includes a freehand SVG pen, optional stylus-pressure outlines, vector eraser, line/rectangle/ellipse tools, shape fill, item selection/move/style/duplicate/delete, mobile pan/zoom, layer controls, and topology-matched in-between generation, and a unique-drawing cadence audit that distinguishes actual distinct artwork from playback FPS. Character tools include Nori with 12 editable parts, three starter views, four poses, four facial expressions, a customizable palette, validated `.zchar` import/export, an 11-cell editable SVG model-sheet export with proportion guides, a project-local character library, and a four-limb two-bone IK editor with head/torso anchors, editable head rotation and whole-character lean, and whole-character lean, rig-aware blending between compatible saved poses, and linked character instances that can be copied and updated per frame, and conversion of hand-drawn vector frames into custom reusable character models. These are working foundations, not a completed professional full-body rig or character-model-sheet editor. Physical Android testing remains pending. GitHub Actions run #651 passed all 107 tests and syntax checks. The latest additions include constrained limb IK, a project-local character library, model-sheet proportion guides, and a unique-drawing cadence audit.

## Start here

1. Read [PROJECT_STATUS.md](PROJECT_STATUS.md) before continuing work.
2. Read [DECISIONS.md](DECISIONS.md) before changing core architecture or constraints.
3. Read [ROADMAP.md](ROADMAP.md) to see the staged plan.
4. Record every meaningful implementation, test, limitation, and decision in the project files.

## Run the prototype

Open the public Android test copy at https://zero-studio-three.vercel.app/ . It is a manually uploaded static snapshot, not automatically synchronized with GitHub. The repository remains private. See [Android test plan](docs/ANDROID_TEST_PLAN.md) and [drawing command schema](docs/DRAWING_COMMANDS.md).

## Current drawing engine milestone

The development branch now includes project format v2 with editable per-frame layers (including renaming), a non-destructive SVG-mask vector eraser, ZIP export, and an optional text-only Gemini-to-SVG proposal workflow with explicit approval. Drawing input uses coalesced pointer samples where supported and discards cancelled gestures. Version 1 projects are migrated when opened. See [AI vector drawing adapter](docs/AI_VECTOR_DRAWING.md), [drawing command and layer model](docs/DRAWING_COMMANDS.md), [engine tests](tests/engine.test.mjs), and the Android test plan.

## First animation proof

The repository includes an editable one-second, 24-frame vector waving/blinking character test at `examples/24-drawings-one-second.zero`. It is a simple pipeline proof, not professional anime animation. See [animation proof notes](docs/ANIMATION_PROOF.md).

## Current state

The repository remains the durable project record. The deployed workspace is still a test build; the earlier external v0.1 prototype has not been imported, and physical Android behavior remains unverified. See PROJECT_STATUS.md for the exact implementation status and remaining work.
