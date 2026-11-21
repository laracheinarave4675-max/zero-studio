import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [app, html] = await Promise.all([
  readFile(new URL("../app/app.js", import.meta.url), "utf8"),
  readFile(new URL("../app/index.html", import.meta.url), "utf8")
]);

test("anime training panel exposes all session controls in the Arabic workspace", () => {
  for (const id of ["animeArtistSkillSelect", "animeArtistSkillDetails", "animeArtistDifficulty", "startAnimeArtistPracticeBtn", "animeArtistPracticeSession"]) {
    assert.ok(html.includes('id="' + id + '"'), "missing training control " + id);
  }
});

test("anime training UI builds sessions from the selected skill and difficulty", () => {
  assert.ok(app.includes('import{createAnimeDrawingSession,getAnimeDrawingStudy}from"./anime-drawing-training.mjs"'));
  assert.ok(app.includes('createAnimeDrawingSession({skillId:select.value,difficulty:difficulty?.value||"foundation"'));
  assert.ok(app.includes('startAnimeArtistPracticeBtn'));
  assert.ok(app.includes('animeArtistPracticeSession'));
});

test("practice session keeps raster authoring and honest review boundaries visible", () => {
  assert.ok(app.includes("طبقات الرسم: "+'"+session.drawingLayers.join(" → ")'));
  assert.ok(app.includes("لا توجد صورة مولدة ولا درجة إتقان تلقائية."));
});
