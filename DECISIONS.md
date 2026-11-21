# ZERO STUDIO — Architecture and Product Decisions

This file records decisions that must not be changed silently. Add dated entries when decisions evolve.

## D-001 — Drawing, not image generation
**Decision:** Final anime artwork must be created by explicit drawing operations: editable vector paths, strokes, brush actions, or equivalent geometry executed by a drawing engine.

**Implication:** A language model may plan a drawing and output structured drawing commands, but it must not substitute a generated raster image for the requested drawing process.

## D-002 — 24 unique drawings per second remains the target
**Decision:** Preserve the user's requirement of 24 independent drawings per second.

**Clarification:** 24 FPS is only a playback rate. A project can play at 24 FPS while reusing drawings (for example, 12 or fewer unique drawings per second). That is not equivalent to the requested target.

**Scale:** 24 unique drawings/second = 1,440/minute = 28,800 for a 20-minute episode. Test feasibility before making production promises.

## D-003 — Android-first
**Decision:** User workflow must be usable from an Android phone. Do not make a desktop computer a prerequisite.

## D-004 — Free-first
**Decision:** Prefer open formats, local/browser capabilities, and free tiers with clear limits. Never imply that free APIs provide unlimited compute. Disclose data-use and privacy implications before third-party integrations.

## D-005 — Honest status reporting
**Decision:** Clearly label each capability as implemented, tested, untested, experimental, or planned. Do not call a prototype a complete studio.

## D-006 — Durable project memory
**Decision:** GitHub repository documentation is the source of truth for project status and decisions. At each continuation, review PROJECT_STATUS.md and this file, then update the log after meaningful work. Chat memory is supplementary, not the sole record.

## D-007 — Specialized departments are workflow roles until implemented
**Decision:** Departments such as writing, character design, keyframes, in-betweens, cleanup, coloring, continuity review, sound, editing, and production management describe the intended organization. Do not claim autonomous agents exist until their orchestration and outputs are implemented and tested.

## D-008 — Character assets stay portable and project-local
**Decision:** Character models must remain editable and portable. Standalone character files use validated `.zchar` packages; a project may store up to 100 validated character models in `project.characterLibrary`, persisted inside `.zero` files. Do not upload character art to an external service by default.

## D-009 — Measure unique drawings separately from playback
**Decision:** Report the count of distinct visible vector-art signatures and average unique drawings per second separately from playback FPS. Ignore frame and operation IDs when comparing signatures. A cadence report is a structural measurement only; it does not certify artistic quality or prove that every frame was freshly hand-drawn.

## D-010 — Rig pose interpolation requires compatible editable models
**Decision:** Character pose blending may only run when both validated models have compatible rig versions, the same view, part order/visibility, SVG path topology, and per-part colors. Rebuild intermediate limb geometry with the constrained IK solver; reject incompatible models instead of guessing or rasterizing.

## D-011 — Preserve character instance identity across animation frames
**Decision:** Inserted character parts carry a shared instance ID and per-layer part membership. Copying or updating a character in another frame preserves that identity while assigning fresh drawing-operation IDs. In-between frames retain the instance metadata. This provides a foundation for later synchronized multi-frame edits without flattening the artwork.


## D-012 — Background artwork is editable vector geometry
**Decision:** Background presets and final background artwork must be authored as validated editable SVG path operations and remain layered project assets; do not replace them with generated raster imagery.

**Implication:** Starter scenes may be inserted as editable layer groups, but they are not considered a complete background department until perspective/layout, reusable props, depth/parallax, and continuity workflows are implemented and reviewed.


## D-013 — AI is the scene artist, not a preset selector (2026-11-18)
**Decision:** The production workflow must let the AI interpret a scene brief and create the requested artwork as multiple named, editable vector layers. Starter presets are optional references, never a ceiling on what the artist can draw.

**Implication:** The AI may plan composition and layer breakdown, then produce validated SVG path operations for each layer. The studio previews the full proposal and commits it only after approval. Do not use raster image/video generation as a substitute. The user should not need to understand implementation details or manually coordinate technical departments.

## D-014 — User-facing collaboration style (2026-11-18)
**Decision:** The user is not expected to understand software engineering or production terminology. Explain progress in simple Arabic, avoid jargon and unnecessary technical questions, and work directly in the repository wherever possible. The user values deep, creative thinking and expects the assistant to take initiative. Short instructions such as “continue”, “go ahead”, or “okay” mean continue working toward the agreed finished result, not provide only a status update. Do not ask the user to copy/paste code, operate Git, manage files, or coordinate technical departments when the connected tools can do that work.

**Implication:** Keep detailed technical notes, tests, limitations, and continuation state in repository documents. Report meaningful outcomes in plain Arabic, distinguish completed from pending work, and never imply that a project is finished until all acceptance checks are met. The user should be treated as the creative owner/director; the assistant owns the technical execution and should proactively choose the next sensible implementation step within the agreed constraints.


## D-015 — High-volume animation is ordered independent vector drawings (2026-11-18)
**Decision:** Long animation must be planned and ingested in small, ordered, resumable batches. Each accepted frame is a complete editable vector drawing; 24 unique drawings per second remains the target.

**Implication:** The engine may enforce a structural ceiling and batch size for mobile safety, but a structural capacity limit does not prove device performance or artistic quality. Validate batch identity, timing, layer continuity, SVG paths, and duplicate frames before appending. Save progress in the project. Do not replace the requirement with still-image motion or keyframe tweening. Provider selection and API quotas are separate decisions and remain deferred until the user requests that discussion.


## D-016 — Free SVG provider choice must not become a per-frame quota trap (2026-11-18)
**Decision:** Keep provider choice separate from the vector drawing engine. Prefer native SVG/path output and provider-neutral structured drawing data; never rely on raster output plus vector tracing. A free tier is not assumed to be unlimited.

**Implication:** Evaluate services using actual request, token, output-size, privacy, and reset limits. Explore having the AI author a scene-specific vector drawing specification which the local renderer can execute into a complete, independently stored SVG drawing for every frame, but only accept that approach after a 240-frame prototype passes the unique-drawing cadence audit, full-scene completeness, continuity, and artistic review. Do not replace the 24 independent drawings/second target with a static image, SVG animation element, or simple keyframe tween.

**Provider status:** OmniSVG, OpenRouter, Groq, Cerebras, local llama.cpp, and other options are research candidates only. No live provider has been selected or connected as of this decision.

## D-017 — 2D-first cinematic anime art direction (2026-11-18)

**Decision:** ZERO STUDIO's visual target is cinematic 2D anime background painting with selective 3D assistance. The final artwork must read as 2D first. A full-scene low-poly 3D render is not an acceptable replacement.

**2D responsibilities:** final environment surfaces, organic foliage, architectural/material detail, selective linework, color design, shadows/highlights, atmospheric perspective and final compositing are authored as editable 2D drawings/paths and bounded vector material effects.

**3D responsibilities:** camera/perspective guides, rough layout/blockout, spatial/occlusion references, optional shadow/reflection guides and selected props only. 3D mesh output is advisory unless its final style is deliberately flattened and visually matched to the 2D artwork.

**Production implication:** background painting and character animation use different art grammars. Backgrounds target the user's three cinematic environment references; characters require separate anime model sheets, clean line art, cel color keys, expressive drawings and frame-by-frame cleanup.

**Acceptance gate:** create and visually review three editable scenes (urban store, rural ramen shop, forest house). Passing code tests or increasing path count does not count as artistic acceptance. The 24 unique full-scene drawings/second requirement remains unchanged for animation.

**Durable art specification:** `docs/ANIME_ART_DIRECTION.md`.


## D-018 — Static background assets with independently redrawn animation layers (2026-11-19)

**Decision:** Adopt the standard anime production separation of environment backgrounds and animated foreground elements. A finished background is painted once as an editable layered vector asset and may be reused for the duration of a shot while the camera/layout remains fixed. Characters and every other moving element are drawn as new, independently authored vector artwork at each of the required 24 timepoints per second.

**Frame definition:** Each playback timepoint is composited from the approved background asset plus that timepoint's newly drawn animated layers. The background's intentional reuse does not count as a new drawing. The moving artwork must meet 24 unique drawings per second; do not substitute duplicated moving frames, raster transforms, video, or tween-only motion. If the camera moves or the background visibly changes, the affected environment layers must also be redrawn or generated as distinct editable frames at the required cadence.

**Implication:** The animation project must track background asset identity/version separately from per-frame animated layers, preserve layer order and continuity, and export a complete visible composite for every timestamp. Validate unique moving-art signatures independently from playback FPS and from the reused background.

## D-019 — Visual critique-and-revision loop (2026-11-19)

**Decision:** A generated scene is a draft until it has been rendered to a temporary preview, visually critiqued, revised as editable vector operations, and reviewed by the user. Raster previews are allowed only as temporary inspection inputs; they are not final artwork and are never imported as replacement scene content.

**Review dimensions:** composition, perspective, architecture, foliage, material differentiation, lighting, atmosphere, line/edge quality, focal hierarchy, scene-specific detail, and consistency with the approved 2D anime art direction.

**Implication:** Implement a bounded review cycle: render preview → vision-capable critique → prioritized corrections → apply corrections to SVG paths/material parameters → render again. Record the critique and iteration count. A model must never claim to have inspected an image it was not actually given. Human visual approval remains the acceptance gate.

## D-020 — Vector-first material texture; raster texture deferred (2026-11-19)

**Decision:** Keep final artwork editable and vector-first for the current quality milestone. Use SVG gradients, patterns, organic paths, selective filters, and procedural material marks to improve painterly richness. Temporary raster previews are permitted for visual review. Do not add raster texture layers to final artwork until a separate measured comparison demonstrates that vector methods cannot meet the target and the user approves that change.

## D-021 — Human-authored artwork and professional painting department (2026-11-19)
**Decision:** ZERO STUDIO is a human-led anime production studio. Final backgrounds, characters, props and animation drawings must be painted/drawn by a human artist using a professional drawing application or genuinely artist-operated drawing tools. Generative image/video models must not create, alter, inpaint, outpaint, or synthesize final artwork.

**Implication:** Do not mistake procedural SVG primitives or a minimal Canvas brush implementation for a painterly art engine. Stop expanding procedural scene painters as a route to reference-quality anime background painting. A professional Android painting application is the art department; ZERO STUDIO is the production manager, asset organizer, animation timeline, compositor and delivery workspace.

**Interchange:** Validate PSD, OpenRaster, or lossless PNG-layer bundles on the actual Android workflow before choosing a format. Never silently flatten a layered source. Keep source artwork and metadata intact.

**Animation:** The 24 independently drawn images/second target remains unchanged. Static backgrounds may be reused; moving artwork must meet the independent-drawing target. See docs/HUMAN_ART_WORKFLOW.md.

## D-022 — SVG is a protected core capability, not a disposable prototype (2026-11-19)

**Decision:** SVG remains a first-class, strategic foundation of ZERO STUDIO. The human-led painting department decision (D-021) does not cancel, replace, or demote the editable SVG drawing engine. ZERO STUDIO must preserve and continue developing native SVG authoring, path geometry, semantic layers, vector brushes/marks, gradients, patterns, masks, filters, lighting effects, validation, editing, animation, and SVG export.

**Two complementary art paths:**
1. **Native vector path:** Artists and approved tools can create and refine original artwork directly as editable SVG paths and vector layers. Painterly appearance may be built from expressive tapered paths, varied marks, material patterns, controlled edge variation, and non-destructive vector effects. SVG is not limited to flat geometric primitives.
2. **Hand-painted asset path:** Artists may create artwork in a professional painting application and import layered source assets through a verified, lossless interchange workflow. Imported raster layers remain clearly identified as raster source assets; they do not silently replace, flatten, or erase native SVG content.

**Architecture protections:**
- Keep SVG as a documented, tested, editable project format and core rendering/compositing representation.
- Preserve path data, layer names/order, visibility, opacity, blend/effect metadata, and source identity through save/open/export wherever supported.
- Never silently rasterize or flatten SVG artwork during editing or interchange. Any required raster preview is derived and disposable; the source SVG remains intact.
- Do not replace the SVG engine with a bitmap-only canvas or make an external painting app a mandatory runtime dependency.
- Keep the native vector workflow available on Android, including freehand paths and future pressure/brush support where device input permits.
- Add regression tests for SVG round-trip fidelity, vector editability, layer preservation, and mixed SVG/raster compositing.
- Treat procedural SVG scene painting as an experimental technique, not proof of human-level art quality. Human review remains mandatory for visual acceptance.

**Relationship to D-021:** Human-authored final art and native SVG are compatible. Artists may draw directly in ZERO STUDIO's vector tools or import layered hand-painted assets. The project remains a hybrid-capable, vector-first production system with optional human-painted raster assets—not a raster-only replacement.

**Acceptance gate:** Any architecture proposal that removes native SVG editing/export, silently flattens SVG, or makes vector assets non-editable requires explicit user approval before implementation.


## D-023 — Human-painted raster is the primary art path; SVG remains optional and first-class (2026-11-19)

**Decision:** Adopt a hybrid production architecture. Human-authored layered raster painting is the primary path for final anime backgrounds, characters, props, and painted animation drawings. Native SVG remains a supported, editable, first-class optional path for artwork that benefits from vectors. Neither representation is mandatory for every asset. This decision supersedes the vector-first/mandatory-vector implications of D-012, D-020, and D-022 where they conflict; it does not delete or invalidate existing SVG projects, tools, exports, or assets.

**Human-art boundary:** Raster pixels and vector marks in final artwork must be authored by a human artist. Generative image/video models may not create, modify, inpaint, outpaint, or synthesize final visual content. AI may assist with planning, metadata, technical validation, and critique text, but not make final visual marks.

**Layer and source preservation:** A project may contain raster layers, SVG/vector layers, and mixed composites. Preserve layer identity, source files, dimensions, pixel density, color profile when available, alpha, names, order, visibility, opacity, supported blend modes, and provenance. Never silently flatten, discard unsupported layers, convert SVG source destructively, or replace a layered source with a preview. Any flattened composite or PNG preview is derived output, clearly marked and reproducible where possible.

**Interchange:** PSD, OpenRaster (.ora), and lossless PNG-layer bundles are candidates, not declared supported formats, until round-trip tests prove layer fidelity on Android. The first verified interchange must include at least three named transparent layers, differing opacity/visibility, alpha, and known ordering. Preserve the original imported package unchanged alongside normalized project metadata. Report unsupported blend modes, color profiles, masks, and effects explicitly.

**Animation:** Preserve the user's requirement of 24 independently authored moving-art drawings per second. Raster and vector drawings both count when each is a genuinely distinct human-authored drawing. A static approved background may be reused while the camera/layout remains fixed. Do not satisfy the target through duplicated frames, tween-only motion, transforms of a still, or generated video. Audit unique drawings independently from playback FPS; structural uniqueness does not prove human authorship or artistic quality.

**Architecture:** ZERO STUDIO is the production, asset, timeline, continuity, compositing, and delivery workspace. A professional Android painting app may be the primary painting surface initially, but it must not become a mandatory runtime dependency. Native vector editing/export remains available. The asset model and compositor must support mixed raster/vector layers without forcing either format into the other.

**Acceptance gates:** (1) lossless layered import/export round-trip on Android; (2) mixed raster/vector project save/open and composite tests; (3) no silent flattening or source loss; (4) distinct 24-drawing/second moving-art cadence remains measurable; (5) human visual approval remains mandatory. No claim of professional painting quality until a real artist workflow is tested.


## D-024 — Absolutely no generative image models in ZERO STUDIO artwork (2026-11-19)

**User confirmation:** The user explicitly confirmed that image-generation models are prohibited entirely for this project.

**Binding rule:** No generative image or video model may create, alter, inpaint, outpaint, extend, stylize, upscale-generatively, or synthesize any final artwork, background, character, prop, texture, animation frame, or visual mark. This prohibition also applies to hidden workflows, API integrations, external services, and "assistant-only" image generation. Do not add a generator toggle or offer a generator-based fallback.

**Allowed assistance:** Text-only planning, art-direction checklists, perspective/material analysis, technical debugging, code generation for deterministic drawing tools, test authoring, metadata, and non-generative critique. All final pixels and vector marks must result from human drawing input or explicit deterministic editing operations controlled by the artist.

**Implementation requirements:** Remove generator controls from the active drawing workflow; audit and isolate legacy generator modules so they cannot be invoked from the final-art UI or project pipeline; add regression checks for the no-generation boundary; preserve existing SVG and Raster authoring paths. No destructive bulk deletion of legacy code or existing artwork without review.

**Quality requirement:** Do not imply that deterministic procedural marks equal professional painting. The project must prove quality through a human-painted full-scene study, reviewed on the target Android device. Passing tests is not artistic acceptance.


## D-025 — Canvas-first artist engine

**Status:** Approved by user, 2026-11-19.

ZERO STUDIO's primary drawing medium is a native Canvas2D raster engine, following the agreed Claude recommendation. SVG is no longer the planned foundation or a development priority. Existing SVG content is legacy compatibility during migration only. The artist engine must support real brush rendering, pressure/velocity dynamics, natural-media texture, blend modes, editable stroke records, deterministic replay, raster layers, masks, and mobile-safe undo/storage. No generative image or video model may create or modify final artwork. The 24 independently drawn images-per-second target remains unchanged.


## D-026 — Hybrid AI-assisted anime production studio (2026-11-20)

**Status:** Explicitly approved by the user. This is the current governing direction.

**Decision:** ZERO STUDIO will use a specialized image-generation model/service as an integrated art-production department for anime characters, backgrounds, props, and scene assets. ZERO STUDIO remains the production and creative-control studio responsible for character identity, reference management, scene preparation, asset/layer organization, animation planning, timing, camera, cleanup workflow, compositing, audio, and final delivery. A video generator must not replace the studio's animation and episode-production pipeline.

**Architecture:** (1) provider-neutral specialist art-generation adapter; (2) project Character Bible and approved Model Sheets/reference images; (3) scene and asset preparation with source/provenance preservation; (4) animation engine for key poses, timing, holds, inbetween/cleanup workflow, camera and compositing; (5) final episode assembly and delivery.

**Character continuity:** Every generation task must use approved visual references and character metadata. Model Sheets, palettes, clothing, proportions, expressions, and pose references are persistent project assets. Automated consistency checks are advisory; human visual approval is mandatory. LoRA/fine-tuning is deferred until a base provider, rights, dataset, cost, hosting, and measurable benefit are evaluated.

**Provider selection:** No model/provider is selected by this decision. Compare visual quality, reference control, pose/composition control, API access, Android workflow, cost/quotas, latency, privacy/data retention, commercial rights, and stability. Keep credentials secure and provider integrations replaceable.

**Animation target:** Preserve the user's target of **24 independently drawn images per second**. Do not replace it with 8–12 drawings/second, repeated drawings at 24 FPS, generated video, or tween-only animation without explicit user approval. Generated stills may serve as approved assets or keyframe references; they do not automatically constitute the required independently drawn moving-art frames.

**Quality gates:** Procedural geometry and increased path counts are not substitutes for professional anime art. Passing software tests does not prove artistic quality. No milestone is accepted without a real visual result and human review. Character continuity across scenes is mandatory.

**Migration:** This decision supersedes prior no-generative-image restrictions in D-021, D-023, and D-024, and the no-generation clause in D-025, wherever they conflict. Historical entries remain for auditability, not as current policy. Do not destructively delete old drawing engines, vector/raster tools, assets, or tests; audit dependencies and reuse valuable components. No PR merge or production deployment without explicit user permission.

**First milestone:** Audit the existing code and provider research, then compare current specialist models/services and produce a small representative character-sheet/background proof. Do not start LoRA training or a wholesale engine rewrite before this evaluation.

See [New Hybrid Production Direction](docs/NEW_HYBRID_PRODUCTION_DIRECTION.md).


## D-027 — Anime key-drawing and independent raster in-between pipeline (2026-11-20)

**Status:** Explicitly approved by the user. This is the governing animation architecture under D-026.

**Problem statement:** Character and background artwork already have a working specialist generation/asset pipeline. Animation is the missing production department. Do not rebuild the art-generation engine or redirect the project to manual drawing as its only motion solution.

**Decision:** Animate through anime production drawings: motion direction and timing charts → spatial pose blocking → full 2D key drawings → individually reviewed in-between/cleanup drawings → raster frame assembly. The existing still-image art department may create individual key drawings using approved Character Bible/model-sheet references; no generic text-to-video clip is accepted as the final result.

**Spatial guide boundary:** A lightweight 3D skeleton/pose proxy may solve body orientation, camera, perspective, depth, foot contacts, arcs and pose timing. It is a guide only. Never deform/rotate/warp the approved character image with a puppet rig and present that as final animation.

**Final frame contract:** Every timestamp has its own complete PNG/lossless-WebP drawing, own asset identity and content hash, plus references/provenance/review state. In-between tools may propose standalone raster drawings between two approved key drawings, but their output must be reviewed per frame. No copied stills, held exposures, pixel warps, SVG path animation or generic video output count as an independent drawing.

**Target:** Exactly 24 distinct moving-art raster drawings per second. A fixed approved background may be composited beneath those frames without being counted as a moving drawing. The 24-drawing target is not reduced.

**Model/provider status:** No in-between model or provider is selected. ToonCrafter and frame-specific reference-conditioned still generation are research candidates only. The repository must not assume an always-on free GPU endpoint or use paid inference/GPU fallback. FLUX.2's documented multi-reference input is useful for the existing key-drawing workflow but does not guarantee precise pose control or character identity; those must be measured on the real character.

**Visual acceptance:** Identity (face/profile, hair, costume, proportions, palette), anatomy, silhouette, contact, balance, timing, spacing, cloth/hair follow-through, camera continuity and 24 unique raster drawings must all pass review. A passing test or frame count is not artistic acceptance.

**Preservation:** Keep the existing character/background generation, Character Bible, reference-conditioning, gallery, raster and SVG engines intact. The old SVG motion proof is archived as a failed visual experiment, not deleted. No merge or production deploy without explicit permission.

**Implementation:** `docs/ANIME_KEYFRAME_MOTION_ENGINE.md` defines the workflow. `app/anime-motion-engine.mjs` implements the first provider-neutral planning and independent-raster drawing contract.


## D-028 — Anatomy-guided independent character drawings (2026-11-20)

**Decision:** Supersede the per-frame still-image generation approach in D-027 for character animation. Repeatedly regenerating the character for every timepoint is not an acceptable motion engine because reference conditioning cannot guarantee stable identity, anatomy, hands, face, costume, or linework. Keep the approved character design as an immutable identity source and build movement from anatomy data and complete artist-approved drawings.

**Production path:** Canonical Character DNA and measured proportions → complete artist-authored key drawings → motion/timing chart → smooth joint-trajectory construction guides with limb-length constraints and planted-foot anchors → complete independent artist redraw for every output timepoint → transparent raster frame review and assembly.

**Hard exclusions:** no per-frame generative still requests as the animation method; no text-to-video; no single-image cut-out puppet; no mesh/rig deformation of approved artwork; no path tween or vector interpolation presented as final anime art; no held/copy frames. A skeleton, proxy, or anatomy canvas is a guide only and must never be accepted as character artwork.

**Cadence:** retain the exact target of 24 distinct, independently drawn raster images per second. Each frame must have its own asset ID and unique content hash and pass identity, anatomy, line-quality, and timing review. A unit test or a 24-slot schedule does not prove an animation exists or that it is artistically acceptable.

**Implementation:** add the provider-neutral anatomy engine in `app/anime-anatomy-engine.mjs`, with validated Character DNA, approved key-drawing records, smooth guide interpolation, two-bone constraints, planted-foot anchors, guide-only construction previews, independent transparent raster frame records, duplicate rejection, and per-frame review gates. The former per-frame still request helper remains legacy-only and must not be used for the approved animation path.

**Limits:** a new camera view, major foreshortening, or occlusion change requires additional complete key drawings and possibly a view-specific Character DNA record. Hair, hands, facial features, cloth folds, overlaps, and final linework remain full redraw responsibilities. The mobile editor now has first-pass Character DNA calibration, key-drawing registration, anatomy-guide overlay, PNG frame storage/review, and ZIP export controls; actual-character annotation and visual proof remain pending.

**Change control:** Android-first, $0 budget, no paid provider/GPU, no production deployment, and no merge to `main` under this decision.

**Raster acceptance implementation:** The editor stores each complete drawing as a per-frame transparent PNG generated from that frame's actual drawing layers. SHA-256 hashes identify the PNG bytes and the canonical SVG source. Editing a frame after capture invalidates the stored raster for approval; tampered bytes and repeated hashes are rejected. The ZIP sequence is available only after 24 unique PNGs pass identity, anatomy, line-quality, and timing review. The shared static background is exported separately once. CI verified 290 tests with zero failures on branch HEAD `4221ec7664ebd3bc6e360b528cd5594c1067b76b`; this is software verification only, not proof of a visually accepted animation.



## D-029 — AI Digital Artist: explicit drawing, never image generation (2026-11-21)

**Decision:** Build ZERO STUDIO's character department as an AI digital artist that creates artwork through explicit, ordered, editable drawing operations. The artist may reason about a character and produce individual vector strokes, curves, closed fills, layer changes, and corrections. It must not call an image-generation or text-to-video model to make final artwork, embed a generated image, trace a generated image, or disguise a flattened picture as a drawing.

**Artist architecture:** a reasoning/art-direction brain; stable Character DNA and model-sheet memory; anatomy and optional 3D pose guides; a drawing hand that executes path/stroke commands into semantic editable layers; and a visual critique/correction loop that revises the original drawing operations.

**Production stages:** identity/reference registration → gesture and silhouette → anatomical construction → rough drawing → clean line art → flat colors → cel shadows/highlights → details → critique and editable corrections.

**Technology roles:**
- Paints-Undo and inverse-painting research are candidate sources of reconstructed drawing-stage supervision. They predict plausible drawing processes; they do not recover the original artist's exact historical pen coordinates and are not the drawing hand.
- DiffVG is an optional differentiable vector rasterizer/optimizer for continuous path/width/color refinement; it is not an autonomous drawing planner and its original method does not solve arbitrary topology changes.
- 3D rigs and the existing Character DNA system provide spatial/anatomical guidance only. 3D renders are not final anime drawings.
- ZERO STUDIO's native SVG/path engine is the initial drawing hand. Every mark remains an editable operation with a stable ID, purpose, tool, layer and sequence position.

**Relationship to previous decisions:** This decision supersedes the AI-authorship prohibition in D-021 and the human-only mark-authoring boundary in D-023 only for artwork authored by this explicit, editable Digital Artist command pipeline. It does not authorize generative image/video output. Human-painted raster imports and existing SVG/raster editing remain supported, and no source asset may be silently flattened or replaced.

**First acceptance gate:** one approved character reference must become one complete full-body drawing from a blank canvas, made of individual editable strokes and semantic layers. The user must be able to replay the strokes in order, edit a defective path, save/reopen the project, and verify that identity, face, hair, costume and proportions match the reference. Unit tests alone do not pass the visual gate.

**Animation target:** unchanged — 24 independently authored moving-art drawings per second. Do not count guide interpolation, reused frames, image warps, puppet deformation, or generated video as independent drawings.

**Constraints:** Android-first; $0 hard budget; no paid API/GPU/service or automatic paid fallback; develop on an isolated branch; no merge or production deployment until implementation and visual acceptance are reviewed.

**Source of truth:** docs/DIGITAL_ARTIST_ARCHITECTURE.md.


## D-030 — Raster-first drawing hand; SVG is optional (2026-11-21)

**Decision:** Refine D-029. The AI Digital Artist does not require SVG. SVG-only authoring risks a mechanically geometric result and cannot by itself reproduce the varied organic pigment, pressure, brush texture, and painted edges of professional anime drawing. ZERO STUDIO must use its existing native Canvas2D raster brush engine as the primary final-art drawing hand.

**Primary output:** separate transparent raster layers containing ordered, individually recorded and replayable brush-stroke commands. Each command includes its purpose, semantic layer, point samples, pressure, brush profile, size, color, opacity, texture, blend mode, deterministic seed and erase behavior. A flattened image may be produced only as a preview/export; it is never the editable source of truth.

**SVG role:** optional only — construction guides, skeletons, simple masks, geometry, and selected editable contours. It is not mandatory for clean line art, flats, shadows, or final character rendering. Never force organic hair, facial contours, fabric or painted shading into a collection of mathematically smooth curves merely to call it editable.

**Existing assets to reuse:** app/raster-brushes.mjs and app/raster-surface.mjs. Extend their brush profiles for anime line taper, nib behavior, stabilizer, speed/pressure response, dry-brush edges, and controlled cel-shading as needed. The AI emits a plan; the native brush engine executes it.

**Implementation:** docs/DIGITAL_ARTIST_ARCHITECTURE.md and app/digital-artist-brush-engine.mjs define the raster-first path. This refinement supersedes the vector-first drawing-hand choice in D-029, while keeping D-029's no-image-generation rule, AI art-director, character memory, anatomy guidance, critique loop, editable steps, $0/Android-first constraints, and unchanged 24 independently authored drawings/second target.

**Acceptance gate:** one complete full-body anime character from a blank canvas, rendered by native pressure-sensitive brush commands into separate raster layers, replayable stroke-by-stroke, with stable reference identity and user-approved visual quality. SVG may be used for invisible guides only. No image/video generation, no hidden flattened generated artwork, no paid compute, no production merge/deployment without approval.

## D-031 — Build the artist's own eyes and anime craft knowledge before external vision dependencies (2026-11-21)

**Decision:** The Digital Artist must become a stronger artist in its own right. A general-purpose external vision-language model is not a prerequisite for seeing, understanding, planning, or drawing. Do not make the artist wait for another AI to tell it what is visible or what to draw.

**The two governing goals remain unchanged:**
1. Build ZERO STUDIO into a real anime production studio capable of producing a professional animated series.
2. Build a genuine digital anime artist that authors artwork through editable raster drawing operations, then supports the unchanged goal of 24 independently authored drawings per second.

**The artist's own eyes:** Build a multi-pass internal perception and critique system that can inspect its current canvas, layers, marks and character references at multiple scales. Its specialist "eyes" must cover:
- silhouette and contour: shape closure, proportions, overlaps, holes, gaps, and region-fill leakage;
- anatomy and construction: facial landmarks, head/body proportions, pose balance, joint relationships and perspective guides;
- line art: continuity, taper, pressure hierarchy, wobble, intersections and line cleanliness;
- color and light: region coverage, palette consistency, flat-color boundaries, cel-shadow shapes, highlights and light direction;
- character identity: compare approved model-sheet measurements, face/hair/costume landmarks and palette swatches;
- temporal continuity: later, compare independently drawn frames for identity drift, anatomy jumps and changing design details.

These eyes are measurement and critique tools, not image generators. They may combine deterministic computer vision, geometry, pixel/region analysis, project metadata, and small specialist models that can run within the $0 budget. No single external VLM is required.

**Anime craft knowledge:** Build a structured, searchable anime drawing curriculum and reference library, not a vague prompt or an unlicensed scrape. Teach and evaluate shape language, gesture, anatomy, facial construction, eyes, hair masses and strand grouping, hands, costumes and folds, perspective, inking, brush/line-weight hierarchy, flat-color grouping, cel shading, lighting, material rendering, expressions, model sheets and shot continuity. Each reference should record provenance, permitted use, style/technique labels, drawing stage, and any associated annotated strokes or regions.

**Learning route:** start with user-approved model sheets and examples the project owns or is authorized to use; record authentic process examples as editable operations; create annotations and drawing exercises; train or tune small specialist perception/planning components only when a lawful, suitable dataset and free compute are available. Prefer explicit measurable exercises and feedback over attempting to train a large general model from scratch.

**Data rights:** dataset availability does not equal permission for commercial anime production. Manga109's general collection is restricted to academic non-commercial use; Manga109-s has a separate limited commercial-use grant with conditions and a no-redistribution rule. Every dataset and artwork source must be checked individually before ingestion. Do not use non-commercial datasets for commercial training or outputs.

**Drawing hand:** improve the native raster engine itself—anime-appropriate tapered ink, stable curves, organic hair/cloth brushes, closed region and mask fills, clean flat-color coverage, controlled cel-shadow shapes, highlights, and layer replay/correction. The artist, not an image-generation model, must author every final mark.

**Implementation priority:** 1) develop the native eyes and measurable critique; 2) improve brush, fill, coloring and inking; 3) create the licensed anime reference/learning library and exercises; 4) connect the eyes to the artist's correction loop; 5) evaluate small free specialist models as optional accelerators; 6) only then scale to a complete model-authored character and 24 unique drawings/second.

**Guardrails:** no generated image/video output as final art; no paid inference, GPU, subscriptions, or fallbacks; Android-first; preserve separate editable layers and ordered stroke history; no merge or production deployment without user approval.

**Source of truth:** docs/DIGITAL_ARTIST_ARCHITECTURE.md and ROADMAP.md.


## D-032 — Identity and palette eyes must fail closed on missing reference features (2026-11-21)

- `compareLandmarks()` and `comparePalette()` now evaluate every feature in the approved reference, not only the intersection with the current drawing.
- Missing facial/anatomical landmarks or named palette swatches are explicit failures with a `missing` list; they can no longer disappear from the denominator and produce a false pass.
- Present features retain normalized-coordinate and RGB-distance checks. Reports distinguish measured features from missing ones; an incomplete comparison cannot pass.
- Regression tests cover missing eye landmarks and missing costume/hair palette swatches.
- Verified on `ce3651bdbdfda6678eb10d4b7fc72d7b4b21eb4d`: Drawing engine run #2490 passed all 381 tests. Drawing engine run #2491 also passed; Hybrid raster/SVG run #659 passed its Node tests and Canvas2D renderer/artifact jobs.
- This is a stronger deterministic identity-checking foundation, not yet a learned visual model or a full facial-recognition system. Facial landmark extraction from a rendered character and palette extraction against an approved model sheet remain to be connected.


## D-033 — Anime-specific practice must teach drawing craft, not generic tool usage (2026-11-21)

**Decision:** The Digital Artist's primary learning subject is Japanese anime drawing craft. General brush-operation tests are necessary but do not constitute artistic training.

**Implementation:** Maintain detailed practice studies for every curriculum skill. Each study must include (1) a style-aware artistic principle, (2) a concrete drawing sequence, (3) common visual failure modes, (4) a visible deliverable, and (5) a skill-specific review rubric. Sessions may be scaled from foundation to advanced difficulty and should use the approved character reference where available.

**Curriculum scope:** gesture and silhouette; anime head construction and facial planes; eyes, gaze and expressions; hair masses and strand flow; stylized anatomy and balance; hands and feet; costume construction and folds; perspective and foreshortening; anime inking and taper; flat-color region control; cel shadows and lighting; material highlights; model-sheet identity; composition; and independent drawing continuity.

**Evaluation boundary:** A practice brief is not evidence of completed practice. Human visual review remains required for criteria not yet connected to a reliable raster/anatomy/identity measurement. Do not award skill mastery from generic stroke counts or an unrelated metric. Neural training is not claimed until a lawful dataset, training method, free compute path, and measured before/after improvement are actually demonstrated.

**Drawing output:** All final marks remain editable native Canvas2D raster brush operations on semantic layers. The training module creates no image and cannot substitute generated pictures for the drawing exercise.

**Constraints:** Android-first, $0 budget, rights-cleared references only, no paid fallback, no PR merge or production deployment without explicit user approval.


## D-034 — Specialist anime eyes must compare against the character's own model sheet (2026-11-21)

**Decision:** Eye and hair design are style-specific. The artist must preserve the approved character's own eye proportions, slant, iris/pupil placement, spacing, and hair clump flow; do not impose one universal anime template.

**Implementation:** Add geometry comparison functions for normalized approved/current eye landmarks and stable named hair root-tip clumps. Produce specific correction exercises linked to the failed measurement or clump. Surface the comparison in the Arabic artist panel.

**Evidence boundary:** These checks compare supplied/model-reported landmarks; they do not detect landmarks directly from pixels. Hair clump root-tip comparison is not strand segmentation. The results may guide human correction but cannot be used to claim visual understanding or skill mastery until tied to verified reference and current raster evidence.

**Output:** Continue using native editable raster brush strokes for final drawing. Comparison helpers do not generate or edit artwork automatically.
