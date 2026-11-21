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

## Free-GPU route to investigate (not yet an inference result)

The first practical candidate is a Kaggle Notebook with the T4x2 accelerator. Kaggle's November 2026 staff announcement says each T4x2 has two 16 GB GPUs and that it remains the accelerator after the P100 retirement. Free accelerator capacity can be queued and the available weekly quota is floating, so the account must be checked at run time. Importantly, the upstream AniDoc launcher sets `CUDA_VISIBLE_DEVICES=0`; it will use one 16 GB card unless the launcher is deliberately changed and multi-GPU behavior is validated. The reported ~14 GB requirement leaves little headroom on a 16 GB card.

A free Google Colab notebook is a fallback only: Google states that free GPU availability and usage limits are dynamic and not guaranteed.

Storage is another gating item. The linked Hugging Face repositories currently list approximately 32.6 GB for Stable Video Diffusion XT, 8.83 GB for AniDoc, and 204 MB for CoTracker. These repository totals can include alternate precision variants; the exact minimal files required by the upstream loader must be confirmed before downloading. Kaggle documents a 20 GB auto-saved working disk plus separate session scratch space, so a full unfiltered snapshot should not be downloaded blindly.

No Kaggle or Colab inference has been run from this repository. The next accepted milestone is a user-authorized Kaggle/Colab session that confirms GPU model, free VRAM, disk capacity, Python compatibility, and required checkpoint files before any model download or inference.

## First user-side check: Kaggle GPU only (safe, no downloads)

A no-download notebook is included at [`kaggle_gpu_preflight.ipynb`](./kaggle_gpu_preflight.ipynb). Download/import it into Kaggle, select Settings → Accelerator → GPU (T4x2) if that option is available, and run the single code cell. It reports the visible GPU(s), per-device VRAM, Python/PyTorch/CUDA versions, and free disk space. It does not install anything or access model checkpoints. Return the printed JSON before proceeding to model setup.

Do not assume that two 16 GB GPUs combine into one 32 GB memory pool. The existing AniDoc launcher selects GPU 0. We should proceed to a weight download only if one GPU is visible with adequate free memory and the available disk can accommodate the verified minimal FP16 checkpoint set.

## Fastest live test: public AniDoc ZeroGPU demo

Before spending time on Kaggle setup, use the maintained public demo at https://huggingface.co/spaces/fffiloni/AniDoc. It is currently marked **Running on Zero** and accepts exactly two inputs: a control-sequence MP4 (the source of motion) and a reference character image (the source of appearance/identity). It has built-in example pairs, so a smoke test can be run without preparing a video. For the ZERO STUDIO character test, choose one of the built-in motion examples and upload the existing character reference image. The Space's author states it is compatible with ZeroGPU.

This route is preferable for the first visual experiment because it avoids installing AniDoc and downloading its checkpoints into Kaggle. Hugging Face documents free access to existing ZeroGPU Spaces, with a daily free-account quota (currently 5 GPU minutes; unauthenticated access is lower). Queueing and runtime limits still apply. This is a quick visual feasibility test, not a production integration or proof of 24 independent drawings per second.

If the public demo is busy or its free quota is exhausted, use the no-download Kaggle preflight notebook above as the fallback route.
