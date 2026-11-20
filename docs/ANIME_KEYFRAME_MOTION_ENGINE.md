# ZERO STUDIO — Anime Key-Drawings and Raster In-Between Engine

Status: **Approved architecture; first planning/data-contract foundation implemented. Visual animation quality is not yet proven.**

This document is the current motion direction after the vector/SVG motion proof. It extends D-026; the existing character-generation and background-generation departments remain intact.

## 1. What stays unchanged

- The existing specialist image-generation department continues to create approved character designs, model sheets, expressions, backgrounds, and props.
- The existing Character Bible, approved reference assets, FLUX.2 reference-conditioning adapter, gallery, scene preparation, layer system, and raster surface remain available.
- Backgrounds are reused as independent approved shot assets when the camera and layout are fixed.
- The delivery target remains **24 distinct moving-art raster drawings per second**. Playing 12 drawings twice at 24 FPS does not pass.
- Native SVG, vector drawing, Nori's starter rig, and the earlier SVG-motion proof remain in the repository for compatibility and historical comparison. They are not the new character-animation output path.

## 2. What is explicitly rejected as the final animation method

1. No generic text-to-video result is accepted as a finished shot.
2. No single character image is split into a cut-out puppet and rotated/warped as the final motion.
3. No skeleton, mesh, or 2D rig deformation is rendered as the final character artwork. A rig may be used only as an invisible motion/layout reference.
4. No SVG-path generation, path-count targets, or topology-matched SVG interpolation is used as a substitute for anime drawings.
5. No copied/held/stretched raster frame counts as a new drawing.
6. The old `feat/anime-character-motion-proof` SVG batch workflow is archived as a failed visual experiment. Its 24-frame structural output did not meet character-design consistency or anime drawing quality; it is not an approved motion result.

## 3. New pipeline: anime production drawings

### A. Motion direction and timing chart

For each shot, a motion director describes the action as readable phases: anticipation, action, contact, passing, recovery, and settle. The plan records:

- screen direction, camera and shot boundaries;
- key-pose timestamps and each pose's dramatic/physical purpose;
- weight-bearing foot, planted/swinging foot, balance, body arcs and spacing;
- head, torso, limbs, gaze and silhouette intent;
- secondary-motion notes for hair, sleeves, cloth and accessories;
- character Bible and approved visual-reference asset IDs;
- the approved static background asset ID.

This chart defines what must happen and when. It is not the finished animation.

### B. Spatial pose blocking — guide only

A lightweight 3D skeleton/pose proxy may block body orientation, perspective, depth, foot contact, limb lengths, arcs and camera. The guide exists to solve spatial continuity and provide pose reference images to the drawing stage.

**The pose proxy must never deform, skin, rotate, warp, or render the approved character artwork as the final frame.** It is disposable reference material, not a puppet animation.

### C. Key Drawing department

The key-drawing stage creates complete 2D anime drawings at selected storytelling poses. Each drawing request uses:

- the approved character image and Character Bible/model sheet;
- relevant front/side/three-quarter/back and costume references;
- the pose-guide image for that exact frame;
- the shot's prior approved key drawing for identity/line/style continuity;
- an explicit drawing brief for expression, silhouette, foreshortening, cloth and overlap.

The existing still-image generation department may be used for these individual still drawings, not for a video clip. Reference conditioning is a capability, not a guarantee: every new pose must pass an identity and art-quality review before it becomes an approved key drawing.

### D. In-between and cleanup department

The in-between stage receives two approved neighboring key drawings, the timing chart, and the pose guide for the exact target timestamp. It must return a **standalone full raster drawing for that timestamp**, not a video deliverable and not an image warp.

Potential techniques are candidates to benchmark, not selected production dependencies:
- a dedicated cartoon keyframe-interpolation model with sparse sketch/pose guidance;
- a frame-specific reference-conditioned still-image pass driven by the pose guide;
- a hybrid cleanup pass that repairs line/shape/colour consistency after the in-between proposal.

No technique is selected until it passes the same side-by-side identity, anatomy, line-quality, timing, and motion-readability review on the project's real character.

### E. Raster frame assembly and review

Each accepted frame is stored as an independent PNG or lossless WebP drawing with its own asset ID and content hash. The compositor places the drawing over the separately approved background. It does not modify the source character image to fabricate movement.

The review screen must show a contact sheet, frame-by-frame playback, key-pose markers, missing-frame warnings, and per-frame approve/reject/regenerate states. Every approved frame retains the reference asset IDs, pose-guide ID, model/adapter version, generation parameters, and review state.
 
### F. Transparent character cutout — non-generative segmentation
 
The current still-image department typically returns a full rectangular image. To place an independently drawn character frame over the already-approved background, the frame must have a real alpha channel; a white matte, checkerboard simulation, or opaque background is not sufficient.

A protected Worker endpoint now has an **experimental** Cloudflare Images foreground-segmentation adapter:
- Input: the ID of a previously saved, approved gallery still (never an arbitrary URL).
- Cloudflare Images applies `segment: "foreground"` with its BiRefNet segmentation model and requests a PNG result.
- Output is verified as PNG and returned through a same-origin Vercel proxy; the Cloudflare bearer token remains server-side.
- The segmentation is a mask/cutout operation, not a new drawing or video generator. The original still remains unchanged in the gallery.
- Each cutout is still a draft: fine hair, sleeve gaps, motion blur, translucent edges and detached accessories must be visually checked; bad mattes are rejected rather than composited into the shot.

**Explicit no-cost confirmation is mandatory:** the Worker refuses to run any transformation unless `ANIME_SEGMENTATION_FREE_TIER_CONFIRMED=true` is configured for the staging Worker. It is intentionally unset by default. Do not set it until the account's Images Free plan and billing mode have been checked.

**Free-tier guard:** Cloudflare documents an Images Free allowance of 5,000 unique transformations/month. After the limit, new transforms return an error and are not charged; this code stops and reports the limit, with no paid background-removal fallback. At one transformation for every distinct frame, 5,000 cutouts cover about 208 seconds (3 minutes 28 seconds) of 24-drawing-per-second material per month before regeneration/review retries. Treat this as a bounded proof budget, not unlimited episode capacity.

Current code:
- `cloudflare-worker/src/index.js`: authenticated `POST /v1/anime/segment`.
- `app/api/anime-segment.js`: same-origin proxy, no client-side token.
- Tests cover access controls, source validation, PNG response, and free-tier stop behavior.

The adapter is **unit-tested only**. It has not been deployed or run against a live Cloudflare Images transformation yet. Free-tier availability, account-level enablement, transparent edge quality on actual anime frames, and the complete end-to-end mobile flow still require a separate staging proof.


## 4. Current model research and constraints

### FLUX.2 reference conditioning

Cloudflare documents multi-reference support for FLUX.2 Klein 4B: up to four reference images, with the input images smaller than 512×512. This is useful for feeding character identity sheets and a pose-guide reference into the existing still-image department. It does **not** prove exact skeleton/pose control or identity preservation across an entire animation; that requires a controlled visual test.

Reference: https://developers.cloudflare.com/changelog/product/workers-ai/2/

### ToonCrafter

ToonCrafter is a research candidate because it targets cartoon keyframe interpolation and supports sparse sketch guidance. Its published repository reports support for clips up to 16 frames at 512×320 and an inference footprint around 24–27 GB VRAM in the authors' reported setup (with some community memory optimizations). There is no approved, verified, always-available $0 endpoint in this project.

Therefore ToonCrafter is **not integrated or selected**. Do not promise it can run in Cloudflare Workers AI, on the user's Android phone, or within a stable free quota. It may be benchmarked later on a verified permitted compute environment.

References:
- https://github.com/Doubiiu/ToonCrafter
- https://research.cuhk.edu.hk/en/publications/tooncrafter-generative-cartoon-interpolation/

## 5. Acceptance gates

A one-second walk test is accepted only when all conditions pass:

1. Exactly 24 timepoints at 24 FPS, with 24 distinct approved raster drawings.
2. The character remains recognizable: face/profile, hairstyle, costume, proportions, colour design and distinctive details survive every key and in-between drawing.
3. Full-body anatomy and silhouette are coherent; feet contact the ground correctly; weight shifts visibly; balance and spacing are believable.
4. Hair, sleeves and cloth have intentional follow-through rather than random deformation.
5. The camera and static background remain unchanged unless a planned camera/background change is explicitly approved.
6. No final frame is a puppet transform, held copy, vector tween, or extracted generic video frame.
7. Every frame can be reviewed, replaced, and exported as its own raster asset.
8. Playback reads as anime character animation, not a slideshow of inconsistent illustrations or a cut-out puppet.

A passed unit test, 24 frame records, or an uploaded artifact is not artistic acceptance. The user must see and approve the rendered drawings and playback.

## 6. First implementation milestone

The first code milestone is deliberately provider-neutral:
- typed motion plan and ordered key-pose records;
- normalized pose-guide data for spatial blocking only;
- a 24 FPS drawing schedule that marks key drawings and in-between drawings;
- per-timepoint independent raster asset records with content hashes;
- a strict cadence audit rejecting duplicate raster drawings;
- materialization of approved PNG/WebP drawings into the existing ZERO STUDIO native Raster frame-layer structure;
- no pixel tween, vector-path output, puppet deformation, video output, or model provider selected yet.

Next: connect this contract to the existing character-reference and raster compositor, prepare a real three-to-five-key-pose walk study using the existing approved character, and benchmark the least expensive viable key/in-between technique before scaling to all 24 drawings.

## 7. Branch and change-control

- Development branch: `feat/anime-raster-keyframe-motion-engine`
- Base: `feat/anime-character-motion-proof` (existing art-generation and character-reference work preserved).
- No merge, production deployment, paid service, GPU rental, or provider fallback is authorized by this architecture decision.
