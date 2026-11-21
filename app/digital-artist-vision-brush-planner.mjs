import { buildAnimeVisionDrawingBrief } from "./digital-artist-vision-contract.mjs";
import {
  DIGITAL_ARTIST_BRUSH_FORMAT,
  DIGITAL_ARTIST_BRUSH_VERSION,
  validateDigitalArtistBrushPlan
} from "./digital-artist-brush-engine.mjs";

const CANVAS = Object.freeze({ width: 1920, height: 1080 });
const ROLE_ORDER = ["construction", "rough-sketch", "flat-color", "clean-line", "shadow", "highlight", "detail", "correction"];
const ROLE_RULES = [
  { role: "shadow", words: ["shadow", "shade", "dark"] },
  { role: "highlight", words: ["highlight", "shine", "gloss", "light"] },
  { role: "detail", words: ["eyebrow", "eyelash", "mouth", "nose", "freckle", "scar", "jewel", "detail"] },
  { role: "flat-color", words: ["hair", "face", "skin", "ear", "neck", "eye", "clothing", "shirt", "coat", "iris", "pupil", "background", "region", "color"] }
];
const clean = value => String(value ?? "").toLowerCase();
const matches = (label, word) => clean(label).includes(word);
const roleFor = label => ROLE_RULES.find(rule => rule.words.some(word => matches(label, word)))?.role ?? "flat-color";
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const safeId = value => String(value).replace(/[^a-zA-Z0-9._:-]/g, "-").slice(0, 72) || "observation";
const center = (x, y, pressure = 0.55) => ({ x, y, pressure });

function chooseColor(region, palette) {
  const label = clean(region.label);
  const tokens = label.split(/[^a-z0-9]+/).filter(token => token.length > 2);
  const ranked = palette.map(swatch => ({
    swatch,
    score: tokens.reduce((sum, token) => sum + (clean(swatch.label).includes(token) ? 1 : 0), 0)
  })).sort((a, b) => b.score - a.score);
  if (ranked[0]?.score > 0) return ranked[0].swatch.color;
  return palette[0]?.color ?? "#77727b";
}

function rectPolygon(region) {
  const x1 = Math.round(region.x * CANVAS.width);
  const y1 = Math.round(region.y * CANVAS.height);
  const x2 = Math.round((region.x + region.width) * CANVAS.width);
  const y2 = Math.round((region.y + region.height) * CANVAS.height);
  return [
    center(x1, y1), center(x2, y1),
    center(x2, y2), center(x1, y2)
  ];
}

/**
 * Convert reviewed vision observations into a conservative native brush plan.
 * Region boxes are explicitly approximated as rectangles; this is not contour
 * extraction, a segmentation model, or a finished character drawing.
 */
export function buildAnimeVisionBrushPlan(report, {
  minimumConfidence = 0.75,
  characterAssetId = "",
  approveObservations = false
} = {}) {
  const brief = buildAnimeVisionDrawingBrief(report, { minimumConfidence });
  const buckets = new Map();
  const ensure = role => {
    if (!buckets.has(role)) buckets.set(role, []);
    return buckets.get(role);
  };
  const warnings = [];
  if (!approveObservations) warnings.push("Human approval is required before executing this plan.");
  if (!brief.paintRegions.length) warnings.push("No sufficiently confident paint regions were supplied.");
  if (!brief.constructionGuides.length) warnings.push("No sufficiently confident construction landmarks were supplied.");

  if (brief.constructionGuides.length) {
    const strokes = ensure("construction");
    for (const landmark of brief.constructionGuides) {
      const x = Math.round(landmark.x * CANVAS.width);
      const y = Math.round(landmark.y * CANVAS.height);
      const radius = 8;
      strokes.push({
        id: "vision-guide-" + safeId(landmark.id),
        intent: "Mark reviewed reference landmark: " + (landmark.label || landmark.id),
        brush: "graphite",
        points: [center(clamp(x - radius, 0, CANVAS.width), y, 0.35), center(clamp(x + radius, 0, CANVAS.width), y, 0.35)],
        size: 2.5, color: "#8f8994", opacity: 0.8, texture: 0.05, seed: 1
      });
      strokes.push({
        id: "vision-guide-v-" + safeId(landmark.id),
        intent: "Mark vertical axis for reviewed reference landmark: " + (landmark.label || landmark.id),
        brush: "graphite",
        points: [center(x, clamp(y - radius, 0, CANVAS.height), 0.35), center(x, clamp(y + radius, 0, CANVAS.height), 0.35)],
        size: 2.5, color: "#8f8994", opacity: 0.8, texture: 0.05, seed: 1
      });
    }
    warnings.push("Landmarks are shown as small crosshair guides, not anatomical curves.");
  }

  for (const region of brief.paintRegions) {
    const role = roleFor(region.label);
    ensure(role).push({
      id: "vision-region-" + safeId(region.id),
      intent: "Approximate reviewed region bounds: " + (region.label || region.id),
      kind: "region-fill",
      points: rectPolygon(region),
      color: chooseColor(region, brief.palette),
      opacity: 0.88,
      blendMode: "normal",
      seed: 1
    });
    warnings.push("Region " + region.id + " uses a rectangular bounding-box approximation; its organic contour is not inferred.");
  }

  const layers = ROLE_ORDER.filter(role => buckets.has(role)).map(role => ({
    id: "vision-" + role,
    name: "Vision draft — " + role,
    role,
    visible: role !== "construction",
    locked: false,
    strokes: buckets.get(role)
  }));
  if (!layers.length) {
    throw new Error("The vision report has no high-confidence landmarks or regions to convert into drawing commands.");
  }

  const plan = validateDigitalArtistBrushPlan({
    format: DIGITAL_ARTIST_BRUSH_FORMAT,
    version: DIGITAL_ARTIST_BRUSH_VERSION,
    title: "Vision-guided anime draft — " + brief.subject,
    canvas: CANVAS,
    identity: { characterAssetId, referenceDigest: brief.referenceDigest },
    layers
  });
  return {
    plan,
    review: {
      approved: approveObservations === true,
      requiresHumanApproval: approveObservations !== true,
      reviewQueue: brief.reviewQueue,
      warnings: [...new Set(warnings)],
      approximation: "normalized-landmarks-and-rectangular-region-bounds",
      nativeRasterBrushPlan: true,
      imageGenerationUsed: false,
      inferencePerformed: false,
      estimatedStrokeCount: plan.strokeCount
    }
  };
}
