import test from "node:test";
import assert from "node:assert/strict";
import {createFrame} from "../app/engine.mjs";
import {createNoriModel,validateCharacterModel,addCharacterModelToFrame} from "../app/character-model.mjs";

test("Nori model contains uniquely identified editable vector parts",()=>{
 const model=validateCharacterModel(createNoriModel());
 assert.equal(model.parts.length,11);
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
