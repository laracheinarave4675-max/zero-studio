import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../app/character-decomposition-lab.html", import.meta.url), "utf8");
const script = readFileSync(new URL("../app/character-decomposition-lab.js", import.meta.url), "utf8");

test("every DOM id referenced by the decomposition lab exists exactly once", () => {
  const used = new Set([...script.matchAll(/\$\("([^"]+)"\)/g)].map(match => match[1]));
  const declaredList = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  const declared = new Set(declaredList);
  const missing = [...used].filter(id => !declared.has(id));
  const duplicates = declaredList.filter((id, index) => declaredList.indexOf(id) !== index);
  assert.deepEqual(missing, []);
  assert.deepEqual(duplicates, []);
});

test("the mobile lab exposes the three-view extractor and clone-source repair controls", () => {
  assert.match(html, /id="splitViewsBtn"/);
  assert.match(html, /id="viewChoices"/);
  assert.match(html, /id="repairMethod"/);
  assert.match(html, /id="pickCloneSourceBtn"/);
  assert.match(script, /extractCharacterViews/);
  assert.match(script, /clone-source/);
});

test("the front-view anatomy layer preset is available and wired to the front-view guard", () => {
  assert.match(html, /id="frontPartsPresetBtn"/);
  assert.match(script, /activeViewId!=="front"/);
  assert.match(script, /hair-front-left/);
  assert.match(script, /sleeve-right/);
  assert.match(script, /kimono-skirt/);
});

test("the lab exposes a connected-color smart selection mode", () => {
  assert.match(html, /id="selectModeBtn"/);
  assert.match(html, /id="selectTolerance"/);
  assert.match(script, /applySmartSelection/);
  assert.match(script, /floodSelectConnectedRegion/);
});

test("the mask editor exposes pixel-level undo and redo history", () => {
  assert.match(html, /id="undoMaskBtn"/);
  assert.match(html, /id="redoMaskBtn"/);
  assert.match(script, /beginMaskEdit/);
  assert.match(script, /finishMaskEdit/);
  assert.match(script, /applyHistoryEdit/);
  assert.match(script, /undoStack\.push/);
});

test("the lab exports per-part PNG files and a ZIP manifest", () => {
  assert.match(script, /canvasPngBytes/);
  assert.match(script, /createStoredZip/);
  assert.match(script, /manifest\.json/);
  assert.match(script, /character-decomposition\.json/);
  assert.match(script, /application\/zip/);
});
