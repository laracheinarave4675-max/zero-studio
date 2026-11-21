import test from "node:test";
import assert from "node:assert/strict";
import { createProject, normalizeProject } from "../app/engine.mjs";

const transparentPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

test("preserves Digital Artist stroke IDs, intent, and source through project normalization", () => {
  const project = createProject("Raster history");
  project.frames[0].layers.push({
    id: "artist-layer",
    name: "Clean ink",
    type: "raster",
    visible: true,
    locked: false,
    dataUrl: transparentPng,
    mimeType: "image/png",
    width: 1920,
    height: 1080,
    strokes: [{
      id: "face-outline-01",
      intent: "Ink the character face contour.",
      source: "digital-artist",
      points: [{ x: 450, y: 200, pressure: .25 }, { x: 500, y: 260, pressure: .8 }],
      options: { brush: "ink", size: 7, color: "#25212b", opacity: 1, texture: 0, blendMode: "normal", pressureSensitive: true, erase: false, seed: 91 }
    }]
  });

  const normalized = normalizeProject(project);
  const stroke = normalized.frames[0].layers.find(layer => layer.id === "artist-layer").strokes[0];
  assert.equal(stroke.id, "face-outline-01");
  assert.equal(stroke.intent, "Ink the character face contour.");
  assert.equal(stroke.source, "digital-artist");
  assert.equal(stroke.points.length, 2);
  assert.equal(stroke.options.seed, 91);
});

test("persists region-fill operation kind and its review decision", () => {
  const project = createProject("Region review history");
  project.frames[0].layers.push({
    id: "artist-flats",
    name: "Flat colors",
    type: "raster",
    dataUrl: transparentPng,
    mimeType: "image/png",
    width: 1920,
    height: 1080,
    strokes: [{
      id: "face-base-fill",
      intent: "Fill the enclosed face shape.",
      source: "digital-artist",
      kind: "raster-region-fill",
      review: "approved",
      points: [{ x: 420, y: 180, pressure: 1 }, { x: 560, y: 190, pressure: 1 }, { x: 500, y: 360, pressure: 1 }],
      options: { color: "#efc4b1", opacity: 1, blendMode: "normal" }
    }]
  });
  const normalized = normalizeProject(project);
  const stroke = normalized.frames[0].layers.find(layer => layer.id === "artist-flats").strokes[0];
  assert.equal(stroke.kind, "raster-region-fill");
  assert.equal(stroke.review, "approved");
  assert.equal(stroke.options.color, "#efc4b1");
});

test("keeps legacy manual raster strokes compatible while assigning stable IDs", () => {
  const project = createProject("Legacy raster history");
  project.frames[0].layers.push({
    id: "manual-layer",
    name: "Manual",
    type: "raster",
    dataUrl: transparentPng,
    mimeType: "image/png",
    width: 1920,
    height: 1080,
    strokes: [{
      points: [{ x: 80, y: 90, pressure: .55 }],
      options: { brush: "graphite", size: 8, color: "#777777" }
    }]
  });

  const normalized = normalizeProject(project);
  const stroke = normalized.frames[0].layers.find(layer => layer.id === "manual-layer").strokes[0];
  assert.ok(stroke.id.startsWith("stroke-"));
  assert.equal(stroke.source, "manual");
  assert.equal(stroke.points.length, 1);
});
