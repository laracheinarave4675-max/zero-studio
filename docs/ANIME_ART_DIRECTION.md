# ZERO STUDIO — Anime Art Direction and Rendering Bible

**Status:** artistic direction approved; implementation in progress  
**Date:** 2026-11-18  
**Primary visual target:** the three user-provided Japanese street, ramen-shop, and forest-house references.

## 1. Artistic target

ZERO STUDIO is not targeting a generic cartoon, low-poly 3D render, flat icon illustration, or photorealistic 3D anime. The target is **cinematic 2D anime background painting with selective 3D assistance**.

The reference images are environment-background paintings: believable architecture and natural forms, deliberate perspective, richly layered vegetation, material-specific detail, atmospheric depth, warm directional sunlight, soft bounce light, and a blend of crisp focal edges with softer painted transitions.

The final image must read as 2D artwork first. 3D supports perspective, camera/layout, spatial consistency, occlusion and optional shadow guides. It does not determine the final surface style.

## 2. Reference breakdown

### Reference A — urban convenience-store street
- Wide eye-level street composition with a strong shop frontage and slight corner/side depth.
- Dense tree canopy behind the roof; foreground plants frame the street corner.
- Glass panes, metal frames, fascia/signage bands, doors, vending machine, benches, street furniture, curb and road markings establish believable human scale.
- Small people and a bicycle provide scale and narrative without overwhelming the environment.
- Reflective glass, painted metal, masonry, asphalt, leaves, fabric and plastic require different material treatment.

### Reference B — rural ramen shop beside a receding road
- Three-quarter view. Road and sidewalk guide the eye toward distant hills and a low sun.
- Utility poles, overhead cables, vertical signs and roadside props reinforce perspective and scale.
- Roof thickness, layered tile rhythm, eaves, facade recesses, windows, entrance, noren fabric and planted pots.
- Warm late-afternoon light creates long directional shadows and warm/cool separation.
- Foreground, shop, roadside vegetation and distant hills occupy distinct depth layers.

### Reference C — Japanese house in dense greenery
- Large architectural focal point with a complex tiled roof, visible eaves, timber framing, windows, veranda and stone retaining wall.
- Trees and shrubs overlap the house at several depths; foliage silhouettes vary in size, direction, density and contour.
- Sunlight filters through the canopy, creating dappled highlights, soft light shafts, reflected green light and rich occlusion.
- Stone, timber, plaster, roof tile, glass, moss and leaves need separate visual language.
- Detail density must not become uniform noise; the house remains the focal point.

## 3. Shared style grammar

### Composition and perspective
- Establish camera height, lens feel, horizon, one/two-point perspective and a coherent ground plane before drawing details.
- Work from large masses to architectural divisions, then medium props, then small storytelling details.
- Use foreground framing, midground hero forms and distant silhouettes. Apply scale falloff and atmospheric contrast.
- Roads, curbs, roof ridges, window frames, fences and utility wires must obey the same camera.
- Signs, vehicles, planters, trees and people must rest on their supporting surfaces.

### Shape language and linework
- Use organic Bézier contours for foliage, terrain, roof edges, fabric, trees and clouds.
- Use crisp deliberate geometry for architecture, joinery, frames and road infrastructure.
- Lines are selective, material-aware and subordinate to light/form; do not outline every object with the same thick black stroke.
- Avoid oval-leaf repetition, equal-size foliage clusters, primitive-only buildings, triangular-only roofs and empty black gaps.

### Color and lighting
- Choose a motivated sun direction and keep it consistent.
- Build light-facing planes, half-tones, cast/contact shadows, eave occlusion, bounce light and reflected color.
- Use harmonious warm/cool color: golden sunlight and warm lit plaster/wood against cooler green/blue shadows and distant atmosphere.
- Preserve value separation and atmospheric desaturation in distant planes.
- Use bloom/glow sparingly; never erase important linework or material detail.

### Materials
- **Glass:** recess, frame depth, environment reflection, selective bright streaks and interior value.
- **Roof tile:** thickness, ridge cap, overlapping tile rhythm, irregular tile highlights and under-eave shadow.
- **Wood:** boards, joinery, grain direction, edge wear and warm shadow.
- **Plaster/concrete/stone:** broad tonal variation, seams, chips, joints and contact shadows.
- **Asphalt:** perspective plane, aggregate variation, seams, cracks, patches and road markings.
- **Vegetation:** branch structure, layered leaf masses, varied silhouettes and light-through-leaf accents; no identical repeated circles.

## 4. Character style is a separate department

The provided references primarily describe backgrounds, not a complete character design target. Character animation therefore needs a distinct 2D drawing grammar:
- clean controlled anime line art with deliberate line-weight hierarchy;
- consistent model sheets, proportions, facial construction, hair clumps, costume folds and color keys;
- readable silhouettes and expressive key poses;
- base colors plus designed cel-shadow and highlight regions;
- independent redraw/cleanup where the drawing changes.

Characters are designed and reviewed separately, then composited into the environment with matched light direction and contact shadows.

## 5. Correct role of 3D

3D is a **layout and support department**, not the final art director.

Allowed uses:
- camera and perspective guides;
- rough blockout for architecture and street dimensions;
- depth/occlusion ordering;
- optional shadow and reflection guides;
- selected 3D props or moving vehicles only when their appearance is deliberately flattened/stylized to match the 2D artwork.

Not acceptable as the default final style:
- low-poly buildings, faceted tree spheres, box vehicles or uniformly shaded mesh surfaces;
- full-scene 3D renders simply recolored to resemble cartoons;
- camera movement that exposes parallax/volume when the 2D composition should remain flat/painted.

## 6. Current ZERO STUDIO gap analysis

### Existing foundations
- Arabic RTL, Android-first browser drawing workspace.
- Editable SVG paths, 1920×1080 canvas, layers, timeline, onion skin, undo/redo, project save/open, SVG/ZIP export.
- Path validation and safe reusable SVG gradient definitions.
- Text-only Gemini adapter for multi-layer SVG proposals.
- Semantic Gemini 3D blueprint adapter and local mesh-to-SVG prototype.
- Sequential animation worker and structural unique-drawing cadence audit.

### Why current samples miss the target
1. The first 2D scene samples mainly use deterministic primitives: large flat fills, repeated leaf-like ellipses, front-facing box architecture and little surface texture. They are readable diagrams, not painted anime backgrounds.
2. The 3D mesh renderer constructs low-poly building/roof/vehicle/tree geometry and uses simple per-face directional shading. More polygons/paths do not supply naturalistic painting, material response or artistic composition.
3. Gemini receives text scene descriptions only, not the user's reference images. The current adapter cannot visually compare its output against those images.
4. The direct-SVG scene prompt limits the scene to 300 paths; the semantic 3D renderer has a larger still-image path budget, but path count is not a quality metric.
5. The current vector operation schema supports paths, stroke, width and fill. The material/effect system is still narrow and has not demonstrated textured painterly brush strokes.
6. The 3D still-scene pipeline is not integrated with the 24-unique-drawings-per-second worker. Its still-image path budget cannot be silently substituted into the animation contract.
7. Physical Android rendering, memory use and long-scene performance remain unverified.

## 7. New rendering architecture

### Stage A — art direction and scene layout
Gemini returns a compact, validated 2D scene plan: shot type, horizon/vanishing points, focal area, sun direction, depth layers, building footprint/facade divisions, vegetation placement, materials, palette and narrative props. If visual-reference input becomes available, the plan should carry reference-derived observations. The provider must not be credited with seeing images it did not receive.

### Stage B — optional 3D layout assist
The mesh/camera engine may produce perspective lines, occlusion/depth ordering and selected lighting guides. Its output is advisory, not the finished scene.

### Stage C — 2D background painting engine
The local drawing engine authors the final editable artwork as named 2D path layers:
- sky and distant atmospheric planes;
- far hills/buildings;
- background and midground vegetation;
- hero architecture;
- windows, roof tiles, signage, awnings and material details;
- ground, road, sidewalk and infrastructure;
- foreground foliage/props;
- lighting, cast shadows and finishing effects.

Use genuinely varied contour builders and material-specific detail systems, not a repeated row of circles or generic boxes. Gemini's layout plan drives those systems; it is not limited to choosing a fixed preset.

### Stage D — material and lighting composition
Use safe SVG gradients, patterns and bounded effects with editable layer-level control. Separate diffuse color, shadow, highlight, reflected light and atmosphere. Preserve editability and ensure live canvas and exported SVG share the same definitions.

### Stage E — review and iteration
Generate at least three distinct reference-matched background tests. Evaluate each against perspective, architecture, foliage, materials, light, atmosphere, edge quality, focal hierarchy and editability. A sample cannot be accepted merely because it passes JSON/path validation.

### Stage F — animation integration
Only after the still artwork passes visual review should its 2D drawing systems be adapted for motion. Follow the approved anime production separation: paint each fixed-camera background once as a layered editable vector asset; independently redraw the characters and every moving foreground element at each of 24 timepoints per second. Each visible frame is the composite of that background plus newly drawn moving layers. Reusing the approved static background is intentional and does not count as a new drawing. Moving artwork must still contain 24 unique drawings per second; no raster transforms, duplicated moving frames, video, or tween-only motion may replace those drawings. If camera movement or scene changes require background motion, redraw the affected background layers at the required cadence.

### Stage G — visual critique and correction
Render a temporary preview of the editable SVG, provide that preview to a vision-capable reviewer, collect specific corrections for composition, perspective, architecture, foliage, materials, lighting, atmosphere and line quality, then apply those corrections to the editable paths/materials and render again. Limit automatic cycles to a small, measurable number and retain the critique report. Raster previews are inspection-only; they are not final artwork. The user retains final artistic approval.

### Stage H — texture policy
Keep final art vector-first while testing richer gradients, patterns, organic path marks and bounded SVG effects. Defer raster texture layers until a measured comparison proves vector methods insufficient and the user approves the change.

## 8. Artistic acceptance gates

The test set must include:
1. urban storefront street (Reference A);
2. rural ramen shop with receding road (Reference B);
3. traditional house in dense forest garden (Reference C).

Each must be an editable .zero project with meaningful layers and SVG export; visibly 2D-first, not low-poly 3D; and must demonstrate coherent perspective, realistic scale, material-specific surface detail, layered vegetation, directional light and atmospheric depth. Review at full resolution, not only through automated tests.

A failed visual gate means revise the artist/renderer and rerun the test. Report failures honestly. Do not claim professional or reference-level quality without passing visual review.

## 9. Implementation order

1. Lock this art direction in project decisions and documentation.
2. Improve the vector material/render schema safely: gradients, bounded patterns/effects and editable opacity where necessary.
3. Build a new 2D background painter/scene renderer; keep the low-poly mesh renderer as a camera/layout aid only.
4. Feed the semantic scene plan into the 2D painter and add iterative correction.
5. Produce and visually inspect all three test scenes.
6. Update the Android PWA deployment only after syntax/tests and asset-manifest checks pass.
7. Integrate the accepted 2D painter with the animation worker while retaining 24 unique drawings/second.

## 10. Honesty and scope

This document defines the target and engineering plan; it does not assert that the target has already been achieved. SVG can preserve editable vector shapes, gradients and patterns, but a professional painterly anime background still requires sophisticated contour design, material detail, lighting composition and artistic review. The current mesh prototype is not a production anime renderer.
