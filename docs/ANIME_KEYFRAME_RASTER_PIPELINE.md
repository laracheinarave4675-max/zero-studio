# ZERO STUDIO — Anime Keyframe Raster Pipeline

## Approved direction (2026-11-20)

This branch replaces the failed SVG-path character-motion proof as the active animation research path. It does not replace or rewrite the existing character/background generation engines.

The goal is polished anime-style motion, not puppet-like movement, not a rigged cutout, not an SVG-path drawing exercise, and not AI-generated video.

## Production model

1. **Keep the approved character artwork intact.** The existing FLUX.2 image-generation and reference-conditioning pipeline remains the source of the character design and backgrounds.
2. **Plan motion before rendering.** Define action beats, timing, arcs, spacing, weight shifts, foot contacts, anticipation, follow-through, and holds in a deterministic motion sheet.
3. **Create complete raster key drawings.** Use the approved character image as the identity/style anchor and generate separate full-character key drawings for carefully selected poses. Every key drawing is a complete image, not a collection of animated body-part cutouts. Pose guides may constrain silhouette and limb placement, but may not replace the character artwork.
4. **Create raster inbetweens from adjacent keys.** Evaluate anime-oriented interpolation approaches (motion/trajectory guidance plus image-space correspondence and line-aware correction). Do not use a general text-to-video model to invent the shot. Interpolation must be tested for line stability, face/hair/clothing consistency, limb topology, and temporal flicker.
5. **Preserve all drawings as independent frames.** Store every accepted key and inbetween as an individual lossless raster image in the project. Playback at 24 FPS must be backed by the actual frame count, not duplicated exposures.
6. **Quality gates before acceptance.** Reject frames with identity drift, face changes, broken anatomy, missing clothing details, ghosting, line melting, foot sliding, or timing that feels weightless. Never call a result production-quality solely because it contains 24 files.

## First proof: one-second walk cycle

- Source: the previously approved FLUX.2 character artwork from the ZERO STUDIO gallery (the character image praised by the user as the strongest result).
- Duration: 1 second.
- Playback: 24 FPS.
- Motion: a restrained side-view walk with a clear contact pose, down/compression, passing pose, and up/recovery; include foot plant, center-of-mass shift, counter-swing, and delayed hair/cloth follow-through.
- Key drawings: begin with four full-body raster keys at the major poses. Review identity and silhouette before producing any inbetweens.
- Inbetweens: generate only after the four keys pass review. Compare an anime-aware trajectory/optical-flow approach with a line-preserving raster interpolation baseline. Do not substitute simple crossfades or rigid-part transforms.
- Deliverable: 24 distinct raster frames, contact sheet, 24-FPS preview, and a report with per-frame identity/line/anatomy/timing checks.

## Explicit exclusions

- No SVG path-based frame generation as the animation engine.
- No puppet/cutout animation or deforming a single still image to fake a walk.
- No text-to-video model generating the entire movement.
- No reduction of the 24-FPS / 24-distinct-drawings acceptance target.
- No changes to the existing character/background generation engine.
- No merge to main or production deployment without explicit user approval.

## Research basis and risks

Anime-specific interpolation research (including trajectory-guided anime synthesis) suggests a useful two-stage design: explicit motion trajectories and sparse correspondence first, followed by frame refinement. Anime inbetweening research also demonstrates raster-keyframe workflows, but current methods can still alter linework or invent details. Therefore the first proof must be visually reviewed and may fail its quality gate; frame count alone is not success.

## Status

Architecture decision recorded and isolated on `feat/anime-keyframe-raster-pipeline`. No new key drawings or inbetween frames have been accepted yet. The next implementation step is a motion-sheet/key-pose proof using the approved character reference, followed by raster interpolation experiments.
