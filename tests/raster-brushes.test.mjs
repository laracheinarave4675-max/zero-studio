import test from "node:test";
import assert from "node:assert/strict";
import {RASTER_BRUSH_PRESETS,RASTER_BLEND_MODES,buildBrushDabs,drawRasterBrushStroke,mapPointsToRaster} from "../app/raster-brushes.mjs";

test("natural brush presets expose pencil, ink, gouache, watercolor and foliage",()=>{
 assert.deepEqual(Object.keys(RASTER_BRUSH_PRESETS),["graphite","ink","gouache","watercolor","foliage"]);
});
test("stylus and touch pressure are preserved while mouse pressure remains speed-derived",()=>{
 assert.equal(resolveBrushPressure("pen",.18,.7),.18);
 assert.equal(resolveBrushPressure("touch",.42,.7),.42);
 assert.equal(resolveBrushPressure("touch",0,.7),.7);
 assert.equal(resolveBrushPressure("mouse",.95,.3),.3);
 assert.equal(resolveBrushPressure("pen",1.8,.4),1);
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
test("raster brush sampling keeps dense contour points for broad strokes",()=>{
 const dabs=buildBrushDabs([{x:0,y:0,pressure:.8},{x:100,y:0,pressure:.8}],{brush:"gouache",size:20,seed:9});
 assert.ok(dabs.length>50,"broad brush edges need enough samples to avoid visibly polygonal contours");
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
  translate(){},rotate(){},beginPath(){calls.push("begin")},ellipse(){calls.push("dab")},moveTo(){calls.push("move")},lineTo(){calls.push("line")},closePath(){calls.push("close")},quadraticCurveTo(){calls.push("quad")},stroke(){calls.push("stroke")},
  fill(){calls.push("fill")},set lineCap(v){},set lineJoin(v){},set strokeStyle(v){},set lineWidth(v){},
  createRadialGradient(){return{addColorStop(){}}}
 };
 const result=drawRasterBrushStroke(context,[{x:0,y:0},{x:40,y:10}],{brush:"watercolor",size:8,color:"#345678",seed:7});
 assert.equal(result.brush,"watercolor");
 assert.equal(result.renderMode,"wash");
 assert.ok(result.dabCount>1);
 assert.ok(calls.includes("dab")&&calls.includes("fill"));
});
test("painting over imported art maps stage coordinates into letterboxed source pixels",()=>{
 const mapped=mapPointsToRaster([{x:960,y:540,pressure:.8}],1920,1080,960,540,20);
 assert.equal(mapped.scale,2);
 assert.deepEqual(mapped.points,[{x:480,y:270,pressure:.8}]);
 assert.equal(mapped.size,10);
});

test("gouache and graphite use continuous pressure-shaped ribbons instead of chains of oval stamps",()=>{
 const calls=[],ctx={save(){},restore(){},beginPath(){calls.push("begin")},moveTo(){calls.push("move")},lineTo(){calls.push("line")},closePath(){calls.push("close")},fill(){calls.push("fill")},stroke(){calls.push("stroke")},ellipse(){calls.push("ellipse")},quadraticCurveTo(){},bezierCurveTo(){},translate(){},rotate(){},set fillStyle(v){},set globalAlpha(v){},set globalCompositeOperation(v){},set lineCap(v){},set lineJoin(v){},set strokeStyle(v){},set lineWidth(v){}};
 const r=drawRasterBrushStroke(ctx,[{x:0,y:0,pressure:.2},{x:35,y:8,pressure:.7},{x:80,y:24,pressure:1}],{brush:"gouache",size:18,color:"#52764b",texture:.8,seed:13});
 assert.equal(r.renderMode,"continuous-ribbon");assert.ok(calls.includes("close")&&calls.includes("fill")&&calls.includes("stroke"));assert.equal(calls.includes("ellipse"),false);
});

test("watercolor uses one connected translucent wash with pigment blooms, not only circular stamps",()=>{
 const calls=[],ctx={save(){},restore(){},translate(){},rotate(){},beginPath(){calls.push("begin")},moveTo(){calls.push("move")},lineTo(){calls.push("line")},closePath(){calls.push("close")},fill(){calls.push("fill")},stroke(){calls.push("stroke")},ellipse(){calls.push("ellipse")},quadraticCurveTo(){},bezierCurveTo(){},set fillStyle(v){},set globalAlpha(v){},set globalCompositeOperation(v){},set lineCap(v){},set lineJoin(v){},set strokeStyle(v){},set lineWidth(v){},createRadialGradient(){return{addColorStop(){}}}};
 const r=drawRasterBrushStroke(ctx,[{x:0,y:0,pressure:.3},{x:28,y:12,pressure:.7},{x:66,y:20,pressure:1}],{brush:"watercolor",size:16,color:"#527c9b",texture:.8,seed:23});
 assert.equal(r.renderMode,"wash");assert.ok(calls.includes("close")&&calls.includes("ellipse")&&calls.includes("fill"));
});
test("foliage creates varied directional leaves and companion leaf clusters deterministically",()=>{
 const render=()=>{const calls=[],ctx={save(){},restore(){},translate(){},rotate(){},beginPath(){calls.push("begin")},moveTo(){calls.push("move")},lineTo(){calls.push("line")},closePath(){},fill(){calls.push("fill")},stroke(){calls.push("stroke")},ellipse(){},quadraticCurveTo(){calls.push("curve")},bezierCurveTo(){calls.push("bezier")},set fillStyle(v){},set globalAlpha(v){},set globalCompositeOperation(v){},set lineCap(v){},set lineJoin(v){},set strokeStyle(v){},set lineWidth(v){}};const r=drawRasterBrushStroke(ctx,[{x:0,y:0},{x:35,y:12},{x:70,y:-5}],{brush:"foliage",size:14,color:"#39734b",texture:.9,seed:77});return{calls,r};};
 const a=render(),b=render();assert.deepEqual(a,b);assert.equal(a.r.renderMode,"leaf-marks");assert.ok(a.calls.filter(x=>x==="curve").length>10);assert.ok(a.calls.filter(x=>x==="fill").length>7,"companion leaves should add real scaled leaf shapes");assert.ok(a.calls.includes("stroke"));
});

test("raster brush strokes support explicit non-destructive-friendly light and shadow blend modes",()=>{
 const modes=[],ctx={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},ellipse(){},translate(){},rotate(){},quadraticCurveTo(){},bezierCurveTo(){},set fillStyle(v){},set globalAlpha(v){},set globalCompositeOperation(v){modes.push(v)},set lineCap(v){},set lineJoin(v){},set strokeStyle(v){},set lineWidth(v){}};
 for(const mode of Object.keys(RASTER_BLEND_MODES)){
  const result=drawRasterBrushStroke(ctx,[{x:2,y:2},{x:32,y:12}],{brush:"gouache",blendMode:mode,seed:5});
  assert.equal(result.blendMode,mode);
 }
 assert.deepEqual(modes,Object.values(RASTER_BLEND_MODES));
 assert.throws(()=>drawRasterBrushStroke(ctx,[{x:0,y:0}],{blendMode:"color-dodge"}),/مزج/);
});
test("raster erasing always overrides a selected paint blend mode",()=>{
 let operation="",ctx={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},ellipse(){},translate(){},rotate(){},quadraticCurveTo(){},bezierCurveTo(){},set fillStyle(v){},set globalAlpha(v){},set globalCompositeOperation(v){operation=v},set lineCap(v){},set lineJoin(v){},set strokeStyle(v){},set lineWidth(v){}};
 const result=drawRasterBrushStroke(ctx,[{x:0,y:0}],{brush:"ink",erase:true,blendMode:"screen"});
 assert.equal(operation,"destination-out");assert.equal(result.blendMode,"destination-out");
});
