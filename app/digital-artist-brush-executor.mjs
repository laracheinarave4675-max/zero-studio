const STREAM_FORMAT = "zero-studio-digital-artist-raster-command-stream";
const BRUSHES = new Set(["graphite", "ink", "gouache", "watercolor", "foliage"]);
const BLENDS = new Set(["normal", "multiply", "screen", "overlay", "darken", "lighten"]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateStream(stream) {
  assert(stream && typeof stream === "object" && !Array.isArray(stream), "A compiled Digital Artist stream is required.");
  assert(stream.format === STREAM_FORMAT && stream.version === 1, "Unsupported Digital Artist raster stream.");
  assert(stream.renderer === "native-canvas2d-raster-brush-engine", "The stream must target the native raster brush engine.");
  assert(stream.audit?.vectorRequired === false && stream.audit?.rasterImagePayloads === 0 && stream.imageGenerationUsed === false, "The stream violates the native-brush-only drawing policy.");
  assert(Array.isArray(stream.layers) && stream.layers.length >= 1 && stream.layers.length <= 32, "A raster stream needs 1–32 layers.");
  assert(Array.isArray(stream.commands) && stream.commands.length >= 1 && stream.commands.length <= 2400, "A raster stream needs 1–2400 strokes.");

  const layerIds = new Set();
  const strokeIds = new Set();
  let cursor = 0;
  let totalSamples = 0;
  for (const layer of stream.layers) {
    assert(layer && typeof layer === "object" && typeof layer.id === "string" && layer.id.length > 0, "A stream layer is invalid.");
    assert(!layerIds.has(layer.id), "Duplicate raster layer id: " + layer.id + ".");
    layerIds.add(layer.id);
    assert(typeof layer.name === "string" && layer.name.trim().length > 0 && layer.name.length <= 80, "A raster layer name is invalid.");
    assert(Array.isArray(layer.commands) && layer.commands.length > 0, "Every raster layer must contain at least one stroke.");

    for (const command of layer.commands) {
      const globalCommand = stream.commands[cursor];
      assert(globalCommand && globalCommand.stepIndex === cursor, "Raster commands are not in a continuous execution order.");
      assert(command && ["raster-brush-stroke", "raster-region-fill"].includes(command.kind) && globalCommand.kind === command.kind, "Unsupported raster artist operation.");
      assert(command.layerId === layer.id && globalCommand.layerId === layer.id, "A stroke references the wrong raster layer.");
      assert(typeof command.strokeId === "string" && command.strokeId.length > 0 && !strokeIds.has(command.strokeId), "A stroke id is missing or duplicated.");
      strokeIds.add(command.strokeId);
      assert(globalCommand.strokeId === command.strokeId, "The flattened command stream differs from its layer commands.");
      assert(typeof command.intent === "string" && command.intent.trim().length > 0, "Every operation needs an artist intent.");
      assert(Array.isArray(command.points) && command.points.length >= (command.kind === "raster-region-fill" ? 3 : 1) && command.points.length <= 20000, "An operation has an invalid point list.");
      totalSamples += command.points.length;
      assert(totalSamples <= 500000, "The stream exceeds the project's 500,000-point editable stroke-history limit.");
      if (command.kind === "raster-region-fill") {
        for (const point of command.points) {
          const x = Number(point?.x), y = Number(point?.y);
          assert(Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 1920 && y >= 0 && y <= 1080, "A fill boundary is outside the 1920×1080 canvas.");
        }
        const options = command.options;
        assert(options && typeof options.color === "string" && /^#[0-9a-f]{6}$/i.test(options.color), "A region fill color is invalid.");
        assert(Number.isFinite(Number(options.opacity)) && options.opacity >= 0 && options.opacity <= 1, "A region fill opacity is invalid.");
        assert(BLENDS.has(options.blendMode), "A region fill blend mode is unsupported.");
      } else {
        for (const point of command.points) {
          const x = Number(point?.x), y = Number(point?.y), pressure = Number(point?.pressure);
          assert(Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 1920 && y >= 0 && y <= 1080, "A stroke point is outside the 1920×1080 canvas.");
          assert(Number.isFinite(pressure) && pressure >= 0.06 && pressure <= 1, "A stroke pressure value is invalid.");
        }
        const options = command.options;
        assert(options && BRUSHES.has(options.brush), "A stroke uses an unsupported raster brush.");
        assert(Number.isFinite(Number(options.size)) && options.size >= 0.5 && options.size <= 240, "A stroke brush size is invalid.");
        assert(typeof options.color === "string" && /^#[0-9a-f]{6}$/i.test(options.color), "A stroke color is invalid.");
        assert(Number.isFinite(Number(options.opacity)) && options.opacity >= 0 && options.opacity <= 1, "A stroke opacity is invalid.");
        assert(Number.isFinite(Number(options.texture)) && options.texture >= 0 && options.texture <= 1, "A stroke texture value is invalid.");
        assert(BLENDS.has(options.blendMode), "A stroke blend mode is unsupported.");
      }
      cursor++;
    }
  }
  assert(cursor === stream.commands.length, "The flattened stream contains missing or extra strokes.");
  assert(stream.audit.strokeCount === cursor && stream.audit.layerCount === stream.layers.length, "The stream audit counts do not match its commands.");
}

function makeProgress(completed, total, layer, stroke, result) {
  return { completed, total, layerId: layer.id, layerName: layer.name, strokeId: stroke.strokeId, result };
}

/**
 * Executes compiled native-raster commands through host-provided layer and
 * Canvas2D adapters. Each layer is finalized before moving to the next one,
 * keeping mobile memory use bounded. The host owns persistence and rollback.
 */
export async function executeDigitalArtistBrushStream(stream, adapters = {}) {
  validateStream(stream);
  const { createLayer, paintStroke, finalizeLayer, rollbackLayers, onProgress } = adapters;
  assert(typeof createLayer === "function", "A createLayer adapter is required.");
  assert(typeof paintStroke === "function", "A paintStroke adapter is required.");
  assert(typeof finalizeLayer === "function", "A finalizeLayer adapter is required.");

  const createdLayers = [];
  const results = [];
  let completed = 0;
  try {
    for (const descriptor of stream.layers) {
      const target = await createLayer(descriptor);
      assert(target && typeof target === "object", "The layer adapter did not return a raster layer.");
      createdLayers.push(target);

      for (const command of descriptor.commands) {
        const result = await paintStroke(target, command, descriptor);
        completed++;
        results.push({ strokeId: command.strokeId, layerId: descriptor.id, result });
        if (typeof onProgress === "function") {
          await onProgress(makeProgress(completed, stream.commands.length, descriptor, command, result));
        }
      }

      await finalizeLayer(target, descriptor);
    }

    return {
      format: STREAM_FORMAT,
      title: stream.title,
      layerCount: createdLayers.length,
      strokeCount: completed,
      createdLayers,
      results
    };
  } catch (error) {
    if (typeof rollbackLayers === "function" && createdLayers.length) {
      try {
        await rollbackLayers(createdLayers, error);
      } catch (rollbackError) {
        error.rollbackError = rollbackError;
      }
    }
    throw error;
  }
}
