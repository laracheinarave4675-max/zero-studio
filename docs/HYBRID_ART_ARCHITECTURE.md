# ZERO STUDIO — Hybrid Art Architecture

Approved 2026-11-19. Architecture: raster-primary, vector-optional, mixed-layer capable. Target device: Android. Final-art marks must be human-authored.

## Product model
ZERO STUDIO is the production workspace for a human-led anime studio. It manages episodes, shots, asset versions, layer organization, continuity, animation timing, compositing, review, and delivery. Artists may paint raster artwork in a professional Android painting app or draw editable vector artwork in ZERO STUDIO. The application must support both without forcing conversion to one representation.

## Asset types
1. Raster layer: human-painted pixels retained as lossless source data with dimensions, pixel density, MIME type, alpha, color-profile metadata when available, and provenance.
2. Vector layer: editable SVG/path content retained as source data, with semantic layer identity and supported vector effects.
3. Derived composite/preview: rendered output for playback, review, or export. It is never a replacement for source layers.

Every layer has a stable ID, name, type, order, visibility, opacity, blend mode, and source identity. Raster layers retain original package/file identity and image metadata. Vector layers retain source SVG/path data and editability. Unsupported metadata/effects must be reported; no silent flattening or lossy conversion is allowed.

## Editing responsibilities
- ZERO STUDIO native tools: primary human-operated Raster painting (graphite, ink, gouache-like continuous strokes, watercolor washes, directional foliage marks) plus optional editable SVG authoring. The current brush system remains a technical foundation, **not yet a professional natural-media engine**; wet mixing, pigment simulation, masks, tilt response, Android validation and full-scene visual acceptance remain open.
- Optional external authoring/import: artist-painted PNG/WebP/JPEG layers may be imported, but an external painting application is not a mandatory dependency.
- Production workspace: asset import, naming, shot/scene organization, continuity notes, frame timeline, compositing, unique-drawing audit, and delivery.

A third-party painting app may be used for authoring but must not be a mandatory runtime dependency. Android import must be validated on the actual phone before a format is declared supported.

## Interchange policy
PSD, OpenRaster (.ora), and ZIP bundles of lossless PNG layers plus a manifest are candidates only. No format is supported until a three-layer round-trip verifies names, order, visibility, opacity, alpha, dimensions, and source preservation on Android. Keep the original package unchanged. A flattened preview may accompany the import but cannot replace layers. See LAYERED_ASSET_INTERCHANGE.md.

## Animation contract
Playback rate is 24 FPS; the unique moving-art target is 24 independently authored drawings per second. Each timepoint may composite an approved static background with its own moving artwork. Static backgrounds may be reused only while camera and layout remain fixed. Raster and vector layers are both allowed in each drawing. Duplicated holds, tween-only movement, transforms of a still, and generated video do not count. Report playback FPS and unique moving drawings/second separately. Automated signatures do not prove authorship or artistic quality.

## Migration
Existing .zero projects and SVG-only assets must continue to open and export. Add explicit raster support without destructively migrating old vector layers. Keep versioned migrations and regression fixtures. Never bulk-convert existing SVG art to raster.

## Delivery stages
1. Architecture and D-023 decision record.
2. Native Raster pencil/brush drawing path with continuous pressure-shaped strokes.
3. Paint and visually inspect one detailed background against the user's reference; refine the core stroke/render path until it can carry organic foliage, timber, tile and stone marks.
4. Validate save/reopen, undo, memory limits and touch/stylus behaviour on Android.
5. Preserve mixed raster/vector compositing, then validate optional lossless layer interchange.
6. Hybrid animation frames and mixed-format cadence audit, retaining 24 unique drawings/second.

## Non-goals
Do not replace SVG with bitmap-only rendering, call the experimental brush professional, claim PSD/ORA support before tests, reduce 24 independent moving drawings/second, or use image/video generation for final artwork.


## Native raster brush foundation — 2026-11-19

A first in-app human-operated pixel painting path is now implemented alongside SVG tools. The Raster pencil and Raster brush create or paint on actual PNG-backed layers; they do not append SVG path operations. Brush profiles include graphite-like pencil grain, ink, textured gouache-like marks, soft watercolor-like dabs and foliage marks. Tablet pressure is sampled when available; source-image aspect ratio and letterboxing are accounted for when painting imported layers. Raster editing history is bounded more aggressively for large image documents to reduce mobile memory pressure.

This is the beginning of the native paint engine, not a claim of parity with mature digital painting software. Still required: more natural stroke interpolation, brush-tip/material simulation, alpha lock/clipping/masks, layer transforms, large-canvas performance benchmarks, Android pen/touch tests, and visual artist acceptance against the reference paintings.


## Active drawing correction — 2026-11-19

The previous Raster renderer placed repeated oval dabs along multi-point strokes. That produced a dotted/airbrush-like impression rather than continuous painted contours. The current branch replaces the main graphite/ink/gouache path with a pressure-shaped closed ribbon and separate bristle tracks; watercolor and foliage retain material-specific wash/leaf rendering. This corrects a core drawing primitive but does not mean the engine has achieved professional anime-background quality.
