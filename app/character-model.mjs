import {createLayer,appendOperation,validatePath,safeColor,createFrame,frameSvg,interpolatePathData,translatePathData,rotatePathData,uid} from "./engine.mjs";

export const CHARACTER_MODEL_VERSION=1;
export const NORI_EXPRESSIONS=["neutral","happy","sad","surprised"];
export const NORI_VIEWS=["front","side","back"];
export const NORI_POSES=["neutral","wave","walk","sit"];

export const NORI_JOINT_KEYS=["torso-center","head-center","shoulder-left","elbow-left","wrist-left","shoulder-right","elbow-right","wrist-right","hip-left","knee-left","ankle-left","hip-right","knee-right","ankle-right"];
export const NORI_RIG_BONES=[
 {id:"arm-left",from:"shoulder-left",through:"elbow-left",to:"wrist-left",partId:"arm-left"},
 {id:"arm-right",from:"shoulder-right",through:"elbow-right",to:"wrist-right",partId:"arm-right"},
 {id:"leg-left",from:"hip-left",through:"knee-left",to:"ankle-left",partId:"leg-left"},
 {id:"leg-right",from:"hip-right",through:"knee-right",to:"ankle-right",partId:"leg-right"}
];

const part=(id,name,layer,d,stroke,width=8,fill="none",visible=true)=>({id,name,layer,visible,path:{d,stroke,width,fill}});

// Nori is built from ordinary editable path operations, never a raster drawing.
export function createNoriModel(expression="neutral",view="front",pose="neutral"){
 if(!NORI_EXPRESSIONS.includes(expression))throw Error("تعبير الشخصية غير مدعوم");
 if(!NORI_VIEWS.includes(view))throw Error("زاوية الشخصية غير مدعومة");
 if(!NORI_POSES.includes(pose))throw Error("وضعية الشخصية غير مدعومة");
 const model={
  format:"zero-character-model",version:CHARACTER_MODEL_VERSION,id:"nori-base",name:"Nori — نموذج الشخصية",
  canvas:{width:1920,height:1080},guide:{headRatio:.34,bodyRatio:.46,legRatio:.20,view,pose},
  expression,view,pose,
  palette:{line:"#263449",skin:"#f4c7a1",hair:"#27364d",cloth:"#66bfae",accent:"#e9a65b"},
  parts:[
   part("body","الجذع","الجسم","M 825 565 Q 960 520 1095 565 L 1125 850 Q 960 925 795 850 Z","#263449",9,"#66bfae"),
   part("neck","الرقبة","الجسم","M 915 500 L 1005 500 L 1010 590 L 910 590 Z","#263449",7,"#f4c7a1"),
   part("head","الرأس","الرأس","M 960 205 C 805 205 755 325 775 430 C 790 535 865 590 960 590 C 1055 590 1130 535 1145 430 C 1165 325 1115 205 960 205 Z","#263449",10,"#f4c7a1"),
   part("hair","الشعر","الرأس","M 780 390 C 735 245 840 155 960 170 C 1090 145 1185 250 1140 405 L 1095 345 L 1050 390 L 1015 320 L 960 375 L 910 315 L 865 390 L 820 350 Z","#263449",10,"#27364d"),
   part("eye-left","العين اليسرى","الوجه","M 855 405 Q 885 375 915 405 Q 885 435 855 405 Z","#263449",5,"#263449"),
   part("eye-right","العين اليمنى","الوجه","M 1005 405 Q 1035 375 1065 405 Q 1035 435 1005 405 Z","#263449",5,"#263449"),
   part("mouth","الفم","الوجه","M 930 485 Q 960 510 990 485","#9c5360",6,"none"),
   part("arm-left","الذراع اليسرى","الأطراف","M 820 610 Q 735 690 760 790","#263449",24,"none"),
   part("arm-right","الذراع اليمنى","الأطراف","M 1100 610 Q 1185 690 1160 790","#263449",24,"none"),
   part("leg-left","الساق اليسرى","الأطراف","M 865 850 Q 855 930 850 1010","#263449",30,"none"),
   part("leg-right","الساق اليمنى","الأطراف","M 1055 850 Q 1065 930 1070 1010","#263449",30,"none"),
   part("hand-right","اليد اليمنى","الأطراف","M 1160 790 C 1135 785 1128 765 1140 752 C 1152 740 1168 748 1172 765 C 1182 745 1200 752 1193 770 C 1210 770 1208 790 1190 798 Z","#263449",7,"#f4c7a1",true)
  ]
 };
 const face={
  neutral:{left:"M 855 405 Q 885 375 915 405 Q 885 435 855 405 Z",right:"M 1005 405 Q 1035 375 1065 405 Q 1035 435 1005 405 Z",mouth:"M 930 485 Q 960 510 990 485 Q 960 535 930 485"},
  happy:{left:"M 855 420 Q 885 380 915 420 Q 885 455 855 420 Z",right:"M 1005 420 Q 1035 380 1065 420 Q 1035 455 1005 420 Z",mouth:"M 920 475 Q 960 545 1000 475 Q 960 570 920 475"},
  sad:{left:"M 855 405 Q 885 435 915 405 Q 885 390 855 405 Z",right:"M 1005 405 Q 1035 435 1065 405 Q 1035 390 1005 405 Z",mouth:"M 925 510 Q 960 470 995 510 Q 960 490 925 510"},
  surprised:{left:"M 855 405 Q 885 375 915 405 Q 885 450 855 405 Z",right:"M 1005 405 Q 1035 375 1065 405 Q 1035 450 1005 405 Z",mouth:"M 945 480 Q 960 460 975 480 Q 960 530 945 480"}
 };
 for(const item of model.parts){
  if(item.id==="eye-left")item.path.d=face[expression].left;
  if(item.id==="eye-right")item.path.d=face[expression].right;
  if(item.id==="mouth")item.path.d=face[expression].mouth;
 }
 if(view==="side"){
  Object.assign(model.parts.find(p=>p.id==="head").path,{d:"M 910 205 C 820 210 790 320 825 430 C 845 520 900 585 1015 575 C 1080 560 1100 500 1080 450 Q 1045 420 1090 400 Q 1055 365 1080 330 C 1090 245 1010 190 910 205 Z"});
  model.parts.find(p=>p.id==="hair").path.d="M 825 420 C 765 270 850 155 970 170 C 1095 180 1150 285 1100 405 L 1065 350 L 1030 390 L 1000 315 L 950 365 L 910 305 L 870 385 Z";
  model.parts.find(p=>p.id==="eye-left").path.d="M 1000 405 Q 1025 380 1045 405 Q 1025 430 1000 405 Z";
  model.parts.find(p=>p.id==="eye-right").visible=false;
  model.parts.find(p=>p.id==="mouth").path.d="M 1055 485 Q 1080 500 1095 480";
  model.parts.find(p=>p.id==="body").path.d="M 900 565 Q 1000 535 1040 585 L 1070 845 Q 965 910 865 850 Z";
  model.parts.find(p=>p.id==="arm-left").path.d="M 900 620 Q 845 700 875 790";
  model.parts.find(p=>p.id==="arm-right").visible=false;
  model.parts.find(p=>p.id==="leg-left").path.d="M 930 850 Q 900 920 900 1010";
  model.parts.find(p=>p.id==="leg-right").visible=false;
  model.parts.find(p=>p.id==="hand-right").visible=false;
 }else if(view==="back"){
  model.parts.find(p=>p.id==="hair").path.d="M 780 390 C 735 245 840 155 960 170 C 1090 145 1185 250 1140 405 L 1125 560 Q 960 635 795 560 Z";
  for(const id of ["eye-left","eye-right","mouth","hand-right"])model.parts.find(p=>p.id===id).visible=false;
  model.parts.find(p=>p.id==="arm-left").path.d="M 820 610 Q 735 690 760 790";
  model.parts.find(p=>p.id==="arm-right").path.d="M 1100 610 Q 1185 690 1160 790";
 }
 if(pose==="wave"&&view==="front"){
  const hand=model.parts.find(p=>p.id==="hand-right");hand.path.d="M 1130 430 C 1105 425 1098 405 1110 392 C 1122 380 1138 388 1142 405 C 1152 385 1170 392 1163 410 C 1180 410 1178 430 1160 438 Z";
  model.parts.find(p=>p.id==="arm-right").path.d="M 1100 610 Q 1160 555 1130 430";
 }else if(pose==="walk"){
  model.parts.find(p=>p.id==="hand-right").path.d="M 1220 730 C 1195 725 1188 705 1200 692 C 1212 680 1228 688 1232 705 C 1242 685 1260 692 1253 710 C 1270 710 1268 730 1250 738 Z";
  model.parts.find(p=>p.id==="arm-left").path.d="M 820 610 Q 735 655 700 735";
  model.parts.find(p=>p.id==="arm-right").path.d="M 1100 610 Q 1185 665 1220 730";
  model.parts.find(p=>p.id==="leg-left").path.d="M 865 850 Q 825 900 780 965";
  model.parts.find(p=>p.id==="leg-right").path.d="M 1055 850 Q 1100 910 1150 970";
 }else if(pose==="sit"){
  model.parts.find(p=>p.id==="hand-right").path.d="M 1045 755 C 1020 750 1013 730 1025 717 C 1037 705 1053 713 1057 730 C 1067 710 1085 717 1078 735 C 1095 735 1093 755 1075 763 Z";
  model.parts.find(p=>p.id==="body").path.d="M 825 565 Q 960 520 1095 565 L 1125 805 Q 960 865 795 805 Z";
  model.parts.find(p=>p.id==="arm-left").path.d="M 820 610 Q 780 700 875 755";
  model.parts.find(p=>p.id==="arm-right").path.d="M 1100 610 Q 1140 700 1045 755";
  model.parts.find(p=>p.id==="leg-left").path.d="M 850 805 Q 760 850 720 930";
  model.parts.find(p=>p.id==="leg-right").path.d="M 1070 805 Q 1160 850 1200 930";
 }
 const joints={
  "torso-center":{x:960,y:700,visible:true},"head-center":{x:960,y:390,visible:true},
  "shoulder-left":{x:820,y:610,visible:true},"elbow-left":{x:735,y:690,visible:true},"wrist-left":{x:760,y:790,visible:true},
  "shoulder-right":{x:1100,y:610,visible:view!=="side"},"elbow-right":{x:1185,y:690,visible:view!=="side"},"wrist-right":{x:1160,y:790,visible:view!=="side"},
  "hip-left":{x:865,y:850,visible:true},"knee-left":{x:855,y:930,visible:true},"ankle-left":{x:850,y:1010,visible:true},
  "hip-right":{x:1055,y:850,visible:view!=="side"},"knee-right":{x:1065,y:930,visible:view!=="side"},"ankle-right":{x:1070,y:1010,visible:view!=="side"}
 };
 if(view==="side"){
  Object.assign(joints,{"shoulder-left":{x:900,y:620,visible:true},"elbow-left":{x:845,y:700,visible:true},"wrist-left":{x:875,y:790,visible:true},"hip-left":{x:930,y:850,visible:true},"knee-left":{x:900,y:920,visible:true},"ankle-left":{x:900,y:1010,visible:true}});
 }
 if(pose==="wave"&&view==="front")Object.assign(joints,{"elbow-right":{x:1160,y:555,visible:true},"wrist-right":{x:1130,y:430,visible:true}});
 if(pose==="walk")Object.assign(joints,{"elbow-left":{x:735,y:655,visible:true},"wrist-left":{x:700,y:735,visible:true},"elbow-right":{x:1185,y:665,visible:view!=="side"},"wrist-right":{x:1220,y:730,visible:view!=="side"},"knee-left":{x:825,y:900,visible:true},"ankle-left":{x:780,y:965,visible:true},"knee-right":{x:1100,y:910,visible:view!=="side"},"ankle-right":{x:1150,y:970,visible:view!=="side"}});
 if(pose==="sit")Object.assign(joints,{"elbow-left":{x:780,y:700,visible:true},"wrist-left":{x:875,y:755,visible:true},"elbow-right":{x:1140,y:700,visible:view!=="side"},"wrist-right":{x:1045,y:755,visible:view!=="side"},"hip-left":{x:850,y:805,visible:true},"knee-left":{x:760,y:850,visible:true},"ankle-left":{x:720,y:930,visible:true},"hip-right":{x:1070,y:805,visible:view!=="side"},"knee-right":{x:1160,y:850,visible:view!=="side"},"ankle-right":{x:1200,y:930,visible:view!=="side"}});
 model.rig={version:1,joints,bones:NORI_RIG_BONES.map(bone=>({...bone}))};
 model.id="nori-"+view+"-"+pose+"-"+expression;
 model.name="Nori — "+view+" / "+pose+" / "+expression;
 return model;
}


export function applyNoriPalette(model,overrides={}){
 const source=validateCharacterModel(model);
 const next=JSON.parse(JSON.stringify(source));
 const palette={
  line:safeColor(overrides.line,next.palette.line),
  skin:safeColor(overrides.skin,next.palette.skin),
  hair:safeColor(overrides.hair,next.palette.hair),
  cloth:safeColor(overrides.cloth,next.palette.cloth),
  accent:safeColor(overrides.accent,next.palette.accent)
 };
 for(const item of next.parts){
  if(item.id==="body")item.path.fill=palette.cloth;
  else if(["head","neck","hand-right"].includes(item.id))item.path.fill=palette.skin;
  else if(item.id==="hair")item.path.fill=palette.hair;
  else if(item.id==="mouth")item.path.stroke=palette.accent;
  else if(item.path.stroke!=="none")item.path.stroke=palette.line;
  if(["eye-left","eye-right"].includes(item.id))item.path.fill=palette.line;
 }
 next.palette=palette;
 next.id=String(next.id)+"-palette";
 return validateCharacterModel(next);
}

export function validateCharacterModel(model){
 if(!model||model.format!=="zero-character-model"||model.version!==CHARACTER_MODEL_VERSION)throw Error("صيغة نموذج الشخصية غير مدعومة");
 if(typeof model.id!=="string"||!model.id.trim()||typeof model.name!=="string"||!model.name.trim())throw Error("هوية نموذج الشخصية غير صالحة");
 if(!Array.isArray(model.parts)||!model.parts.length||model.parts.length>200)throw Error("أجزاء نموذج الشخصية غير صالحة");
 if(!model.parts.some(p=>p?.visible!==false))throw Error("يجب أن يحتوي النموذج على جزء ظاهر واحد على الأقل");
 const ids=new Set();
 const parts=model.parts.map(p=>{
  if(!p||typeof p.id!=="string"||!p.id.trim()||ids.has(p.id))throw Error("معرّف جزء الشخصية مكرر أو غير صالح");
  ids.add(p.id);
  if(typeof p.name!=="string"||typeof p.layer!=="string"||!p.layer.trim())throw Error("بيانات جزء الشخصية غير مكتملة");
  if(p.visible!==undefined&&typeof p.visible!=="boolean")throw Error("حالة ظهور جزء الشخصية غير صالحة");
  return {...p,path:validatePath(p.path)};
 });

 let rig;
 if(model.rig!==undefined){
  if(!model.rig||model.rig.version!==1||!model.rig.joints||typeof model.rig.joints!=="object")throw Error("هيكل مفاصل الشخصية غير صالح");
  rig={...model.rig,joints:{...model.rig.joints}};
  const legacyDefaults={"torso-center":{x:960,y:700,visible:true},"head-center":{x:960,y:390,visible:true}};
  for(const key of NORI_JOINT_KEYS){
   if(!rig.joints[key]&&legacyDefaults[key])rig.joints[key]={...legacyDefaults[key]};
   const joint=rig.joints[key];
   if(!joint||!Number.isFinite(joint.x)||!Number.isFinite(joint.y)||joint.x<0||joint.x>1920||joint.y<0||joint.y>1080||typeof joint.visible!=="boolean")throw Error("بيانات مفصل الشخصية غير صالحة: "+key);
  }
  if(rig.headRotation===undefined)rig.headRotation=0;\n  if(!Number.isFinite(rig.headRotation)||rig.headRotation< -60||rig.headRotation>60)throw Error("زاوية دوران الرأس غير صالحة");\n  if(!Array.isArray(rig.bones)||rig.bones.length!==NORI_RIG_BONES.length)throw Error("عظام الشخصية غير صالحة");
  for(let i=0;i<NORI_RIG_BONES.length;i++){
   const actual=rig.bones[i],expected=NORI_RIG_BONES[i];
   if(!actual||actual.id!==expected.id||actual.from!==expected.from||actual.through!==expected.through||actual.to!==expected.to||actual.partId!==expected.partId)throw Error("توصيل عظام الشخصية غير صالح");
  }
 }
 const canvas=model.canvas||{};
 if(canvas.width!==1920||canvas.height!==1080)throw Error("أبعاد نموذج الشخصية يجب أن تكون 1920×1080");
 return {...model,parts,...(rig?{rig}:{})};
}


export function applyNoriRigPose(model,jointUpdates={}){
 const safe=validateCharacterModel(model);
 if(!safe.rig)throw Error("هذا النموذج لا يحتوي على هيكل مفاصل قابل للتحريك");
 const next=JSON.parse(JSON.stringify(safe)),previous=safe.rig.joints;
 for(const [key,value] of Object.entries(jointUpdates)){
  if(!NORI_JOINT_KEYS.includes(key)||!value||!Number.isFinite(value.x)||!Number.isFinite(value.y))throw Error("تعديل مفصل غير صالح");
  next.rig.joints[key]={...next.rig.joints[key],x:Math.max(0,Math.min(1920,value.x)),y:Math.max(0,Math.min(1080,value.y))};
 }
 const torsoDelta={x:next.rig.joints["torso-center"].x-previous["torso-center"].x,y:next.rig.joints["torso-center"].y-previous["torso-center"].y};
 const moved=(torsoDelta.x!==0||torsoDelta.y!==0);
 if(moved){
  for(const key of NORI_JOINT_KEYS){
   if(key==="torso-center"||Object.prototype.hasOwnProperty.call(jointUpdates,key))continue;
   next.rig.joints[key]={...next.rig.joints[key],x:Math.max(0,Math.min(1920,next.rig.joints[key].x+torsoDelta.x)),y:Math.max(0,Math.min(1080,next.rig.joints[key].y+torsoDelta.y))};
  }
  for(const id of ["body","neck"]){const item=next.parts.find(part=>part.id===id);if(item)item.path.d=translatePathData(item.path.d,torsoDelta.x,torsoDelta.y)}
 }
 const headDelta={x:next.rig.joints["head-center"].x-previous["head-center"].x,y:next.rig.joints["head-center"].y-previous["head-center"].y};
 if(headDelta.x!==0||headDelta.y!==0){
  for(const id of ["head","hair","eye-left","eye-right","mouth"]){const item=next.parts.find(part=>part.id===id);if(item)item.path.d=translatePathData(item.path.d,headDelta.x,headDelta.y)}
 }
 const fmt=n=>Number(n.toFixed(1)).toString();
 for(const bone of NORI_RIG_BONES){
  const start=next.rig.joints[bone.from],middle=next.rig.joints[bone.through],end=next.rig.joints[bone.to];
  const partItem=next.parts.find(item=>item.id===bone.partId);
  if(!partItem||partItem.visible===false)continue;
  const control={x:2*middle.x-(start.x+end.x)/2,y:2*middle.y-(start.y+end.y)/2};
  partItem.path.d="M "+fmt(start.x)+" "+fmt(start.y)+" Q "+fmt(control.x)+" "+fmt(control.y)+" "+fmt(end.x)+" "+fmt(end.y);
 }
 const hand=next.parts.find(item=>item.id==="hand-right"),wrist=next.rig.joints["wrist-right"];
 if(hand&&hand.visible!==false&&wrist.visible!==false){
  const x=wrist.x,y=wrist.y;
  hand.path.d="M "+fmt(x-18)+" "+fmt(y-5)+" C "+fmt(x-34)+" "+fmt(y-18)+" "+fmt(x-16)+" "+fmt(y-36)+" "+fmt(x-2)+" "+fmt(y-18)+" C "+fmt(x+5)+" "+fmt(y-40)+" "+fmt(x+22)+" "+fmt(y-27)+" "+fmt(x+12)+" "+fmt(y-7)+" Q "+fmt(x+31)+" "+fmt(y+3)+" "+fmt(x+14)+" "+fmt(y+18)+" Q "+fmt(x)+" "+fmt(y+25)+" "+fmt(x-18)+" "+fmt(y+10)+" Z";
 }
 return validateCharacterModel(next);
}



export function rotateNoriHead(model,angleDegrees){
 const safe=validateCharacterModel(model);
 if(!safe.rig)throw Error("هذا النموذج لا يحتوي على هيكل مفاصل قابل للتحريك");
 if(!Number.isFinite(angleDegrees)||angleDegrees< -60||angleDegrees>60)throw Error("زاوية الرأس يجب أن تكون بين -60 و60 درجة");
 const next=JSON.parse(JSON.stringify(safe)),delta=angleDegrees-safe.rig.headRotation,pivot=next.rig.joints["head-center"];
 if(delta!==0){
  for(const id of ["head","hair","eye-left","eye-right","mouth"]){
   const item=next.parts.find(part=>part.id===id);
   if(item)item.path.d=rotatePathData(item.path.d,delta,pivot.x,pivot.y);
  }
 }
 next.rig.headRotation=angleDegrees;
 return validateCharacterModel(next);
}

export function solveNoriRigJoint(model,jointKey,target){
 const safe=validateCharacterModel(model);
 if(!safe.rig)throw Error("هذا النموذج لا يحتوي على هيكل مفاصل قابل للتحريك");
 if(!NORI_JOINT_KEYS.includes(jointKey)||!target||!Number.isFinite(target.x)||!Number.isFinite(target.y))throw Error("هدف المفصل غير صالح");
 const bounded={x:Math.max(0,Math.min(1920,target.x)),y:Math.max(0,Math.min(1080,target.y))};
 if(jointKey==="torso-center"||jointKey==="head-center")return applyNoriRigPose(safe,{[jointKey]:bounded});
 const bone=NORI_RIG_BONES.find(item=>[item.from,item.through,item.to].includes(jointKey));
 if(!bone)throw Error("المفصل غير مرتبط بعظمة");
 const next=JSON.parse(JSON.stringify(safe)),joints=next.rig.joints;
 const start=joints[bone.from],middle=joints[bone.through],end=joints[bone.to];
 const distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
 const unit=(a,b,fallback)=>{const d=distance(a,b);return d<1e-6?fallback:{x:(b.x-a.x)/d,y:(b.y-a.y)/d}};
 const updates={};
 if(jointKey===bone.from){
  const dx=bounded.x-start.x,dy=bounded.y-start.y;
  updates[bone.from]=bounded;
  updates[bone.through]={x:middle.x+dx,y:middle.y+dy};
  updates[bone.to]={x:end.x+dx,y:end.y+dy};
 }else if(jointKey===bone.through){
  const upper=distance(start,middle),lower=distance(middle,end);
  const direction=unit(start,bounded,unit(start,middle,{x:1,y:0}));
  const constrained={x:start.x+direction.x*upper,y:start.y+direction.y*upper};
  const distal=unit(middle,end,{x:0,y:1});
  updates[bone.through]=constrained;
  updates[bone.to]={x:constrained.x+distal.x*lower,y:constrained.y+distal.y*lower};
 }else{
  const upper=distance(start,middle),lower=distance(middle,end);
  const raw={x:Math.max(0,Math.min(1920,bounded.x)),y:Math.max(0,Math.min(1080,bounded.y))};
  const total=upper+lower;
  const minReach=Math.sqrt(Math.max(0,upper*upper+lower*lower-2*upper*lower*Math.cos(20*Math.PI/180)));
  const maxReach=Math.sqrt(Math.max(0,upper*upper+lower*lower-2*upper*lower*Math.cos(160*Math.PI/180)));
  let vector={x:raw.x-start.x,y:raw.y-start.y},reach=Math.hypot(vector.x,vector.y);
  if(reach<1e-6){vector={x:end.x-start.x,y:end.y-start.y};reach=Math.hypot(vector.x,vector.y)||1}
  const clampedReach=Math.max(minReach,Math.min(maxReach,reach));
  const ux=vector.x/reach,uy=vector.y/reach;
  const endpoint={x:Math.max(0,Math.min(1920,start.x+ux*clampedReach)),y:Math.max(0,Math.min(1080,start.y+uy*clampedReach))};
  const cross=(middle.x-start.x)*(end.y-start.y)-(middle.y-start.y)*(end.x-start.x);
  const side=cross<0?-1:1;
  const along=(upper*upper-lower*lower+clampedReach*clampedReach)/(2*clampedReach);
  const height=Math.sqrt(Math.max(0,upper*upper-along*along));
  const perpendicular={x:-uy*side,y:ux*side};
  updates[bone.through]={x:start.x+ux*along+perpendicular.x*height,y:start.y+uy*along+perpendicular.y*height};
  updates[bone.to]=endpoint;
 }
 return applyNoriRigPose(next,updates);
}


export function interpolateNoriRigModels(startModel,endModel,t){
 if(!Number.isFinite(t)||t<0||t>1)throw Error("نسبة انتقال الوضعية يجب أن تكون بين صفر وواحد");
 const rawStart=validateCharacterModel(startModel),rawEnd=validateCharacterModel(endModel);
 if(!rawStart.rig||!rawEnd.rig)throw Error("يجب أن يحتوي نموذجا البداية والنهاية على هيكل مفاصل");
 const start=applyNoriRigPose(rawStart,rawStart.rig.joints),end=applyNoriRigPose(rawEnd,rawEnd.rig.joints);
 if(start.view!==end.view)throw Error("يجب أن تتطابق زاوية العرض بين الوضعيتين");
 if(start.parts.length!==end.parts.length)throw Error("عدد أجزاء الشخصيتين غير متطابق");
 const next=JSON.parse(JSON.stringify(start)),lerp=(a,b)=>Number((a+(b-a)*t).toFixed(3));
 for(let i=0;i<start.parts.length;i++){
  const a=start.parts[i],b=end.parts[i];
  if(a.id!==b.id||a.layer!==b.layer||a.visible!==b.visible)throw Error("ترتيب أجزاء الشخصية أو ظهورها غير متطابق");
  if(a.path.stroke!==b.path.stroke||a.path.fill!==b.path.fill)throw Error("ألوان أجزاء الشخصية غير متطابقة");
  next.parts[i].path.d=interpolatePathData(a.path.d,b.path.d,t);
  next.parts[i].path.width=lerp(a.path.width,b.path.width);
 }
 const updates={};
 for(const key of NORI_JOINT_KEYS){
  const a=start.rig.joints[key],b=end.rig.joints[key];
  if(a.visible!==b.visible)throw Error("ظهور المفاصل غير متطابق");
  updates[key]={x:lerp(a.x,b.x),y:lerp(a.y,b.y)};
 }
 let result=applyNoriRigPose(next,updates);
 for(const bone of NORI_RIG_BONES){
  const endpoint=result.rig.joints[bone.to];
  result=solveNoriRigJoint(result,bone.to,{x:endpoint.x,y:endpoint.y});
 }
 result.rig.headRotation=lerp(start.rig.headRotation,end.rig.headRotation);\n result.id="nori-interpolated-"+start.id+"-"+end.id+"-"+String(t);
 result.name="وضعية وسيطة: "+start.name+" → "+end.name;
 result.pose="interpolated";
 result.expression="interpolated";
 return validateCharacterModel(result);
}

export function addCharacterModelToFrame(frame,model,options={}){
 const safe=validateCharacterModel(model),groups=new Map();
 if(!frame||!Array.isArray(frame.layers))throw Error("إطار الشخصية غير صالح");
 const instanceId=options.instanceId===undefined?uid("character-instance"):String(options.instanceId);
 if(!instanceId.trim()||instanceId.length>120)throw Error("معرّف مثيل الشخصية غير صالح");
 for(const item of safe.parts){
  if(item.visible===false)continue;
  if(!groups.has(item.layer))groups.set(item.layer,{layer:createLayer(item.layer),partIds:[]});
  const group=groups.get(item.layer);
  appendOperation(group.layer,"stroke",item.path);
  group.partIds.push(item.id);
 }
 if(frame.layers.length+groups.size>100)throw Error("تجاوزت طبقات الإطار الحد الأقصى بعد إضافة الشخصية");
 const added=[...groups.values()].map(group=>{
  group.layer.characterInstance={id:instanceId,modelId:safe.id,name:safe.name,partIds:group.partIds};
  return group.layer;
 });
 frame.layers.push(...added);
 return added;
}


export function createCharacterModelFromFrame(frame,name="شخصية مرسومة"){
 if(!frame||!Array.isArray(frame.layers))throw Error("إطار الرسم غير صالح");
 const label=String(name??"").trim().slice(0,100);
 if(!label)throw Error("اسم الشخصية لا يمكن أن يكون فارغاً");
 const parts=[];
 for(const layer of frame.layers){
  if(layer.visible===false)continue;
  for(const operation of layer.operations||[]){
   if(operation.kind==="erase")throw Error("أزل عمليات الممحاة أو ادمجها قبل تحويل الإطار إلى نموذج شخصية");
   if(operation.kind!=="stroke")continue;
   parts.push({id:uid("part"),name:"رسم "+(parts.length+1),layer:layer.name,visible:true,path:validatePath(operation.path)});
   if(parts.length>200)throw Error("نموذج الشخصية يتجاوز 200 جزء متجهي");
  }
 }
 if(!parts.length)throw Error("لا توجد رسومات متجهية ظاهرة في الإطار الحالي");
 const model={format:"zero-character-model",version:CHARACTER_MODEL_VERSION,id:uid("character"),name:label,canvas:{width:1920,height:1080},guide:{view:"custom",pose:"custom"},view:"custom",pose:"custom",expression:"custom",palette:{},parts};
 return validateCharacterModel(model);
}

export function copyCharacterInstanceToFrame(sourceFrame,targetFrame,instanceId){
 if(!sourceFrame||!targetFrame||sourceFrame===targetFrame||!Array.isArray(sourceFrame.layers)||!Array.isArray(targetFrame.layers))throw Error("إطارات نسخ الشخصية غير صالحة");
 const source=sourceFrame.layers.filter(layer=>layer.characterInstance?.id===instanceId);
 if(!source.length)throw Error("مثيل الشخصية غير موجود في إطار المصدر");
 if(targetFrame.layers.some(layer=>layer.characterInstance?.id===instanceId))throw Error("هذا المثيل موجود بالفعل في الإطار الهدف");
 if(targetFrame.layers.length+source.length>100)throw Error("لا توجد مساحة كافية لنسخ طبقات الشخصية");
 const copies=source.map(layer=>{
  const copy=JSON.parse(JSON.stringify(layer));copy.id=uid("layer");
  copy.operations=copy.operations.map(operation=>({...operation,id:uid("op"),path:{...operation.path}}));
  return copy;
 });
 targetFrame.layers.push(...copies);
 return copies;
}

export function replaceCharacterInstanceInFrame(frame,instanceId,model){
 if(!frame||!Array.isArray(frame.layers))throw Error("إطار الشخصية غير صالح");
 const indices=frame.layers.map((layer,index)=>layer.characterInstance?.id===instanceId?index:-1).filter(index=>index>=0);
 if(!indices.length)throw Error("مثيل الشخصية غير موجود في الإطار");
 if(indices.some(index=>frame.layers[index].locked))throw Error("إحدى طبقات الشخصية مقفلة؛ افتحها قبل التحديث");
 const first=indices[0],safe=validateCharacterModel(model),existing=new Set(indices);
 const retained=frame.layers.filter((layer,index)=>!existing.has(index));
 const needed=new Set(safe.parts.filter(part=>part.visible!==false).map(part=>part.layer)).size;
 if(retained.length+needed>100)throw Error("لا توجد مساحة كافية لتحديث الشخصية");
 frame.layers=retained;
 const appended=addCharacterModelToFrame(frame,safe,{instanceId});
 const replacement=frame.layers.splice(frame.layers.length-appended.length,appended.length);
 frame.layers.splice(Math.min(first,frame.layers.length),0,...replacement);
 return replacement;
}

const escapeXml=value=>String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
export function createNoriModelSheetSvg(paletteOverrides={}){
 const views=[
  {title:"Turnaround · Front",model:createNoriModel("neutral","front","neutral")},
  {title:"Turnaround · Side",model:createNoriModel("neutral","side","neutral")},
  {title:"Turnaround · Back",model:createNoriModel("neutral","back","neutral")}
 ];
 const expressions=NORI_EXPRESSIONS.map(expression=>({title:"Expression · "+expression,model:createNoriModel(expression,"front","neutral")}));
 const poses=NORI_POSES.map(pose=>({title:"Pose · "+pose,model:createNoriModel("neutral","front",pose)}));
 const entries=[...views,...expressions,...poses].map(item=>({...item,model:applyNoriPalette(item.model,paletteOverrides)}));
 const cellW=600,cellH=560,width=cellW*4,height=cellH*3;
 const cells=entries.map((entry,index)=>{
  const row=index<3?0:index<7?1:2,col=index<3?index:index<7?index-3:index-7;
  const x=col*cellW,y=row*cellH;
  const frame=createFrame();addCharacterModelToFrame(frame,entry.model);
  const svg=frameSvg(frame,"nori-sheet-"+index),inner=svg.slice(svg.indexOf(">")+1,svg.lastIndexOf("</svg>"));
  const label=escapeXml(entry.title);
  const guide='<g data-proportion-guides="'+index+'" fill="none" stroke="#93c5fd" stroke-width="2" stroke-dasharray="7 7" opacity=".75"><line x1="'+(x+cellW/2)+'" y1="'+(y+64)+'" x2="'+(x+cellW/2)+'" y2="'+(y+cellH-24)+'"/><line x1="'+(x+28)+'" y1="'+(y+227)+'" x2="'+(x+cellW-28)+'" y2="'+(y+227)+'"/><line x1="'+(x+28)+'" y1="'+(y+326)+'" x2="'+(x+cellW-28)+'" y2="'+(y+326)+'"/><line x1="'+(x+28)+'" y1="'+(y+441)+'" x2="'+(x+cellW-28)+'" y2="'+(y+441)+'"/><line x1="'+(x+28)+'" y1="'+(y+518)+'" x2="'+(x+cellW-28)+'" y2="'+(y+518)+'"/></g>';
  return '<g data-character-cell="'+index+'"><rect x="'+(x+8)+'" y="'+(y+8)+'" width="'+(cellW-16)+'" height="'+(cellH-16)+'" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/><text x="'+(x+26)+'" y="'+(y+42)+'" font-size="24" font-family="sans-serif" fill="#172033">'+label+'</text>'+guide+'<g transform="translate('+(x+cellW/2)+' '+(y+cellH/2+12)+') scale(.48) translate(-960 -540)">'+inner+'</g></g>';
 }).join("");
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'"><rect width="100%" height="100%" fill="#e2e8f0"/>'+cells+'</svg>';
}
