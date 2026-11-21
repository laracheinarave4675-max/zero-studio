import test from "node:test";
import assert from "node:assert/strict";
import { buildArtistCorrectionPlan } from "../app/digital-artist-corrections.mjs";

test("stroke warnings become specific corrections linked to the original stroke", () => {
  const plan = buildArtistCorrectionPlan({
    strokeWarnings: [
      { id: "face/jaw-01", code: "zero-length-stroke" },
      { id: "hair/lock-02", code: "unstable-pressure" },
      { id: "unknown", code: "not-a-real-warning" }
    ]
  });
  assert.equal(plan.summary.total, 2);
  assert.equal(plan.suggestions[0].targetStrokeId, "face/jaw-01");
  assert.equal(plan.suggestions[0].skillId, "anime-inking");
  assert.match(plan.suggestions[0].action, /أعد رسم/);
  assert.equal(plan.suggestions[1].code, "unstable-pressure");
  assert.equal(plan.suggestions[0].autoApplied, false);
  assert.equal(plan.suggestions[0].requiresArtistApproval, true);
});

test("repeated warnings for the same stroke are deduplicated but different strokes remain", () => {
  const plan = buildArtistCorrectionPlan({
    strokeWarnings: [
      { id: "stroke-1", code: "duplicate-consecutive-points" },
      { id: "stroke-1", code: "duplicate-consecutive-points" },
      { id: "stroke-2", code: "duplicate-consecutive-points" }
    ]
  });
  assert.equal(plan.summary.total, 2);
  assert.deepEqual(plan.suggestions.map(item => item.targetStrokeId), ["stroke-1", "stroke-2"]);
});

test("failed region fills map to the flat-color lesson with measurable acceptance criteria", () => {
  const plan = buildArtistCorrectionPlan({
    fillEyes: [
      { id: "hair-fill", passed: false, insideCoverage: 0.6, outsideLeakage: 0.08 },
      { id: "skin-fill", passed: true, insideCoverage: 1, outsideLeakage: 0 }
    ]
  });
  assert.equal(plan.summary.total, 1);
  assert.equal(plan.suggestions[0].skillId, "flat-color-groups");
  assert.equal(plan.suggestions[0].severity, "high");
  assert.match(plan.suggestions[0].success, /88%/);
});

test("anatomy deviations create one correction per failed measured bone, not for skipped comparisons", () => {
  const plan = buildArtistCorrectionPlan({
    characterIdentity: { anatomy: {
      skipped: false, passed: false,
      measurements: [
        { name: "upperArmL", passed: false, relativeDeviation: 0.35 },
        { name: "torso", passed: true, relativeDeviation: 0.01 },
        { name: "shinR", passed: false, relativeDeviation: 0.12 }
      ]
    } }
  });
  assert.equal(plan.summary.total, 2);
  assert.equal(plan.suggestions[0].skillId, "body-anatomy");
  assert.equal(plan.suggestions[0].severity, "high");
  assert.equal(plan.suggestions[1].severity, "medium");
  const skipped = buildArtistCorrectionPlan({ characterIdentity: { anatomy: { skipped: true, passed: null } } });
  assert.equal(skipped.summary.total, 0);
});

test("correction output is bounded, explicit about rule-based feedback and never edits artwork", () => {
  const strokeWarnings = Array.from({ length: 100 }, (_, i) => ({
    id: "stroke-" + i, code: "zero-length-stroke"
  }));
  const plan = buildArtistCorrectionPlan({ strokeWarnings });
  assert.equal(plan.summary.total, 32);
  assert.equal(plan.learningClaim, "rule-based-feedback-only");
  assert.ok(plan.suggestions.every(item => item.autoApplied === false && item.requiresArtistApproval === true));
  assert.throws(() => buildArtistCorrectionPlan(null), /inspection report/);
});
