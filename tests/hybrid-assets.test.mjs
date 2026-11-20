import test from "node:test";
import assert from "node:assert/strict";
import {validateHybridAssetManifest,createHybridFrameSignature,validateHybridAnimationCadence} from "../app/hybrid-assets.mjs";
const manifest={version:1,assetId:"forest-shot-01",width:1920,height:1080,layers:[
 {id:"bg",name:"Painted background",type:"raster",sourceFile:"layers/bg.png",mimeType:"image/png",bytes:1200,width:1920,height:1080,hasAlpha:true,opacity:1,visible:true},
 {id:"ink",name:"Vector ink",type:"vector",sourceFile:"layers/ink.svg",svg:"<svg/>",opacity:.85,visible:true,blendMode:"multiply"}
]};
test("hybrid manifest preserves ordered raster and vector layers without flattening",()=>{
 const result=validateHybridAssetManifest(manifest);
 assert.equal(result.layerCount,2);assert.equal(result.mixed,true);assert.equal(result.layers[0].type,"raster");assert.equal(result.layers[1].type,"vector");assert.equal(result.layers[1].opacity,.85);assert.equal(result.layers[1].blendMode,"multiply");
});
test("manifest rejects duplicate IDs, unsafe source paths, unsupported blends and invalid sizes",()=>{
 assert.throws(()=>validateHybridAssetManifest({...manifest,layers:[manifest.layers[0],{...manifest.layers[1],id:"bg"}]}),/مكرر/);
 assert.throws(()=>validateHybridAssetManifest({...manifest,layers:[{...manifest.layers[0],sourceFile:"../secret.png"}]}),/غير آمن/);
 assert.throws(()=>validateHybridAssetManifest({...manifest,layers:[{...manifest.layers[0],blendMode:"unknown"}]}),/غير مدعوم/);
 assert.throws(()=>validateHybridAssetManifest({...manifest,width:0}),/الحدود/);
});
test("frame signatures distinguish raster source revisions and vector artwork",()=>{
 const frame={layers:[{id:"paint",name:"Paint",type:"raster",sourceFile:"paint.png",sha256:"a".repeat(64),width:1920,height:1080}]};
 const first=createHybridFrameSignature(frame);
 assert.notEqual(first,createHybridFrameSignature({layers:[{...frame.layers[0],sha256:"b".repeat(64)}]}));
 assert.notEqual(first,createHybridFrameSignature({layers:[{id:"ink",name:"Ink",type:"vector",svg:"<svg/>"}]}));
});
test("hybrid cadence retains 24 unique human-drawing slots per second",()=>{
 const frames=Array.from({length:24},(_,i)=>({layers:[{id:"paint",name:"Paint",type:"raster",sourceFile:"f"+i+".png",sha256:String(i).padStart(64,"0"),width:1920,height:1080}]}));
 const result=validateHybridAnimationCadence(frames);
 assert.equal(result.fps,24);assert.equal(result.uniqueDrawings,24);assert.equal(result.uniqueDrawingsPerSecond,24);assert.equal(result.meetsStructuralTarget,true);
 assert.throws(()=>validateHybridAnimationCadence(frames,{fps:12}),/24 رسمة/);
 const duplicated=frames.slice();duplicated[23]=frames[22];
 assert.equal(validateHybridAnimationCadence(duplicated).duplicateDrawings,1);
});
