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
- Touch/stylus point samples are converted to cubic Bézier segments using Catmull–Rom-style tangents; one-point taps and two-point straight gestures have dedicated handling.

## Project format v2

Each frame stores an ordered list of layers. A layer has an id, name, visible flag, locked flag, and ordered operations. Operations are either:

- \`stroke\`: a validated editable SVG path.
- \`erase\`: a vector path used as a black stroke in an SVG mask.

The order is significant: an eraser masks strokes created before it in the same layer; later strokes are drawn above that erase operation. The mask is non-destructive and remains editable as an operation. Undo/redo snapshots the complete document.

## Backward compatibility

The loader accepts v1 project files with \`frames[].paths\` and migrates each frame into a single layer of stroke operations. Saving afterward writes v2.

## Layer behavior

- Layers are frame-local, ordered bottom-to-top.
- Visibility, lock state, and editable layer names are stored in the project.
- Layer names can be changed in the workspace; names are trimmed, non-empty, and limited to 80 characters.
- Reordering changes compositing order.
- A frame must retain at least one layer.
- Locked layers reject drawing and erasing.
- Layer count is capped at 100; operations per layer at 10,000.

## ZIP export bundle

The workspace exports a dependency-free ZIP32 archive containing `project.zero`, `manifest.json`, and one editable SVG per frame under `frames/`. Entries use UTF-8 names and are stored without compression for compatibility; ZIP32 size limits apply. Unsafe and duplicate archive paths are rejected.

## Automated tests

Run with Node.js 22 or newer:

```sh
node --test tests/*.test.mjs
```

The suite contains 24 tests: 13 engine, 4 Gemini adapter, 2 workspace DOM, 3 ZIP, and 2 animation-proof tests. GitHub Actions run #102 passed all 24 tests and the JavaScript syntax checks.

## AI proposal path

The optional Gemini text-only adapter produces a JSON proposal of editable SVG paths. The paths are validated locally, displayed on a temporary preview layer, and only appended to the selected project layer after explicit approval. The API key is not saved in project data, local storage, or ZIP exports. See [AI vector drawing adapter](AI_VECTOR_DRAWING.md) for provider, privacy, and quota details.

## Current limitations

This is still a drawing-engine prototype. The vector eraser uses non-destructive SVG masks rather than splitting paths into smaller geometric fragments. Layer renaming is implemented. There is still no full SVG path parser, no stylus pressure curve, and no live-tested AI provider integration yet. The Gemini text-to-vector adapter is implemented but still needs a real API key test. Pointer Events consume coalesced samples where supported; a cancelled pointer gesture is discarded rather than committed. Multi-point freehand strokes are interpolated into cubic Bézier curves; this is not pressure-sensitive brush simulation and still needs physical Android feel testing. ZIP structure and CRC handling are covered by automated tests; browser download behavior, archive opening on Android, and SVG rendering still require device testing.
