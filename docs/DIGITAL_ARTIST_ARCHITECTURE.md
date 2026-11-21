# ZERO STUDIO — Digital Artist Architecture

**Decision:** D-029 (2026-11-21), user-approved direction. This is the new strategic path for the character drawing department.

## Product goal

Build an AI digital artist that actually draws anime artwork through explicit, ordered, editable drawing operations. It must not create a finished picture by calling an image-generation or text-to-video model. The artist plans its work, selects tools, creates individual strokes/curves/fills, organizes layers, reviews the result, and corrects its own editable marks.

The authored source of truth is the set of separate raster layers plus their ordered, editable brush-stroke logs. A flattened raster composite is only a preview/export artifact and is never accepted as an image-generation output.

## What the artist is

The digital artist is a software system with five cooperating parts:

1. **Art director / reasoning brain:** interprets the shot brief and character reference, decides pose, composition, drawing order, layers, line hierarchy, and required detail.
2. **Character memory:** stores the approved model-sheet identity, measured proportions, face/hair/costume details, palette, canonical view, and source digest. It provides constraints, not a flattened picture to trace.
3. **Spatial anatomy guide:** uses the existing Character DNA, key drawings, and optional 3D pose reference to constrain joints, proportions, perspective, balance, and contact. It is guide-only; it does not deform or render final character art.
4. **Drawing hand:** converts the plan into ordered, pressure-sensitive native raster brush commands on separate transparent layers. Each mark records its purpose, layer, brush profile, point samples, pressure, size, color, opacity, texture, blend mode, and sequence. SVG paths are optional geometry helpers only.
5. **Art critic / correction loop:** inspects a temporary render, compares it to the approved reference and task, returns prioritized defects, and revises the original brush commands/layer strokes (or optional guide paths). It must not replace a flawed drawing with a newly generated image.

## Production sequence

The intended character pass is:

1. Identity and reference registration.
2. Gesture / silhouette construction.
3. Anatomical construction and volume blocking.
4. Rough drawing.
5. Clean line art / inking.
6. Flat colors, separated by semantic region/layer.
7. Cel shadows and light accents.
8. Hair, eyes, hands, costume and material details.
9. Critique, corrections, and user approval.

Layers and strokes are ordered. The viewer must be able to replay the drawing one action at a time, pause at a stage, select a stroke, edit its path, undo it, or rerun only the affected stage.

## Exact technology roles

### Paints-Undo

Use as a research/teacher candidate for likely human drawing-order and layer behavior. It predicts a plausible drawing process from a finished image; it does **not** recover the original artist's exact historic brush coordinates, and its predicted process is not an editable vector drawing by itself. The official project describes it as a base model of drawing behavior and reports substantial compute requirements. It is not a runtime dependency for the first prototype.

Official source: https://github.com/lllyasviel/Paints-UNDO

### DiffVG

Use as an optional differentiable vector rasterizer / optimization component for comparing a rendered vector draft against a reference and adjusting continuous parameters such as curve points, widths, and colors. DiffVG is not the artist or the drawing planner, and its research describes topology changes as outside the original method's scope.

Official source: https://github.com/BachiLi/diffvg

### 3D / rigging

Use the existing anatomy engine and, later, an anime-proportion 3D rig for pose, camera, depth, and contact constraints. A 3D render may be used as a faint construction reference only. Never pass a 3D render directly as final 2D anime artwork.

### Native raster brush renderer (primary)

The primary drawing hand is the existing Canvas2D brush engine in `app/raster-brushes.mjs`, backed by persistent raster surfaces. It executes pressure-aware graphite, ink, gouache, watercolor and foliage strokes with tapered ribbons, texture, opacity, blend modes and erasing. AI-authored marks are stored as ordered commands and painted into separate transparent raster layers. The stroke log remains the editable source; a flattened PNG is only a preview/export.

## SVG paths (optional)

SVG is not required for the AI artist's final artwork. It may be used for construction geometry, pose skeletons, simple masks, or selected contours where path editing is useful. Do not force organic hair, facial lines, fabric, painted flats, shadows or highlights into a vector-only representation.

## Current implementation

The original optional geometry command contract in `app/digital-artist-engine.mjs` provides:

- zero-studio-digital-artist-plan v1.
- 1920×1080 canvas contract matching the existing studio.
- Ordered semantic layers: construction, rough sketch, clean line, flat color, shadow, highlight, detail, correction.
- Individual stroke ids, tool types, drawing intent, and validated editable SVG operations.
- Stable order across layers; per-path bounds validation.
- Raster image/base64 payload rejection.
- Compilation into native vector layers and a replayable one-stroke-at-a-time command stream.
- Structural audit that distinguishes editable vector operations from generated image payloads.

This optional geometry contract is an infrastructure milestone, not the final-art path. The raster-first contract in `app/digital-artist-brush-engine.mjs` is the approved route for final character art. Neither contract yet means an AI model autonomously drew a complete production-quality anime character. The next milestone is to connect a vision-capable planner to the raster contract and then connect its reviewed brush stream to the existing editor preview/approval/layer commit UI.

## Training and improvement strategy

Do not begin with millions of RL trials. Build a measurable supervised/tool-use loop first:

- collect legally usable examples containing final art plus authentic process recordings when available;
- use Paints-Undo / inverse-painting research to create candidate stage-order supervision, clearly marked as reconstructed rather than ground-truth hand movements;
- store each accepted artist plan, edits, critique, and user-approved correction as structured training/evaluation data, subject to rights and privacy checks;
- evaluate stroke geometry, silhouette, anatomy, identity, palette, pressure/line-weight hierarchy, brush texture, layer semantics, replayability, and correction cost;
- consider reinforcement learning only after a deterministic drawing environment, reliable evaluator, and sufficient permitted process data exist.

## First acceptance test

Use one approved ZERO STUDIO character reference and produce one complete full-body character drawing from a blank canvas.

It passes only when:

- there is no image-generation or video-generation call in the authoring path;
- the app contains individually recorded/replayable native brush strokes on separate transparent raster layers, not one embedded picture;
- the timeline can replay the drawing in its real action order;
- named raster layers separate construction, line art, flats, shadows and details;
- the same face, hair, costume, palette, and proportions match the approved model sheet;
- defects can be corrected by editing/replaying existing brush commands and layer strokes;
- the user can save and reopen the project without losing the raster layers or ordered brush-stroke log.

Only after one still passes the visual gate should we ask the artist to draw a second pose, then a 24-frame action. The long-term animation target remains 24 independently authored moving-art drawings per second. Guide interpolation, held copies, image warping, generated video and duplicated frames are not substitutes.

## Constraints

- Android-first user workflow.
- $0 hard budget: no paid APIs, subscriptions, GPU rentals, paid plans, or automatic paid fallbacks.
- Existing character/background generation tools may remain for their already approved reference-asset role, but their generated image output is not the digital artist's final drawing.
- Never claim artistic acceptance from unit tests alone.
- Preserve the existing SVG editor, raster asset support, anatomy engine, native .zero format, gallery, and production workflows.
- Work on an isolated branch until code and visual acceptance are established. No production deployment or merge without the user's approval.


## Critical refinement — Raster-first brush artist (D-030)

SVG is **not required** for the Digital Artist and must not be the only drawing medium. The previous vector-first proposal is retained only as an optional structural/geometry representation for construction guides, selected clean contours, vector editing, or shape masks. It is not the mandatory final-art renderer.

ZERO STUDIO already contains a native Canvas2D raster brush engine in `app/raster-brushes.mjs`, with graphite, ink, gouache, watercolor and foliage presets; pressure-aware samples; tapered continuous ribbons; grain/bristle texture; opacity; erasing; and blend modes. The studio also has persistent raster surfaces and native raster layers. This is a much better starting point for the artist's drawing hand than forcing every mark into SVG.

### Updated drawing hand

- The AI emits ordered brush-stroke commands: point samples (x/y/pressure), brush preset, size, color, opacity, texture, blend mode, seed, erase flag, intent and semantic layer.
- ZERO STUDIO's native raster brush engine executes the commands onto separate transparent raster layers.
- Each stroke remains an individually recorded, replayable command, even though the rendered pigment is raster. Editing can replay a layer from its stroke log after a correction; do not flatten the whole character into one bitmap.
- Use natural brush profiles for rough construction, organic tapered ink, painted flats, cel-shadow passes and highlights. Add more specialized anime inking profiles (pressure taper, nib angle, speed response, stabilizer, dry-brush edge) through the existing brush engine.
- SVG remains optional for pose skeletons, anatomical guides, simple masks, geometric construction and selected editable contours. It must never be a mandatory dependency for final character art.
- A flattened PNG is only a preview/export artifact. The source project must retain separate layers and the ordered brush-stroke log.

### New command contract

`app/digital-artist-brush-engine.mjs` defines `zero-studio-digital-artist-brush-plan` v1 and compiles it to a native Canvas2D raster command stream. It validates semantic layer order, identity digest, per-sample pressure and bounds, brush presets, color, size, texture, blend mode, and stroke IDs. It explicitly declares `vectorRequired: false`.

### Renderer and operation-review milestone — 2026-11-21

The editor executes compiled raster plans through the native brush engine and stores each artist operation on separate persistent raster layers. The shared seven-layer test fixture now contains 56 operations: 14 closed region fills plus 42 native brush strokes. CI renders a composite PNG and seven transparent layer PNGs.

The versioned brush plan accepts explicit region-fill polygon boundaries. The validator and executor check polygon point counts, coordinate bounds, color, opacity and blend mode. The Canvas2D fill helper paints the closed polygon into the raster layer; no bitmap or generated-image payload is inserted into the plan. The flat-color sample was changed from horizontal bands to separate face, hair, ears, neck, eye-white, fringe and clothing regions.

The editor now provides individual operation selection, isolated preview, previous/next navigation, approve/reject/reset controls, and persisted review state. These decisions are stored in native project history and can be undone. This is a review gate, not yet full point editing or corrected-stroke replay.

Visual inspection of the latest CI composite confirms that the broad horizontal bands are gone and that the main color regions and eye whites are filled. Construction and rough-sketch layers remain preserved as editable references but are hidden in the composite. The sample still has rough silhouette/line alignment and unfinished costume/hair details. It remains a deterministic hand-authored renderer fixture, not a model-authored image or visually accepted production character.

GitHub Actions at HEAD `9bacac06d08040dc75054b73a9d7cd56ebdad2eb` passed 357/357 tests in Drawing engine run #2381. Hybrid raster/SVG run #606 passed its test and Canvas2D proof jobs and uploaded the composite plus seven layer PNGs. This confirms code and renderer integration, not artistic quality, AI autonomy or Android performance.

### Updated acceptance gate

The first complete character must be drawn from a blank canvas using separate editable raster layers and individually replayable native brush strokes. No embedded/generated image payload is allowed. It is acceptable to use SVG only for hidden construction guides or optional geometric helpers, not as a substitute for organic line art or painted color.
