import test from "node:test";
import assert from "node:assert/strict";
import {createPersistentRasterSurfaceManager,encodeRasterSurfaceStroke} from "../app/raster-surface.mjs";

function createHarness({encodedUrl="data:image/png;base64,AAAA"}={}){
 const created=[],loaded=[];
 const manager=createPersistentRasterSurfaceManager({
  createCanvas(){
   const calls=[];
   const context={drawImage(image){calls.push(image.source)}};
   const canvas={width:0,height:0,calls,getContext(){return context},toDataURL(){return encodedUrl}};
   created.push(canvas);return canvas;
  },
  async loadImage(source){loaded.push(source);return{source}}
 });
 return{manager,created,loaded};
}
const layer=(overrides={})=>({id:"raster-1",type:"raster",width:12,height:8,dataUrl:"data:image/png;base64,ORIGINAL",...overrides});

test("persistent raster surfaces decode once while the committed source remains unchanged",async()=>{
 const h=createHarness(),entry=layer();
 const first=await h.manager.get(entry),second=await h.manager.get(entry);
 assert.equal(first,second);
 assert.equal(h.created.length,1);
 assert.deepEqual(h.loaded,["data:image/png;base64,ORIGINAL"]);
 assert.deepEqual(first.canvas.calls,["data:image/png;base64,ORIGINAL"]);
});

test("persistent raster surfaces reload when a layer source changes outside the brush engine",async()=>{
 const h=createHarness(),entry=layer();
 const first=await h.manager.get(entry);
 entry.dataUrl="data:image/png;base64,REPLACED";
 const second=await h.manager.get(entry);
 assert.notEqual(second,first);
 assert.equal(h.created.length,2);
 assert.deepEqual(h.loaded,["data:image/png;base64,ORIGINAL","data:image/png;base64,REPLACED"]);
});

test("markCurrent keeps a just-committed canvas hot instead of decoding its PNG again",async()=>{
 const h=createHarness(),entry=layer();
 const first=await h.manager.get(entry);
 entry.dataUrl="data:image/png;base64,NEWCOMMIT";
 h.manager.markCurrent(entry);
 const second=await h.manager.get(entry);
 assert.equal(second,first);
 assert.equal(h.created.length,1);
 assert.deepEqual(h.loaded,["data:image/png;base64,ORIGINAL"]);
});

test("explicit invalidation rebuilds a surface from the last committed layer data",async()=>{
 const h=createHarness(),entry=layer();
 const first=await h.manager.get(entry);
 h.manager.invalidate(entry);
 const second=await h.manager.get(entry);
 assert.notEqual(second,first);
 assert.equal(h.created.length,2);
 assert.deepEqual(h.loaded,["data:image/png;base64,ORIGINAL","data:image/png;base64,ORIGINAL"]);
});

test("a successful raster stroke transaction returns its PNG without discarding the surface",async()=>{
 const h=createHarness(),entry=layer();
 const committed=await encodeRasterSurfaceStroke(h.manager,entry,({context})=>{context.drawImage({source:"paint"});return{dabCount:14}});
 assert.equal(committed.dataUrl,"data:image/png;base64,AAAA");
 assert.deepEqual(committed.result,{dabCount:14});
 assert.equal(committed.surface.canvas.calls.at(-1),"paint");
 assert.equal(h.created.length,1);
});

test("an oversized raster stroke is rejected and its mutated surface is discarded",async()=>{
 const oversized="data:image/png;base64,"+"A".repeat(80);
 const h=createHarness({encodedUrl:oversized}),entry=layer();
 const original=entry.dataUrl;
 await assert.rejects(encodeRasterSurfaceStroke(h.manager,entry,({context})=>{context.drawImage({source:"rejected-pixels"});return true},{maxDataUrlChars:40,maxImageBytes:16}),/تجاوز الحد الآمن/);
 assert.equal(entry.dataUrl,original,"failed transactions must not change the persisted layer");
 const recovered=await h.manager.get(entry);
 assert.equal(h.created.length,2,"the surface containing rejected pixels must not be reused");
 assert.deepEqual(h.loaded,[original,original],"the new surface must be rebuilt from the last committed PNG");
 assert.deepEqual(recovered.canvas.calls,[original]);
});

test("a drawing exception discards partial in-memory pixels before the next stroke",async()=>{
 const h=createHarness(),entry=layer(),original=entry.dataUrl;
 await assert.rejects(encodeRasterSurfaceStroke(h.manager,entry,({context})=>{context.drawImage({source:"partial"});throw Error("paint failed")}),/paint failed/);
 const recovered=await h.manager.get(entry);
 assert.equal(h.created.length,2);
 assert.deepEqual(h.loaded,[original,original]);
 assert.deepEqual(recovered.canvas.calls,[original]);
});

test("raster surface limits reject invalid layer types and oversized dimensions",async()=>{
 const h=createHarness();
 await assert.rejects(h.manager.get({type:"vector",width:1,height:1}),/raster layer/);
 await assert.rejects(h.manager.get(layer({width:4000,height:3000})),/safe surface limit/);
 assert.equal(h.created.length,0);
});
