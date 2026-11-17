# ZERO STUDIO Drawing Commands v1

This is an editable vector drawing interface, not an image-generation interface.

Example:
```json
{"version":1,"operations":[{"type":"path","d":"M 100 100 L 300 300","stroke":"#172033","width":5,"fill":"none"}]}
```

- version must be integer 1.
- operations: array, maximum 100 per submission.
- Currently supported type: path only.
- d: SVG path-data string, maximum 20,000 characters.
- Allowed commands: M/m, L/l, H/h, V/v, C/c, S/s, Q/q, T/t, A/a, Z/z.
- stroke/fill: hex colors or allowlisted names; fill may be none.
- width is clamped to 0.2–100 SVG units.
- Canvas viewBox: 1920×1080.
- Accepted operations become editable SVG path elements.
- Raster images, data URLs, external URLs, scripts, event attributes, and embedded HTML are not supported.

Limitations: no semantic character anatomy, rigging, layers, or autonomous in-betweening yet. The eraser is currently a white stroke on a white canvas, not a true alpha-aware vector eraser. A complete SVG parser and geometric bounds validation remain future hardening tasks. Commands are pasted manually; no AI provider is connected.
