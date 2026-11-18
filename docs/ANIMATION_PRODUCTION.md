# ZERO STUDIO — High-volume frame-by-frame production

## Purpose

This module is the provider-independent production contract for genuine frame-by-frame animation. It separates the scene brief, production plan, individual vector drawings, and batch import from any particular AI service. No generated raster image, video, image tween, or reused still is accepted as a substitute for the drawings.

The target remains **24 independently drawn full-scene vector frames per second**:
- 10 seconds = 240 independent drawings.
- 1 minute = 1,440 independent drawings.
- 20 minutes = 28,800 independent drawings.

## Current engine capacity

- Project ceiling: 30,000 frames (20 minutes, 50 seconds at 24 FPS).
- Timeline thumbnails: 24 frames per visible page, with previous/next page and direct frame-number navigation. The interface never creates thumbnails for all 30,000 frames at once.
- Each generated frame batch is validated before any frame is added.
- Default batch size: 6 frames; selectable sizes: 1, 2, 3, 4, 6, 8, 12, or 24.
- Maximum imported frame drawing: 12 named layers and 300 vector paths per frame; each individual layer may hold up to 100 paths.
- Batch order, job identity, frame indexes, timestamps, stable layer names/order, SVG path syntax, and frame uniqueness are validated.
- Production progress and compact frame signatures are stored inside the .zero project so work can resume after saving and reopening.

The 30,000-frame number is a structural ceiling, not a promise that every phone can hold 30,000 highly detailed drawings in memory. Real capacity depends on path count, path complexity, browser memory, available storage, and export size. The current project format still loads the frame array into memory. Physical Android performance testing and paged IndexedDB storage remain future work.

## Workflow

1. Enter a scene brief in the scene description field.
2. Set the duration. The default is 10 seconds.
3. Prepare the animation plan. For 10 seconds at 24 drawings/second, the plan contains 240 frames.
4. The default six-frame batches create 40 ordered batches. The app can export the exact instructions for the next batch.
5. A compatible drawing provider or drawing worker must return the batch as a .zbatch JSON file of editable SVG paths.
6. Import that file. Only a batch with the correct job ID, next batch number, exact frame count, exact global frame indexes/timestamps, consistent layer names/order, valid paths, and no duplicate full-frame drawing is accepted.
7. Save the .zero project to preserve the approved frames and progress; continue with the next batch.

The plan/prompt and batch contract are available before choosing a provider. The provider-neutral worker is implemented in app/animation-worker.mjs. It accepts a provider callback, requests ordered batches, validates and commits each batch, supports bounded retries and cancellation, and invokes a checkpoint callback after each accepted batch. No live provider callback is connected yet, and the app UI still offers the manual prompt/import path. Exporting batch instructions is not itself a claim that any drawings have been generated.

## .zbatch structure

A batch is UTF-8 JSON with this shape (paths shortened for illustration):

\`\`\`json
{
  "version": 1,
  "jobId": "the-active-animation-job-id",
  "batchIndex": 0,
  "startFrame": 0,
  "continuityNote": "Keep the street layout, camera, car identities and travel directions consistent in the next batch.",
  "frames": [
    {
      "index": 0,
      "timeSeconds": 0,
      "layers": [
        {
          "name": "Background",
          "operations": [
            {
              "d": "M 0 0 L 1920 0 L 1920 1080 Z",
              "stroke": "#172033",
              "width": 2,
              "fill": "none"
            }
          ]
        },
        {
          "name": "Cars",
          "operations": [
            {
              "d": "M 200 700 L 400 700 L 380 780 Z",
              "stroke": "#172033",
              "width": 5,
              "fill": "#cc3333"
            }
          ]
        }
      ]
    }
  ]
}
\`\`\`

For each frame, index is the zero-based global frame number and timeSeconds is index / 24. Every frame contains the entire scene, not only a moving-object delta. Layer names and back-to-front order remain identical throughout a job. Each batch must return a short continuity note which is saved and injected into the next batch prompt. Frame artwork must be distinct; repeated holds are rejected. Accepted operations become ordinary editable project layers and paths.

## Safety and current limitations

- All imported paths pass the engine's local SVG path validation.
- The batch must arrive in sequence. Repeated, missing, out-of-order, wrong-job, oversized, malformed, or duplicate frame batches are rejected before commit.
- The application currently allows opening .zero files up to 128 MiB. This does not guarantee that a project close to that size will run smoothly on every Android phone.
- On projects above 600 frames, undo/redo keeps up to 40 frame-scoped actions and stores the affected frame plus animation-progress metadata instead of serializing the complete timeline for every pencil stroke. Project-wide metadata edits are not yet handled by this lightweight history mode.
- Existing ZIP32 export remains subject to ZIP32's 4 GiB archive limit and device memory.
- The worker contract is exercised with deterministic test providers. No real remote provider has been connected or tested for this batch contract yet. No artistic quality claim is made from contract tests alone.

## Automated coverage

tests/animation-production.test.mjs covers 10-second planning, 24 drawings/second enforcement, batch prompts, exact frame timing, stable layers, duplicate rejection, path validation, ordered imports, persistence through .zero normalization, final partial batches, and the 30,000-frame ceiling.


## Provider-neutral worker contract

`runAnimationProduction(project, provider, options)` in `app/animation-worker.mjs` accepts an asynchronous provider function. For each requested batch it supplies:

- `prompt`: the complete next-batch vector drawing instructions, including frame indexes, timestamps and previous continuity note.
- `jobId`, `batchIndex`, `startFrame`, `frameCount`, and `fps`: the exact production coordinates.
- `responseFormat: "json"`, `attempt`, and optional `signal`.

The provider returns either a JSON string or an object with a `text` property containing the .zbatch JSON. The worker validates and appends each approved batch, performs bounded retry after invalid output, supports cancellation, and calls `onBatch` after each successful commit so an integration can save a checkpoint. If checkpoint saving fails, it reports that the batch was already accepted and does not call the provider again for the same batch.

This is an adapter seam, not a live model integration. API keys, provider-specific response parsing, rate limits, billing, and model choice remain deliberately outside the engine until the user chooses a service.
