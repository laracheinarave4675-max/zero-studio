# ZERO STUDIO — Hybrid character motion experiment

**Status:** Active isolated experiment. No production merge or deployment.

## Objective

Find a practical, free-first way to transfer convincing motion to an existing ZERO STUDIO character reference, then bring the result back into the studio for review and further animation work.

This experiment does not replace the existing character/background generators, Character Bible, native project format, raster drawing engine, or 24-independent-drawings-per-second acceptance target.

## Correct division of work

### 1. Motion transfer — One-to-All Animation

Input:
- one approved ZERO STUDIO character reference image;
- one driving video containing the desired body performance;
- a short action prompt where supported.

Output:
- a generated motion-transfer video and its native-rate frames.

Use this as a **motion and appearance proposal**. Review identity, face, hair, costume, anatomy, contact, and temporal consistency before using it anywhere else.

Official project: https://github.com/ssj9596/One-to-All-Animation  
Project page: https://ssj9596.github.io/one-to-all-animation-project/  
Paper: https://openaccess.thecvf.com/content/CVPR2026/html/Shi_One-to-All_Animation_Alignment-Free_Character_Animation_and_Image_Pose_Transfer_CVPR_2026_paper.html

### 2. Line-art continuity and coloring — AniDoc

Input:
- an existing motion/control video or sketch sequence;
- the approved ZERO STUDIO character design reference.

Output:
- a reference-conditioned colored video.

AniDoc does **not** invent arbitrary motion from one still image. It is a downstream line-art/colorization and temporal-consistency tool, not the motion source.

Official code: https://github.com/robbyant-research/AniDoc  
Public Space: https://huggingface.co/spaces/fffiloni/AniDoc

### 3. ZERO STUDIO — production control

ZERO STUDIO remains responsible for:
- storing the original reference and provenance;
- selecting and reviewing motion/key poses;
- checking identity, costume, anatomy, timing, and continuity;
- preparing editable cleanup and final drawing tasks;
- preserving the 24 independently drawn images-per-second target;
- compositing and delivery.

A generated MP4 must never silently become 24 approved independent final drawings. Native output frame rate and frame count must be recorded honestly. Any later 24-drawing cleanup stage must create and review genuinely distinct artwork.

## Free compute route

One-to-All's upstream README documents a free Kaggle T4 (16 GB) + ComfyUI route for its 1.3B model, with an author-reported example of 10 seconds at 832×480 taking about 11 minutes. This is a reported upstream benchmark, not a guarantee of Kaggle availability or ZERO STUDIO performance.

Official tutorial: https://ncn0ojsozocg.feishu.cn/wiki/J9Ohwmtudin0vtkuyPccIZKhnZz

The user's Hugging Face account is authenticated as a free account. The One-to-All model is not currently deployed by a Hugging Face Inference Provider, so a direct hosted inference API is not available from that model page. Existing ZeroGPU Spaces have strict daily quotas and queues.

## First visual acceptance test

Use one existing approved character reference and one short, clear driving video. Prefer a simple full-body action with:
- a fixed camera;
- the entire performer visible;
- clear foot contact and weight transfer;
- no cuts, occlusions, or multiple people;
- readable face and hands.

Review the generated result frame-by-frame for:
1. recognizable identity and facial structure;
2. hairline, hairstyle, costume, accessories, and palette;
3. anatomy, hands, feet, and silhouette;
4. foot contact, weight transfer, spacing, and follow-through;
5. temporal flicker, shape drift, and background changes;
6. whether the action is useful as a key-pose/motion reference.

A short result that fails identity or anatomy is rejected even if it looks smooth.

## Current execution record — 2026-11-21

- Confirmed that AniDoc's public Space exposes a reference-conditioned colorization tool and explicitly states that motion must come from the supplied control video.
- Attempted one live AniDoc call using the existing ZERO STUDIO gallery reference and the official AniDoc sample control video. Hugging Face rejected the call before inference: 60 seconds were requested while the account had 42 seconds of free ZeroGPU quota remaining. No output video was produced and no inference success is claimed.
- Confirmed that One-to-All 1.3B is not deployed through Hugging Face Inference Providers.
- Confirmed that the official One-to-All repository documents a free Kaggle T4 16 GB + ComfyUI route. The route remains subject to Kaggle's current accelerator availability and quota.
- No paid compute, GPU rental, model download, production deployment, or merge was initiated.

## Guardrails

- Keep this experiment on its own branch and draft PR.
- Never add model weights, user artwork, API tokens, or private gallery assets to Git.
- No paid GPU, paid endpoint, subscription, or automatic paid fallback.
- Do not claim a real animation result until an actual output file exists and has been visually reviewed.
- Do not change production or merge this experiment without explicit approval.
