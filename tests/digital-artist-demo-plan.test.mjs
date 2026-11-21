import test from "node:test";
import assert from "node:assert/strict";
import { createDigitalArtistDemoPlan } from "../app/digital-artist-demo-plan.mjs";
import { compileDigitalArtistBrushPlan } from "../app/digital-artist-brush-engine.mjs";

test("the deterministic Digital Artist demo plan compiles into a complete seven-layer native brush stream", () => {
  const plan = createDigitalArtistDemoPlan();
  const stream = compileDigitalArtistBrushPlan(plan);
  assert.equal(plan.layers.length, 7);
  assert.equal(stream.audit.layerCount, 7);
  assert.equal(stream.audit.strokeCount, 62);
  assert.equal(stream.audit.orderedSteps, true);
  assert.equal(stream.audit.vectorRequired, false);
  assert.equal(stream.imageGenerationUsed, false);
  assert.equal(stream.layers[0].role, "construction");
  assert.equal(stream.layers[0].visible, false);
  assert.equal(stream.layers[1].visible, false);
  assert.equal(stream.layers[2].role, "flat-color");
  assert.equal(stream.layers[3].role, "clean-line");
  assert.equal(stream.layers[6].role, "detail");
  assert.equal(stream.commands.filter(command => command.kind === "raster-region-fill").length, 20);
  assert.ok(stream.commands.filter(command => command.kind === "raster-brush-stroke").every(command => command.options.brush));
});
