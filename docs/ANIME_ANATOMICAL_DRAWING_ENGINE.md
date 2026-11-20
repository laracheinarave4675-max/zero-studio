# ZERO STUDIO — Anatomy-Guided Independent Drawing Engine

Status: **D-028 approved and implemented as a provider-neutral geometry foundation. Full artist workflow and visual acceptance remain pending.**

## Why the motion direction changed

The first keyframe prototype could request a newly generated image for every timepoint. Reference images reduce identity drift but cannot guarantee anatomy, facial consistency, costume continuity, or the absence of malformed limbs. Repeating that operation 24 times per second multiplies the opportunities for errors; it does not create a dependable drawing department.

D-028 therefore supersedes the per-frame still-generation route for character animation. The existing approved character design remains the immutable identity source. Motion is solved from anatomy and artist-approved drawings, not by repeatedly asking an image model to reinvent the character.

## Approved production architecture

1. **Canonical Character DNA.** Register the approved character asset, Character Bible, model-sheet references, canonical view, joint landmarks, and measured bone proportions. This record is the continuity anchor. It does not repaint or deform the source artwork.
2. **Complete key drawings.** An artist creates and approves full 2D drawings for the major storytelling poses. Key drawings are complete character artwork, not separated body-part cut-outs.
3. **Motion chart and spatial constraints.** Record timing, action phases, camera/view, center-of-mass travel, arcs, support feet, and secondary-motion notes.
4. **Anatomical construction between keys.** Interpolate joint landmarks with smooth curves. Solve limb chains while preserving measured segment lengths. Lock planted feet to their contact points until release. Detect view changes and require another designed key drawing instead of guessing.
5. **Full redraw for every timepoint.** The geometry output is only a construction guide. It never skins, warps, rotates, or renders the approved image as the final character. The artist redraws the entire character for each required frame, including silhouette, face, hands, hair, clothing folds, overlaps, linework, and colour.
6. **Independent raster delivery.** Store each accepted drawing as its own transparent PNG or lossless WebP asset with a unique ID and content hash. A duplicate image cannot count as another drawing.
7. **Frame review.** Each frame requires explicit identity, anatomy, line-quality, and timing approval. Rejected or unreviewed drawings do not count toward the accepted cadence.

## What is not an accepted final-frame method

- Re-generating a character image for every frame, even with reference conditioning.
- Text-to-video or generic video interpolation.
- A single-image cut-out puppet, mesh warp, skeletal skinning, or deformed source artwork.
- Vector-path tweening or topology interpolation presented as a finished anime drawing.
- Repeated, held, stretched, or merely re-timed copies.
- A construction-guide PNG presented as the final character drawing.

A 3D pose proxy or skeletal diagram may help solve space and timing, but remains invisible reference material. It is never the final artwork.

## Implemented foundation

app/anime-anatomy-engine.mjs provides:

- A versioned Character DNA record whose proportions are measured from an approved reference pose.
- A validated motion plan with complete, artist-approved key drawings.
- Smooth joint-guide interpolation at 24 timepoints per second.
- Two-bone limb constraints, body-centre sampling, and planted-foot anchors.
- A guide-only anatomical construction sheet and Canvas PNG preview.
- Twenty-four independent drawing tasks per second, each requiring a complete artist redraw.
- Independent transparent PNG frame assets rendered directly from the current drawing layers, stored inside each native .zero timeline frame, with SHA-256 image hashes and canonical SVG source signatures.
- Explicit per-frame identity, anatomy, line-quality, and timing review; duplicate-hash rejection; stale-source and image-byte integrity checks; and a cadence audit that counts approved unique drawings only.
- Android-oriented controls for preparing 24 empty timeline frames, registering key drawings by touching the actual artwork, viewing construction guides on the drawing canvas, saving final PNG frames, auditing the complete 24-frame sequence, and exporting a ZIP with frame PNGs, motion plan, manifest, and optional shared background PNG.

The module intentionally does **not** call an image-generation provider, create finished anime frames from geometry, or treat test fixtures as production art.

## One-second walk acceptance test

The first visual proof remains one second at 24 FPS with 24 distinct drawings. Start with three-to-five complete key drawings and a fixed side view. Review the construction guides, redraw each frame independently, and inspect:

- stable face, hair, costume, body proportions, and distinctive design marks;
- readable silhouette and foreshortening;
- correct shoulder, elbow, wrist, hip, knee, ankle, hand, and foot anatomy;
- weight transfer, planted-foot stability, balance, and spacing;
- hand-drawn hair/cloth follow-through and clean overlaps;
- no duplicate frame hashes and no unreviewed frames.

A passing unit test is only a software-contract result. It is not a claim of professional anime quality. The visual result must be inspected in the Android studio and approved by the user.

## Current limitations and next work

- The anatomy engine is implemented as a tested module and the mobile-first Character DNA calibration panel is connected to the Android-oriented editor. It can annotate 19 landmarks over the current drawing and save the validated identity into the native .zero project.
- Key-drawing capture is connected to timeline frames and records an SHA-256 signature of the original drawing. Motion-plan creation and restoration reject changed key drawings.
- Final PNG capture is connected to the native timeline. Each frame can store its unique transparent raster, image hash, source signature, and four review results inside the .zero project. The audit checks current source, PNG byte hash, uniqueness, approval state, and 24-frame coverage before ZIP export.
- The ZIP export contains 24 PNG frames, a motion-plan JSON, a manifest, and (when present) a separate static background PNG. It does not render the geometry guide into the final images.
- No artist-authored 24-frame animation has been produced by this engine yet; the editor now contains the workflow and integrity gates, but they still need to be exercised with the user's actual character.
- The first approved character still needs its joint landmarks reviewed/annotated against a real model sheet.
- The current construction view assumes one fixed camera/view per shot. A new view, strong foreshortening, or occlusion change requires another complete key drawing and possibly a new view-specific Character DNA record.
- Hair, fingers, facial features, cloth folds, and overlap redraw remain artist-authored details; the engine does not invent them.
- Android performance, save/recovery, transparent-raster import, export, and visual quality have not yet passed device testing.

## Hard project constraints

- Android is the primary working device.
- Budget remains $0: no paid provider, GPU rental, subscription, or paid fallback.
- The target remains **24 independently drawn images per second**.
- The approved character/background departments and their source assets remain unchanged.
- No merge to main, production deployment, or paid service is authorized by this implementation.
