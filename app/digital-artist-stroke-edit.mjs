const BRUSHES = new Set(["graphite", "ink", "gouache", "watercolor", "foliage"]);
const BLENDS = new Set(["normal", "multiply", "screen", "overlay", "darken", "lighten"]);
const fail = message => { throw new Error(message); };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Validate a user-edited Digital Artist operation and return a new operation.
 * Stable identity/source/kind are retained; every edit returns to pending review.
 */
export function validateDigitalArtistStrokeEdit(current, edit) {
  if (!current || typeof current !== "object" || current.source !== "digital-artist" || typeof current.id !== "string") {
    fail("A saved Digital Artist operation is required.");
  }
  if (!edit || typeof edit !== "object" || Array.isArray(edit)) fail("A stroke edit object is required.");
  const intent = String(edit.intent ?? "").trim().slice(0, 180);
  if (!intent) fail("Every edited operation needs an artist intent.");
  if (!Array.isArray(edit.points) || edit.points.length < (current.kind === "raster-region-fill" ? 3 : 1) || edit.points.length > 20000) {
    fail("The edited point list has an invalid size.");
  }
  const points = edit.points.map(point => {
    const x = Number(point?.x), y = Number(point?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > 1920 || y > 1080) {
      fail("An edited point is outside the 1920×1080 canvas.");
    }
    const pressure = Number(point?.pressure ?? (current.kind === "raster-region-fill" ? 1 : 0.55));
    if (!Number.isFinite(pressure) || pressure < 0.06 || pressure > 1) fail("Edited brush pressure must be between 0.06 and 1.");
    return { x, y, pressure: current.kind === "raster-region-fill" ? 1 : pressure };
  });
  const options = edit.options && typeof edit.options === "object" && !Array.isArray(edit.options) ? edit.options : fail("Edited brush options are required.");
  const color = String(options.color ?? "");
  if (!/^#[0-9a-f]{6}$/i.test(color)) fail("Edited color must be a six-digit hex color.");
  const opacity = Number(options.opacity ?? 1);
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) fail("Edited opacity must be between 0 and 1.");
  const blendMode = String(options.blendMode ?? "normal");
  if (!BLENDS.has(blendMode)) fail("Edited blend mode is unsupported.");
  let normalizedOptions;
  if (current.kind === "raster-region-fill") {
    normalizedOptions = { color, opacity, blendMode };
  } else {
    const brush = String(options.brush ?? "ink");
    if (!BRUSHES.has(brush)) fail("Edited brush profile is unsupported.");
    const size = Number(options.size ?? 8), texture = Number(options.texture ?? 0.35);
    if (!Number.isFinite(size) || size < 0.5 || size > 240) fail("Edited brush size must be between 0.5 and 240.");
    if (!Number.isFinite(texture) || texture < 0 || texture > 1) fail("Edited brush texture must be between 0 and 1.");
    normalizedOptions = {
      brush, size, color, opacity, texture, blendMode,
      pressureSensitive: options.pressureSensitive !== false,
      erase: options.erase === true,
      seed: Number.isInteger(options.seed) ? clamp(options.seed, -2147483648, 2147483647) : 1
    };
  }
  return {
    ...current,
    intent,
    points,
    options: normalizedOptions,
    review: "pending"
  };
}
