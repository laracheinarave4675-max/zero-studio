import test from "node:test";
import assert from "node:assert/strict";
import {buildAnimeConstructionModel} from "../app/anime-construction-artist.mjs";
import {buildAnimeConstructionBrushPlan,compileAnimeConstructionBrushPlan} from "../app/anime-construction-brush-plan.mjs";

const views=[{yaw:-.42,center:1/6},{yaw:0,center:.5},{yaw:.42,center:5/6}];
const build=view=>buildAnimeConstructionModel({headBounds:{x:view.center-.08,y:.06,width:.16,height:.32},viewYaw:view.yaw});

test("three-view model sheet keeps one style identity across mirrored three-quarter and front views",()=>{
 const models=views.map(build);
 assert.deepEqual(models.map(model=>model.profileId),["tv-anime-balanced","tv-anime-balanced","tv-anime-balanced"]);
 const ids=models.map(model=>model.hair.map(clump=>clump.id));
 assert.deepEqual(ids[0],ids[1]);assert.deepEqual(ids[1],ids[2]);
 assert.ok(models.every(model=>model.hair.length===7&&model.eyes.length===2));
 assert.notEqual(models[0].head.axes.centerline.from.x,models[1].head.axes.centerline.from.x);
 assert.notEqual(models[2].head.axes.centerline.from.x,models[1].head.axes.centerline.from.x);
 assert.notEqual(models[0].hair[5].root.x,models[1].hair[5].root.x);
 assert.notEqual(models[2].hair[5].root.x,models[1].hair[5].root.x);
});

test("three-quarter views correctly distinguish near and far eye scale",()=>{
 for(const view of [views[0],views[2]]){
  const model=build(view);
  const near=model.eyes.find(eye=>!eye.farSide);
  const far=model.eyes.find(eye=>eye.farSide);
  assert.ok(near.bounds.width>far.bounds.width);
 }
});

test("all three view brush plans remain valid native raster plans inside the canvas",()=>{
 for(const view of views){
  const model=build(view);
  const plan=buildAnimeConstructionBrushPlan(model);
  const compiled=compileAnimeConstructionBrushPlan(model);
  assert.equal(plan.layers.length,5);
  assert.ok(compiled.commands.length>0);
  assert.ok(compiled.commands.every(command=>command.points.every(point=>point.x>=0&&point.x<=1920&&point.y>=0&&point.y<=1080)));
 }
});
