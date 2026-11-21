import test from "node:test";
import assert from "node:assert/strict";
import { createDigitalArtistDemoPlan } from "../app/digital-artist-demo-plan.mjs";
import { compileDigitalArtistBrushPlan } from "../app/digital-artist-brush-engine.mjs";

test("the deterministic Digital Artist demo plan compiles into a complete seven-layer native brush stream", () => {
  const plan = createDigitalArtistDemoPlan();
  const stream = compileDigitalArtistBrushPlan(plan);
  assert.equal(plan.layers.length, 7);
  assert.equal(stream.audit.layerCount, 7);
  assert.equal(stream.audit.strokeCount, 54);
  assert.equal(stream.audit.orderedSteps, true);
  assert.equal(stream.audit.vectorRequired, false);
  assert.equal(stream.imageGenerationUsed, false);
  assert.equal(stream.layers[0].role, "construction");
  assert.equal(stream.layers[6].role, "detail");
  assert.ok(stream.commands.every(command => command.options.brush));
});
