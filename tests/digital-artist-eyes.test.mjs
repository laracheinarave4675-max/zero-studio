import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  analyzeRasterPixels, analyzeStrokeGeometry, compareLandmarks,
  comparePalette, inspectRegionFill
} from "../app/digital-artist-eyes.mjs";

test("raster eye measures silhouette bounds, coverage, centroid and dominant palette", () => {
  const width = 5, height = 4, data = new Uint8ClampedArray(width * height * 4);
  for (const [x, y] of [[1, 1], [2, 1], [1, 2], [2, 2]]) {
    const offset = (y * width + x) * 4;
    data.set([240, 190, 170, 255], offset);
  }
  const report = analyzeRasterPixels({ width, height, data });
  assert.equal(report.visiblePixels, 4);
  assert.equal(report.alphaCoverage, 0.2);
  assert.deepEqual(report.bounds, { x: 1, y: 1, width: 2, height: 2 });
  assert.ok(Math.abs(report.centroid.x - 1.5) < 0.001);
  assert.equal(report.dominantPalette[0].pixels, 4);
});

test("raster eye handles empty surfaces and rejects malformed buffers", () => {
  const empty = analyzeRasterPixels({ width: 2, height: 2, data: new Uint8ClampedArray(16) });
  assert.equal(empty.visiblePixels, 0);
  assert.equal(empty.bounds, null);
  assert.throws(() => analyzeRasterPixels({ width: 2, height: 2, data: new Uint8ClampedArray(8) }), /RGBA/);
});

test("line-art eye measures stroke geometry and pressure hierarchy", () => {
  const report = analyzeStrokeGeometry({
    id: "ink-01", intent: "Ink the face contour.",
    points: [{ x: 10, y: 10, pressure: .2 }, { x: 30, y: 10, pressure: .8 }, { x: 30, y: 35, pressure: .4 }]
  });
  assert.equal(report.sampleCount, 3);
  assert.equal(report.length, 45);
  assert.deepEqual(report.bounds, { x: 10, y: 10, width: 20, height: 25 });
  assert.equal(report.pressureRange.min, .2);
  assert.equal(report.pressureRange.max, .8);
});

test("identity eye compares normalized facial and anatomical landmarks", () => {
  const reference = { leftEye: { x: .35, y: .4 }, rightEye: { x: .65, y: .4 }, chin: { x: .5, y: .8 } };
  const same = compareLandmarks(reference, reference);
  assert.equal(same.passed, true);
  const drift = compareLandmarks(reference, { ...reference, chin: { x: .62, y: .8 } }, { tolerance: .05 });
  assert.equal(drift.passed, false);
  assert.equal(drift.measurements.find(item => item.name === "chin").withinTolerance, false);
});

test("color eye compares named model-sheet palette swatches", () => {
  const reference = { hair: "#28334b", skin: "#efc4b1", jacket: "#71999c" };
  assert.equal(comparePalette(reference, { ...reference }).passed, true);
  const mismatch = comparePalette(reference, { ...reference, hair: "#ffffff" });
  assert.equal(mismatch.passed, false);
  assert.ok(mismatch.maxDistance > 100);
});

test("fill eye detects incomplete color coverage and color leakage outside a closed region", () => {
  const width = 20, height = 20, data = new Uint8ClampedArray(width * height * 4);
  const polygon = [{ x: 5, y: 5 }, { x: 14, y: 5 }, { x: 14, y: 14 }, { x: 5, y: 14 }];
  const paint = (x, y) => data.set([239, 196, 177, 255], (y * width + x) * 4);
  for (let y = 5; y < 14; y++) for (let x = 5; x < 14; x++) paint(x, y);
  const imageData = { width, height, data };
  const clean = inspectRegionFill(imageData, polygon, "#efc4b1", { stride: 1, margin: 2 });
  assert.equal(clean.passed, true);
  assert.equal(clean.insideCoverage, 1);
  assert.equal(clean.outsideLeakage, 0);
  paint(4, 8);
  const leaked = inspectRegionFill(imageData, polygon, "#efc4b1", { stride: 1, margin: 2, maximumLeakage: 0 });
  assert.equal(leaked.passed, false);
  assert.ok(leaked.outsideLeakage > 0);
});

test("fill eye rejects invalid or out-of-raster polygon geometry", () => {
  const imageData = { width: 4, height: 4, data: new Uint8ClampedArray(64) };
  assert.throws(() => inspectRegionFill(imageData, [{ x: 1, y: 1 }, { x: 2, y: 2 }], "#ffffff"), /three points/);
  assert.throws(() => inspectRegionFill(imageData, [{ x: 1, y: 1 }, { x: 9, y: 2 }, { x: 2, y: 3 }], "#ffffff"), /outside/);
});

test("Digital Artist eyes and anime curriculum are exposed in the editor without external vision calls", async () => {
  const [html, app] = await Promise.all([
    readFile(new URL("../app/index.html", import.meta.url), "utf8"),
    readFile(new URL("../app/app.js", import.meta.url), "utf8")
  ]);
  for (const id of ["digitalArtistEyesBtn", "digitalArtistEyesReport", "animeArtistSkillSelect", "animeArtistSkillDetails"]) {
    assert.equal((html.match(new RegExp('id="' + id + '"', "g")) || []).length, 1, "expected one " + id);
  }
  assert.match(app, /analyzeRasterPixels/);
  assert.match(app, /analyzeStrokeGeometry/);
  assert.match(app, /function inspectDigitalArtistEyes\(/);
  assert.match(app, /eyesButton\.onclick=\(\)=>inspectDigitalArtistEyes\(\)/);
  assert.match(app, /function mountAnimeArtistCurriculum\(/);
  assert.match(app, /mountAnimeArtistCurriculum\(\)/);
  assert.match(app, /getAnimeArtistCurriculum\(\)/);
  assert.match(app, /inspectionScale=Math\.min\(1,960\/width,540\/height\)/);
});
