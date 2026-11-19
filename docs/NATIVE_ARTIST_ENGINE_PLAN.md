# ZERO STUDIO — Native Artist Engine Build Plan

**Approved:** 2026-11-19  
**Constraint:** No generative image or video models anywhere in the final-art pipeline.  
**Target device:** Android phone; free-first; no desktop assumption.

## Objective

Build a human-operated painting engine capable of carrying a detailed cinematic 2D anime background. The engine is a real drawing surface: pixels are created only from touch/stylus strokes and explicit deterministic editing tools. This plan does not promise professional quality before a complete scene is painted and reviewed.

## Protected foundations

- Make Canvas2D raster painting the primary artist workspace and final-art pipeline.
- Store each brush stroke as editable structured data (samples, pressure, brush, color, blend mode, texture and deterministic seed), alongside its rendered pixels.
- Build raster-native layers, masks, alpha lock, clipping, undo/redo and replay. Do not spend new development effort extending SVG drawing features.
- Treat existing vector content as legacy compatibility only during migration; it must not dictate the new artist engine architecture.
- Preserve the 24 independently drawn moving-art images per second target.
- Never silently flatten source artwork or claim PSD/ORA support without Android round-trip tests.
- No generative image/video model may create or alter visual content.

## Build sequence

### A. Canvas-first stroke core
- The artist draws directly into persistent Canvas2D raster surfaces; do not decode and re-encode the full PNG for every stroke.
- Coalesced pointer samples, stable interpolation, pressure/velocity response, tapered starts and ends.
- Brush tip shape, spacing, rotation, tilt where available, texture and deterministic replay.
- Pencil, ink, gouache, watercolor, foliage and smudge as distinct material behaviors.
- Explicit alpha/compositing semantics; eraser must remain predictable.
- Stroke data/history must support undo, redo, save/reopen and bounded mobile memory.

### B. Layer and paint operations
- Raster-layer compositing with normal, multiply, screen, overlay, darken and lighten.
- Layer opacity, lock, visibility, reorder and non-destructive masks.
- Alpha lock/clipping and selection-based paint constraints.
- Transform/crop without mutating the original imported source.
- Color sampling and stable color management; preserve profile metadata when available.

### C. Natural-media behavior
- Wet-edge pooling and pigment granulation for watercolor.
- Opaque layered pigment, dry-brush breakup and bristle direction for gouache.
- Graphite grain and pressure taper.
- Smudge/mix operations only after mobile performance and undo semantics are measured.
- Foliage marks must vary in silhouette, scale, direction, overlap and light response; avoid repeated identical stamps.

### D. Mobile reliability
- Test Android touch and stylus input, pointer cancellation, palm rejection behavior where the browser exposes it, pressure fallback, orientation and viewport mapping.
- Tile large canvases and avoid full-resolution base64 decode/re-encode on every stroke.
- Measure memory, latency, undo storage, autosave and project reopen on the target phone.
- Never advertise support beyond measured canvas size/performance.

### E. Art proof and visual gate
Paint one complete Japanese forest-house background manually using only ZERO STUDIO's in-app tools. Required separately editable layers: distant atmosphere/sky, far canopy, near canopy, house plaster/timber, roof tiles/eaves, windows/veranda, stone wall/ground, light and shadow accents. Review at full resolution and shot scale against the user's reference. Revise demonstrated defects; do not substitute automated scores or code metrics for artist approval.

## Current verified work in this milestone

- Native Raster pencil/brush creates pixel data on PNG-backed layers from real pointer/stylus input.
- Continuous pressure-shaped ribbon, watercolor wash, directional foliage marks.
- Added per-stroke blend modes: normal, multiply, screen, overlay, darken, lighten.
- Added visible Arabic blend-mode control in the Raster brush panel.
- Added regression tests for blend-mode selection and eraser precedence.
- This is an incremental engine improvement, not yet proof of professional natural-media quality.

## Immediate next tasks

1. Move the primary drawing surface and pointer input to a Canvas2D workspace.
2. Replace per-stroke full-image decode/encode with persistent canvases and bounded tile/cache storage.
3. Replay editable stroke records deterministically after save/reopen; add stroke-level undo/redo.
4. Add taper/velocity-aware dynamics and brush-tip controls.
5. Add raster-native masks, alpha-lock and clipping.
6. Perform physical Android drawing and memory tests.
7. Paint and inspect the full forest-house study before expanding scope.


## Architecture correction — Canvas-first (2026-11-19)

The user explicitly approved Claude's Canvas/WebGL raster-engine direction and instructed the project to stop treating SVG as the drawing foundation. New artist-engine development is Canvas2D/raster-first. Existing vector data may remain readable only as a migration/compatibility concern; it is not the target drawing medium and must not consume the artist-engine roadmap. This does not authorize generative image/video models. The immediate implementation stores editable stroke samples and brush settings on raster layers, in addition to the current rendered PNG. Persistent Canvas surfaces, deterministic replay, and eliminating per-stroke PNG decode/encode are still required before this can be called a complete Canvas-first engine.
