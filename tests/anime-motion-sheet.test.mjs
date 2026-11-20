import test from"node:test";
import assert from"node:assert/strict";
import{createAnimeMotionSheet,validateAnimeMotionSheet,getMotionSegment}from"../app/anime-motion-sheet.mjs";
test("first anime walk proof defines four complete raster key poses and 24 distinct frame slots",()=>{
 const sheet=createAnimeMotionSheet();assert.equal(validateAnimeMotionSheet(sheet),true);assert.equal(sheet.totalFrames,24);assert.equal(sheet.distinctDrawingTarget,24);assert.deepEqual(sheet.keyframes.map(k=>k.frame),[0,6,12,18]);assert.ok(sheet.keyframes.every(k=>k.source==="full-raster-key-drawing"));assert.equal(new Set(sheet.frames.map(f=>f.index)).size,24);
});
test("walk motion sheet preserves contact, compression, passing and recovery beats",()=>{
 const sheet=createAnimeMotionSheet();assert.deepEqual(sheet.keyframes.map(k=>k.beat),["left-foot-contact","down-compression","passing-position","up-recovery"]);assert.equal(getMotionSegment(sheet,9).leftKeyframe,"down-left");assert.equal(getMotionSegment(sheet,9).rightKeyframe,"passing");assert.equal(getMotionSegment(sheet,9).progress,.5);
});
test("first proof rejects changes to duration, fps, or rig/SVG keyframe sources",()=>{
 assert.throws(()=>createAnimeMotionSheet({durationSeconds:2}),/exactly one second/);assert.throws(()=>createAnimeMotionSheet({fps:12}),/24 FPS/);const sheet=createAnimeMotionSheet();sheet.keyframes[0].source="svg-rig";assert.throws(()=>validateAnimeMotionSheet(sheet),/complete raster drawing/);
});
