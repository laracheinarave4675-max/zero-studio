const fail = message => { throw new Error(message); };

const CORRECTIONS = Object.freeze({
  "zero-length-stroke": {
    severity: "high", skillId: "anime-inking", title: "ضربة بلا مسار مرئي",
    diagnosis: "الضربة لا تتحرك فعلياً؛ غالباً سُجلت كنقرة أو فقدت نقاطها.",
    action: "أعد رسم هذا الجزء بضربة تبدأ قبل الشكل بقليل وتنتهي بعده، مع نقطتين أو أكثر متباعدتين.",
    exercise: "ارسم خمس خطوط قصيرة مستقلة، وتأكد أن لكل خط بداية ونهاية واضحتين.",
    success: "طول الضربة أكبر من الصفر وتظهر في المعاينة."
  },
  "duplicate-consecutive-points": {
    severity: "medium", skillId: "anime-inking", title: "نقاط مكررة في الضربة",
    diagnosis: "توجد عينات متتالية في الموضع نفسه، وقد تسبب تباطؤاً أو نتوءاً عند إعادة الرسم.",
    action: "احذف العينات المتطابقة المتجاورة مع الإبقاء على نقاط الانعطاف الحقيقية.",
    exercise: "أعد رسم المنحنى بعينات أقل ومتباعدة بانتظام، دون تسطيح الانحناء.",
    success: "لا تبقى نقاط متطابقة متجاورة."
  },
  "over-sampled-micro-segments": {
    severity: "medium", skillId: "anime-inking", title: "تجزئة مفرطة للخط",
    diagnosis: "الضربة تحتوي على مقاطع صغيرة كثيرة مقارنة بطولها.",
    action: "بسّط المسار واحتفظ بالنقاط التي تغيّر اتجاه المنحنى فقط.",
    exercise: "ارسم قوساً واحداً بسلاسة، ثم قارنه بنسخة كثيرة النقاط.",
    success: "تنخفض المقاطع الدقيقة دون فقدان شكل القوس."
  },
  "excessive-direction-changes": {
    severity: "high", skillId: "anime-inking", title: "تعرّج حاد في اتجاه الخط",
    diagnosis: "تتغير زاوية الضربة بصورة حادة ومتكررة؛ قد ينتج عن رسم متردد أو مسار غير مستقر.",
    action: "أعد رسم المحيط بحركة واحدة مقصودة، وقسّم المسار فقط عند الزوايا التشريحية المقصودة.",
    exercise: "تدرّب على ثلاثة أقواس طويلة للوجنة والفك وخصل الشعر.",
    success: "تقل الانعطافات الحادة غير المقصودة مع بقاء الزوايا التصميمية."
  },
  "unstable-pressure": {
    severity: "medium", skillId: "anime-inking", title: "ضغط فرشاة غير مستقر",
    diagnosis: "يتبدل الضغط بقفزات كبيرة بين عينات متجاورة.",
    action: "أعد الضربة بضغط تدريجي: أثقل قليلاً عند مركز الخط وأخف عند طرفيه.",
    exercise: "ارسم ستة خطوط تنتهي بتدرج رفيع واضح.",
    success: "يتدرج الضغط بسلاسة بدلاً من القفزات المفاجئة."
  }
});

function safeId(value) {
  return String(value ?? "").trim().slice(0, 160);
}

/**
 * Turn measured inspection failures into bounded, actionable practice advice.
 * This is a deterministic teaching rule-set, not autonomous model learning.
 * It never edits or approves drawing operations.
 */
export function buildArtistCorrectionPlan(report = {}) {
  if (!report || typeof report !== "object" || Array.isArray(report)) fail("An artist inspection report is required.");
  const suggestions = [];
  const seen = new Set();
  const add = item => {
    const key = [item.code, item.targetStrokeId, item.targetMeasurement, item.skillId].join("|");
    if (seen.has(key) || suggestions.length >= 32) return;
    seen.add(key);
    suggestions.push({ ...item, status: "suggested", requiresArtistApproval: true, autoApplied: false });
  };

  for (const warning of Array.isArray(report.strokeWarnings) ? report.strokeWarnings : []) {
    const rule = CORRECTIONS[String(warning?.code ?? "")];
    if (!rule) continue;
    const targetStrokeId = safeId(warning.id);
    add({
      code: String(warning.code), targetStrokeId: targetStrokeId || null,
      skillId: rule.skillId, severity: rule.severity, title: rule.title,
      diagnosis: rule.diagnosis, action: rule.action,
      exercise: rule.exercise, success: rule.success
    });
  }

  for (const fill of Array.isArray(report.fillEyes) ? report.fillEyes : []) {
    if (fill?.passed !== false) continue;
    add({
      code: "region-fill-failed", targetStrokeId: safeId(fill.id) || null,
      skillId: "flat-color-groups", severity: Number(fill.outsideLeakage) > 0.02 ? "high" : "medium",
      title: "تعبئة اللون تحتاج إلى تنظيف",
      diagnosis: "لم تحقق المنطقة نسبة التغطية المطلوبة أو تسرب اللون خارج حدودها.",
      action: "راجع إغلاق حدود المنطقة أولاً، ثم أعد التعبئة داخل القناع. لا توسّع الفرشاة لتعويض الفجوات.",
      exercise: "اختبر منطقة صغيرة مغلقة، ثم افحص التغطية والتسرب قبل تلوين بقية الشخصية.",
      success: "تغطية داخلية لا تقل عن 88% وتسرب خارجي لا يتجاوز 0.5%."
    });
  }

  const anatomy = report.characterIdentity?.anatomy;
  if (anatomy && anatomy.skipped !== true && anatomy.passed === false) {
    for (const measurement of Array.isArray(anatomy.measurements) ? anatomy.measurements.filter(item => item?.passed === false) : []) {
      add({
        code: "anatomy-proportion-drift", targetStrokeId: null, targetMeasurement: safeId(measurement.name),
        skillId: "body-anatomy", severity: Number(measurement.relativeDeviation) > 0.3 ? "high" : "medium",
        title: "انحراف في نسبة " + safeId(measurement.name),
        diagnosis: "طول هذا الجزء يبتعد عن قياس Character DNA المعتمد.",
        action: "راجع نقطتي المفصلين المحددتين لهذا الجزء، ثم صحح طول الجزء مع الحفاظ على وضعية الجسم.",
        exercise: "أعد بناء هذا الجزء بخطين إنشائيين واضحين وقارن طولهما بقياس المرجع.",
        success: "يعود الانحراف النسبي إلى هامش السماح المحدد في فحص التشريح."
      });
    }
  }

  return {
    version: 1,
    source: "deterministic-inspection-rules",
    suggestions,
    summary: {
      total: suggestions.length,
      high: suggestions.filter(item => item.severity === "high").length,
      medium: suggestions.filter(item => item.severity === "medium").length
    },
    learningClaim: "rule-based-feedback-only"
  };
}
