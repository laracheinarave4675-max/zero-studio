import test from "node:test";
import assert from "node:assert/strict";
import { createDigitalArtistCharacterSheetPlan } from "../app/digital-artist-character-sheet-plan.mjs";
import { compileDigitalArtistBrushPlan } from "../app/digital-artist-brush-engine.mjs";

const REFERENCE_ID = "be172712-e073-4d06-9587-eec7e6c62a84";

test("selected kimono reference is rendered as three distinct native-brush views", () => {
  const plan = createDigitalArtistCharacterSheetPlan();
  const stream = compileDigitalArtistBrushPlan(plan);
  const strokes = plan.layers.flatMap(layer => layer.strokes);

  assert.equal(plan.format, "zero-studio-digital-artist-brush-plan");
  assert.equal(plan.identity.characterAssetId, REFERENCE_ID);
  assert.equal(plan.layers.length, 7);
  assert.ok(stream.audit.strokeCount >= 100);
  assert.ok(strokes.length >= 100);

  for (const view of ["front", "side", "back"]) {
    assert.ok(strokes.some(stroke => stroke.id.startsWith(view + "-")),
      "missing " + view + " view strokes");
  }

  for (const required of [
    "front-face-outline",
    "front-left-eye",
    "front-right-eye",
    "front-kimono-outline",
    "side-face-outline",
    "side-kimono-outline",
    "back-hair-outline",
    "back-kimono-outline"
  ]) {
    assert.ok(strokes.some(stroke => stroke.id === required), "missing " + required);
  }

  const ids = strokes.map(stroke => stroke.id);
  assert.equal(new Set(ids).size, ids.length, "stroke IDs must be unique");
  assert.ok(plan.layers.some(layer => layer.role === "flat-color"));
  assert.ok(plan.layers.some(layer => layer.role === "clean-line"));
  assert.ok(plan.layers.some(layer => layer.role === "detail"));
  assert.ok(strokes.some(stroke => stroke.kind === "region-fill"));
  assert.ok(strokes.some(stroke => stroke.brush === "ink"));
});

test("the character-sheet test remains a native drawing proof, not generated image output", () => {
  const plan = createDigitalArtistCharacterSheetPlan();
  const strokes = plan.layers.flatMap(layer => layer.strokes);
  assert.equal(plan.identity.characterAssetId, REFERENCE_ID);
  assert.ok(strokes.every(stroke => Array.isArray(stroke.points) && stroke.points.length >= 2));
  assert.ok(strokes.every(stroke => Number.isInteger(stroke.seed)));
  assert.ok(!JSON.stringify(plan).includes("data:image/"));
});
