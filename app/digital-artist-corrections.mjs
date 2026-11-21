// Correction deduplication keys include anatomy measurement targets.
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
      success: "تغطية داخلية لا تقل عن 90% وتسرب خارجي لا يتجاوز 2%، وفق عتبات عين التعبئة."
    });
  }

  const animeEyes = report.animeEyeComparison;
  if (animeEyes && animeEyes.measurementScope === "normalized-approved-landmarks-not-pixel-inference") {
    for (const check of Array.isArray(animeEyes.checks) ? animeEyes.checks.filter(item => item?.passed === false) : []) {
      add({
        code: "anime-eye-design-drift", targetStrokeId: null, targetMeasurement: safeId(check.id),
        skillId: "anime-eyes-expressions", severity: check.id.includes("iris") ? "high" : "medium",
        title: "اختلاف في تصميم العين: " + safeId(check.id),
        diagnosis: "موضع أو نسبة أحد عناصر العين تختلف عن ورقة النموذج المعتمدة؛ هذا القياس يعتمد معالم مرجعية وليس استنتاجاً من البكسلات.",
        action: "راجع المعلم المحدد في العين، ثم صحح الجفن أو مركز القزحية مع الحفاظ على شكل العين الأصلي واتجاه النظر.",
        exercise: "ارسم العينين فوق خطوط بناء خفيفة، ثم قارن عرض كل عين وارتفاعها والمسافة بينهما ومركز القزحية بالمرجع.",
        success: "تعود القياسات إلى هامش السماح المعتمد وتبقى القزحية داخل حدود العين."
      });
    }
  }

  const animeFace = report.animeFaceComparison;
  if (animeFace && animeFace.measurementScope === "normalized-approved-face-landmarks-not-pixel-inference") {
    for (const check of Array.isArray(animeFace.checks) ? animeFace.checks.filter(item => item?.passed === false) : []) {
      add({
        code: "anime-face-proportion-drift", targetStrokeId: null, targetMeasurement: safeId(check.id),
        skillId: "head-and-face", severity: ["jawWidth","lowerFace","faceAspect"].includes(check.id) ? "high" : "medium",
        title: "اختلاف في نسبة الوجه: " + safeId(check.id),
        diagnosis: "نسبة الوجه هذه تختلف عن ورقة النموذج المعتمدة لهذه الشخصية؛ لا تُفرض نسب موحدة على جميع أساليب الأنمي.",
        action: "راجع المعالم المرتبطة بالقياس، ثم صحح حدود الخد أو الفك أو موضع الأنف والفم مع الحفاظ على تصميم الشخصية.",
        exercise: "ارسم خط بناء الوجه ثم حدّد الخدين والفك والذقن والأنف والفم والحاجبين، وقارن النسب بالمرجع.",
        success: "تعود النسبة إلى هامش السماح الخاص بورقة النموذج المعتمدة."
      });
    }
  }

  const animeHair = report.animeHairFlowComparison;
  if (animeHair && animeHair.measurementScope === "approved-root-tip-landmarks-not-automatic-strand-segmentation") {
    for (const check of Array.isArray(animeHair.checks) ? animeHair.checks.filter(item => item?.passed === false) : []) {
      add({
        code: "anime-hair-flow-drift", targetStrokeId: null, targetMeasurement: safeId(check.id),
        skillId: "hair-masses", severity: check.missing || check.unexpected ? "high" : "medium",
        title: "اختلاف في اتجاه كتلة الشعر: " + safeId(check.id),
        diagnosis: "اتجاه الجذر إلى الطرف أو طول كتلة الشعر لا يطابق ورقة النموذج المعتمدة.",
        action: "أعد رسم كتلة الشعر من الجذر إلى الطرف باتجاه واضح، مع الحفاظ على شكل الظل الخارجي وترتيب التداخل.",
        exercise: "تدرّب على ثلاث إلى سبع كتل شعر كبيرة، وارسم لكل كتلة خط جريان واحداً قبل إضافة الخصل الصغيرة.",
        success: "تطابق اتجاهات الكتل وأطوالها مع المرجع دون تحويل الشعر إلى شعيرات عشوائية."
      });
    }
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
