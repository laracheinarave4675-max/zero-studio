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

## Reusable character model v1

`app/character-model.mjs` defines an original Nori front-view construction model as 12 named, validated SVG path parts grouped into up to four editable layers (body, head, face, limbs). It includes three views (front, side, back), four pose presets (neutral, wave, walk, sit), and four facial expressions. The 48 combinations are covered by model validation tests; hidden parts are omitted during insertion. `validateCharacterModel` checks format/version, identity, unique part IDs, layer metadata, fixed 1920×1080 canvas dimensions, and each path through the drawing engine validator. `addCharacterModelToFrame` copies the model into a frame as ordinary stroke operations; no raster artwork, embedded SVG markup, transforms, scripts, or external assets are accepted. The workspace exposes this as an insertable starting model. A Nori palette helper allows validated line, skin, hair, clothing, and accent overrides. Models can be exported/imported as standalone `.zchar` files with a 5 MB UI import limit. It remains a starter construction study, not a polished professional turnaround or a full-body production rig. The four limb chains now have a constrained two-bone IK solver: endpoint dragging solves the intermediate elbow/knee while preserving segment lengths and a 20°–160° bend range; dragging an intermediate joint preserves both segment lengths by carrying the endpoint. Shoulder/hip dragging translates its chain. This is a basic limb rig, not full torso/head articulation, collision handling, or anatomical constraints.

## Project-local character library

`app/character-library.mjs` saves validated `.zchar` model copies into `project.characterLibrary`, loads them as editable models, and removes selected entries. The project format already carries this library through `.zero` save/open. It is capped at 100 models and 5 MB per model; no server upload is used.

## ZIP export bundle

The workspace exports a dependency-free ZIP32 archive containing `project.zero`, `manifest.json`, and one editable SVG per frame under `frames/`. Entries use UTF-8 names and are stored without compression for compatibility; ZIP32 size limits apply. Unsafe and duplicate archive paths are rejected.

## Pressure brush and in-between generation

The optional pressure brush uses stylus Pointer Event pressure samples to construct a closed variable-width SVG outline. It is enabled for pointer type `pen` when the pressure toggle is on; finger and mouse input use the normal smooth freehand path. This algorithm is an outline approximation, not a full brush engine with tilt, rotation, or texture. It must be reviewed on a real pressure-capable Android stylus.

The in-between tool interpolates corresponding numeric path tokens only when start/end frames have the same layer order and names, visibility/lock flags, operation counts and kinds, stroke/fill colors, and SVG command topology. It generates 1–24 independent editable frames. It rejects mismatched structures rather than guessing. This is not bone-based rigging or a general animation solver.

## Automated tests

Run with Node.js 22 or newer:

```sh
node --test tests/*.test.mjs
```

The suite contains 77 tests: 32 engine, 4 Gemini adapter, 6 workspace DOM, 3 ZIP, 2 animation-proof, 25 character-model, and 5 character-library tests. GitHub Actions validates the complete suite and syntax of all runtime modules.

## Unique-drawing cadence audit\n\n`analyzeDrawingCadence(frames,fps)` compares visible vector artwork signatures while ignoring frame and operation IDs. It reports frame count, unique drawing count, duplicates, duration, and average unique drawings per second against the unchanged 24-drawings/second target. The workspace exposes this report in the timeline and includes it in ZIP manifests. This measures uniqueness of saved vector content; it does not certify professional drawing quality or that each frame was freshly hand-drawn.\n\n## AI proposal path

The optional Gemini text-only adapter produces a JSON proposal of editable SVG paths. The paths are validated locally, displayed on a temporary preview layer, and only appended to the selected project layer after explicit approval. The API key is not saved in project data, local storage, or ZIP exports. See [AI vector drawing adapter](AI_VECTOR_DRAWING.md) for provider, privacy, and quota details.

## Character model packages

A model can be exported as a standalone `.zchar` JSON file and imported later. Imported packages are size-limited and validated before insertion; every part is rechecked through the SVG path validator, duplicate IDs are rejected, and optional visibility flags control which parts are inserted. A character is copied into the current frame as ordinary editable path layers. The app does not upload the character package to a server. A separate model-sheet SVG export composes 11 editable vector cells: three viewing directions, four expressions, and four poses. Each cell includes editable proportion-guide lines for center, eye, shoulder, hip, and ground reference levels.

## Geometric drawing tools

The mobile drawing palette provides a freehand pen, vector eraser, straight line, rectangle, and ellipse. Rectangles and ellipses are closed SVG paths and can optionally be filled with the current color. Every completed shape is stored as an ordinary editable stroke operation and is included in undo/redo, project save, and SVG/ZIP export.

## Item editing and viewport

Each vector operation receives a stable ID. The selection tool can select visible drawn paths, drag them to translate their geometry, update line/fill color and width, duplicate them with a new ID, and delete them. Locked layers reject transforms, style changes, duplication, and deletion. The pan tool drags the SVG viewport; zoom-in, zoom-out, and reset controls change the viewBox without changing stored drawing coordinates. Selection currently operates on visible rendered paths; masked eraser operations are not directly hit-tested as visible objects.

## Current limitations

This is still a drawing-engine prototype. The vector eraser uses non-destructive SVG masks rather than splitting paths into smaller geometric fragments. Layer renaming is implemented with an inline editor suitable for mobile screens. Item selection/move/delete and viewport pan/zoom are also implemented. SVG path command grammar and arity are checked and coordinates receive conservative cumulative bounds checks; this is not exact mathematical bounds for Bézier curves/arcs. A pressure-sensitive outline helper now exists, but has not been tested on physical stylus hardware. The live AI provider remains untested. The Gemini text-to-vector adapter is implemented but still needs a real API key test. Pointer Events consume coalesced samples where supported; a cancelled pointer gesture is discarded rather than committed. Multi-point freehand strokes are interpolated into cubic Bézier curves; this is not pressure-sensitive brush simulation and still needs physical Android feel testing. The character model provides starter view/pose/expression presets, not a fully articulated rig or professional production-ready model sheet. Geometry is pre-authored per preset; it is not freeform skeletal deformation. ZIP structure and CRC handling are covered by automated tests; browser download behavior, archive opening on Android, and SVG rendering still require device testing.
