import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  analyzeRasterPixels, analyzeStrokeGeometry, compareLandmarks,
  comparePalette, inspectRegionFill, inspectRegionFillGroup,
  compareAnatomyGuideToDNA
} from "../app/digital-artist-eyes.mjs";
import { createAnimeCharacterDNA } from "../app/anime-anatomy-engine.mjs";

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

test("line-art eye preserves compiled command IDs as review references", () => {
  const report = analyzeStrokeGeometry({
    strokeId: "artist-raster-face/face-ink-01",
    intent: "Ink the jaw.",
    points: [{ x: 10, y: 10, pressure: .2 }, { x: 20, y: 15, pressure: .8 }]
  });
  assert.equal(report.id, "artist-raster-face/face-ink-01");
});

test("line-art eye flags duplicate samples, unstable pressure and zero-length strokes", () => {
  const duplicate = analyzeStrokeGeometry({
    id: "bad-ink", points: [
      {x:10,y:10,pressure:.2},{x:10,y:10,pressure:.9},
      {x:10.1,y:10.1,pressure:.1},{x:10.2,y:10.2,pressure:.9},
      {x:10.3,y:10.3,pressure:.1},{x:10.4,y:10.4,pressure:.9}
    ]
  });
  assert.ok(duplicate.segmentQuality.duplicateSegments >= 1);
  assert.ok(duplicate.warnings.includes("duplicate-consecutive-points"));
  assert.ok(duplicate.warnings.includes("unstable-pressure"));
  const emptyMove = analyzeStrokeGeometry({id:"dot",points:[{x:4,y:4,pressure:.5}]});
  assert.ok(emptyMove.warnings.includes("zero-length-stroke"));
  const clean = analyzeStrokeGeometry({id:"clean",points:[{x:0,y:0,pressure:.3},{x:10,y:2,pressure:.4},{x:20,y:4,pressure:.5}]});
  assert.deepEqual(clean.warnings, []);
});

test("identity eye compares normalized facial and anatomical landmarks", () => {
  const reference = { leftEye: { x: .35, y: .4 }, rightEye: { x: .65, y: .4 }, chin: { x: .5, y: .8 } };
  const same = compareLandmarks(reference, reference);
  assert.equal(same.passed, true);
  const drift = compareLandmarks(reference, { ...reference, chin: { x: .62, y: .8 } }, { tolerance: .05 });
  assert.equal(drift.passed, false);
  assert.equal(drift.measurements.find(item => item.name === "chin").withinTolerance, false);
});

test("identity eye fails closed when a required model-sheet landmark is missing", () => {
  const reference = { leftEye: { x: .35, y: .4 }, rightEye: { x: .65, y: .4 }, chin: { x: .5, y: .8 } };
  const partial = compareLandmarks(reference, { leftEye: reference.leftEye, chin: reference.chin });
  assert.equal(partial.passed, false);
  assert.deepEqual(partial.missing, ["rightEye"]);
  assert.equal(partial.compared, 2);
  assert.equal(partial.measurements.find(item => item.name === "rightEye").deviation, null);
});

test("anatomy eye compares a current approved pose guide to locked Character DNA proportions", () => {
  const points = {
    root:[.50,.52], pelvis:[.50,.58], chest:[.50,.36], neck:[.50,.26], head:[.50,.16],
    shoulderL:[.43,.37], elbowL:[.35,.47], wristL:[.30,.56],
    shoulderR:[.57,.37], elbowR:[.65,.47], wristR:[.70,.56],
    hipL:[.46,.59], kneeL:[.44,.75], ankleL:[.43,.91], toeL:[.38,.93],
    hipR:[.54,.59], kneeR:[.56,.75], ankleR:[.57,.91], toeR:[.62,.93]
  };
  const guide = {
    view:"side",
    contacts:{footL:"planted",footR:"swing"},
    joints:Object.fromEntries(Object.entries(points).map(([name,[x,y]])=>[name,{x,y}]))
  };
  const dna=createAnimeCharacterDNA({
    characterAssetId:"eyes-character",characterBibleId:"eyes-bible",anchorGuide:guide
  });
  const match=compareAnatomyGuideToDNA(dna,guide);
  assert.equal(match.passed,true);
  assert.equal(match.compared,11);
  const drifted=structuredClone(guide);
  drifted.joints.wristL.y+=.12;
  const mismatch=compareAnatomyGuideToDNA(dna,drifted,{relativeTolerance:.1});
  assert.equal(mismatch.passed,false);
  assert.ok(mismatch.measurements.some(item=>item.name==="lowerArmL"&&!item.passed));
  const otherView=compareAnatomyGuideToDNA(dna,{...guide,view:"front"});
  assert.equal(otherView.skipped,true);
  assert.equal(otherView.passed,null);
});

test("color eye compares named model-sheet palette swatches", () => {
  const reference = { hair: "#28334b", skin: "#efc4b1", jacket: "#71999c" };
  assert.equal(comparePalette(reference, { ...reference }).passed, true);
  const mismatch = comparePalette(reference, { ...reference, hair: "#ffffff" });
  assert.equal(mismatch.passed, false);
  assert.ok(mismatch.maxDistance > 100);
});

test("color eye fails closed when a required model-sheet swatch is missing", () => {
  const reference = { hair: "#28334b", skin: "#efc4b1", jacket: "#71999c" };
  const partial = comparePalette(reference, { hair: reference.hair, skin: reference.skin });
  assert.equal(partial.passed, false);
  assert.deepEqual(partial.missing, ["jacket"]);
  assert.equal(partial.compared, 2);
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

test("fill eye treats neighboring same-color polygons as one intended color group", () => {
  const width = 30, height = 20, data = new Uint8ClampedArray(width * height * 4);
  const paint = (x, y) => data.set([52, 56, 76, 255], (y * width + x) * 4);
  for (let y = 5; y < 13; y++) {
    for (let x = 3; x < 10; x++) paint(x, y);
    for (let x = 12; x < 19; x++) paint(x, y);
  }
  const imageData = { width, height, data };
  const left = [{x:3,y:5},{x:10,y:5},{x:10,y:13},{x:3,y:13}];
  const right = [{x:12,y:5},{x:19,y:5},{x:19,y:13},{x:12,y:13}];
  const single = inspectRegionFill(imageData, left, "#34384c", { stride: 1, margin: 6 });
  const grouped = inspectRegionFillGroup(imageData, [left, right], "#34384c", { stride: 1, margin: 6 });
  assert.ok(single.outsideLeakage > 0);
  assert.equal(grouped.outsideLeakage, 0);
  assert.equal(grouped.insideCoverage, 1);
  assert.equal(grouped.regionCount, 2);
  assert.equal(grouped.passed, true);
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
  assert.match(app, /validateAnimeCharacterDNA\(selectedDNA\)/);
  assert.match(app, /compareAnatomyGuideToDNA\(dna,liveGuide/);
  assert.match(app, /characterIdentity:\{characterAssetId/);
  assert.match(app, /inspectionScale=Math\.min\(1,960\/width,540\/height\)/);
});


import { compareAnimeEyeDesign, compareAnimeHairFlow } from "../app/digital-artist-eyes.mjs";

const animeEyeLandmarks = () => ({
  faceLeft:{x:.2,y:.5}, faceRight:{x:.8,y:.5},
  eyeLOuter:{x:.30,y:.43}, eyeLInner:{x:.40,y:.43},
  eyeLUpper:{x:.35,y:.415}, eyeLLower:{x:.35,y:.455},
  eyeLIris:{x:.35,y:.435}, eyeLPupil:{x:.35,y:.435},
  eyeROuter:{x:.60,y:.43}, eyeRInner:{x:.70,y:.43},
  eyeRUpper:{x:.65,y:.415}, eyeRLower:{x:.65,y:.455},
  eyeRIris:{x:.65,y:.435}, eyeRPupil:{x:.65,y:.435}
});

test("anime eye design eye compares approved eye proportions, pair spacing and iris containment", () => {
  const reference = animeEyeLandmarks();
  const current = animeEyeLandmarks();
  const result = compareAnimeEyeDesign(reference, current);
  assert.equal(result.passed, true);
  assert.equal(result.compared, 17);
  assert.equal(result.measurementScope, "normalized-approved-landmarks-not-pixel-inference");
  current.eyeLIris = {x:.48,y:.49};
  const drift = compareAnimeEyeDesign(reference, current);
  assert.equal(drift.passed, false);
  assert.ok(drift.failures.includes("left-iris-contained"));
  assert.ok(drift.failures.includes("left-iris-x"));
});

test("anime eye design preserves distinctive reference proportions instead of enforcing a universal style", () => {
  const reference = animeEyeLandmarks();
  reference.eyeLUpper = {x:.35,y:.40};
  reference.eyeLLower = {x:.35,y:.46};
  const matching = structuredClone(reference);
  assert.equal(compareAnimeEyeDesign(reference, matching).passed, true);
  matching.eyeLUpper = {x:.35,y:.415};
  assert.equal(compareAnimeEyeDesign(reference, matching).passed, false);
});

test("anime hair-flow eye checks named clump direction and length against the model sheet", () => {
  const reference = [
    {id:"bang-1",root:{x:.4,y:.2},tip:{x:.3,y:.42}},
    {id:"bang-2",root:{x:.5,y:.18},tip:{x:.52,y:.44}},
    {id:"side-1",root:{x:.62,y:.24},tip:{x:.76,y:.55}}
  ];
  const current = structuredClone(reference);
  assert.equal(compareAnimeHairFlow(reference,current).passed,true);
  current[1].tip = {x:.7,y:.25};
  const drift = compareAnimeHairFlow(reference,current);
  assert.equal(drift.passed,false);
  assert.ok(drift.failures.includes("bang-2"));
});

test("anime eye and hair comparison reject missing or malformed landmarks", () => {
  const reference = animeEyeLandmarks();
  const missing = {...reference}; delete missing.eyeRPupil;
  assert.throws(() => compareAnimeEyeDesign(reference,missing), /eyeRPupil/);
  assert.throws(() => compareAnimeHairFlow([{id:"a",root:{x:.1,y:.1},tip:{x:.2,y:.2}}],[]), /3–64/);
});


test("anime model-sheet landmark comparison is available in the artist workspace", async () => {
  const [html, app] = await Promise.all([
    readFile(new URL("../app/index.html", import.meta.url), "utf8"),
    readFile(new URL("../app/app.js", import.meta.url), "utf8")
  ]);
  for (const id of ["animeDesignLandmarkInput", "compareAnimeDesignLandmarksBtn", "animeDesignLandmarkStatus"]) {
    assert.equal((html.match(new RegExp('id="' + id + '"', "g")) || []).length, 1);
  }
  assert.match(app, /compareAnimeEyeDesign/);
  assert.match(app, /compareAnimeHairFlow/);
  assert.match(app, /function compareAnimeDesignLandmarks\(/);
  assert.match(app, /compareButton\.onclick=compareAnimeDesignLandmarks/);
  assert.match(app, /report\.animeEyeComparison=eyeComparison/);
  assert.match(app, /buildArtistCorrectionPlan\(report\)/);
});


test("anime eye and hair comparison reject non-finite tolerance settings", () => {
  const landmarks = animeEyeLandmarks();
  assert.throws(() => compareAnimeEyeDesign(landmarks,landmarks,{aspectRatioTolerance:"not-a-number"}), /tolerance/);
  const clumps = [
    {id:"a",root:{x:.1,y:.1},tip:{x:.2,y:.2}},
    {id:"b",root:{x:.2,y:.1},tip:{x:.3,y:.2}},
    {id:"c",root:{x:.3,y:.1},tip:{x:.4,y:.2}}
  ];
  assert.throws(() => compareAnimeHairFlow(clumps,clumps,{angleTolerance:"invalid"}), /tolerance/);
});
