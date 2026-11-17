# ZERO STUDIO Drawing Commands v1 and Layer Model

The drawing interface accepts editable vector path operations. It does not accept raster images or generated image payloads.

## Drawing command envelope

\`\`\`json
{"version":1,"operations":[{"type":"path","d":"M 100 100 L 300 300","stroke":"#172033","width":5,"fill":"none"}]}
\`\`\`

- Version must be integer 1; at most 100 operations per submission.
- Path data supports M/m, L/l, H/h, V/v, C/c, S/s, Q/q, T/t, A/a, Z/z.
- Data is length-limited and numeric coordinates are range-checked.
- Stroke/fill colors are restricted to hex values or a small named-color allowlist.
- Width is clamped to 0.2–100 SVG units.
- Canvas viewBox is 1920×1080.
- Raster payloads, data URLs, external URLs, scripts, event attributes, and embedded HTML are rejected.

## Project format v2

Each frame stores an ordered list of layers. A layer has an id, name, visible flag, locked flag, and ordered operations. Operations are either:

- \`stroke\`: a validated editable SVG path.
- \`erase\`: a vector path used as a black stroke in an SVG mask.

The order is significant: an eraser masks strokes created before it in the same layer; later strokes are drawn above that erase operation. The mask is non-destructive and remains editable as an operation. Undo/redo snapshots the complete document.

## Backward compatibility

The loader accepts v1 project files with \`frames[].paths\` and migrates each frame into a single layer of stroke operations. Saving afterward writes v2.

## Layer behavior

- Layers are frame-local, ordered bottom-to-top.
- Visibility and lock state are stored in the project.
- Reordering changes compositing order.
- A frame must retain at least one layer.
- Locked layers reject drawing and erasing.
- Layer count is capped at 100; operations per layer at 10,000.

## Current limitations

This is still a drawing-engine prototype. The vector eraser uses non-destructive SVG masks rather than splitting paths into smaller geometric fragments. There is no layer rename UI yet, no full SVG path parser, no stylus pressure curve, and no AI provider. Browser/Android behavior and export rendering still require device testing.
