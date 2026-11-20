# ZERO STUDIO

> **Current governing direction (2026-11-20):** ZERO STUDIO now follows the hybrid AI-assisted anime production architecture in [docs/NEW_HYBRID_PRODUCTION_DIRECTION.md](docs/NEW_HYBRID_PRODUCTION_DIRECTION.md) and [D-026](DECISIONS.md#d-026--hybrid-ai-assisted-anime-production-studio-2026-11-20). A specialist image-generation service may produce character/background/scene artwork; ZERO STUDIO owns character identity and continuity, scene preparation, animation, compositing, and delivery. This supersedes the older no-generation rules in historical sections below. No provider has yet been selected. Android-first workflow, free-first evaluation, visual acceptance, and the **24 independently drawn images per second** target remain in force.

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

The development branch now supports a structural ceiling of 30,000 editable frames, paginated timeline thumbnails (24 per page), direct frame navigation, and frame-level undo/redo on long timelines. The provider-independent animation pipeline plans exact 24-drawing/second sequences: a 10-second shot is 240 full-scene drawings, divided by default into 40 batches of six. Each approved batch returns a continuity note that is passed into the next batch's drawing instructions. A provider-neutral sequential worker can call a future service adapter, validate each reply, retry invalid output, stop on cancellation, and checkpoint accepted batches. Each imported `.zbatch` is checked for sequence/job identity, timing, stable layer order, validated editable SVG paths, and duplicate full-frame artwork; approved progress is saved in the `.zero` project. See [high-volume animation production](docs/ANIMATION_PRODUCTION.md).

This is production infrastructure, not yet an autonomous animation generator: the provider-neutral worker needs a live provider callback before it can draw. Live provider integration and service-specific quotas, IndexedDB-backed paged storage, real 240-frame art review, and physical Android stress tests remain incomplete. The current public test deployment was manually refreshed on 2026-11-18 to include this large-animation workspace; it is not auto-synced with GitHub. The 30,000-frame ceiling is structural and not a guarantee that every phone can keep a complex 30,000-frame project in memory.

## Free SVG generation research

Current provider findings and the next prototype steps are recorded in [docs/SVG_PROVIDER_RESEARCH.md](docs/SVG_PROVIDER_RESEARCH.md). No provider has been selected or connected; the 24-independent-drawings/second requirement remains unchanged.\n\n## Drawing, character, and background toolset

The development branch includes four original SVG-path background presets, inserted as editable layers behind existing artwork. See [background library notes](docs/BACKGROUND_LIBRARY.md). These are starter scenes, not a finished perspective/layout department.

## Drawing and character toolset

The development workspace includes a freehand SVG pen, optional stylus-pressure outlines, vector eraser, line/rectangle/ellipse tools, shape fill, item selection/move/style/duplicate/delete, mobile pan/zoom, layer controls, topology-matched path in-betweens, and a unique-drawing cadence audit. Character tools include Nori with 12 editable parts, three starter views, four poses, four facial expressions, customizable palette, validated `.zchar` import/export, an 11-cell editable SVG model-sheet export, a project-local character library, constrained two-bone IK for four limb chains, head/neck rotation and whole-body lean, rig-aware pose blending, linked character instances, and conversion of hand-drawn vector frames into reusable character models. Background tools include four editable vector scene starters: daytime city, forest, interior room, and night city. These are useful foundations, not a completed professional full-body rig, model-sheet editor, animation suite, or background/layout department. Physical Android testing and artist review remain pending. GitHub Actions run #698 passed 112 tests with 0 failures; syntax checks include the background module.

## Canvas-first artist engine (2026-11-19)

The approved direction is a native Canvas2D raster painting engine. New drawing work prioritizes pressure-sensitive brush strokes, natural-media rendering, editable stroke records, raster layers, compositing, deterministic replay, and mobile-safe storage. SVG is no longer the planned foundation or an artist-engine development priority; existing vector projects are legacy compatibility during migration. No generative image/video model may create or modify final artwork. The 24 independently drawn images-per-second target remains unchanged. See [Native Artist Engine Plan](docs/NATIVE_ARTIST_ENGINE_PLAN.md) and [D-025](DECISIONS.md).

## Human-authored anime production direction (2026-11-19)

ZERO STUDIO is a human-led studio, not an image generator. Final backgrounds, characters, props and animation drawings are painted by a human artist in a professional Android drawing application. Generative image/video models must not create or alter final artwork. ZERO STUDIO manages production, layers/assets, continuity, animation timing, compositing and delivery. Layered PSD/OpenRaster/PNG interchange must be validated on the target phone before selecting a format; artwork must never be silently flattened. The target remains 24 independently drawn moving-art images per second. See [Human Art Workflow](docs/HUMAN_ART_WORKFLOW.md), [Anime Art Direction](docs/ANIME_ART_DIRECTION.md), and [Architecture Decisions](DECISIONS.md).

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


## Approved hybrid art architecture — 2026-11-19

The current approved direction is **human-painted raster as the primary final-art path, with native SVG retained as an optional first-class editable path**. ZERO STUDIO must support mixed raster/vector layers, preserve source files and layer metadata, and never silently flatten an imported project. Existing SVG projects remain supported. This supersedes the older vector-first requirement recorded in the historical D-022 paragraph above; D-023 is the current governing decision. PSD, OpenRaster, and PNG-layer bundles remain unverified candidates until a real Android round-trip succeeds. The animation target remains 24 independently authored moving-art drawings per second. See [Hybrid Art Architecture](docs/HYBRID_ART_ARCHITECTURE.md), [Layered Asset Interchange Plan](docs/LAYERED_ASSET_INTERCHANGE.md), and [D-023](DECISIONS.md).

The first code foundation now includes a typed raster/vector asset-manifest validator and a mixed-layer structural cadence signature in app/hybrid-assets.mjs, with tests in tests/hybrid-assets.test.mjs. This is not yet a PSD/ORA importer, raster compositor, or complete animation integration.
