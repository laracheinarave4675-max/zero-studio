import test from "node:test";
import assert from "node:assert/strict";
import { fillRasterRegion } from "../app/raster-brushes.mjs";

function contextSpy() {
  const events = [];
  return {
    events,
    save() { events.push(["save"]); },
    restore() { events.push(["restore"]); },
    beginPath() { events.push(["beginPath"]); },
    moveTo(x, y) { events.push(["moveTo", x, y]); },
    lineTo(x, y) { events.push(["lineTo", x, y]); },
    closePath() { events.push(["closePath"]); },
    fill() { events.push(["fill"]); },
    set globalAlpha(value) { events.push(["alpha", value]); },
    set globalCompositeOperation(value) { events.push(["blend", value]); },
    set fillStyle(value) { events.push(["color", value]); }
  };
}

test("raster region fill closes the artist polygon and restores Canvas2D state", () => {
  const context = contextSpy();
  const result = fillRasterRegion(context, [
    { x: 120, y: 140 }, { x: 260, y: 150 }, { x: 230, y: 310 }, { x: 130, y: 280 }
  ], { color: "#efc4b1", opacity: 0.85, blendMode: "normal" });
  assert.deepEqual(result, {
    pointCount: 4, color: "#efc4b1", opacity: 0.85, blendMode: "normal",
    renderMode: "closed-region-fill"
  });
  assert.deepEqual(context.events.map(event => event[0]), [
    "save", "alpha", "blend", "color", "beginPath", "moveTo",
    "lineTo", "lineTo", "lineTo", "closePath", "fill", "restore"
  ]);
});

test("raster region fill rejects open or out-of-canvas geometry before painting", () => {
  const context = contextSpy();
  assert.throws(() => fillRasterRegion(context, [{ x: 1, y: 1 }, { x: 2, y: 2 }]), /تحتاج إلى ثلاث نقاط/);
  assert.throws(() => fillRasterRegion(context, [
    { x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3000, y: 3 }
  ]), /خارج مساحة الرسم/);
  assert.equal(context.events.length, 0);
});
