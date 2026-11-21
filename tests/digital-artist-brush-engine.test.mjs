import test from "node:test";
import assert from "node:assert/strict";
import { compileDigitalArtistBrushPlan, getDigitalArtistBrushStep, validateDigitalArtistBrushPlan } from "../app/digital-artist-brush-engine.mjs";

const makePlan = () => ({
  format: "zero-studio-digital-artist-brush-plan",
  version: 1,
  title: "Anime character ink study",
  identity: { characterAssetId: "char-01", referenceDigest: "a".repeat(64) },
  layers: [
    { id: "rough", name: "Gesture and construction", role: "construction", strokes: [
      { id: "s1", intent: "Establish the head gesture.", brush: "graphite", color: "#777777", size: 9, texture: 0.7, points: [{x:620,y:190,pressure:.25},{x:665,y:160,pressure:.8},{x:720,y:185,pressure:.4}] }
    ]},
    { id: "flats", name: "Base colors", role: "flat-color", strokes: [
      { id: "s3", intent: "Paint a soft skin base mark.", brush: "gouache", color: "#e8c2ae", size: 24, opacity: .8, texture: .3, points: [{x:650,y:270,pressure:.6},{x:680,y:285,pressure:.9}] }
    ]},
    { id: "ink", name: "Clean ink", role: "clean-line", strokes: [
      { id: "s2", intent: "Ink the jaw contour with tapered pressure.", brush: "ink", color: "#24202a", size: 7, pressureSensitive: true, points: [{x:610,y:250,pressure:.15},{x:640,y:330,pressure:.9},{x:700,y:360,pressure:.2}] }
    ]}
  ]
});

test("validates semantic raster brush layers and pressure samples", () => {
  const plan = validateDigitalArtistBrushPlan(makePlan());
  assert.equal(plan.strokeCount, 3);
  assert.equal(plan.authoringMode, "ordered-native-raster-brush-strokes");
  assert.equal(plan.layers[2].strokes[0].points[1].pressure, .9);
});

test("compiles to native raster commands without requiring vector paths", () => {
  const stream = compileDigitalArtistBrushPlan(makePlan());
  assert.equal(stream.renderer, "native-canvas2d-raster-brush-engine");
  assert.equal(stream.audit.vectorRequired, false);
  assert.equal(stream.audit.nativeRasterBrushes, true);
  assert.deepEqual(stream.commands.map(item => item.strokeId), ["s1", "s3", "s2"]);
  assert.equal(getDigitalArtistBrushStep(stream, 2).options.pressureSensitive, true);
  assert.equal(getDigitalArtistBrushStep(stream, 3), null);
});

test("rejects invalid brush, invalid color, and out-of-canvas points", () => {
  const a = makePlan(); a.layers[0].strokes[0].brush = "diffusion";
  assert.throws(() => validateDigitalArtistBrushPlan(a), /Unsupported raster brush/);
  const b = makePlan(); b.layers[0].strokes[0].color = "red";
  assert.throws(() => validateDigitalArtistBrushPlan(b), /six-digit hex/);
  const c = makePlan(); c.layers[0].strokes[0].points[0].x = -1;
  assert.throws(() => validateDigitalArtistBrushPlan(c), /outside the drawing canvas/);
});

test("rejects duplicate IDs, invalid stage order, and invalid pressure", () => {
  const a = makePlan(); a.layers[1].strokes[0].id = "s1";
  assert.throws(() => validateDigitalArtistBrushPlan(a), /Duplicate stroke id/);
  const b = makePlan(); b.layers.reverse();
  assert.throws(() => validateDigitalArtistBrushPlan(b), /drawing order/);
  const c = makePlan(); c.layers[0].strokes[0].points[0].pressure = 2;
  assert.throws(() => validateDigitalArtistBrushPlan(c), /pressure must be between/);
});
