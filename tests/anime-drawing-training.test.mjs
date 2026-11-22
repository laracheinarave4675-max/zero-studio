import test from "node:test";
import assert from "node:assert/strict";
import { ANIME_ARTIST_SKILL_CATALOG } from "../app/anime-artist-curriculum.mjs";
import { createAnimeDrawingSession, getAnimeDrawingStudy, listAnimeDrawingStudies } from "../app/anime-drawing-training.mjs";

test("every anime curriculum skill has a detailed Japanese drawing study", () => {
  const studies = listAnimeDrawingStudies();
  const ids = new Set(studies.map(item => item.skillId));
  for (const skill of ANIME_ARTIST_SKILL_CATALOG) assert.ok(ids.has(skill.id), "missing study " + skill.id);
  assert.equal(studies.length, ANIME_ARTIST_SKILL_CATALOG.length);
});

test("head and anime eye sessions provide ordered, concrete drawing drills", () => {
  const head = createAnimeDrawingSession({ skillId: "head-and-face", difficulty: "foundation", characterId: "hero-01" });
  assert.match(head.principle, /ثلاثي الأبعاد/);
  assert.ok(head.sequence.length >= 4);
  assert.ok(head.rubric.some(item => item.id === "landmark-match"));
  assert.equal(head.characterId, "hero-01");
  const eyes = getAnimeDrawingStudy("anime-eyes-expressions");
  assert.ok(eyes.focus.some(item => item.includes("القزحية")));
  assert.ok(eyes.sequence.some(item => item.includes("ستة تعبيرات")));
});

test("color, hair and animation studies teach anime-specific craft and independent raster drawings", () => {
  const hair = createAnimeDrawingSession({ skillId: "hair-masses" });
  assert.ok(hair.focus.some(item => item.includes("3 إلى 7")));
  const flats = createAnimeDrawingSession({ skillId: "flat-color-groups" });
  assert.ok(flats.rubric.some(item => item.id === "leakage"));
  const animation = createAnimeDrawingSession({ skillId: "animation-drawing-continuity", difficulty: "advanced" });
  assert.equal(animation.drawingMedium, "native-canvas2d-raster-brush-strokes");
  assert.match(animation.deliverable, /مستقلة/);
  assert.equal(animation.noImageGeneration, true);
  assert.equal(animation.automaticMasteryAllowed, false);
});

test("sessions are defensive copies and invalid skills or difficulty fail closed", () => {
  const a = getAnimeDrawingStudy("anime-inking");
  a.sequence.push("tamper");
  assert.equal(getAnimeDrawingStudy("anime-inking").sequence.includes("tamper"), false);
  assert.throws(() => createAnimeDrawingSession({ skillId: "not-a-skill" }), /Unknown anime drawing skill/);
  assert.throws(() => createAnimeDrawingSession({ skillId: "head-and-face", difficulty: "expert" }), /Unsupported anime drawing difficulty/);
});
