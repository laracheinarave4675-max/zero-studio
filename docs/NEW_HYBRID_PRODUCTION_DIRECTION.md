# ZERO STUDIO — New Hybrid Anime Production Direction

**Status:** Approved by the user on 2026-11-20. This is the current governing product and architecture direction.

## Mission

Build ZERO STUDIO as a complete anime production and creative-control studio capable of producing convincing, professional-quality anime artwork and animation. The studio is not required to render every artistic mark itself. It coordinates specialized art generation, character continuity, scene preparation, animation, compositing, and final delivery.

The user works from an Android phone and does not have a desktop computer. All project management, review, and practical workflows must therefore remain usable from Android. Prefer free or low-cost services, but never describe limited free tiers as unlimited or hide operational costs.

## Governing production architecture

1. **Art production engine**
   - Integrate a specialized anime-capable image-generation model/service for creating draft and approved visual assets, including characters, backgrounds, props, and other scene artwork.
   - Evaluate providers before selecting one: visual quality, reference-image control, character consistency, pose/composition control, API availability, Android usability, cost and quotas, latency, privacy/data retention, commercial-use rights, and service stability.
   - Keep provider integration behind a replaceable adapter. Do not hard-code the entire studio to one provider.
   - Do not begin LoRA training until a base model/provider, dataset rights, training cost, hosting, and measurable consistency benefit have been evaluated.
   - Image/video generation is an art-production input, not an autonomous episode-production shortcut. Do not delegate the complete episode or final animation to a video generator.

2. **Character identity and continuity**
   - Maintain a project-level Character Bible and canonical Model Sheets.
   - Store approved reference images, front/side/back views, facial expressions, poses, proportions, palette, clothing, accessories, and version history.
   - Every scene request must be grounded in the relevant approved character references and scene context, not text description alone.
   - Add visual consistency review against approved references. Automated similarity checks are advisory; human approval remains required.
   - LoRA or other fine-tuning may be considered later, only after a provider/model and rights/cost review.

3. **Scene preparation and asset management**
   - Organize generated/imported artwork into scenes, shots, characters, backgrounds, props, effects, and layers.
   - Support segmentation, masks, transparent layers, depth/parallax planes, and editable scene metadata where technically reliable.
   - Preserve original source assets and provenance. Never silently flatten, overwrite, or discard source layers. Clearly identify derived previews and composites.
   - Retain useful existing raster and vector editing capabilities; do not rewrite or delete the current drawing engine wholesale before a dependency and migration audit.

4. **Animation engine**
   - ZERO STUDIO remains responsible for animation planning and control: storyboard/shot structure, key poses, timing, holds, spacing, exposure sheets, camera movement, layer transforms, cleanup workflow, compositing, and export.
   - Distinguish Key Animation, Inbetween, Cleanup, Coloring, and Compositing as separate production stages.
   - Generated images may serve as approved visual assets or keyframe references. Do not assume generated video or automatic interpolation alone produces professional animation.
   - Preserve the user's target of **24 independently drawn images per second**. Do not silently redefine it as 8–12 drawings per second, 24 FPS playback with repeated drawings, or a tween-only substitute. Any proposed change requires explicit user approval.
   - A fixed approved background may be reused when the shot camera/layout remains fixed; moving artwork must meet the agreed independent-drawing requirement.

5. **Final production and delivery**
   - Composite approved scene layers, characters, effects, lighting, camera, and backgrounds.
   - Manage dialogue, sound effects, music, editing, shot assembly, quality control, and final episode export.
   - Track provenance, asset versions, review status, and rights/usage restrictions for every external model or asset.

## Non-negotiable quality and engineering rules

- Do not treat procedural geometric drawing, increased path counts, or more complex drawing prompts as a substitute for professional anime artwork.
- Passing code tests is not evidence of artistic quality.
- No production stage is accepted until a real visual result is shown at useful resolution and reviewed against the target.
- Character identity and continuity across shots are mandatory acceptance criteria.
- Animation must respect anime timing, weight, posing, spacing, holds, and intentional motion—not merely smoothness.
- Never claim an Android device test, visual inspection, provider connection, or deployment occurred unless it actually did.
- Do not select or train a model before evaluating quality, reference control, cost, rights, privacy, and Android-accessible integration.
- Keep the system provider-neutral and modular.
- Do not merge pull requests or deploy to production without the user's explicit permission.

## Migration and treatment of previous work

This direction supersedes prior project rules that prohibited generative image models for final artwork, including the conflicting restrictions in D-021, D-023, D-024, and D-025. Those entries remain in the decision history but are no longer governing where they conflict with this approved direction.

This does **not** authorize destructive cleanup. Existing SVG/vector assets, Canvas2D raster brushes, project formats, animation tools, tests, and production infrastructure must first be audited for reuse. Retire or isolate obsolete procedural scene-generation paths only after tracing dependencies and preserving valuable work.

## Implementation sequence

1. Record this direction as the governing project decision and update the repository entry points so obsolete restrictions are clearly marked as superseded.
2. Audit the current codebase and existing provider research. Identify reusable components, legacy generators, incomplete integrations, and risks.
3. Research and compare current specialist image models/services against the criteria above. Provide a grounded shortlist with pricing/quotas, licensing, reference controls, and API feasibility.
4. Design the provider-neutral art-generation adapter, secure credential handling, job lifecycle, asset provenance, and Android-first review flow.
5. Prototype one representative character Model Sheet and one complex background/scene using the selected provider; evaluate them visually before broader integration.
6. Build character identity/continuity management and scene asset preparation around approved results.
7. Integrate approved assets with the existing animation/timeline/compositing systems, then improve keyframe/inbetween/cleanup workflows.
8. Validate a complete short shot visually and technically before scaling toward episode production.

## First milestone — architecture and provider decision

The immediate next milestone is **not** LoRA training and not a wholesale engine rewrite. It is a codebase audit plus a current provider/model comparison and a small, measurable art-quality proof. No provider is considered selected until the user sees the trade-offs and the choice is made explicitly.

## Acceptance gates

- A provider is selected only after quality, reference control, cost, rights, privacy, and API access have been checked.
- The provider adapter can be replaced without rebuilding the studio's production workflow.
- A character remains recognizably consistent across multiple views, expressions, poses, and at least two distinct scene contexts, subject to human review.
- Imported/generated assets retain source provenance and are manageable as production assets.
- A representative scene is reviewed visually; test success alone is insufficient.
- The animation system preserves the 24 independently drawn images/second target unless the user explicitly changes it.
- A complete short shot can be assembled and reviewed inside the ZERO STUDIO production workflow.
