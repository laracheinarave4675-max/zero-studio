# ZERO STUDIO

**ZERO STUDIO** is an ambitious, mobile-first anime production workspace. Its core principle is that artwork must be created through explicit drawing operations (vector paths, strokes, and frame-by-frame editing), not by asking an image/video generator to produce finished characters or scenes.

## Non-negotiable project constraints

- Primary working device: Android phone; do not assume a desktop computer.
- Budget target: free-first; do not assume paid APIs, hosting, GPU, or subscriptions.
- Artwork policy: no generative image/video models for final characters, backgrounds, scenes, or animation frames. The drawing system must create editable strokes/paths.
- Animation target: the creative goal is **24 independently drawn images per second**. This is not the same as displaying a smaller number of drawings at 24 FPS. Keep this requirement explicit in planning and explain its production cost.
- Build honestly in testable stages. Do not describe prototypes as a finished professional studio.

## Public Android test copy

Open the currently published test build: https://zero-studio-three.vercel.app/ . The GitHub source repository remains private. This is a manually uploaded snapshot of `feature/mobile-drawing-workspace`; it is not automatically synchronized with later GitHub commits. Physical Android testing is still pending.

## Start here

1. Read [PROJECT_STATUS.md](PROJECT_STATUS.md) before continuing work.
2. Read [DECISIONS.md](DECISIONS.md) before changing core architecture or constraints.
3. Read [ROADMAP.md](ROADMAP.md) to see the staged plan.
4. Record every meaningful implementation, test, limitation, and decision in the project files.

## Run the prototype

Open `app/index.html` through an HTTPS static host (or a local web server) to use the first drawing workspace. It is not yet deployed, and opening it directly as a `file://` URL may prevent PWA features. See [Android test plan](docs/ANDROID_TEST_PLAN.md) and [drawing command schema](docs/DRAWING_COMMANDS.md).

## Current drawing engine milestone

The development branch now includes project format v2 with editable per-frame layers (including renaming), a non-destructive SVG-mask vector eraser, ZIP export, and an optional text-only Gemini-to-SVG proposal workflow with explicit approval. Drawing input uses coalesced pointer samples where supported and discards cancelled gestures. Version 1 projects are migrated when opened. See [AI vector drawing adapter](docs/AI_VECTOR_DRAWING.md), [drawing command and layer model](docs/DRAWING_COMMANDS.md), [engine tests](tests/engine.test.mjs), and the Android test plan.

## First animation proof

The repository includes an editable one-second, 24-frame vector waving/blinking character test at `examples/24-drawings-one-second.zero`. It is a simple pipeline proof, not professional anime animation. See [animation proof notes](docs/ANIMATION_PROOF.md).

## Current state

The repository is being established as the durable project record. The earlier v0.1 prototype was created outside this repository in a previous work session; it has not yet been imported here or validated on a real Android device. See PROJECT_STATUS.md for exact status.
