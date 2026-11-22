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

## Current limitation / next implementation step
The repository currently contains a remote three-view kimono gallery reference and a procedural approved-kimono drawing profile; it does not contain the user's original gallery PNG as a local binary asset. The new engine is ready to accept that reference image and artist-authored masks, but it does not yet provide an interactive mask-painting UI or automatically segment the gallery image. The next step is to build that editor, import the exact reference image from the user's library, author the first masks, and then test a tiny hair/sleeve motion without changing the face.
