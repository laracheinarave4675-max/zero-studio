# ZERO STUDIO — Human-authored Art Workflow

**Decision status:** approved by the user on 2026-11-19  
**Primary device:** Android phone  
**Art policy:** no generative image or video model may create final artwork.

## Product identity
ZERO STUDIO is a human-led anime production studio, not an automatic picture generator. The artist makes the visual decisions and paints the artwork. ZERO STUDIO organizes the work, protects continuity, manages layers and frames, and assembles the finished sequence.

## Department split

### 1. Native human painting workspace
The active ZERO STUDIO canvas is the primary in-app painting surface. Raster pencil/brush input creates editable pixel layers from actual touch or stylus gestures. Multi-point brush rendering must preserve pressure changes, continuous stroke contours, material texture and tapered marks rather than approximating every stroke with circular stamps.

The current implementation remains a foundation, not a mature natural-media engine: wet pigment mixing, brush-tip dynamics, smudge, alpha-lock/clipping, masks, tilt response and long-session Android performance are not yet accepted. Imported PNG/WebP/JPEG layers are optional; an external painting app is not a prerequisite. Native SVG remains optional and editable.

Do not claim painterly quality until a complete scene is painted with the active in-app tools and visually compared against the approved reference.

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
1. Artist establishes composition, perspective and value grouping on native Raster layers.
2. Artist paints rough color and silhouette masses with continuous human-operated strokes.
3. Artist separates architecture, roof, foliage, stonework, lighting and atmosphere into named layers.
4. Artist reviews at full size and at shot scale; failed scenes are revised, not excused by path counts.
5. Optional artist-authored external layers may be imported without flattening.
6. Characters and moving foreground are drawn independently for each required frame.
7. ZERO STUDIO composites each drawing with the fixed background and audits continuity and unique drawing count.

## 24 drawings per second
The user's target remains 24 independently drawn images per second. This is not replaced by 12 fps, duplicated frames, tweening, camera pans over a still, or generated video. A fixed background can be reused because it is not moving artwork; every moving character/foreground timepoint must have its own independent drawing. State the cost and storage implications honestly before a long production.

## AI boundary
AI may assist with non-art production tasks only when useful: script breakdown, shot lists, continuity checklists, naming, metadata, technical validation and critique notes. It may not generate, inpaint, outpaint, upscale-generatively, or otherwise synthesize final visual pixels or drawing strokes. Human artist decides and executes all final visual marks.

## Immediate implementation sequence
1. Make the native Raster stroke engine the primary drawing route; do not expose prompt-to-art generators in the active workflow.
2. Validate real touch/stylus input, pressure response, undo/save/reopen and canvas memory on Android.
3. Produce one detailed reference-matched still using only in-app human-operated painting tools.
4. Preserve mixed Raster/SVG source data in project save/open; validate optional imports separately.
5. Refine only defects demonstrated by the still-art review before returning to animation integration.

## Acceptance gates
- A human can paint a detailed background in the selected app on the target Android phone.
- The same artwork enters ZERO STUDIO with layers intact and without quality loss.
- A saved project reopens with all layer metadata and previews intact.
- The final composite is visually inspected by the artist; no AI score substitutes for artistic approval.
- Animation reports playback FPS and unique drawings/second separately.


## Hybrid architecture update — 2026-11-19

The approved production model is now **raster-primary, vector-optional, hybrid-capable**. Human-painted layered raster artwork is the default route for painterly backgrounds, characters, props, and painted animation drawings. SVG remains a first-class optional format for editable vector line art, graphic elements, reusable assets, and artwork for which vectors are the better tool. Existing SVG projects and the native vector editor/export must remain usable; this is not a bitmap-only migration.

Earlier language describing a raster app as the only art department is superseded where it conflicts with the hybrid decision. ZERO STUDIO must eventually support both in-app human painting and verified import from an Android painting app; neither path may silently flatten or discard the other. The experimental Canvas brush remains only a low-level input primitive, not a professional painting engine.

For animation, raster and vector frames are both valid if human-authored and independently distinct. The requirement remains 24 unique moving-art drawings per second. Static backgrounds may be reused only while the camera/layout remains fixed. See HYBRID_ART_ARCHITECTURE.md and D-023.
