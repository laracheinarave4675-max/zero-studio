import test from "node:test";
import assert from "node:assert/strict";
import {RASTER_BRUSH_PRESETS,buildBrushDabs,drawRasterBrushStroke,mapPointsToRaster} from "../app/raster-brushes.mjs";

test("natural brush presets expose pencil, ink, gouache, watercolor and foliage",()=>{
 assert.deepEqual(Object.keys(RASTER_BRUSH_PRESETS),["graphite","ink","gouache","watercolor","foliage"]);
});
test("brush dab interpolation is deterministic, pressure-aware and finite",()=>{
 const points=[{x:10,y:20,pressure:.2},{x:100,y:60,pressure:1}];
 const first=buildBrushDabs(points,{brush:"graphite",size:9,seed:41});
 const second=buildBrushDabs(points,{brush:"graphite",size:9,seed:41});
 assert.deepEqual(first,second);
 assert.ok(first.length>10);
 assert.ok(first.every(d=>Number.isFinite(d.x)&&Number.isFinite(d.y)&&d.radius>0&&d.alpha>0));
 assert.ok(first.at(-1).radius>first[0].radius);
});
test("a tap creates one dab and mouse mode can use stable simulated pressure",()=>{
 const dab=buildBrushDabs([{x:25,y:30}],{brush:"ink",size:10,pressureSensitive:false,seed:2});
 assert.equal(dab.length,1);
 assert.ok(dab[0].radius>0);
});
test("brush engine rejects invalid inputs and caps pathological dab counts",()=>{
 assert.throws(()=>buildBrushDabs([],{}),/نقاط/);
 assert.throws(()=>buildBrushDabs([{x:0,y:0}],{brush:"unknown"}),/نوع الفرشاة/);
 assert.throws(()=>buildBrushDabs([{x:0,y:0}],{size:500}),/حجم الفرشاة/);
 const huge=buildBrushDabs([{x:0,y:0},{x:1000000,y:0}],{brush:"ink",size:.5,seed:1});
 assert.equal(huge.length,30000);
});
test("brush rasterizer paints through a Canvas2D-compatible context",()=>{
 const calls=[];
 const context={
  save(){calls.push("save")},restore(){calls.push("restore")},
  translate(){},rotate(){},beginPath(){},ellipse(){calls.push("dab")},
  fill(){calls.push("fill")},
  createRadialGradient(){return{addColorStop(){}}}
 };
 const result=drawRasterBrushStroke(context,[{x:0,y:0},{x:40,y:10}],{brush:"watercolor",size:8,color:"#345678",seed:7});
 assert.equal(result.brush,"watercolor");
 assert.ok(result.dabCount>1);
 assert.ok(calls.includes("dab")&&calls.includes("fill"));
});
test("painting over imported art maps stage coordinates into letterboxed source pixels",()=>{
 const mapped=mapPointsToRaster([{x:960,y:540,pressure:.8}],1920,1080,960,540,20);
 assert.equal(mapped.scale,2);
 assert.deepEqual(mapped.points,[{x:480,y:270,pressure:.8}]);
 assert.equal(mapped.size,10);
});
