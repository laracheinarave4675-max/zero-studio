# ZERO STUDIO — First 24-Frame Animation Proof

## Deliverable

`examples/24-drawings-one-second.zero` is an editable native ZERO STUDIO v2 project containing an original simple anime-inspired mascot named Nori and a one-second wave/blink action.

- 24 frames.
- Playback setting: 24 FPS.
- All 24 complete frame documents are distinct.
- The animated arm path differs in every frame; the eyes blink during the sequence.
- Three editable layers per frame: body/clothes, face/expression, and waving motion.
- Every element is an editable SVG path operation. No raster artwork or image/video generation was used.

## What this proves

The project format, frame timeline, and export pipeline can hold a one-second sequence with 24 distinct vector drawings. A regression test verifies the frame count, FPS, unique frame documents, and unique arm paths.

## What it does not prove

This is a deliberately simple vector mascot test, not professional anime-quality animation. Static anatomy paths are reused across frames while the moving arm and facial expression change; it is not 24 completely redrawn full-body poses. Motion quality, anatomy, line quality, and Android playback still need human review. It does not demonstrate autonomous AI drawing or achieve a 20-minute episode workload.
