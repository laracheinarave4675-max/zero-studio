import test from "node:test";
import assert from "node:assert/strict";
import {createFrame,createInbetweenFrames} from "../app/engine.mjs";
import {createNoriModel,validateCharacterModel,addCharacterModelToFrame,NORI_VIEWS,NORI_POSES,NORI_EXPRESSIONS} from "../app/character-model.mjs";

test("Nori model contains uniquely identified editable vector parts",()=>{
 const model=validateCharacterModel(createNoriModel());
 assert.equal(model.parts.length,12);
 assert.equal(new Set(model.parts.map(p=>p.id)).size,model.parts.length);
 assert.ok(model.parts.every(p=>typeof p.path.d==="string"&&p.path.d.length>0));
});
test("character model inserts grouped editable layers into a frame",()=>{
 const frame=createFrame(),added=addCharacterModelToFrame(frame,createNoriModel());
 assert.equal(added.length,4);
 assert.equal(frame.layers.length,5);
 assert.deepEqual(added.map(l=>l.name),["الجسم","الرأس","الوجه","الأطراف"]);
 assert.ok(added.every(l=>l.operations.length>0));
 assert.ok(added.every(l=>l.operations.every(o=>o.kind==="stroke")));
});
test("character model rejects duplicate IDs, unsupported versions and unsafe paths",()=>{
 const model=createNoriModel();
 assert.throws(()=>validateCharacterModel({...model,version:2}),/غير مدعومة/);
 const duplicate={...model,parts:[...model.parts,{...model.parts[0]}]};
 assert.throws(()=>validateCharacterModel(duplicate),/مكرر/);
 const unsafe={...model,parts:model.parts.map((p,i)=>i? p:{...p,path:{...p.path,d:"<script>"}})};
 assert.throws(()=>validateCharacterModel(unsafe),/مسار SVG/);
});
test("adding a model does not mutate the reusable source model",()=>{
 const model=createNoriModel(),before=JSON.stringify(model),frame=createFrame();
 addCharacterModelToFrame(frame,model);
 assert.equal(JSON.stringify(model),before);
});

test("Nori expression presets produce distinct validated facial vector paths",()=>{
 const neutral=createNoriModel("neutral"),happy=createNoriModel("happy"),sad=createNoriModel("sad"),surprised=createNoriModel("surprised");
 const face=model=>model.parts.filter(p=>["eye-left","eye-right","mouth"].includes(p.id)).map(p=>p.path.d).join("|");
 assert.equal(new Set([face(neutral),face(happy),face(sad),face(surprised)]).size,4);
 for(const model of [neutral,happy,sad,surprised])assert.equal(validateCharacterModel(model).parts.length,12);
 assert.throws(()=>createNoriModel("angry"),/غير مدعوم/);
});

test("all Nori views, poses and expressions produce safe editable character variants",()=>{
 const models=[];
 for(const view of NORI_VIEWS)for(const pose of NORI_POSES)for(const expression of NORI_EXPRESSIONS){
  const model=validateCharacterModel(createNoriModel(expression,view,pose));
  assert.equal(model.view,view);assert.equal(model.pose,pose);assert.equal(model.expression,expression);
  models.push(model);
 }
 assert.equal(models.length,48);
 assert.equal(new Set(models.map(m=>m.id)).size,48);
});
test("side and back views hide the facial parts that should not be visible",()=>{
 const side=createNoriModel("neutral","side","neutral"),back=createNoriModel("neutral","back","neutral");
 assert.equal(side.parts.find(p=>p.id==="eye-right").visible,false);
 for(const id of ["eye-left","eye-right","mouth"])assert.equal(back.parts.find(p=>p.id===id).visible,false);
});
test("wave, walk and sit pose presets change limb geometry",()=>{
 const neutral=createNoriModel(),wave=createNoriModel("neutral","front","wave"),walk=createNoriModel("neutral","front","walk"),sit=createNoriModel("neutral","front","sit");
 const path=(m,id)=>m.parts.find(p=>p.id===id).path.d;
 assert.notEqual(path(neutral,"arm-right"),path(wave,"arm-right"));
 assert.equal(wave.parts.find(p=>p.id==="hand-right").visible,true);
 assert.notEqual(path(neutral,"leg-left"),path(walk,"leg-left"));
 assert.notEqual(path(neutral,"leg-right"),path(sit,"leg-right"));
});

test("custom model package preserves imported editable vector parts through validation and insertion",()=>{
 const original=createNoriModel("happy","side","walk");
 original.id="user-character-01";original.name="شخصيتي";
 const imported=validateCharacterModel(JSON.parse(JSON.stringify(original)));
 assert.equal(imported.id,"user-character-01");
 assert.equal(imported.view,"side");assert.equal(imported.pose,"walk");
 const frame=createFrame(),layers=addCharacterModelToFrame(frame,imported);
 assert.ok(layers.length>=2);
 assert.ok(layers.every(layer=>layer.operations.every(op=>op.kind==="stroke")));
});
test("custom character models reject non-boolean visibility and invalid dimensions",()=>{
 const model=createNoriModel();
 assert.throws(()=>validateCharacterModel({...model,parts:model.parts.map((p,i)=>i? p:{...p,visible:"yes"})}),/ظهور/);
 assert.throws(()=>validateCharacterModel({...model,canvas:{width:100,height:100}}),/1920/);
});

test("character model requires at least one visible part for insertion",()=>{
 const model=createNoriModel();
 assert.throws(()=>validateCharacterModel({...model,parts:model.parts.map(p=>({...p,visible:false}))}),/ظاهر/);
});

test("front-view Nori pose keyframes can generate editable in-between frames",()=>{
 const make=pose=>{const frame=createFrame();addCharacterModelToFrame(frame,createNoriModel("neutral","front",pose));return frame};
 const neutral=make("neutral");
 for(const pose of ["wave","walk","sit"]){
  const between=createInbetweenFrames(neutral,make(pose),2);
  assert.equal(between.length,2);
  assert.equal(between[0].layers.length,5);
  assert.ok(between.every(frame=>frame.layers.every(layer=>layer.operations.length>0)));
 }
});
test("Nori facial expression keyframes interpolate without changing path topology",()=>{
 const make=expression=>{const frame=createFrame();addCharacterModelToFrame(frame,createNoriModel(expression,"front","neutral"));return frame};
 const neutral=make("neutral");
 for(const expression of ["happy","sad","surprised"]){
  const between=createInbetweenFrames(neutral,make(expression),1);
  assert.equal(between.length,1);
  assert.equal(between[0].layers[3].operations.length,3);
 }
});
