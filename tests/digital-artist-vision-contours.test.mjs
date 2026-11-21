import test from "node:test";
import assert from "node:assert/strict";
import { validateAnimeVisionReport } from "../app/digital-artist-vision-contract.mjs";
import { buildAnimeVisionBrushPlan } from "../app/digital-artist-vision-brush-planner.mjs";

const digest = "a".repeat(64);
const report = contour => ({
  format: "zero-studio-anime-vision-report",
  version: 1,
  referenceDigest: digest,
  subject: "anime portrait",
  style: "clean anime",
  composition: "head and shoulders",
  landmarks: [],
  regions: [{
    id: "face-region",
    label: "face skin",
    x: 0.2, y: 0.1, width: 0.5, height: 0.7,
    confidence: 0.98,
    ...(contour ? { contour } : {})
  }],
  palette: [{ id: "skin-swatch", label: "skin", color: "#e8b49a", confidence: 0.99 }]
});

test("vision contract preserves a reviewed organic polygon contour", () => {
  const contour = [
    { x: 0.45, y: 0.12 },
    { x: 0.68, y: 0.25 },
    { x: 0.64, y: 0.62 },
    { x: 0.5, y: 0.78 },
    { x: 0.31, y: 0.62 },
    { x: 0.27, y: 0.25 }
  ];
  const validated = validateAnimeVisionReport(report(contour));
  assert.deepEqual(validated.regions[0].contour, contour);
});

test("vision contract rejects contours with zero area or repeated adjacent points", () => {
  assert.throws(() => validateAnimeVisionReport(report([
    { x: 0.2, y: 0.2 }, { x: 0.4, y: 0.4 }, { x: 0.6, y: 0.6 }
  ])), /measurable area/);
  assert.throws(() => validateAnimeVisionReport(report([
    { x: 0.2, y: 0.2 }, { x: 0.2, y: 0.2 }, { x: 0.6, y: 0.6 }
  ])), /duplicate consecutive/);
});

test("planner maps reviewed contour points to native raster fill coordinates", () => {
  const contour = [
    { x: 0.45, y: 0.12 },
    { x: 0.68, y: 0.25 },
    { x: 0.64, y: 0.62 },
    { x: 0.5, y: 0.78 },
    { x: 0.31, y: 0.62 },
    { x: 0.27, y: 0.25 }
  ];
  const result = buildAnimeVisionBrushPlan(report(contour), { minimumConfidence: 0.7 });
  const fill = result.plan.layers.flatMap(layer => layer.strokes).find(stroke => stroke.id === "vision-region-face-region");
  assert.ok(fill);
  assert.deepEqual(fill.points.map(({ x, y }) => ({ x, y })), contour.map(point => ({
    x: Math.round(point.x * 1920),
    y: Math.round(point.y * 1080)
  })));
  assert.equal(result.review.warnings.some(warning => warning.includes("rectangular bounding-box")), false);
  assert.equal(result.review.requiresHumanApproval, true);
});

test("planner retains the legacy rectangle fallback with an explicit warning", () => {
  const result = buildAnimeVisionBrushPlan(report(null));
  assert.ok(result.review.warnings.some(warning => warning.includes("rectangular bounding-box")));
});
