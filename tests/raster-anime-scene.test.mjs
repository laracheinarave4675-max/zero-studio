import test from"node:test";
import assert from"node:assert/strict";
import{renderJapaneseForestHouseRaster}from"../app/raster-anime-scene.mjs";
function mockContext(){const calls=[];const gradient={addColorStop(...v){calls.push(["stop",...v])}};const target={calls};return new Proxy(target,{get(o,k){if(k==="calls")return o.calls;if(k==="createLinearGradient")return(...a)=>{calls.push([k,...a]);return gradient};return(...a)=>calls.push([k,...a])},set(o,k,v){o[k]=v;return true}})}
test("Canvas2D scene renderer composes house, forest, stonework and light deterministically",()=>{
 const a=mockContext(),b=mockContext();
 const ra=renderJapaneseForestHouseRaster(a,{seed:2026}),rb=renderJapaneseForestHouseRaster(b,{seed:2026});
 assert.deepEqual(ra,rb);assert.equal(ra.renderer,"Canvas2D");
 for(const layer of ["atmosphere","distant forest","architecture","foliage","stonework","light"])assert.ok(ra.layers.includes(layer));
 assert.deepEqual(a.calls,b.calls);assert.ok(a.calls.length>1000);
});
test("Canvas2D scene renderer rejects missing drawing contexts",()=>assert.throws(()=>renderJapaneseForestHouseRaster(null),/Canvas2D/));
