/**
 * ZERO STUDIO vision-to-drawing contract.
 *
 * This module validates observations produced by a vision model. It does not
 * claim to perform inference and never turns untrusted model text into strokes.
 * A later geometry planner must explicitly translate reviewed observations
 * into native raster brush commands.
 */
export const ANIME_VISION_REPORT_FORMAT = "zero-studio-anime-vision-report";
export const ANIME_VISION_REPORT_VERSION = 1;
export const ANIME_VISION_MAX_LANDMARKS = 128;
export const ANIME_VISION_MAX_REGIONS = 64;
export const ANIME_VISION_MAX_SWATCHES = 32;

const fail = message => { throw new Error(message); };
const text = (value, limit) => String(value ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, limit);
const finite = value => typeof value === "number" && Number.isFinite(value);
const unit = (value, label) => {
  if (!finite(value) || value < 0 || value > 1) fail(label + " must be normalized between 0 and 1.");
  return value;
};
const safeId = (value, label) => {
  const id = text(value, 80);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(id)) fail(label + " must be a stable identifier.");
  return id;
};

/** Validate a compact, provider-neutral report about a supplied reference image. */
export function validateAnimeVisionReport(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) fail("A vision report object is required.");
  if (JSON.stringify(input).length > 256 * 1024) fail("The vision report exceeds the 256 KiB safety limit.");
  if (input.format !== ANIME_VISION_REPORT_FORMAT || input.version !== ANIME_VISION_REPORT_VERSION) {
    fail("Unsupported anime vision report format or version.");
  }
  const referenceDigest = text(input.referenceDigest, 80);
  if (!/^(?:sha256:)?[a-f0-9]{64}$/i.test(referenceDigest)) fail("A SHA-256 reference digest is required.");
  const subject = text(input.subject, 240);
  const style = text(input.style, 160);
  const composition = text(input.composition, 240);
  if (!subject || !style || !composition) fail("Subject, style, and composition observations are required.");

  const landmarksInput = input.landmarks ?? [];
  const regionsInput = input.regions ?? [];
  const swatchesInput = input.palette ?? [];
  if (!Array.isArray(landmarksInput) || landmarksInput.length > ANIME_VISION_MAX_LANDMARKS) fail("Vision landmark count is invalid.");
  if (!Array.isArray(regionsInput) || regionsInput.length > ANIME_VISION_MAX_REGIONS) fail("Vision region count is invalid.");
  if (!Array.isArray(swatchesInput) || swatchesInput.length > ANIME_VISION_MAX_SWATCHES) fail("Vision palette count is invalid.");

  const ids = new Set();
  const landmarks = landmarksInput.map(item => {
    const id = safeId(item?.id, "Landmark id");
    if (ids.has(id)) fail("Duplicate vision observation id: " + id + ".");
    ids.add(id);
    const confidence = unit(item.confidence, "Landmark confidence");
    return { id, label: text(item.label, 100), x: unit(item.x, "Landmark x"), y: unit(item.y, "Landmark y"), confidence };
  });
  const regions = regionsInput.map(item => {
    const id = safeId(item?.id, "Region id");
    if (ids.has(id)) fail("Duplicate vision observation id: " + id + ".");
    ids.add(id);
    const x = unit(item.x, "Region x"), y = unit(item.y, "Region y");
    const width = unit(item.width, "Region width"), height = unit(item.height, "Region height");
    if (width <= 0 || height <= 0 || x + width > 1 || y + height > 1) fail("Vision region must have a positive box fully inside the reference.");
    let contour;
    if (item.contour !== undefined) {
      if (!Array.isArray(item.contour) || item.contour.length < 3 || item.contour.length > 512) fail("A region contour must contain 3–512 normalized points.");
      contour = item.contour.map((point, index) => ({
        x: unit(point?.x, "Region contour x"),
        y: unit(point?.y, "Region contour y")
      }));
      for (let index = 0; index < contour.length; index++) {
        const current = contour[index], next = contour[(index + 1) % contour.length];
        if (Math.hypot(current.x - next.x, current.y - next.y) < 0.00001) fail("A region contour contains duplicate consecutive points.");
      }
      let twiceArea = 0;
      for (let index = 0; index < contour.length; index++) {
        const current = contour[index], next = contour[(index + 1) % contour.length];
        twiceArea += current.x * next.y - next.x * current.y;
      }
      if (Math.abs(twiceArea) < 0.000001) fail("A region contour must enclose a measurable area.");
    }
    return { id, label: text(item.label, 100), x, y, width, height, ...(contour ? { contour } : {}), confidence: unit(item.confidence, "Region confidence") };
  });
  const palette = swatchesInput.map(item => {
    const id = safeId(item?.id, "Palette id");
    if (ids.has(id)) fail("Duplicate vision observation id: " + id + ".");
    ids.add(id);
    const color = String(item.color ?? "");
    if (!/^#[0-9a-f]{6}$/i.test(color)) fail("Vision palette colors must be six-digit hex values.");
    return { id, label: text(item.label, 80), color: color.toLowerCase(), confidence: unit(item.confidence, "Palette confidence") };
  });

  const identityLocks = Array.isArray(input.identityLocks)
    ? [...new Set(input.identityLocks.map(value => text(value, 100)).filter(Boolean))].slice(0, 32)
    : [];
  const notes = Array.isArray(input.notes) ? input.notes.map(value => text(value, 180)).filter(Boolean).slice(0, 24) : [];
  return {
    format: ANIME_VISION_REPORT_FORMAT,
    version: ANIME_VISION_REPORT_VERSION,
    referenceDigest,
    subject, style, composition,
    landmarks, regions, palette, identityLocks, notes,
    inferenceStatus: "externally-produced-observations",
    drawingStatus: "not-yet-generated",
    requiresHumanReview: true
  };
}

/**
 * Produce an actionable brief for the geometry planner without fabricating
 * coordinates or brush strokes. Low-confidence observations stay flagged.
 */
export function buildAnimeVisionDrawingBrief(report, { minimumConfidence = 0.65 } = {}) {
  const vision = validateAnimeVisionReport(report);
  if (!finite(minimumConfidence) || minimumConfidence < 0 || minimumConfidence > 1) {
    fail("Minimum confidence must be between 0 and 1.");
  }
  const trustedLandmarks = vision.landmarks.filter(item => item.confidence >= minimumConfidence);
  const trustedRegions = vision.regions.filter(item => item.confidence >= minimumConfidence);
  const trustedPalette = vision.palette.filter(item => item.confidence >= minimumConfidence);
  return {
    format: "zero-studio-anime-vision-drawing-brief",
    version: 1,
    referenceDigest: vision.referenceDigest,
    subject: vision.subject,
    style: vision.style,
    composition: vision.composition,
    identityLocks: [...vision.identityLocks],
    constructionGuides: trustedLandmarks.map(({ id, label, x, y }) => ({ id, label, x, y })),
    paintRegions: trustedRegions.map(({ id, label, x, y, width, height }) => ({ id, label, x, y, width, height })),
    palette: trustedPalette.map(({ id, label, color }) => ({ id, label, color })),
    reviewQueue: [
      ...vision.landmarks.filter(item => item.confidence < minimumConfidence).map(item => ({ id: item.id, kind: "landmark", confidence: item.confidence })),
      ...vision.regions.filter(item => item.confidence < minimumConfidence).map(item => ({ id: item.id, kind: "region", confidence: item.confidence })),
      ...vision.palette.filter(item => item.confidence < minimumConfidence).map(item => ({ id: item.id, kind: "palette", confidence: item.confidence }))
    ],
    source: "vision-observations",
    nativeBrushPlanCreated: false,
    imageGenerationUsed: false,
    requiresHumanReview: true
  };
}
