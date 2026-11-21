# ZERO STUDIO — Digital Artist Architecture

**Decision:** D-029 (2026-11-21), user-approved direction. This is the new strategic path for the character drawing department.

## Product goal

Build an AI digital artist that actually draws anime artwork through explicit, ordered, editable drawing operations. It must not create a finished picture by calling an image-generation or text-to-video model. The artist plans its work, selects tools, creates individual strokes/curves/fills, organizes layers, reviews the result, and corrects its own editable marks.

The authored source of truth is the set of separate raster layers plus their ordered, editable brush-stroke logs. A flattened raster composite is only a preview/export artifact and is never accepted as an image-generation output.

## The artist's own eyes — D-031

The artist must be able to inspect its own canvas. A general-purpose external vision-language model is **not** a required dependency for perception, planning or drawing. The "eyes" are a collection of focused analysis passes, each returning measurable defects, evidence locations and suggested corrections.

### Specialist eyes

1. **Silhouette eye:** reads the composite and semantic layers at thumbnail and full resolution; measures outer contours, closed shapes, negative space, overlaps, gaps, tangencies and disconnected regions. It checks whether fills leak past their intended boundaries.
2. **Construction/anatomy eye:** checks head/body ratios, facial landmark placement, centerlines, joint positions, limb relationships, balance, perspective and pose constraints against Character DNA and the approved drawing brief.
3. **Line-art eye:** measures edge continuity, stroke smoothness, taper, pressure hierarchy, thickness consistency, joins, accidental crossings, open contours and stray marks.
4. **Color/light eye:** checks flat-color coverage, palette consistency, region separation, cel-shadow shapes, highlight placement, material grouping and whether the shading agrees with the chosen light direction.
5. **Identity eye:** compares model-sheet landmarks, face shape, eye design, hair masses, costume motifs, accessories and palette swatches with the approved Character DNA. It should detect design drift without replacing the character with a freshly generated picture.
6. **Continuity eye (animation stage):** compares independently authored drawings across time for identity drift, anatomy jumps, costume changes, line-weight flicker and inconsistent lighting.

### How the eyes operate

Each pass receives a rendered preview, selected layer images, stroke history, Character DNA and task constraints. The initial implementation should favor deterministic tools already compatible with Android and a $0 budget:
- raster sampling, image pyramids, color histograms and palette-distance checks;
- edge maps, connected components, contour extraction, hole/gap detection and geometric measurements;
- region masks and alpha-boundary checks for closed fills and paint leakage;
- landmark and proportion constraints from the existing Character DNA/anatomy modules;
- stroke-log analysis for pressure, length, direction, taper and overlap;
- before/after metrics and visual crops so the artist can identify exactly where a defect occurs.

The critic combines the results into a prioritized report: defect type, pixel/region location, affected layer and stroke IDs, severity, confidence, and a correction proposal. The correction loop edits those original operations and replays the affected layer. It must never "fix" an error by generating or inserting a replacement image. External specialist models may later provide optional second opinions, but the artist must remain useful when they are unavailable.

## First implemented eyes and curriculum milestone — 2026-11-21

The first local implementation is in:
- `app/digital-artist-eyes.mjs`: raster bounds/coverage/centroid/perimeter/palette measurement; per-stroke sample count, length, pressure range, bounds and sharp-turn analysis; normalized landmark comparison; named palette comparison; and region-fill pixel sampling for inside coverage and outside leakage.
- `app/app.js` / `app/index.html`: an eye panel that inspects the current frame's Digital Artist raster layers locally, downsampling each layer to no more than 960×540 for this first pass. It reports visible pixels, bounds, coverage, dominant colors, stroke/operation counts, approval state and region-fill leakage checks.
- `tests/digital-artist-eyes.test.mjs`: regression tests for raster measurements, stroke geometry, landmark drift, palette mismatch, fill coverage/leakage and invalid input.
- `app/anime-artist-curriculum.mjs`: 15 skill stages with prerequisites, lessons, practical exercises and evaluation metrics; reference-card rights/provenance validation for study, training and commercial-production uses; and practice tasks requiring native raster brush operations with final-image generation prohibited.
- The editor has a skill browser for this curriculum. It displays exercises and measurement criteria, but does not mean the artist has already been trained or has completed those exercises.

**Known gaps:** the first UI does not yet compare a real approved Character DNA/model sheet against a drawn character. The landmark and palette comparison functions exist, but need integration with the actual reference record. Detailed anatomy/line-quality/cel-light critics, defect localization with corrective recommendations, a populated authorized reference library and learning from saved corrections remain incomplete.

**CI verification:** HEAD `536ee9b49b989fbd5770fea66cadbb0252d80fe6` passed 376/376 tests in both Drawing engine run #2449 and Hybrid raster/SVG run #639. Hybrid CI also passed the raster proof/export jobs. This proves the inspection/curriculum code paths and regressions, not artistic skill or visual acceptance.

## Anime craft library and learning curriculum

"Teaching anime" means teaching the craft and the conventions of anime drawing, not merely adding an anime keyword to a generic model. Build a structured library of authorized model sheets, construction examples, annotated drawings, layer breakdowns, palette studies, process recordings and correction examples.

The curriculum should be explicit and testable:
- shape language, gesture and silhouette design;
- anime head construction, facial proportions, eyes, brows, nose and mouth;
- hair as large masses first, then locks, clumps and strand accents;
- hands, body proportions, pose, perspective and foreshortening;
- costume construction, folds, seams, accessories and material cues;
- clean inking, line hierarchy, taper, pressure, stabilizing and organic contours;
- flat-color grouping, clean region boundaries, cel shadows, cast shadows, highlights and lighting;
- expressions, model sheets, character turnarounds, camera views and shot-to-shot design consistency.

Every reference item must carry its source, rights/permission, artist or owner credit where required, allowed purpose, style/technique tags, drawing stage and any annotations. Prefer user-approved character model sheets and art the project owns or has permission to use. Never scrape an arbitrary image board and assume that public visibility grants training or commercial rights.

Learning should begin with small, measurable drawing exercises: draw the same eye in several angles; construct the same head in front/three-quarter/profile; draw hair masses without changing the silhouette; fill a closed face/skin region without leakage; apply two-tone cel shading under a fixed light; ink a curve with controlled taper; preserve a model-sheet character across a pose change. Store approved plans, stroke logs, corrections and evaluation scores as structured examples.

Large-model training is not the first step. Start with a reference library, deterministic analysis, specialist rules and small component models only when their licenses, data and free compute are suitable. Do not train from non-commercial data for a commercial use case.

## Two governing ZERO STUDIO goals

1. Build a genuine anime production studio that can create a professional animated series.
2. Build a genuine digital anime artist that authors its drawings through native editable marks, improves through its own eyes and art education, and ultimately supports 24 independently authored drawings per second.

The digital artist is a foundational department of the studio, not a separate end product. Every improvement to its perception, inking, color, shading, correction and identity consistency must move both goals forward.


## What the artist is

The digital artist is a software system with six cooperating parts:

1. **Art director / reasoning brain:** decides pose, composition, drawing order, semantic layers, line hierarchy and the next drawing action. It must be able to plan from the brief, approved references, project state and internal analysis without waiting for an external VLM.
2. **Character memory:** stores the approved model-sheet identity, measured proportions, face/hair/costume details, palette, canonical views and source digest. It provides constraints, not a flattened picture to trace.
3. **Spatial anatomy guide:** uses the existing Character DNA, key drawings and optional 3D pose reference to constrain joints, proportions, perspective, balance and contact. It is guide-only; it does not deform or render final character art.
4. **Artist's eyes:** several internal perception passes inspect silhouette, anatomy, line art, color/light, identity and (later) frame continuity. They return measurable defects tied to pixel regions, layers and stroke IDs.
5. **Drawing hand:** converts the plan into ordered, pressure-sensitive native raster brush commands on separate transparent layers. Each mark records its purpose, layer, brush profile, point samples, pressure, size, color, opacity, texture, blend mode and sequence. SVG paths are optional geometry helpers only.
6. **Art critic / correction loop:** combines the eyes' reports, prioritizes defects, edits original brush commands/layer strokes and replays affected layers. It must not replace a flawed drawing with a newly generated image.

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

This optional geometry contract is an infrastructure milestone, not the final-art path. The raster-first contract in `app/digital-artist-brush-engine.mjs` is the approved route for final character art. Neither contract yet means an AI model autonomously drew a complete production-quality anime character. The next milestone is to strengthen the artist's internal eyes and anime craft library, then connect their measurable critique to the raster contract and the editor's correction/replay loop. External vision models remain optional helpers, never prerequisites.

## D-031 implementation snapshot — 2026-11-21

The first local artist-eyes implementation is now part of the codebase:

- `app/digital-artist-eyes.mjs` provides deterministic raster measurement (alpha coverage/bounds, centroid, perimeter and quantized palette), stroke-geometry measurement (sample count, path length, bounds, pressure range and sharp turns), named-landmark comparison, named-palette comparison, and pixel sampling for region coverage/leakage.
- The editor's **افحص الرسم بعيون الفنان** action inspects the current frame's Digital Artist raster layers locally. It downsamples inspection surfaces to at most 960×540 for an Android-friendly first pass, then reports per-layer bounds/coverage/palette, operation geometry, review state, and same-color grouped region-fill checks.
- Region fills of the same color are inspected as a union, so adjacent intended hair/clothing regions do not incorrectly count as outside paint leakage.
- `scripts/render-digital-artist-demo.mjs` produces a separate transparent visible-art composite for the silhouette eye (not the opaque page-background composite), records per-layer raster metrics, preserves stable command IDs in stroke reports, and exports `digital-artist-eyes-report.json` with the seven layer PNGs.
- `app/anime-artist-curriculum.mjs` defines 15 staged anime craft skills, prerequisites, lessons, drawing exercises and evaluation metrics. Its reference-card gate records provenance and separately checks study, training, redistribution and commercial-use declarations. The editor includes a curriculum browser.
- Automated tests cover all these measurement and curriculum primitives. These are deterministic analysis and learning scaffolds, not neural vision, model training, automatic art-direction or professional-quality acceptance. The actual approved Character DNA/model-sheet must still be connected to the landmark and palette comparators; the authorized reference library must still be populated.

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

The editor now provides individual operation selection, isolated preview, previous/next navigation, approve/reject/reset controls, and persisted review state. It also provides a JSON correction editor for intent, point/pressure geometry, brush profile/style, and region-fill styling. A validated correction rebuilds the target raster layer from its complete ordered stroke log on a scratch Canvas2D surface, checks PNG size, and commits only on success; locked layers are not editable. Editing resets the corrected operation to pending review, and the pre-correction state remains undoable.

Visual inspection of the latest CI composite confirms that the broad horizontal bands are gone and that the main color regions and eye whites are filled. Construction and rough-sketch layers remain preserved as editable references but are hidden in the composite. The sample still has rough silhouette/line alignment and unfinished costume/hair details. It remains a deterministic hand-authored renderer fixture, not a model-authored image or visually accepted production character.

GitHub Actions at application HEAD `a9f4449b848854623fde0d0172598c86b4ad112a` passed 361/361 tests in Drawing engine run #2396. Hybrid raster/SVG run #614 completed the Canvas2D renderer proof and artifact upload successfully; its node-test job was still running at the time of this update. The renderer artifact includes the composite and seven layer PNGs. This confirms code and renderer integration, not artistic quality, AI autonomy or Android performance.

### Updated acceptance gate

The first complete character must be drawn from a blank canvas using separate editable raster layers and individually replayable native brush strokes. No embedded/generated image payload is allowed. It is acceptable to use SVG only for hidden construction guides or optional geometric helpers, not as a substitute for organic line art or painted color.


### Vision observation boundary — 2026-11-21

Added `app/digital-artist-vision-contract.mjs` as a provider-neutral boundary between image understanding and drawing. It validates a SHA-256-bound reference report containing subject/style/composition, normalized facial or anatomical landmarks, bounded semantic regions, palette swatches, identity locks, and per-observation confidence. `buildAnimeVisionDrawingBrief` filters high-confidence guides and regions while retaining uncertain observations in an explicit review queue.

This is a contract and deterministic adapter only. It does **not** run a vision model, infer image content, create brush strokes, or claim autonomous drawing. The next integration must call an actual vision-capable model on the approved character reference, parse its response through this validator, then have a separate geometry planner author native Canvas2D brush commands. Low-confidence observations must remain reviewable; the model must never be allowed to inject image payloads or bypass the native brush-plan validator.

The Hugging Face account connection is authenticated, and model discovery identified Qwen2.5-VL-3B-Instruct plus the smaller SmolVLM-256M-Instruct candidate. No successful inference was completed in this pass, so neither model is described as connected or tested. The vision-to-brush pipeline remains an explicit unfinished milestone.


### Vision observations to native raster brush plans — 2026-11-21

The first deterministic geometry adapter now exists in `app/digital-artist-vision-brush-planner.mjs`. It accepts only the validated vision-report contract, filters by confidence, maps reviewed landmarks to editable graphite construction crosshairs, and maps semantic region boxes to native raster region-fill operations. Semantic roles are ordered to match the brush-plan validator, and palette swatches are matched to region labels where possible. The output is validated by `validateDigitalArtistBrushPlan` and is directly compilable by `compileDigitalArtistBrushPlan`; reference digest and optional character asset ID are retained.

This is a meaningful bridge from observations to actual brush-engine commands, but deliberately conservative. Region boxes are still rectangular approximations and crosshairs are guides, not anatomy. The adapter does not infer image contents, create organic contours, or produce a finished drawing. Its result defaults to requiring human approval, carries a review queue for low-confidence observations, and explicitly records that no inference or image generation occurred. The next geometry milestone is contour-aware region boundaries and connected landmarks (eye curves, jawline, hair silhouette), followed by a real zero-cost vision model invocation on an approved reference.


The Digital Artist panel now exposes this bridge: a user can paste a validated vision report, generate a brush-plan draft, inspect/edit the plan in the existing JSON editor, and explicitly approve before executing it on new raster layers. Loading the fixed brush-engine demo returns to the ordinary manual-plan path. The panel clearly labels the report as externally supplied; it does not imply an image has been analyzed. This provides a working manual handoff while the free vision-model integration is unresolved.


### Free local vision inference handoff

The panel links to the official Hugging Face `SmolVLM-256M-Instruct-WebGPU` static Space and provides a constrained JSON prompt for anime-reference observations. The user runs the model in a WebGPU-capable browser, copies its structured observations into ZERO STUDIO, and uploads the same reference image. ZERO STUDIO computes SHA-256 locally using Web Crypto and rejects a supplied digest mismatch before generating a plan. The image bytes are not sent by the ZERO STUDIO report-to-plan adapter.

This is a practical $0 inference route candidate, but remains a manual handoff. It is not an embedded model runtime or a connected Space API. Model weights must be downloaded to the browser and the user's Android GPU/browser compatibility and speed still require a real device test. The small VLM's coordinate estimates are approximate; all observations remain subject to confidence filtering and explicit human approval.


### Contour-aware vision region geometry

Vision region observations may now include an optional normalized polygon contour. The contract bounds each contour to 3–512 points, checks finite normalized coordinates, rejects adjacent duplicate points and near-zero area, keeps points within the declared region box, and rejects proper self-intersections. The brush planner maps a supplied contour directly to the 1920×1080 raster canvas and uses it as the region-fill boundary. Legacy reports without contours remain accepted, but are explicitly marked as rectangular approximations in the review warnings.

The browser handoff prompt now asks for approximate organic outlines of visible character parts instead of boxes alone. This does not make the small vision model a segmentation model: contour estimates can still be inaccurate, and confidence review plus user approval remain mandatory. The focused regression suite has been added but awaits a fresh CI run on the current head.


**Verification update:** the initial contour regression run caught a dropped contour field in the intermediate drawing brief. That propagation defect was corrected, and the resulting head passed 402/402 Drawing engine tests plus the Hybrid raster/SVG regression and raster proof jobs (2026-11-21). This validates the software path and fixtures, not the accuracy of a real vision model's contours.

## Evidence-led artist progression — D-032

A separate learning ledger now records measured outcomes against the 15-skill Anime Craft curriculum (`app/digital-artist-learning.mjs`). It stores a bounded sequence of assessment IDs, report digests and individual pass/fail checks. Skill mastery requires three consecutive assessments scoring at least 85%, and all prerequisite skills must already be mastered in curriculum order. The recommender returns exercises and evaluation metrics for the weakest skill whose prerequisites are satisfied.

This provides a measurable progress history without pretending that deterministic rules train a neural model. It does not yet verify report contents from the digest, persist the ledger in the editor UI, or alter drawings automatically. Those are separate integration and validation tasks.


## Project-persisted assessment loop — D-033

The artist editor now connects the local inspection report to the evidence ledger. After running the eyes, the user explicitly saves an attempt for the selected curriculum skill. Only three routes currently have relevant enough measurements to be accepted: body anatomy (approved Character DNA comparison), flat-color groups (region-fill inspection), and anime inking (stroke-geometry warning categories). Other skill routes are rejected until their own measurements exist.

The report is SHA-256 hashed locally; the attempt is stored in `project.artistLearning` and survives project normalization and file round trips. The UI shows attempts, mastery count and the next recommended exercise. This is per-project progress tracking with user-triggered assessments, not autonomous model training. A digest is an integrity reference, not proof that a report is truthful. No unmeasured skill is awarded a score.

