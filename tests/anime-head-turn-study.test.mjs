import test from "node:test";
import assert from "node:assert/strict";
import {
  ANIME_HEAD_TURN_FPS, createAnimeHeadTurnPlan, sampleAnimeHeadTurn,
  createAnimeHeadTurnDrawingTasks
} from "../app/anime-head-turn-study.mjs";
const clumps = (shift = 0) => [
  { id: "bang-center", depth: "front", root: { x: .5, y: .22 }, tip: { x: .49 + shift, y: .48 }, followThrough: .9 },
  { id: "side-left", depth: "side", root: { x: .28, y: .3 }, tip: { x: .18 + shift, y: .72 }, followThrough: .65 },
  { id: "rear-mass", depth: "back", root: { x: .45, y: .2 }, tip: { x: .37 + shift, y: .78 }, followThrough: .35 }
];
function makePlan(overrides = {}) {
  return createAnimeHeadTurnPlan({
    characterAssetId: "approved-character-01", characterDNAId: "character-dna-01",
    keyPoses: [
      { id: "front", frame: 0, description: "Neutral front-facing head drawing.", view: "front", yawDegrees: 0, gaze: { x: 0, y: 0 }, hairClumps: clumps(), easeToNext: "ease-in-out" },
      { id: "turn", frame: 23, description: "Head turned to the right in three-quarter view.", view: "three-quarter", yawDegrees: 48, pitchDegrees: 2, rollDegrees: -1, gaze: { x: .45, y: 0 }, hairClumps: clumps(.035) }
    ], ...overrides
  });
}
test("head-turn study preserves 24 independently authored drawings per second", () => {
  const plan = makePlan();
  assert.equal(ANIME_HEAD_TURN_FPS, 24);
  assert.equal(plan.totalFrames, 24);
  assert.equal(plan.targetUniqueDrawingsPerSecond, 24);
  assert.equal(plan.characterDNAId, "character-dna-01");
});
test("head-turn guide changes yaw, view and gaze through the shot", () => {
  const plan = makePlan();
  const first = sampleAnimeHeadTurn(plan, 0), middle = sampleAnimeHeadTurn(plan, 12), last = sampleAnimeHeadTurn(plan, 23);
  assert.equal(first.pose.yawDegrees, 0);
  assert.ok(middle.pose.yawDegrees > 0 && middle.pose.yawDegrees < 48);
  assert.equal(last.pose.yawDegrees, 48);
  assert.ok(middle.pose.gaze.x > 0);
  assert.equal(last.pose.view, "three-quarter");
});
test("hair roots stay attached while tips receive turn-opposed follow-through", () => {
  const sample = sampleAnimeHeadTurn(makePlan(), 12);
  const bang = sample.hairClumps.find(item => item.id === "bang-center");
  assert.deepEqual(bang.root, { x: .5, y: .22 });
  assert.ok(bang.followThroughOffset.x < 0);
  assert.ok(bang.tip.x < bang.baseTip.x);
});
test("hair identity and clump depth remain stable between key drawings", () => {
  const plan = makePlan();
  const a = sampleAnimeHeadTurn(plan, 2), b = sampleAnimeHeadTurn(plan, 20);
  assert.deepEqual(a.hairClumps.map(item => [item.id, item.depth]), b.hairClumps.map(item => [item.id, item.depth]));
});
test("all 24 frames become full independent redraw tasks with required art departments", () => {
  const tasks = createAnimeHeadTurnDrawingTasks(makePlan());
  assert.equal(tasks.length, 24);
  assert.ok(tasks.every(task => task.drawingRequirement === "complete-independent-character-redraw"));
  assert.ok(tasks.every(task => task.exposureFrames === 1 && task.approvalRequired));
  assert.ok(tasks.every(task => task.requiredDepartments.includes("hair-overlap")));
  assert.equal(tasks.filter(task => task.kind === "key-drawing").length, 2);
});
test("plan rejects missing identity, non-24 cadence, invalid angle and incomplete time coverage", () => {
  const plan = makePlan();
  assert.throws(() => makePlan({ characterDNAId: "" }), /هوية Character DNA/);
  assert.throws(() => makePlan({ fps: 12 }), /24/);
  assert.throws(() => createAnimeHeadTurnPlan({ characterAssetId: "x", keyPoses: [{ ...plan.keyPoses[0] }, { ...plan.keyPoses[1], yawDegrees: 120 }] }), /دوران الرأس/);
  assert.throws(() => makePlan({ keyPoses: plan.keyPoses.slice(1) }), /الإطارين الأول والأخير/);
});
test("plan rejects changing hair clump identities across poses", () => {
  const plan = makePlan();
  const altered = plan.keyPoses[1].hairClumps.map(item => ({ ...item }));
  altered[0].id = "new-lock";
  assert.throws(() => makePlan({ keyPoses: [plan.keyPoses[0], { ...plan.keyPoses[1], hairClumps: altered }] }), /هوية خصل الشعر/);
});
test("motion guide is never mislabeled as final artwork", () => {
  const sample = sampleAnimeHeadTurn(makePlan(), 10);
  assert.equal(sample.guideOnly, true);
  assert.equal(sample.finalArtworkDeformation, false);
});
