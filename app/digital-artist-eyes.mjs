const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const fail = message => { throw new Error(message); };
const hexToRgb = value => {
  const match = /^#([0-9a-f]{6})$/i.exec(String(value ?? ""));
  if (!match) fail("A six-digit hex color is required.");
  const hex = match[1];
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
};
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pointInPolygon = (x, y, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    const crosses = ((a.y > y) !== (b.y > y)) && (x < (b.x - a.x) * (y - a.y) / ((b.y - a.y) || Number.EPSILON) + a.x);
    if (crosses) inside = !inside;
  }
  return inside;
};
function validatePixels(imageData) {
  const width = Number(imageData?.width), height = Number(imageData?.height), data = imageData?.data;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 4096 || height > 4096) {
    fail("Raster inspection needs valid dimensions no larger than 4096×4096.");
  }
  if (!data || typeof data.length !== "number" || data.length !== width * height * 4) fail("Raster inspection needs width × height × 4 RGBA samples.");
  return { width, height, data };
}

/** The artist's raster eye: silhouette bounds, coverage, centroid and coarse palette. */
export function analyzeRasterPixels(imageData, options = {}) {
  const { width, height, data } = validatePixels(imageData);
  const alphaThreshold = Number.isFinite(Number(options.alphaThreshold)) ? clamp(Number(options.alphaThreshold), 0, 255) : 16;
  const quantization = Number.isInteger(options.quantization) ? clamp(options.quantization, 2, 64) : 16;
  let minX = width, minY = height, maxX = -1, maxY = -1, visiblePixels = 0, alphaSum = 0, weightedX = 0, weightedY = 0;
  let perimeterPixels = 0;
  const palette = new Map();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4, alpha = data[offset + 3];
      if (alpha <= alphaThreshold) continue;
      visiblePixels++; alphaSum += alpha; weightedX += x * alpha; weightedY += y * alpha;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      const r = Math.round(data[offset] / quantization) * quantization;
      const g = Math.round(data[offset + 1] / quantization) * quantization;
      const b = Math.round(data[offset + 2] / quantization) * quantization;
      const key = [clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)].map(v => v.toString(16).padStart(2, "0")).join("");
      palette.set(key, (palette.get(key) || 0) + 1);
      const edge = x === 0 || y === 0 || x === width - 1 || y === height - 1 ||
        data[((y - 1) * width + x) * 4 + 3] <= alphaThreshold ||
        data[((y + 1) * width + x) * 4 + 3] <= alphaThreshold ||
        data[(y * width + x - 1) * 4 + 3] <= alphaThreshold ||
        data[(y * width + x + 1) * 4 + 3] <= alphaThreshold;
      if (edge) perimeterPixels++;
    }
  }
  const colors = [...palette.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([hex, count]) => ({
    color: "#" + hex, pixels: count, share: visiblePixels ? count / visiblePixels : 0
  }));
  return {
    width, height, visiblePixels, alphaCoverage: visiblePixels / (width * height),
    alphaMean: visiblePixels ? alphaSum / visiblePixels : 0,
    bounds: visiblePixels ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 } : null,
    centroid: visiblePixels ? { x: weightedX / alphaSum, y: weightedY / alphaSum } : null,
    perimeterPixels, perimeterToArea: visiblePixels ? perimeterPixels / visiblePixels : 0,
    quantizedColorCount: palette.size, dominantPalette: colors
  };
}

/** The line-art eye: measurable stroke length, turn severity, bounds and pressure range. */
export function analyzeStrokeGeometry(stroke) {
  if (!stroke || typeof stroke !== "object" || !Array.isArray(stroke.points) || stroke.points.length < 1 || stroke.points.length > 20000) {
    fail("Stroke inspection needs 1–20,000 points.");
  }
  const points = stroke.points.map(point => {
    const x = Number(point?.x), y = Number(point?.y), pressure = Number(point?.pressure ?? 1);
    if (![x, y, pressure].every(Number.isFinite)) fail("Stroke inspection found a non-finite sample.");
    return { x, y, pressure };
  });
  let length = 0, sharpTurns = 0, minPressure = 1, maxPressure = 0;
  let duplicateSegments = 0, tinySegments = 0, abruptPressureChanges = 0;
  const angles = [], segmentLengths = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    minPressure = Math.min(minPressure, p.pressure); maxPressure = Math.max(maxPressure, p.pressure);
    if (i > 0) {
      const dx = p.x - points[i - 1].x, dy = p.y - points[i - 1].y;
      const segmentLength = Math.hypot(dx, dy);
      length += segmentLength;
      segmentLengths.push(segmentLength);
      if (segmentLength <= 0.001) duplicateSegments++;
      else {
        if (segmentLength < 0.35) tinySegments++;
        angles.push(Math.atan2(dy, dx));
      }
      if (Math.abs(p.pressure - points[i - 1].pressure) >= 0.45) abruptPressureChanges++;
    }
  }
  for (let i = 1; i < angles.length; i++) {
    let delta = Math.abs(angles[i] - angles[i - 1]);
    if (delta > Math.PI) delta = 2 * Math.PI - delta;
    if (delta > Math.PI * 0.72) sharpTurns++;
  }
  return {
    id: String(stroke.id ?? stroke.strokeId ?? ""),
    intent: String(stroke.intent ?? ""),
    kind: stroke.kind === "raster-region-fill" ? "region-fill" : "brush-stroke",
    sampleCount: points.length, length, sharpTurns,
    segmentQuality: {
      segmentCount: segmentLengths.length, duplicateSegments, tinySegments,
      abruptPressureChanges,
      minimumSegmentLength: segmentLengths.length ? Math.min(...segmentLengths) : 0,
      meanSegmentLength: segmentLengths.length ? length / segmentLengths.length : 0
    },
    warnings: [
      ...(length <= 0.001 && stroke.kind !== "raster-region-fill" ? ["zero-length-stroke"] : []),
      ...(duplicateSegments ? ["duplicate-consecutive-points"] : []),
      ...(tinySegments > Math.max(3, segmentLengths.length * 0.2) ? ["over-sampled-micro-segments"] : []),
      ...(sharpTurns > Math.max(2, angles.length * 0.35) ? ["excessive-direction-changes"] : []),
      ...(abruptPressureChanges > Math.max(2, segmentLengths.length * 0.25) ? ["unstable-pressure"] : [])
    ],
    bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
    pressureRange: { min: minPressure, max: maxPressure, spread: maxPressure - minPressure },
    closed: stroke.kind === "raster-region-fill" || (points.length > 2 && distance(points[0], points[points.length - 1]) <= 2)
  };
}

/** The identity/anatomy eye: compare named normalized landmarks to approved Character DNA. */
export function compareLandmarks(reference, current, options = {}) {
  if (!reference || !current || typeof reference !== "object" || typeof current !== "object") fail("Two landmark maps are required.");
  const tolerance = Number.isFinite(Number(options.tolerance)) ? clamp(Number(options.tolerance), 0, 1) : 0.025;
  const names = Object.keys(reference);
  if (!names.length) fail("The approved reference has no named landmarks.");
  const measurements = names.map(name => {
    const a = reference[name], b = current[name];
    if (![a?.x, a?.y].every(value => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 1)) {
      fail("Reference landmark " + name + " must use normalized coordinates from 0 to 1.");
    }
    if (!b) return { name, deviation: null, withinTolerance: false, missing: true };
    if (![b?.x, b?.y].every(value => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 1)) {
      fail("Current landmark " + name + " must use normalized coordinates from 0 to 1.");
    }
    const delta = distance({ x: Number(a.x), y: Number(a.y) }, { x: Number(b.x), y: Number(b.y) });
    return { name, deviation: delta, withinTolerance: delta <= tolerance, missing: false };
  });
  const measured = measurements.filter(item => Number.isFinite(item.deviation));
  const missing = measurements.filter(item => item.missing).map(item => item.name);
  const mean = measured.length ? measured.reduce((sum, item) => sum + item.deviation, 0) / measured.length : null;
  return {
    compared: measured.length, missing,
    meanDeviation: mean,
    maxDeviation: measured.length ? Math.max(...measured.map(item => item.deviation)) : null,
    tolerance,
    passed: missing.length === 0 && measured.length > 0 && measurements.every(item => item.withinTolerance),
    measurements
  };
}

const ANATOMY_BONE_PAIRS = Object.freeze({
  upperArmL:["shoulderL","elbowL"], lowerArmL:["elbowL","wristL"],
  upperArmR:["shoulderR","elbowR"], lowerArmR:["elbowR","wristR"],
  thighL:["hipL","kneeL"], shinL:["kneeL","ankleL"],
  thighR:["hipR","kneeR"], shinR:["kneeR","ankleR"],
  torso:["pelvis","chest"], neck:["chest","neck"], head:["neck","head"]
});

/**
 * Compare an approved pose guide with the character's fixed anatomical DNA.
 * Uses the same 16:9 normalized drawing-space metric as the anatomy engine.
 * This evaluates proportion drift, not visual contour accuracy.
 */
export function compareAnatomyGuideToDNA(dna, guide, options = {}) {
  if (!dna || dna.format !== "zero-studio-character-dna" || dna.version !== 1 ||
      !dna.anchorGuide?.joints || !dna.boneLengths) fail("An approved Character DNA record is required.");
  if (!guide || !guide.joints || typeof guide.joints !== "object") fail("A calibrated current anatomy guide is required.");
  if (String(guide.view || "") !== String(dna.canonicalView || "")) {
    return {
      compared: 0, skipped: true, passed: null, reason: "camera-view-mismatch",
      referenceView: dna.canonicalView, currentView: guide.view || null, measurements: []
    };
  }
  const tolerance = Number.isFinite(Number(options.relativeTolerance))
    ? clamp(Number(options.relativeTolerance), 0, 1) : 0.15;
  const point = (source, name) => {
    const x = Number(source?.[name]?.x), y = Number(source?.[name]?.y);
    if (![x, y].every(Number.isFinite) || x < 0 || x > 1 || y < 0 || y > 1) {
      fail("The current anatomy guide is missing a valid " + name + " landmark.");
    }
    return { x, y };
  };
  const length = (a, b) => Math.hypot((b.x - a.x) * (16 / 9), b.y - a.y);
  const measurements = Object.entries(ANATOMY_BONE_PAIRS).map(([name, [from, to]]) => {
    const expected = Number(dna.boneLengths[name]);
    if (!Number.isFinite(expected) || expected <= 0) fail("Character DNA has no valid " + name + " measurement.");
    const actual = length(point(guide.joints, from), point(guide.joints, to));
    const ratio = actual / expected;
    const deviation = Math.abs(ratio - 1);
    return { name, expected, actual, scaleRatio: ratio, relativeDeviation: deviation, passed: deviation <= tolerance };
  });
  return {
    compared: measurements.length,
    skipped: false,
    meanRelativeDeviation: measurements.reduce((sum, item) => sum + item.relativeDeviation, 0) / measurements.length,
    maxRelativeDeviation: Math.max(...measurements.map(item => item.relativeDeviation)),
    relativeTolerance: tolerance,
    passed: measurements.every(item => item.passed),
    measurements
  };
}

/** The color eye: compare approved named palette swatches against a rendered palette. */
export function comparePalette(reference, current, options = {}) {
  if (!reference || !current || typeof reference !== "object" || typeof current !== "object") fail("Two named palettes are required.");
  const tolerance = Number.isFinite(Number(options.tolerance)) ? clamp(Number(options.tolerance), 0, 441.7) : 32;
  const names = Object.keys(reference);
  if (!names.length) fail("The approved reference has no named palette swatches.");
  const swatches = names.map(name => {
    const a = hexToRgb(reference[name]);
    if (!current[name]) return { name, distance: null, passed: false, missing: true };
    const b = hexToRgb(current[name]);
    const delta = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    return { name, distance: delta, passed: delta <= tolerance, missing: false };
  });
  const measured = swatches.filter(item => Number.isFinite(item.distance));
  const missing = swatches.filter(item => item.missing).map(item => item.name);
  return {
    compared: measured.length, missing,
    meanDistance: measured.length ? measured.reduce((sum, item) => sum + item.distance, 0) / measured.length : null,
    maxDistance: measured.length ? Math.max(...measured.map(item => item.distance)) : null,
    tolerance,
    passed: missing.length === 0 && measured.length > 0 && swatches.every(item => item.passed),
    swatches
  };
}

/** The fill eye: inspect one or more same-color polygons as a single semantic region group. */
export function inspectRegionFillGroup(imageData, polygons, expectedColor, options = {}) {
  const { width, height, data } = validatePixels(imageData);
  if (!Array.isArray(polygons) || polygons.length < 1 || polygons.length > 512) fail("Fill inspection needs 1–512 region polygons.");
  const normalized = polygons.map((polygon, polygonIndex) => {
    if (!Array.isArray(polygon) || polygon.length < 3 || polygon.length > 20000) fail("Fill polygon " + (polygonIndex + 1) + " needs at least three points.");
    return polygon.map(point => {
      const x = Number(point?.x), y = Number(point?.y);
      if (![x, y].every(Number.isFinite) || x < 0 || y < 0 || x >= width || y >= height) fail("Fill inspection polygon is outside the raster.");
      return { x, y };
    });
  });
  const [r, g, b] = hexToRgb(expectedColor);
  const tolerance = Number.isFinite(Number(options.colorTolerance)) ? clamp(Number(options.colorTolerance), 0, 441.7) : 28;
  const stride = Number.isInteger(options.stride) ? clamp(options.stride, 1, 64) : 3;
  const margin = Number.isInteger(options.margin) ? clamp(options.margin, 0, 128) : 12;
  const allPoints = normalized.flat();
  const minX = Math.max(0, Math.floor(Math.min(...allPoints.map(p => p.x)) - margin));
  const maxX = Math.min(width - 1, Math.ceil(Math.max(...allPoints.map(p => p.x)) + margin));
  const minY = Math.max(0, Math.floor(Math.min(...allPoints.map(p => p.y)) - margin));
  const maxY = Math.min(height - 1, Math.ceil(Math.max(...allPoints.map(p => p.y)) + margin));
  let insideSamples = 0, insideMatches = 0, outsideSamples = 0, outsideMatches = 0;
  for (let y = minY; y <= maxY; y += stride) {
    for (let x = minX; x <= maxX; x += stride) {
      const inside = normalized.some(polygon => pointInPolygon(x + 0.5, y + 0.5, polygon));
      const offset = (y * width + x) * 4, alpha = data[offset + 3];
      const match = alpha > 16 && Math.hypot(data[offset] - r, data[offset + 1] - g, data[offset + 2] - b) <= tolerance;
      if (inside) { insideSamples++; if (match) insideMatches++; }
      else { outsideSamples++; if (match) outsideMatches++; }
    }
  }
  const insideCoverage = insideSamples ? insideMatches / insideSamples : 0;
  const outsideLeakage = outsideSamples ? outsideMatches / outsideSamples : 0;
  return {
    expectedColor, regionCount: normalized.length,
    insideSamples, insideMatches, insideCoverage,
    outsideSamples, outsideMatches, outsideLeakage,
    passed: insideSamples > 0 && insideCoverage >= (options.minimumCoverage ?? 0.9) &&
      outsideLeakage <= (options.maximumLeakage ?? 0.02)
  };
}

/** The single-region convenience form of the fill eye. */
export function inspectRegionFill(imageData, polygon, expectedColor, options = {}) {
  return inspectRegionFillGroup(imageData, [polygon], expectedColor, options);
}


const animePoint = (point, label) => {
  const x = Number(point?.x), y = Number(point?.y);
  if (![x, y].every(Number.isFinite) || x < 0 || x > 1 || y < 0 || y > 1) {
    fail(label + " must be a normalized point between 0 and 1.");
  }
  return { x, y };
};
const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const wrapAngle = angle => {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
};
function animeEyeMetrics(landmarks, side) {
  const prefix = side === "left" ? "eyeL" : "eyeR";
  const outer = animePoint(landmarks[prefix + "Outer"], prefix + "Outer");
  const inner = animePoint(landmarks[prefix + "Inner"], prefix + "Inner");
  const upper = animePoint(landmarks[prefix + "Upper"], prefix + "Upper");
  const lower = animePoint(landmarks[prefix + "Lower"], prefix + "Lower");
  const iris = animePoint(landmarks[prefix + "Iris"], prefix + "Iris");
  const pupil = animePoint(landmarks[prefix + "Pupil"], prefix + "Pupil");
  const width = distance(outer, inner);
  if (width < 0.002) fail(prefix + " width is too small to measure.");
  const center = midpoint(outer, inner);
  const eyeHeight = distance(upper, lower);
  const eyePolygon = [outer, upper, inner, lower];
  const irisInside = pointInPolygon(iris.x, iris.y, eyePolygon);
  const irisOffset = { x: (iris.x - center.x) / width, y: (iris.y - center.y) / width };
  const pupilOffset = { x: (pupil.x - iris.x) / width, y: (pupil.y - iris.y) / width };
  return {
    width, aspectRatio: eyeHeight / width,
    slant: Math.atan2(inner.y - outer.y, inner.x - outer.x),
    irisOffset, pupilOffset, irisInside,
    upperLidHeight: distance(upper, center) / width,
    lowerLidHeight: distance(lower, center) / width
  };
}

/**
 * Compare an anime eye design against the approved model sheet.
 * This measures normalized landmark geometry only; it does not infer landmarks
 * from pixels and deliberately does not impose one universal anime eye shape.
 */
export function compareAnimeEyeDesign(reference, current, options = {}) {
  if (!reference || !current || typeof reference !== "object" || typeof current !== "object") {
    fail("Approved and current anime eye landmark maps are required.");
  }
  const refFaceLeft = animePoint(reference.faceLeft, "reference faceLeft");
  const refFaceRight = animePoint(reference.faceRight, "reference faceRight");
  const curFaceLeft = animePoint(current.faceLeft, "current faceLeft");
  const curFaceRight = animePoint(current.faceRight, "current faceRight");
  const refFaceWidth = distance(refFaceLeft, refFaceRight);
  const curFaceWidth = distance(curFaceLeft, curFaceRight);
  if (refFaceWidth < 0.01 || curFaceWidth < 0.01) fail("Face width is too small for anime eye comparison.");
  const ref = { left: animeEyeMetrics(reference, "left"), right: animeEyeMetrics(reference, "right") };
  const cur = { left: animeEyeMetrics(current, "left"), right: animeEyeMetrics(current, "right") };
  const tolerances = {
    faceWidth: clamp(Number(options.faceWidthTolerance ?? 0.06), 0.005, 0.3),
    aspectRatio: clamp(Number(options.aspectRatioTolerance ?? 0.18), 0.01, 1),
    slant: clamp(Number(options.slantTolerance ?? 0.16), 0.01, 1),
    irisOffset: clamp(Number(options.irisOffsetTolerance ?? 0.12), 0.01, 0.8),
    eyeSpacing: clamp(Number(options.eyeSpacingTolerance ?? 0.07), 0.005, 0.3)
  };
  const checks = [];
  const add = (id, expected, actual, tolerance, unit) => {
    const deviation = Math.abs(actual - expected);
    checks.push({ id, expected, actual, deviation, tolerance, unit, passed: deviation <= tolerance });
  };
  for (const side of ["left", "right"]) {
    add(side + "-eye-width", ref[side].width / refFaceWidth, cur[side].width / curFaceWidth, tolerances.faceWidth, "face-width-ratio");
    add(side + "-eye-aspect", ref[side].aspectRatio, cur[side].aspectRatio, tolerances.aspectRatio, "ratio");
    add(side + "-eye-slant", ref[side].slant, cur[side].slant, tolerances.slant, "radians");
    add(side + "-iris-x", ref[side].irisOffset.x, cur[side].irisOffset.x, tolerances.irisOffset, "eye-width-ratio");
    add(side + "-iris-y", ref[side].irisOffset.y, cur[side].irisOffset.y, tolerances.irisOffset, "eye-width-ratio");
    checks.push({ id: side + "-iris-contained", expected: true, actual: cur[side].irisInside, deviation: cur[side].irisInside ? 0 : 1, tolerance: 0, unit: "boolean", passed: cur[side].irisInside });
  }
  const eyeGap = (map, faceWidth) => {
    const left = midpoint(animePoint(map.eyeLOuter, "eyeLOuter"), animePoint(map.eyeLInner, "eyeLInner"));
    const right = midpoint(animePoint(map.eyeROuter, "eyeROuter"), animePoint(map.eyeRInner, "eyeRInner"));
    return distance(left, right) / faceWidth;
  };
  add("eye-pair-spacing", eyeGap(reference, refFaceWidth), eyeGap(current, curFaceWidth), tolerances.eyeSpacing, "face-width-ratio");
  const failed = checks.filter(item => !item.passed);
  return {
    format: "zero-studio-anime-eye-comparison", version: 1,
    compared: checks.length, passed: failed.length === 0,
    referenceFaceWidth: refFaceWidth, currentFaceWidth: curFaceWidth,
    checks, failures: failed.map(item => item.id),
    measurementScope: "normalized-approved-landmarks-not-pixel-inference"
  };
}

/**
 * Compare directional hair clumps with a character's approved hair model sheet.
 * Each clump is represented by a root and tip landmark; this is a geometry check,
 * not automatic strand segmentation.
 */
export function compareAnimeHairFlow(reference, current, options = {}) {
  if (!Array.isArray(reference) || !Array.isArray(current) || reference.length < 3 || current.length < 3 ||
      reference.length > 64 || current.length > 64) fail("Anime hair-flow comparison needs 3–64 reference and current clumps.");
  const headWidth = Number(options.headWidth ?? 1);
  if (!Number.isFinite(headWidth) || headWidth <= 0 || headWidth > 2) fail("A positive normalized head width is required.");
  const angleTolerance = clamp(Number(options.angleTolerance ?? 0.28), 0.01, Math.PI);
  const lengthTolerance = clamp(Number(options.lengthTolerance ?? 0.2), 0.01, 1);
  const normalize = (items, label) => {
    const ids = new Set();
    return new Map(items.map((item, index) => {
      const id = String(item?.id ?? "");
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,79}$/.test(id) || ids.has(id)) fail(label + " hair clump IDs must be unique and stable.");
      ids.add(id);
      const root = animePoint(item.root, label + " " + id + " root");
      const tip = animePoint(item.tip, label + " " + id + " tip");
      const dx = tip.x - root.x, dy = tip.y - root.y;
      const length = Math.hypot(dx, dy);
      if (length < 0.002) fail(label + " hair clump " + id + " is too short.");
      return [id, { id, angle: Math.atan2(dy, dx), length: length / headWidth }];
    }));
  };
  const ref = normalize(reference, "reference"), cur = normalize(current, "current");
  const checks = [];
  for (const [id, expected] of ref) {
    const actual = cur.get(id);
    if (!actual) {
      checks.push({ id, passed: false, missing: true, angleDeviation: null, lengthDeviation: null });
      continue;
    }
    const angleDeviation = Math.abs(wrapAngle(actual.angle - expected.angle));
    const lengthDeviation = Math.abs(actual.length - expected.length) / Math.max(expected.length, 0.001);
    checks.push({ id, passed: angleDeviation <= angleTolerance && lengthDeviation <= lengthTolerance,
      missing: false, angleDeviation, lengthDeviation, angleTolerance, lengthTolerance });
  }
  for (const id of cur.keys()) if (!ref.has(id)) checks.push({ id, passed: false, unexpected: true, angleDeviation: null, lengthDeviation: null });
  return {
    format: "zero-studio-anime-hair-flow-comparison", version: 1,
    compared: checks.filter(item => !item.missing && !item.unexpected).length,
    passed: checks.length === reference.length && checks.every(item => item.passed),
    checks, failures: checks.filter(item => !item.passed).map(item => item.id),
    measurementScope: "approved-root-tip-landmarks-not-automatic-strand-segmentation"
  };
}
