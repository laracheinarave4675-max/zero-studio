import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../app/app.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../app/index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/styles.css", import.meta.url), "utf8");

test("kimono walk preset is wired to the live 24-frame timeline", () => {
  assert.match(app, /import\{createKimonoSideWalkChart,getKimonoSideWalkFrameBrief,KIMONO_WALK_REFERENCE\}from"\.\/kimono-side-walk-chart\.mjs"/);
  assert.match(app, /\$\("applyKimonoWalkPresetBtn"\)\.onclick=applyKimonoWalkPreset/);
  assert.match(app, /function applyKimonoWalkPreset\(\)/);
  assert.match(app, /prepareAnime24FrameShot\(\)/);
  assert.match(app, /function selectKimonoWalkFrame\(frameIndex\)/);
  assert.match(app, /\$\("animeWalkFramePrevBtn"\)\.onclick/);
  assert.match(app, /\$\("animeWalkFrameNextBtn"\)\.onclick/);
});

test("each frame task reports artist instructions and live drawing/review state", () => {
  assert.match(app, /function renderKimonoWalkTaskNavigator\(\)/);
  assert.match(app, /getKimonoSideWalkFrameBrief\(Math\.max\(0,Math\.min\(23,current\)\)\)/);
  assert.match(app, /complete-independent-character-redraw/);
  assert.match(app, /PNG مستقل محفوظ ومعتمد لهذا الإطار/);
  assert.match(app, /animeWalkTaskList/);
  assert.match(app, /renderKimonoWalkTaskNavigator\(\);renderFrames\(\)/);
});

test("the five key poses are mandatory before the walk plan can be built", () => {
  assert.match(app, /KIMONO_WALK_REFERENCE\.keyDrawingFrames\.filter/);
  assert.match(app, /قالب مشي الكيمونو يحتاج اعتماد خمس وضعيات مفتاحية كاملة/);
  assert.match(app, /dna\.lastMotionPreset=activeKimonoWalkChart\?"kimono-side-walk-v2":null/);
  assert.match(app, /dna\.lastMotionPreset===\"kimono-side-walk-v2\"\?createKimonoSideWalkChart\(\):null/);
});

test("the actual gallery model sheet is displayed as a reference, not imported as finished animation art", () => {
  const url = "https://zero-studio-flux2-preview.9test4675a26.workers.dev/gallery/be172712-e073-4d06-9587-eec7e6c62a84";
  assert.ok(html.includes('id="kimonoWalkReferenceImage"'));
  assert.ok(html.includes('src="' + url + '"'));
  assert.ok(html.includes('href="' + url + '"'));
  assert.match(html, /هذه صورة مرجعية فقط وليست إطاراً متحركاً/);
  assert.match(html, /لا تُستخدم صورة المرجع أو أدلة المفاصل كرسومات نهائية/);
});

test("the mobile frame-task navigator has visible responsive state classes", () => {
  for (const id of ["animeWalkTaskPanel","animeWalkTaskHeading","animeWalkTaskDescription","animeWalkTaskState","animeWalkProgress","animeWalkTaskList"]) {
    assert.ok(html.includes('id="' + id + '"'), "missing task UI: " + id);
  }
  assert.match(css, /\.anime-walk-task-grid\{display:grid/);
  assert.match(css, /\.anime-walk-task\.active/);
  assert.match(css, /\.anime-walk-task\.approved/);
});
