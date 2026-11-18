# ZERO STUDIO

**ZERO STUDIO** is an ambitious, mobile-first anime production workspace. Its core principle is that artwork must be created through explicit drawing operations (vector paths, strokes, and frame-by-frame editing), not by asking an image/video generator to produce finished characters or scenes.

## Non-negotiable project constraints

- Primary working device: Android phone; do not assume a desktop computer.
- Budget target: free-first; do not assume paid APIs, hosting, GPU, or subscriptions.
- Artwork policy: no generative image/video models for final characters, backgrounds, scenes, or animation frames. The drawing system must create editable strokes/paths.
- Animation target: the creative goal is **24 independently drawn images per second**. This is not the same as displaying a smaller number of drawings at 24 FPS. Keep this requirement explicit in planning and explain its production cost.
- Build honestly in testable stages. Do not describe prototypes as a finished professional studio.

## Public Android test copy

Open the currently published test build: https://zero-studio-three.vercel.app/ . The GitHub source repository remains private. This is a manually uploaded snapshot of `feature/mobile-drawing-workspace`; it is not automatically synchronized with later GitHub commits. The 2026-11-18 source now also includes four editable vector background starters (day city, forest, interior room, night city). The public test deployment was refreshed on 2026-11-18 and now includes the four vector background presets; it remains a manually uploaded snapshot, not an automatic Git-linked deployment. Existing build features include constrained limb IK, rig-aware pose blending, the project character library, proportion guides, and the unique-drawing cadence audit. Physical Android testing is still pending.

## High-volume frame-by-frame animation

The development branch now supports a structural ceiling of 30,000 editable frames, paginated timeline thumbnails (24 per page), direct frame navigation, and frame-level undo/redo on long timelines. The provider-independent animation pipeline plans exact 24-drawing/second sequences: a 10-second shot is 240 full-scene drawings, divided by default into 40 batches of six. Each imported `.zbatch` is checked for sequence/job identity, timing, stable layer order, validated editable SVG paths, and duplicate full-frame artwork; approved progress is saved in the `.zero` project. See [high-volume animation production](docs/ANIMATION_PRODUCTION.md).

This is production infrastructure, not yet an autonomous animation generator: live provider integration, automatic retries/orchestration, IndexedDB-backed paged storage, real 240-frame art review, and physical Android stress tests remain incomplete. The 30,000-frame ceiling is structural and not a guarantee that every phone can keep a complex 30,000-frame project in memory.

## Drawing, character, and background toolset

The development branch includes four original SVG-path background presets, inserted as editable layers behind existing artwork. See [background library notes](docs/BACKGROUND_LIBRARY.md). These are starter scenes, not a finished perspective/layout department.

## Drawing and character toolset

The development workspace includes a freehand SVG pen, optional stylus-pressure outlines, vector eraser, line/rectangle/ellipse tools, shape fill, item selection/move/style/duplicate/delete, mobile pan/zoom, layer controls, topology-matched path in-betweens, and a unique-drawing cadence audit. Character tools include Nori with 12 editable parts, three starter views, four poses, four facial expressions, customizable palette, validated `.zchar` import/export, an 11-cell editable SVG model-sheet export, a project-local character library, constrained two-bone IK for four limb chains, head/neck rotation and whole-body lean, rig-aware pose blending, linked character instances, and conversion of hand-drawn vector frames into reusable character models. Background tools include four editable vector scene starters: daytime city, forest, interior room, and night city. These are useful foundations, not a completed professional full-body rig, model-sheet editor, animation suite, or background/layout department. Physical Android testing and artist review remain pending. GitHub Actions run #698 passed 112 tests with 0 failures; syntax checks include the background module.

## Start here

1. Read [PROJECT_STATUS.md](PROJECT_STATUS.md) before continuing work.
2. Read [DECISIONS.md](DECISIONS.md) before changing core architecture or constraints.
3. Read [ROADMAP.md](ROADMAP.md) to see the staged plan.
4. Record every meaningful implementation, test, limitation, and decision in the project files.

## Run the prototype

Open the public Android test copy at https://zero-studio-three.vercel.app/ . It is a manually uploaded static snapshot, not automatically synchronized with GitHub. The repository remains private. See [Android test plan](docs/ANDROID_TEST_PLAN.md) and [drawing command schema](docs/DRAWING_COMMANDS.md).

## Current drawing engine milestone

The development branch now includes project format v2 with editable per-frame layers (including renaming), a non-destructive SVG-mask vector eraser, ZIP export, and an AI scene-artist workflow that turns a text brief into multiple named editable SVG layers, previews the whole scene, and requires explicit approval. Drawing input uses coalesced pointer samples where supported and discards cancelled gestures. Version 1 projects are migrated when opened. See [AI vector drawing adapter](docs/AI_VECTOR_DRAWING.md), [drawing command and layer model](docs/DRAWING_COMMANDS.md), [engine tests](tests/engine.test.mjs), and the Android test plan.

## First animation proof

The repository includes an editable one-second, 24-frame vector waving/blinking character test at `examples/24-drawings-one-second.zero`. It is a simple pipeline proof, not professional anime animation. See [animation proof notes](docs/ANIMATION_PROOF.md).

## Current state

The repository remains the durable project record. The deployed workspace is still a test build; the earlier external v0.1 prototype has not been imported, and physical Android behavior remains unverified. See PROJECT_STATUS.md for the exact implementation status and remaining work.
