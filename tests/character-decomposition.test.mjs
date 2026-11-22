import test from "node:test";
import assert from "node:assert/strict";
import {
  createCharacterDecomposition, validateCharacterDecomposition, compositeCharacterDecomposition,
  auditCharacterDecomposition, approveOcclusionRepair, createCharacterRig, sampleCharacterRig,
  auditCharacterRig, validateCharacterRig
} from "../app/character-decomposition.mjs";
import { createProject, normalizeProject } from "../app/engine.mjs";

function source() {
  const data = new Uint8Array([
    255,0,0,255, 255,0,0,255, 0,255,0,255, 0,255,0,255,
    255,0,0,255, 255,0,0,255, 0,255,0,255, 0,255,0,255
  ]);
  return { width: 4, height: 2, data };
}
function masks() {
  return [
    { id:"hair", name:"Back hair", role:"hair-back", order:0, identityLocked:true, mask:new Uint8Array([255,255,0,0,255,255,0,0]) },
    { id:"face", name:"Face and front details", role:"face", order:1, identityLocked:true, mask:new Uint8Array([0,0,255,255,0,0,255,255]) }
  ];
}
function decomposition(overrides={}) {
  return createCharacterDecomposition({ characterAssetId:"kimono-library-01", source:source(), parts:masks(), ...overrides });
}
function decompositionWithRepair() {
  const mask=new Uint8Array(8);mask[0]=255;const pixels=new Uint8Array(32);pixels.set([8,9,10,255],0);
  return decomposition({occlusionRegions:[{id:"hair-underlay",name:"Hair hidden area",method:"manual-paint",occludedByPartId:"hair",reviewStatus:"approved",mask,pixels}]});
}
test("decomposition round-trips the complete original RGBA source pixel-for-pixel", () => {
  const record=decomposition(), audit=auditCharacterDecomposition(record);
  assert.equal(validateCharacterDecomposition(record).pixelExactSource,true);
  assert.equal(audit.sourceCompositeExact,true);
  assert.equal(audit.mismatchedChannels,0);
  assert.equal(audit.partCount,2);
});
test("decomposition rejects missing pixels, overlapping masks and empty masks", () => {
  assert.throws(()=>createCharacterDecomposition({characterAssetId:"c",source:source(),parts:[{...masks()[0],mask:new Uint8Array(8).fill(255)},masks()[1]]}),/overlap/);
  assert.throws(()=>createCharacterDecomposition({characterAssetId:"c",source:source(),parts:[{...masks()[0],mask:new Uint8Array(8)},masks()[1]]}),/not assigned/);
  assert.throws(()=>createCharacterDecomposition({characterAssetId:"c",source:source(),parts:[{...masks()[0],mask:new Uint8Array(8)}, {...masks()[1],mask:new Uint8Array(8)}]}),/empty mask/);
});
test("decomposition rejects malformed dimensions, non-binary masks and transparent source claims", () => {
  assert.throws(()=>createCharacterDecomposition({characterAssetId:"c",source:{width:4,height:2,data:new Uint8Array(3)},parts:masks()}),/invalid byte array/);
  assert.throws(()=>createCharacterDecomposition({characterAssetId:"c",source:source(),parts:[{...masks()[0],mask:new Uint8Array([255,128,0,0,255,255,0,0])},masks()[1]]}),/binary/);
  const transparent={width:4,height:2,data:source().data.slice()};transparent.data[3]=0;
  assert.throws(()=>createCharacterDecomposition({characterAssetId:"c",source:transparent,parts:masks()}),/transparent/);
});
test("hidden regions require explicit complete repair pixels and remain pending until reviewed", () => {
  const mask=new Uint8Array(8);mask[0]=255;
  const pixels=new Uint8Array(32);pixels.set([0,0,255,255],0);
  const record=decomposition({occlusionRegions:[{id:"head-under-hair",name:"Head area hidden by hair",method:"manual-paint",occludedByPartId:"hair",mask,pixels}]});
  let audit=auditCharacterDecomposition(record);
  assert.equal(audit.occlusionRepairCount,1);
  assert.equal(audit.allRepairsApproved,false);
  assert.equal(audit.readyForLayerMotion,false);
  assert.throws(()=>createCharacterRig({decomposition:record,nodes:[{id:"hair-node",partId:"hair",identityLocked:false,repairIds:["head-under-hair"]},{id:"face-node",partId:"face"}]}),/approved repair behind that exact part/);
  approveOcclusionRepair(record,"head-under-hair");
  const hair=record.parts.find(part=>part.id==="hair");hair.visible=false;
  const revealed=compositeCharacterDecomposition(record,{includeRepairs:true});
  assert.deepEqual(Array.from(revealed.slice(0,4)),[0,0,255,255]);
  hair.visible=true;
  audit=auditCharacterDecomposition(record);
  assert.equal(audit.allRepairsApproved,true);
  assert.equal(audit.readyForLayerMotion,true);
  assert.throws(()=>decomposition({occlusionRegions:[{id:"bad",name:"Incomplete",method:"manual-paint",occludedByPartId:"hair",mask,pixels:new Uint8Array(32)}]}),/every hidden-area mask pixel/);
});
test("repair methods cannot claim automatic generative fill", () => {
  const mask=new Uint8Array(8);mask[0]=255;const pixels=new Uint8Array(32);pixels.set([1,2,3,255],0);
  assert.throws(()=>decomposition({occlusionRegions:[{id:"r",name:"Repair",method:"ai-fill",occludedByPartId:"hair",mask,pixels}]}),/explicit, reviewable repair method/);
});
test("rig requires exactly one node per part and rejects missing parents and cycles", () => {
  const d=decomposition(),nodes=[{id:"hair-node",partId:"hair"},{id:"face-node",partId:"face",parentId:"hair-node"}];
  assert.equal(createCharacterRig({decomposition:d,nodes}).nodes.length,2);
  assert.throws(()=>createCharacterRig({decomposition:d,nodes:[nodes[0]]}),/Every decomposed part/);
  assert.throws(()=>createCharacterRig({decomposition:d,nodes:[{...nodes[0],parentId:"face-node"},nodes[1]]}),/cycle/);
  assert.throws(()=>createCharacterRig({decomposition:d,nodes:[nodes[0],{...nodes[1],parentId:"missing"}]}),/parent does not exist/);
});
test("rig clamps secondary motion and never transforms identity-locked face parts", () => {
  const d=decomposition(),rig=createCharacterRig({decomposition:d,nodes:[
    {id:"hair-node",partId:"hair",identityLocked:false,pivot:{x:.5,y:.1}},
    {id:"face-node",partId:"face",identityLocked:true}
  ]});
  const pose=sampleCharacterRig(rig,{"hair-node":{translateX:99,translateY:-99,rotation:1,scaleX:1.2,scaleY:.8},"face-node":{translateX:4,rotation:.03,scaleX:1.01}});
  assert.equal(pose.transforms["hair-node"].translateX,4);
  assert.equal(pose.transforms["hair-node"].translateY,-4);
  assert.equal(pose.transforms["hair-node"].rotation,.035);
  assert.equal(pose.transforms["hair-node"].scaleX,1.01);
  assert.equal(pose.transforms["face-node"].translateX,0);
  assert.equal(pose.transforms["face-node"].rotation,0);
  assert.equal(pose.transforms["face-node"].scaleX,1);
  const audit=auditCharacterRig(rig,{"hair-node":{rotation:.02},"face-node":{rotation:.04}});
  assert.equal(audit.identityLocksRespected,true);
  assert.equal(validateCharacterRig(rig,d).sourceHash,d.sourceHash);
});
test("project persistence keeps decomposition records and rejects corrupted source hashes", () => {
  const project=createProject(),record=decompositionWithRepair();project.characterDecompositions=[record];project.characterRigs=[createCharacterRig({decomposition:record,nodes:[{id:"hair-node",partId:"hair",identityLocked:false,repairIds:["hair-underlay"]},{id:"face-node",partId:"face"}]})];
  const reopened=normalizeProject(JSON.parse(JSON.stringify(project)));
  assert.equal(reopened.characterDecompositions.length,1);
  assert.equal(reopened.characterDecompositions[0].characterAssetId,"kimono-library-01");
  assert.equal(reopened.characterRigs.length,1);
  assert.equal(reopened.characterRigs[0].sourceHash,record.sourceHash);
  const corrupted=JSON.parse(JSON.stringify(project));corrupted.characterDecompositions[0].sourceHash="tampered";
  assert.throws(()=>normalizeProject(corrupted),/Immutable source pixels changed/);
});
