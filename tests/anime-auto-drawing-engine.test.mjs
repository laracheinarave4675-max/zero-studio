import test from "node:test";
import assert from "node:assert/strict";
import {
  ANIME_AUTO_DRAWING_FPS,
  ANIME_AUTO_DRAWING_FRAMES,
  ANIME_AUTO_KEY_FRAMES,
  createAnimeAutoDrawingPlan,
  createAnimeAutoDrawingOrder,
  createAnimeAutoDrawingRequest,
  validateAnimeAutoDrawingPlan
} from "../app/anime-auto-drawing-engine.mjs";

const image = (index = 0) => "data:image/png;base64," + Buffer.from("frame-" + index).toString("base64");

test("automatic walk plan fixes 24 unique drawing timepoints and five key poses", () => {
  const plan = createAnimeAutoDrawingPlan({ characterName: "Kimono girl" });
  assert.equal(plan.fps, 24);
  assert.equal(plan.totalFrames, 24);
  assert.equal(plan.frames.length, 24);
  assert.deepEqual(plan.keyDrawingFrames, [0, 6, 12, 18, 23]);
  assert.equal(plan.frames[23].timeSeconds, Number((23 / 24).toFixed(5)));
  assert.equal(plan.frames.every(frame => frame.exposureFrames === 1), true);
  assert.equal(validateAnimeAutoDrawingPlan(plan).format, "zero-studio-anime-auto-drawing-plan");
});

test("key drawings are generated before in-betweens", () => {
  const plan = createAnimeAutoDrawingPlan({});
  const order = createAnimeAutoDrawingOrder(plan);
  assert.equal(order.length, ANIME_AUTO_DRAWING_FRAMES);
  assert.deepEqual(order.slice(0, 5), [...ANIME_AUTO_KEY_FRAMES]);
  assert.equal(new Set(order).size, ANIME_AUTO_DRAWING_FRAMES);
  assert.equal(ANIME_AUTO_DRAWING_FPS, 24);
});

test("first key drawing uses the approved model sheet as identity only", () => {
  const plan = createAnimeAutoDrawingPlan({});
  const request = createAnimeAutoDrawingRequest(plan, 0, { identityReference: image("identity") });
  assert.equal(request.model, "flux-2-klein-4b");
  assert.deepEqual(request.referenceRoles, ["identity"]);
  assert.equal(request.references.length, 1);
  assert.match(request.prompt, /one character in one pose only/i);
  assert.match(request.prompt, /independent redraw/i);
});

test("later key drawings use generated key poses as pose references", () => {
  const plan = createAnimeAutoDrawingPlan({});
  const request = createAnimeAutoDrawingRequest(plan, 6, {
    identityReference: image("identity"),
    generatedFrames: { 0: image(0) }
  });
  assert.deepEqual(request.referenceRoles, ["identity", "pose"]);
  assert.equal(request.frameKind, "key-drawing");
});

test("in-between drawing uses both neighboring keys and local continuity", () => {
  const plan = createAnimeAutoDrawingPlan({});
  const request = createAnimeAutoDrawingRequest(plan, 2, {
    identityReference: image("identity"),
    generatedFrames: { 0: image(0), 1: image(1), 6: image(6) }
  });
  assert.deepEqual(request.referenceRoles, ["identity", "pose", "pose", "continuity"]);
  assert.equal(request.references.length, 4);
  assert.match(request.prompt, /Pose-reference images control pose and movement only/i);
  assert.match(request.prompt, /Do not copy their exact drawing/i);
});

test("in-between generation refuses to run without both surrounding key drawings", () => {
  const plan = createAnimeAutoDrawingPlan({});
  assert.throws(() => createAnimeAutoDrawingRequest(plan, 3, {
    identityReference: image("identity"),
    generatedFrames: { 0: image(0) }
  }), /required pose reference/i);
});

test("invalid identity refs and out-of-range frame indexes are rejected", () => {
  const plan = createAnimeAutoDrawingPlan({});
  assert.throws(() => createAnimeAutoDrawingRequest(plan, 0, { identityReference: "https://example.com/model.png" }), /compressed PNG/i);
  assert.throws(() => createAnimeAutoDrawingRequest(plan, 24, { identityReference: image("identity") }), /between 0 and 23/i);
});

test("chroma-key extraction makes the flat blue background transparent while retaining character pixels", async () => {
  const { removeAnimeChromaKeyFromRgba } = await import("../app/anime-auto-drawing-engine.mjs");
  const pixels = new Uint8ClampedArray([
    0, 174, 239, 255,       // exact blue backdrop
    18, 22, 28, 255,        // dark hair / line art
    246, 226, 190, 255      // ivory costume
  ]);
  const result = removeAnimeChromaKeyFromRgba(pixels);
  assert.equal(result.data[3], 0);
  assert.equal(result.data[7], 255);
  assert.equal(result.data[11], 255);
  assert.ok(result.transparentPixels >= 1);
  assert.ok(result.opaquePixels >= 2);
});

test("chroma-key extraction retains antialiased edge coverage and rejects images without a key background", async () => {
  const { removeAnimeChromaKeyFromRgba } = await import("../app/anime-auto-drawing-engine.mjs");
  const mixed = new Uint8ClampedArray([0, 174, 239, 255, 128, 214, 247, 255, 15, 20, 25, 255]);
  const result = removeAnimeChromaKeyFromRgba(mixed);
  assert.equal(result.data[3], 0);
  assert.ok(result.data[7] > 0 && result.data[7] < 255);
  assert.equal(result.data[11], 255);
  assert.throws(() => removeAnimeChromaKeyFromRgba(new Uint8ClampedArray([40, 40, 40, 255])), /both a removable blue backdrop/i);
});
