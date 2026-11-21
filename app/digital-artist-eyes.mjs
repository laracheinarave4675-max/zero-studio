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
  const angles = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    minPressure = Math.min(minPressure, p.pressure); maxPressure = Math.max(maxPressure, p.pressure);
    if (i > 0) {
      const dx = p.x - points[i - 1].x, dy = p.y - points[i - 1].y;
      length += Math.hypot(dx, dy);
      if (Math.hypot(dx, dy) > 0.001) angles.push(Math.atan2(dy, dx));
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
    bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
    pressureRange: { min: minPressure, max: maxPressure, spread: maxPressure - minPressure },
    closed: stroke.kind === "raster-region-fill" || (points.length > 2 && distance(points[0], points[points.length - 1]) <= 2)
  };
}

/** The identity/anatomy eye: compare named normalized landmarks to approved Character DNA. */
export function compareLandmarks(reference, current, options = {}) {
  if (!reference || !current || typeof reference !== "object" || typeof current !== "object") fail("Two landmark maps are required.");
  const tolerance = Number.isFinite(Number(options.tolerance)) ? clamp(Number(options.tolerance), 0, 1) : 0.025;
  const names = Object.keys(reference).filter(name => current[name]);
  if (!names.length) fail("No corresponding named landmarks were found.");
  const measurements = names.map(name => {
    const a = reference[name], b = current[name];
    if (![a?.x, a?.y, b?.x, b?.y].every(value => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 1)) {
      fail("Landmark " + name + " must use normalized coordinates from 0 to 1.");
    }
    const delta = distance({ x: Number(a.x), y: Number(a.y) }, { x: Number(b.x), y: Number(b.y) });
    return { name, deviation: delta, withinTolerance: delta <= tolerance };
  });
  const mean = measurements.reduce((sum, item) => sum + item.deviation, 0) / measurements.length;
  return {
    compared: measurements.length,
    meanDeviation: mean,
    maxDeviation: Math.max(...measurements.map(item => item.deviation)),
    tolerance,
    passed: measurements.every(item => item.withinTolerance),
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
  const names = Object.keys(reference).filter(name => current[name]);
  if (!names.length) fail("No corresponding named palette swatches were found.");
  const swatches = names.map(name => {
    const a = hexToRgb(reference[name]), b = hexToRgb(current[name]);
    const delta = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    return { name, distance: delta, passed: delta <= tolerance };
  });
  return {
    compared: swatches.length,
    meanDistance: swatches.reduce((sum, item) => sum + item.distance, 0) / swatches.length,
    maxDistance: Math.max(...swatches.map(item => item.distance)),
    tolerance,
    passed: swatches.every(item => item.passed),
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
