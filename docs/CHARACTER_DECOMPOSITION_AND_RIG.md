# ZERO STUDIO — Pixel-Preserving Character Decomposition

## Scope
This is the first production-oriented foundation for separating an approved raster character into editable animation parts without repainting or silently changing the original artwork.

The decomposition engine does not infer semantic masks. A human-authored mask editor or a verified segmentation provider must supply one binary mask per part. The engine validates those masks, extracts original pixels, and rejects gaps, overlaps, transparent-pixel claims, duplicate IDs, and changed pixels.

## Source and identity invariants
- The complete RGBA source is retained and fingerprinted. The current FNV pixel hash is an integrity checksum, not cryptographic authentication.
- Every non-transparent source pixel must belong to exactly one part.
- Part masks must be binary and disjoint; antialiased edge pixels remain in the original RGBA source.
- Part pixel bytes are copied unchanged from the source. Recomposition must match the source pixel-for-pixel.
- Face and other identity-critical parts default to locked. The rig can only apply bounded rigid transforms to explicitly unlocked parts.
- No mesh warp, optical flow, interpolation, generative fill, or automatic inpainting is performed.

## Hidden-area recovery
Separating a foreground part exposes areas that were occluded in the original image. Those pixels do not exist in the source and cannot be recovered by cropping. Each occlusion therefore needs an explicit patch:
- manual-paint: manually authored pixels;
- clone-source: pixels cloned from an approved source region;
- approved-reference-patch: pixels copied from another approved view/drawing.

The patch must cover every pixel in its binary repair mask and remains pending until explicitly approved. A decomposition is not ready for motion while any required repair is unapproved. This is intentionally honest: no synthetic fill is described as recovered source detail.

## Rig behavior
The initial rig is rigid-layer-only. Each decomposed part has exactly one node. Parent links are checked for missing nodes and cycles. Default movement limits are conservative (±4 px, ±0.035 rad, scale 0.99–1.01); callers can request wider limits only within hard caps. Identity-locked nodes ignore all transform requests.

Good first motions: slight hair-tip follow, sleeve lag, and tiny torso breathing. Do not move face features independently. A blink should use an approved alternate eye drawing/expression asset, not squash the original eye pixels.

## Quality gates
1. Source hash remains unchanged.
2. Recomposition of all source parts is pixel-exact.
3. Every source pixel is assigned exactly once.
4. All hidden-area repairs have complete pixel coverage and explicit approval.
5. Rig node graph is valid and every part is represented exactly once.
6. Identity locks remain fixed and transforms remain inside limits.
7. The original source image remains available for rollback.

## Current implementation and next gate — 2026-11-22

- `app/character-sheet-segmentation.mjs` separates three non-touching views by border-connected near-white background removal and connected components. It fails closed when the expected number of views is not found.
- A second view-local cleanup removes large enclosed near-white matte pockets only in the lower 10% of a character view (minimum 96 connected pixels), and low-chroma pale ground-shadow components in the lower 7% (minimum 40 connected pixels). Small highlights and warm skin/shoe pixels are retained. This is a conservative matte heuristic, not semantic segmentation; the supplied kimono sheet was visually checked after cleanup.
- The mobile lab supports original-image upload, front/side/back view selection, a one-tap front-view anatomy-layer scaffold, brush-based mask authoring, and connected-color selection with adjustable per-channel tolerance. It also supports sparse pixel-level undo/redo (up to 30 recent mask operations) and live per-layer pixel counts, so accidental brush strokes or over-selection can be reversed without snapshotting the entire image. The smart selector uses four-neighbour flood fill and does not label a region as hair, face, or clothing.
- The recovery UI supports manual paint and clone-source patches from the same approved view. Recovery patches still require review and explicit approval.
- The front-view scaffold creates empty editable layer records (rear hair, front hair clumps, face, neck, sleeves, torso, obi, hands, skirt, feet and shoes). It does not create the masks automatically.
- The lab exports each authored part and repair as a transparent cropped PNG inside a deterministic ZIP archive, alongside the full decomposition JSON and a manifest containing source hash, canvas size, part order, roles, bounds, locks, pixel hashes, and repair approval status. ZIP path traversal and duplicate entry names are rejected. Export is an interchange package; it does not claim that any empty mask has been authored.
- Latest ZIP/export verification head `bb318e19d596dda5ca56d89d5e47f58f986b0f63`: Drawing Engine and Hybrid raster/SVG workflows passed 506/506 tests, and raster brush proof succeeded.
- The latest CI head `330b52f02ca32146a267ccec97f4716cd269b784` passed 501/501 tests in both Drawing Engine and Hybrid raster/SVG workflows; the native raster proof also succeeded.
- The user-provided source image remains a conversation asset rather than a committed repository binary. The downloadable cleaned PNG crops are deliverables, not silently written into the library.

Next gate: author and review the actual front-view masks, then the hidden-area patches behind the front hair and sleeves. Only after those patches are approved should the first bounded hair/sleeve motion be tested. No current claim of completed semantic decomposition, completed hidden-region reconstruction, or accepted animation is made.


## Smart-selection ownership safety and mobile memory

- The connected-color selector now receives an eligibility mask that allows transfer only from the base/unassigned layer or the currently active part. Pixels already assigned to another anatomical layer are hard barriers, preventing a later selection from silently stealing authored hair/face/garment pixels.
- The flood-fill queue now grows geometrically from a small initial allocation rather than allocating one 32-bit queue slot for every source pixel up front. The selected mask remains image-sized, but ordinary small selections no longer reserve a full-image queue.
- Regression tests cover ownership barriers and a full connected region that forces queue growth.
