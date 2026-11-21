# AniDoc integration experiment (isolated)

This experiment evaluates the official AniDoc inference project without coupling it to the ZERO STUDIO runtime.

## What AniDoc does

AniDoc takes a colored control video and a character design reference image. It extracts sketch/control information from the video and uses the reference to colorize the sequence consistently. The released inference path currently expects 14 frames by default. It is not a single-image-to-arbitrary-motion generator.

Official implementation: https://github.com/robbyant-research/AniDoc  
Official demo: https://yihao-meng.github.io/AniDoc_demo/

## Hardware constraint

The official project reports inference tested on an RTX 5000 (32 GB VRAM) and approximately 14 GB VRAM required. Training used 8 A100 GPUs. Standard GitHub-hosted runners do not provide a GPU; their free standard Linux runner is CPU-only (4 vCPU / 16 GB RAM for public repositories). GitHub GPU larger runners are a paid Team/Enterprise feature.

Therefore this branch deliberately does not pretend that a normal GitHub Actions run can execute AniDoc inference. Its workflow performs a safe environment preflight and reports whether a usable NVIDIA GPU and the required checkpoints are present. It does not download multi-gigabyte weights or run a paid fallback.

## Current workflow

1. Open Actions → AniDoc environment preflight → Run workflow.
2. The job checks Python, NVIDIA/CUDA visibility, available GPU memory, and optional checkpoint paths.
3. On a standard GitHub-hosted runner, expect the report to say BLOCKED — no NVIDIA GPU. That is an expected diagnostic result, not a successful animation test.
4. No model weights are stored in this repository, and no source image or character artwork is uploaded by this workflow.

## Required model files for a future real inference run

Follow the official AniDoc README and obtain the checkpoints from the links it specifies:
- Stable Video Diffusion XT under pretrained_weights/stable-video-diffusion-img2vid-xt
- AniDoc model under pretrained_weights/anidoc
- CoTracker checkpoint at pretrained_weights/cotracker2.pth

Do not commit these large model files to Git. Before running inference, verify the model licenses and the current upstream installation instructions. The upstream project recommends Linux and Python 3.8.

## Acceptance gate

A real test is only accepted when all of the following are recorded:
- actual GPU model and VRAM (at least the upstream-reported ~14 GB);
- all required checkpoints found;
- 14-frame control input and the approved character design reference;
- successful inference output saved as an artifact;
- visual review of all output frames for identity drift, anatomy, costume continuity, and temporal artifacts.

A passing preflight is not an animation result. Nothing in this experiment changes production or merges into the studio branch.
