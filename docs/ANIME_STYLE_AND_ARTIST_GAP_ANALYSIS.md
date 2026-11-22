# ZERO STUDIO — Anime Style and Digital Artist Gap Analysis

Date: 2026-11-21
Scope: general anime drawing baseline only. The user's library character is deliberately excluded.

## Executive finding

The current output is not failing because it needs more decorative strokes. It is failing because the artist is not yet constructing a character as a coherent set of volumes, overlapping design masses, and style-controlled shapes. The current benchmark is a fixed-coordinate illustration script: it knows where every polygon and stroke goes in advance. The renderer can execute those instructions, but the artist does not yet infer a drawing from visual structure, and the benchmark does not measure that ability.

Passing raster tests proves that operations are valid and reproducible. It does not prove anime drawing competence.

## Visual diagnosis of the latest v6 benchmark

### 1. Head and face construction
- The head is essentially a front-facing, near-symmetric oval with a pointed chin. It has little visible skull/cheek/jaw plane construction and no perspective turn.
- The facial centerline, eye line, brow line, nose base, mouth line and chin are not generated from a shared head construction. They are independent hand-entered coordinates.
- The face reads as a flat mask. The nose is a short mark rather than a designed bridge/tip/nostril convention; the mouth has little volume or expression.
- Both eyes are nearly cloned almond shapes. Their upper lids, lower lids, inner/outer corners, iris visibility, pupil placement and lash accents are not treated as a coordinated eye design with controlled asymmetry.
- The large horizontal face shadow crosses the eye region and reads as a stripe rather than a cast shadow from the fringe. Its geometry and lighting logic are not derived from actual hair occlusion.

### 2. Hair design
- The hairstyle is mostly one dark cap/rear mass plus two side curtains. This is silhouette blocking, not convincing anime hair construction.
- The fringe does not read as a deliberate hierarchy of overlapping locks with roots, clump grouping, tips, gaps and negative spaces.
- Highlights are mostly long ribbons laid on top. They do not consistently describe the curvature and turning planes of individual locks.
- There is no root-to-tip flow model, no clump-level overlap graph, and no check that highlights follow the local direction of each lock.

### 3. Line art
- Outer contour, facial features, hair separators and garment edges have too little deliberate hierarchy.
- The current renderer creates a pressure-shaped ribbon, but the benchmark mostly supplies fixed point sequences and sizes. There is no style-level rule assigning different weight ranges to silhouette, overlap edges, facial features, hair details and fold accents.
- End taper is applied generically to strokes. Real line design needs intentional taper placement, controlled starts/ends, variable width along curves, and different behavior for contour versus interior marks.
- A technically smooth curve is not automatically a well-designed anime line.

### 4. Color and cel shading
- Large flat regions dominate; face, hair and clothing have limited value grouping and material distinction.
- Shadows are polygon/curve patches added after the flats, not the result of a declared light source and form/occlusion analysis.
- The face shadow is not constrained by the actual fringe cast-shadow boundary; hair and cloth shadows do not consistently follow volume.
- Highlights do not consistently separate hair sheen, skin accents and fabric response.

### 5. Clothing and body
- The image is a bust silhouette, not a constructed torso. Shoulder, neck, collar and chest forms are decorative patches rather than connected volumes.
- Fold lines are sparse and do not radiate from tension points such as shoulder, elbow, collar, waist or compression points.
- Sleeve shapes and central garment panels have little seam, overlap, thickness or fabric-flow logic.

### 6. Composition and staging
- The portrait is centered and frontal with almost no pose, camera, gesture or asymmetrical staging.
- There is no deliberate silhouette/negative-space test before details are added.
- The benchmark tests one authored portrait layout, not whether the artist can solve a different pose or camera view.

## Root cause in the artist implementation

1. `createDigitalArtistAnimeQualityPlan()` hardcodes the final coordinates for the face, eyes, fringe, shoulders and shadows. The plan is an illustration recipe, not an artist that derives a drawing.
2. The helper `pt()` assigns a small repeating pressure pattern by sample index. This is not pressure inferred from curvature, intended line hierarchy, speed, overlap or material.
3. `line()`, `fill()` and `outline()` provide convenient primitives, but there is no intermediate semantic geometry model for head volumes, facial construction, hair clumps, garment panels, fold tension or occlusion relationships.
4. The vision planner maps semantic region bounding boxes to rectangles unless a contour is already supplied. It cannot infer a clean anime contour from an image by itself.
5. The current eyes primarily measure pixels, contours, stroke geometry and supplied landmarks. They do not yet recognize that a particular shape is an eye, cheek, hair clump, jaw plane or fold, nor infer the correct anime style grammar.
6. The learning ledger records measured checks. It does not train a drawing policy, update a geometry model, or learn new stroke decisions from corrections. We must not describe it as autonomous learning.
7. The benchmark has no acceptance rubric that can reject bad anatomy, cloned eyes, incoherent hair flow, poor line hierarchy or incorrect light/shadow logic. Its CI success therefore cannot be interpreted as artistic success.

## What an anime drawing system must model

Anime is not one universal style. ZERO STUDIO should use a controllable style profile rather than hardcode one face template. A useful default TV-anime profile must define ranges and relationships, not a single coordinate stencil.

### A. Construction grammar
- Gesture and line of action before contour.
- Head as skull mass plus jaw/chin construction; facial centerline and cross-contour establish camera angle.
- Eye, brow, nose, mouth and ear placement derived from head proportions and view.
- Torso as ribcage and pelvis masses connected by a center axis; shoulder and hip axes define pose.
- Limbs as linked volumes with joint landmarks and foreshortening, not disconnected outlines.

### B. Anime shape language
- Controlled simplification: large readable forms first, selective detail second.
- Eyes designed as a system: eye opening, upper lid, lower lid, iris, pupil, highlights, lashes and brows; style parameters control size, corner angles, iris ratio and asymmetry.
- Hair built from a few large masses, then grouped clumps, then selected strands. Each clump has a root, flow curve, width profile, tip, overlap order and highlight path.
- Face details are restrained and style-dependent; nose and mouth conventions must be explicit profile choices.
- Silhouette and negative spaces must remain readable at thumbnail size.

### C. Line grammar
- Separate weight classes: outer silhouette, overlap/occlusion, facial feature, interior structure and texture.
- Width varies along the stroke using an intentional width profile, not just global brush size.
- Taper is semantic: outer contour can be heavier; eyelids and hair tips use controlled pointed ends; hidden edges break at overlaps.
- Avoid doubled contours, tangencies, accidental crossings and equal-weight clutter.

### D. Paint grammar
- Establish local-color flats with closed semantic regions.
- Declare key-light direction and intensity before shadowing.
- Distinguish form shadows from cast shadows and ambient occlusion.
- Shadow boundaries follow the occluding object and receiving surface.
- Material-specific highlight rules distinguish hair, skin, cloth and hard accessories.
- Use a limited, coherent palette with clear value separation.

### E. Continuity grammar
- A character design is a model sheet: proportions, eye construction, hair masses, costume landmarks, palette and accessories.
- Every view or pose is solved from the same design constraints; it is not a new character redraw.
- Corrections must attach to semantic geometry and source strokes so the artist can revise and replay them.

## Required redesign sequence

### Phase 1 — Replace the fixed-coordinate benchmark with a construction-driven benchmark
Create reusable, parameterized geometry primitives for:
- head/skull/jaw construction and view angle;
- facial axes and derived feature zones;
- torso/shoulder/neck volumes;
- eye construction with style parameters;
- hair masses and clumps with root-to-tip flow and overlap order;
- garment panels and fold tension anchors.

The benchmark should be generated from a compact character brief and a pose/view specification. The brief must not contain the final pixel coordinates of every feature.

### Phase 2 — Build a real style profile
Define a versioned `AnimeStyleProfile` with ranges for:
- head-to-body and face-zone proportions;
- eye opening/iris ratios and feature spacing;
- jaw/chin and nose/mouth simplification;
- hair mass/clump count and tip sharpness;
- outer/interior line-weight ratios and taper curves;
- palette/value groups and cel-shadow edge behavior.

A profile is a controllable family of constraints, not a rigid universal anime template.

### Phase 3 — Improve the raster renderer for intentional line design
Add explicit width profiles or pressure curves to brush operations, plus start/end cap and taper controls. Preserve editable stroke logs and deterministic replay. Add pixel-level tests proving width changes and taper behavior.

### Phase 4 — Add specialist visual critics
The eyes must report localized, actionable findings:
- construction/anatomy critic: landmark ratios, axes, volume and pose;
- eye critic: pair alignment, opening/iris ratios, corner and lid logic;
- hair critic: silhouette, clump count, root-to-tip flow, overlap and negative spaces;
- line critic: hierarchy, taper, tangencies, gaps and accidental crossings;
- color/light critic: local-color coverage, value grouping, cast-shadow source and direction, material separation;
- composition critic: gesture, silhouette and negative-space readability.

A critic must distinguish "not measured" from "passed". It must never award mastery merely because a generic pixel metric passed.

### Phase 5 — Correction loop and evidence-based improvement
Each finding must point to semantic objects and stroke IDs. Corrections should edit the original geometry/brush operations, replay affected layers and compare before/after measurements. Only repeated, independently checked improvement may raise a skill score. The current ledger is progress tracking, not model training; keep that distinction explicit until a genuine learning mechanism exists.

## New visual acceptance gate

Do not call the general baseline accepted until all are true:
- It reads as a deliberately designed anime character at thumbnail size.
- The head has coherent construction and facial feature placement.
- The eyes are expressive, coordinated and stylistically intentional rather than copied identical symbols.
- Hair is made of readable overlapping masses/clumps with root-to-tip flow and purposeful negative spaces.
- Line weights visibly distinguish silhouette, overlap and detail.
- Shadows have a consistent light source and follow form/occlusion.
- Clothing follows torso volumes and has plausible fold/tension logic.
- At least three distinct views/poses can be produced from the same design constraints without losing identity.
- A visual review confirms quality; CI passing alone is never sufficient.

## Immediate next engineering task

Do not add more decorative details to the existing portrait. First implement the parameterized construction and style-profile layer, then generate a new benchmark from that model. Keep the existing v6 render as a baseline for comparison and keep the user's library character excluded until the user accepts the general anime benchmark.
