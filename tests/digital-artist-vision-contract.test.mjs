import test from "node:test";
import assert from "node:assert/strict";
import {
  ANIME_VISION_REPORT_FORMAT,
  buildAnimeVisionDrawingBrief,
  validateAnimeVisionReport
} from "../app/digital-artist-vision-contract.mjs";

const report = () => ({
  format: ANIME_VISION_REPORT_FORMAT,
  version: 1,
  referenceDigest: "a".repeat(64),
  subject: "Anime girl portrait",
  style: "clean cel-shaded anime",
  composition: "Centered head and shoulders",
  landmarks: [
    { id: "left-eye", label: "Left eye center", x: 0.42, y: 0.36, confidence: 0.96 },
    { id: "hair-tip", label: "Hair tip", x: 0.2, y: 0.12, confidence: 0.31 }
  ],
  regions: [
    { id: "hair", label: "Hair mass", x: 0.12, y: 0.04, width: 0.76, height: 0.52, confidence: 0.91 }
  ],
  palette: [
    { id: "hair-base", label: "Hair base", color: "#6b426f", confidence: 0.88 }
  ],
  identityLocks: ["preserve eye spacing", "preserve hair silhouette"],
  notes: ["Do not alter facial proportions."]
});

test("validates provider-neutral vision observations and normalized coordinates", () => {
  const value = validateAnimeVisionReport(report());
  assert.equal(value.landmarks.length, 2);
  assert.equal(value.palette[0].color, "#6b426f");
  assert.equal(value.requiresHumanReview, true);
  assert.equal(value.drawingStatus, "not-yet-generated");
});

test("builds a drawing brief and keeps low-confidence observations in review", () => {
  const brief = buildAnimeVisionDrawingBrief(report());
  assert.deepEqual(brief.constructionGuides.map(item => item.id), ["left-eye"]);
  assert.deepEqual(brief.paintRegions.map(item => item.id), ["hair"]);
  assert.deepEqual(brief.palette.map(item => item.color), ["#6b426f"]);
  assert.deepEqual(brief.reviewQueue.map(item => item.id), ["hair-tip"]);
  assert.equal(brief.nativeBrushPlanCreated, false);
  assert.equal(brief.imageGenerationUsed, false);
});

test("rejects invalid digest, out-of-range coordinates, invalid boxes and palette colors", () => {
  const a = report(); a.referenceDigest = "not-a-digest";
  assert.throws(() => validateAnimeVisionReport(a), /SHA-256/);
  const b = report(); b.landmarks[0].x = 1.1;
  assert.throws(() => validateAnimeVisionReport(b), /normalized between/);
  const c = report(); c.regions[0].width = 0.95;
  assert.throws(() => validateAnimeVisionReport(c), /fully inside/);
  const d = report(); d.palette[0].color = "purple";
  assert.throws(() => validateAnimeVisionReport(d), /six-digit hex/);
});

test("rejects duplicate observation ids and invalid confidence thresholds", () => {
  const a = report(); a.regions[0].id = "left-eye";
  assert.throws(() => validateAnimeVisionReport(a), /Duplicate vision observation id/);
  assert.throws(() => buildAnimeVisionDrawingBrief(report(), { minimumConfidence: 2 }), /between 0 and 1/);
});

test("sanitizes control characters and caps untrusted identity notes", () => {
  const value = report();
  value.subject = "Anime\nportrait\u0000";
  value.identityLocks = Array.from({ length: 40 }, (_, index) => "lock-" + index);
  value.notes = Array.from({ length: 30 }, (_, index) => "note-" + index);
  const result = validateAnimeVisionReport(value);
  assert.equal(result.subject, "Anime portrait");
  assert.equal(result.identityLocks.length, 32);
  assert.equal(result.notes.length, 24);
});

test("rejects oversized observation collections and out-of-canvas region boxes", () => {
  const value = report();
  value.landmarks = Array.from({ length: 129 }, (_, index) => ({
    id: "point-" + index, label: "point", x: 0.5, y: 0.5, confidence: 0.9
  }));
  assert.throws(() => validateAnimeVisionReport(value), /landmark count/);
  const region = report();
  region.regions[0].x = 0.5;
  assert.throws(() => validateAnimeVisionReport(region), /fully inside/);
});
