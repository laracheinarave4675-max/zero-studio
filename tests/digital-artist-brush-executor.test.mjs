import test from "node:test";
import assert from "node:assert/strict";
import { compileDigitalArtistBrushPlan } from "../app/digital-artist-brush-engine.mjs";
import { executeDigitalArtistBrushStream } from "../app/digital-artist-brush-executor.mjs";

function plan() {
  return {
    format: "zero-studio-digital-artist-brush-plan",
    version: 1,
    title: "Executor adapter test",
    layers: [
      { id: "rough", name: "Rough sketch", role: "rough-sketch", strokes: [
        { id: "rough-1", intent: "Establish the first contour.", brush: "graphite", color: "#777777", size: 8, points: [{ x: 300, y: 240, pressure: .3 }, { x: 360, y: 280, pressure: .8 }] }
      ]},
      { id: "ink", name: "Clean ink", role: "clean-line", strokes: [
        { id: "ink-1", intent: "Ink the contour.", brush: "ink", color: "#24202a", size: 6, points: [{ x: 300, y: 240, pressure: .2 }, { x: 360, y: 280, pressure: .9 }] },
        { id: "ink-2", intent: "Finish the contour.", brush: "ink", color: "#24202a", size: 5, points: [{ x: 360, y: 280, pressure: .9 }, { x: 400, y: 320, pressure: .2 }] }
      ]}
    ]
  };
}

test("executes real stream callbacks in layer and stroke order, finalizing each layer", async () => {
  const stream = compileDigitalArtistBrushPlan(plan());
  const events = [];
  const result = await executeDigitalArtistBrushStream(stream, {
    createLayer: async descriptor => {
      events.push("create:" + descriptor.id);
      return { id: descriptor.id, strokes: [] };
    },
    paintStroke: async (layer, command) => {
      events.push("paint:" + command.strokeId);
      layer.strokes.push(command.strokeId);
      return { dabCount: command.points.length };
    },
    finalizeLayer: async layer => events.push("finalize:" + layer.id),
    onProgress: progress => events.push("progress:" + progress.completed)
  });

  assert.equal(result.layerCount, 2);
  assert.equal(result.strokeCount, 3);
  assert.deepEqual(events, [
    "create:artist-raster-rough", "paint:rough-1", "progress:1", "finalize:artist-raster-rough",
    "create:artist-raster-ink", "paint:ink-1", "progress:2", "paint:ink-2", "progress:3", "finalize:artist-raster-ink"
  ]);
});

test("rolls back every created layer when a brush operation fails", async () => {
  const stream = compileDigitalArtistBrushPlan(plan());
  const rolledBack = [];
  await assert.rejects(() => executeDigitalArtistBrushStream(stream, {
    createLayer: async descriptor => ({ id: descriptor.id }),
    paintStroke: async (_layer, command) => {
      if (command.strokeId === "ink-1") throw new Error("paint failed");
      return true;
    },
    finalizeLayer: async () => {},
    rollbackLayers: async layers => rolledBack.push(...layers.map(layer => layer.id))
  }), /paint failed/);
  assert.deepEqual(rolledBack, ["artist-raster-rough", "artist-raster-ink"]);
});

test("rejects malformed streams before creating any layer", async () => {
  const stream = compileDigitalArtistBrushPlan(plan());
  stream.commands[0].stepIndex = 7;
  let created = false;
  await assert.rejects(() => executeDigitalArtistBrushStream(stream, {
    createLayer: async () => { created = true; return {}; },
    paintStroke: async () => {},
    finalizeLayer: async () => {}
  }), /continuous execution order/);
  assert.equal(created, false);
});
