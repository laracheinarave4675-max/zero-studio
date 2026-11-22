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
