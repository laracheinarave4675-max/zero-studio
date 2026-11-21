import test from "node:test";
import assert from "node:assert/strict";
import { createKimonoSideWalkChart, getKimonoSideWalkFrameBrief, KIMONO_WALK_REFERENCE } from "../app/kimono-side-walk-chart.mjs";

test("kimono walk chart binds the retrieved gallery identity and 24 fps target", () => {
  const chart = createKimonoSideWalkChart();
  assert.equal(chart.reference.galleryAssetId, "be172712-e073-4d06-9587-eec7e6c62a84");
  assert.equal(chart.reference.view, "side");
  assert.equal(chart.fps, 24);
  assert.equal(chart.totalFrames, 24);
  assert.equal(chart.artistRedrawsRequired, 24);
});

test("all 24 artist tasks are unique timepoints with a complete redraw requirement", () => {
  const chart = createKimonoSideWalkChart();
  assert.equal(new Set(chart.frames.map(frame => frame.frameIndex)).size, 24);
  for (const frame of chart.frames) {
    assert.equal(frame.frameNumber, frame.frameIndex + 1);
    assert.equal(frame.drawingRequirement, "complete-independent-character-redraw");
    assert.equal(frame.exposureFrames, 1);
    assert.equal(frame.finalArtwork, null);
    assert.ok(frame.description.length > 20);
  }
});

test("five required key drawing positions cover the walk cycle including endpoints", () => {
  const chart = createKimonoSideWalkChart();
  const keys = chart.frames.filter(frame => frame.kind === "key-drawing").map(frame => frame.frameIndex);
  assert.deepEqual(keys, [0, 6, 12, 18, 23]);
  assert.equal(getKimonoSideWalkFrameBrief(23).phase, "settle");
});

test("intermediate tasks name their adjacent key drawings without faking anatomy coordinates", () => {
  const task = getKimonoSideWalkFrameBrief(9);
  assert.equal(task.kind, "inbetween-drawing");
  assert.equal(task.fromKeyFrame, 6);
  assert.equal(task.toKeyFrame, 12);
  assert.equal("joints" in task, false);
  assert.equal(createKimonoSideWalkChart().uniqueFinalDrawings, 0);
});

test("walk chart rejects out-of-range frame requests", () => {
  assert.throws(() => getKimonoSideWalkFrameBrief(-1), /بين 0 و23/);
  assert.throws(() => getKimonoSideWalkFrameBrief(24), /بين 0 و23/);
});
