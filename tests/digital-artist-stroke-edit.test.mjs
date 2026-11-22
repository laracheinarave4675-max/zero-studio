import test from "node:test";
import assert from "node:assert/strict";
import { validateDigitalArtistStrokeEdit } from "../app/digital-artist-stroke-edit.mjs";

const brushStroke = () => ({
  id: "face-outline", source: "digital-artist", kind: "raster-brush-stroke",
  review: "approved",
  intent: "Ink the cheek contour.",
  points: [{ x: 400, y: 200, pressure: .3 }, { x: 480, y: 280, pressure: .8 }],
  options: { brush: "ink", size: 7, color: "#24202a", opacity: 1, texture: 0, blendMode: "normal", pressureSensitive: true, erase: false, seed: 4 }
});
const regionFill = () => ({
  id: "face-base", source: "digital-artist", kind: "raster-region-fill",
  review: "approved",
  intent: "Fill the face region.",
  points: [{ x: 300, y: 200, pressure: 1 }, { x: 500, y: 210, pressure: 1 }, { x: 450, y: 400, pressure: 1 }],
  options: { color: "#efc4b1", opacity: 1, blendMode: "normal" }
});

test("edits brush points and options while retaining stable identity and resetting review", () => {
  const current = brushStroke();
  const edited = validateDigitalArtistStrokeEdit(current, {
    intent: "Refine the cheek contour.",
    points: [{ x: 410, y: 205, pressure: .4 }, { x: 490, y: 290, pressure: .9 }],
    options: { ...current.options, size: 9, color: "#312633" }
  });
  assert.equal(edited.id, current.id);
  assert.equal(edited.source, "digital-artist");
  assert.equal(edited.kind, "raster-brush-stroke");
  assert.equal(edited.review, "pending");
  assert.equal(edited.points[1].pressure, .9);
  assert.equal(edited.options.size, 9);
  assert.equal(current.review, "approved");
});

test("edits closed region-fill geometry and style", () => {
  const current = regionFill();
  const edited = validateDigitalArtistStrokeEdit(current, {
    intent: "Tighten the cheek silhouette fill.",
    points: [{ x: 310, y: 205 }, { x: 510, y: 205 }, { x: 455, y: 390 }],
    options: { color: "#eec0ae", opacity: .92, blendMode: "normal" }
  });
  assert.equal(edited.kind, "raster-region-fill");
  assert.equal(edited.points[0].pressure, 1);
  assert.equal(edited.options.color, "#eec0ae");
  assert.equal(edited.review, "pending");
});

test("rejects malformed points, unsafe bounds, and unsupported brush settings", () => {
  const current = brushStroke();
  assert.throws(() => validateDigitalArtistStrokeEdit(current, {
    intent: "Bad edit", points: [], options: current.options
  }), /invalid size/);
  assert.throws(() => validateDigitalArtistStrokeEdit(current, {
    intent: "Bad edit", points: [{ x: 3000, y: 1 }], options: current.options
  }), /outside/);
  assert.throws(() => validateDigitalArtistStrokeEdit(current, {
    intent: "Bad edit", points: current.points, options: { ...current.options, brush: "diffusion" }
  }), /unsupported/);
});

test("rejects invalid or incomplete region-fill corrections", () => {
  const current = regionFill();
  assert.throws(() => validateDigitalArtistStrokeEdit(current, {
    intent: "Bad fill", points: [{ x: 1, y: 1 }, { x: 2, y: 2 }], options: current.options
  }), /invalid size/);
  assert.throws(() => validateDigitalArtistStrokeEdit(current, {
    intent: "Bad fill", points: current.points, options: { ...current.options, color: "pink" }
  }), /six-digit/);
});
