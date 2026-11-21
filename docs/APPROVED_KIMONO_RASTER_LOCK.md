# Approved Kimono Character — Raster Identity Lock

Status: **identity-specific procedural prototype; visual fidelity is not yet accepted**.

Reference: gallery asset \`be172712-e073-4d06-9587-eec7e6c62a84\`, a three-view model sheet (front, side, back).

## Locked design data

The renderer has a versioned immutable character profile. Its fixed fields describe the side-view silhouette, facial profile and visible eye, long glossy black hair and fringe, ivory kimono with rose gradient and sakura motifs, red-rose collar, dusty-rose obi and gold cord, and rose sandals. Palette, geometry grammar and line style are constants. The frame renderer only accepts a separate bounded motion record; a caller cannot override identity fields.

## Raster pipeline

Each of the 24 exposures is fully painted from the character drawing grammar onto a newly allocated Canvas 2D surface, then encoded as PNG. No reference image pixels are moved into the final frame, no SVG is emitted, no puppet or mesh is used, and no image model is called. Pixel hashes reject duplicate outputs. Each frame carries the same identity fingerprint and is rejected if its identity metadata changes.

## Important fidelity limit

This is an authored procedural interpretation of the model sheet, not a pixel-exact reconstruction. Three orthographic views do not fully specify hidden anatomy, cloth folds for every pose, expressions, or exact line placement. An immutable metadata fingerprint proves that the software kept its own design record unchanged; it does not prove that every rendered pixel matches the source sheet. Visual comparison against the model sheet and artist-quality acceptance are still required before production.

## Acceptance gate

Review front/side/back visual characteristics, side-view face, fringe, hair length and shine, collar crossing, obi and cord, sakura distribution, sleeve cut, skirt gradient and sandals. Then check multiple walking poses, not only a single frame. If the render drifts, change the drawing grammar and re-run the whole proof; never silently relax the identity constraints.
