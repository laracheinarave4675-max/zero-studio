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
