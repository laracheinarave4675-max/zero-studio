import test from "node:test";
import assert from "node:assert/strict";
import {normalizeBrushSettings,resampleBrushStroke,paintRasterBrushStroke} from "../app/raster-brush-engine.mjs";
class Gradient{addColorStop(){}}
class Context{
 constructor(){this.calls=[];this.stack=0;}
 save(){this.stack++;}restore(){this.stack--;}
 translate(...v){this.calls.push(["translate",...v]);}rotate(){}scale(){}
 createRadialGradient(){return new Gradient();}
 beginPath(){}arc(...v){this.calls.push(["arc",...v]);}fill(){this.calls.push(["fill"]);}
 set fillStyle(v){} set globalAlpha(v){}
}
test("brush settings are bounded and reject unsafe colors",()=>{
 const s=normalizeBrushSettings({size:999,opacity:-1,color:"url(evil)",texture:4});
 assert.equal(s.size,240);assert.equal(s.opacity,0.01);assert.equal(s.color,"#252525");assert.equal(s.texture,1);
});
test("stroke resampling interpolates position and pressure deterministically",()=>{
 const points=resampleBrushStroke([{x:0,y:0,pressure:.2},{x:100,y:0,pressure:1}],{size:20,spacing:.25,texture:0});
 assert.ok(points.length>=20);assert.equal(points[0].x,0);assert.equal(points.at(-1).x,100);
 assert.ok(points.at(-1).pressure>points[0].pressure);
 assert.deepEqual(points,resampleBrushStroke([{x:0,y:0,pressure:.2},{x:100,y:0,pressure:1}],{size:20,spacing:.25,texture:0}));
});
test("empty and single-point strokes are handled",()=>{
 assert.equal(resampleBrushStroke([]).length,0);
 assert.equal(resampleBrushStroke([{x:4,y:9}]).length,1);
});
test("raster brush paints textured pressure-sensitive dabs and reports bounds",()=>{
 const ctx=new Context();
 const result=paintRasterBrushStroke(ctx,[{x:10,y:20,pressure:.5},{x:80,y:50,pressure:1}],{size:16,texture:.7,seed:42});
 assert.ok(result.stampCount>2);assert.ok(ctx.calls.some(c=>c[0]==="fill"));
 assert.ok(result.bounds.minX<10&&result.bounds.maxX>80);assert.equal(ctx.stack,0);
});
test("invalid coordinates and non-Canvas contexts fail clearly",()=>{
 assert.throws(()=>resampleBrushStroke([{x:NaN,y:2}]),/finite/);
 assert.throws(()=>paintRasterBrushStroke({},[{x:1,y:2}]),/Canvas 2D/);
});
