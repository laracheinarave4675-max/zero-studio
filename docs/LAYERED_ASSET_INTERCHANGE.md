# ZERO STUDIO — Layered Asset Interchange Plan

**Status:** planned; no external layered format is verified end-to-end on the user's Android phone.

## Candidate formats
- PSD: verify layer names/order, visibility, opacity, alpha, blend modes, dimensions, color profile, masks, and whether the selected app exports layers on its free tier.
- OpenRaster (.ora): verify layer stack, names, visibility, opacity, composite mode, source PNGs, merged preview, and Android app support.
- ZIP of PNG layers plus manifest: verify stable ordering, alpha, dimensions, metadata, source preservation, and robust validation.

No format is supported based on documentation or a marketing claim alone.

## Required proof document
Create a small test artwork in the selected Android painting application containing three named transparent layers in known bottom-to-top order, different visibility states, non-100% opacity on at least one layer, semi-transparent marks, transparent empty areas, known canvas dimensions, and a flattened reference preview for pixel comparison only.

Export the native source and candidate interchange package. Import into ZERO STUDIO, save as .zero, close/reopen, and export again. Compare the layer stack and rendered output against the reference. Keep the original package unchanged.

## Validation requirements
Reject path traversal, duplicate/empty layer IDs, malformed manifests, unsupported MIME types, oversized files, invalid dimensions, and excessive layer counts. Preserve stable IDs or record deterministic source-to-project mapping. Preserve names, order, visibility, opacity, alpha, supported blend mode, and source identity. Report unsupported effects explicitly; never silently approximate them. Keep raster layers distinct from SVG layers. A composite preview is derived and cannot be the sole saved representation.

## Engineering sequence
1. Confirm the painting app actually installed/usable on the target Android phone.
2. Create and export the three-layer proof.
3. Inspect package structure and parser constraints.
4. Implement safe metadata validation and archive inspection.
5. Implement import for the single proven format, not speculative PSD and ORA parsers in parallel.
6. Add round-trip fixtures and mixed raster/vector compositing tests.

The existing project has an experimental Canvas brush and vector/SVG project model. It does not yet have a verified PSD/ORA importer, production raster layer editor, or mixed raster/vector project round-trip. Do not claim these capabilities before implementation and tests.
