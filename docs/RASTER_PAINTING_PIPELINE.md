# ZERO STUDIO — Raster brush foundation

## Why this exists
The previous environment artist assembled large numbers of predetermined SVG primitives. That is procedural vector construction, not painterly drawing. Adding more paths to that system cannot fix the underlying visual grammar.

This module introduces a separate **Canvas 2D raster brush primitive** for actual touch/stylus mark-making. It converts user-supplied point samples into pressure-aware, resampled brush dabs with soft pigment falloff, optional grain flecks, tilt response, and deterministic variation. It does not invent a scene, draw a building, or claim to create human artwork: the marks still come from a human's input points.

## API
- `normalizeBrushSettings(settings)`: bounds and validates brush parameters.
- `resampleBrushStroke(points, settings)`: interpolates point samples at brush-relative spacing while preserving pressure and tilt.
- `paintRasterBrushStroke(context, points, settings)`: paints the stroke into a supplied Canvas 2D context and returns its stamp count and bounds.

## Artistic pipeline required next
1. Human-authored composition/layout and perspective guides.
2. Human-drawn roughs, line art, color keys, and paint strokes using the raster brush.
3. Material-specific brush presets and layered raster compositing.
4. A project format for editable raster layers/strokes, undo/redo, autosave, and export.
5. Background/character departments remain separate; animation production retains 24 independently authored drawings per second.

## Explicit limitations of this first foundation
- This commit adds the brush core and deterministic unit tests only. It is not yet connected to the Android workspace, project serialization, layer panel, or export pipeline.
- It does not convert the existing procedural SVG scenes into paintings.
- It does not use Gemini or any image-generation model to produce final artwork.
- It does not yet provide a complete natural-media simulation (watercolor, gouache, oil, paper absorption, pigment mixing), pressure calibration, stylus barrel rotation, or multi-layer raster history.
- No claim of reference-quality anime art is made until the brush is integrated into the workspace and an artist can paint and inspect a complete scene.

## Verification
Run `node --test tests/raster-brush-engine.test.mjs`.
