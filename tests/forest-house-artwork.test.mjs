import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("forest-house study is a self-contained layered editable SVG", async () => {
  const svg = await readFile(new URL("../samples/forest-house-canopy-study.svg", import.meta.url), "utf8");
  assert.match(svg, /<svg[^>]+width="1920"[^>]+height="1080"[^>]+viewBox="0 0 1920 1080"/);
  assert.match(svg, /<title>ZERO STUDIO — The old house beneath the cedar canopy<\/title>/);
  for (const layer of [
    "01-atmosphere", "02-forest-trunks", "03-distant-canopy", "04-ground-and-stone-wall",
    "05-house-structure", "06-upper-story", "07-ground-floor", "08-curved-roof",
    "09-eaves-and-timber", "10-garden", "11-foreground-canopy", "12-light-and-brush-accents"
  ]) assert.match(svg, new RegExp('id="' + layer + '"'));
  for (const feature of ["roofTiles", "woodgrain", "stonegrain", "glass", "leafCluster"]) {
    assert.match(svg, new RegExp('id="' + feature + '"'));
  }
  assert.ok((svg.match(/<path\b/g) || []).length >= 65, "scene should contain substantial authored path detail");
  assert.doesNotMatch(svg, /(?:href|xlink:href|src)\s*=\s*["']https?:\/\//i, "artwork must not depend on remote images or assets");
  assert.match(svg, /Q\d+[^<]*Z|Q[^<]*Z/, "organic curved forms should be present");
});
