import { pathGeometryBounds, validatePath } from "./engine.mjs";

export const DIGITAL_ARTIST_FORMAT = "zero-studio-digital-artist-plan";
export const DIGITAL_ARTIST_VERSION = 1;
export const DIGITAL_ARTIST_CANVAS = Object.freeze({ width: 1920, height: 1080 });
export const DIGITAL_ARTIST_MAX_LAYERS = 32;
export const DIGITAL_ARTIST_MAX_STROKES = 2400;

export const DIGITAL_ARTIST_ROLES = Object.freeze([
  "construction", "rough-sketch", "clean-line", "flat-color",
  "shadow", "highlight", "detail", "correction"
]);
export const DIGITAL_ARTIST_TOOLS = Object.freeze([
  "pencil", "inking-pen", "brush", "fill-brush", "highlight-pen"
]);

const ROLE_ORDER = new Map(DIGITAL_ARTIST_ROLES.map((role, index) => [role, index]));
const cleanText = (value, limit) => String(value ?? "").trim().replace(/[\u0000-\u001f]/g, "").slice(0, limit);
const fail = message => { throw new Error(message); };

function requireId(value, label) {
  const id = cleanText(value, 100);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(id)) fail(label + " must be a stable, safe identifier.");
  return id;
}

function rejectRasterPayloads(value, path = "plan") {
  if (!value || typeof value !== "object") {
    if (typeof value === "string" && /^data:image\//i.test(value)) fail("Raster image payloads are not accepted by the Digital Artist command plan.");
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectRasterPayloads(item, path + "[" + index + "]"));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (/^(?:dataUrl|imageData|imageBase64|pngDataUrl|rasterPayload|base64Image)$/i.test(key)) {
      fail("Raster image payload field is forbidden: " + path + "." + key);
    }
    rejectRasterPayloads(child, path + "." + key);
  }
}

function normalizeStroke(stroke, layerId, index, canvas) {
  if (!stroke || typeof stroke !== "object" || Array.isArray(stroke)) fail("A drawing stroke must be an object.");
  const id = requireId(stroke.id, "Stroke id");
  const tool = cleanText(stroke.tool, 32);
  if (!DIGITAL_ARTIST_TOOLS.includes(tool)) fail("Unsupported drawing tool: " + tool + ".");
  const intent = cleanText(stroke.intent, 180);
  if (!intent) fail("Every stroke needs a short drawing intent.");
  const operation = validatePath(stroke.operation);
  const bounds = pathGeometryBounds(operation.d);
  if (bounds.minX < 0 || bounds.minY < 0 || bounds.maxX > canvas.width || bounds.maxY > canvas.height) {
    fail("Stroke " + id + " extends outside the " + canvas.width + "×" + canvas.height + " drawing canvas.");
  }
  if (operation.stroke === "none" && operation.fill === "none") fail("Stroke " + id + " has neither a visible outline nor a fill.");
  return { id, layerId, sequence: index, tool, intent, operation };
}

export function validateDigitalArtistPlan(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) fail("A Digital Artist plan object is required.");
  const serialized = JSON.stringify(input);
  if (serialized.length > 4 * 1024 * 1024) fail("The Digital Artist plan exceeds the 4 MiB safety limit.");
  rejectRasterPayloads(input);
  if (input.format !== DIGITAL_ARTIST_FORMAT || input.version !== DIGITAL_ARTIST_VERSION) {
    fail("Unsupported Digital Artist plan format or version.");
  }

  const canvas = input.canvas || DIGITAL_ARTIST_CANVAS;
  if (canvas.width !== DIGITAL_ARTIST_CANVAS.width || canvas.height !== DIGITAL_ARTIST_CANVAS.height) {
    fail("Version 1 Digital Artist plans must use the ZERO STUDIO 1920×1080 canvas.");
  }

  const title = cleanText(input.title, 120);
  if (!title) fail("A drawing title is required.");

  const identityInput = input.identity && typeof input.identity === "object" ? input.identity : {};
  const identity = {
    characterAssetId: cleanText(identityInput.characterAssetId, 120),
    referenceDigest: cleanText(identityInput.referenceDigest, 160)
  };
  if (identity.characterAssetId && !/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(identity.characterAssetId)) {
    fail("The character asset id is invalid.");
  }
  if (identity.referenceDigest && !/^(?:sha256:)?[a-f0-9]{64}$/i.test(identity.referenceDigest)) {
    fail("The reference digest must be a SHA-256 hex digest.");
  }

  if (!Array.isArray(input.layers) || input.layers.length < 1 || input.layers.length > DIGITAL_ARTIST_MAX_LAYERS) {
    fail("A Digital Artist plan must contain between 1 and " + DIGITAL_ARTIST_MAX_LAYERS + " layers.");
  }

  const layerIds = new Set();
  const strokeIds = new Set();
  let strokeCount = 0;
  let previousRoleOrder = -1;
  const layers = input.layers.map((layer, layerIndex) => {
    if (!layer || typeof layer !== "object" || Array.isArray(layer)) fail("Layer " + (layerIndex + 1) + " is invalid.");
    const id = requireId(layer.id, "Layer id");
    if (layerIds.has(id)) fail("Duplicate layer id: " + id + ".");
    layerIds.add(id);
    const name = cleanText(layer.name, 80);
    if (!name) fail("Every artist layer needs a name.");
    const role = cleanText(layer.role, 32);
    if (!ROLE_ORDER.has(role)) fail("Unsupported artist layer role: " + role + ".");
    const order = ROLE_ORDER.get(role);
    if (order < previousRoleOrder) fail("Artist layers must follow the studio drawing order from construction to correction.");
    previousRoleOrder = order;
    if (!Array.isArray(layer.strokes) || layer.strokes.length < 1) fail("Layer " + name + " must contain at least one drawing stroke.");
    strokeCount += layer.strokes.length;
    if (strokeCount > DIGITAL_ARTIST_MAX_STROKES) fail("The plan exceeds the " + DIGITAL_ARTIST_MAX_STROKES + "-stroke limit.");

    const strokes = layer.strokes.map((stroke, strokeIndex) => {
      const item = normalizeStroke(stroke, id, strokeIndex, canvas);
      if (strokeIds.has(item.id)) fail("Duplicate stroke id: " + item.id + ".");
      strokeIds.add(item.id);
      return item;
    });

    return { id, name, role, visible: layer.visible !== false, locked: layer.locked === true, strokes };
  });

  return {
    format: DIGITAL_ARTIST_FORMAT,
    version: DIGITAL_ARTIST_VERSION,
    title,
    canvas: { ...DIGITAL_ARTIST_CANVAS },
    characterName: cleanText(input.characterName, 100),
    identity,
    direction: cleanText(input.direction, 500),
    authoringMode: "ordered-editable-vector-strokes",
    imageGenerationUsed: false,
    layers,
    strokeCount
  };
}

/** Compile an artist score into editable vector layers and a replayable stroke stream. */
export function compileDigitalArtistPlan(input) {
  const plan = validateDigitalArtistPlan(input);
  const steps = [];
  const layers = plan.layers.map(layer => ({
    id: "artist-" + layer.id,
    name: layer.name,
    visible: layer.visible,
    locked: layer.locked,
    operations: layer.strokes.map(stroke => {
      const operation = { ...stroke.operation };
      steps.push({
        stepIndex: steps.length,
        strokeId: stroke.id,
        layerId: "artist-" + layer.id,
        layerName: layer.name,
        role: layer.role,
        tool: stroke.tool,
        intent: stroke.intent,
        operation
      });
      return operation;
    })
  }));

  return {
    format: "zero-studio-digital-artist-command-stream",
    version: 1,
    canvas: { ...plan.canvas },
    title: plan.title,
    characterName: plan.characterName,
    identity: { ...plan.identity },
    authoringMode: plan.authoringMode,
    imageGenerationUsed: false,
    layers,
    steps,
    audit: auditDigitalArtistCommandStream({ layers, steps })
  };
}

export function getDigitalArtistStep(commandStream, stepIndex) {
  if (!commandStream || commandStream.format !== "zero-studio-digital-artist-command-stream" ||
      !Array.isArray(commandStream.steps)) fail("A compiled Digital Artist command stream is required.");
  if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= commandStream.steps.length) return null;
  return JSON.parse(JSON.stringify(commandStream.steps[stepIndex]));
}

export function auditDigitalArtistCommandStream({ layers, steps } = {}) {
  if (!Array.isArray(layers) || !Array.isArray(steps)) fail("Artist layers and steps are required for the audit.");
  const layerStrokeCount = layers.reduce((sum, layer) => sum + (Array.isArray(layer.operations) ? layer.operations.length : 0), 0);
  const stepIds = new Set(steps.map(step => step.strokeId));
  const layerIds = new Set(layers.map(layer => layer.id));
  const referencesValid = steps.every(step => layerIds.has(step.layerId));
  if (layerStrokeCount !== steps.length || stepIds.size !== steps.length || !referencesValid) {
    fail("The compiled artist stream contains missing, duplicated, or orphaned drawing steps.");
  }
  return {
    layerCount: layers.length,
    strokeCount: steps.length,
    orderedSteps: steps.every((step, index) => step.stepIndex === index),
    editableVectorLayers: true,
    rasterPayloadCount: 0,
    imageGenerationUsed: false,
    complete: steps.length > 0 && steps.every(step => step.operation && typeof step.operation.d === "string")
  };
}
