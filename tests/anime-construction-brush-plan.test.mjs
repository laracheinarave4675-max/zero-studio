import test from "node:test";
import assert from "node:assert/strict";
import {buildAnimeConstructionModel} from "../app/anime-construction-artist.mjs";
import {buildAnimeConstructionBrushPlan,compileAnimeConstructionBrushPlan} from "../app/anime-construction-brush-plan.mjs";

test("construction geometry compiles into editable native raster brush layers",()=>{
 const model=buildAnimeConstructionModel({viewYaw:.35});
 const plan=buildAnimeConstructionBrushPlan(model);
 const stream=compileAnimeConstructionBrushPlan(model);
 assert.equal(plan.format,"zero-studio-digital-artist-brush-plan");
 assert.deepEqual(plan.layers.map(layer=>layer.role),["construction","flat-color","clean-line","shadow"]);
 assert.ok(plan.layers.some(layer=>layer.strokes.some(stroke=>stroke.id==="face-base")));
 assert.ok(plan.layers.some(layer=>layer.strokes.some(stroke=>stroke.id==="hair-flow-fringe-center")));
 assert.ok(plan.layers.some(layer=>layer.strokes.some(stroke=>stroke.id==="eye-left-upper-lid")));
 assert.ok(stream.audit.nativeRasterBrushes);
 assert.equal(stream.audit.imageGenerationUsed,false);
 assert.ok(stream.commands.every(command=>command.points.every(point=>point.x>=0&&point.x<=1920&&point.y>=0&&point.y<=1080)));
});

test("construction brush plan retains clipped iris and pupil operations",()=>{
 const plan=buildAnimeConstructionBrushPlan();
 const strokes=plan.layers.flatMap(layer=>layer.strokes);
 for(const id of ["eye-left-iris","eye-left-pupil","eye-right-iris","eye-right-pupil"]){
  const item=strokes.find(stroke=>stroke.id===id);
  assert.ok(item?.clipPolygon?.length>=3);
 }
});

test("construction plan rejects an unrecognized model rather than silently using fixed coordinates",()=>{
 assert.throws(()=>buildAnimeConstructionBrushPlan({format:"wrong"}),/construction model/);
});

test("expressive eye construction includes catchlights and outer lash strokes",()=>{
 const model=buildAnimeConstructionModel();
 assert.ok(model.eyes.every(eye=>eye.bounds.height/eye.bounds.width>=.8));
 const plan=buildAnimeConstructionBrushPlan(model);
 const strokes=plan.layers.flatMap(layer=>layer.strokes);
 for(const id of ["eye-left-catchlight","eye-right-catchlight","eye-left-outer-lashes","eye-right-outer-lashes","ear-left","ear-right","cloth-fold-left-shoulder-tension"]){
  assert.ok(strokes.some(stroke=>stroke.id===id),id+" should be present in the artist plan");
 }
});

test("face shadow remains a narrow cheek-side region",()=>{
 const plan=buildAnimeConstructionBrushPlan();
 const shadow=plan.layers.find(layer=>layer.role==="shadow").strokes.find(stroke=>stroke.id==="face-cast-shadow");
 const xs=shadow.points.map(point=>point.x);
 assert.ok(Math.max(...xs)-Math.min(...xs)<1920*.12);
});
