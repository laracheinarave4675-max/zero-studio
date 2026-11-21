# Reference-preserving raster atlas prototype

Status: **first localized-redraw proof; not an approved full walk cycle**.

## Why this changes the previous approach

The previous procedural renderer recreated the face, hair, kimono and decorations from drawing instructions on every frame. An immutable identity object only locked metadata; it did not lock the visible pixels. This prototype instead extracts native-resolution raster assets directly from the approved three-view model sheet and uses the side-view figure as a fixed identity plate.

## Atlas contents

The browser extracts the side figure, face/hair region, sleeve/pattern region, obi/cord, kimono pattern, lower hem and original sandals from gallery asset `be172712-e073-4d06-9587-eec7e6c62a84`. The source sheet is expected to be 1280×720. Crops are drawn at their original pixel size; the atlas does not ask a model to reconstruct them.

## Frame construction

For each of 24 one-exposure frames, the renderer:
1. Allocates a fresh 256×720 raster canvas.
2. Repaints the side-view reference crop at a fixed origin and native pixel size.
3. Clears only the two footwear regions.
4. Draws two new foot/sandal poses with the existing tapered raster ink brush and the character's rose/ivory palette.
5. Hashes the full frame and a separate identity region above the motion zone.

The audit requires 24 distinct full-frame pixel hashes and one shared pixel hash for the preserved identity region. No image-model inference, SVG output, puppet transform or mesh deformation is used.

## Honest limits

This is not yet a complete walk cycle. It deliberately holds the head, hair, torso, sleeves, obi, skirt and kimono decoration exactly still, while redrawing only the feet. That is a controlled experiment to validate exact visual preservation and localized drawing. It will likely look like a limited lower-body motion test rather than natural walking.

The next extension must create pose-specific replacement drawings for the sleeve/hand, hair ends, and lower kimono folds, while retaining unaffected source pixels at their native position. These variable zones must be repainted, not translated as sprites. Each frame will still be composed anew on a fresh raster surface. Do not call this artist-quality or production-ready until a visual review accepts the character and the whole motion.
