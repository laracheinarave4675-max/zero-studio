# Android Test Plan — ZERO STUDIO

These checks have not yet been performed on the user's physical Android phone.

- [ ] Open over HTTPS in Chrome or another modern Android browser.
- [ ] Confirm Arabic RTL layout and no horizontal overflow.
- [ ] Draw with finger; confirm strokes track pointer without page scrolling.
- [ ] Draw with stylus if available.
- [ ] Change color and stroke width.
- [ ] Undo and redo strokes.
- [ ] Add/delete/select/reorder layers; toggle visibility and lock state.
- [ ] Verify vector eraser removes earlier strokes but preserves later strokes and other layers.
- [ ] Save and reopen a v1 project; confirm it migrates to a single layer per frame.
- [ ] Save and reopen a v2 multi-layer project including eraser masks.
- [ ] Add, duplicate, select, and delete frames.
- [ ] Confirm onion-skin display of previous frame.
- [ ] Preview at 6, 12, and 24 playback FPS.
- [ ] Save a .zero project, reload it, and compare frame contents.
- [ ] Export SVG sequence JSON and inspect SVG output in another viewer.
- [ ] Test airplane/offline mode after first successful load.
- [ ] Rotate device and verify drawing surface usability.
- [ ] Test larger project and note memory/performance limits.

Do not mark any item complete until observed on the physical device.
