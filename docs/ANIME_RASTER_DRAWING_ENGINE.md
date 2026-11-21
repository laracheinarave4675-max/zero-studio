# ZERO STUDIO — Procedural Raster Drawing Proof

Status: **renderer proof only; character-identity reconstruction is not implemented**.

## Scope

This experiment tests whether the studio can create a complete raster exposure from a local drawing grammar without requesting an image from a model for every frame. It paints each frame on a newly created Canvas 2D surface, using pressure-tapered ink contours, fills and simple colour shading.

The demo is a generic kimono study authored in code. It is not extracted from, traced from, or matched to the approved character model sheet.

## Constraints

- No FLUX, Workers AI, remote image provider or per-frame image generation.
- No SVG output.
- No imported source image, cut-out layer, mesh warp, skeletal skinning or source-image transform.
- Every frame is painted onto a new Canvas surface.
- Each PNG is hashed from RGBA pixels; duplicate hashes are rejected.
- One second at 24 FPS, one exposure per frame.

## What it proves

The browser can run a deterministic, local raster renderer that creates 24 distinct pixel buffers from a programmed drawing grammar. This is a renderer/cadence proof, not an identity-preservation proof.

## What it does not prove

It does not translate the user's model sheet into a detailed drawing grammar and does not reproduce the user's actual character. The face, hair, clothing and proportions in the demo are explicitly authored in code and remain limited.

## Next gate

Define a rich data representation for the approved character's face profiles, eye construction, hair clumps and strands, costume panels, folds, line-weight maps, colours and view-specific rules. Validate that representation against all approved model-sheet angles. A single 2D view cannot uniquely specify hidden surfaces and all poses. Do not accept a production sequence until the character's visual identity is proven on several test poses.