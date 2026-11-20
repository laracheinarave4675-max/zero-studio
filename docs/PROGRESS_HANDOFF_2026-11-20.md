# ZERO STUDIO — Progress handoff and animation milestone (2026-11-20)

## Verified project state

- Repository: `laracheinarave4675-max/zero-studio`.
- Working branch: `feat/character-reference-conditioning`.
- Audited commit: `cea0045993761d94e5421239d7f777943d1026e0`.
- PR #9 remains a Draft: https://github.com/laracheinarave4675-max/zero-studio/pull/9
- Vercel preview deployment is READY: https://zero-studio-flux2-preview-bj1ojsz5k-studio-37a2.vercel.app
- The isolated FLUX.2 Worker is: https://zero-studio-flux2-preview.9test4675a26.workers.dev
- No merge to the default branch and no production deployment is authorized by this handoff.

## Image-generation and character-reference milestone

The FLUX.2 Klein 4B reference-image request path is implemented across the Android UI, same-origin Vercel API, and Cloudflare Worker. The Worker receives reference images as binary multipart fields `input_image_0` through `input_image_3`; the browser supports up to four references and automatically selects FLUX.2 when a reference is used. The gallery image proxy is same-origin.

A real gallery result was retrieved directly from the Worker and inspected:
- Result ID: `83d6357f-4e5f-4f78-a603-0eb2c61ada6d`
- Original: JPEG, 1280×720, 113,798 bytes.
- Visible content: a full-body, side-profile anime woman with long dark hair, pale kimono with pink shading, and red waist sash on a white background.
- This verifies successful image retrieval and a visually coherent single character design. It does **not** yet prove identity consistency across multiple views or poses.
- Previous highly rated reference result: `7bae987b-038b-44a2-b89d-5ef905719fc7`. Do not assume it is the same character or scene; compare actual pixels before making continuity claims.

The earlier 413 issue was traced to a stale Cloudflare Worker deployment and oversized request handling. The preview Worker was updated with the 3 MB request ceiling, reference-image decoding/multipart forwarding, and clearer 413 diagnostics. A new PWA shell cache version was added to avoid stale Android assets.

## Test results audited on the exact commit

Executed in a clean Node 24 sandbox from the checked-out branch:

```sh
node --test tests/*.test.mjs cloudflare-worker/tests/*.test.mjs
```

Result: **266 tests passed, 0 failed, 0 skipped** (about 9.0 seconds).

The coverage includes:
- Worker authentication/origin restrictions, FLUX.2 16:9 multipart requests, reference-image forwarding and validation, free-quota behavior without paid fallback, gallery storage/listing and health checks.
- Same-origin gallery-image proxy validation.
- Character models, editable parts, views/poses/expressions, rig joints, inverse kinematics, rig interpolation and character-library persistence.
- Drawing engine, SVG path validation, vector layers, raster brush rendering/persistence, raster/vector hybrid manifests, mobile workspace wiring, backgrounds and scene-art modules.
- Animation planning, 24 drawings/second enforcement, batch validation, duplicate-frame rejection, fixed-background moving layers, ordered imports, save/reopen, final partial batches, 30,000-frame ceiling, provider-neutral worker retries/checkpoints, and Gemini adapter request parsing.

GitHub Actions for the same commit also completed successfully:
- Hybrid raster and SVG regression tests — success (run 44789424539).
- Cloud inference worker tests — success (run 44789424402).
- Drawing engine tests — success (run 44789424416).

## Animation: what exists and what remains unproven

Existing implementation:
- 24 FPS / 24 independently authored drawings per second is enforced; this target must not be silently reduced.
- 10 seconds = 240 drawings; default batch size 6 = 40 ordered batches.
- Project structural ceiling: 30,000 frames.
- Each vector batch is validated for job ID, order, indexes/timestamps, stable layer names/order, path safety, and duplicate drawings.
- Progress and continuity notes persist in the `.zero` project.
- A provider-neutral sequential worker supports retries, cancellation and checkpoint callbacks.
- A Gemini animation adapter exists, but the production UI is still on the manual prompt/export/import path; no live provider callback is wired into the animation UI.
- The existing 24-frame proof is a deliberately simple vector mascot. It proves distinct editable frame data and timing, **not** professional anime character motion. Its static body paths are reused while arm/face paths change.
- The existing batch interchange validates SVG paths. The planned hybrid raster/vector frame interchange is not yet implemented; do not claim arbitrary raster animation layers are already supported by the batch importer.
- Physical Android playback/performance testing and an actual production-quality animation proof remain outstanding.

## Next milestone: motion proof, not more decorative features

Use the accepted anime character reference as the visual identity target. Do not substitute the simple Nori mascot proof for this acceptance test.

1. Preserve the approved character reference and establish a concise model sheet/continuity guide before animating.
2. Define one short, observable action with clear timing and contact/weight (initial target: a one-second motion study at 24 drawings/second; 24 separately authored drawings).
3. Specify the shot's stable camera, background, character proportions, hair/clothing silhouette, and named layer order.
4. Decide and implement the frame asset contract needed for this character: editable vector layers, raster layers, or a deliberately mixed frame. Keep source assets and provenance; do not flatten the only editable source.
5. Produce a first small batch, inspect every frame for identity drift, anatomy, spacing, silhouette, foot/contact behavior, hair and clothing follow-through, then approve or reject before scaling.
6. Run automated checks for exact 24 frame timestamps, frame uniqueness, layer identity/order, source integrity, and save/reopen. Then visually inspect playback on Android.
7. Only after a successful one-second proof, scale toward the 10-second / 240-drawing test.

Animation quality criteria: believable timing and spacing, anticipation/action/follow-through where appropriate, weight and balance, consistent anatomy and character identity, clean silhouettes, controlled hair/cloth secondary motion, stable camera and background, and no duplicated/held stills counted as new drawings.

## Hard constraints carried forward

- Android-first control/review; heavy inference runs remotely.
- Total budget remains $0: no paid API, subscriptions, GPU rental, paid hosting, required payment card, or paid fallback.
- Never claim limited free quotas can sustainably produce 24 new detailed drawings every second.
- Do not merge PRs, deploy to production, or alter production settings without explicit user approval.
- Do not claim visual acceptance, identity lock, or successful Android playback without inspecting the relevant frames on the actual evidence.
