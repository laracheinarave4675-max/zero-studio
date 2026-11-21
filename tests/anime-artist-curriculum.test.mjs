import test from "node:test";
import assert from "node:assert/strict";
import {
  ANIME_ARTIST_SKILL_CATALOG, createAnimePracticeTask,
  getAnimeArtistCurriculum, validateAnimeReferenceCard
} from "../app/anime-artist-curriculum.mjs";

const ownReference = (overrides = {}) => ({
  id: "my-character-sheet",
  title: "Approved ZERO STUDIO character model sheet",
  creator: "ZERO STUDIO project owner",
  source: "project-library:character-model-sheet-01",
  license: "User-owned original artwork",
  rightsBasis: "user-owned",
  trainingAllowed: true,
  commercialUseAllowed: true,
  redistributionAllowed: false,
  tags: ["anime", "character-sheet", "identity"],
  ...overrides
});

test("anime curriculum spans character design, construction, line, color and animation", () => {
  const curriculum = getAnimeArtistCurriculum();
  const ids = new Set(curriculum.map(skill => skill.id));
  for (const id of [
    "gesture-silhouette", "anime-eyes-expressions", "hair-masses",
    "body-anatomy", "hands-and-feet", "costume-and-folds",
    "anime-inking", "flat-color-groups", "cel-shadows-and-light",
    "model-sheet-identity", "animation-drawing-continuity"
  ]) assert.ok(ids.has(id), "missing skill " + id);
  assert.ok(curriculum.length >= 12);
  curriculum[0].lessons.push("tampered");
  assert.equal(getAnimeArtistCurriculum()[0].lessons.includes("tampered"), false);
});

test("practice task requires an approved reference and exposes measurable drawing exercises", () => {
  const task = createAnimePracticeTask({
    skillId: "flat-color-groups",
    reference: ownReference(),
    purpose: "training",
    focus: "Keep the face, hair and clothing colors inside their intended regions."
  });
  assert.equal(task.skillId, "flat-color-groups");
  assert.equal(task.purpose, "training");
  assert.ok(task.evaluationMetrics.includes("outside-leakage"));
  assert.equal(task.finalImageGenerationAllowed, false);
  assert.equal(task.outputRule, "native-raster-brush-operations-only");
});

test("reference cards cannot enter training without explicit training permission", () => {
  assert.throws(() => validateAnimeReferenceCard(ownReference({ trainingAllowed: false }), "training"), /not cleared for model\/tool training/);
  assert.doesNotThrow(() => validateAnimeReferenceCard(ownReference({ trainingAllowed: false }), "study"));
});

test("external user-authorized and open-license references require explicit provenance checks", () => {
  assert.throws(() => validateAnimeReferenceCard(ownReference({
    rightsBasis: "user-authorized", authorizationConfirmed: false
  }), "study"), /authorization must be explicitly confirmed/);
  assert.throws(() => validateAnimeReferenceCard(ownReference({
    rightsBasis: "open-license", licenseTermsReviewed: false
  }), "training"), /license terms must be reviewed/);
  assert.doesNotThrow(() => validateAnimeReferenceCard(ownReference({
    rightsBasis: "open-license", licenseTermsReviewed: true
  }), "training"));
});

test("commercial production use is independently checked from study and training rights", () => {
  assert.throws(() => validateAnimeReferenceCard(ownReference({ commercialUseAllowed: false }), "commercial-production"), /not cleared for commercial production/);
  const card = validateAnimeReferenceCard(ownReference(), "commercial-production");
  assert.equal(card.commercialUseAllowed, true);
  assert.equal(card.redistributionAllowed, false);
});

test("unknown curriculum skills, rights bases and purposes fail closed", () => {
  assert.throws(() => createAnimePracticeTask({ skillId: "anime-magic", reference: ownReference() }), /Unknown anime drawing skill/);
  assert.throws(() => validateAnimeReferenceCard(ownReference({ rightsBasis: "unknown" }), "study"), /rights basis/);
  assert.throws(() => validateAnimeReferenceCard(ownReference(), "unlimited"), /purpose/);
});

test("the skill catalog is stable and exposes prerequisites for staged learning", () => {
  const hair = ANIME_ARTIST_SKILL_CATALOG.find(skill => skill.id === "hair-masses");
  const face = ANIME_ARTIST_SKILL_CATALOG.find(skill => skill.id === "head-and-face");
  assert.ok(hair.prerequisites.includes("head-and-face"));
  assert.ok(face.prerequisites.includes("gesture-silhouette"));
  assert.ok(hair.metrics.includes("fill-leakage"));
});
