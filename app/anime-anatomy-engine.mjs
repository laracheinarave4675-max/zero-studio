// ZERO STUDIO — anatomy-guided drawing engine.
// Geometry is a construction/reference layer only. Every accepted frame must be
// a complete, independently authored raster drawing reviewed by an artist.
export const ANIME_ANATOMY_FPS = 24;
export const ANIME_ANATOMY_JOINTS = Object.freeze([
  "root", "pelvis", "chest", "neck", "head",
  "shoulderL", "elbowL", "wristL", "shoulderR", "elbowR", "wristR",
  "hipL", "kneeL", "ankleL", "toeL", "hipR", "kneeR", "ankleR", "toeR"
]);
const CONTACTS = Object.freeze(["planted", "swing", "airborne", "unknown"]);
const VIEWS = Object.freeze(["front", "three-quarter", "side", "back"]);
const PHASES = Object.freeze(["anticipation", "action", "contact", "passing", "recovery", "settle"]);
const EASING = Object.freeze(["linear", "ease-in", "ease-out", "ease-in-out"]);
const BONE_PAIRS = Object.freeze({
  upperArmL: ["shoulderL", "elbowL"], lowerArmL: ["elbowL", "wristL"],
  upperArmR: ["shoulderR", "elbowR"], lowerArmR: ["elbowR", "wristR"],
  thighL: ["hipL", "kneeL"], shinL: ["kneeL", "ankleL"],
  thighR: ["hipR", "kneeR"], shinR: ["kneeR", "ankleR"],
  torso: ["pelvis", "chest"], neck: ["chest", "neck"], head: ["neck", "head"]
});
const clean = (value, max = 160) => String(value ?? "").trim().replace(/[\u0000-\u001f]/g, "").slice(0, max);
const fail = message => { throw new Error(message); };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

function normalizePoint(point, label) {
  const x = Number(point?.x), y = Number(point?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) {
    fail("موضع المفصل " + label + " يجب أن يكون بين 0 و1.");
  }
  return { x, y };
}

function normalizeGuide(source) {
  if (!source || typeof source !== "object") fail("دليل الوضعية التشريحي مفقود.");
  const joints = {};
  for (const name of ANIME_ANATOMY_JOINTS) joints[name] = normalizePoint(source.joints?.[name], name);
  const contacts = {};
  for (const side of ["L", "R"]) {
    const state = String(source.contacts?.["foot" + side] || "unknown");
    if (!CONTACTS.includes(state)) fail("حالة تماس القدم " + side + " غير مدعومة.");
    contacts["foot" + side] = state;
  }
  const view = String(source.view || "side");
  if (!VIEWS.includes(view)) fail("زاوية الشخصية غير مدعومة.");
  return { joints, contacts, view };
}

function calculateBoneLengths(guide) {
  const result = {};
  for (const [name, [from, to]] of Object.entries(BONE_PAIRS)) {
    const length = distance(guide.joints[from], guide.joints[to]);
    if (!Number.isFinite(length) || length < 0.004) fail("قياس العظمة " + name + " غير صالح.");
    result[name] = Number(length.toFixed(7));
  }
  return result;
}

/**
 * Creates a locked identity/anatomy record from one approved character drawing.
 * The source drawing is never modified. Its proportions become the reference.
 */
export function createAnimeCharacterDNA({
  characterAssetId, characterBibleId, modelSheetAssetIds = [], anchorGuide,
  anatomyVersion = 1, notes = ""
} = {}) {
  const character = clean(characterAssetId), bible = clean(characterBibleId || characterAssetId);
  if (!character || !bible) fail("يلزم ربط أصل الشخصية بكتاب هويتها.");
  if (anatomyVersion !== 1) fail("إصدار البنية التشريحية غير مدعوم.");
  const anchor = normalizeGuide(anchorGuide);
  const refs = [...new Set((Array.isArray(modelSheetAssetIds) ? modelSheetAssetIds : [])
    .map(value => clean(value)).filter(Boolean))];
  if (refs.includes(character)) fail("يجب ألا يتكرر أصل الشخصية ضمن أوراق النموذج.");
  return {
    format: "zero-studio-character-dna", version: 1, anatomyVersion,
    characterAssetId: character, characterBibleId: bible, modelSheetAssetIds: refs,
    canonicalView: anchor.view, anchorGuide: anchor,
    boneLengths: calculateBoneLengths(anchor),
    notes: clean(notes, 1000)
  };
}

function validateDNA(dna) {
  if (!dna || dna.format !== "zero-studio-character-dna" || dna.version !== 1 ||
      dna.anatomyVersion !== 1 || !dna.characterAssetId || !dna.characterBibleId) {
    fail("سجل هوية الشخصية التشريحي غير صالح.");
  }
  const anchor = normalizeGuide(dna.anchorGuide);
  const lengths = calculateBoneLengths(anchor);
  for (const name of Object.keys(BONE_PAIRS)) {
    if (!Number.isFinite(dna.boneLengths?.[name]) ||
        Math.abs(dna.boneLengths[name] - lengths[name]) > 0.00001) {
      fail("قياسات الشخصية الثابتة لا تطابق مرجعها: " + name);
    }
  }
  return dna;
}

function normalizeKeyDrawing(item, index, totalFrames, dna) {
  if (!item || typeof item !== "object") fail("إحدى الرسومات المفتاحية غير صالحة.");
  const id = clean(item.id, 100), frame = Number(item.frame);
  const drawingAssetId = clean(item.drawingAssetId, 160);
  const phase = String(item.phase || "action"), easeToNext = String(item.easeToNext || "linear");
  if (!id || !drawingAssetId || !Number.isInteger(frame) || frame < 0 || frame >= totalFrames) {
    fail("بيانات الرسمة المفتاحية رقم " + (index + 1) + " غير مكتملة.");
  }
  if (item.approved !== true) fail("لا تقبل الخطة إلا رسماً مفتاحياً كاملاً ومعتمداً من الفنان.");
  if (!PHASES.includes(phase) || !EASING.includes(easeToNext)) fail("توقيت أو مرحلة الرسمة المفتاحية غير مدعوم.");
  const guide = normalizeGuide(item.guide);
  if (guide.view !== dna.canonicalView) fail("تغير منظور اللقطة؛ أضف رسمة مفتاحية ومنظوراً تشريحياً جديداً.");
  return { id, frame, drawingAssetId, approved: true, phase, easeToNext, guide, note: clean(item.note, 600) };
}

/**
 * Creates the deterministic 24-drawing-per-second timing plan.
 * Key drawings must already be complete and artist-approved.
 */
export function createAnimeAnatomyPlan({
  shotId = "shot-1", action, characterDNA, backgroundAssetId = null,
  durationSeconds = 1, fps = ANIME_ANATOMY_FPS, keyDrawings, motionNotes = ""
} = {}) {
  const dna = validateDNA(characterDNA);
  const shot = clean(shotId, 100), brief = clean(action, 1800);
  if (!shot || !brief) fail("يجب وصف اللقطة والحركة.");
  if (fps !== ANIME_ANATOMY_FPS) fail("الهدف ثابت: 24 رسمة مستقلة في الثانية.");
  if (!Number.isInteger(durationSeconds) || durationSeconds < 1 || durationSeconds > 60) {
    fail("مدة اللقطة يجب أن تكون بين ثانية و60 ثانية.");
  }
  const totalFrames = durationSeconds * fps;
  if (!Array.isArray(keyDrawings) || keyDrawings.length < 2 || keyDrawings.length > totalFrames) {
    fail("تحتاج اللقطة إلى رسمتين مفتاحيتين كاملتين على الأقل.");
  }
  const keys = keyDrawings.map((item, index) => normalizeKeyDrawing(item, index, totalFrames, dna));
  if (keys[0].frame !== 0 || keys.at(-1).frame !== totalFrames - 1) {
    fail("يجب أن تغطي الرسومات المفتاحية أول إطار وآخر إطار.");
  }
  const ids = new Set(), drawingIds = new Set();
  for (let i = 0; i < keys.length; i++) {
    if (i && keys[i].frame <= keys[i - 1].frame) fail("رتب الرسومات المفتاحية زمنياً دون تكرار.");
    if (ids.has(keys[i].id) || drawingIds.has(keys[i].drawingAssetId)) fail("تكررت هوية إحدى الرسومات المفتاحية.");
    ids.add(keys[i].id); drawingIds.add(keys[i].drawingAssetId);
  }
  return {
    format: "zero-studio-anatomy-motion-plan", version: 1, shotId: shot, action: brief,
    characterDNA: dna, characterAssetId: dna.characterAssetId, characterBibleId: dna.characterBibleId,
    backgroundAssetId: backgroundAssetId ? clean(backgroundAssetId) : null,
    durationSeconds, fps, totalFrames, targetUniqueDrawingsPerSecond: 24,
    motionNotes: clean(motionNotes, 1200), keyDrawings: keys
  };
}

function ease(t, curve) {
  if (curve === "ease-in") return t * t;
  if (curve === "ease-out") return 1 - (1 - t) * (1 - t);
  if (curve === "ease-in-out") return t * t * (3 - 2 * t);
  return t;
}

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function interpolateGuide(keys, segmentIndex, progress) {
  const before = keys[Math.max(0, segmentIndex - 1)].guide;
  const from = keys[segmentIndex].guide;
  const to = keys[segmentIndex + 1].guide;
  const after = keys[Math.min(keys.length - 1, segmentIndex + 2)].guide;
  const joints = {};
  for (const name of ANIME_ANATOMY_JOINTS) {
    joints[name] = {
      x: clamp(catmullRom(before.joints[name].x, from.joints[name].x, to.joints[name].x, after.joints[name].x, progress), 0, 1),
      y: clamp(catmullRom(before.joints[name].y, from.joints[name].y, to.joints[name].y, after.joints[name].y, progress), 0, 1)
    };
  }
  const contacts = {
    footL: from.guide.contacts.footL,
    footR: from.guide.contacts.footR
  };
  return { joints, contacts, view: from.guide.view };
}

function solveTwoBone(start, target, upperLength, lowerLength, bendSign, preserveTarget = false) {
  const dx = target.x - start.x, dy = target.y - start.y;
  const rawDistance = Math.hypot(dx, dy);
  const minReach = Math.abs(upperLength - lowerLength) + 0.0005;
  const maxReach = upperLength + lowerLength - 0.0005;
  const reach = clamp(rawDistance, minReach, maxReach);
  const ux = rawDistance > 1e-8 ? dx / rawDistance : 1;
  const uy = rawDistance > 1e-8 ? dy / rawDistance : 0;
  const reachableEnd = { x: start.x + ux * reach, y: start.y + uy * reach };
  const end = preserveTarget ? { ...target } : reachableEnd;
  const along = (upperLength * upperLength - lowerLength * lowerLength + reach * reach) / (2 * reach);
  const height = Math.sqrt(Math.max(0, upperLength * upperLength - along * along));
  const sign = bendSign < 0 ? -1 : 1;
  const middle = {
    x: start.x + ux * along - uy * height * sign,
    y: start.y + uy * along + ux * height * sign
  };
  return { middle, end, reachAdjusted: Math.abs(reach - rawDistance) > 1e-5 };
}

function bendDirection(guide, startName, middleName, endName) {
  const a = guide.joints[startName], b = guide.joints[middleName], c = guide.joints[endName];
  const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  return cross < 0 ? -1 : 1;
}

function lockPlantedFoot(keys, frameIndex, side, joints) {
  let anchor = null;
  for (const key of keys) {
    if (key.frame > frameIndex) break;
    if (key.guide.contacts["foot" + side] === "planted") anchor = key;
    else if (anchor) anchor = null;
  }
  if (!anchor) return null;
  const ankle = anchor.guide.joints["ankle" + side], toe = anchor.guide.joints["toe" + side];
  joints["ankle" + side] = { ...ankle };
  joints["toe" + side] = { ...toe };
  return anchor.id;
}

function applyAnatomicalConstraints(plan, guide, frameIndex) {
  const joints = Object.fromEntries(ANIME_ANATOMY_JOINTS.map(name => [name, { ...guide.joints[name] }]));
  const lengths = plan.characterDNA.boneLengths;
  const bend = plan.characterDNA.anchorGuide;
  const lockedFeet = {}, constraintWarnings = [];
  for (const side of ["L", "R"]) {
    for (const [upperName, lowerName, startName, middleName, endName] of [
      ["upperArm" + side, "lowerArm" + side, "shoulder" + side, "elbow" + side, "wrist" + side],
      ["thigh" + side, "shin" + side, "hip" + side, "knee" + side, "ankle" + side]
    ]) {
      if (middleName === "knee" + side) {
        const anchorId = lockPlantedFoot(plan.keyDrawings, frameIndex, side, joints);
        if (anchorId) lockedFeet["foot" + side] = anchorId;
      }
      const planted = middleName === "knee" + side && !!lockedFeet["foot" + side];
      const solved = solveTwoBone(
        joints[startName], joints[endName], lengths[upperName], lengths[lowerName],
        bendDirection(bend, startName, middleName, endName), planted
      );
      joints[middleName] = solved.middle;
      if (!planted) joints[endName] = solved.end;
      if (planted && solved.reachAdjusted) {
        constraintWarnings.push("foot" + side + " is anchored but the current body pose exceeds the measured leg reach; add or redraw a key pose.");
      }
    }
  }
  const centerOfMass = {
    x: joints.root.x * 0.2 + joints.pelvis.x * 0.5 + joints.chest.x * 0.3,
    y: joints.root.y * 0.2 + joints.pelvis.y * 0.5 + joints.chest.y * 0.3
  };
  return { joints, centerOfMass, lockedFeet, constraintWarnings };
}

export function getAnimeAnatomyFrameRole(plan, frameIndex) {
  validateAnimeAnatomyPlan(plan);
  if (!Number.isInteger(frameIndex) || frameIndex < 0 || frameIndex >= plan.totalFrames) fail("رقم الإطار خارج حدود اللقطة.");
  const exact = plan.keyDrawings.find(item => item.frame === frameIndex);
  if (exact) return {
    frameIndex, timeSeconds: frameIndex / plan.fps, kind: "key-drawing",
    keyDrawingId: exact.id, fromKeyDrawingId: exact.id, toKeyDrawingId: exact.id
  };
  const from = [...plan.keyDrawings].reverse().find(item => item.frame < frameIndex);
  const to = plan.keyDrawings.find(item => item.frame > frameIndex);
  return {
    frameIndex, timeSeconds: frameIndex / plan.fps, kind: "artist-inbetween",
    keyDrawingId: null, fromKeyDrawingId: from.id, toKeyDrawingId: to.id
  };
}

function validateAnimeAnatomyPlan(plan) {
  if (!plan || plan.format !== "zero-studio-anatomy-motion-plan" || plan.version !== 1 ||
      plan.fps !== 24 || plan.totalFrames !== plan.durationSeconds * 24 ||
      !Array.isArray(plan.keyDrawings) || plan.keyDrawings.length < 2) {
    fail("خطة التحريك التشريحي غير صالحة.");
  }
  validateDNA(plan.characterDNA);
  return plan;
}

/**
 * Samples a spatial construction guide. It does not deform or render the character.
 * Artists redraw the complete character over this guide for every non-key frame.
 */
export function sampleAnimeAnatomyGuide(plan, frameIndex) {
  const role = getAnimeAnatomyFrameRole(plan, frameIndex);
  const exact = plan.keyDrawings.find(item => item.frame === frameIndex);
  if (exact) {
    return {
      frameIndex, source: "approved-key-drawing-guide", keyDrawingId: exact.id,
      guide: normalizeGuide(exact.guide), centerOfMass: {
        x: exact.guide.joints.root.x * 0.2 + exact.guide.joints.pelvis.x * 0.5 + exact.guide.joints.chest.x * 0.3,
        y: exact.guide.joints.root.y * 0.2 + exact.guide.joints.pelvis.y * 0.5 + exact.guide.joints.chest.y * 0.3
      }, lockedFeet: {}
    };
  }
  const fromIndex = plan.keyDrawings.findIndex(item => item.id === role.fromKeyDrawingId);
  const from = plan.keyDrawings[fromIndex], to = plan.keyDrawings[fromIndex + 1];
  const raw = (frameIndex - from.frame) / (to.frame - from.frame);
  const progress = ease(raw, from.easeToNext);
  const interpolated = interpolateGuide(plan.keyDrawings, fromIndex, progress);
  const constrained = applyAnatomicalConstraints(plan, interpolated, frameIndex);
  return {
    frameIndex, source: "anatomy-constrained-construction-guide",
    fromKeyDrawingId: from.id, toKeyDrawingId: to.id, progress: Number(progress.toFixed(6)),
    guide: { ...interpolated, joints: constrained.joints },
    centerOfMass: constrained.centerOfMass, lockedFeet: constrained.lockedFeet,
    constraintWarnings: constrained.constraintWarnings
  };
}

/** A compact drawing construction sheet: centerline, joint graph and limb-width guides. */
export function buildAnimeAnatomyConstruction(plan, frameIndex) {
  const sampled = sampleAnimeAnatomyGuide(plan, frameIndex);
  const j = sampled.guide.joints, lengths = plan.characterDNA.boneLengths;
  const segments = [
    ["torso", "pelvis", "chest", lengths.torso * 0.42],
    ["neck", "chest", "neck", lengths.neck * 0.5],
    ["head", "neck", "head", lengths.head * 0.9],
    ["upperArmL", "shoulderL", "elbowL", lengths.upperArmL * 0.3],
    ["lowerArmL", "elbowL", "wristL", lengths.lowerArmL * 0.24],
    ["upperArmR", "shoulderR", "elbowR", lengths.upperArmR * 0.3],
    ["lowerArmR", "elbowR", "wristR", lengths.lowerArmR * 0.24],
    ["thighL", "hipL", "kneeL", lengths.thighL * 0.34],
    ["shinL", "kneeL", "ankleL", lengths.shinL * 0.27],
    ["thighR", "hipR", "kneeR", lengths.thighR * 0.34],
    ["shinR", "kneeR", "ankleR", lengths.shinR * 0.27]
  ].map(([id, from, to, width]) => ({ id, from: { ...j[from] }, to: { ...j[to] }, width }));
  return {
    frameIndex, guideOnly: true, characterAssetId: plan.characterAssetId,
    canonicalView: plan.characterDNA.canonicalView, centerOfMass: sampled.centerOfMass,
    lockedFeet: sampled.lockedFeet, constraintWarnings: sampled.constraintWarnings || [], joints: j, segments
  };
}

export function createAnimeFrameDrawingTasks(plan) {
  validateAnimeAnatomyPlan(plan);
  return Array.from({ length: plan.totalFrames }, (_, frameIndex) => {
    const role = getAnimeAnatomyFrameRole(plan, frameIndex);
    return {
      ...role, drawingRequirement: "complete-independent-raster-redraw",
      authoringMode: role.kind === "key-drawing" ? "approved-key-art" : "artist-redraw-from-anatomy-guide",
      construction: buildAnimeAnatomyConstruction(plan, frameIndex),
      drawing: null, review: { status: "pending" }, exposureFrames: 1
    };
  });
}

export function createAnimeAnatomySequence(plan) {
  validateAnimeAnatomyPlan(plan);
  return {
    format: "zero-studio-anatomy-raster-sequence", version: 1, shotId: plan.shotId,
    fps: 24, durationSeconds: plan.durationSeconds, characterAssetId: plan.characterAssetId,
    backgroundAssetId: plan.backgroundAssetId, plan, frames: createAnimeFrameDrawingTasks(plan)
  };
}

export function attachAnimeFrameDrawing(sequence, frameIndex, drawing) {
  if (!sequence || sequence.format !== "zero-studio-anatomy-raster-sequence" ||
      sequence.version !== 1 || !Array.isArray(sequence.frames)) fail("تسلسل الرسومات التشريحي غير صالح.");
  const frame = sequence.frames[frameIndex];
  if (!frame || frame.frameIndex !== frameIndex) fail("الإطار المطلوب غير موجود.");
  if (frame.drawing) fail("هذا الإطار يحتوي رسمة بالفعل.");
  const assetId = clean(drawing?.assetId), hash = String(drawing?.contentHash || "").trim().toLowerCase();
  const mimeType = String(drawing?.mimeType || ""), width = Number(drawing?.width), height = Number(drawing?.height);
  const dataUrl = drawing?.dataUrl;
  if (!assetId || !/^[a-f0-9]{16,128}$/.test(hash) ||
      !["image/png", "image/webp"].includes(mimeType) ||
      !Number.isInteger(width) || !Number.isInteger(height) ||
      width < 1 || height < 1 || width > 8192 || height > 8192 || drawing?.alpha !== true) {
    fail("الرسمة النهائية يجب أن تكون Raster مستقلة مع قناة شفافية حقيقية.");
  }
  if (dataUrl !== undefined) {
    const prefix = "data:" + mimeType + ";base64,";
    if (typeof dataUrl !== "string" || !dataUrl.startsWith(prefix) ||
        dataUrl.length > 32 * 1024 * 1024 || !/^[A-Za-z0-9+/]*={0,2}$/.test(dataUrl.slice(prefix.length))) {
      fail("بيانات صورة الإطار غير صالحة.");
    }
  }
  if (sequence.frames.some(item => item.drawing &&
      (item.drawing.assetId === assetId || item.drawing.contentHash === hash))) {
    fail("لا يمكن استخدام الرسمة نفسها مرتين؛ كل إطار يحتاج رسماً مستقلاً.");
  }
  frame.drawing = { assetId, contentHash: hash, mimeType, width, height, alpha: true,
    ...(dataUrl !== undefined ? { dataUrl } : {}) };
  return frame;
}

export function reviewAnimeFrame(sequence, frameIndex, review) {
  const frame = sequence?.frames?.[frameIndex];
  if (!frame?.drawing) fail("لا يمكن مراجعة إطار قبل إرفاق رسمته الكاملة.");
  const checks = ["identity", "anatomy", "lineQuality", "timing"];
  const result = {};
  for (const key of checks) {
    if (typeof review?.[key] !== "boolean") fail("نتيجة مراجعة " + key + " يجب أن تكون واضحة.");
    result[key] = review[key];
  }
  frame.review = { status: checks.every(key => result[key]) ? "approved" : "rejected", ...result,
    note: clean(review?.note, 600) };
  return frame.review;
}

export function auditAnimeAnatomySequence(sequence, { requireApproved = true } = {}) {
  if (!sequence || sequence.format !== "zero-studio-anatomy-raster-sequence" ||
      sequence.version !== 1 || sequence.fps !== 24 || !Array.isArray(sequence.frames) ||
      sequence.frames.length !== sequence.durationSeconds * 24) {
    fail("التسلسل لا يطابق شرط 24 رسمة مستقلة في الثانية.");
  }
  const hashes = new Set(), assetIds = new Set();
  let drawn = 0, approved = 0, rejected = 0;
  for (let index = 0; index < sequence.frames.length; index++) {
    const frame = sequence.frames[index];
    if (frame.frameIndex !== index || frame.timeSeconds !== index / 24 ||
        frame.exposureFrames !== 1 || frame.drawingRequirement !== "complete-independent-raster-redraw") {
      fail("بيانات الإطار " + (index + 1) + " غير صحيحة.");
    }
    if (!frame.drawing) {
      if (requireApproved) fail("لم تُرسم الصورة المستقلة للإطار " + (index + 1) + " بعد.");
      continue;
    }
    if (hashes.has(frame.drawing.contentHash) || assetIds.has(frame.drawing.assetId)) {
      fail("اكتُشفت رسومات Raster مكررة.");
    }
    hashes.add(frame.drawing.contentHash); assetIds.add(frame.drawing.assetId); drawn++;
    if (frame.review?.status === "approved") approved++;
    else if (frame.review?.status === "rejected") rejected++;
    else if (requireApproved) fail("الإطار " + (index + 1) + " لم يجتز المراجعة الفنية.");
  }
  const uniquePerSecond = Number((hashes.size / sequence.durationSeconds).toFixed(3));
  return {
    frameCount: sequence.frames.length, drawnFrames: drawn, approvedFrames: approved,
    rejectedFrames: rejected, missingFrames: sequence.frames.length - drawn,
    uniqueDrawingCount: hashes.size, uniqueDrawingsPerSecond: uniquePerSecond,
    meets24UniqueApprovedDrawingsPerSecond: approved === sequence.frames.length &&
      hashes.size === sequence.frames.length
  };
}

/** Paints only an anatomical construction overlay; never produces character artwork. */
export function renderAnimeAnatomyGuide(canvas, plan, frameIndex, { width = 512, height = 512 } = {}) {
  if (!canvas || typeof canvas.getContext !== "function" || typeof canvas.toDataURL !== "function") {
    fail("لوحة Canvas غير متاحة لدليل الرسم التشريحي.");
  }
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 256 || height < 256 ||
      width > 2048 || height > 2048) fail("أبعاد دليل الرسم غير مدعومة.");
  const construction = buildAnimeAnatomyConstruction(plan, frameIndex);
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) fail("تعذر تهيئة سطح الرسم.");
  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  for (const part of construction.segments) {
    ctx.strokeStyle = "#8B9BAD";
    ctx.lineWidth = Math.max(2, part.width * width * 0.3);
    ctx.beginPath(); ctx.moveTo(part.from.x * width, part.from.y * height);
    ctx.lineTo(part.to.x * width, part.to.y * height); ctx.stroke();
  }
  for (const [name, point] of Object.entries(construction.joints)) {
    ctx.beginPath(); ctx.arc(point.x * width, point.y * height, name === "root" ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = name === "root" || name === "pelvis" ? "#D18A42" : "#F8FAFC";
    ctx.fill(); ctx.strokeStyle = "#263648"; ctx.lineWidth = 1.5; ctx.stroke();
  }
  const dataUrl = canvas.toDataURL("image/png");
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/png;base64,")) fail("تعذر تصدير دليل الرسم.");
  return { dataUrl, width, height, mimeType: "image/png", frameIndex, guideOnly: true,
    warning: "مرجع تشريحي فقط؛ يجب رسم الشخصية كاملة من جديد." };
}
