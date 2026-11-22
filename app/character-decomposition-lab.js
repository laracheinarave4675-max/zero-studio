
import {createProject,normalizeProject} from "./engine.mjs";
import {createCharacterDecomposition,auditCharacterDecomposition,approveOcclusionRepair,createCharacterRig,sampleCharacterRig,compositeCharacterDecomposition,validateCharacterDecomposition} from "./character-decomposition.mjs";
const $=id=>document.getElementById(id),sourceCanvas=$("sourceCanvas"),ctx=sourceCanvas.getContext("2d",{willReadFrequently:true}),preview=$("previewCanvas"),pctx=preview.getContext("2d");
let project=createProject("تفكيك شخصية أنمي"),imageData=null,owner=null,parts=[],activePart=0,mode="partition",repairMask=null,repairPixels=null,currentRepair=null,repairs=[],decomposition=null,rig=null,sourceImage=null;
const colors=["#47b5a6","#df9b54","#8b9fe2","#d77ea6","#a4bd69","#b38bd8","#e0c5a0","#67a9d9"];
function status(id,message){$(id).textContent=message}
function setEnabled(id,value){$(id).disabled=!value}
function refreshParts(){
 $("partSelect").replaceChildren();$("occluderSelect").replaceChildren();
 parts.forEach((part,i)=>{const option=document.createElement("option");option.value=String(i);option.textContent=part.name;$("partSelect").append(option);const oc=document.createElement("option");oc.value=part.id;oc.textContent=part.name;$("occluderSelect").append(oc)});
 $("partSelect").value=String(activePart);$("occluderSelect").value=parts[Math.min(activePart,parts.length-1)]?.id||"";
 $("partsList").replaceChildren();
 parts.forEach((part,i)=>{const row=document.createElement("div");row.className="part";const label=document.createElement("span");label.textContent=part.name+" · "+part.role;const count=document.createElement("small");count.textContent=part.count+" px";const lock=document.createElement("label");const check=document.createElement("input");check.type="checkbox";check.checked=part.movable;check.addEventListener("change",()=>{part.movable=check.checked});lock.append(check,document.createTextNode(" السماح بالحركة"));row.append(label,count,lock);$("partsList").append(row)});
}
function drawOverlay(){
 if(!imageData)return;ctx.putImageData(imageData,0,0);
 const overlayCanvas=document.createElement("canvas");overlayCanvas.width=sourceCanvas.width;overlayCanvas.height=sourceCanvas.height;
 const overlayCtx=overlayCanvas.getContext("2d"),tint=overlayCtx.createImageData(sourceCanvas.width,sourceCanvas.height);
 for(let i=0;i<owner.length;i++){const k=owner[i];if(k===255)continue;const c=colors[k%colors.length],o=i*4;tint.data[o]=parseInt(c.slice(1,3),16);tint.data[o+1]=parseInt(c.slice(3,5),16);tint.data[o+2]=parseInt(c.slice(5,7),16);tint.data[o+3]=mode==="repair"&&repairMask?.[i]?170:65}
 overlayCtx.putImageData(tint,0,0);ctx.save();ctx.globalAlpha=.8;ctx.drawImage(overlayCanvas,0,0);ctx.restore();
}
function loadImage(file){
 const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{const w=img.naturalWidth,h=img.naturalHeight;if(w*h>16000000){status("sourceStatus","الصورة أكبر من 16 ميغابكسل.");URL.revokeObjectURL(url);return}
 sourceCanvas.width=preview.width=w;sourceCanvas.height=preview.height=h;ctx.clearRect(0,0,w,h);ctx.drawImage(img,0,0);imageData=ctx.getImageData(0,0,w,h);owner=new Uint8Array(w*h);for(let i=0;i<owner.length;i++)owner[i]=imageData.data[i*4+3]?0:255;
 parts=[{id:"base-artwork",name:"الأصل / الخلفية",role:"base",count:owner.reduce((a,v)=>a+(v===0),0),movable:false}];activePart=0;repairMask=new Uint8Array(w*h);repairPixels=new Uint8Array(w*h*4);currentRepair=null;repairs=[];decomposition=null;rig=null;sourceImage=img;
 refreshParts();drawOverlay();status("sourceStatus",w+" × "+h+" — تم تحميل المرجع محلياً. بكسلات الأصل محفوظة.");setEnabled("buildDecompositionBtn",true);setEnabled("saveProjectBtn",false);setEnabled("exportLayersBtn",false);setEnabled("buildRigBtn",false);setEnabled("motionScrub",false);URL.revokeObjectURL(url)};
 img.onerror=()=>{status("sourceStatus","تعذر قراءة الصورة.");URL.revokeObjectURL(url)};img.src=url;
}
$("projectFile").addEventListener("change",async e=>{const f=e.target.files?.[0];if(!f)return;try{project=normalizeProject(JSON.parse(await f.text()));status("sourceStatus","تم فتح مشروع "+project.name+"؛ سيتم حفظ التفكيك داخله.")}catch(err){status("sourceStatus","تعذر فتح المشروع: "+err.message)}});
$("sourceFile").addEventListener("change",e=>{const f=e.target.files?.[0];if(f)loadImage(f)});
$("addPartBtn").onclick=()=>{if(!imageData)return;const name=$("partName").value.trim(),role=$("partRole").value.trim();if(!name||!role)return status("decomposeStatus","أدخل اسم الجزء ودوره.");parts.push({id:"part-"+(parts.length+1),name,role,count:0,movable:false});activePart=parts.length-1;refreshParts();drawOverlay()};
$("partSelect").onchange=()=>{activePart=Number($("partSelect").value)||0};
$("partitionModeBtn").onclick=()=>{mode="partition";status("decomposeStatus","وضع التقسيم: ارسم فوق الجزء الذي تريد فصله.")};
$("repairModeBtn").onclick=()=>{mode="repair";status("decomposeStatus","وضع الإصلاح: ارسم بكسلات المنطقة المخفية بلون الإصلاح المختار.")};
$("startRepairBtn").onclick=()=>{if(!imageData)return;repairMask.fill(0);repairPixels.fill(0);currentRepair={id:"repair-"+Date.now().toString(36),name:$("repairName").value.trim()||"منطقة مخفية",method:"manual-paint",occludedByPartId:$("occluderSelect").value,reviewStatus:"pending"};decomposition=null;rig=null;setEnabled("buildRigBtn",false);setEnabled("saveProjectBtn",false);setEnabled("exportLayersBtn",false);setEnabled("motionScrub",false);mode="repair";setEnabled("approveRepairBtn",false);status("repairStatus","ارسم منطقة الإصلاح يدوياً، ثم أعد بناء التفكيك واعتمدها.")};
function paint(event){
 if(!imageData)return;const rect=sourceCanvas.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width*sourceCanvas.width,y=(event.clientY-rect.top)/rect.height*sourceCanvas.height,r=Number($("brushSize").value)/2;
 const x0=Math.max(0,Math.floor(x-r)),x1=Math.min(sourceCanvas.width-1,Math.ceil(x+r)),y0=Math.max(0,Math.floor(y-r)),y1=Math.min(sourceCanvas.height-1,Math.ceil(y+r));
 if(mode==="partition"){if(decomposition){decomposition=null;rig=null;setEnabled("buildRigBtn",false);setEnabled("saveProjectBtn",false);setEnabled("exportLayersBtn",false);setEnabled("motionScrub",false)}for(let yy=y0;yy<=y1;yy++)for(let xx=x0;xx<=x1;xx++)if((xx-x)**2+(yy-y)**2<=r*r){const i=yy*sourceCanvas.width+xx;if(imageData.data[i*4+3])owner[i]=activePart}}
 else if(currentRepair){const c=$("repairColor").value;const rgba=[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16),255];for(let yy=y0;yy<=y1;yy++)for(let xx=x0;xx<=x1;xx++)if((xx-x)**2+(yy-y)**2<=r*r){const i=yy*sourceCanvas.width+xx;repairMask[i]=255;repairPixels.set(rgba,i*4)}setEnabled("approveRepairBtn",true)}
 drawOverlay();
}
let drawing=false;sourceCanvas.addEventListener("pointerdown",e=>{drawing=true;sourceCanvas.setPointerCapture(e.pointerId);paint(e)});sourceCanvas.addEventListener("pointermove",e=>{if(drawing)paint(e)});sourceCanvas.addEventListener("pointerup",()=>{drawing=false});sourceCanvas.addEventListener("pointercancel",()=>{drawing=false});
$("approveRepairBtn").onclick=()=>{if(!currentRepair||!repairMask.some(v=>v))return;if(!decomposition)return status("repairStatus","أعد بناء التفكيك بعد رسم الإصلاح أولاً.");const repair=decomposition.occlusionRepairs.find(r=>r.id===currentRepair.id);if(!repair)return status("repairStatus","أعد بناء التفكيك لإضافة منطقة الإصلاح الحالية.");try{approveOcclusionRepair(decomposition,currentRepair.id);repairs.push({...currentRepair,mask:repairMask.slice(),pixels:repairPixels.slice(),reviewStatus:"approved"});status("repairStatus","تم اعتماد الإصلاح؛ سيظهر أسفل الجزء الحاجب "+repair.occludedByPartId+". يمكنك بدء منطقة إصلاح أخرى.");renderPreview(Number($("motionScrub").value)/100);currentRepair=null;setEnabled("approveRepairBtn",false)}catch(err){status("repairStatus","تعذر اعتماد الإصلاح: "+err.message)}};
$("buildDecompositionBtn").onclick=()=>{
 try{
  const active=parts.map((part,index)=>({...part,index})).filter(part=>owner.some(v=>v===part.index));
  if(active.length<2)throw Error("افصل جزءاً واحداً على الأقل عن الطبقة الأساسية.");
  const partInputs=active.map(part=>{const mask=new Uint8Array(owner.length);for(let i=0;i<owner.length;i++)if(owner[i]===part.index)mask[i]=255;return{id:part.id,name:part.name,role:part.role,order:part.index,identityLocked:true,mask}});
  const repairInputs=[...repairs,...(currentRepair&&repairMask.some(v=>v)?[{...currentRepair,mask:repairMask,pixels:repairPixels}]:[])];
  decomposition=createCharacterDecomposition({characterAssetId:"be172712-e073-4d06-9587-eec7e6c62a84",source:{width:sourceCanvas.width,height:sourceCanvas.height,data:imageData.data},parts:partInputs,occlusionRegions:repairInputs,sourceLabel:"Approved kimono model sheet"});
  const audit=auditCharacterDecomposition(decomposition);status("qualityStatus","تطابق المصدر: "+audit.sourceCompositeExact+"\nالقنوات المختلفة: "+audit.mismatchedChannels+"\nالأجزاء: "+audit.partCount+"\nإصلاحات المناطق المخفية: "+audit.occlusionRepairCount+"\nجاهز للحركة: "+audit.readyForLayerMotion+"\nالبصمة: "+audit.sourceHash);
  setEnabled("buildRigBtn",true);setEnabled("saveProjectBtn",true);setEnabled("exportLayersBtn",true);renderPreview(0);
 }catch(err){status("qualityStatus","فشل بناء التفكيك: "+err.message);setEnabled("buildRigBtn",false)}
};
function partCanvas(part){const c=document.createElement("canvas");c.width=part.bounds.width;c.height=part.bounds.height;const cctx=c.getContext("2d"),id=cctx.createImageData(c.width,c.height);for(let i=0;i<part.mask.length;i++)if(part.mask[i])id.data.set(part.pixels.slice(i*4,i*4+4),i*4);cctx.putImageData(id,0,0);return c}
function renderPreview(t){
 if(!decomposition)return;const w=decomposition.width,h=decomposition.height;preview.width=w;preview.height=h;pctx.clearRect(0,0,w,h);
 const canvases=new Map(decomposition.parts.map(part=>[part.id,partCanvas(part)]));
 const repairCanvases=new Map(decomposition.occlusionRepairs.map(r=>[r.id,partCanvas(r)]));
 const pose={};if(rig)for(const node of rig.nodes){const part=decomposition.parts.find(p=>p.id===node.partId);if(!part||node.identityLocked)continue;const wave=Math.sin(t*Math.PI*2);pose[node.id]=part.role.includes("hair")?{rotation:wave*.018}:part.role.includes("sleeve")?{rotation:-wave*.012}:part.role.includes("torso")?{translateY:wave*1.5,scaleY:1.002}:{}}
 const transforms=rig?sampleCharacterRig(rig,pose).transforms:{};
 const parts=[...decomposition.parts].sort((a,b)=>a.order-b.order);
 for(const part of parts){
  for(const repair of decomposition.occlusionRepairs)if(repair.reviewStatus==="approved"&&repair.occludedByPartId===part.id){const c=repairCanvases.get(repair.id);pctx.drawImage(c,repair.bounds.x,repair.bounds.y)}
  const c=canvases.get(part.id);if(!c||!part.visible)continue;const node=rig?.nodes.find(n=>n.partId===part.id),tr=node?transforms[node.id]:null;
  if(tr){const px=(part.bounds.x+part.bounds.width*tr.pivot.x),py=(part.bounds.y+part.bounds.height*tr.pivot.y);pctx.save();pctx.translate(px+tr.translateX,py+tr.translateY);pctx.rotate(tr.rotation);pctx.scale(tr.scaleX,tr.scaleY);pctx.translate(-px,-py);pctx.globalAlpha=tr.opacity;pctx.drawImage(c,part.bounds.x,part.bounds.y);pctx.restore()}else pctx.drawImage(c,part.bounds.x,part.bounds.y);
 }
}
$("buildRigBtn").onclick=()=>{
 try{
  const nodes=decomposition.parts.map(part=>{const ui=parts.find(p=>p.id===part.id),repair=decomposition.occlusionRepairs.find(r=>r.occludedByPartId===part.id&&r.reviewStatus==="approved");const identityCritical=/face|eye|mouth|nose|brow|iris|pupil|skin/i.test(part.role);const movable=!!ui?.movable&&!!repair&&!identityCritical;return{id:"rig-"+part.id,partId:part.id,identityLocked:!movable,repairIds:movable?[repair.id]:[],pivot:{x:.5,y:.5}}});
  rig=createCharacterRig({decomposition,nodes});setEnabled("motionScrub",true);renderPreview(Number($("motionScrub").value)/100);status("qualityStatus",$("qualityStatus").textContent+"\nهيكل التحريك صالح. الأجزاء المتحركة: "+rig.nodes.filter(n=>!n.identityLocked).length+"؛ الوجه والملامح مقفلة.");
 }catch(err){status("qualityStatus","تعذر إنشاء الهيكل: "+err.message)}
};
$("motionScrub").oninput=()=>renderPreview(Number($("motionScrub").value)/100);
$("saveProjectBtn").onclick=()=>{try{if(!decomposition)throw Error("لا يوجد تفكيك محفوظ");project.characterDecompositions=(project.characterDecompositions||[]).filter(x=>x.characterAssetId!==decomposition.characterAssetId);project.characterDecompositions.push(decomposition);if(rig){project.characterRigs=(project.characterRigs||[]).filter(x=>x.characterAssetId!==rig.characterAssetId);project.characterRigs.push(rig)}const normalized=normalizeProject(project);const blob=new Blob([JSON.stringify(normalized)],{type:"application/json"});download(blob,"zero-studio-character-decomposition.zero");status("qualityStatus","تم حفظ المشروع محلياً مع التفكيك والهيكل.");}catch(err){status("qualityStatus","تعذر الحفظ: "+err.message)}};
$("exportLayersBtn").onclick=()=>{if(!decomposition)return;const blob=new Blob([JSON.stringify(decomposition)],{type:"application/json"});download(blob,"character-decomposition.json")};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
