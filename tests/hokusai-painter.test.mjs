import test from"node:test";
import assert from"node:assert/strict";
import{HOKUSAI_BRUSHES,createHokusaiPainter}from"../app/hokusai-painter.mjs";
import{addRasterImageOperation,createProject,normalizeProject,frameSvg,analyzeDrawingCadence}from"../app/engine.mjs";
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
 const listeners={};let contextOptions=null;const context={putImageData(){},createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4),width:w,height:h}}};
 const canvas={getContext(_kind,options){contextOptions=options;return context},addEventListener(n,f){listeners[n]=f},removeEventListener(){},getBoundingClientRect(){return{left:0,top:0,width:960,height:540}},toBlob(cb){cb(new Blob())}};
 const painter=await createHokusaiPainter({canvasElement:canvas,init:async()=>{},HokusaiBrush:Brush,HokusaiCanvas:Engine,fetchImpl:async()=>({ok:true,text:async()=>"{}"})});
 assert.equal(contextOptions.alpha,true,"paint canvas must preserve transparent pixels for layer compositing");
 await assert.rejects(()=>painter.loadBrush("not-a-brush"),/Unknown Hokusai brush/);painter.destroy();
});

test("Hokusai PNG imports as a persistent raster operation in an editable project layer",()=>{
 const project=createProject("Raster integration"),layer=project.frames[0].layers[0];
 const png="data:image/png;base64,iVBORw0KGgo=";
 const operation=addRasterImageOperation(layer,png);
 assert.equal(operation.kind,"raster");
 assert.equal(operation.src,png);
 const normalized=normalizeProject(project);
 assert.equal(normalized.frames[0].layers[0].operations[0].kind,"raster");
 const svg=frameSvg(normalized.frames[0]);
 assert.ok(svg.includes('<image data-operation="'+operation.id+'"'));
 assert.ok(svg.includes('width="1920" height="1080"'));
});
test("raster project layers reject unsafe or oversized image sources",()=>{
 const layer=createProject().frames[0].layers[0];
 assert.throws(()=>addRasterImageOperation(layer,"https://example.com/image.png"),/PNG/);
 assert.throws(()=>addRasterImageOperation(layer,"data:image/jpeg;base64,AAAA"),/PNG/);
 assert.throws(()=>normalizeProject({...createProject(),frames:[{...createProject().frames[0],layers:[{...layer,operations:[{kind:"raster",src:"data:image/png;base64,@@@@"}]}]}]}),/PNG/);
});

test("raster image content contributes to independent drawing cadence",()=>{
 const first=createProject(),second=createProject();
 addRasterImageOperation(first.frames[0].layers[0],"data:image/png;base64,AAAA");
 addRasterImageOperation(second.frames[0].layers[0],"data:image/png;base64,BBBB");
 const result=analyzeDrawingCadence([first.frames[0],second.frames[0]],24);
 assert.equal(result.uniqueDrawingCount,2);
});
