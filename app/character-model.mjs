import {createLayer,appendOperation,validatePath} from "./engine.mjs";

export const CHARACTER_MODEL_VERSION=1;
export const NORI_EXPRESSIONS=["neutral","happy","sad","surprised"];
export const NORI_VIEWS=["front","side","back"];
export const NORI_POSES=["neutral","wave","walk","sit"];
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
   part("leg-left","الساق اليسرى","الأطراف","M 865 850 L 850 1010","#263449",30,"none"),
   part("leg-right","الساق اليمنى","الأطراف","M 1055 850 L 1070 1010","#263449",30,"none"),
   part("hand-right","اليد اليمنى","الأطراف","M 1130 405 C 1100 390 1095 365 1110 350 C 1120 335 1135 345 1140 360 C 1145 335 1165 340 1165 360 C 1180 340 1195 355 1180 375 C 1200 370 1205 390 1185 405 Z","#263449",7,"#f4c7a1",false)
  ]
 };
 const face={
  neutral:{left:"M 855 405 Q 885 375 915 405 Q 885 435 855 405 Z",right:"M 1005 405 Q 1035 375 1065 405 Q 1035 435 1005 405 Z",mouth:"M 930 485 Q 960 510 990 485"},
  happy:{left:"M 855 420 Q 885 380 915 420",right:"M 1005 420 Q 1035 380 1065 420",mouth:"M 920 475 Q 960 545 1000 475"},
  sad:{left:"M 855 405 Q 885 435 915 405",right:"M 1005 405 Q 1035 435 1065 405",mouth:"M 925 510 Q 960 470 995 510"},
  surprised:{left:"M 870 405 A 15 25 0 1 0 900 405 A 15 25 0 1 0 870 405 Z",right:"M 1020 405 A 15 25 0 1 0 1050 405 A 15 25 0 1 0 1020 405 Z",mouth:"M 945 480 A 15 22 0 1 0 975 480 A 15 22 0 1 0 945 480 Z"}
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
 }else if(view==="back"){
  model.parts.find(p=>p.id==="hair").path.d="M 780 390 C 735 245 840 155 960 170 C 1090 145 1185 250 1140 405 L 1125 560 Q 960 635 795 560 Z";
  for(const id of ["eye-left","eye-right","mouth"])model.parts.find(p=>p.id===id).visible=false;
  model.parts.find(p=>p.id==="arm-left").path.d="M 820 610 Q 735 690 760 790";
  model.parts.find(p=>p.id==="arm-right").path.d="M 1100 610 Q 1185 690 1160 790";
 }
 if(pose==="wave"&&view!=="back"){
  const hand=model.parts.find(p=>p.id==="hand-right");hand.visible=true;
  model.parts.find(p=>p.id==="arm-right").path.d="M 1100 610 Q 1160 555 1130 430";
 }else if(pose==="walk"){
  model.parts.find(p=>p.id==="arm-left").path.d="M 820 610 Q 735 655 700 735";
  model.parts.find(p=>p.id==="arm-right").path.d="M 1100 610 Q 1185 665 1220 730";
  model.parts.find(p=>p.id==="leg-left").path.d="M 865 850 Q 825 900 780 965";
  model.parts.find(p=>p.id==="leg-right").path.d="M 1055 850 Q 1100 910 1150 970";
 }else if(pose==="sit"){
  model.parts.find(p=>p.id==="body").path.d="M 825 565 Q 960 520 1095 565 L 1125 805 Q 960 865 795 805 Z";
  model.parts.find(p=>p.id==="arm-left").path.d="M 820 610 Q 780 700 875 755";
  model.parts.find(p=>p.id==="arm-right").path.d="M 1100 610 Q 1140 700 1045 755";
  model.parts.find(p=>p.id==="leg-left").path.d="M 850 805 Q 760 850 720 930";
  model.parts.find(p=>p.id==="leg-right").path.d="M 1070 805 Q 1160 850 1200 930";
 }
 model.id="nori-"+view+"-"+pose+"-"+expression;
 model.name="Nori — "+view+" / "+pose+" / "+expression;
 return model;
}

export function validateCharacterModel(model){
 if(!model||model.format!=="zero-character-model"||model.version!==CHARACTER_MODEL_VERSION)throw Error("صيغة نموذج الشخصية غير مدعومة");
 if(typeof model.id!=="string"||!model.id.trim()||typeof model.name!=="string"||!model.name.trim())throw Error("هوية نموذج الشخصية غير صالحة");
 if(!Array.isArray(model.parts)||!model.parts.length||model.parts.length>200)throw Error("أجزاء نموذج الشخصية غير صالحة");
 const ids=new Set();
 const parts=model.parts.map(p=>{
  if(!p||typeof p.id!=="string"||!p.id.trim()||ids.has(p.id))throw Error("معرّف جزء الشخصية مكرر أو غير صالح");
  ids.add(p.id);
  if(typeof p.name!=="string"||typeof p.layer!=="string"||!p.layer.trim())throw Error("بيانات جزء الشخصية غير مكتملة");
  if(p.visible!==undefined&&typeof p.visible!=="boolean")throw Error("حالة ظهور جزء الشخصية غير صالحة");
  return {...p,path:validatePath(p.path)};
 });
 const canvas=model.canvas||{};
 if(canvas.width!==1920||canvas.height!==1080)throw Error("أبعاد نموذج الشخصية يجب أن تكون 1920×1080");
 return {...model,parts};
}

export function addCharacterModelToFrame(frame,model){
 const safe=validateCharacterModel(model),groups=new Map();
 for(const item of safe.parts){
  if(item.visible===false)continue;
  if(!groups.has(item.layer))groups.set(item.layer,createLayer(item.layer));
  appendOperation(groups.get(item.layer),"stroke",item.path);
 }
 const added=[...groups.values()];
 frame.layers.push(...added);
 return added;
}
