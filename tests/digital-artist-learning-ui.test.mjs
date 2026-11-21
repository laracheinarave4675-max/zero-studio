import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("artist learning ledger is connected to the live inspection and saved project record", async () => {
  const app = await readFile(new URL("../app/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../app/index.html", import.meta.url), "utf8");
  assert.match(app, /createArtistLearningRecord,recordArtistAssessment,evaluateArtistSkillProgress,recommendNextArtistPractice/);
  assert.match(app, /project\.artistLearning=createArtistLearningRecord\(\)/);
  assert.match(app, /latestDigitalArtistInspection=report/);
  assert.match(app, /recordLatestDigitalArtistAssessment/);
  assert.match(app, /snapshot\(\);\s*recordArtistAssessment/);
  assert.match(app, /renderDigitalArtistLearning\(\)/);
  for (const id of ["digitalArtistLearningSummary","digitalArtistNextPractice","recordDigitalArtistAssessmentBtn","digitalArtistLearningHistory"]) {
    assert.ok(html.includes('id="'+id+'"'), "missing learning UI: "+id);
  }
});

test("artist learning UI never describes deterministic assessment as neural training", async () => {
  const app = await readFile(new URL("../app/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../app/index.html", import.meta.url), "utf8");
  assert.match(app, /ليست تدريباً تلقائياً لنموذج عصبي/);
  assert.match(html, /لا يدّعي تدريب نموذج عصبي/);
});

test("learning assessments are restricted to skills with direct measurable evidence", async () => {
  const app = await readFile(new URL("../app/app.js", import.meta.url), "utf8");
  assert.match(app, /skillId==="head-and-face"\|\|skillId==="body-anatomy"/);
  assert.match(app, /skillId==="anime-inking"/);
  assert.match(app, /skillId==="flat-color-groups"/);
  assert.match(app, /لم نربط هذه المهارة بعد بمقاييس عين موثوقة/);
  assert.match(app, /anatomy\.measurements\.length<3/);
});
