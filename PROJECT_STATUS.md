# ZERO STUDIO — Project Status

Last updated: 2026-11-17 (UTC)

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
- Gemini API free-tier availability and data-use caveats were previously researched; re-check current terms before integrating. Never send secrets or confidential project material to a third-party model without explicit review.

## Repository status at baseline

- GitHub repository: https://github.com/laracheinarave4675-max/zero-studio
- Visibility: private.
- Default branch: main.
- Connected GitHub identity has admin/maintain/push permissions.
- Repository was confirmed visible to the connected GitHub integration on 2026-11-17.
- This initial documentation baseline is being committed directly to main because the repository was empty at the time of setup.

## Current implementation status

- [x] Repository access confirmed.
- [x] Durable project README created.
- [x] Project status and constraints documented.
- [ ] Prior v0.1 prototype imported and re-reviewed.
- [x] First mobile vector drawing workspace source committed on `feature/mobile-drawing-workspace`.
- [ ] Android browser/device smoke test.
- [x] Initial SVG drawing-command contract documented (`docs/DRAWING_COMMANDS.md`).
- [ ] Full SVG parser and geometric bounds validation.
- [ ] First controlled AI-assisted vector drawing test.
- [ ] First short animation test with measurable drawing count and quality review.
- [ ] Production departments/agents orchestration.
- [ ] Sound, editing, and export pipeline integration.

## First implementation — feature/mobile-drawing-workspace

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

Known prototype limitations: eraser paints white rather than removing vector geometry; no layer system, no semantic character drawing, no automatic keyframes/in-betweens, no AI model/provider, and no ZIP exporter. The 24 FPS playback selector does not produce 24 new drawings per second; the explicit 24-independent-drawings/sec goal remains unchanged and unproven.

## Layer and vector eraser milestone — feature/mobile-drawing-workspace

Implemented on the existing development branch:
- Project format v2 with frame-local ordered layers (name, visibility, lock, ordered operations).
- Add/remove/select, rename, show/hide, lock/unlock, and reorder layer controls.
- Non-destructive vector eraser: eraser strokes are stored as ordered vector operations and exported as SVG masks; later strokes remain visible above earlier erase operations.
- v1 `.zero` files with `frames[].paths` migrate to one layer per frame when opened.
- SVG sequence export includes layer visibility and eraser masks.
- ZIP export creates a standalone archive containing the editable project, a manifest, and one SVG file per frame.
- Service-worker cache updated to include the ES module engine and use a new cache version.
- Added 13 Node tests covering v1 migration, layer operations and rename validation, locked layers, eraser masks/order, hidden layers, validation, v2 round-trip, consecutive erasures, and unique mask IDs.
- Drawing input consumes coalesced pointer samples where supported; pointer cancellation discards the incomplete gesture.
- Added GitHub Actions workflow for Node test execution across all `tests/*.test.mjs` files, including ZIP archive tests.

### Validation record
- Initial GitHub Actions attempt exposed one incorrect test fixture (it attempted to draw after locking the layer); the fixture was corrected.
- Final GitHub Actions run #23 completed successfully: `node --test tests/engine.test.mjs` — 12 tests passed, 0 failed.
- Independently executed 12 equivalent engine behavior assertions in the connected JavaScript runtime; all passed.
- JavaScript syntax checks passed for the engine module, app controller, and service worker; all referenced controller DOM IDs exist in the HTML.
- Static source inspection found all app DOM IDs referenced by the controller are present. Browser rendering and actual Android touch interaction remain untested.

Known limitations: the eraser is a non-destructive SVG mask, not geometric path splitting; full SVG path parser and pressure-sensitive stylus width are not implemented. No AI provider or raster image generation is connected.

## Drawing input and layer usability update — feature/mobile-drawing-workspace

- [x] Added validated layer renaming (trimmed, non-empty, maximum 80 characters) with undo history.
- [x] Added a regression test for successful rename and invalid names/IDs.
- [x] Pointer input uses browser-coalesced samples where available; pointer cancellation discards the unfinished gesture.
- [x] ZIP32 archive writer with UTF-8 filenames, CRC32, central directory, and path/duplicate validation.
- [x] ZIP archive tests added to CI.
- [ ] Test downloading and opening the ZIP on the physical Android phone; no device test is claimed.

## Next actions

1. Inspect the repository after the initial documentation commits.
2. Recover/import the previous v0.1 prototype if the exact files are still available in the active work environment; otherwise reconstruct only after checking the prior implementation details.
3. Establish a clean app structure and a repeatable Android test procedure.
4. Build the drawing-command interface with validation, undo/redo, layers, frame management, and deterministic SVG export.
5. Prototype one character action at very small scale and assess line quality, continuity, and actual unique drawings per second before expanding.

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
