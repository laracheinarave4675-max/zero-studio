# Referenced anime character motion proof

## Goal

Test whether the approved FLUX.2 character design can be translated into an actual short, editable, frame-by-frame motion study while preserving its visible identity. This is a proof stage, not a claim of production-quality animation.

## Input reference

- Gallery image: `83d6357f-4e5f-4f78-a603-0eb2c61ada6d`
- Source: isolated FLUX.2 preview Worker gallery.
- The image is retrieved directly by the workflow and passed to Gemini as multimodal image input.
- The image is a design reference only. It must never be inserted as an animation frame or transformed as a substitute for drawing.

## Motion brief

One second at 24 drawings per second, full-body side profile facing left:
- Frames 0–5: anticipation and weight transfer.
- Frames 6–11: leading foot lifts and swings forward; torso counterbalances; sleeve begins follow-through.
- Frames 12–17: leading foot reaches and contacts the ground.
- Frames 18–23: weight settles, trailing foot follows, long hair and kimono fabric settle.

The camera is fixed. The full character remains visible at a stable scale. The plain white background is stored separately as a static editable project layer.

## Technical implementation

- `app/gemini-animation.mjs` accepts an optional validated JPEG/PNG/WebP reference image and sends it as Gemini multimodal `inline_data`.
- `scripts/run-character-motion-proof.mjs` retrieves the gallery reference, creates or restores a validated 1-second / 24-frame project, and requests only the remaining ordered batches of six drawings.
- Each accepted batch is validated and atomically checkpointed into the native `.zero` project.
- A later workflow run can restore that exact `.zero` checkpoint, validate its frame count and batch index, then continue at the next uncompleted batch without regenerating accepted frames.
- Individual SVG frame exports and the project are uploaded as a GitHub Actions artifact.
- The workflow is isolated to branch `feat/anime-character-motion-proof`; it does not deploy the application.

## Acceptance criteria

1. Exactly 24 frames at 24 FPS, with timestamps 0/24 through 23/24.
2. All frames are distinct editable SVG drawings; no reused stills or raster transforms.
3. Stable layer names and order across all batches.
4. Consistent face profile, hairstyle, kimono, red obi, proportions, and screen direction.
5. Believable step timing, weight transfer, foot contact, balance, and hair/cloth follow-through.
6. Full body remains in frame; camera and background remain fixed.
7. The native project saves and reopens with all frames and continuity metadata.
8. Human visual review of every frame and playback is required before approval.

## Current validation status

- The complete local regression suite passes **268/268** tests, including two new tests for multimodal reference attachment and malformed reference rejection.
- The workflow and runner have been added to the isolated motion branch.
- The retry and recovery path is covered by automated tests for transient HTTP 503 responses, exponential backoff, `Retry-After`, and restoring a validated six-frame checkpoint.
- **The live model-generated frames have not yet been reviewed or accepted.** Automated structural validation cannot establish artistic quality or true motion readability.
- If the free Gemini quota is exhausted, stop and report it. Do not switch to a paid model or service.

## Tracking

- Branch: `feat/anime-character-motion-proof`
- Draft PR: https://github.com/laracheinarave4675-max/zero-studio/pull/10
- Parent character-reference work remains in Draft PR #9.
- No production merge or deployment.

## Safe execution and visual review

- A normal push to this feature branch runs syntax checks and the complete automated test suite only. It does not call Gemini.
- Live generation requires all three conditions: (1) a repository Actions variable named `ZERO_STUDIO_FREE_TIER_CONFIRMED` set to the exact text `true`; (2) the commit message contains `[RUN_FREE_TIER_MOTION_PROOF]`; and (3) the repository Actions secret `GEMINI_API_KEY` is configured. The variable is a deliberate guard, not proof of Google billing status.
- Set the variable in GitHub repository Settings → Secrets and variables → Actions → Variables. Keep the API key in Secrets, never in a file or chat. Set the guard only after verifying that the key belongs to a no-cost/free-tier project with paid billing disabled. This repository cannot inspect or guarantee the billing state of the Google AI account.
- The model is pinned to `gemini-3.5-flash-lite`. There is no paid fallback or automatic model switch. Temporary Gemini 5xx overload/network errors are retried up to four times after the first attempt using bounded exponential backoff (5s, 10s, 20s, 40s, up to 60s) and a longer provider `Retry-After` hint when supplied. Hard quota errors are not retried unless Gemini explicitly provides a retry delay. If the free quota is unavailable, stop; do not enable billing or switch providers.
- The workflow artifact contains `index.html`: a 24 fps playback page and a 24-frame contact sheet. Open it locally after extracting the artifact to inspect the whole sequence and select individual drawings. The `.zero` project and each source SVG frame remain alongside the preview.


## Live run authorization

The project owner explicitly authorized the one-second / 24-frame free-tier-only motion proof on 2026-11-20 and confirmed that the GitHub Actions `GEMINI_API_KEY` secret is configured, Google billing is disabled, and `ZERO_STUDIO_FREE_TIER_CONFIRMED=true`. This commit intentionally touches a workflow-watched path to trigger the gated run. The workflow must still pass its regression job before live generation starts.
