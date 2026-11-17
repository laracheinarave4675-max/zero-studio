# Android Test Plan — ZERO STUDIO

These checks have not yet been performed on the user's physical Android phone.

- [ ] Open over HTTPS in Chrome or another modern Android browser.
- [ ] Confirm Arabic RTL layout and no horizontal overflow.
- [ ] Draw with finger; confirm strokes track pointer without page scrolling.
- [ ] Draw with stylus if available; verify actual reported pressure and compare the variable-width outline brush against ordinary finger input.
- [ ] Change color and stroke width.
- [ ] Draw a line, rectangle, and ellipse; test filled and unfilled variants.
- [ ] Zoom in/out, reset view, and pan the canvas while zoomed; verify drawing coordinates remain correct.
- [ ] Undo and redo strokes.
- [ ] Select a visible vector path, drag it to move, change its color/width, duplicate and delete it; verify undo/redo. Test selection and edit rejection on a locked layer.
- [ ] Add/delete/select/reorder/rename layers; toggle visibility and lock state.
- [ ] Interrupt a stroke with Android pointer cancellation and confirm the incomplete stroke is discarded.
- [ ] Verify vector eraser removes earlier strokes but preserves later strokes and other layers.
- [ ] Save and reopen a v1 project; confirm it migrates to a single layer per frame.
- [ ] Save and reopen a v2 multi-layer project including eraser masks.
- [ ] Add, duplicate, select, and delete frames.
- [ ] Generate 1, 2, 3, and 5 in-between frames between compatible keyframes; confirm mismatched path topology/colors are rejected.
- [ ] Confirm onion-skin display of previous frame.
- [ ] Preview at 6, 12, and 24 playback FPS.
- [ ] Save a .zero project, reload it, and compare frame contents.
- [ ] Export SVG sequence JSON and inspect SVG output in another viewer.
- [ ] Export the ZIP bundle, open it with Android Files/archive manager, and verify `project.zero`, `manifest.json`, and frame SVG files are present.
- [ ] Insert Nori in all three views and its four pose/facial expression presets; check editable parts and recolor its palette.\n- [ ] Export the 11-cell SVG model sheet and open it in a separate Android SVG viewer/editor.
- [ ] Export a .zchar character model, import it into a fresh project, and compare its editable layer parts.
- [ ] Enter a Gemini API key and generate a text-only vector proposal; verify no key is written to project or ZIP files.
- [ ] Approve and reject proposals; confirm rejected proposals do not modify the project and approved paths are undoable.
- [ ] Test airplane/offline mode after first successful load.
- [ ] Rotate device and verify drawing surface usability.
- [ ] Test larger project and note memory/performance limits.

Do not mark any item complete until observed on the physical device.
