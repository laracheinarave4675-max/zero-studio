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
- Independent transparent raster asset records, duplicate-hash rejection, explicit review states, and a cadence audit that counts approved unique drawings only.

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
- Key-drawing capture, shot-plan management, task selection, and final raster frame assembly are not yet connected to the editor.
- No artist-authored 24-frame animation has been produced by this engine yet.
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
