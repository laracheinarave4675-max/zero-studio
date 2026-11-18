import test from "node:test";
import assert from "node:assert/strict";
import {createFrame,createLayer,createInbetweenFrames,normalizeProject} from "../app/engine.mjs";
import {createNoriModel,validateCharacterModel,addCharacterModelToFrame,NORI_VIEWS,NORI_POSES,NORI_EXPRESSIONS,applyNoriPalette,createNoriModelSheetSvg,copyCharacterInstanceToFrame,replaceCharacterInstanceInFrame,applyNoriRigPose,solveNoriRigJoint,interpolateNoriRigModels,NORI_JOINT_KEYS,NORI_RIG_BONES} from "../app/character-model.mjs";

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
  assert.ok(between.every(frame=>frame.layers.slice(1).every(layer=>layer.operations.length>0)));
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

test("Nori palette overrides recolor semantic parts without mutating the base model",()=>{
 const base=createNoriModel(),variant=applyNoriPalette(base,{line:"#111111",skin:"#ffccaa",hair:"#aa3377",cloth:"#228855",accent:"#ffaa00"});
 const find=(m,id)=>m.parts.find(p=>p.id===id).path;
 assert.equal(find(variant,"body").fill,"#228855");
 assert.equal(find(variant,"head").fill,"#ffccaa");
 assert.equal(find(variant,"hair").fill,"#aa3377");
 assert.equal(find(variant,"eye-left").stroke,"#111111");
 assert.equal(find(variant,"mouth").stroke,"#ffaa00");
 assert.notEqual(JSON.stringify(base),JSON.stringify(variant));
});
test("Nori palette overrides reject invalid color inputs safely",()=>{
 const variant=applyNoriPalette(createNoriModel(),{skin:"url(javascript:alert(1))",line:"#123"});
 assert.equal(variant.palette.skin,"#f4c7a1");
 assert.equal(variant.palette.line,"#123");
});

test("Nori model sheet exports 11 editable vector cells for views, expressions and poses",()=>{
 const sheet=createNoriModelSheetSvg({skin:"#eeccaa",cloth:"#55aa99"});
 assert.match(sheet,/^<svg xmlns=/);
 assert.equal((sheet.match(/data-character-cell=/g)||[]).length,11);
 assert.equal((sheet.match(/data-proportion-guides=/g)||[]).length,11);
 assert.match(sheet,/stroke-dasharray="7 7"/);
 assert.match(sheet,/Turnaround/);
 assert.match(sheet,/Expression/);
 assert.match(sheet,/Pose/);
 assert.match(sheet,/<path /);
 assert.doesNotMatch(sheet,/<image/);
});

test("Nori skeleton contains validated joints and four connected limb chains",()=>{
 const model=validateCharacterModel(createNoriModel());
 assert.equal(Object.keys(model.rig.joints).length,NORI_JOINT_KEYS.length);
 assert.equal(model.rig.bones.length,4);
 assert.deepEqual(model.rig.bones.map(b=>b.partId),["arm-left","arm-right","leg-left","leg-right"]);
});
test("dragging Nori rig joints deforms matching vector parts and preserves other features",()=>{
 const base=applyNoriRigPose(createNoriModel(),{}),moved=applyNoriRigPose(base,{"elbow-left":{x:700,y:650},"wrist-left":{x:680,y:760}});
 const part=(model,id)=>model.parts.find(p=>p.id===id).path.d;
 assert.notEqual(part(base,"arm-left"),part(moved,"arm-left"));
 assert.equal(part(base,"arm-right"),part(moved,"arm-right"));
 assert.equal(part(base,"body"),part(moved,"body"));
 assert.equal(moved.rig.joints["elbow-left"].x,700);
});
test("Nori rig rejects unknown joints and validates all coordinates",()=>{
 const base=createNoriModel();
 assert.throws(()=>applyNoriRigPose(base,{"wing":{x:10,y:10}}),/مفصل/);
 const invalid={...base,rig:{...base.rig,joints:{...base.rig.joints,"wrist-left":{x:NaN,y:2,visible:true}}}};
 assert.throws(()=>validateCharacterModel(invalid),/بيانات مفصل/);
});

const segmentLengths=(model,bone)=>{
 const j=model.rig.joints,dist=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
 return [dist(j[bone.from],j[bone.through]),dist(j[bone.through],j[bone.to])];
};
test("two-bone IK keeps upper and lower limb lengths while dragging a hand or foot",()=>{
 const base=createNoriModel();
 for(const bone of NORI_RIG_BONES){
  const before=segmentLengths(base,bone);
  const target=bone.to.includes("wrist")?{x:bone.id==="arm-left"?610:1310,y:bone.id==="arm-left"?470:460}:{x:bone.id==="leg-left"?620:1320,y:bone.id==="leg-left"?930:940};
  const solved=solveNoriRigJoint(base,bone.to,target);
  const after=segmentLengths(solved,bone);
  assert.ok(Math.abs(before[0]-after[0])<1e-6, bone.id+" upper length");
  assert.ok(Math.abs(before[1]-after[1])<1e-6, bone.id+" lower length");
  assert.notDeepEqual(solved.rig.joints[bone.to],base.rig.joints[bone.to]);
  assert.ok(solved.parts.find(p=>p.id===bone.partId).path.d!==base.parts.find(p=>p.id===bone.partId).path.d);
 }
});
test("dragging an elbow preserves both bone lengths and carries the wrist",()=>{
 const base=createNoriModel(),bone=NORI_RIG_BONES[0],before=segmentLengths(base,bone);
 const moved=solveNoriRigJoint(base,bone.through,{x:700,y:640}),after=segmentLengths(moved,bone);
 assert.ok(Math.abs(before[0]-after[0])<1e-6);
 assert.ok(Math.abs(before[1]-after[1])<1e-6);
 assert.notDeepEqual(moved.rig.joints[bone.to],base.rig.joints[bone.to]);
});
test("dragging a shoulder translates its limb chain without stretching segments",()=>{
 const base=createNoriModel(),bone=NORI_RIG_BONES[1],before=segmentLengths(base,bone);
 const moved=solveNoriRigJoint(base,bone.from,{x:1120,y:590}),after=segmentLengths(moved,bone);
 assert.ok(Math.abs(before[0]-after[0])<1e-6);
 assert.ok(Math.abs(before[1]-after[1])<1e-6);
});
test("joint solver rejects unknown joints and malformed targets",()=>{
 const base=createNoriModel();
 assert.throws(()=>solveNoriRigJoint(base,"tail",{x:1,y:1}),/مفصل/);
 assert.throws(()=>solveNoriRigJoint(base,"wrist-left",{x:NaN,y:1}),/هدف/);
});

test("constrained rig poses can be inserted as keyframes and interpolated",()=>{
 const make=target=>{
  const model=solveNoriRigJoint(createNoriModel(),"wrist-right",target);
  const frame=createFrame();addCharacterModelToFrame(frame,model);return frame;
 };
 const start=make({x:1160,y:790}),end=make({x:1250,y:430});
 const between=createInbetweenFrames(start,end,4);
 assert.equal(between.length,4);
 const armAt=frame=>frame.layers.find(layer=>layer.name==="الأطراف").operations.find((op,index)=>index===1).path.d;
 const signatures=[start,...between,end].map(armAt);
 assert.equal(new Set(signatures).size,6);
});

test("rig-aware character interpolation creates safe editable midpoint poses",()=>{
 const start=createNoriModel("neutral","front","neutral");
 const end=solveNoriRigJoint(createNoriModel("happy","front","wave"),"wrist-right",{x:1260,y:430});
 const original=JSON.stringify(start),mid=interpolateNoriRigModels(start,end,.5);
 assert.equal(validateCharacterModel(mid).parts.length,12);
 assert.equal(mid.pose,"interpolated");
 assert.equal(mid.expression,"interpolated");
 assert.notEqual(mid.parts.find(p=>p.id==="arm-right").path.d,start.parts.find(p=>p.id==="arm-right").path.d);
 assert.notEqual(mid.parts.find(p=>p.id==="mouth").path.d,start.parts.find(p=>p.id==="mouth").path.d);
 assert.equal(JSON.stringify(start),original);
});
test("rig-aware interpolation rejects incompatible views, missing rigs, and invalid progress",()=>{
 const front=createNoriModel(),side=createNoriModel("neutral","side","neutral");
 assert.throws(()=>interpolateNoriRigModels(front,side,.5),/زاوية العرض/);
 assert.throws(()=>interpolateNoriRigModels({...front,rig:undefined},front,.5),/هيكل مفاصل/);
 assert.throws(()=>interpolateNoriRigModels(front,front,1.5),/نسبة انتقال/);
});

test("character insertions create stable multi-layer instance identity and part membership",()=>{
 const frame=createFrame(),layers=addCharacterModelToFrame(frame,createNoriModel());
 const ids=new Set(layers.map(layer=>layer.characterInstance.id));
 assert.equal(ids.size,1);
 assert.ok(layers.every(layer=>layer.characterInstance.modelId.startsWith("nori-")));
 assert.equal(layers.reduce((sum,layer)=>sum+layer.characterInstance.partIds.length,0),12);
});
test("character instances can be copied to another frame with new operation identities",()=>{
 const source=createFrame(),target=createFrame(),layers=addCharacterModelToFrame(source,createNoriModel());
 const instanceId=layers[0].characterInstance.id;
 const copies=copyCharacterInstanceToFrame(source,target,instanceId);
 assert.equal(copies.length,layers.length);
 assert.ok(copies.every(layer=>layer.characterInstance.id===instanceId));
 assert.notEqual(copies[0].id,layers[0].id);
 assert.notEqual(copies[0].operations[0].id,layers[0].operations[0].id);
 assert.throws(()=>copyCharacterInstanceToFrame(source,target,instanceId),/موجود بالفعل/);
});
test("a character instance can be updated in one frame without changing its linked identity",()=>{
 const frame=createFrame(),layers=addCharacterModelToFrame(frame,createNoriModel()),instanceId=layers[0].characterInstance.id;
 const other=createLayer("خلفية");frame.layers.unshift(other);
 const updated=replaceCharacterInstanceInFrame(frame,instanceId,createNoriModel("happy","front","wave"));
 assert.equal(updated.length,4);
 assert.equal(frame.layers[0].id,other.id);
 assert.ok(updated.every(layer=>layer.characterInstance.id===instanceId));
 assert.equal(updated[2].operations.length,3);
});
test("character instance metadata survives frame in-betweens and project normalization",()=>{
 const start=createFrame(),end=createFrame(),layers=addCharacterModelToFrame(start,createNoriModel());
 const instanceId=layers[0].characterInstance.id;
 copyCharacterInstanceToFrame(start,end,instanceId);
 const between=createInbetweenFrames(start,end,1);
 assert.ok(between[0].layers.slice(1).every(layer=>layer.characterInstance?.id===instanceId));
 const project=normalizeProject({format:"zero-studio",version:2,name:"instances",fps:24,frames:[start,end]});
 assert.equal(project.frames[0].layers[1].characterInstance.id,instanceId);
});
test("character instance replacement rejects missing identities and invalid models",()=>{
 const frame=createFrame();
 assert.throws(()=>replaceCharacterInstanceInFrame(frame,"missing",createNoriModel()),/غير موجود/);
 const source=createFrame(),layers=addCharacterModelToFrame(source,createNoriModel());
 assert.throws(()=>replaceCharacterInstanceInFrame(source,layers[0].characterInstance.id,{format:"bad"}),/غير مدعومة/);
});

test("head anchor moves the head and facial features without moving the torso",()=>{
 const base=applyNoriRigPose(createNoriModel(),{}),moved=solveNoriRigJoint(base,"head-center",{x:1010,y:350});
 const path=(model,id)=>model.parts.find(part=>part.id===id).path.d;
 for(const id of ["head","hair","eye-left","eye-right","mouth"])assert.notEqual(path(base,id),path(moved,id));
 assert.equal(path(base,"body"),path(moved,"body"));
 assert.equal(path(base,"arm-left"),path(moved,"arm-left"));
});
test("torso anchor carries the head and limb joints while preserving limb segment lengths",()=>{
 const base=applyNoriRigPose(createNoriModel(),{}),moved=solveNoriRigJoint(base,"torso-center",{x:1000,y:740});
 for(const bone of NORI_RIG_BONES){
  const before=segmentLengths(base,bone),after=segmentLengths(moved,bone);
  assert.ok(Math.abs(before[0]-after[0])<1e-6);
  assert.ok(Math.abs(before[1]-after[1])<1e-6);
 }
 assert.notEqual(base.parts.find(part=>part.id==="body").path.d,moved.parts.find(part=>part.id==="body").path.d);
 assert.notEqual(base.parts.find(part=>part.id==="head").path.d,moved.parts.find(part=>part.id==="head").path.d);
});
test("legacy character rigs receive default head and torso anchors during validation",()=>{
 const legacy=createNoriModel();delete legacy.rig.joints["head-center"];delete legacy.rig.joints["torso-center"];
 const upgraded=validateCharacterModel(legacy);
 assert.deepEqual(upgraded.rig.joints["head-center"],{x:960,y:390,visible:true});
 assert.deepEqual(upgraded.rig.joints["torso-center"],{x:960,y:700,visible:true});
 assert.equal(legacy.rig.joints["head-center"],undefined);
});

test("character instance replacement respects locked semantic layers",()=>{
 const frame=createFrame(),layers=addCharacterModelToFrame(frame,createNoriModel());
 layers[1].locked=true;
 assert.throws(()=>replaceCharacterInstanceInFrame(frame,layers[0].characterInstance.id,createNoriModel("happy")),/مقفلة/);
 assert.equal(frame.layers.includes(layers[1]),true);
});
