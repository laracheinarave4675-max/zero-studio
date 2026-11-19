import test from "node:test";
import assert from "node:assert/strict";
import {createPersistentRasterSurfaceManager} from "../app/raster-surface.mjs";

test("persistent raster surface decodes a layer once and reuses the same canvas",async()=>{
 let canvases=0,images=0,draws=0;
 const manager=createPersistentRasterSurfaceManager({
  createCanvas(){canvases++;return{width:0,height:0,getContext(){return{drawImage(){draws++}}}}},
  async loadImage(src){images++;return{src}}
 });
 const layer={type:"raster",width:32,height:24,dataUrl:"data:image/png;base64,AA=="};
 const first=await manager.get(layer),second=await manager.get(layer);
 assert.equal(first,second);assert.equal(canvases,1);assert.equal(images,1);assert.equal(draws,1);
});
test("persistent raster surfaces enforce the mobile pixel budget",async()=>{
 const manager=createPersistentRasterSurfaceManager({createCanvas(){throw Error("must not allocate")},loadImage:async()=>null,maxPixels:100});
 await assert.rejects(()=>manager.get({type:"raster",width:20,height:20}),/safe surface limit/);
});
test("replacing a raster layer invalidates its cached surface",async()=>{
 let canvases=0;
 const manager=createPersistentRasterSurfaceManager({createCanvas(){canvases++;return{getContext(){return{drawImage(){}}}}},loadImage:async()=>({})});
 const layer={type:"raster",width:8,height:8};await manager.get(layer);manager.invalidate(layer);await manager.get(layer);
 assert.equal(canvases,2);
});
