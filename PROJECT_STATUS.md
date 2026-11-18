# ZERO STUDIO — Project Status

Last updated: 2026-11-18 (UTC)

## Mission

Build a practical, mobile-first anime production studio, usable from an Android phone and free or nearly free, with a coordinated workflow for story, character design, backgrounds, animation, cleanup, coloring, sound, editing, and quality review.

The long-term vision includes specialized AI-assisted departments/agents coordinated by a central production brain. These departments are workflow roles, not a claim that dozens of autonomous models are already running.

## Hard requirements

1. **No generative image/video models for artwork.** Do not use image generators to create final characters, scenes, backgrounds, or animation frames. The intended drawing path is explicit vector/SVG paths, brush strokes, or other editable drawing operations executed by the drawing engine.
2. **24 independent drawings per second is the stated creative target.** Distinguish this from 24 FPS playback. At 24 unique drawings/second, production requires 1,440 drawings/minute and 28,800 drawings for a 20-minute episode. Do not silently downgrade this target. Feasibility and quality must be evaluated through small prototypes.
3. Android phone is the user's working device. Keep workflows touch-friendly and avoid requiring a PC.
4. Free-first. Do not assume paid compute, subscriptions, API billing, or a dedicated GPU.
5. Be transparent about what is implemented, tested, untested, or merely planned.
6. Preserve project history and decisions here. At the start of each continuation, review this file and DECISIONS.md before proposing changes.

## User and workflow context

- The user communicates in Arabic; default to Arabic explanations.
- The user wants the assistant to work directly in this GitHub repository wherever the connected tools allow it, minimizing manual file operations by the user.
- The repository is private: laracheinarave4675-max/zero-studio.
- Avoid asking the user to copy/paste code or move files unless there is no supported alternative.

## Previous prototype (outside this repository)

A prototype named **ZERO STUDIO v0.1** was created in a previous session under:
- /mnt/data/zero-studio-v0.1/
- /mnt/data/zero-studio-v0.1.zip

Reported contents:
- Arabic RTL mobile web interface.
- SVG drawing board at 1920×1080.
- Touch/stylus vector paths.
- Frame add/duplicate/delete operations.
- 24 FPS preview.
- Save/open .zero project files.
- ZIP export containing per-frame SVG, project data, and manifest.
- PWA service worker.
- Optional experimental text-to-SVG JSON connector for Gemini 2.5 Flash Lite; not tested with a real user API key.

Validation previously reported:
- JavaScript syntax check passed.
- ZIP integrity test passed.
- Not yet tested on a physical Android device.
- Gemini connector not tested with a real API key.
- Not imported into this GitHub repository yet.
- Not a complete studio and not evidence of professional anime-quality autonomous drawing.

These are historical reports, not a fresh test in this repository. Revalidate before relying on them.

## Related tools previously investigated

- ToonPix on Android was identified as a possible free/offline frame-by-frame animation companion; verify current availability and behavior before depending on it.
- KinetiFrame was identified as an open-source experimental option, but its development-build status makes it unsuitable as a production dependency without testing.
- OpenPhoneUse was identified as an Android phone-control agent, but precise continuous drawing capability was not established.
- Gemini API free-tier availability and data-use caveats were previously researched and are now documented in docs/AI_VECTOR_DRAWING.md. Re-check provider terms and quotas regularly. Never send secrets or confidential project material to a third-party model without explicit review.

## Repository status at baseline

- GitHub repository: https://github.com/laracheinarave4675-max/zero-studio
- Visibility: private.
- Default branch: main.
- Connected GitHub identity has admin/maintain/push permissions.
- Repository was confirmed visible to the connected GitHub integration on 2026-11-17.
- This initial documentation baseline is being committed directly to main because the repository was empty at the time of setup.

## Drawing and character system milestone — feature/mobile-drawing-workspace

### Vector drawing tools
- [x] Freehand vector pen with sampled pointer input and smooth cubic Bézier interpolation.
- [x] Optional pressure-outline brush for pointer devices reporting stylus pressure; finger/mouse input keeps the normal brush path.
- [x] Vector eraser using editable, non-destructive SVG masks.
- [x] Straight line, rectangle, and ellipse tools; closed shapes support optional fill.
- [x] Select a visible vector path, drag to move it, and delete it. Each operation has a stable ID preserved by project normalization and SVG export.
- [x] Drawing-canvas zoom controls and a pan tool for the mobile viewport.
- [x] Inline layer rename, visibility, lock, reorder, add, and delete controls.
- [x] SVG path command grammar/arity checks and cumulative-coordinate limits for M/L/H/V/C/S/Q/T/A/Z paths. Bounds are conservative control-point/radius bounds, not exact Bézier-extrema geometry.
- [x] Topology-matched in-between generation for path-compatible keyframes. It rejects different path commands, layer/operation order, visibility/lock structure, and colors.
- [x] Save/open project v2, v1 migration, SVG sequence export, and ZIP32 bundle export.

### Character tools
- [x] Reusable Nori vector construction template with 12 identified parts grouped into semantic layers.
- [x] Three authored views (front, side, back), four pose presets (neutral, wave, walk, sit), and four expressions (neutral, happy, sad, surprised): 48 validated preset combinations.
- [x] Editable Nori palette controls for line, skin, hair, clothing, and accent colors.
- [x] Import/export standalone `.zchar` character-model files with size and path validation.
- [x] Insert selected character variants into the current frame as editable layer operations.
- [x] Exported model-sheet proportion guide layers for center, eye, shoulder, hip, and ground references.\n- [ ] Professional custom model-sheet editor, artist-adjustable proportion guides, and artist-reviewed turnarounds still need extension.
- [x] Basic two-bone inverse kinematics for four limb chains: endpoint drag solves the elbow/knee while preserving segment lengths and a 20°–160° bend range; intermediate-joint drag preserves both segment lengths.
- [x] Project-local reusable character library with validated save/load/remove and inclusion in `.zero` project save/open (100 models maximum).\n- [x] Unique-drawing cadence audit distinguishes unique vector artwork from repeated frames, reports the average unique drawings/second, and is included in ZIP manifests.\n- [x] Nori's 11-cell SVG model sheet now includes editable proportion-guide lines in every view/expression/pose cell.
- [ ] Full-body rigging (spine, neck, head, hands/feet articulation), collision/ground constraints, reusable linked instances across frames, and general rig-pose interpolation remain future work.

### Validation and current limitations
- [x] GitHub Actions run #322 passed on commit `2bb1224fa99b7ce5141a115eed49dcfc18f385dc`: 58 tests passed, 0 failed; JavaScript syntax checks passed.
- [ ] Physical Android browser/touch/stylus tests remain unperformed. The pressure brush is implemented but pressure fidelity depends on device/browser stylus events.
- [ ] Visual quality of Nori's authored geometry and all pose transitions still needs human/artist review.
- The in-between engine only interpolates matching SVG command topology. It is not a general skeletal or drawing-aware animation system.
- The 24-distinct-drawings-per-second production target remains unproven; the one-second sample is a simple pipeline proof, not 24 completely redrawn full-body poses.

## Current implementation status

- [x] Repository access confirmed.
- [x] Durable project README created.
- [x] Project status and constraints documented.
- [ ] Prior v0.1 prototype imported and re-reviewed.
- [x] First mobile vector drawing workspace source committed on `feature/mobile-drawing-workspace`.
- [ ] Android browser/device smoke test (public test URL is live; physical interaction remains pending).
- [x] Initial SVG drawing-command contract documented (`docs/DRAWING_COMMANDS.md`).
- [x] SVG path command grammar/arity and conservative coordinate-bound validation.
- [x] First AI vector drawing adapter implemented with preview and explicit approval; [ ] live API-key test.
- [x] First one-second animation proof created: 24 distinct vector frame documents at 24 FPS, with automated uniqueness test; [ ] human quality review and Android playback.
- [ ] Production departments/agents orchestration.
- [ ] Sound, editing, and export pipeline integration.

## Initial implementation baseline — historical, superseded by later milestones

Review pull request: https://github.com/laracheinarave4675-max/zero-studio/pull/1 (draft; not merged into `main`).

Committed an initial browser-based drawing workspace under `app/`:
- Arabic RTL responsive interface.
- SVG 1920×1080 touch drawing surface with pen and prototype white-stroke eraser.
- Frame add/duplicate/delete/select, previous-frame onion-skin preview, and playback at selectable 6/12/24 FPS.
- Undo/redo history.
- Save/open `.zero` JSON project files (local download/upload).
- Export all frames as an SVG-sequence JSON bundle.
- Strictly limited v1 vector-path JSON command input; no image-generation provider is connected.
- PWA manifest and basic app-shell service worker.

### Checks performed in this session
- [x] JavaScript parse check for `app/app.js` passed using the connected execution environment.
- [x] JavaScript parse check for `app/sw.js` passed.
- [x] `app/manifest.webmanifest` parsed as valid JSON.
- [ ] Physical Android interaction and touch testing.
- [ ] Browser/PWA install and offline behavior.
- [ ] Project save/open round-trip in a real browser.
- [ ] SVG export opened in a separate Android drawing/animation app.

At this initial baseline, the eraser was a white stroke and layers, ZIP export, and AI drawing were absent. Later milestones below add a true SVG-mask eraser, editable layers, ZIP export, and an optional text-only Gemini vector proposal adapter. The initial 24 FPS preview did not prove the 24-independent-drawings/sec target.

## Layer and vector eraser milestone — feature/mobile-drawing-workspace

Implemented on the existing development branch:
- Project format v2 with frame-local ordered layers (name, visibility, lock, ordered operations).
- Add/remove/select, rename, show/hide, lock/unlock, and reorder layer controls.
- Non-destructive vector eraser: eraser strokes are stored as ordered vector operations and exported as SVG masks; later strokes remain visible above earlier erase operations.
- v1 `.zero` files with `frames[].paths` migrate to one layer per frame when opened.
- SVG sequence export includes layer visibility and eraser masks.
- ZIP export creates a standalone archive containing the editable project, a manifest, and one SVG file per frame.
- Service-worker cache updated to include the ES module engine and use a new cache version.
- Added 13 engine, 4 Gemini-adapter, 2 workspace DOM, 3 ZIP, and 2 animation-proof tests (24 total).
- Drawing input consumes coalesced pointer samples where supported; pointer cancellation discards the incomplete gesture.
- Added GitHub Actions workflow for Node test execution across all `tests/*.test.mjs` files, including ZIP archive tests.

### Validation record
- Initial GitHub Actions attempt exposed one incorrect test fixture (it attempted to draw after locking the layer); the fixture was corrected.
- GitHub Actions run #102 completed successfully: 24 tests passed, 0 failed. Syntax checks passed for the app controller, engine, ZIP module, Gemini adapter, and service worker.
- Independently executed 12 equivalent engine behavior assertions in the connected JavaScript runtime; all passed.
- JavaScript syntax checks passed for the engine module, app controller, and service worker; all referenced controller DOM IDs exist in the HTML.
- Automated DOM checks confirm all controller IDs exist and the AI proposal controls/preview layer are present. Browser rendering and actual Android touch interaction remain untested.

Known limitations: the eraser is a non-destructive SVG mask, not geometric path splitting; full SVG path parser and pressure-sensitive stylus width are not implemented. The Gemini text-to-vector adapter is implemented but has not been tested with a real API key. No image-generation endpoint is connected.

## Drawing input and layer usability update — feature/mobile-drawing-workspace

- [x] Added validated layer renaming (trimmed, non-empty, maximum 80 characters) with undo history.
- [x] Added a regression test for successful rename and invalid names/IDs.
- [x] Pointer input uses browser-coalesced samples where available; pointer cancellation discards the unfinished gesture.
- [x] ZIP32 archive writer with UTF-8 filenames, CRC32, central directory, and path/duplicate validation.
- [x] ZIP archive tests added to CI.
- [ ] Test downloading and opening the ZIP on the physical Android phone; no device test is claimed.
- [x] Added a text-only Gemini vector proposal adapter with local validation and approve/reject preview.
- [ ] Test the adapter using a real user API key and confirm provider access from the user network.
- [x] Added a one-second original vector character wave/blink sample with 24 unique frames; automated CI confirms 24 distinct frames at 24 FPS; no raster image generation used.

## Public Android test deployment — 2026-11-17

- [x] Created Vercel project `zero-studio` in the user's authorized Hobby team.
- [x] Published the static app files from branch `feature/mobile-drawing-workspace` at commit `52be940755d46d69efc051d2acaa8f8fe711d7e1`.
- [x] Deployment reached `READY`; HTML, app controller, engine module, CSS, service worker, and web manifest each returned HTTP 200 in deployment fetch checks.
- Public test URL: https://zero-studio-three.vercel.app/
- GitHub repository remains private. Vercel password and SSO deployment protection are disabled so the app URL is publicly reachable, as explicitly approved by the user.
- GitHub Login Connection was not available to Vercel, so this is a manual static snapshot upload, not an automatic Git-linked deployment. Future code changes do not appear at this URL until a new deployment is uploaded.
- The deployment is a test copy, not evidence of physical Android validation. Touch/stylus behavior, PWA installation/offline behavior, project round-trip, ZIP download/open, and real Gemini API calls remain to be tested on the user's phone/network.

## Next actions

1. Validate the current drawing and character UI on the physical Android phone: zoom/pan, freehand/stylus pressure, selection/move/delete, shape fills, layer management, and character presets.
2. Test .zero and .zchar save/open round trips, SVG/ZIP export, offline PWA behavior, and a longer multi-frame project on Android.
3. Refine character construction into professional editable model sheets and customizable proportions.
4. Implement a real articulated character rig with joint constraints and reusable character instances; then build keyframe/cleanup workflows beyond topology-matched path tweening.
5. Use the cadence audit on a genuinely hand-drawn short action and evaluate whether 24 independent drawings/second can be achieved at acceptable quality and review effort. Do not treat 24 FPS playback as success.
6. Test Gemini with a user-owned API key entered directly in the app; never share the key in chat.

## Change log

### 2026-11-17 — GitHub access recheck and continuity confirmation
- Rechecked the private repository using the connected GitHub integration; `laracheinarave4675-max/zero-studio` is now discoverable.
- GitHub reports `admin`, `maintain`, and `push` permissions for the connected identity.
- Verified that README.md, PROJECT_STATUS.md, DECISIONS.md, and ROADMAP.md exist on the main branch and contain the project constraints and staged plan.
- No app source was changed in this step; importing the previous v0.1 prototype remains the next implementation task.


### 2026-11-17 — GitHub connection and documentation baseline
- Confirmed access to the private repository through the connected GitHub integration.
- Confirmed push/admin permissions.
- Began durable project documentation so future sessions can resume from repository state rather than relying on conversational recall.


## Smooth vector drawing milestone — 2026-11-17

- [x] Replaced straight-line freehand point joining with Catmull–Rom-derived cubic Bézier segments in the drawing engine.
- [x] One-point taps produce a tiny round-capped stroke; two-point gestures remain a straight segment; longer gestures produce cubic curves passing through the sampled points.
- [x] Pointer coalesced samples remain supported; generated paths are stored as ordinary editable SVG paths and continue to work with undo, masks, and SVG/ZIP export.
- [x] Added engine tests for curve generation, endpoint preservation, tap/straight-line handling, and invalid point rejection.
- [ ] Physical Android feel/latency and curve quality review remains pending; smoothing is mathematical interpolation, not stylus pressure or a brush engine.
- [x] Published the smooth-curve update to the existing public Vercel test URL; the deployment returned READY and the deployed app/engine files were checked for the new converter. GitHub Actions run #124 passed all 26 tests.


## 2026-11-17 — Expanded drawing and character editing

- Added operation IDs, path selection/move/delete, and translation support.
- Added touch pan/zoom controls and inline Android-friendly layer rename.
- Added Nori palette customization, with validated line/skin/hair/clothing/accent overrides.
- Expanded CI coverage to 58 passing tests. See GitHub Actions run #322.
