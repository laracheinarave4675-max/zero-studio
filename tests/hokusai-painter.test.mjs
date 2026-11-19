import test from"node:test";
import assert from"node:assert/strict";
import{HOKUSAI_BRUSHES,createHokusaiPainter}from"../app/hokusai-painter.mjs";
test("Hokusai brush catalog contains licensed local brush fixtures",()=>{
 assert.deepEqual(HOKUSAI_BRUSHES.map(x=>x.id),["charcoal","calligraphy","brush","marker"]);
 assert.ok(HOKUSAI_BRUSHES.every(x=>x.url.startsWith("./vendor/hokusai/brushes/")&&x.url.endsWith(".myb")));
});
test("Hokusai painter validates required canvas and WASM bindings",async()=>{
 await assert.rejects(()=>createHokusaiPainter({}),/destination canvas/);
 await assert.rejects(()=>createHokusaiPainter({canvasElement:{getContext(){return{}}}}),/WebAssembly bindings/);
});
test("Hokusai painter rejects an unknown brush identifier",async()=>{
 class Brush{radiusLog(){return 1}}
 class Engine{constructor(){this.wasmMemory={buffer:new ArrayBuffer(960*540*4)}}flushPixels(){}pixelsPtr(){return 0}pixelsLen(){return 960*540*4}pixels(){return new Uint8Array(960*540*4)}}
 const listeners={};const context={putImageData(){},createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4),width:w,height:h}}};
 const canvas={getContext(){return context},addEventListener(n,f){listeners[n]=f},removeEventListener(){},getBoundingClientRect(){return{left:0,top:0,width:960,height:540}},toBlob(cb){cb(new Blob())}};
 const painter=await createHokusaiPainter({canvasElement:canvas,init:async()=>{},HokusaiBrush:Brush,HokusaiCanvas:Engine,fetchImpl:async()=>({ok:true,text:async()=>"{}"})});
 await assert.rejects(()=>painter.loadBrush("not-a-brush"),/Unknown Hokusai brush/);painter.destroy();
});
