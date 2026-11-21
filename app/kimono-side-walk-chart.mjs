// ZERO STUDIO — approved kimono side-walk drawing brief.
// This is choreography metadata only. Joint positions must be measured from
// the artist's actual key drawings; the chart never fabricates anatomy or art.
export const KIMONO_WALK_REFERENCE = Object.freeze({
  galleryAssetId: "be172712-e073-4d06-9587-eec7e6c62a84",
  galleryUrl: "https://zero-studio-flux2-preview.9test4675a26.workers.dev/gallery/be172712-e073-4d06-9587-eec7e6c62a84",
  fps: 24,
  durationSeconds: 1,
  view: "side",
  keyDrawingFrames: Object.freeze([0, 6, 12, 18, 23]),
  identityChecklist: Object.freeze([
    "Keep the same face, eye shape, long black hair and hairline.",
    "Preserve the ivory kimono, rose-pink sleeves and hem, obi, floral pattern and sandals.",
    "Keep head size, torso proportions and costume palette consistent."
  ]),
  costumeNotes: Object.freeze([
    "The broad skirt conceals the knees; keep a readable lower-leg and sandal silhouette beneath the hem.",
    "Redraw sleeve volume, skirt folds and hair swing for the actual pose; do not slide or warp the reference image.",
    "The sandal that is planted must stay fixed until the foot's toe-off."
  ])
});

const KEY_POSE_NOTES = Object.freeze({
  0: { phase: "contact", title: "بداية الارتكاز", description: "وضعية بداية واضحة ومتوازنة؛ قدم الارتكاز تلامس الأرض والجسم يستعد لنقل الوزن." },
  6: { phase: "passing", title: "مرور الجسم", description: "يمر الحوض فوق قدم الارتكاز؛ الساق الأخرى تعبر للأمام، والذراعان تتوازنان بهدوء." },
  12: { phase: "contact", title: "ملامسة الخطوة", description: "تلامس القدم المتقدمة الأرض أولاً؛ أظهر انتقال الوزن واتزان الجذع." },
  18: { phase: "recovery", title: "استعادة التوازن", description: "يتجاوز الجسم القدم المتقدمة؛ القدم الخلفية تبدأ الانفصال عن الأرض." },
  23: { phase: "settle", title: "إغلاق الدورة", description: "اختم الدورة بوضعية كاملة قابلة للوصل ببداية المشهد، مع ثبات الهوية والملابس." }
});

export function getKimonoSideWalkFrameBrief(frameIndex) {
  if (!Number.isInteger(frameIndex) || frameIndex < 0 || frameIndex >= 24) {
    throw new Error("رقم إطار مشي الكيمونو يجب أن يكون بين 0 و23.");
  }
  const exact = KEY_POSE_NOTES[frameIndex];
  const priorKey = [...KIMONO_WALK_REFERENCE.keyDrawingFrames].reverse().find(index => index < frameIndex);
  const nextKey = KIMONO_WALK_REFERENCE.keyDrawingFrames.find(index => index > frameIndex);
  const from = KEY_POSE_NOTES[priorKey];
  const to = KEY_POSE_NOTES[nextKey];
  const phase = exact?.phase || (frameIndex < 6 ? "action" : frameIndex < 12 ? "passing" : frameIndex < 18 ? "recovery" : "action");
  const title = exact?.title || (phase === "passing" ? "إطار مرور وسيط" : phase === "recovery" ? "إطار استعادة وسيط" : "إطار انتقال وسيط");
  const description = exact?.description || "ارسم وضعية جديدة كاملة بين الوضعيتين المفتاحيتين: " + from.title + " و" + to.title + ". حافظ على قوس الحركة ومركز الثقل، ولا تنسخ أي إطار سابق.";
  return {
    frameIndex,
    frameNumber: frameIndex + 1,
    timeSeconds: Number((frameIndex / 24).toFixed(5)),
    kind: exact ? "key-drawing" : "inbetween-drawing",
    phase,
    title,
    description,
    fromKeyFrame: priorKey ?? 0,
    toKeyFrame: nextKey ?? 23,
    drawingRequirement: "complete-independent-character-redraw",
    exposureFrames: 1,
    finalArtwork: null
  };
}

/** Returns 24 artist tasks; no joint interpolation or final artwork is invented here. */
export function createKimonoSideWalkChart() {
  return {
    format: "zero-studio-kimono-side-walk-chart",
    version: 2,
    reference: KIMONO_WALK_REFERENCE,
    fps: 24,
    totalFrames: 24,
    uniqueFinalDrawings: 0,
    artistRedrawsRequired: 24,
    keyPoseNotes: KEY_POSE_NOTES,
    frames: Array.from({ length: 24 }, (_, frameIndex) => getKimonoSideWalkFrameBrief(frameIndex))
  };
}
