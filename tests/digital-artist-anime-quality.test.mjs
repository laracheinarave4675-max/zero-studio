import test from "node:test";
import assert from "node:assert/strict";
import { createDigitalArtistAnimeQualityPlan } from "../app/digital-artist-anime-quality-plan.mjs";
import { compileDigitalArtistBrushPlan } from "../app/digital-artist-brush-engine.mjs";

test("general anime quality benchmark covers the core drawing craft",()=>{
 const plan=createDigitalArtistAnimeQualityPlan();
 const stream=compileDigitalArtistBrushPlan(plan);
 const layers=plan.layers;
 const strokes=layers.flatMap(layer=>layer.strokes);
 const ids=strokes.map(stroke=>stroke.id);
 assert.equal(plan.identity.characterAssetId,"general-anime-quality-benchmark");
 assert.ok(layers.length>=8,"benchmark needs a complete layered workflow");
 assert.ok(strokes.length>=55,"benchmark must exercise enough independent drawing operations");
 assert.equal(new Set(ids).size,ids.length,"all benchmark stroke IDs must be unique");
 for(const role of ["construction","rough-sketch","flat-color","clean-line","shadow","highlight","detail"])
  assert.ok(layers.some(layer=>layer.role===role),"missing craft layer: "+role);
 for(const feature of ["face-base","hair-back-mass","eye-left-white","eye-right-white","collar-inner","garment-shadow","hair-ribbon-left","fold-left-1"])
  assert.ok(strokes.some(stroke=>stroke.id===feature),"missing craft feature: "+feature);
 assert.ok(strokes.filter(stroke=>stroke.kind==="region-fill").length>=20,"benchmark needs bounded color regions");
 assert.ok(strokes.filter(stroke=>stroke.brush==="ink").length>=12,"benchmark needs deliberate anime inking");
 assert.ok(stream.audit.strokeCount>=55);
});

test("general benchmark uses organic multi-sample contours and real editable brush operations",()=>{
 const plan=createDigitalArtistAnimeQualityPlan();
 const strokes=plan.layers.flatMap(layer=>layer.strokes);
 const organic=strokes.filter(stroke=>stroke.points.length>=12);
 assert.ok(organic.length>=20,"organic curves must be represented by sampled geometry");
 assert.ok(strokes.every(stroke=>Array.isArray(stroke.points)&&stroke.points.length>=2));
 assert.ok(strokes.every(stroke=>stroke.points.every(point=>Number.isFinite(point.x)&&Number.isFinite(point.y))));
 assert.ok(!JSON.stringify(plan).includes("data:image/"));
});


test("anime benchmark clips hair highlights and skin shadows to semantic masks",()=>{
 const plan=createDigitalArtistAnimeQualityPlan();
 const strokes=plan.layers.flatMap(layer=>layer.strokes);
 for(const id of ["hair-ribbon-left","hair-ribbon-right","hair-strands-left","hair-strands-right","face-shadow"]){
  const stroke=strokes.find(item=>item.id===id);
  assert.ok(stroke?.clipPolygon?.length>=3,"missing semantic clip mask for "+id);
 }
 const stream=compileDigitalArtistBrushPlan(plan);
 for(const id of ["hair-ribbon-left","hair-ribbon-right","hair-strands-left","hair-strands-right","face-shadow"]){
  const command=stream.commands.find(item=>item.strokeId===id);
  assert.ok(command?.options?.clipPolygon?.length>=3,"clip mask was not preserved in compiled command "+id);
 }
});
