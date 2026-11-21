import test from "node:test";
import assert from "node:assert/strict";
import { compileDigitalArtistPlan, getDigitalArtistStep, validateDigitalArtistPlan } from "../app/digital-artist-engine.mjs";

const path = (d, stroke = "#29232b", fill = "none", width = 4) => ({ d, stroke, fill, width });
const validPlan = () => ({
  format: "zero-studio-digital-artist-plan",
  version: 1,
  title: "Character drawing study",
  canvas: { width: 1920, height: 1080 },
  characterName: "Reference character",
  identity: { characterAssetId: "character-01", referenceDigest: "a".repeat(64) },
  direction: "Draw a clean anime character from the approved identity reference.",
  layers: [
    { id: "construction", name: "Construction", role: "construction", strokes: [
      { id: "stroke-01", tool: "pencil", intent: "Place the head construction oval.", operation: path("M 600 180 C 680 120 780 160 790 250 C 780 340 670 360 600 290 Z", "#777777", "none", 2) }
    ] },
    { id: "line-art", name: "Clean line art", role: "clean-line", strokes: [
      { id: "stroke-02", tool: "inking-pen", intent: "Ink the outer face contour.", operation: path("M 620 260 C 640 380 760 390 790 260", "#29232b", "none", 5) }
    ] },
    { id: "flats", name: "Skin flats", role: "flat-color", strokes: [
      { id: "stroke-03", tool: "fill-brush", intent: "Fill the face base color.", operation: path("M 625 265 C 650 355 755 355 785 265 Z", "none", "#f1d4c5", 1) }
    ] }
  ]
});

test("validates ordered, editable vector drawing stages", () => {
  const plan = validateDigitalArtistPlan(validPlan());
  assert.equal(plan.strokeCount, 3);
  assert.equal(plan.authoringMode, "ordered-editable-vector-strokes");
  assert.equal(plan.imageGenerationUsed, false);
  assert.equal(plan.layers[1].strokes[0].tool, "inking-pen");
});

test("compiles layers and a replayable one-stroke-at-a-time command stream", () => {
  const compiled = compileDigitalArtistPlan(validPlan());
  assert.equal(compiled.layers.length, 3);
  assert.equal(compiled.steps.length, 3);
  assert.deepEqual(compiled.steps.map(step => step.strokeId), ["stroke-01", "stroke-02", "stroke-03"]);
  assert.equal(compiled.audit.orderedSteps, true);
  assert.equal(compiled.audit.editableVectorLayers, true);
  assert.equal(compiled.audit.rasterPayloadCount, 0);
  assert.equal(getDigitalArtistStep(compiled, 1).intent, "Ink the outer face contour.");
  assert.equal(getDigitalArtistStep(compiled, 3), null);
});

test("rejects raster payloads and image data URLs", () => {
  const a = validPlan();
  a.identity.imageData = "data:image/png;base64,AAAA";
  assert.throws(() => validateDigitalArtistPlan(a), /Raster image payload field is forbidden/);
  const b = validPlan();
  b.layers[0].strokes[0].operation.dataUrl = "data:image/png;base64,AAAA";
  assert.throws(() => validateDigitalArtistPlan(b), /Raster image payload field is forbidden/);
});

test("rejects duplicate identifiers and unsupported drawing tools", () => {
  const a = validPlan();
  a.layers[1].strokes[0].id = "stroke-01";
  assert.throws(() => validateDigitalArtistPlan(a), /Duplicate stroke id/);
  const b = validPlan();
  b.layers[0].strokes[0].tool = "diffusion";
  assert.throws(() => validateDigitalArtistPlan(b), /Unsupported drawing tool/);
});

test("rejects invalid stage order, out-of-canvas geometry and malformed paths", () => {
  const a = validPlan();
  a.layers.reverse();
  assert.throws(() => validateDigitalArtistPlan(a), /studio drawing order/);
  const b = validPlan();
  b.layers[0].strokes[0].operation.d = "M -10 20 L 50 60";
  assert.throws(() => validateDigitalArtistPlan(b), /extends outside/);
  const c = validPlan();
  c.layers[0].strokes[0].operation.d = "M 0 0 X 20";
  assert.throws(() => validateDigitalArtistPlan(c), /SVG|أمر/);
});

test("rejects invisible strokes and invalid identity digests", () => {
  const a = validPlan();
  a.layers[0].strokes[0].operation = path("M 10 10 L 40 40", "none", "none");
  assert.throws(() => validateDigitalArtistPlan(a), /neither a visible outline nor a fill/);
  const b = validPlan();
  b.identity.referenceDigest = "not-a-hash";
  assert.throws(() => validateDigitalArtistPlan(b), /SHA-256/);
});
