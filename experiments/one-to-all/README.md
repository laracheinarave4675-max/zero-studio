# One-to-All motion-transfer experiment

This is an isolated, $0-first feasibility test for applying a driving performance to an approved ZERO STUDIO character reference.

## Why this model

One-to-All is designed for reference-driven character animation and pose transfer, including references whose layout does not match the driving performer. This makes it a better first motion-transfer candidate than AniDoc.

- Official source: https://github.com/ssj9596/One-to-All-Animation
- Project page: https://ssj9596.github.io/one-to-all-animation-project/
- CVPR 2026 paper: https://openaccess.thecvf.com/content/CVPR2026/html/Shi_One-to-All_Animation_Alignment-Free_Character_Animation_and_Image_Pose_Transfer_CVPR_2026_paper.html

## Free runtime

The upstream project documents a free Kaggle notebook route using ComfyUI and a 16 GB NVIDIA T4 for the 1.3B model. The authors report an example of 10 seconds at 832×480 in about 11 minutes. This is an upstream benchmark only; Kaggle GPU availability and free quota vary.

Tutorial: https://ncn0ojsozocg.feishu.cn/wiki/J9Ohwmtudin0vtkuyPccIZKhnZz

Do not substitute the 14B checkpoint on a 16 GB T4.

## Candidate model files discovered on Hugging Face

The ComfyUI model repository currently exposes these relevant files:

| Purpose | Candidate file | Listed size |
|---|---|---:|
| One-to-All 1.3B v2 | `Kijai/WanVideo_comfy/OneToAllAnimation/Wan21-OneToAllAnimation_1_3B_v2_fp16.safetensors` | 4.42 GB |
| T5 text encoder, FP8 | `Kijai/WanVideo_comfy/umt5-xxl-enc-fp8_e4m3fn.safetensors` | 6.73 GB |
| Wan 2.1 VAE | `Kijai/WanVideo_comfy/Wan2_1_VAE_bf16.safetensors` | 254 MB |

These are candidate files, not a verified complete Kaggle package. The exact workflow, auxiliary pose/detection models, disk usage, and model/license terms must be checked in the runtime before downloading. The 1.3B model checkpoint is distinct from the 14B model and is the only candidate in scope for the free T4 test.

## Inputs

- `character_reference.png`: one approved ZERO STUDIO gallery character reference. Keep it out of GitHub.
- `driving_motion.mp4`: a short, full-body, single-performer motion clip with a fixed camera. The driving performer supplies motion only; their identity must not replace the approved character.

For the first test, choose a simple walk or turn rather than a complex fight or dance.

## Required output package

Save the output outside the Git repository as:

- `motion_transfer.mp4`
- `frames/frame_000000.png` … one PNG for each actual generated frame
- `motion_manifest.json` containing model/checkpoint, source reference ID (not the image bytes), driving-video provenance, native FPS, width, height, frame count, generation settings, and SHA-256 hashes
- `contact_sheet.png` for rapid visual review

Do not upsample or duplicate frames to claim 24 unique drawings per second. Record the model's native output FPS. The generated sequence is a motion/key-pose proposal until it passes review and any required independent cleanup.

## Acceptance

Reject the result if the face, hairstyle, costume, palette, body proportions, hands, or feet drift materially; if foot contact and weight transfer are unreadable; or if the motion flickers or breaks temporally.

A passing inference is not the same as a passing visual review. A passing visual review is not the same as final 24-drawing-per-second animation.

## Current blocker

The connected Hugging Face account had only 42 seconds of free ZeroGPU quota remaining when the AniDoc test was attempted, while the Space requested 60 seconds. One-to-All is not deployed through Hugging Face Inference Providers. The practical next route is the upstream Kaggle T4 notebook, subject to free accelerator availability. No model weights have been downloaded and no GPU inference has been run from this repository.

## Package the generated result for review

After the ComfyUI workflow produces its MP4, extract every decoded source frame without changing its native frame rate:

```bash
python experiments/one-to-all/package_motion_reference.py \\
  --input /path/to/motion_transfer.mp4 \\
  --output /path/to/zero-studio-motion-reference \\
  --reference-asset-id YOUR_ZERO_STUDIO_GALLERY_ASSET_ID \\
  --driving-video-id driving-clip-01
```

The script creates:
- `frames/frame_000000.png` … one PNG for every actual decoded source frame;
- `contact_sheet.png` with frame numbers and native timestamps;
- `motion_manifest.json` with native FPS, dimensions, duration, source IDs, model/checkpoint, and SHA-256 hashes;
- `motion-reference-frames.zip` containing the manifest, contact sheet, and frame PNGs.

It deliberately does not interpolate, duplicate, or convert FPS, and labels the package as a motion reference rather than final artwork. The generated MP4 remains separately available at its original path.

Dependencies, if missing in the notebook runtime: `pip install -r experiments/one-to-all/requirements.txt`.
