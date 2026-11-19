# ZERO STUDIO — Human-authored Art Workflow

**Decision status:** approved by the user on 2026-11-19  
**Primary device:** Android phone  
**Art policy:** no generative image or video model may create final artwork.

## Product identity
ZERO STUDIO is a human-led anime production studio, not an automatic picture generator. The artist makes the visual decisions and paints the artwork. ZERO STUDIO organizes the work, protects continuity, manages layers and frames, and assembles the finished sequence.

## Department split

### 1. Professional painting workspace
Use a purpose-built raster painting application on Android for the actual background and character painting. It must provide:
- natural-media and textured brushes, pressure/tilt where supported;
- layers, alpha lock, clipping/masks and blend modes;
- perspective rulers/guides and selection/transformation tools;
- high-resolution canvas and lossless export;
- a dependable interchange route that can be tested on the target phone.

Do not pretend that a minimal in-app Canvas brush is equivalent to a mature painting application. The experimental raster brush module is not the final art engine and must not be used to claim painterly quality.

### 2. ZERO STUDIO production management
ZERO STUDIO remains responsible for:
- episode, sequence and shot organization;
- scene briefs, shot lists, camera/layout notes and continuity records;
- character model sheets, expression/pose references and approved palettes;
- background/foreground/character department separation;
- importing and organizing artist-authored assets;
- frame timeline, 24-fps playback, unique-drawing audit and compositing;
- sound, edit, review, versioning and export planning.

### 3. Asset interchange
Do not choose an interchange format based on assumptions. Prototype and test:
1. layered PSD if supported by both the selected Android painting app and ZERO STUDIO;
2. OpenRaster (.ora) if both sides preserve layer names, order, opacity and visibility;
3. otherwise a ZIP bundle of lossless PNG layers plus a manifest, with a flattened preview.

Every import must validate dimensions, file sizes, layer count, names, ordering and alpha. Preserve source files unchanged. Never silently flatten an editable layered source. Record unsupported blend modes or metadata as warnings.

### 4. Art pipeline
1. Artist establishes composition, perspective and value grouping.
2. Artist paints rough color and silhouette masses.
3. Artist refines architecture, foliage, materials, lighting and atmosphere.
4. Artist reviews at full size and at shot scale.
5. Approved artwork is imported as named layers into ZERO STUDIO.
6. Characters and moving foreground are drawn independently for each required frame.
7. ZERO STUDIO composites each drawing with the fixed background and audits continuity and unique drawing count.

## 24 drawings per second
The user's target remains 24 independently drawn images per second. This is not replaced by 12 fps, duplicated frames, tweening, camera pans over a still, or generated video. A fixed background can be reused because it is not moving artwork; every moving character/foreground timepoint must have its own independent drawing. State the cost and storage implications honestly before a long production.

## AI boundary
AI may assist with non-art production tasks only when useful: script breakdown, shot lists, continuity checklists, naming, metadata, technical validation and critique notes. It may not generate, inpaint, outpaint, upscale-generatively, or otherwise synthesize final visual pixels or drawing strokes. Human artist decides and executes all final visual marks.

## Immediate implementation sequence
1. Stop expanding procedural SVG scene painters as a route to painterly quality.
2. Select one Android painting app only after confirming actual phone compatibility and required features.
3. Build an interchange proof using a tiny test document with three named transparent layers, opacity changes and alpha.
4. Import that proof into ZERO STUDIO without flattening; verify layer order and dimensions.
5. Build shot/asset browser and continuity metadata around the validated interchange.
6. Only then plan the full background and animation workflow.

## Acceptance gates
- A human can paint a detailed background in the selected app on the target Android phone.
- The same artwork enters ZERO STUDIO with layers intact and without quality loss.
- A saved project reopens with all layer metadata and previews intact.
- The final composite is visually inspected by the artist; no AI score substitutes for artistic approval.
- Animation reports playback FPS and unique drawings/second separately.
