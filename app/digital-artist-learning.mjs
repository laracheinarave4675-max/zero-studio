import { ANIME_ARTIST_SKILL_CATALOG } from "./anime-artist-curriculum.mjs";

export const ARTIST_LEARNING_FORMAT = "zero-studio-artist-learning-record";
export const ARTIST_LEARNING_VERSION = 1;
const SKILLS = new Map(ANIME_ARTIST_SKILL_CATALOG.map(skill => [skill.id, skill]));
const fail = message => { throw new Error(message); };
const clone = value => JSON.parse(JSON.stringify(value));
const digestPattern = /^(?:sha256:)?[a-f0-9]{64}$/i;

/**
 * Create an evidence ledger for the artist. It stores measured assessment
 * outcomes; it does not train weights, modify drawings, or claim autonomous AI learning.
 */
export function createArtistLearningRecord({ characterId = "", referenceDigest = "" } = {}) {
  const safeCharacterId = String(characterId).trim().slice(0, 120);
  const safeDigest = String(referenceDigest).trim();
  if (safeDigest && !digestPattern.test(safeDigest)) fail("A reference digest must be SHA-256.");
  return {
    format: ARTIST_LEARNING_FORMAT,
    version: ARTIST_LEARNING_VERSION,
    characterId: safeCharacterId,
    referenceDigest: safeDigest,
    attempts: [],
    createdBy: "zero-studio-measured-artist-assessment",
    learningClaim: "evidence-led-progress-tracking-not-model-training"
  };
}

function validateRecord(record) {
  if (!record || record.format !== ARTIST_LEARNING_FORMAT || record.version !== ARTIST_LEARNING_VERSION ||
      typeof record.characterId !== "string" || !Array.isArray(record.attempts) || record.attempts.length > 500) {
    fail("A valid ZERO STUDIO artist learning record is required.");
  }
  if (record.referenceDigest && !digestPattern.test(record.referenceDigest)) fail("Invalid reference digest in learning record.");
  const ids = new Set();
  for (const attempt of record.attempts) {
    if (!attempt || typeof attempt !== "object" || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,119}$/.test(String(attempt.id ?? "")) ||
        ids.has(attempt.id) || !SKILLS.has(attempt.skillId) || !digestPattern.test(String(attempt.reportDigest ?? "")) ||
        !Array.isArray(attempt.checks) || attempt.checks.length < 3 || attempt.checks.length > 32) {
      fail("An artist learning attempt is malformed.");
    }
    ids.add(attempt.id);
    const checkIds = new Set();
    for (const check of attempt.checks) {
      if (!check || typeof check.id !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,79}$/.test(check.id) ||
          checkIds.has(check.id) || typeof check.passed !== "boolean") fail("A learning assessment check is malformed.");
      checkIds.add(check.id);
    }
    const score = attempt.checks.filter(check => check.passed).length / attempt.checks.length;
    if (!Number.isFinite(attempt.score) || Math.abs(attempt.score - score) > 1e-9 || attempt.passed !== (score >= 0.85)) {
      fail("A learning assessment score does not match its measured checks.");
    }
  }
  return record;
}
export function validateArtistLearningRecord(record) {
  validateRecord(record);
  return clone(record);
}

/**
 * Append one immutable, report-backed assessment. Scores are computed from
 * individual checks so a caller cannot simply declare a mastery percentage.
 */
export function recordArtistAssessment(record, assessment) {
  validateRecord(record);
  if (!assessment || typeof assessment !== "object") fail("An artist assessment is required.");
  const skillId = String(assessment.skillId ?? "");
  if (!SKILLS.has(skillId)) fail("Unknown anime artist skill: " + skillId + ".");
  const id = String(assessment.id ?? "").trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,119}$/.test(id)) fail("Assessment needs a stable unique ID.");
  if (record.attempts.some(item => item.id === id)) fail("Duplicate artist assessment ID: " + id + ".");
  if (record.attempts.length >= 500) fail("Artist learning history reached its 500-assessment safety limit.");
  const reportDigest = String(assessment.reportDigest ?? "").trim();
  if (!digestPattern.test(reportDigest)) fail("A SHA-256 inspection report digest is required.");
  if (!Array.isArray(assessment.checks) || assessment.checks.length < 3 || assessment.checks.length > 32) {
    fail("An assessment needs 3–32 measurable inspection checks.");
  }
  const checkIds = new Set();
  const checks = assessment.checks.map(check => {
    const checkId = String(check?.id ?? "").trim();
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,79}$/.test(checkId) || checkIds.has(checkId)) fail("Assessment check IDs must be unique and stable.");
    checkIds.add(checkId);
    if (typeof check.passed !== "boolean") fail("Every inspection check must have a measured pass/fail result.");
    return { id: checkId, passed: check.passed };
  });
  const score = checks.filter(check => check.passed).length / checks.length;
  const attempt = {
    id, skillId, reportDigest: reportDigest.toLowerCase(),
    observedAt: String(assessment.observedAt ?? new Date().toISOString()).slice(0, 40),
    checks, score, passed: score >= 0.85
  };
  record.attempts.push(attempt);
  return clone(attempt);
}

export function evaluateArtistSkillProgress(record) {
  validateRecord(record);
  const masteredBySkill = new Map();
  const result = ANIME_ARTIST_SKILL_CATALOG.map(skill => {
    const attempts = record.attempts.filter(item => item.skillId === skill.id).slice(-5);
    const lastThree = attempts.slice(-3);
    const average = attempts.length ? attempts.reduce((sum, item) => sum + item.score, 0) / attempts.length : 0;
    const prerequisites = skill.prerequisites.map(id => ({
      id, mastered: masteredBySkill.get(id) === true
    }));
    const prerequisitesMet = prerequisites.every(item => item.mastered);
    const mastered = prerequisitesMet && lastThree.length === 3 && lastThree.every(item => item.score >= 0.85);
    masteredBySkill.set(skill.id, mastered);
    return {
      skillId: skill.id, domain: skill.domain, level: skill.level,
      attempts: attempts.length, averageScore: Number(average.toFixed(3)),
      recentScores: lastThree.map(item => Number(item.score.toFixed(3))),
      prerequisites, prerequisitesMet, mastered,
      status: mastered ? "mastered" : attempts.length ? "practicing" : "not-started"
    };
  });
  return {
    format: ARTIST_LEARNING_FORMAT, version: ARTIST_LEARNING_VERSION,
    characterId: record.characterId, skills: result,
    summary: {
      totalSkills: result.length,
      mastered: result.filter(item => item.mastered).length,
      practicing: result.filter(item => item.status === "practicing").length,
      notStarted: result.filter(item => item.status === "not-started").length
    },
    learningClaim: "evidence-led-progress-tracking-not-model-training"
  };
}

/** Pick the earliest available skill with the weakest recent measured result. */
export function recommendNextArtistPractice(record) {
  const progress = evaluateArtistSkillProgress(record);
  const candidates = progress.skills.filter(item => !item.mastered && item.prerequisitesMet);
  candidates.sort((a, b) => a.averageScore - b.averageScore || a.level - b.level);
  const selected = candidates[0] ?? progress.skills.find(item => !item.mastered) ?? null;
  if (!selected) return null;
  const skill = SKILLS.get(selected.skillId);
  return {
    skillId: skill.id, domain: skill.domain, level: skill.level,
    status: selected.status,
    reason: selected.attempts
      ? "Practice the weakest measured skill before advancing."
      : "Begin with this skill because its prerequisites are satisfied.",
    lessons: [...skill.lessons], exercises: [...skill.exercises],
    metrics: [...skill.metrics],
    requiresFreshInspectionReport: true
  };
}
