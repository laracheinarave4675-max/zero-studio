// ZERO STUDIO — reference-preserving raster atlas and localized redraw prototype.
// Reuses approved source pixels for immutable identity regions; redraws only the foot motion zone.
// No image-model inference, SVG output, mesh deformation, or moving character-part sprites.
export const APPROVED_KIMONO_ATLAS_ID = "zero-approved-kimono-raster-atlas-v1";
export const APPROVED_KIMONO_ATLAS_FPS = 24;
export const APPROVED_KIMONO_ATLAS_FRAME_COUNT = 24;
export const APPROVED_KIMONO_ATLAS_LAYOUT = Object.freeze({
  sourceWidth: 1280,
  sourceHeight: 720,
  referenceGalleryId: "be172712-e073-4d06-9587-eec7e6c62a84",
  outputWidth: 256,
  outputHeight: 720,
  destination: Object.freeze({ x: 23, y: 20 }),
  // Native-pixel crops from the approved three-view sheet. No scaling is applied.
  crops: Object.freeze({
    sideFigure: Object.freeze({ x: 540, y: 24, width: 210, height: 680 }),
    faceAndHair: Object.freeze({ x: 575, y: 27, width: 160, height: 270 }),
    sleeveAndPattern: Object.freeze({ x: 620, y: 150, width: 110, height: 225 }),
    obiAndCord: Object.freeze({ x: 570, y: 225, width: 90, height: 92 }),
    kimonoPattern: Object.freeze({ x: 548, y: 410, width: 188, height: 205 }),
    hemAndLowerEdge: Object.freeze({ x: 548, y: 615, width: 195, height: 53 }),
    originalSandals: Object.freeze({ x: 565, y: 645, width: 150, height: 55 })
  }),
  motionZone: Object.freeze({
    y: 664,
    left: Object.freeze({ x: 60, y: 664, width: 68, height: 56 }),
    right: Object.freeze({ x: 119, y: 664, width: 68, height: 56 }),
    identityRegionHeight: 650
  })
});

const PALETTE = Object.freeze({
  paper: "#ffffff",
  ink: "#28232a",
  skin: "#f0d2c5",
  skinShade: "#d5a79e",
  sandal: "#a95762",
  sandalLight: "#d58b91",
  sandalDark: "#593b46",
  sole: "#3d3038"
});

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
function makeCanvas(createCanvas, width, height) {
  const canvas = createCanvas();
  if (!canvas || typeof canvas.getContext !== "function") throw new Error("Canvas factory returned an invalid surface.");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas 2D context is unavailable.");
  return { canvas, context };
}
function cropAsset(referenceImage, rect, createCanvas) {
  const { canvas, context } = makeCanvas(createCanvas, rect.width, rect.height);
  context.clearRect(0, 0, rect.width, rect.height);
  context.drawImage(referenceImage, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
  return canvas;
}
export function createApprovedKimonoRasterAtlas(referenceImage, { createCanvas = () => document.createElement("canvas") } = {}) {
  const sourceWidth = Number(referenceImage?.naturalWidth || referenceImage?.width);
  const sourceHeight = Number(referenceImage?.naturalHeight || referenceImage?.height);
  if (sourceWidth !== APPROVED_KIMONO_ATLAS_LAYOUT.sourceWidth || sourceHeight !== APPROVED_KIMONO_ATLAS_LAYOUT.sourceHeight) {
    throw new Error("The approved model sheet must be 1280 × 720 pixels; refusing to crop an unknown source.");
  }
  const assets = {};
  for (const [name, rect] of Object.entries(APPROVED_KIMONO_ATLAS_LAYOUT.crops)) {
    if (rect.x < 0 || rect.y < 0 || rect.x + rect.width > sourceWidth || rect.y + rect.height > sourceHeight) {
      throw new Error("Atlas crop is outside the approved model sheet: " + name);
    }
    assets[name] = cropAsset(referenceImage, rect, createCanvas);
  }
  return Object.freeze({
    format: "zero-studio-approved-kimono-raster-atlas",
    version: 1,
    atlasId: APPROVED_KIMONO_ATLAS_ID,
    referenceGalleryId: APPROVED_KIMONO_ATLAS_LAYOUT.referenceGalleryId,
    sourceWidth,
    sourceHeight,
    sourcePixelsPreserved: true,
    assets: Object.freeze(assets)
  });
}
export function createApprovedKimonoFootPoses() {
  return Object.freeze(Array.from({ length: APPROVED_KIMONO_ATLAS_FRAME_COUNT }, (_, frameIndex) => {
    const phase = frameIndex / APPROVED_KIMONO_ATLAS_FRAME_COUNT * Math.PI * 2;
    const near = Math.sin(phase);
    const far = Math.sin(phase + Math.PI);
    return Object.freeze({
      frameIndex,
      frameNumber: frameIndex + 1,
      timeSeconds: frameIndex / APPROVED_KIMONO_ATLAS_FPS,
      exposureFrames: 1,
      // These are drawing coordinates, not transforms applied to source pixels.
      nearOffset: near * 12,
      farOffset: far * 12,
      nearLift: Math.max(0, Math.cos(phase)) * 11,
      farLift: Math.max(0, Math.cos(phase + Math.PI)) * 11,
      nearRoll: near,
      farRoll: far
    });
  }));
}
function filledPath(context, commands, fill, stroke = PALETTE.ink, lineWidth = 1.7) {
  context.beginPath();
  for (const command of commands) {
    const [op, ...v] = command;
    if (op === "M") context.moveTo(...v);
    else if (op === "L") context.lineTo(...v);
    else if (op === "Q") context.quadraticCurveTo(...v);
    else if (op === "C") context.bezierCurveTo(...v);
    else if (op === "Z") context.closePath();
  }
  if (fill) { context.fillStyle = fill; context.fill(); }
  if (stroke) {
    context.strokeStyle = stroke;
    context.lineWidth = lineWidth;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.stroke();
  }
}
function drawWalkFoot(context, heelX, topY, roll, lift) {
  // Every foot pose is authored as new path coordinates. No raster part is translated or warped.
  const toeX = heelX - 39 + roll * 2.2;
  const heel = heelX + 2;
  const ankleY = topY - lift * 0.35;
  const soleY = topY + 34 - lift;
  filledPath(context, [
    ["M", heel - 1, ankleY],
    ["C", heel - 10, ankleY + 13, heel - 17, soleY - 10, toeX + 13, soleY - 7],
    ["Q", toeX - 2, soleY - 4, toeX - 1, soleY + 2],
    ["Q", toeX + 8, soleY + 8, heel + 23, soleY + 5],
    ["Q", heel + 31, soleY + 1, heel + 22, soleY - 8],
    ["L", heel + 8, ankleY + 12],
    ["Z"]
  ], PALETTE.skin, PALETTE.ink, 1.9);
  filledPath(context, [
    ["M", heel + 21, soleY - 5],
    ["Q", heel + 7, soleY - 10, toeX + 1, soleY - 3],
    ["Q", toeX - 5, soleY + 1, toeX + 1, soleY + 6],
    ["Q", heel + 7, soleY + 11, heel + 28, soleY + 4],
    ["Q", heel + 31, soleY + 1, heel + 21, soleY - 5],
    ["Z"]
  ], PALETTE.sandal, PALETTE.ink, 1.8);
  filledPath(context, [
    ["M", heel + 22, soleY + 3],
    ["Q", heel + 4, soleY + 11, toeX + 1, soleY + 6],
    ["Q", toeX - 4, soleY + 9, toeX + 2, soleY + 12],
    ["Q", heel + 9, soleY + 17, heel + 28, soleY + 8],
    ["Z"]
  ], PALETTE.sole, PALETTE.ink, 1.1);
  filledPath(context, [
    ["M", heel + 13, soleY - 5],
    ["Q", heel + 5, soleY - 12, toeX + 12, soleY - 7],
    ["L", toeX + 19, soleY - 1],
    ["Q", heel + 2, soleY - 1, heel + 13, soleY - 5],
    ["Z"]
  ], PALETTE.sandalLight, PALETTE.sandalDark, 1.1);
  filledPath(context, [
    ["M", heel + 15, soleY - 5],
    ["Q", heel + 10, soleY - 11, heel + 3, soleY - 15],
    ["L", heel - 1, soleY - 12],
    ["Q", heel + 5, soleY - 5, heel + 15, soleY - 5],
    ["Z"]
  ], PALETTE.sandal, PALETTE.sandalDark, 1.1);
}
export function hashRasterPixels(bytes) {
  if (!bytes || bytes.length === 0 || bytes.length % 4 !== 0) throw new Error("RGBA bytes are required.");
  let hash = 2166136261;
  for (let i = 0; i < bytes.length; i++) { hash ^= bytes[i]; hash = Math.imul(hash, 16777619); }
  return "rgba-fnv1a-" + (hash >>> 0).toString(16).padStart(8, "0");
}
function makeFramePoseHash(frame, area) {
  const rgba = frame.context.getImageData(area.x, area.y, area.width, area.height).data;
  return hashRasterPixels(rgba);
}
export function renderApprovedKimonoAtlasFrame(canvas, atlas, pose) {
  if (atlas?.format !== "zero-studio-approved-kimono-raster-atlas" || atlas.atlasId !== APPROVED_KIMONO_ATLAS_ID) {
    throw new Error("A valid approved raster atlas is required.");
  }
  if (!Number.isInteger(pose?.frameIndex) || pose.frameIndex < 0 || pose.frameIndex >= 24) throw new Error("Invalid frame pose.");
  for (const key of ["nearOffset", "farOffset", "nearLift", "farLift", "nearRoll", "farRoll"]) {
    if (!Number.isFinite(Number(pose[key]))) throw new Error("Invalid foot motion value: " + key);
  }
  const { canvas: target, context } = makeCanvas(() => canvas, APPROVED_KIMONO_ATLAS_LAYOUT.outputWidth, APPROVED_KIMONO_ATLAS_LAYOUT.outputHeight);
  context.imageSmoothingEnabled = false;
  context.fillStyle = PALETTE.paper;
  context.fillRect(0, 0, target.width, target.height);
  const destination = APPROVED_KIMONO_ATLAS_LAYOUT.destination;
  // The full side-view design is repainted 1:1 at a fixed origin on every fresh output surface.
  context.drawImage(atlas.assets.sideFigure, destination.x, destination.y);
  const zone = APPROVED_KIMONO_ATLAS_LAYOUT.motionZone;
  context.fillStyle = PALETTE.paper;
  context.fillRect(zone.left.x, zone.y, zone.left.width, target.height - zone.y);
  context.fillRect(zone.right.x, zone.y, zone.right.width, target.height - zone.y);
  // New, separately authored foot/sole drawings replace only the old footwear area.
  drawWalkFoot(context, 104 + pose.nearOffset, 663, pose.nearRoll, pose.nearLift);
  drawWalkFoot(context, 163 + pose.farOffset, 663, pose.farRoll, pose.farLift);
  const identityRegionHash = makeFramePoseHash({ context }, { x: 0, y: 0, width: target.width, height: zone.identityRegionHeight });
  const contentHash = makeFramePoseHash({ context }, { x: 0, y: 0, width: target.width, height: target.height });
  const pngDataUrl = target.toDataURL("image/png");
  if (!pngDataUrl.startsWith("data:image/png;base64,")) throw new Error("PNG export failed.");
  return Object.freeze({
    frameIndex: pose.frameIndex,
    frameNumber: pose.frameIndex + 1,
    timeSeconds: pose.frameIndex / 24,
    fps: 24,
    exposureFrames: 1,
    width: target.width,
    height: target.height,
    pngDataUrl,
    mimeType: "image/png",
    contentHash,
    identityRegionHash,
    characterId: "zero-approved-kimono-girl-v1",
    referenceGalleryId: atlas.referenceGalleryId,
    referencePixelsReusedForIdentity: true,
    motionZoneRedrawn: true,
    independentRasterComposite: true,
    modelInferenceUsed: false,
    svgUsed: false,
    puppetTransformsUsed: false
  });
}
export function auditApprovedKimonoAtlasCycle(frames) {
  if (!Array.isArray(frames) || frames.length !== APPROVED_KIMONO_ATLAS_FRAME_COUNT) throw new Error("Exactly 24 raster composites are required.");
  const contentHashes = new Set();
  const identityHashes = new Set();
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    if (frame.frameIndex !== i || frame.frameNumber !== i + 1 || frame.fps !== 24 || frame.exposureFrames !== 1 ||
      frame.referencePixelsReusedForIdentity !== true || frame.motionZoneRedrawn !== true ||
      frame.independentRasterComposite !== true || frame.modelInferenceUsed !== false ||
      frame.svgUsed !== false || frame.puppetTransformsUsed !== false) {
      throw new Error("Frame provenance failed at frame " + (i + 1) + ".");
    }
    if (!/^rgba-fnv1a-[0-9a-f]{8}$/.test(frame.contentHash || "") ||
      !/^rgba-fnv1a-[0-9a-f]{8}$/.test(frame.identityRegionHash || "")) {
      throw new Error("Pixel audit hashes are missing at frame " + (i + 1) + ".");
    }
    if (contentHashes.has(frame.contentHash)) throw new Error("Duplicate frame at " + (i + 1) + ".");
    contentHashes.add(frame.contentHash);
    identityHashes.add(frame.identityRegionHash);
  }
  return Object.freeze({
    frameCount: frames.length,
    uniqueFrameCount: contentHashes.size,
    fps: 24,
    identityRegionStable: identityHashes.size === 1,
    identityRegionHashCount: identityHashes.size,
    modelInferenceCalls: 0,
    svgOutputs: 0,
    puppetTransforms: 0,
    meetsUniqueRasterCompositeTarget: contentHashes.size === 24,
    preservesPixelIdentityOutsideMotionZone: identityHashes.size === 1
  });
}
export function renderApprovedKimonoAtlasWalkCycle({ atlas, createCanvas = () => document.createElement("canvas") } = {}) {
  if (!atlas) throw new Error("The approved raster atlas is required.");
  const poses = createApprovedKimonoFootPoses();
  const frames = poses.map(pose => renderApprovedKimonoAtlasFrame(createCanvas(), atlas, pose));
  const audit = auditApprovedKimonoAtlasCycle(frames);
  return Object.freeze({
    format: "zero-studio-reference-preserving-raster-cycle",
    version: 1,
    fps: 24,
    durationSeconds: 1,
    atlasId: atlas.atlasId,
    frames,
    audit
  });
}
