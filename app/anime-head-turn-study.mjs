// ZERO STUDIO — head-turn motion study.
// Produces anatomy/secondary-motion guides only. It never deforms or renders final artwork.
export const ANIME_HEAD_TURN_FPS = 24;
export const ANIME_HEAD_TURN_FRAMES = 24;
const VIEWS = new Set(["front", "three-quarter", "side"]);
const EASING = new Set(["linear", "ease-in", "ease-out", "ease-in-out"]);
const clean = (value, max = 160) => String(value ?? "").trim().replace(/[\u0000-\u001f]/g, "").slice(0, max);
const fail = message => { throw new Error(message); };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = (value, label, min, max) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) fail(label + " خارج المجال المسموح.");
  return number;
};
function point(value, label) {
  return { x: finite(value?.x, label + " x", 0, 1), y: finite(value?.y, label + " y", 0, 1) };
}
function normalizeClumps(items) {
  if (!Array.isArray(items) || items.length < 2 || items.length > 32) fail("يجب تعريف 2 إلى 32 خصلة شعر مسماة.");
  const ids = new Set();
  return items.map((item, index) => {
    const id = clean(item?.id, 80);
    if (!id || ids.has(id)) fail("معرّفات خصل الشعر مفقودة أو مكررة.");
    ids.add(id);
    const depth = String(item.depth || "front");
    if (!["front", "side", "back"].includes(depth)) fail("طبقة خصلة الشعر غير مدعومة.");
    return {
      id, depth, root: point(item.root, "جذر الخصلة " + (index + 1)),
      tip: point(item.tip, "طرف الخصلة " + (index + 1)),
      followThrough: finite(item.followThrough ?? 0.5, "استجابة الخصلة", 0, 1)
    };
  });
}
function normalizePose(pose, index) {
  const id = clean(pose?.id, 80);
  const frame = Number(pose?.frame);
  const description = clean(pose?.description, 400);
  const view = String(pose?.view || "front");
  if (!id || !Number.isInteger(frame) || frame < 0 || frame >= ANIME_HEAD_TURN_FRAMES || !description) {
    fail("بيانات وضعية الرأس رقم " + (index + 1) + " غير مكتملة.");
  }
  if (!VIEWS.has(view)) fail("زاوية الرأس غير مدعومة.");
  const easeToNext = String(pose.easeToNext || "ease-in-out");
  if (!EASING.has(easeToNext)) fail("منحنى انتقال الرأس غير مدعوم.");
  const gaze = {
    x: finite(pose.gaze?.x ?? 0, "اتجاه النظر الأفقي", -1, 1),
    y: finite(pose.gaze?.y ?? 0, "اتجاه النظر العمودي", -1, 1)
  };
  return {
    id, frame, description, view, easeToNext, gaze,
    yawDegrees: finite(pose.yawDegrees, "دوران الرأس الأفقي", -85, 85),
    pitchDegrees: finite(pose.pitchDegrees ?? 0, "ميل الرأس", -35, 35),
    rollDegrees: finite(pose.rollDegrees ?? 0, "إمالة الرأس", -30, 30),
    hairClumps: normalizeClumps(pose.hairClumps)
  };
}
function ease(t, curve) {
  if (curve === "ease-in") return t * t;
  if (curve === "ease-out") return 1 - (1 - t) * (1 - t);
  if (curve === "ease-in-out") return t * t * (3 - 2 * t);
  return t;
}
function lerp(a, b, t) { return a + (b - a) * t; }
function lerpPoint(a, b, t) { return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }; }
function segmentAt(plan, frame) {
  const exact = plan.keyPoses.find(pose => pose.frame === frame);
  if (exact) return { from: exact, to: exact, raw: 0, t: 0, exact: true };
  const to = plan.keyPoses.find(pose => pose.frame > frame);
  const from = [...plan.keyPoses].reverse().find(pose => pose.frame < frame);
  const raw = (frame - from.frame) / (to.frame - from.frame);
  return { from, to, raw, t: ease(raw, from.easeToNext), exact: false };
}
export function createAnimeHeadTurnPlan({
  shotId = "head-turn-01", characterAssetId, characterDNAId,
  durationSeconds = 1, fps = ANIME_HEAD_TURN_FPS, keyPoses,
  action = "The character turns their head from front to three-quarter view; hair follows with a soft delay."
} = {}) {
  const shot = clean(shotId, 100), character = clean(characterAssetId), dna = clean(characterDNAId || characterAssetId);
  if (!shot || !character || !dna) fail("يجب ربط دراسة الالتفات بأصل الشخصية وهوية Character DNA.");
  if (durationSeconds !== 1 || fps !== ANIME_HEAD_TURN_FPS) fail("اختبار الالتفات الأول ثابت على ثانية واحدة و24 رسمة مستقلة.");
  if (!Array.isArray(keyPoses) || keyPoses.length < 2 || keyPoses.length > 12) fail("تحتاج دراسة الالتفات إلى 2–12 وضعية مفتاحية.");
  const poses = keyPoses.map(normalizePose);
  if (poses[0].frame !== 0 || poses.at(-1).frame !== 23) fail("يجب أن تغطي الوضعيات المفتاحية الإطارين الأول والأخير.");
  const ids = new Set();
  for (let i = 0; i < poses.length; i++) {
    if (i && poses[i].frame <= poses[i - 1].frame) fail("رتّب الوضعيات المفتاحية زمنياً دون تكرار.");
    if (ids.has(poses[i].id)) fail("معرّفات وضعيات الرأس مكررة.");
    ids.add(poses[i].id);
    const baseline = poses[0].hairClumps.map(clump => clump.id).sort().join("|");
    if (poses[i].hairClumps.map(clump => clump.id).sort().join("|") !== baseline) fail("يجب الحفاظ على هوية خصل الشعر بين الوضعيات المفتاحية.");
  }
  return {
    format: "zero-studio-anime-head-turn-plan", version: 1, shotId: shot,
    characterAssetId: character, characterDNAId: dna, action: clean(action, 1000),
    durationSeconds: 1, fps: 24, totalFrames: 24, targetUniqueDrawingsPerSecond: 24,
    hairMotion: { model: "root-anchored-tip-follow-through-guide", finalArtworkDeformation: false },
    keyPoses: poses
  };
}
function validatePlan(plan) {
  if (!plan || plan.format !== "zero-studio-anime-head-turn-plan" || plan.version !== 1 ||
      plan.fps !== 24 || plan.totalFrames !== 24 || !Array.isArray(plan.keyPoses) || plan.keyPoses.length < 2) {
    fail("خطة التفات الرأس غير صالحة.");
  }
  return plan;
}
export function sampleAnimeHeadTurn(plan, frameIndex) {
  validatePlan(plan);
  if (!Number.isInteger(frameIndex) || frameIndex < 0 || frameIndex >= 24) fail("رقم إطار الالتفات خارج الحدود.");
  const segment = segmentAt(plan, frameIndex);
  const { from, to, t, raw } = segment;
  const interpolate = key => lerp(from[key], to[key], t);
  const clumps = from.hairClumps.map((clump, index) => {
    const next = to.hairClumps[index];
    const root = lerpPoint(clump.root, next.root, t);
    const baseTip = lerpPoint(clump.tip, next.tip, t);
    const yawVelocity = (to.yawDegrees - from.yawDegrees) / Math.max(1, to.frame - from.frame);
    const lag = clump.followThrough;
    const deflection = clamp(-yawVelocity * lag * 0.0022, -0.16, 0.16);
    return {
      id: clump.id, depth: clump.depth, root,
      tip: { x: clamp(baseTip.x + deflection, 0, 1), y: clamp(baseTip.y + Math.abs(deflection) * 0.16, 0, 1) },
      baseTip, followThroughOffset: { x: deflection, y: Math.abs(deflection) * 0.16 }
    };
  });
  return {
    frameIndex, timeSeconds: frameIndex / 24,
    source: segment.exact ? "approved-head-key-pose" : "interpolated-head-motion-guide",
    fromKeyPoseId: from.id, toKeyPoseId: to.id, progress: Number(t.toFixed(5)),
    pose: {
      yawDegrees: interpolate("yawDegrees"), pitchDegrees: interpolate("pitchDegrees"),
      rollDegrees: interpolate("rollDegrees"), gaze: {
        x: lerp(from.gaze.x, to.gaze.x, t), y: lerp(from.gaze.y, to.gaze.y, t)
      }, view: raw < 0.5 ? from.view : to.view
    },
    hairClumps: clumps,
    guideOnly: true,
    finalArtworkDeformation: false
  };
}
export function createAnimeHeadTurnDrawingTasks(plan) {
  validatePlan(plan);
  return Array.from({ length: 24 }, (_, frameIndex) => {
    const sample = sampleAnimeHeadTurn(plan, frameIndex);
    const keyPose = plan.keyPoses.find(pose => pose.frame === frameIndex);
    return {
      frameIndex, timeSeconds: frameIndex / 24, kind: keyPose ? "key-drawing" : "inbetween-drawing",
      keyPoseId: keyPose?.id || null, guide: sample,
      characterAssetId: plan.characterAssetId, characterDNAId: plan.characterDNAId,
      drawingRequirement: "complete-independent-character-redraw",
      requiredDepartments: ["head-volume", "face-features", "eyes-and-gaze", "hair-overlap", "neck-connection", "linework", "color-and-light"],
      exposureFrames: 1, approvalRequired: true
    };
  });
}
