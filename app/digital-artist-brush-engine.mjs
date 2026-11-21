import { RASTER_BRUSH_PRESETS, RASTER_BLEND_MODES } from "./raster-brushes.mjs";

export const DIGITAL_ARTIST_BRUSH_FORMAT = "zero-studio-digital-artist-brush-plan";
export const DIGITAL_ARTIST_BRUSH_VERSION = 1;
export const DIGITAL_ARTIST_BRUSH_CANVAS = Object.freeze({ width: 1920, height: 1080 });
export const DIGITAL_ARTIST_BRUSH_ROLES = Object.freeze([
  "construction", "rough-sketch", "clean-line", "flat-color",
  "shadow", "highlight", "detail", "correction"
]);
export const DIGITAL_ARTIST_BRUSHES = Object.freeze(Object.keys(RASTER_BRUSH_PRESETS));
const ROLE_ORDER = new Map(DIGITAL_ARTIST_BRUSH_ROLES.map((role, index) => [role, index]));
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const fail = message => { throw new Error(message); };
const safeId = (value, label) => {
  const id = String(value ?? "").trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,99}$/.test(id)) fail(label + " must be a stable identifier.");
  return id;
};

export function validateDigitalArtistBrushPlan(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) fail("A Digital Artist brush plan object is required.");
  if (JSON.stringify(input).length > 4 * 1024 * 1024) fail("The brush plan exceeds the 4 MiB safety limit.");
  if (input.format !== DIGITAL_ARTIST_BRUSH_FORMAT || input.version !== DIGITAL_ARTIST_BRUSH_VERSION) fail("Unsupported Digital Artist brush plan format or version.");
  const canvas = input.canvas || DIGITAL_ARTIST_BRUSH_CANVAS;
  if (canvas.width !== 1920 || canvas.height !== 1080) fail("Version 1 brush plans use the ZERO STUDIO 1920×1080 canvas.");
  const title = String(input.title ?? "").trim().slice(0, 120);
  if (!title) fail("A drawing title is required.");
  const identity = input.identity && typeof input.identity === "object" ? input.identity : {};
  const characterAssetId = String(identity.characterAssetId ?? "").trim().slice(0, 120);
  const referenceDigest = String(identity.referenceDigest ?? "").trim();
  if (characterAssetId && !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,119}$/.test(characterAssetId)) fail("The character asset id is invalid.");
  if (referenceDigest && !/^(?:sha256:)?[a-f0-9]{64}$/i.test(referenceDigest)) fail("The reference digest must be a SHA-256 hex digest.");
  if (!Array.isArray(input.layers) || input.layers.length < 1 || input.layers.length > 32) fail("A brush plan needs 1–32 semantic layers.");

  const ids = new Set();
  const strokeIds = new Set();
  let previousRole = -1, total = 0;
  const layers = input.layers.map((layer, layerIndex) => {
    if (!layer || typeof layer !== "object" || Array.isArray(layer)) fail("Layer " + (layerIndex + 1) + " is invalid.");
    const id = safeId(layer.id, "Layer id");
    if (ids.has(id)) fail("Duplicate layer id: " + id + ".");
    ids.add(id);
    const name = String(layer.name ?? "").trim().slice(0, 80);
    const role = String(layer.role ?? "");
    if (!name || !ROLE_ORDER.has(role)) fail("Every layer needs a name and a supported semantic role.");
    const roleIndex = ROLE_ORDER.get(role);
    if (roleIndex < previousRole) fail("Artist layers must follow the studio drawing order.");
    previousRole = roleIndex;
    if (!Array.isArray(layer.strokes) || !layer.strokes.length) fail("Layer " + name + " must contain at least one brush stroke.");
    const strokes = layer.strokes.map((stroke, strokeIndex) => {
      if (!stroke || typeof stroke !== "object" || Array.isArray(stroke)) fail("A brush stroke must be an object.");
      const strokeId = safeId(stroke.id, "Stroke id");
      if (strokeIds.has(strokeId)) fail("Duplicate stroke id: " + strokeId + ".");
      strokeIds.add(strokeId);
      const intent = String(stroke.intent ?? "").trim().slice(0, 180);
      if (!intent) fail("Every brush stroke needs a drawing intent.");
      const brush = String(stroke.brush ?? "ink");
      if (!DIGITAL_ARTIST_BRUSHES.includes(brush)) fail("Unsupported raster brush: " + brush + ".");
      if (!Array.isArray(stroke.points) || !stroke.points.length || stroke.points.length > 20000) fail("Brush stroke points are invalid.");
      const points = stroke.points.map(point => {
        const x = Number(point?.x), y = Number(point?.y), pressure = Number(point?.pressure ?? 0.55);
        if (![x, y, pressure].every(Number.isFinite) || x < 0 || y < 0 || x > 1920 || y > 1080) fail("Brush sample is outside the drawing canvas or has invalid pressure.");
        if (pressure < 0.06 || pressure > 1) fail("Brush pressure must be between 0.06 and 1.");
        return { x, y, pressure };
      });
      const size = Number(stroke.size ?? 8), opacity = Number(stroke.opacity ?? 1), texture = Number(stroke.texture ?? 0.35);
      if (!Number.isFinite(size) || size < 0.5 || size > 240) fail("Brush size is outside the supported range.");
      if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) fail("Brush opacity must be between 0 and 1.");
      if (!Number.isFinite(texture) || texture < 0 || texture > 1) fail("Brush texture must be between 0 and 1.");
      const blendMode = String(stroke.blendMode ?? "normal");
      if (!Object.hasOwn(RASTER_BLEND_MODES, blendMode)) fail("Unsupported raster blend mode.");
      const color = String(stroke.color ?? "#29232b");
      if (!/^#[0-9a-f]{6}$/i.test(color)) fail("Brush color must be a six-digit hex color.");
      const seed = Number.isInteger(stroke.seed) ? stroke.seed : 1;
      total++;
      if (total > 2400) fail("The brush plan exceeds the 2400-stroke safety limit.");
      return {
        id: strokeId, layerId: id, sequence: strokeIndex, intent, brush,
        points, size, color, opacity, texture, blendMode, seed,
        pressureSensitive: stroke.pressureSensitive !== false,
        erase: stroke.erase === true
      };
    });
    return { id, name, role, visible: layer.visible !== false, locked: layer.locked === true, strokes };
  });
  return {
    format: DIGITAL_ARTIST_BRUSH_FORMAT, version: DIGITAL_ARTIST_BRUSH_VERSION,
    title, canvas: { ...DIGITAL_ARTIST_BRUSH_CANVAS },
    identity: { characterAssetId, referenceDigest },
    authoringMode: "ordered-native-raster-brush-strokes",
    imageGenerationUsed: false, layers, strokeCount: total
  };
}

/** Compile an artist plan to commands executed by ZERO STUDIO's native Canvas2D brush engine. */
export function compileDigitalArtistBrushPlan(input) {
  const plan = validateDigitalArtistBrushPlan(input);
  const commands = [];
  const layers = plan.layers.map(layer => ({
    id: "artist-raster-" + layer.id,
    name: layer.name,
    role: layer.role,
    type: "raster",
    visible: layer.visible,
    locked: layer.locked,
    commands: layer.strokes.map(stroke => {
      const command = {
        kind: "raster-brush-stroke",
        strokeId: stroke.id,
        layerId: "artist-raster-" + layer.id,
        intent: stroke.intent,
        brush: stroke.brush,
        points: stroke.points.map(point => ({ ...point })),
        options: {
          size: stroke.size, color: stroke.color, opacity: stroke.opacity,
          texture: stroke.texture, blendMode: stroke.blendMode, seed: stroke.seed,
          pressureSensitive: stroke.pressureSensitive, erase: stroke.erase
        }
      };
      commands.push({ stepIndex: commands.length, ...command });
      return command;
    })
  }));
  return {
    format: "zero-studio-digital-artist-raster-command-stream",
    version: 1,
    title: plan.title,
    canvas: { ...plan.canvas },
    identity: { ...plan.identity },
    authoringMode: plan.authoringMode,
    imageGenerationUsed: false,
    renderer: "native-canvas2d-raster-brush-engine",
    layers, commands,
    audit: {
      layerCount: layers.length,
      strokeCount: commands.length,
      orderedSteps: commands.every((command, index) => command.stepIndex === index),
      nativeRasterBrushes: true,
      vectorRequired: false,
      rasterImagePayloads: 0,
      imageGenerationUsed: false
    }
  };
}

export function getDigitalArtistBrushStep(stream, stepIndex) {
  if (!stream || stream.format !== "zero-studio-digital-artist-raster-command-stream" || !Array.isArray(stream.commands)) fail("A compiled raster brush command stream is required.");
  if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= stream.commands.length) return null;
  return JSON.parse(JSON.stringify(stream.commands[stepIndex]));
}
