import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Digital Artist exposes individual operation preview and review controls", async () => {
  const [html, app] = await Promise.all([
    readFile(new URL("../app/index.html", import.meta.url), "utf8"),
    readFile(new URL("../app/app.js", import.meta.url), "utf8")
  ]);
  for (const id of [
    "digitalArtistStrokeSelect", "digitalArtistStrokePreview", "digitalArtistStrokeDetails",
    "digitalArtistStrokePrevBtn", "digitalArtistStrokeNextBtn",
    "digitalArtistStrokeApproveBtn", "digitalArtistStrokeRejectBtn", "digitalArtistStrokeResetBtn",
    "digitalArtistStrokeEditInput", "digitalArtistStrokeApplyEditBtn"
  ]) assert.match(html, new RegExp('id="' + id + '"'));
  assert.match(app, /function collectDigitalArtistStrokeRecords\(/);
  assert.match(app, /function renderDigitalArtistStrokePreview\(/);
  assert.match(app, /fillRasterRegion\(ctx,mapped,record\.stroke\.options/);
  assert.match(app, /setDigitalArtistStrokeReview\("approved"\)/);
  assert.match(app, /setDigitalArtistStrokeReview\("rejected"\)/);
  assert.match(app, /validateDigitalArtistStrokeEdit\(record\.stroke,edit\)/);
  assert.match(app, /rebuildDigitalArtistRasterLayerDataUrl\(record\.layer,nextStrokes\)/);
  assert.match(app, /applyDigitalArtistStrokeCorrection\(\)/);
  assert.match(app, /renderDigitalArtistStrokeReview\(\)/);
});
