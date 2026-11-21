# One-to-All / AniDoc feasibility results

Date: 2026-11-21

## Hugging Face account and Space

- Connected account: free Hugging Face user account.
- Public Space inspected: `fffiloni/AniDoc`.
- Space tool: `AniDoc_colorize_sketch_sequence`.
- Inputs: control MP4 URL + reference character image URL.
- Space documentation confirms that the control video supplies motion; the Space does not create new motion from a still image.
- One real invocation was attempted with the ZERO STUDIO gallery character reference and the official AniDoc sample control clip.
- Result: rejected before inference by the ZeroGPU quota gate. The Space requested 60 seconds; the account had 42 seconds remaining. No MP4 was returned. No GPU inference was completed.

## One-to-All model availability

- Official One-to-All code and 1.3B / 14B model variants are public.
- The One-to-All model page reports no Hugging Face Inference Provider deployment.
- The upstream README documents a free Kaggle 16 GB T4 + ComfyUI route for the 1.3B model.
- Candidate 1.3B v2 checkpoint and FP8 T5/VAE files were identified; the complete runtime package has not been downloaded or tested.

## Current result

**No character motion video has been generated yet.** The model choice and free execution route are better grounded, but the visual test is still pending.

Next gate: run the upstream 1.3B ComfyUI workflow on a free Kaggle T4, using one approved ZERO STUDIO character reference and one clean driving clip. If Kaggle does not offer a free GPU, stop; do not rent a GPU or switch to paid inference.
