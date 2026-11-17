import {createLayer,appendOperation,validatePath} from "./engine.mjs";

export const CHARACTER_MODEL_VERSION=1;
const part=(id,name,layer,d,stroke,width=8,fill="none")=>({id,name,layer,path:{d,stroke,width,fill}});

// Original reusable vector study. Parts remain ordinary editable SVG paths.
export function createNoriModel(){
 return {
  format:"zero-character-model",version:CHARACTER_MODEL_VERSION,id:"nori-base",name:"Nori — نموذج الشخصية",
  canvas:{width:1920,height:1080},guide:{headRatio:0.34,bodyRatio:0.46,legRatio:0.20,view:"front"},
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
   part("leg-right","الساق اليمنى","الأطراف","M 1055 850 L 1070 1010","#263449",30,"none")
  ]
 };
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
  return {...p,path:validatePath(p.path)};
 });
 const canvas=model.canvas||{};
 if(canvas.width!==1920||canvas.height!==1080)throw Error("أبعاد نموذج الشخصية يجب أن تكون 1920×1080");
 return {...model,parts};
}

export function addCharacterModelToFrame(frame,model){
 const safe=validateCharacterModel(model),groups=new Map();
 for(const item of safe.parts){
  if(!groups.has(item.layer))groups.set(item.layer,createLayer(item.layer));
  appendOperation(groups.get(item.layer),"stroke",item.path);
 }
 const added=[...groups.values()];
 frame.layers.push(...added);
 return added;
}
