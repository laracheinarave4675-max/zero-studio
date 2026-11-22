import test from "node:test";
import assert from "node:assert/strict";
import { extractCharacterViews, cleanCharacterViewMatte } from "../app/character-sheet-segmentation.mjs";

function modelSheet() {
  const width = 42, height = 24;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) data.set([255, 255, 255, 255], i * 4);
  const pixel = (x, y, rgba) => data.set(rgba, (y * width + x) * 4);
  // Three non-touching figures, ordered front/side/back from left to right.
  for (let y = 3; y < 21; y++) for (let x = 3; x < 10; x++) pixel(x, y, [24, 30, 42, 255]);
  for (let y = 4; y < 20; y++) for (let x = 17; x < 22; x++) pixel(x, y, [180, 90, 110, 255]);
  for (let y = 2; y < 22; y++) for (let x = 30; x < 38; x++) pixel(x, y, [30, 32, 45, 255]);
  // One exterior background pixel inside the crop bounds.
  pixel(3, 3, [255, 255, 255, 255]);
  // Enclosed white clothing detail: it must not be removed as exterior background.
  for (let x = 5; x <= 7; x++) { pixel(x, 8, [24, 30, 42, 255]); pixel(x, 12, [24, 30, 42, 255]); }
  for (let y = 8; y <= 12; y++) { pixel(5, y, [24, 30, 42, 255]); pixel(7, y, [24, 30, 42, 255]); }
  pixel(6, 10, [255, 255, 255, 255]);
  return { width, height, data };
}

test("extracts three separate model-sheet views from border-connected white background", () => {
  const source = modelSheet();
  const result = extractCharacterViews(source, { minArea: 10 });
  assert.equal(result.format, "zero-studio-character-sheet-views");
  assert.deepEqual(result.views.map(view => view.id), ["front", "side", "back"]);
  assert.deepEqual(result.views.map(view => view.bounds.x), [3, 17, 30]);
  assert.ok(result.exteriorBackgroundPixels > 0);
  for (const view of result.views) {
    assert.equal(view.data.length, view.width * view.height * 4);
    assert.ok(view.pixelCount >= 10);
  }
});

test("preserves original RGBA values and enclosed white highlights while making exterior transparent", () => {
  const source = modelSheet();
  const result = extractCharacterViews(source, { minArea: 10 });
  const front = result.views[0];
  const interior = ((10 - front.bounds.y) * front.width + (6 - front.bounds.x)) * 4;
  assert.deepEqual(Array.from(front.data.slice(interior, interior + 4)), [255, 255, 255, 255]);
  const figurePixel = ((4 - front.bounds.y) * front.width + (4 - front.bounds.x)) * 4;
  assert.deepEqual(Array.from(front.data.slice(figurePixel, figurePixel + 4)), [24, 30, 42, 255]);
  assert.equal(front.data[3], 0, "transparent crop padding must not be painted white");
});

test("rejects sheets with missing view components rather than guessing their positions", () => {
  const source = modelSheet();
  assert.throws(() => extractCharacterViews(source, { expectedViews: 4, minArea: 10 }), /Expected 4 separate character views, but found 3/);
});

test("rejects invalid pixels, dimensions and unsafe segmentation options", () => {
  const source = modelSheet();
  assert.throws(() => extractCharacterViews({ ...source, data: new Uint8Array(3) }), /RGBA pixels are missing/);
  assert.throws(() => extractCharacterViews({ ...source, width: 0 }), /dimensions must be positive/);
  assert.throws(() => extractCharacterViews(source, { whiteThreshold: 190 }), /options are invalid/);
});

test("removes enclosed white matte islands and pale foot shadows but preserves highlights and warm shoe colors", () => {
  const width = 40, height = 60;
  const data = new Uint8ClampedArray(width * height * 4);
  const fill = (x0, y0, w, h, rgba) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      data.set(rgba, (y * width + x) * 4);
    }
  };
  fill(2, 4, 10, 10, [253, 253, 253, 255]); // enclosed background pocket: remove
  fill(17, 5, 5, 5, [255, 255, 255, 255]); // small specular detail: keep
  fill(3, 55, 10, 5, [228, 229, 232, 255]); // pale ground shadow: remove
  fill(24, 54, 10, 6, [242, 198, 184, 255]); // warm shoe/skin: keep
  const cleaned = cleanCharacterViewMatte(data, width, height);
  const pixel = (x, y) => Array.from(cleaned.data.slice((y * width + x) * 4, (y * width + x) * 4 + 4));
  assert.equal(cleaned.whiteIslandPixelsRemoved, 100);
  assert.equal(cleaned.footShadowPixelsRemoved, 50);
  assert.equal(pixel(4, 5)[3], 0);
  assert.equal(pixel(4, 56)[3], 0);
  assert.equal(pixel(18, 6)[3], 255);
  assert.deepEqual(pixel(25, 55), [242, 198, 184, 255]);
});

test("reports matte cleanup statistics for extracted front, side and back views", () => {
  const result = extractCharacterViews(modelSheet(), { minArea: 10 });
  for (const view of result.views) {
    assert.ok(view.matteCleanup);
    assert.ok(Number.isInteger(view.matteCleanup.whiteIslandPixelsRemoved));
    assert.ok(Number.isInteger(view.matteCleanup.footShadowPixelsRemoved));
  }
});
