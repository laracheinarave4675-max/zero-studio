import test from "node:test";
import assert from "node:assert/strict";
import {
  createArtistLearningRecord, recordArtistAssessment,
  evaluateArtistSkillProgress, recommendNextArtistPractice, validateArtistLearningRecord
} from "../app/digital-artist-learning.mjs";

const digest = "a".repeat(64);
const checks = (count = 10, passed = 9) => Array.from({length: count}, (_, i) => ({id:"metric-"+i, passed:i<passed}));
const add = (record, id, skillId, passed = 9) => recordArtistAssessment(record, {
  id, skillId, reportDigest:digest, checks:checks(10, passed)
});

test("learning ledger requires report-backed measured checks", () => {
  const record = createArtistLearningRecord({characterId:"hero-01", referenceDigest:digest});
  assert.throws(() => recordArtistAssessment(record, {id:"bad", skillId:"anime-eyes-expressions", checks:checks()}), /SHA-256/);
  assert.throws(() => recordArtistAssessment(record, {id:"x", skillId:"anime-eyes-expressions", reportDigest:digest, checks:[{id:"a",passed:true}]}), /3–32/);
  assert.equal(record.attempts.length, 0);
});

test("mastery needs three separate strong assessments and satisfied prerequisites", () => {
  const record = createArtistLearningRecord({characterId:"hero-01"});
  for (const id of ["gesture-1","gesture-2","gesture-3"]) add(record,id,"gesture-silhouette");
  for (const id of ["head-1","head-2","head-3"]) add(record,id,"head-and-face");
  const progress = evaluateArtistSkillProgress(record);
  assert.equal(progress.skills.find(item=>item.skillId==="gesture-silhouette").mastered,true);
  assert.equal(progress.skills.find(item=>item.skillId==="head-and-face").mastered,true);
  assert.equal(progress.summary.mastered,2);
});

test("one weak recent assessment prevents mastery and directs practice to the weak skill", () => {
  const record = createArtistLearningRecord();
  for (const id of ["g1","g2","g3"]) add(record,id,"gesture-silhouette");
  for (const id of ["h1","h2","h3"]) add(record,id,"head-and-face");
  add(record,"e1","anime-eyes-expressions",6);
  const next = recommendNextArtistPractice(record);
  assert.equal(next.skillId,"anime-eyes-expressions");
  assert.equal(next.requiresFreshInspectionReport,true);
});

test("duplicate attempts, unknown skills and invalid evidence fail closed", () => {
  const record = createArtistLearningRecord();
  add(record,"same","gesture-silhouette");
  assert.throws(() => add(record,"same","gesture-silhouette"),/Duplicate artist assessment/);
  assert.throws(() => add(record,"unknown","not-a-skill"),/Unknown anime artist skill/);
  assert.throws(() => recordArtistAssessment(record,{id:"no-digest",skillId:"gesture-silhouette",reportDigest:"no",checks:checks()}),/SHA-256/);
});

test("a skill cannot be mastered before its prerequisite skill is mastered", () => {
  const record = createArtistLearningRecord();
  for (const id of ["h1","h2","h3"]) add(record,id,"head-and-face");
  const progress = evaluateArtistSkillProgress(record);
  const head = progress.skills.find(item=>item.skillId==="head-and-face");
  assert.equal(head.prerequisitesMet,false);
  assert.equal(head.mastered,false);
  assert.equal(recommendNextArtistPractice(record).skillId,"gesture-silhouette");
});

test("editor connects project-persisted assessments to measured inspection reports", async () => {
  const { readFile } = await import("node:fs/promises");
  const app = await readFile(new URL("../app/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../app/index.html", import.meta.url), "utf8");
  assert.match(app, /recordLatestDigitalArtistAssessment/);
  assert.match(app, /project\.artistLearning/);
  assert.match(app, /latestDigitalArtistInspection/);
  assert.match(app, /لم نربط هذه المهارة بعد بمقاييس عين موثوقة/);
  assert.match(app, /mountDigitalArtistLearning\(\)/);
  assert.match(html, /recordDigitalArtistAssessmentBtn/);
  assert.match(html, /digitalArtistLearningSummary/);
  assert.match(html, /digitalArtistLearningHistory/);
});

test("persisted evidence cannot claim a score that disagrees with its checks", () => {
  const record = createArtistLearningRecord();
  add(record,"tamper-check","gesture-silhouette",6);
  const tampered = structuredClone(record);
  tampered.attempts[0].score = 1;
  tampered.attempts[0].passed = true;
  assert.throws(() => validateArtistLearningRecord(tampered), /does not match/);
  assert.equal(validateArtistLearningRecord(record).attempts.length,1);
});
