# ZERO STUDIO — Digital Artist Architecture

**Decision:** D-029 (2026-11-21), user-approved direction. This is the new strategic path for the character drawing department.

## Product goal

Build an AI digital artist that actually draws anime artwork through explicit, ordered, editable drawing operations. It must not create a finished picture by calling an image-generation or text-to-video model. The artist plans its work, selects tools, creates individual strokes/curves/fills, organizes layers, reviews the result, and corrects its own editable marks.

A finished raster preview may be rendered from the editable source for display, but the raster is never the source of truth and is never accepted as an image-generation output.

## What the artist is

The digital artist is a software system with five cooperating parts:

1. **Art director / reasoning brain:** interprets the shot brief and character reference, decides pose, composition, drawing order, layers, line hierarchy, and required detail.
2. **Character memory:** stores the approved model-sheet identity, measured proportions, face/hair/costume details, palette, canonical view, and source digest. It provides constraints, not a flattened picture to trace.
3. **Spatial anatomy guide:** uses the existing Character DNA, key drawings, and optional 3D pose reference to constrain joints, proportions, perspective, balance, and contact. It is guide-only; it does not deform or render final character art.
4. **Drawing hand:** converts the plan into ordered editable strokes and closed shapes. The first implementation uses the existing SVG path/operation model because it is mobile-friendly, inspectable, editable, and already supported by the project. Each mark is a real path command with tool, purpose, layer, order, stroke/fill, and width.
5. **Art critic / correction loop:** inspects a temporary render, compares it to the approved reference and task, returns prioritized defects, and revises the original vector operations. It must not replace a flawed drawing with a newly generated image.

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

### SVG path renderer

This is the first drawing hand. It executes M/L/C/Q etc. curves, closed fills, outlines, pressure-shaped path outlines, and semantic layers. The output remains editable. Native raster painting remains available for human-authored/imported assets, but it is not the AI artist's final-authoring shortcut.

## Current implementation

The new provider-neutral command contract in app/digital-artist-engine.mjs provides:

- zero-studio-digital-artist-plan v1.
- 1920×1080 canvas contract matching the existing studio.
- Ordered semantic layers: construction, rough sketch, clean line, flat color, shadow, highlight, detail, correction.
- Individual stroke ids, tool types, drawing intent, and validated editable SVG operations.
- Stable order across layers; per-path bounds validation.
- Raster image/base64 payload rejection.
- Compilation into native vector layers and a replayable one-stroke-at-a-time command stream.
- Structural audit that distinguishes editable vector operations from generated image payloads.

This contract is an infrastructure milestone. It does not yet mean an AI model autonomously drew a complete production-quality anime character. The next milestone is to connect a vision-capable planner to this contract and then connect the reviewed command stream to the existing editor preview/approval/layer commit UI.

## Training and improvement strategy

Do not begin with millions of RL trials. Build a measurable supervised/tool-use loop first:

- collect legally usable examples containing final art plus authentic process recordings when available;
- use Paints-Undo / inverse-painting research to create candidate stage-order supervision, clearly marked as reconstructed rather than ground-truth hand movements;
- store each accepted artist plan, edits, critique, and user-approved correction as structured training/evaluation data, subject to rights and privacy checks;
- evaluate stroke geometry, silhouette, anatomy, identity, palette, line-weight hierarchy, layer semantics, editability, and correction cost;
- consider reinforcement learning only after a deterministic drawing environment, reliable evaluator, and sufficient permitted process data exist.

## First acceptance test

Use one approved ZERO STUDIO character reference and produce one complete full-body character drawing from a blank canvas.

It passes only when:

- there is no image-generation or video-generation call in the authoring path;
- the app contains individually editable vector strokes/closed shapes, not one embedded picture;
- the timeline can replay the drawing in its real action order;
- named layers separate construction, line art, flats, shadows and details;
- the same face, hair, costume, palette, and proportions match the approved model sheet;
- defects can be corrected by editing existing paths/operations;
- the user can save and reopen the project without losing the layers or drawing steps.

Only after one still passes the visual gate should we ask the artist to draw a second pose, then a 24-frame action. The long-term animation target remains 24 independently authored moving-art drawings per second. Guide interpolation, held copies, image warping, generated video and duplicated frames are not substitutes.

## Constraints

- Android-first user workflow.
- $0 hard budget: no paid APIs, subscriptions, GPU rentals, paid plans, or automatic paid fallbacks.
- Existing character/background generation tools may remain for their already approved reference-asset role, but their generated image output is not the digital artist's final drawing.
- Never claim artistic acceptance from unit tests alone.
- Preserve the existing SVG editor, raster asset support, anatomy engine, native .zero format, gallery, and production workflows.
- Work on an isolated branch until code and visual acceptance are established. No production deployment or merge without the user's approval.
