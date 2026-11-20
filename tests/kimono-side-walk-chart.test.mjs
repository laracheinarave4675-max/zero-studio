import test from "node:test";
import assert from "node:assert/strict";
import { createKimonoSideWalkChart, KIMONO_WALK_REFERENCE } from "../app/kimono-side-walk-chart.mjs";

test("kimono side-walk chart binds the exact gallery reference and 24 fps target", () => {
  const chart = createKimonoSideWalkChart();
  assert.equal(chart.reference.galleryAssetId, "be172712-e073-4d06-9587-eec7e6c62a84");
  assert.equal(chart.fps, 24);
  assert.equal(chart.totalFrames, 24);
  assert.equal(chart.artistRedrawsRequired, 24);
  assert.equal(KIMONO_WALK_REFERENCE.view, "side");
});

test("all 24 frames have distinct complete anatomy guides and explicit foot contacts", () => {
  const chart = createKimonoSideWalkChart();
  const signatures = chart.frames.map(frame => JSON.stringify(frame.joints));
  assert.equal(new Set(signatures).size, 24);
  for (const frame of chart.frames) {
    assert.equal(frame.view, "side");
    assert.equal(Object.keys(frame.joints).length, 19);
    assert.ok(frame.joints.kneeL && frame.joints.kneeR);
    assert.ok(frame.joints.ankleL && frame.joints.ankleR);
    assert.ok(frame.joints.toeL && frame.joints.toeR);
    assert.ok(["planted", "swing", "airborne"].includes(frame.contacts.footL));
    assert.ok(["planted", "swing", "airborne"].includes(frame.contacts.footR));
    assert.equal(frame.drawingRequirement, "complete-independent-character-redraw");
    assert.equal(frame.finalArtwork, null);
  }
});

test("five artist key-drawing positions cover the walk cycle", () => {
  const chart = createKimonoSideWalkChart();
  const keys = chart.frames.filter(frame => frame.kind === "key-drawing-guide").map(frame => frame.frame);
  assert.deepEqual(keys, [0, 6, 12, 18, 23]);
});

test("walk chart never misrepresents guides as finished animation drawings", () => {
  const chart = createKimonoSideWalkChart();
  assert.equal(chart.uniqueFinalDrawings, 0);
  assert.equal(chart.frames.filter(frame => frame.finalArtwork !== null).length, 0);
});
