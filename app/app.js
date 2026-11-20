import{WIDTH,HEIGHT,MAX_FRAMES,createProject,createFrame,createLayer,normalizeProject,validatePath,appendOperation,removeOperation,translateOperation,updateOperation,duplicateOperation,addLayer,addRasterLayer,renameLayer,removeLayer,reorderLayer,frameSvg,renderLayerInto,pointsToPath,shapePath,pressureOutlinePath,createInbetweenFrames,analyzeDrawingCadence,getPathEditHandles,movePathAnchor,movePathControlPoint,uid}from"./engine.mjs";
import{createZip}from"./zip.mjs";
import{generateSceneProposal,generateMeshEnvironmentProposal,generateAnimeVectorBackground,reviewAnimeVectorPreview}from"./scene-production.mjs";
import{createAnimationPlan,beginAnimationProduction,createAnimationBatchPrompt,appendAnimationBatch}from"./animation-production.mjs";
import{captureFrameHistory,captureFrameHistoryAfter,applyFrameHistory}from"./frame-history.mjs";
import{createNoriModel,validateCharacterModel,addCharacterModelToFrame,applyNoriPalette,applyNoriRigPose,solveNoriRigJoint,interpolateNoriRigModels,NORI_JOINT_KEYS,NORI_RIG_BONES,createNoriModelSheetSvg,createCharacterModelFromFrame,rotateNoriHead,rotateNoriBody,copyCharacterInstanceToFrame,replaceCharacterInstanceInFrame}from"./character-model.mjs";
import{saveCharacterToLibrary,loadCharacterFromLibrary,removeCharacterFromLibrary}from"./character-library.mjs";
import{addBackgroundToFrame,BACKGROUND_PRESETS}from"./backgrounds.mjs";
import{drawRasterBrushStroke,mapPointsToRaster,resolveBrushPressure}from"./raster-brushes.mjs";import{createPersistentRasterSurfaceManager,encodeRasterSurfaceStroke}from"./raster-surface.mjs";
import{ANIME_ANATOMY_JOINTS,createAnimeCharacterDNA,createAnimeAnatomyPlan,createAnimeFrameDrawingTasks,createAnimeAnatomySequence,attachAnimeFrameDrawing,reviewAnimeFrame,auditAnimeAnatomySequence,validateAnimeFrameRasterAsset,getAnimeAnatomyFrameRole,buildAnimeAnatomyConstruction}from"./anime-anatomy-engine.mjs";
(()=>{"use strict";const rasterSurfaces=createPersistentRasterSurfaceManager({createCanvas:()=>document.createElement("canvas"),loadImage:src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error("تعذر فتح صورة الطبقة النقطية."));image.src=src})});const $=id=>document.getElementById(id),NS="http://www.w3.org/2000/svg";const TIMELINE_PAGE_SIZE=24;let project=createProject(),current=0,activeLayerId=project.frames[0].layers[0].id,tool="raster-pencil",drawing=false,points=[],startPoint=null,activePointerType="mouse",history=[],future=[],playing=false,timer=null;const canvas=$("drawingCanvas"),art=$("artLayer"),onion=$("onionLayer"),proposal=$("proposalLayer"),selectionLayer=$("selectionLayer"),nodeEditLayer=$("nodeEditLayer"),active=$("activeStroke"),rigCanvas=$("characterRigCanvas"),rigArt=$("characterRigArt"),rigBones=$("characterRigBones"),rigHandles=$("characterRigHandles"),animeAnatomyCanvas=$("animeAnatomyCanvas"),animeAnatomySource=$("animeAnatomySource"),animeAnatomyMarkers=$("animeAnatomyMarkers"),animeAnatomyConstructionLayer=$("animeAnatomyConstructionLayer");let proposedLayers=[],proposalTarget=null,selectedCharacterModel=null,selection=null,selectionDrag=null,nodeEditing=false,nodeDrag=null,panGesture=null,rigModel=null,rigDrag=null,animeAnatomyActive=false,animeAnatomyStep=0,animeAnatomyPoints={},animeAnatomyMode="dna",activeAnimeDNAId=null,activeAnimeMotionPlan=null,activeAnimeAnatomySequence=null;const frame=()=>project.frames[current],layer=()=>frame().layers.find(l=>l.id===activeLayerId)||frame().layers[0];
const ANIME_ANATOMY_LABELS=[
 {key:"root",label:"مركز الجسم"}, {key:"pelvis",label:"مركز الحوض"},
 {key:"chest",label:"مركز الصدر"}, {key:"neck",label:"قاعدة الرقبة"},
 {key:"head",label:"مركز الرأس"}, {key:"shoulderL",label:"الكتف الأيسر"},
 {key:"elbowL",label:"المرفق الأيسر"}, {key:"wristL",label:"الرسغ الأيسر"},
 {key:"shoulderR",label:"الكتف الأيمن"}, {key:"elbowR",label:"المرفق الأيمن"},
 {key:"wristR",label:"الرسغ الأيمن"}, {key:"hipL",label:"الورك الأيسر"},
 {key:"kneeL",label:"الركبة اليسرى"}, {key:"ankleL",label:"الكاحل الأيسر"},
 {key:"toeL",label:"مقدمة القدم اليسرى"}, {key:"hipR",label:"الورك الأيمن"},
 {key:"kneeR",label:"الركبة اليمنى"}, {key:"ankleR",label:"الكاحل الأيمن"},
 {key:"toeR",label:"مقدمة القدم اليمنى"}
];
function noriPalette(){return{line:$("characterLine").value,skin:$("characterSkin").value,hair:$("characterHair").value,cloth:$("characterCloth").value,accent:$("characterAccent").value}}
function createBaseNori(){return applyNoriPalette(createNoriModel($("characterExpression").value,$("characterView").value,$("characterPose").value),noriPalette())}

function characterModelSelection(){return rigModel||selectedCharacterModel||applyNoriRigPose(createBaseNori(),{})}
function renderCharacterLibrary(){
 const assets=project.characterLibrary||[];
 const select=$("characterLibrarySelect"),selected=select.value;select.replaceChildren();
 const empty=document.createElement("option");empty.value="";empty.textContent="اختر شخصية محفوظة";select.appendChild(empty);
 for(const asset of assets){const option=document.createElement("option");option.value=asset.id;option.textContent=asset.name;select.appendChild(option)}
 if(assets.some(asset=>asset.id===selected))select.value=selected;
 $("loadCharacterLibraryBtn").disabled=!select.value;
 $("deleteCharacterLibraryBtn").disabled=!select.value;
 for(const id of ["rigBlendStartSelect","rigBlendEndSelect"]){
  const control=$(id),previous=control.value;control.replaceChildren();
  const placeholder=document.createElement("option");placeholder.value="";placeholder.textContent="اختر وضعية محفوظة";control.appendChild(placeholder);
  for(const asset of assets){const option=document.createElement("option");option.value=asset.id;option.textContent=asset.name;control.appendChild(option)}
  if(assets.some(asset=>asset.id===previous))control.value=previous;
 }
 if(assets.length>=2){
  if(!$("rigBlendStartSelect").value)$("rigBlendStartSelect").value=assets[0].id;
  if(!$("rigBlendEndSelect").value)$("rigBlendEndSelect").value=assets[1].id;
 }
 $("interpolateRigBtn").disabled=assets.length<2;
}

function renderCharacterInstances(){
 const select=$("characterInstanceSelect");if(!select)return;
 const previous=select.value,instances=new Map();
 for(const entry of frame().layers){const meta=entry.characterInstance;if(meta&&!instances.has(meta.id))instances.set(meta.id,meta)}
 select.replaceChildren();
 const empty=document.createElement("option");empty.value="";empty.textContent=instances.size?"اختر مثيل الشخصية":"لا توجد شخصية في هذا الإطار";select.appendChild(empty);
 for(const meta of instances.values()){const option=document.createElement("option");option.value=meta.id;option.textContent=meta.name+" · "+meta.id.slice(-6);select.appendChild(option)}
 if(instances.has(previous))select.value=previous;
 const enabled=!!select.value;
 $("copyCharacterToNextFrameBtn").disabled=!enabled;
 $("updateCharacterInstanceBtn").disabled=!enabled;
}
function renderRigEditor(){
 if(!rigCanvas)return;
 if(selectedCharacterModel&&!selectedCharacterModel.rig){$("characterRigPanel").hidden=true;$("headRotationRange").disabled=true;$("bodyRotationRange").disabled=true;return}
 $("characterRigPanel").hidden=false;$("headRotationRange").disabled=false;$("bodyRotationRange").disabled=false;
 if(!rigModel)rigModel=applyNoriRigPose(createBaseNori(),{});
 $("headRotationRange").value=String(rigModel.rig.headRotation||0);$("headRotationValue").textContent=(rigModel.rig.headRotation||0)+"°";$("bodyRotationRange").value=String(rigModel.rig.bodyRotation||0);$("bodyRotationValue").textContent=(rigModel.rig.bodyRotation||0)+"°";
 rigArt.replaceChildren();rigBones.replaceChildren();rigHandles.replaceChildren();
 const previewFrame=createFrame();addCharacterModelToFrame(previewFrame,rigModel);
 previewFrame.layers.forEach((entry,index)=>renderLayerInto(rigArt,entry,index,"character-rig-preview"));
 const point=key=>rigModel.rig.joints[key];
 for(const bone of NORI_RIG_BONES){
  const start=point(bone.from),middle=point(bone.through),end=point(bone.to);
  if(!start.visible||!middle.visible||!end.visible)continue;
  const line1=document.createElementNS(NS,"path");
  line1.setAttribute("d","M "+start.x+" "+start.y+" L "+middle.x+" "+middle.y+" L "+end.x+" "+end.y);
  line1.setAttribute("fill","none");line1.setAttribute("stroke","#f59e0b");line1.setAttribute("stroke-width","14");line1.setAttribute("stroke-linecap","round");line1.setAttribute("opacity",".8");rigBones.appendChild(line1);
 }
 for(const key of NORI_JOINT_KEYS){
  const joint=point(key);if(!joint.visible)continue;
  const circle=document.createElementNS(NS,"circle");circle.setAttribute("cx",joint.x);circle.setAttribute("cy",joint.y);const anchor=key==="torso-center"||key==="head-center";circle.setAttribute("r",anchor?"78":"65");circle.setAttribute("fill",anchor?"#fef3c7":"#fff");circle.setAttribute("stroke",anchor?"#d97706":"#0284c7");circle.setAttribute("stroke-width","10");circle.setAttribute("data-joint",key);circle.setAttribute("role","button");circle.setAttribute("aria-label",key);rigHandles.appendChild(circle);
 }
}
function updateRigPalette(){
 if(selectedCharacterModel)return;
 const base=createBaseNori(),updates={};
 for(const key of NORI_JOINT_KEYS)updates[key]={x:rigModel?.rig?.joints?.[key]?.x??base.rig.joints[key].x,y:rigModel?.rig?.joints?.[key]?.y??base.rig.joints[key].y};
 rigModel=applyNoriRigPose(base,updates);renderRigEditor();
}
function resetRigModel(){
 selectedCharacterModel=null;rigModel=applyNoriRigPose(createBaseNori(),{});renderRigEditor();
}
function rigCoords(e){
 const point=rigCanvas.createSVGPoint();point.x=e.clientX;point.y=e.clientY;
 const matrix=rigCanvas.getScreenCTM();if(!matrix)return{x:0,y:0};
 const transformed=point.matrixTransform(matrix.inverse());
 return{x:Math.max(0,Math.min(WIDTH,transformed.x)),y:Math.max(0,Math.min(HEIGHT,transformed.y))};
}

function status(s,ok=true){$("commandStatus").textContent=s;$("commandStatus").style.color=ok?"var(--accent)":"#ff9999"}function snapshot(includeCharacterLibrary=false,forceFull=false){const entry=forceFull||project.frames.length<=600?JSON.stringify(project):captureFrameHistory(project,current,{includeCharacterLibrary});history.push(entry);const rasterBytes=project.frames.reduce((sum,f)=>sum+f.layers.reduce((n,l)=>n+(l.type==="raster"?(l.dataUrl?.length||0):0),0),0);const historyLimit=project.frames.length>600?40:rasterBytes>8*1024*1024?3:rasterBytes>2*1024*1024?5:100;if(history.length>historyLimit)history.shift();future=[];buttons()}function restore(state){if(typeof state==="string"){project=JSON.parse(state);current=Math.min(current,project.frames.length-1)}else{applyFrameHistory(project,state);current=Math.min(state.index,project.frames.length-1)}activeLayerId=frame().layers[0].id;selection=null;selectionDrag=null;render();renderCharacterLibrary()}function buttons(){$("undoBtn").disabled=!history.length;$("redoBtn").disabled=!future.length;const selected=selection&&frame().layers.find(l=>l.id===selection.layerId);$("deleteSelectionBtn").disabled=!selected||selected.locked;$("applyStyleBtn").disabled=!selected||selected.locked;$("duplicateSelectionBtn").disabled=!selected||selected.locked;$("nodeEditBtn").disabled=!selected||selected.locked;$("nodeEditBtn").classList.toggle("active",nodeEditing&&!!selected)}function undo(){if(history.length){const entry=history.pop();future.push(typeof entry==="string"?JSON.stringify(project):captureFrameHistoryAfter(project,entry));restore(entry);buttons()}}function redo(){if(future.length){const entry=future.pop();history.push(typeof entry==="string"?JSON.stringify(project):captureFrameHistory(project,entry.index));restore(entry);buttons()}}
function renderFrame(g,f,opacity=1,includeBackground=true){g.replaceChildren();g.setAttribute("opacity",opacity);const layers=[...(includeBackground?(project.animationBackground||[]):[]),...f.layers];layers.forEach((l,i)=>renderLayerInto(g,l,i,g.id||"render"))}

function animeAnatomyStatus(message,ok=true){
 const node=$("animeAnatomyStatus");if(!node)return;
 node.textContent=message;node.style.color=ok?"var(--accent)":"#ff9999";
}
async function restoreAnimeMotionPlan(dna){
 if(!dna||!dna.lastMotionAction||!Array.isArray(dna.keyDrawings)||dna.keyDrawings.length<2){updateAnimeRasterControls();return false;}
 try{
  await verifyAnimeCharacterAnchor(dna);
  const keys=dna.keyDrawings.filter(item=>item.frame>=0&&item.frame<24);
  for(const key of keys){
   const keyFrame=project.frames[key.frame];
   if(!keyFrame||keyFrame.id!==key.drawingAssetId||!/^[a-f0-9]{64}$/.test(key.sourceSignature||"")){
    throw Error("الوضعية المفتاحية في الإطار "+(key.frame+1)+" لا ترتبط برسم محفوظ صالح؛ أعد تسجيلها.");
   }
   const signature=await sha256Hex(frameSvg(sourceFrameWithoutAnimeRaster(keyFrame),"anime-final-"+keyFrame.id,[]));
   if(signature!==key.sourceSignature)throw Error("تغير الرسم المفتاحي في الإطار "+(key.frame+1)+" بعد اعتماده؛ أعد تسجيله.");
  }
  activeAnimeMotionPlan=createAnimeAnatomyPlan({
   shotId:dna.lastMotionShotId||"restored-walk-proof",
   action:dna.lastMotionAction,characterDNA:dna,durationSeconds:1,fps:24,
   keyDrawings:keys,
   backgroundAssetId:(project.animationBackground||[]).map(item=>item.id).join("+")||null,
   motionNotes:"Restored from the native ZERO STUDIO project; D-028 independent artist redraw workflow."
  });
  activeAnimeAnatomySequence=createAnimeAnatomySequence(activeAnimeMotionPlan);
  updateAnimeRasterControls();
  $("animeAnatomyGuideToggleLabel").hidden=false;
  $("animeAnatomyGuideToggle").checked=true;
  $("animeMotionPlanStatus").textContent="تم استعادة خطة الحركة المحفوظة: 24 إطاراً مستقلاً و"+activeAnimeMotionPlan.keyDrawings.length+" وضعيات مفتاحية.";
  renderAnimeAnatomyConstructionOverlay();
  return true;
 }catch(error){
  activeAnimeMotionPlan=null;activeAnimeAnatomySequence=null;
  $("animeAnatomyGuideToggleLabel").hidden=true;
  $("animeMotionPlanStatus").textContent="تعذر استعادة خطة الحركة: "+error.message;
  return false;
 }
}
function renderAnimeAnatomyDNASelect(selectedId=""){
 const select=$("animeAnatomyDNASelect");if(!select)return;
 const records=Array.isArray(project.animeCharacterDNA)?project.animeCharacterDNA:[];
 const previous=selectedId||select.value;
 select.replaceChildren();
 const empty=document.createElement("option");empty.value="";empty.textContent="لا توجد هوية تشريحية محفوظة";select.appendChild(empty);
 for(const dna of records){
  const option=document.createElement("option");option.value=dna.characterAssetId;
  option.textContent=(dna.name||"شخصية")+(dna.canonicalView?" · "+dna.canonicalView:"");
  select.appendChild(option);
 }
 if(records.some(item=>item.characterAssetId===previous))select.value=previous;
 $("exportAnimeAnatomyDNABtn").disabled=!select.value;
 $("startAnimeKeyDrawingBtn").disabled=!select.value;$("buildAnimeMotionPlanBtn").disabled=!select.value;
}
function renderAnimeAnatomyMarkers(){
 if(!animeAnatomyMarkers)return;
 animeAnatomyMarkers.replaceChildren();
 ANIME_ANATOMY_LABELS.forEach((item,index)=>{
  const point=animeAnatomyPoints[item.key];if(!point)return;
  const circle=document.createElementNS(NS,"circle");
  circle.setAttribute("cx",point.x*WIDTH);circle.setAttribute("cy",point.y*HEIGHT);
  circle.setAttribute("r","27");circle.setAttribute("data-anatomy-joint",item.key);
  animeAnatomyMarkers.appendChild(circle);
  const label=document.createElementNS(NS,"text");
  label.setAttribute("x",point.x*WIDTH+32);label.setAttribute("y",point.y*HEIGHT-24);
  label.textContent=String(index+1);animeAnatomyMarkers.appendChild(label);
 });
 const complete=Object.keys(animeAnatomyPoints).length===ANIME_ANATOMY_LABELS.length;
 $("undoAnimeAnatomyPointBtn").disabled=!animeAnatomyStep;
 $("saveAnimeAnatomyDNABtn").disabled=!complete;
 if(complete){
  $("animeAnatomyStepTitle").textContent="اكتمل تحديد النقاط التشريحية";
  $("animeAnatomyStepHint").textContent=animeAnatomyMode==="key"?"راجع المواضع ثم اعتمد الرسمة المفتاحية":"راجع مواضع العلامات ثم احفظ هوية الشخصية";
 }else{
  const item=ANIME_ANATOMY_LABELS[animeAnatomyStep];
  $("animeAnatomyStepTitle").textContent="النقطة "+(animeAnatomyStep+1)+" من "+ANIME_ANATOMY_LABELS.length;
  $("animeAnatomyStepHint").textContent="انقر على: "+item.label;
 }
}
function currentFrameHasDrawing(){
 return frame().layers.some(entry=>entry.visible!==false&&(entry.type==="raster"?!!entry.dataUrl:Array.isArray(entry.operations)&&entry.operations.some(operation=>operation.kind==="stroke")));
}
function beginAnimeAnatomyCalibration(){
 if(!animeAnatomyCanvas||!animeAnatomySource)return;
 if(!currentFrameHasDrawing()){animeAnatomyStatus("الإطار الحالي فارغ. ارسم الشخصية كاملة أو استورد رسمتها أولاً، ثم عاير المفاصل فوقها.",false);return}
 animeAnatomyActive=true;animeAnatomyStep=0;animeAnatomyPoints={};
 const background=[...(project.animationBackground||[]),...frame().layers];
 animeAnatomySource.replaceChildren();
 background.forEach((entry,index)=>renderLayerInto(animeAnatomySource,entry,index,"anime-dna-source"));
 $("animeAnatomyAnnotator").hidden=false;
 $("animeAnatomyCanvas").style.cursor="crosshair";
 renderAnimeAnatomyMarkers();
 animeAnatomyStatus("انقر على موضع المفصل الذي يطلبه التوجيه أعلى الصورة. لن تُحرّك الصورة نفسها.");
}
function animeAnatomyCoords(event){
 const point=animeAnatomyCanvas.createSVGPoint();point.x=event.clientX;point.y=event.clientY;
 const matrix=animeAnatomyCanvas.getScreenCTM();
 if(!matrix)throw Error("تعذر تحديد موضع اللمس على الصورة.");
 const transformed=point.matrixTransform(matrix.inverse());
 return{x:Math.max(0,Math.min(1,transformed.x/WIDTH)),y:Math.max(0,Math.min(1,transformed.y/HEIGHT))};
}
function cancelAnimeAnatomyCalibration(){
 animeAnatomyActive=false;animeAnatomyStep=0;animeAnatomyPoints={};animeAnatomyMode="dna";activeAnimeDNAId=null;
 $("animeAnatomyView").disabled=false;$("saveAnimeAnatomyDNABtn").textContent="حفظ هوية الشخصية";
 $("animeAnatomyAnnotator").hidden=true;animeAnatomyMarkers.replaceChildren();
}
function beginAnimeKeyDrawing(){
 const id=$("animeAnatomyDNASelect").value;
 const dna=(project.animeCharacterDNA||[]).find(item=>item.characterAssetId===id);
 if(!dna){animeAnatomyStatus("اختر هوية شخصية محفوظة أولاً.",false);return}
 if(current>=24){animeAnatomyStatus("المشهد التجريبي الأول يستخدم الإطارات 1 إلى 24 فقط.",false);return}
 animeAnatomyMode="key";activeAnimeDNAId=id;
 $("animeAnatomyView").value=dna.canonicalView;$("animeAnatomyView").disabled=true;
 $("saveAnimeAnatomyDNABtn").textContent="اعتماد الرسمة المفتاحية";
 beginAnimeAnatomyCalibration();
 animeAnatomyStatus("حدد مفاصل الوضعية الحالية للشخصية "+(dna.name||"المحفوظة")+". سيُسجل الإطار الحالي رقم "+(current+1)+" كرسمة مفتاحية كاملة.");
}
async function saveAnimeKeyDrawing(){
 const dna=(project.animeCharacterDNA||[]).find(item=>item.characterAssetId===activeAnimeDNAId);
 if(!dna)throw Error("تعذر العثور على هوية الشخصية المحددة.");
 await verifyAnimeCharacterAnchor(dna);
 if(!currentFrameHasDrawing())throw Error("لا يمكن اعتماد إطار فارغ؛ ارسم الشخصية كاملة في هذا الإطار أولاً.");
 if(current>=24)throw Error("الإطار الحالي خارج نطاق اختبار المشي الأول.");
 const guide={
  view:dna.canonicalView,
  contacts:{footL:$("animeAnatomyLeftContact").value,footR:$("animeAnatomyRightContact").value},
  joints:Object.fromEntries(ANIME_ANATOMY_LABELS.map(item=>[item.key,animeAnatomyPoints[item.key]]))
 };
 const sourceFrame=sourceFrameWithoutAnimeRaster(frame());
 const sourceSignature=await sha256Hex(frameSvg(sourceFrame,"anime-final-"+sourceFrame.id,[]));
 const key={
  id:uid("anime-key"),frame:current,drawingAssetId:frame().id,sourceSignature,approved:true,
  phase:$("animeKeyDrawingPhase").value,easeToNext:$("animeKeyDrawingEase").value,
  guide,note:"Artist-approved complete drawing from native timeline frame "+(current+1)
 };
 snapshot(true);
 const target=(project.animeCharacterDNA||[]).find(item=>item.characterAssetId===activeAnimeDNAId);
 if(!target)throw Error("اختفت هوية الشخصية من المشروع.");
 if(!Array.isArray(target.keyDrawings))target.keyDrawings=[];
 const existing=target.keyDrawings.findIndex(item=>item.frame===current);
 if(existing>=0)target.keyDrawings[existing]=key;else target.keyDrawings.push(key);
 target.keyDrawings.sort((a,b)=>a.frame-b.frame);
 const name=target.name||"الشخصية";
 const count=target.keyDrawings.length;
 const savedDNAId=activeAnimeDNAId;
 activeAnimeMotionPlan=null;activeAnimeAnatomySequence=null;
 $("animeAnatomyGuideToggleLabel").hidden=true;$("animeAnatomyConstructionLayer").replaceChildren();
 updateAnimeRasterControls();
 cancelAnimeAnatomyCalibration();
 renderAnimeAnatomyDNASelect(savedDNAId);
 $("animeMotionPlanStatus").textContent="تم اعتماد وضعية مفتاحية للإطار "+(current+1)+" للشخصية "+name+". عدد الرسومات المفتاحية المحفوظة: "+count+".";
 animeAnatomyStatus("حُفظت الوضعية المفتاحية الكاملة وربطت بالإطار الأصلي. لا تُنتج هذه العملية رسمة جديدة.");
}
async function buildAnimeMotionPlan(){
 try{
  const id=$("animeAnatomyDNASelect").value;
  const dna=(project.animeCharacterDNA||[]).find(item=>item.characterAssetId===id);
  if(!dna)throw Error("اختر هوية شخصية محفوظة أولاً.");
  await verifyAnimeCharacterAnchor(dna);
  if(project.frames.length<24)throw Error("أنشئ 24 إطاراً في الخط الزمني أولاً، ثم سجّل رسومات البداية والنهاية.");
  const action=$("animeMotionAction").value.trim();
  const keys=(dna.keyDrawings||[]).filter(item=>item.frame>=0&&item.frame<24);
  for(const key of keys){
   const keyFrame=project.frames[key.frame];
   if(!keyFrame||keyFrame.id!==key.drawingAssetId||!/^[a-f0-9]{64}$/.test(key.sourceSignature||"")){
    throw Error("إحدى الوضعيات المفتاحية لم تعد مرتبطة برسم كامل محفوظ. أعد تسجيلها.");
   }
   const currentSignature=await sha256Hex(frameSvg(sourceFrameWithoutAnimeRaster(keyFrame),"anime-final-"+keyFrame.id,[]));
   if(currentSignature!==key.sourceSignature){
    throw Error("تغير الرسم بعد اعتماده كرسمة مفتاحية في الإطار "+(key.frame+1)+". أعد تسجيل الوضعية المفتاحية.");
   }
  }
  const plan=createAnimeAnatomyPlan({
   shotId:uid("anime-walk"),action,characterDNA:dna,durationSeconds:1,fps:24,keyDrawings:keys,
   backgroundAssetId:(project.animationBackground||[]).map(item=>item.id).join("+")||null,
   motionNotes:"D-028: anatomy construction guides only; every output frame must be completely redrawn and reviewed by the artist."
  });
  const tasks=createAnimeFrameDrawingTasks(plan);
  snapshot(true);dna.lastMotionAction=action;dna.lastMotionShotId=plan.shotId;
  activeAnimeMotionPlan=plan;activeAnimeAnatomySequence=createAnimeAnatomySequence(plan);
  updateAnimeRasterControls();
  $("animeAnatomyGuideToggleLabel").hidden=false;$("animeAnatomyGuideToggle").checked=true;
  const currentFrame=Math.min(23,current);
  const role=getAnimeAnatomyFrameRole(plan,currentFrame);
  const bundle={
   format:"zero-studio-anatomy-walk-proof",version:1,plan,
   drawingTasks:tasks.map(task=>({
    frameIndex:task.frameIndex,timeSeconds:task.timeSeconds,kind:task.kind,
    keyDrawingId:task.keyDrawingId,fromKeyDrawingId:task.fromKeyDrawingId,
    toKeyDrawingId:task.toKeyDrawingId,authoringMode:task.authoringMode,
    drawingRequirement:task.drawingRequirement,construction:task.construction
   }))
  };
  download((dna.name||"character")+"-walk-24fps-plan.json",new Blob([JSON.stringify(bundle,null,2)],{type:"application/json"}));
  $("animeMotionPlanStatus").textContent="نجحت الخطة: 24 مهمة رسم مستقلة، "+keys.length+" وضعيات مفتاحية، والإطار الحالي "+(currentFrame+1)+" هو "+(role.kind==="key-drawing"?"رسمة مفتاحية":"إطار وسيط يحتاج إعادة رسم كاملة")+".";
  renderAnimeAnatomyConstructionOverlay();
  animeAnatomyStatus("تم إنشاء وتصدير خطة 24 رسمة مستقلة. هذه خطة إنتاج وليست فيديو أو رسومات نهائية جاهزة.");
 }catch(error){
  $("animeMotionPlanStatus").textContent="تعذر إنشاء الخطة: "+error.message;
  $("animeMotionPlanStatus").style.color="#ff9999";
 }
}
async function saveAnimeAnatomyDNA(){
 try{
  if(Object.keys(animeAnatomyPoints).length!==ANIME_ANATOMY_JOINTS.length)throw Error("أكمل تحديد جميع النقاط التشريحية أولاً.");
  if(animeAnatomyMode==="key"){await saveAnimeKeyDrawing();return;}
  const id=uid("anime-character"),name=$("animeAnatomyName").value.trim()||"شخصية جديدة";
  const guide={
   view:$("animeAnatomyView").value,
   contacts:{footL:$("animeAnatomyLeftContact").value,footR:$("animeAnatomyRightContact").value},
   joints:Object.fromEntries(ANIME_ANATOMY_LABELS.map(item=>[item.key,animeAnatomyPoints[item.key]]))
  };
  if(!currentFrameHasDrawing())throw Error("الإطار الحالي فارغ؛ ارسم الشخصية كاملة قبل حفظ هويتها.");
  const sourceFrame=sourceFrameWithoutAnimeRaster(frame());
  const sourceSignature=await sha256Hex(frameSvg(sourceFrame,"anime-final-"+sourceFrame.id,[]));
  const dna=createAnimeCharacterDNA({
   characterAssetId:id,characterBibleId:id+"-bible",modelSheetAssetIds:[],anchorGuide:guide,
   notes:"Calibrated on native project frame "+(current+1)+"; source frame ID "+frame().id
  });
  dna.name=name;dna.sourceFrameId=frame().id;dna.sourceFrameIndex=current;dna.sourceSignature=sourceSignature;
  snapshot(true);
  if(!Array.isArray(project.animeCharacterDNA))project.animeCharacterDNA=[];
  if(project.animeCharacterDNA.length>=100)throw Error("بلغت مكتبة هويات الشخصيات حد 100.");
  project.animeCharacterDNA.push(dna);
  activeAnimeMotionPlan=null;activeAnimeAnatomySequence=null;
  $("animeAnatomyGuideToggleLabel").hidden=true;$("animeAnatomyConstructionLayer").replaceChildren();
  updateAnimeRasterControls();
  renderAnimeAnatomyDNASelect(id);
  cancelAnimeAnatomyCalibration();
  animeAnatomyStatus("حُفظت هوية "+name+" مع 19 نقطة تشريحية داخل المشروع .zero. لم تُعدّل الرسمة الأصلية.");
 }catch(error){animeAnatomyStatus((animeAnatomyMode==="key"?"تعذر اعتماد الرسمة المفتاحية: ":"تعذر حفظ الهوية التشريحية: ")+error.message,false)}
}
function renderAnimeAnatomyConstructionOverlay(){
 if(!animeAnatomyConstructionLayer)return;
 animeAnatomyConstructionLayer.replaceChildren();
 if(!activeAnimeMotionPlan||!$("animeAnatomyGuideToggle")?.checked||current>=24)return;
 try{
  const construction=buildAnimeAnatomyConstruction(activeAnimeMotionPlan,current);
  for(const segment of construction.segments){
   const path=document.createElementNS(NS,"path");
   path.setAttribute("d","M "+(segment.from.x*WIDTH)+" "+(segment.from.y*HEIGHT)+" L "+(segment.to.x*WIDTH)+" "+(segment.to.y*HEIGHT));
   path.setAttribute("fill","none");path.setAttribute("stroke","#0f766e");
   path.setAttribute("stroke-width","13");path.setAttribute("stroke-linecap","round");path.setAttribute("opacity",".72");
   animeAnatomyConstructionLayer.appendChild(path);
  }
  for(const [name,point] of Object.entries(construction.joints)){
   const circle=document.createElementNS(NS,"circle");
   circle.setAttribute("cx",point.x*WIDTH);circle.setAttribute("cy",point.y*HEIGHT);
   circle.setAttribute("r",name==="root"||name==="pelvis"?"22":"15");
   circle.setAttribute("fill",name==="root"||name==="pelvis"?"#f59e0b":"#f8fafc");
   circle.setAttribute("stroke","#0f172a");circle.setAttribute("stroke-width","5");
   animeAnatomyConstructionLayer.appendChild(circle);
  }
 }catch(error){animeAnatomyStatus("تعذر عرض الدليل التشريحي: "+error.message,false)}
}
function prepareAnime24FrameShot(){
 if(project.frames.length>=24){$("animeMotionPlanStatus").textContent="يحتوي الخط الزمني بالفعل على 24 إطاراً أو أكثر؛ سيستخدم الاختبار الإطارات 1–24.";return}
 snapshot(true);
 while(project.frames.length<24)project.frames.push(createFrame());
 current=0;activeLayerId=frame().layers[0].id;render();
 $("animeMotionPlanStatus").textContent="تم إنشاء إطارات فارغة حتى الإطار 24. ارسم رسمة كاملة مستقلة في كل إطار؛ لم تُنسخ أي رسمة.";
}

function updateAnimeRasterControls(){
 const ready=!!activeAnimeMotionPlan;
 $("saveAnimeRasterFrameBtn").disabled=!ready||current>=24;
 $("auditAnimeRasterFramesBtn").disabled=!ready;
 $("exportAnimeRasterSequenceBtn").disabled=true;
}
function animeRasterStatus(message,ok=true){
 const node=$("animeRasterAuditStatus");node.textContent=message;
 node.style.color=ok?"var(--accent)":"#ff9999";
}
async function sha256Hex(value){
 if(!globalThis.crypto?.subtle)throw Error("متصفح الهاتف لا يدعم حساب SHA-256 الآمن.");
 const bytes=value instanceof Blob?await value.arrayBuffer():value instanceof ArrayBuffer?value:new TextEncoder().encode(String(value));
 const digest=await crypto.subtle.digest("SHA-256",bytes);
 return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("");
}
function readBlobAsDataUrl(blob){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||""));
  reader.onerror=()=>reject(Error("تعذر حفظ صورة PNG داخل المشروع."));
  reader.readAsDataURL(blob);
 });
}
async function exportFrameToTransparentPng(sourceFrame,backgroundLayers=[]){
 const markup=frameSvg(sourceFrame,"anime-final-"+sourceFrame.id,backgroundLayers);
 const url=URL.createObjectURL(new Blob([markup],{type:"image/svg+xml;charset=utf-8"}));
 try{
  const image=new Image();
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error("تعذر تحويل الرسم الحالي إلى PNG."));image.src=url});
  const output=document.createElement("canvas");output.width=WIDTH;output.height=HEIGHT;
  const context=output.getContext("2d",{alpha:true});
  if(!context)throw Error("تعذر إنشاء سطح Raster شفاف.");
  context.clearRect(0,0,WIDTH,HEIGHT);
  context.drawImage(image,0,0,WIDTH,HEIGHT);
  const blob=await new Promise(resolve=>output.toBlob(resolve,"image/png"));
  if(!blob||blob.type!=="image/png"||blob.size<24)throw Error("تعذر تصدير PNG صالح من الإطار الحالي.");
  return blob;
 }finally{URL.revokeObjectURL(url)}
}
function sourceFrameWithoutAnimeRaster(sourceFrame){
 const copy=JSON.parse(JSON.stringify(sourceFrame));delete copy.animeRaster;return copy;
}
async function verifyAnimeCharacterAnchor(dna){
 const frameId=String(dna?.sourceFrameId||"");
 const expected=String(dna?.sourceSignature||"").toLowerCase();
 if(!frameId||!/^[a-f0-9]{64}$/.test(expected))throw Error("هوية الشخصية القديمة لا تحتوي بصمة مرجعها الأصلي؛ أعد معايرة الشخصية من الرسم المعتمد.");
 const anchor=project.frames.find(item=>item.id===frameId);
 if(!anchor)throw Error("الرسم الأصلي الذي بُنيت عليه هوية الشخصية غير موجود في المشروع.");
 const actual=await sha256Hex(frameSvg(sourceFrameWithoutAnimeRaster(anchor),"anime-final-"+anchor.id,[]));
 if(actual!==expected)throw Error("تغير الرسم المرجعي الأصلي للشخصية بعد معايرتها؛ لا يمكن استخدام هوية قديمة. أعد معايرة الشخصية من رسم معتمد.");
 return true;
}
async function saveCurrentAnimeRasterFrame(){
 try{
  if(!activeAnimeMotionPlan||!activeAnimeAnatomySequence)throw Error("أنشئ خطة الحركة أولاً.");
  if(current<0||current>=24)throw Error("اختر واحداً من أول 24 إطاراً.");
  if(!currentFrameHasDrawing())throw Error("الإطار الحالي فارغ؛ ارسم الشخصية كاملة قبل حفظه.");
  animeRasterStatus("يتم تصدير الرسم الحالي إلى PNG شفاف وفحص بصمته…");
  const frameIndex=current,sourceFrame=sourceFrameWithoutAnimeRaster(frame());
  const sourceSignature=await sha256Hex(frameSvg(sourceFrame,"anime-final-"+sourceFrame.id,[]));
  const blob=await exportFrameToTransparentPng(sourceFrame);
  const contentHash=await sha256Hex(blob);
  if(project.frames.some((entry,index)=>index!==frameIndex&&entry.animeRaster?.contentHash===contentHash)){
   throw Error("هذه الصورة مطابقة تماماً لرسم محفوظ في إطار آخر. ارسم الإطار الحالي بشكل مستقل.");
  }
  const review={
   identity:$("animeReviewIdentity").checked,
   anatomy:$("animeReviewAnatomy").checked,
   lineQuality:$("animeReviewLineQuality").checked,
   timing:$("animeReviewTiming").checked
  };
  const approved=Object.values(review).every(Boolean);
  const record=validateAnimeFrameRasterAsset({
   assetId:uid("anime-raster"),contentHash,sourceSignature,mimeType:"image/png",
   width:WIDTH,height:HEIGHT,alpha:true,dataUrl:await readBlobAsDataUrl(blob),
   review:{status:approved?"approved":"rejected",...review,note:approved?"Artist review passed.":"One or more artist review checks remain unchecked."}
  });
  snapshot();
  frame().animeRaster=record;
  activeAnimeAnatomySequence=createAnimeAnatomySequence(activeAnimeMotionPlan);
  const audit=await auditStoredAnimeRasterFrames(false);
  if(!audit)throw Error("تعذر إتمام فحص التسلسل بعد حفظ PNG.");
  animeRasterStatus("حُفظ PNG مستقل للإطار "+(frameIndex+1)+". المكتمل: "+audit.drawnFrames+"/24، المعتمد: "+audit.approvedFrames+"/24، المفقود: "+audit.missingFrames+".",approved);
 }catch(error){animeRasterStatus("تعذر حفظ رسمة الإطار: "+error.message,false)}
}
async function buildStoredAnimeRasterSequence(){
 if(!activeAnimeMotionPlan)throw Error("خطة الحركة غير نشطة؛ اختر الشخصية وأعد بناءها من سجلات المشروع.");
 const sequence=createAnimeAnatomySequence(activeAnimeMotionPlan),staleFrames=[];
 for(let index=0;index<24;index++){
  const stored=project.frames[index]?.animeRaster;
  if(!stored)continue;
  const sourceFrame=sourceFrameWithoutAnimeRaster(project.frames[index]);
  const sourceSignature=await sha256Hex(frameSvg(sourceFrame,"anime-final-"+sourceFrame.id,[]));
  if(sourceSignature!==stored.sourceSignature){staleFrames.push(index);continue}
  const actualHash=await sha256Hex(blobFromBase64DataUrl(stored.dataUrl,stored.mimeType));
  if(actualHash!==stored.contentHash){staleFrames.push(index);continue}
  const drawing={
   assetId:stored.assetId,contentHash:stored.contentHash,mimeType:stored.mimeType,
   width:stored.width,height:stored.height,alpha:stored.alpha
  };
  attachAnimeFrameDrawing(sequence,index,drawing);
  reviewAnimeFrame(sequence,index,stored.review);
 }
 const audit=auditAnimeAnatomySequence(sequence,{requireApproved:false});
 return{sequence,audit,staleFrames};
}
function blobFromBase64DataUrl(dataUrl,mimeType){
 const prefix="data:"+mimeType+";base64,";
 if(typeof dataUrl!=="string"||!dataUrl.startsWith(prefix))throw Error("بيانات PNG المخزنة غير صالحة.");
 const binary=atob(dataUrl.slice(prefix.length)),bytes=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 return new Blob([bytes],{type:mimeType});
}
async function auditStoredAnimeRasterFrames(exportZip=false){
 try{
  animeRasterStatus("يتم فحص هوية الرسومات وبصمات PNG ومراجعات الإطارات…");
  const {sequence,audit,staleFrames}=await buildStoredAnimeRasterSequence();
  activeAnimeAnatomySequence=sequence;
  const passed=audit.meets24UniqueApprovedDrawingsPerSecond&&staleFrames.length===0;
  $("exportAnimeRasterSequenceBtn").disabled=!passed;
  $("animeRasterAuditStatus").style.color=passed?"var(--accent)":"#ff9999";
  const report="الرسومات المحفوظة: "+audit.drawnFrames+"/24 · المعتمدة: "+audit.approvedFrames+"/24 · المفقودة: "+audit.missingFrames+" · المرفوضة: "+audit.rejectedFrames+" · البصمة المتغيرة: "+staleFrames.length+" · الرسومات الفريدة/الثانية: "+audit.uniqueDrawingsPerSecond;
  if(!exportZip){animeRasterStatus(report+(passed?" — اجتاز الفحص.":" — لم يكتمل شرط 24 رسمة مستقلة معتمدة."),passed);return audit}
  if(!passed)throw Error("لن يتم التصدير: يجب حفظ ومراجعة 24 صورة Raster مستقلة، مع إصلاح كل إطار تغير بعد تصديره.");
  const entries=[{
   name:"manifest.json",
   data:JSON.stringify({
    format:"zero-studio-independent-anime-raster-sequence",version:1,
    shotId:activeAnimeMotionPlan.shotId,fps:24,durationSeconds:1,
    uniqueDrawingCount:audit.uniqueDrawingCount,uniqueDrawingsPerSecond:audit.uniqueDrawingsPerSecond,
    characterAssetId:activeAnimeMotionPlan.characterAssetId,backgroundAssetId:activeAnimeMotionPlan.backgroundAssetId,
    keyDrawingCount:activeAnimeMotionPlan.keyDrawings.length,backgroundIncluded:(project.animationBackground||[]).length>0,
   backgroundAssetId:activeAnimeMotionPlan.backgroundAssetId,reviewStatus:"all-24-approved"
   },null,2)
  },{
   name:"motion-plan.json",data:JSON.stringify(activeAnimeMotionPlan,null,2)
  }];
  if((project.animationBackground||[]).length){
   const backgroundBlob=await exportFrameToTransparentPng({id:"anime-static-background",layers:[]},project.animationBackground);
   entries.push({name:"background/background.png",data:new Uint8Array(await backgroundBlob.arrayBuffer())});
  }
  for(let index=0;index<24;index++){
   const record=project.frames[index].animeRaster;
   const encoded=record.dataUrl.slice(record.dataUrl.indexOf(",")+1);
   const binary=atob(encoded),bytes=new Uint8Array(binary.length);
   for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
   entries.push({name:"frames/frame-"+String(index+1).padStart(4,"0")+".png",data:bytes});
  }
  const archive=createZip(entries);
  download("zero-studio-anime-24-independent-drawings.zip",new Blob([archive],{type:"application/zip"}));
  animeRasterStatus("تم التصدير بنجاح: 24 رسمة PNG مستقلة وفريدة ومعتمدة، 24 FPS. "+report,true);
  return audit;
 }catch(error){
  $("exportAnimeRasterSequenceBtn").disabled=true;
  animeRasterStatus("تعذر اجتياز فحص/تصدير الرسومات: "+error.message,false);
  return null;
 }
}
function wireAnimeAnatomyCalibration(){
 if(!animeAnatomyCanvas)return;
 $("startAnimeAnatomyBtn").onclick=()=>{animeAnatomyMode="dna";activeAnimeDNAId=null;$("animeAnatomyView").disabled=false;beginAnimeAnatomyCalibration()};
 $("startAnimeKeyDrawingBtn").onclick=beginAnimeKeyDrawing;
 $("buildAnimeMotionPlanBtn").onclick=buildAnimeMotionPlan;
 $("prepareAnime24FrameBtn").onclick=prepareAnime24FrameShot;
 $("animeAnatomyGuideToggle").onchange=renderAnimeAnatomyConstructionOverlay;
 $("saveAnimeRasterFrameBtn").onclick=saveCurrentAnimeRasterFrame;
 $("auditAnimeRasterFramesBtn").onclick=()=>{auditStoredAnimeRasterFrames(false).catch(()=>{})};
 $("exportAnimeRasterSequenceBtn").onclick=()=>{auditStoredAnimeRasterFrames(true).catch(()=>{})};
 animeAnatomyCanvas.addEventListener("pointerdown",event=>{
  if(!animeAnatomyActive||animeAnatomyStep>=ANIME_ANATOMY_LABELS.length)return;
  try{
   const point=animeAnatomyCoords(event);
   animeAnatomyPoints[ANIME_ANATOMY_LABELS[animeAnatomyStep].key]=point;
   animeAnatomyStep++;renderAnimeAnatomyMarkers();event.preventDefault();
  }catch(error){animeAnatomyStatus(error.message,false)}
 });
 $("undoAnimeAnatomyPointBtn").onclick=()=>{
  if(!animeAnatomyStep)return;
  animeAnatomyStep--;delete animeAnatomyPoints[ANIME_ANATOMY_LABELS[animeAnatomyStep].key];
  renderAnimeAnatomyMarkers();
 };
 $("cancelAnimeAnatomyBtn").onclick=cancelAnimeAnatomyCalibration;
 $("saveAnimeAnatomyDNABtn").onclick=saveAnimeAnatomyDNA;
 $("animeAnatomyDNASelect").onchange=()=>{const selected=$("animeAnatomyDNASelect").value;const active=!!selected;$("exportAnimeAnatomyDNABtn").disabled=!active;$("startAnimeKeyDrawingBtn").disabled=!active;$("buildAnimeMotionPlanBtn").disabled=!active;activeAnimeMotionPlan=null;activeAnimeAnatomySequence=null;updateAnimeRasterControls();$("animeAnatomyGuideToggleLabel").hidden=true;$("animeAnatomyConstructionLayer").replaceChildren();const dna=(project.animeCharacterDNA||[]).find(item=>item.characterAssetId===selected);if(dna?.lastMotionAction){
  $("animeMotionAction").value=dna.lastMotionAction;
  restoreAnimeMotionPlan(dna).catch(error=>{
   activeAnimeMotionPlan=null;activeAnimeAnatomySequence=null;updateAnimeRasterControls();
   animeRasterStatus("تحتاج بعض الرسومات المفتاحية إلى تسجيل جديد: "+error.message,false);
  });
 }else updateAnimeRasterControls()};
 $("exportAnimeAnatomyDNABtn").onclick=()=>{
  const selected=$("animeAnatomyDNASelect").value;
  const dna=(project.animeCharacterDNA||[]).find(item=>item.characterAssetId===selected);
  if(!dna)return animeAnatomyStatus("اختر هوية شخصية محفوظة أولاً.",false);
  download((dna.name||"character")+"-anatomy-dna.json",new Blob([JSON.stringify(dna,null,2)],{type:"application/json"}));
  animeAnatomyStatus("تم تصدير بيانات الهوية التشريحية المحددة.");
 };
 renderAnimeAnatomyDNASelect();
}
function render(){renderFrame(art,frame());if($("onionToggle").checked&&current>0)renderFrame(onion,project.frames[current-1],.18,false);else onion.replaceChildren();renderAnimeAnatomyConstructionOverlay();updateAnimeRasterControls();renderFrames();renderLayers();renderCharacterInstances();renderSelection();$("frameInfo").textContent="الإطار "+(current+1)+" من "+project.frames.length;$("frameCount").textContent=project.frames.length+" إطار";$("canvasHint").style.display=frame().layers.some(l=>l.operations.some(o=>o.kind==="stroke"))||(project.animationBackground||[]).length?"none":"block";renderAnimationProduction();buttons()}
function renderFrames(){const list=$("frameList");list.replaceChildren();const start=Math.floor(current/TIMELINE_PAGE_SIZE)*TIMELINE_PAGE_SIZE,end=Math.min(project.frames.length,start+TIMELINE_PAGE_SIZE);for(let i=start;i<end;i++){const f=project.frames[i],b=document.createElement("button");b.className="frame-thumb"+(i===current?" selected":"");b.type="button";b.setAttribute("aria-label","اختيار الإطار "+(i+1));const thumb=document.createElementNS(NS,"svg");thumb.setAttribute("viewBox","0 0 1920 1080");const bg=document.createElementNS(NS,"rect");bg.setAttribute("width",WIDTH);bg.setAttribute("height",HEIGHT);bg.setAttribute("fill","#fff");thumb.appendChild(bg);[...(project.animationBackground||[]),...f.layers].forEach((l,n)=>renderLayerInto(thumb,l,n,"thumb-"+i));b.appendChild(thumb);const n=document.createElement("span");n.textContent=i+1;b.appendChild(n);b.onclick=()=>{stop();current=i;activeLayerId=frame().layers[0].id;selection=null;selectionDrag=null;clearProposal();render()};list.appendChild(b)}$("framePageInfo").textContent="الإطارات "+(start+1)+"–"+end+" من "+project.frames.length;$("framePagePrev").disabled=start===0;$("framePageNext").disabled=end>=project.frames.length;$("frameJumpInput").max=String(project.frames.length);$("frameJumpInput").value=String(current+1)}
function renderLayers(){$("layerList").replaceChildren();frame().layers.forEach((l,i)=>{const row=document.createElement("div");row.className="layer-row"+(l.id===activeLayerId?" selected":"");const select=document.createElement("button");select.className="layer-select";select.textContent=(l.type==="raster"?"▧ ":"✎ ")+l.name;select.setAttribute("aria-label",(l.type==="raster"?"طبقة صورة: ":"طبقة متجهية: ")+l.name);select.onclick=()=>{activeLayerId=l.id;renderLayers()};const action=(label,title,fn)=>{const b=document.createElement("button");b.className="layer-mini";b.textContent=label;b.title=title;b.onclick=fn;return b};const rename=action("✎","إعادة تسمية الطبقة",()=>{const input=document.createElement("input");input.className="layer-rename-input";input.value=l.name;input.maxLength=80;input.setAttribute("aria-label","اسم الطبقة");const save=action("✓","حفظ الاسم",()=>{const name=input.value.trim();if(!name||name.length>80){status("اسم الطبقة يجب أن يكون من 1 إلى 80 حرفاً.",false);return}snapshot();renameLayer(frame(),l.id,name);renderLayers()});const cancel=action("×","إلغاء",()=>renderLayers());row.replaceChildren(input,save,cancel);input.focus();input.select();input.onkeydown=e=>{if(e.key==="Enter")save.click();if(e.key==="Escape")cancel.click()}});const vis=action(l.visible?"◉":"○","إظهار أو إخفاء",()=>{snapshot();l.visible=!l.visible;render()});const lock=action(l.locked?"🔒":"🔓","قفل أو فتح",()=>{snapshot();l.locked=!l.locked;renderLayers()});const up=action("↑","رفع الطبقة",()=>{snapshot();if(reorderLayer(frame(),l.id,1))render();else{history.pop();buttons()}});const down=action("↓","خفض الطبقة",()=>{snapshot();if(reorderLayer(frame(),l.id,-1))render();else{history.pop();buttons()}});row.append(select,rename,vis,lock,up,down);$("layerList").appendChild(row)})}
function renderNodeHandles(){
 nodeEditLayer.replaceChildren();
 if(!nodeEditing||!selection)return;
 const targetLayer=frame().layers.find(l=>l.id===selection.layerId),operation=targetLayer?.operations.find(op=>op.id===selection.operationId);
 if(!targetLayer||targetLayer.locked||!operation)return;
 const handles=getPathEditHandles(operation.path.d),total=handles.anchors.length+handles.controls.length;
 if(total>240){status("هذا المسار يحتوي على "+total+" مقابض؛ حد التحرير التفاعلي 240 مقبضاً في المرة الواحدة.",false);return}
 for(const handle of [...handles.anchors,...handles.controls]){
  const control=handle.type==="control",circle=document.createElementNS(NS,"circle");
  circle.setAttribute("cx",handle.x);circle.setAttribute("cy",handle.y);circle.setAttribute("r",control?"16":"22");
  circle.setAttribute("fill",control?"#ede9fe":"#fff7ed");circle.setAttribute("stroke",control?"#7c3aed":"#ea580c");circle.setAttribute("stroke-width","8");
  circle.setAttribute("data-node-type",handle.type);circle.setAttribute(control?"data-control-index":"data-node-index",control?handle.index:handle.index);
  circle.setAttribute("role","button");circle.setAttribute("aria-label",(control?"مقبض منحنى ":"نقطة متجهية ")+(handle.index+1));
  nodeEditLayer.appendChild(circle);
 }
}
function renderSelection(){
 selectionLayer.replaceChildren();selectionLayer.removeAttribute("transform");nodeEditLayer.replaceChildren();
 if(!selection){buttons();return}
 const node=[...art.querySelectorAll("[data-operation]")].find(el=>el.getAttribute("data-operation")===selection.operationId);
 if(!node){selection=null;buttons();return}
 try{
  const box=node.getBBox(),outline=document.createElementNS(NS,"rect");
  outline.setAttribute("x",box.x-8);outline.setAttribute("y",box.y-8);
  outline.setAttribute("width",Math.max(1,box.width)+16);outline.setAttribute("height",Math.max(1,box.height)+16);
  outline.setAttribute("fill","none");outline.setAttribute("stroke","#0ea5e9");
  outline.setAttribute("stroke-width","5");outline.setAttribute("stroke-dasharray","14 10");
  selectionLayer.appendChild(outline);
 }catch(error){selection=null}
 renderNodeHandles();buttons();
}
function setViewBox(x,y,w,h){canvas.setAttribute("viewBox",[x,y,w,h].join(" "))}
function zoomCanvas(factor){
 const view=canvas.viewBox.baseVal,centerX=view.x+view.width/2,centerY=view.y+view.height/2;
 const width=Math.max(WIDTH/4,Math.min(WIDTH,view.width/factor)),height=width*HEIGHT/WIDTH;
 setViewBox(centerX-width/2,centerY-height/2,width,height);
}
function resetCanvasView(){setViewBox(0,0,WIDTH,HEIGHT)}
function coords(e){const p=canvas.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const m=canvas.getScreenCTM();if(!m)return{x:0,y:0};const q=p.matrixTransform(m.inverse());return{x:Math.max(0,Math.min(WIDTH,q.x)),y:Math.max(0,Math.min(HEIGHT,q.y))}}
function dpath(a){return $("pressureToggle").checked&&activePointerType==="pen"&&tool==="pen"?pressureOutlinePath(a,+$("strokeWidth").value):pointsToPath(a)}
const shapeTools=new Set(["line","rect","ellipse"]),rasterBrushTools=new Set(["raster-pencil","raster-brush"]);let rasterCommitPending=false,rasterPreviewCanvas=null,rasterPreviewContext=null,rasterPreviewSeed=1,rasterPreviewEncodePending=false,rasterPreviewDirty=false,rasterPreviewVersion=0,rasterPreviewBlobUrl=null;const rasterPreview=$("rasterStrokePreview");
async function commitRasterBrushStroke(target,strokePoints,brushOptions){
 const{result,dataUrl:nextData}=await encodeRasterSurfaceStroke(rasterSurfaces,target,surface=>{
  const mapped=mapPointsToRaster(strokePoints,WIDTH,HEIGHT,target.width,target.height,brushOptions.size);
  return drawRasterBrushStroke(surface.context,mapped.points,{...brushOptions,size:mapped.size});
 });
 const nextStrokes=Array.isArray(target.strokes)?target.strokes.slice():[];
 nextStrokes.push({points:strokePoints.map(p=>({x:p.x,y:p.y,pressure:p.pressure})),options:{brush:brushOptions.brush,size:brushOptions.size,color:brushOptions.color,opacity:brushOptions.opacity,texture:brushOptions.texture,blendMode:brushOptions.blendMode||"normal",pressureSensitive:brushOptions.pressureSensitive!==false,erase:brushOptions.erase===true,seed:brushOptions.seed}});
 target.dataUrl=nextData;target.mimeType="image/png";target.strokes=nextStrokes;
 rasterSurfaces.markCurrent(target);
 return result;
}
function rasterBrushOptions(){
 const rasterErase=tool==="eraser",brush=tool==="raster-pencil"?"graphite":rasterErase?"ink":$("rasterBrushPreset").value;
 return{brush,size:rasterErase?Math.max(8,+$("strokeWidth").value*4):+$("strokeWidth").value,color:$("strokeColor").value,opacity:rasterErase?1:+$("rasterBrushOpacity").value/100,texture:rasterErase?0:+$("rasterBrushTexture").value/100,blendMode:rasterErase?"normal":$("rasterBrushBlend").value,pressureSensitive:rasterErase?false:$("pressureToggle").checked,erase:rasterErase,seed:rasterPreviewSeed};
}
function clearRasterPreview(){rasterPreviewVersion++;rasterPreviewDirty=false;if(rasterPreview){rasterPreview.removeAttribute("href");rasterPreview.setAttribute("visibility","hidden")}if(rasterPreviewBlobUrl){URL.revokeObjectURL(rasterPreviewBlobUrl);rasterPreviewBlobUrl=null}if(rasterPreviewContext&&rasterPreviewCanvas)rasterPreviewContext.clearRect(0,0,rasterPreviewCanvas.width,rasterPreviewCanvas.height)}
function publishRasterPreview(source,version,blobUrl=null){if(version!==rasterPreviewVersion||!drawing){if(blobUrl)URL.revokeObjectURL(blobUrl);return}const previous=rasterPreviewBlobUrl;if(blobUrl)rasterPreviewBlobUrl=blobUrl;if(previous&&previous!==blobUrl)rasterPreview.addEventListener("load",()=>{if(rasterPreviewBlobUrl!==previous)URL.revokeObjectURL(previous)},{once:true});rasterPreview.setAttribute("href",source);rasterPreview.setAttribute("visibility","visible")}
function encodeRasterPreview(){if(rasterPreviewEncodePending||!rasterPreviewDirty||!rasterPreviewCanvas)return;rasterPreviewDirty=false;rasterPreviewEncodePending=true;const version=rasterPreviewVersion;rasterPreviewCanvas.toBlob(blob=>{rasterPreviewEncodePending=false;if(version!==rasterPreviewVersion||!drawing){if(drawing&&rasterPreviewDirty)encodeRasterPreview();return}if(blob){const url=URL.createObjectURL(blob);publishRasterPreview(url,version,url)}else publishRasterPreview(rasterPreviewCanvas.toDataURL("image/png"),version);if(rasterPreviewDirty)encodeRasterPreview()},"image/png")}
function updateRasterPreview(){
 if(!drawing||(!rasterBrushTools.has(tool)&&!(tool==="eraser"&&layer().type==="raster"))||!points.length)return;
 const target=layer();if(target.type!=="raster")return;
 try{
  // Keep pointer-move previews lightweight on phones. The committed stroke
  // still renders at the full raster-layer dimensions in commitRasterBrushStroke.
  const previewScale=Math.min(1,960/target.width,540/target.height);
  const previewWidth=Math.max(1,Math.round(target.width*previewScale));
  const previewHeight=Math.max(1,Math.round(target.height*previewScale));
  if(!rasterPreviewCanvas){rasterPreviewCanvas=document.createElement("canvas");rasterPreviewCanvas.width=previewWidth;rasterPreviewCanvas.height=previewHeight;rasterPreviewContext=rasterPreviewCanvas.getContext("2d");if(!rasterPreviewContext)throw Error("تعذر إنشاء سطح معاينة الفرشاة النقطية")}
  if(rasterPreviewCanvas.width!==previewWidth||rasterPreviewCanvas.height!==previewHeight){rasterPreviewCanvas.width=previewWidth;rasterPreviewCanvas.height=previewHeight}
  rasterPreviewContext.clearRect(0,0,rasterPreviewCanvas.width,rasterPreviewCanvas.height);
  const options=rasterBrushOptions(),mapped=mapPointsToRaster(points,WIDTH,HEIGHT,previewWidth,previewHeight,options.size);
  drawRasterBrushStroke(rasterPreviewContext,mapped.points,{...options,size:mapped.size});
  rasterPreviewDirty=true;
  encodeRasterPreview();
 }catch(error){clearRasterPreview();status("تعذرت معاينة ضربة Raster: "+error.message,false)}
}
function previewPath(){
 if(shapeTools.has(tool)&&startPoint&&points.length)return shapePath(tool,startPoint,points[points.length-1]);
 return dpath(points);
}
function start(e){if(playing||e.button>0||rasterCommitPending)return;if(tool==="pan"){const rect=canvas.getBoundingClientRect(),view=canvas.viewBox.baseVal;panGesture={clientX:e.clientX,clientY:e.clientY,x:view.x,y:view.y,width:view.width,height:view.height,ratioX:view.width/Math.max(1,rect.width),ratioY:view.height/Math.max(1,rect.height)};canvas.setPointerCapture?.(e.pointerId);return}if(nodeEditing&&tool==="select"&&selection&&e.target.closest?.("[data-node-type]")){const handle=e.target.closest("[data-node-type]"),type=handle.getAttribute("data-node-type"),index=Number(handle.getAttribute(type==="control"?"data-control-index":"data-node-index")),targetLayer=frame().layers.find(l=>l.id===selection.layerId),operation=targetLayer?.operations.find(op=>op.id===selection.operationId);if(!targetLayer||targetLayer.locked||!operation)return;const historyLength=history.length;snapshot();nodeDrag={layerId:selection.layerId,operationId:selection.operationId,index,type,startPath:operation.path.d,historyLength};canvas.setPointerCapture?.(e.pointerId);e.preventDefault();return}if(tool==="select"){const target=e.target.closest?.("[data-operation]");if(!target){selection=null;selectionDrag=null;renderSelection();return}const layerNode=target.closest("[data-layer]"),layerId=layerNode?.getAttribute("data-layer");if(!layerId)return;selection={operationId:target.getAttribute("data-operation"),layerId};activeLayerId=layerId;selectionDrag={start:coords(e)};canvas.setPointerCapture?.(e.pointerId);renderLayers();renderSelection();return}if(layer().locked)return;const rasterEraser=tool==="eraser"&&layer().type==="raster";if(rasterBrushTools.has(tool)&&layer().type!=="raster"){snapshot();const blank=document.createElement("canvas");blank.width=WIDTH;blank.height=HEIGHT;const raster=addRasterLayer(frame(),{name:tool==="raster-pencil"?"رسم رصاص":"رسم بالفرشاة",dataUrl:blank.toDataURL("image/png"),mimeType:"image/png",width:WIDTH,height:HEIGHT});activeLayerId=raster.id;render();status("أُنشئت طبقة Raster شفافة؛ ضرباتك التالية ستُرسم كبكسلات حقيقية قابلة للحفظ.");}else if(!rasterBrushTools.has(tool)&&!rasterEraser&&layer().type==="raster"){snapshot();const vector=addLayer(frame(),"رسم متجهي فوق: "+layer().name);activeLayerId=vector.id;renderLayers();status("أُنشئت طبقة SVG جديدة فوق الصورة حتى لا تُفقد ضربات المتجهات.");}selection=null;renderSelection();drawing=true;activePointerType=e.pointerType||"mouse";canvas.setPointerCapture?.(e.pointerId);startPoint=coords(e);points=[{...startPoint,pressure:resolveBrushPressure(activePointerType,e.pressure,.55)}];rasterPreviewSeed=Math.round(startPoint.x*17+startPoint.y*31+Date.now()%100000);clearRasterPreview();if(rasterBrushTools.has(tool)||(tool==="eraser"&&layer().type==="raster"))updateRasterPreview();const pressureActive=$("pressureToggle").checked&&activePointerType==="pen"&&tool==="pen";active.setAttribute("d",previewPath());active.setAttribute("stroke",tool==="eraser"?"#000":pressureActive?"none":$("strokeColor").value);active.setAttribute("stroke-opacity",rasterBrushTools.has(tool)?(tool==="raster-pencil"?".68":".78"):"1");active.setAttribute("stroke-width",tool==="eraser"?Math.max(18,+$("strokeWidth").value*4):pressureActive?".2":$("strokeWidth").value);active.setAttribute("fill",pressureActive||((tool==="rect"||tool==="ellipse")&&$("fillShapeToggle").checked)?$("strokeColor").value:"none");$("canvasHint").style.display="none"}
function addPoint(e){const xy=coords(e),last=points[points.length-1],distance=last?Math.hypot(xy.x-last.x,xy.y-last.y):0,fallbackPressure=Math.max(.3,Math.min(.82,.78-distance/140)),p={...xy,pressure:resolveBrushPressure(activePointerType,e.pressure,fallbackPressure)};if(shapeTools.has(tool)){points=[p];active.setAttribute("d",previewPath());return}if(!last||distance>=.5){points.push(p);if(!rasterBrushTools.has(tool)&&!(tool==="eraser"&&layer().type==="raster"))active.setAttribute("d",previewPath())}}
function move(e){if(nodeDrag){const targetLayer=frame().layers.find(l=>l.id===nodeDrag.layerId),operation=targetLayer?.operations.find(op=>op.id===nodeDrag.operationId);if(!targetLayer||targetLayer.locked||!operation)return;try{const p=coords(e);const d=nodeDrag.type==="control"?movePathControlPoint(nodeDrag.startPath,nodeDrag.index,p.x,p.y):movePathAnchor(nodeDrag.startPath,nodeDrag.index,p.x,p.y);operation.path=validatePath({...operation.path,d});renderFrame(art,frame());renderSelection()}catch(error){status("تعذر تحريك نقطة المسار: "+error.message,false)}return}if(panGesture){setViewBox(panGesture.x-(e.clientX-panGesture.clientX)*panGesture.ratioX,panGesture.y-(e.clientY-panGesture.clientY)*panGesture.ratioY,canvas.viewBox.baseVal.width,canvas.viewBox.baseVal.height);return}if(selectionDrag){const p=coords(e);selectionLayer.setAttribute("transform","translate("+(p.x-selectionDrag.start.x)+" "+(p.y-selectionDrag.start.y)+")");return}if(!drawing)return;const samples=e.getCoalescedEvents?.()||[e];samples.forEach(addPoint);if(rasterBrushTools.has(tool)||(tool==="eraser"&&layer().type==="raster"))updateRasterPreview()}
function end(e){if(nodeDrag){const drag=nodeDrag,targetLayer=frame().layers.find(l=>l.id===nodeDrag.layerId),operation=targetLayer?.operations.find(op=>op.id===nodeDrag.operationId);nodeDrag=null;if(operation?.path.d===drag.startPath&&history.length>drag.historyLength){history.pop();buttons()}render();status("تم تعديل نقطة المسار المتجهي.");return}if(panGesture){panGesture=null;return}if(selectionDrag){const p=coords(e),dx=p.x-selectionDrag.start.x,dy=p.y-selectionDrag.start.y;selectionLayer.removeAttribute("transform");const drag=selectionDrag;selectionDrag=null;if(Math.abs(dx)>.3||Math.abs(dy)>.3){const targetLayer=frame().layers.find(l=>l.id===selection?.layerId);if(!targetLayer||targetLayer.locked)status("الطبقة المحددة مقفلة؛ لم يتحرك العنصر.",false);else try{snapshot();translateOperation(targetLayer,selection.operationId,dx,dy);render();status("تم تحريك العنصر المتجهي.")}catch(error){status("تعذر تحريك العنصر: "+error.message,false);renderSelection()}}else renderSelection();return}if(!drawing)return;if(Number.isFinite(e?.clientX)&&Number.isFinite(e?.clientY))addPoint(e);if(rasterBrushTools.has(tool)||(tool==="eraser"&&layer().type==="raster"))updateRasterPreview();drawing=false;if(points.length){if(rasterBrushTools.has(tool)||(tool==="eraser"&&layer().type==="raster")){const target=layer(),strokePoints=points.map(point=>({...point}));snapshot();const options=rasterBrushOptions();points=[];startPoint=null;activePointerType="mouse";active.setAttribute("d","");active.setAttribute("fill","none");clearRasterPreview();rasterCommitPending=true;commitRasterBrushStroke(target,strokePoints,options).then(result=>{rasterCommitPending=false;render();status(options.erase?"مُحيت بكسلات من طبقة Raster.":"رُسمت ضربة Raster فعلية · "+(result.renderMode==="continuous-ribbon"?"مسار فرشاة متصل":result.renderMode==="leaf-marks"?"علامات أوراق":"غسلة مائية")+" · "+options.brush);}).catch(error=>{rasterCommitPending=false;history.pop();buttons();status("تعذر حفظ ضربة الفرشاة: "+error.message,false)});return;}const d=previewPath();if(d){snapshot();const color=$("strokeColor").value,pressureActive=$("pressureToggle").checked&&activePointerType==="pen"&&tool==="pen",width=tool==="eraser"?Math.max(18,+$("strokeWidth").value*4):pressureActive?.2:+$("strokeWidth").value;const p=validatePath({d,stroke:tool==="eraser"?"#000":pressureActive?"none":color,width,fill:pressureActive||(tool==="rect"||tool==="ellipse")&&$("fillShapeToggle").checked?color:"none"});appendOperation(layer(),tool==="eraser"?"erase":"stroke",p);render()}}points=[];startPoint=null;activePointerType="mouse";active.setAttribute("d","");active.setAttribute("fill","none")}
function cancel(){if(nodeDrag){const drag=nodeDrag,targetLayer=frame().layers.find(l=>l.id===drag.layerId),operation=targetLayer?.operations.find(op=>op.id===drag.operationId);if(operation)operation.path=validatePath({...operation.path,d:drag.startPath});nodeDrag=null;if(history.length>drag.historyLength)history.pop();future=[];buttons();render();return}if(panGesture){const view=panGesture;panGesture=null;setViewBox(view.x,view.y,view.width,view.height);return}if(selectionDrag){selectionDrag=null;selectionLayer.removeAttribute("transform");renderSelection();return}if(!drawing)return;drawing=false;points=[];startPoint=null;clearRasterPreview();active.setAttribute("d","");active.setAttribute("fill","none")}
canvas.addEventListener("pointerdown",start);canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerup",end);canvas.addEventListener("pointercancel",cancel);canvas.addEventListener("lostpointercapture",end);
$("nodeEditBtn").onclick=()=>{if(!selection)return;nodeEditing=!nodeEditing;renderSelection();status(nodeEditing?"تم تفعيل تحرير نقاط المسار. اسحب النقاط البرتقالية أو مقابض المنحنيات البنفسجية.":"تم إيقاف تحرير نقاط المسار.")};$("toolPalette").querySelectorAll("[data-tool]").forEach(b=>b.onclick=()=>{tool=b.dataset.tool;if(!["select","pan"].includes(tool)){selection=null;nodeEditing=false;renderSelection()}$("toolPalette").querySelectorAll("[data-tool]").forEach(x=>x.classList.toggle("active",x===b));$("fillShapeControl").hidden=!shapeTools.has(tool);$("rasterBrushControls").hidden=!rasterBrushTools.has(tool);if(rasterBrushTools.has(tool))status(tool==="raster-pencil"?"قلم رصاص Raster: خطوط جرافيت حقيقية على طبقة نقطية.":"فرشاة Raster: اختر خامة الألوان والملمس ثم ارسم بحرية.")});$("zoomInBtn").onclick=()=>zoomCanvas(1.25);$("zoomOutBtn").onclick=()=>zoomCanvas(.8);$("zoomResetBtn").onclick=resetCanvasView;$("strokeWidth").oninput=e=>$("widthValue").value=e.target.value;$("onionToggle").onchange=render;$("undoBtn").onclick=undo;$("redoBtn").onclick=redo;$("applyStyleBtn").onclick=()=>{if(!selection)return;const targetLayer=frame().layers.find(l=>l.id===selection.layerId);if(!targetLayer||targetLayer.locked){status("افتح الطبقة أولاً لتعديل العنصر.",false);return}try{const op=targetLayer.operations.find(item=>item.id===selection.operationId);if(!op)throw Error("العنصر المحدد غير موجود");const color=$("strokeColor").value,width=+$("strokeWidth").value;const patch=op.path.stroke==="none"?{fill:color,stroke:"none"}:{stroke:color,fill:op.path.fill==="none"?"none":color,width};snapshot();updateOperation(targetLayer,selection.operationId,patch);render();status("تم تحديث لون/سماكة العنصر المحدد.")}catch(error){status("تعذر تعديل العنصر: "+error.message,false)}};
$("duplicateSelectionBtn").onclick=()=>{if(!selection)return;const targetLayer=frame().layers.find(l=>l.id===selection.layerId);if(!targetLayer||targetLayer.locked){status("افتح الطبقة أولاً لنسخ العنصر.",false);return}try{snapshot();const copy=duplicateOperation(targetLayer,selection.operationId);selection.operationId=copy.id;render();status("تم تكرار العنصر المتجهي.")}catch(error){status("تعذر تكرار العنصر: "+error.message,false)}};
$("deleteSelectionBtn").onclick=()=>{if(!selection)return;const targetLayer=frame().layers.find(l=>l.id===selection.layerId);if(!targetLayer||targetLayer.locked){status("افتح الطبقة أولاً لحذف العنصر.",false);return}try{snapshot();removeOperation(targetLayer,selection.operationId);selection=null;render();status("تم حذف العنصر المحدد.")}catch(error){status("تعذر حذف العنصر: "+error.message,false)}};
$("addBackgroundBtn").onclick=()=>{try{const preset=$("backgroundPreset").value;snapshot();const added=addBackgroundToFrame(frame(),preset);activeLayerId=added[added.length-1].id;selection=null;render();$("backgroundStatus").textContent="أضيفت خلفية "+(BACKGROUND_PRESETS.find(item=>item.id===preset)?.name||preset)+" في "+added.length+" طبقات متجهية مستقلة خلف الرسومات الحالية."}catch(error){$("backgroundStatus").textContent="تعذرت إضافة الخلفية: "+error.message}};
$("addLayerBtn").onclick=()=>{snapshot();const l=addLayer(frame());activeLayerId=l.id;render()};
$("importRasterBtn").onclick=()=>$("rasterFileInput").click();
$("rasterFileInput").onchange=event=>{
 const file=event.target.files?.[0];event.target.value="";
 if(!file)return;
 const statusNode=$("rasterImportStatus");
 if(!["image/png","image/webp","image/jpeg"].includes(file.type)){statusNode.textContent="نوع الصورة غير مدعوم. اختر PNG أو WebP أو JPEG.";return}
 if(file.size<1||file.size>16*1024*1024){statusNode.textContent="حجم الصورة يجب ألا يتجاوز 16 ميغابايت.";return}
 const reader=new FileReader();
 reader.onerror=()=>{statusNode.textContent="تعذرت قراءة ملف الصورة."};
 reader.onload=()=>{
  const dataUrl=String(reader.result||""),image=new Image();
  image.onerror=()=>{statusNode.textContent="ملف الصورة تالف أو غير قابل للقراءة."};
  image.onload=()=>{
   try{
    snapshot();
    const raster=addRasterLayer(frame(),{name:file.name.replace(/\.[^.]+$/,"").slice(0,80)||"رسم نقطي",dataUrl,mimeType:file.type,width:image.naturalWidth,height:image.naturalHeight});
    activeLayerId=raster.id;selection=null;render();
    statusNode.textContent="استوردت الصورة كطبقة Raster مستقلة ("+image.naturalWidth+" × "+image.naturalHeight+"). يمكنك ترتيبها مع طبقات SVG وحفظ المشروع.";
   }catch(error){statusNode.textContent="تعذر استيراد الصورة: "+error.message}
  };
  image.src=dataUrl;
 };
 reader.readAsDataURL(file);
};

$("createCharacterFromFrameBtn").onclick=()=>{const before=history.length;try{const model=createCharacterModelFromFrame(frame(),$("characterDraftName").value);snapshot(true);const entry=saveCharacterToLibrary(project,model,model.name);selectedCharacterModel=model;rigModel=null;renderRigEditor();renderCharacterLibrary();$("characterLibrarySelect").value=entry.id;renderCharacterLibrary();$("characterStatus").textContent="تم تحويل رسومات الإطار إلى نموذج شخصية قابل للتحرير وحفظه في المكتبة: "+entry.name+"."}catch(error){if(history.length>before)history.pop();buttons();$("characterStatus").textContent="تعذر تحويل الإطار إلى شخصية: "+error.message}};
$("saveCharacterLibraryBtn").onclick=()=>{const before=history.length;try{const model=characterModelSelection();validateCharacterModel(model);snapshot(true);const entry=saveCharacterToLibrary(project,model,model.name);renderCharacterLibrary();$("characterLibrarySelect").value=entry.id;renderCharacterLibrary();$("characterStatus").textContent="حُفظت "+entry.name+" في مكتبة هذا المشروع."}catch(error){if(history.length>before)history.pop();buttons();$("characterStatus").textContent="تعذر حفظ الشخصية: "+error.message}};
$("loadCharacterLibraryBtn").onclick=()=>{try{const model=loadCharacterFromLibrary(project,$("characterLibrarySelect").value);selectedCharacterModel=model;rigModel=model.rig?model:null;$("characterView").value=model.view||"front";$("characterPose").value=model.pose||"neutral";$("characterExpression").value=model.expression||"neutral";for(const key of ["line","skin","hair","cloth","accent"])if(model.palette?.[key])$("character"+key[0].toUpperCase()+key.slice(1)).value=model.palette[key];renderRigEditor();$("characterStatus").textContent="تم تحميل "+model.name+" من مكتبة المشروع."}catch(error){$("characterStatus").textContent="تعذر تحميل الشخصية: "+error.message}};
$("deleteCharacterLibraryBtn").onclick=()=>{try{const id=$("characterLibrarySelect").value,entry=(project.characterLibrary||[]).find(item=>item.id===id);if(!entry)throw Error("اختر شخصية من المكتبة أولاً");snapshot(true);removeCharacterFromLibrary(project,id);if(selectedCharacterModel?.id===entry.model.id)resetRigModel();renderCharacterLibrary();$("characterStatus").textContent="حُذفت "+entry.name+" من مكتبة المشروع."}catch(error){$("characterStatus").textContent="تعذر حذف الشخصية: "+error.message}};
$("characterLibrarySelect").onchange=renderCharacterLibrary;

$("copyCharacterToNextFrameBtn").onclick=()=>{const instanceId=$("characterInstanceSelect").value;if(!instanceId){$("characterStatus").textContent="اختر مثيل شخصية من الإطار الحالي أولاً.";return}const before=history.length;try{const source=frame();snapshot();let target=project.frames[current+1];if(!target){if(project.frames.length>=600)throw Error("بلغ المشروع حد 600 إطار");target=createFrame();project.frames.splice(current+1,0,target)}const copies=copyCharacterInstanceToFrame(source,target,instanceId);render();$("characterStatus").textContent="نُسخت الشخصية نفسها إلى الإطار التالي مع الحفاظ على هوية المثيل في "+copies.length+" طبقات."}catch(error){if(history.length>before){const previous=history.pop();future=[];project=JSON.parse(previous);render();buttons()}$("characterStatus").textContent="تعذر نسخ الشخصية: "+error.message}};
$("updateCharacterInstanceBtn").onclick=()=>{const instanceId=$("characterInstanceSelect").value;if(!instanceId){$("characterStatus").textContent="اختر مثيل شخصية من الإطار الحالي أولاً.";return}const before=history.length;try{const model=characterModelSelection();snapshot();const updated=replaceCharacterInstanceInFrame(frame(),instanceId,model);activeLayerId=updated[updated.length-1].id;selection=null;render();$("characterStatus").textContent="تم تحديث الشخصية المحددة في هذا الإطار مع الحفاظ على معرّفها المشترك."}catch(error){if(history.length>before){const previous=history.pop();future=[];project=JSON.parse(previous);render();buttons()}$("characterStatus").textContent="تعذر تحديث الشخصية: "+error.message}};
$("interpolateRigBtn").onclick=()=>{try{const start=loadCharacterFromLibrary(project,$("rigBlendStartSelect").value),end=loadCharacterFromLibrary(project,$("rigBlendEndSelect").value),progress=+$("rigBlendProgress").value;const model=interpolateNoriRigModels(start,end,progress);selectedCharacterModel=model;rigModel=model;$("characterView").value=model.view||"front";$("characterPose").value="neutral";$("characterExpression").value="neutral";renderRigEditor();$("characterStatus").textContent="تم إنشاء وضعية وسيطة بنسبة "+Math.round(progress*100)+"٪. أضفها إلى الإطار أو احفظها في المكتبة."}catch(error){$("characterStatus").textContent="تعذر إنشاء الوضعية الوسيطة: "+error.message}};
$("rigBlendProgress").oninput=e=>$("rigBlendValue").textContent=Math.round(+e.target.value*100)+"٪";

$("exportCharacterSheetBtn").onclick=()=>{try{const svg=createNoriModelSheetSvg({line:$("characterLine").value,skin:$("characterSkin").value,hair:$("characterHair").value,cloth:$("characterCloth").value,accent:$("characterAccent").value});download("nori-model-sheet.svg",new Blob([svg],{type:"image/svg+xml"}));$("characterStatus").textContent="تم تصدير ورقة Nori المتجهية: 3 اتجاهات و4 تعبيرات و4 وضعيات."}catch(error){$("characterStatus").textContent="تعذر إنشاء ورقة النموذج: "+error.message}};
$("exportCharacterBtn").onclick=()=>{try{const model=characterModelSelection();download((model.name.replace(/[^\\p{L}\\p{N}-]+/gu,"-")||"character")+".zchar",new Blob([JSON.stringify(model,null,2)],{type:"application/json"}));$("characterStatus").textContent="تم تصدير نموذج الشخصية كملف ZCHAR مستقل."}catch(error){$("characterStatus").textContent="تعذر التصدير: "+error.message}};
$("importCharacterBtn").onclick=()=>$("characterFile").click();
$("characterFile").onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>5*1024*1024)throw Error("ملف الشخصية أكبر من 5 ميغابايت");selectedCharacterModel=validateCharacterModel(JSON.parse(await file.text()));rigModel=selectedCharacterModel.rig?selectedCharacterModel:null;renderRigEditor();$("characterStatus").textContent="تم تحميل "+selectedCharacterModel.name+". سيُضاف هذا النموذج عند الضغط على زر الإضافة."}catch(error){selectedCharacterModel=null;resetRigModel();$("characterStatus").textContent="ملف شخصية غير صالح: "+error.message}finally{e.target.value=""}};
$("useNoriBtn").onclick=()=>{resetRigModel();$("characterStatus").textContent="تم اختيار نموذج Nori المدمج."};
$("bodyRotationRange").oninput=()=>{try{const model=rotateNoriBody(characterModelSelection(),+$("bodyRotationRange").value);selectedCharacterModel=model;rigModel=model;$("bodyRotationValue").textContent=model.rig.bodyRotation+"°";renderRigEditor()}catch(error){$("characterStatus").textContent="تعذر إمالة الجسم: "+error.message}};
$("headRotationRange").oninput=()=>{try{const model=rotateNoriHead(characterModelSelection(),+$("headRotationRange").value);selectedCharacterModel=model;rigModel=model;$("headRotationValue").textContent=model.rig.headRotation+"°";renderRigEditor()}catch(error){$("characterStatus").textContent="تعذر تدوير الرأس: "+error.message}};
$("resetRigBtn").onclick=()=>{resetRigModel();$("characterStatus").textContent="أعيدت المفاصل إلى الوضعية المحددة."};
for(const id of ["characterView","characterPose","characterExpression"]){$(id).onchange=()=>resetRigModel()}
for(const id of ["characterLine","characterSkin","characterHair","characterCloth","characterAccent"]){$(id).onchange=()=>updateRigPalette()}
rigCanvas.addEventListener("pointerdown",e=>{
 const target=e.target.closest?.("[data-joint]");if(!target||selectedCharacterModel&&!selectedCharacterModel.rig)return;
 rigDrag={joint:target.getAttribute("data-joint"),startModel:JSON.parse(JSON.stringify(rigModel))};
 rigCanvas.setPointerCapture?.(e.pointerId);e.preventDefault();
});
rigCanvas.addEventListener("pointermove",e=>{
 if(!rigDrag)return;
 const position=rigCoords(e);
 rigModel=solveNoriRigJoint(rigDrag.startModel,rigDrag.joint,position);
 renderRigEditor();
});
rigCanvas.addEventListener("pointerup",()=>{if(!rigDrag)return;rigDrag=null;$("characterStatus").textContent="تم تعديل وضعية المفصل؛ ستضاف الشخصية بهذه الوضعية."});
rigCanvas.addEventListener("pointercancel",()=>{if(!rigDrag)return;rigModel=rigDrag.startModel;rigDrag=null;renderRigEditor()});
rigCanvas.addEventListener("lostpointercapture",()=>{if(!rigDrag)return;rigModel=rigDrag.startModel;rigDrag=null;renderRigEditor()});
$("addCharacterBtn").onclick=()=>{try{const model=characterModelSelection();const needed=new Set(model.parts.filter(part=>part.visible!==false).map(part=>part.layer)).size;if(frame().layers.length+needed>100)throw Error("لا توجد مساحة كافية لطبقات الشخصية");snapshot();const added=addCharacterModelToFrame(frame(),model);if(!added.length)throw Error("النموذج لا يحتوي على أجزاء ظاهرة");activeLayerId=added[added.length-1].id;render();$("characterStatus").textContent="أضيف "+model.name+" إلى "+added.length+" طبقات متجهية مستقلة."}catch(error){$("characterStatus").textContent="تعذر إضافة النموذج: "+error.message}};
$("deleteLayerBtn").onclick=()=>{snapshot();try{removeLayer(frame(),activeLayerId);activeLayerId=frame().layers[0].id;render()}catch(e){history.pop();buttons();status(e.message,false)}};
$("addFrameBtn").onclick=()=>{if(project.frames.length>=MAX_FRAMES)return alert("وصل المشروع إلى الحد الأعلى البالغ 30000 إطار.");snapshot();project.frames.splice(current+1,0,createFrame());current++;activeLayerId=frame().layers[0].id;render()};
$("framePagePrev").onclick=()=>{current=Math.max(0,Math.floor(current/TIMELINE_PAGE_SIZE)*TIMELINE_PAGE_SIZE-TIMELINE_PAGE_SIZE);activeLayerId=frame().layers[0].id;render()};$("framePageNext").onclick=()=>{current=Math.min(project.frames.length-1,(Math.floor(current/TIMELINE_PAGE_SIZE)+1)*TIMELINE_PAGE_SIZE);activeLayerId=frame().layers[0].id;render()};$("frameJumpBtn").onclick=()=>{const value=Number($("frameJumpInput").value);if(!Number.isInteger(value)||value<1||value>project.frames.length){status("أدخل رقم إطار بين 1 و"+project.frames.length,false);return}stop();current=value-1;activeLayerId=frame().layers[0].id;render()};$("frameJumpInput").addEventListener("keydown",event=>{if(event.key==="Enter")$("frameJumpBtn").click()});$("analyzeCadenceBtn").onclick=()=>{try{const report=analyzeDrawingCadence(project.frames,+$("fpsSelect").value),rate=report.uniqueDrawingsPerSecond;const target=report.meets24UniqueDrawingsPerSecond?"تحقق الهدف العددي: 24 رسمة مستقلة/ثانية أو أكثر.":"لم يتحقق هدف 24 رسمة مستقلة/ثانية بعد.";const output="الإطارات: "+report.frameCount+" · الرسومات الفريدة: "+report.uniqueDrawingCount+" · المكررة: "+report.duplicateDrawingCount+" · المعدل الفعلي: "+rate+" رسمة/ثانية. "+target;$("cadenceStatus").textContent=output;$("cadenceStatus").style.color=report.meets24UniqueDrawingsPerSecond?"var(--accent)":"#ff9999"}catch(error){$("cadenceStatus").textContent="تعذر القياس: "+error.message;$("cadenceStatus").style.color="#ff9999"}};
$("inbetweenBtn").onclick=()=>{if(current>=project.frames.length-1){status("اختر إطاراً يليه إطار مفتاحي ثانٍ.",false);return}try{const generated=createInbetweenFrames(frame(),project.frames[current+1],+$("inbetweenCount").value);if(project.frames.length+generated.length>MAX_FRAMES)throw Error("سيتم تجاوز الحد الأعلى البالغ 30000 إطار.");snapshot();project.frames.splice(current+1,0,...generated);current++;activeLayerId=frame().layers[0].id;render();status("تم توليد "+generated.length+" إطار وسيط قابل للتحرير.")}catch(error){status("تعذر التوليد: "+error.message,false)}};
$("duplicateFrameBtn").onclick=()=>{if(project.frames.length>=600)return alert("الحد التجريبي 600 إطار");snapshot();const copy=JSON.parse(JSON.stringify(frame()));copy.id=uid("frame");delete copy.animeRaster;copy.layers.forEach(l=>l.id=uid("layer"));project.frames.splice(current+1,0,copy);current++;activeLayerId=frame().layers[0].id;render()};
$("deleteFrameBtn").onclick=()=>{if(project.frames.length===1)return alert("يجب إبقاء إطار واحد على الأقل");snapshot();project.frames.splice(current,1);current=Math.max(0,current-1);activeLayerId=frame().layers[0].id;render()};
function data(){return{...project,name:$("projectName").value.trim()||"مشروع بدون اسم",fps:+$("fpsSelect").value}}function download(name,blob){const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1500)}
$("saveBtn").onclick=()=>{const p=data();download((p.name.replace(/[^\p{L}\p{N}-]+/gu,"-")||"zero-project")+".zero",new Blob([JSON.stringify(p,null,2)],{type:"application/json"}));$("saveState").textContent="تم تنزيل نسخة الحفظ"};$("openBtn").onclick=()=>$("openFile").click();
$("openFile").onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>128*1024*1024)throw Error("الملف أكبر من 128 ميغابايت؛ قسّم المشروع إلى أجزاء أصغر على الهاتف.");const next=normalizeProject(JSON.parse(await file.text()));snapshot(false,true);project=next;current=0;activeLayerId=frame().layers[0].id;selection=null;activeAnimeMotionPlan=null;activeAnimeAnatomySequence=null;$("animeAnatomyGuideToggleLabel").hidden=true;$("animeAnatomyConstructionLayer").replaceChildren();renderCharacterLibrary();renderAnimeAnatomyDNASelect();$("projectName").value=project.name;$("fpsSelect").value=String(project.fps);render();$("saveState").textContent="تم فتح المشروع"}catch(err){alert("تعذر فتح المشروع: "+err.message)}finally{e.target.value=""}};
$("exportBtn").onclick=()=>{const p=data(),bundle={format:"zero-studio-svg-sequence",version:2,name:p.name,width:WIDTH,height:HEIGHT,fps:p.fps,frames:p.frames.map((f,i)=>({name:"frame-"+String(i+1).padStart(4,"0")+".svg",svg:frameSvg(f,"frame-"+i,p.animationBackground||[])}))};download("zero-studio-svg-sequence.json",new Blob([JSON.stringify(bundle,null,2)],{type:"application/json"}));$("saveState").textContent="تم تصدير تسلسل SVG"};$("exportZipBtn").onclick=()=>{try{const p=data(),frames=p.frames.map((f,i)=>({name:"frames/frame-"+String(i+1).padStart(4,"0")+".svg",svg:frameSvg(f,"zip-frame-"+i,p.animationBackground||[])})),cadence=analyzeDrawingCadence(p.frames,p.fps),manifest={format:"zero-studio-project-bundle",version:1,project:"project.zero",frameCount:frames.length,fps:p.fps,cadence,width:WIDTH,height:HEIGHT,frames:frames.map(f=>f.name)},entries=[{name:"project.zero",data:JSON.stringify(p,null,2)},{name:"manifest.json",data:JSON.stringify(manifest,null,2)},...frames.map(f=>({name:f.name,data:f.svg}))],archive=createZip(entries);download("zero-studio-"+(p.name.replace(/[^\p{L}\p{N}-]+/gu,"-")||"project")+".zip",new Blob([archive],{type:"application/zip"}));$("saveState").textContent="تم إنشاء حزمة ZIP — "+entries.length+" ملفات"}catch(e){status("تعذر إنشاء ZIP: "+e.message,false)}};
function aiStatus(message,ok=true){$("aiStatus").textContent=message;$("aiStatus").style.color=ok?"var(--accent)":"#ff9999"}
function clearProposal(){proposedLayers=[];proposalTarget=null;proposal.replaceChildren();$("aiReview").hidden=true;$("aiApproveBtn").disabled=false}
async function animeLayersPreviewPng(layers){
 const svg=document.createElementNS(NS,"svg");svg.setAttribute("xmlns",NS);svg.setAttribute("width",WIDTH);svg.setAttribute("height",HEIGHT);svg.setAttribute("viewBox","0 0 "+WIDTH+" "+HEIGHT);
 const defs=canvas.querySelector("defs");if(defs)svg.appendChild(defs.cloneNode(true));
 for(const entry of layers){const group=document.createElementNS(NS,"g");group.setAttribute("data-layer",entry.name);for(const path of entry.operations){const node=document.createElementNS(NS,"path");node.setAttribute("d",path.d);node.setAttribute("fill",path.fill||"none");node.setAttribute("stroke",path.stroke||"none");node.setAttribute("stroke-width",String(path.width||1));node.setAttribute("stroke-linecap","round");node.setAttribute("stroke-linejoin","round");if(path.opacity!==undefined)node.setAttribute("opacity",String(path.opacity));if(path.filter)node.setAttribute("filter",path.filter);group.appendChild(node)}svg.appendChild(group)}
 const source=new XMLSerializer().serializeToString(svg),url=URL.createObjectURL(new Blob([source],{type:"image/svg+xml"}));
 try{const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error("تعذر تحويل معاينة الرسم إلى صورة للفحص."));image.src=url});const preview=document.createElement("canvas");preview.width=1280;preview.height=720;const ctx=preview.getContext("2d");if(!ctx)throw Error("تعذر إنشاء لوحة المعاينة.");ctx.drawImage(image,0,0,preview.width,preview.height);const blob=await new Promise(resolve=>preview.toBlob(resolve,"image/png"));if(!blob)throw Error("تعذر حفظ معاينة PNG.");return new Uint8Array(await blob.arrayBuffer())}finally{URL.revokeObjectURL(url)}
}
function renderAnimationProduction(){
 const job=project.animationProduction;
 if(!job){$("animationProductionStatus").textContent="لا توجد خطة حركة نشطة. أعدّ خطة، ثم أضف دفعات الإطارات المتجهية بالترتيب."; $("animationProgress").textContent="0 / 0"; $("nextAnimationBatchBtn").disabled=true;$("downloadAnimationPlanBtn").disabled=true;$("importAnimationBatchBtn").disabled=true;return}
 const percent=Math.round(job.completedFrames/job.totalFrames*100);
 $("animationProductionStatus").textContent=job.completedFrames===job.totalFrames?"اكتمل إدخال جميع الرسومات. راجع التسلسل وافحص عدد الرسومات المستقلة.":"اكتمل "+job.completedFrames+" من "+job.totalFrames+" رسمة ("+percent+"٪) · الدفعة التالية "+(job.nextBatchIndex+1)+" من "+job.batchCount+".";
 $("animationProgress").textContent=job.completedFrames+" / "+job.totalFrames+" · "+percent+"٪";
 $("nextAnimationBatchBtn").disabled=job.completedFrames===job.totalFrames;
 $("downloadAnimationPlanBtn").disabled=false;
 $("importAnimationBatchBtn").disabled=job.completedFrames===job.totalFrames;
}
$("setAnimationBackgroundBtn").onclick=()=>{try{if(project.animationProduction&&project.animationProduction.completedFrames>0)throw Error("لا يمكن تغيير الخلفية بعد بدء استيراد رسومات الحركة.");const source=frame().layers;if(!source.some(l=>l.operations.some(op=>op.kind==="stroke")))throw Error("ارسم الخلفية واعتمد طبقاتها أولاً.");if(source.reduce((sum,l)=>sum+l.operations.length,0)>2800)throw Error("الخلفية تتجاوز 2800 عملية متجهية.");snapshot();project.animationBackground=source.map((l,i)=>({...JSON.parse(JSON.stringify(l)),id:uid("background-layer"),name:"خلفية ثابتة "+(i+1)+" — "+l.name,locked:true}));frame().layers=[createLayer("رسومات متحركة")];activeLayerId=frame().layers[0].id;selection=null;render();status("حُفظت الخلفية كأصل ثابت مستقل. ستظهر تحت كل إطار ولن تُطلب من رسام الحركة مجدداً.");}catch(error){$("animationProductionStatus").textContent="تعذر فصل الخلفية: "+error.message}};
$("prepareAnimationBtn").onclick=()=>{
 try{
  const promptText=$("aiPrompt").value.trim(),durationSeconds=Number($("animationDuration").value),batchSize=Number($("animationBatchSize").value);
  const plan=createAnimationPlan(promptText,{durationSeconds,fps:24,batchSize});
  snapshot();beginAnimationProduction(project,plan);project.fps=24;$("fpsSelect").value="24";render();
  download("zero-studio-animation-plan.zplan",new Blob([JSON.stringify(project.animationProduction,null,2)],{type:"application/json"}));
  status("تم إعداد خطة "+plan.totalFrames+" رسمة في "+plan.batchCount+" دفعة. لم يبدأ الرسم بعد.");
 }catch(error){$("animationProductionStatus").textContent="تعذر إعداد الخطة: "+error.message}
};
$("downloadAnimationPlanBtn").onclick=()=>{
 try{if(!project.animationProduction)throw Error("لا توجد خطة نشطة.");download("zero-studio-animation-plan.zplan",new Blob([JSON.stringify(project.animationProduction,null,2)],{type:"application/json"}));}
 catch(error){$("animationProductionStatus").textContent=error.message}
};
$("nextAnimationBatchBtn").onclick=()=>{
 try{const job=project.animationProduction;if(!job||job.completedFrames>=job.totalFrames)throw Error("لا توجد دفعة متبقية.");const promptText=createAnimationBatchPrompt(job);download("zero-studio-batch-"+String(job.nextBatchIndex+1).padStart(4,"0")+".txt",new Blob([promptText],{type:"text/plain;charset=utf-8"}));$("animationProductionStatus").textContent="تم تجهيز تعليمات الدفعة "+(job.nextBatchIndex+1)+" من "+job.batchCount+". لم تُحسب هذه الدفعة رسماً حتى يتم استيراد ملفها .zbatch.";
 }catch(error){$("animationProductionStatus").textContent=error.message}
};
$("importAnimationBatchBtn").onclick=()=>$("animationBatchFile").click();
$("animationBatchFile").onchange=async event=>{
 const file=event.target.files?.[0];if(!file)return;
 const previousCurrent=current;let tookSnapshot=false;
 try{
  if(file.size>32*1024*1024)throw Error("ملف الدفعة أكبر من 32 ميغابايت.");
  const payload=JSON.parse(await file.text());current=project.frames.length-1;snapshot();tookSnapshot=true;
  const result=appendAnimationBatch(project,payload);
  current=project.frames.length-1;activeLayerId=frame().layers[0].id;selection=null;render();
  $("animationProductionStatus").textContent="تم قبول "+result.addedFrames+" رسومات متجهية مستقلة. التقدم "+result.completedFrames+" / "+result.totalFrames+".";
  $("saveState").textContent="احفظ نسخة .zero لاستكمال العمل لاحقاً";
 }catch(error){if(tookSnapshot){history.pop();current=previousCurrent;buttons()}$("animationProductionStatus").textContent="رُفضت الدفعة دون إضافتها: "+error.message}
 finally{event.target.value=""}
};
let generatedRasterAsset=null;
let confirmedGalleryItems=[];
const GALLERY_LOCAL_CACHE_KEY="zero-studio-gallery-confirmed-v1";
const CHARACTER_REFERENCE_CACHE_KEY="zero-studio-character-references-v1";
let characterReferenceImages=[];
function persistCharacterReferences(){
 try{localStorage.setItem(CHARACTER_REFERENCE_CACHE_KEY,JSON.stringify(characterReferenceImages.slice(0,4)))}catch{
  const status=$("characterReferenceStatus");
  if(status)status.textContent="المراجع متاحة لهذه الجلسة، لكن مساحة تخزين الهاتف لم تسمح بحفظها بعد إغلاق الاستوديو.";
 }
}
function readSavedCharacterReferences(){
 try{
  const parsed=JSON.parse(localStorage.getItem(CHARACTER_REFERENCE_CACHE_KEY)||"[]");
  if(Array.isArray(parsed))characterReferenceImages=parsed.filter(item=>item&&typeof item.dataUrl==="string"&&item.dataUrl.startsWith("data:image/jpeg;base64,")&&item.dataUrl.length<=699000).slice(0,4);
 }catch{characterReferenceImages=[]}
}
function renderCharacterReferences(){
 const list=$("characterReferenceList"),status=$("characterReferenceStatus");
 if(!list||!status)return;
 list.replaceChildren();
 characterReferenceImages.forEach((reference,index)=>{
  const card=document.createElement("div");card.className="character-reference-item";
  const image=document.createElement("img");image.src=reference.dataUrl;image.alt=reference.name||"مرجع شخصية";
  const details=document.createElement("div");details.className="character-reference-details";
  const title=document.createElement("strong");title.textContent=(index===0?"المرجع الأساسي":"مرجع إضافي")+" · "+(reference.name||"صورة شخصية");
  const remove=document.createElement("button");remove.type="button";remove.className="secondary";remove.textContent="إزالة";
  remove.onclick=()=>{characterReferenceImages.splice(index,1);persistCharacterReferences();renderCharacterReferences();syncImageGenerationModelControls()};
  details.append(title,remove);card.append(image,details);list.appendChild(card);
 });
 status.textContent=characterReferenceImages.length
  ? characterReferenceImages.length+" / 4 مراجع نشطة. المرجع الأول يحدد هوية الشخصية، والبقية تدعم تفاصيلها وزواياها."
  : "لا توجد مراجع نشطة. أضف صورة شخصية أصلية قبل طلب زاوية أو وضعية جديدة.";
}
async function normalizeCharacterReference(source,name){
 const image=new Image();
 await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error("تعذر فتح صورة المرجع."));image.src=source});
 if(!image.naturalWidth||!image.naturalHeight)throw Error("أبعاد صورة المرجع غير صالحة.");
 let scale=Math.min(1,511/Math.max(image.naturalWidth,image.naturalHeight));
 for(let pass=0;pass<8;pass++){
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  const context=canvas.getContext("2d");if(!context)throw Error("تعذر تجهيز صورة المرجع على الهاتف.");
  context.fillStyle="#fff";context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
  for(const quality of [.88,.82,.76,.7,.64]){
   const dataUrl=canvas.toDataURL("image/jpeg",quality);
   if(dataUrl.length<=349000)return{name:String(name||"مرجع شخصية").slice(0,100),dataUrl,mimeType:"image/jpeg",width:canvas.width,height:canvas.height};
  }
  scale*=.82;
 }
 throw Error("تعذر ضغط المرجع إلى الحجم الآمن البالغ نحو 256 كيلوبايت.");
}
async function setPrimaryCharacterReference(source,name){
 const reference=await normalizeCharacterReference(source,name);
 characterReferenceImages=[reference,...characterReferenceImages.filter(item=>item.dataUrl!==reference.dataUrl).slice(0,3)];
 persistCharacterReferences();renderCharacterReferences();
 const model=$("imageGenerationModel");if(model){model.value="flux-2-klein-4b";syncImageGenerationModelControls()}
 const status=$("imageGenerationStatus");if(status)status.textContent="اعتمدت الصورة مرجعاً أساسياً. ستُرسل الآن إلى FLUX.2 مع كل طلب توليد حتى تزيلها.";
}
async function addCharacterReferenceFiles(files){
 const selected=Array.from(files||[]).slice(0,4-characterReferenceImages.length);
 if(!selected.length)throw Error(characterReferenceImages.length>=4?"اكتملت المراجع الأربعة. أزل مرجعاً أولاً.":"اختر صورة واحدة على الأقل.");
 for(const file of selected){
  if(!/^image\/(?:png|jpeg|webp)$/.test(file.type||""))throw Error("اختر صور PNG أو JPEG أو WebP فقط.");
  if(file.size>12*1024*1024)throw Error("حجم ملف الصورة الأصلي أكبر من 12 ميغابايت.");
  const source=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||""));reader.onerror=()=>reject(Error("تعذر قراءة ملف الصورة."));reader.readAsDataURL(file)});
  characterReferenceImages.push(await normalizeCharacterReference(source,file.name));
 }
 characterReferenceImages=characterReferenceImages.slice(0,4);persistCharacterReferences();renderCharacterReferences();
 const model=$("imageGenerationModel");if(model){model.value="flux-2-klein-4b";syncImageGenerationModelControls()}
}
function createGalleryReferenceButton(item,statusNode){
 const button=document.createElement("button");button.type="button";button.className="secondary";button.textContent="استخدام كمرجع للشخصية";
 button.onclick=async()=>{
  button.disabled=true;
  if(statusNode)statusNode.textContent="يجلب الصورة من المعرض ويجهزها كمرجع…";
  try{
   const response=await fetch("/api/gallery-image?id="+encodeURIComponent(item.id),{method:"GET",cache:"no-store",headers:{"Accept":"application/json"}});
   const payload=await response.json().catch(()=>({}));
   if(!response.ok||payload.ok!==true||typeof payload.imageDataUrl!=="string")throw Error(payload.message||payload.error||"تعذر تحميل صورة المعرض.");
   await setPrimaryCharacterReference(payload.imageDataUrl,item.title||"مرجع من المعرض");
   if(statusNode)statusNode.textContent="تم اعتماد الصورة مرجعاً للشخصية.";
  }catch(error){if(statusNode)statusNode.textContent=error.message||"تعذر اعتماد الصورة مرجعاً."}
  finally{button.disabled=false}
 };
 return button;
}
readSavedCharacterReferences();
function readConfirmedGalleryItems(){
 const cutoff=Date.now()-30*24*60*60*1000;
 let stored=[];
 try{const parsed=JSON.parse(localStorage.getItem(GALLERY_LOCAL_CACHE_KEY)||"[]");if(Array.isArray(parsed))stored=parsed}catch{}
 const merged=new Map();
 for(const item of [...confirmedGalleryItems,...stored]){
  if(!item||typeof item.id!=="string"||typeof item.shareUrl!=="string")continue;
  const created=Date.parse(item.createdAt||"");
  if(!Number.isFinite(created)||created<cutoff)continue;
  merged.set(item.id,item);
 }
 return [...merged.values()];
}
function rememberConfirmedGalleryItem(item){
 if(!item||typeof item.id!=="string"||typeof item.shareUrl!=="string")return;
 confirmedGalleryItems=[item,...confirmedGalleryItems.filter(entry=>entry.id!==item.id)].slice(0,100);
 try{localStorage.setItem(GALLERY_LOCAL_CACHE_KEY,JSON.stringify(readConfirmedGalleryItems().slice(0,100)))}catch{}
}
async function refreshProductionGallery(){
 const list=$("productionGalleryList"),status=$("productionGalleryStatus");
 if(!list||!status)return;
 status.textContent="يحمّل الصور المحفوظة…";
 try{
  const response=await fetch("/api/gallery",{method:"GET",cache:"no-store",headers:{"Accept":"application/json"}});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok||payload.ok!==true)throw Error(payload.message||payload.error||"تعذر تحميل المعرض.");
  const merged=new Map();
  for(const item of payload.items||[])if(item&&typeof item.id==="string"&&typeof item.shareUrl==="string")merged.set(item.id,item);
  for(const item of readConfirmedGalleryItems())if(!merged.has(item.id))merged.set(item.id,item);
  const items=[...merged.values()].sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
  list.replaceChildren();
  for(const item of items){
   const card=document.createElement("article");card.className="gallery-item";
   const link=document.createElement("a");link.href=item.shareUrl;link.target="_blank";link.rel="noopener noreferrer";link.className="gallery-image-link";
   const image=document.createElement("img");image.src=item.shareUrl;image.alt=item.title||"صورة محفوظة";image.loading="lazy";link.appendChild(image);
   const title=document.createElement("strong");title.textContent=item.title||"صورة مولدة";
   const date=document.createElement("small");date.textContent=item.createdAt?new Date(item.createdAt).toLocaleString():"";
   const actions=document.createElement("div");actions.className="gallery-item-actions";
   const share=document.createElement("a");share.href=item.shareUrl;share.target="_blank";share.rel="noopener noreferrer";share.textContent="فتح رابط الصورة";share.className="gallery-share-link";
   const copy=document.createElement("button");copy.type="button";copy.textContent="نسخ رابط المراجعة";copy.onclick=async()=>{try{await navigator.clipboard.writeText(item.shareUrl);status.textContent="نُسخ رابط الصورة. أرسله في المحادثة لأتمكن من مراجعتها."}catch{status.textContent=item.shareUrl}};
   actions.append(share,copy,createGalleryReferenceButton(item,status));card.append(link,title,date,actions);list.appendChild(card);
  }
  status.textContent=items.length+" صورة محفوظة. قد تتأخر قائمة Cloudflare KV العامة حتى 60 ثانية؛ الصور التي أكد الخادم حفظها تظهر هنا فوراً.";
 }catch(error){
  const confirmed=readConfirmedGalleryItems();
  if(confirmed.length){
   const merged=new Map(confirmed.map(item=>[item.id,item]));
   list.replaceChildren();
   for(const item of merged.values()){
    const card=document.createElement("article");card.className="gallery-item";
    const link=document.createElement("a");link.href=item.shareUrl;link.target="_blank";link.rel="noopener noreferrer";link.className="gallery-image-link";
    const image=document.createElement("img");image.src=item.shareUrl;image.alt=item.title||"صورة محفوظة";image.loading="lazy";link.appendChild(image);
    const title=document.createElement("strong");title.textContent=item.title||"صورة مولدة";
    const actions=document.createElement("div");actions.className="gallery-item-actions";
    const share=document.createElement("a");share.href=item.shareUrl;share.target="_blank";share.rel="noopener noreferrer";share.textContent="فتح رابط الصورة";share.className="gallery-share-link";
    actions.append(share,createGalleryReferenceButton(item,status));card.append(link,title,actions);list.appendChild(card);
   }
   status.textContent=confirmed.length+" صورة أكد الخادم حفظها. تعذر تحديث القائمة العامة مؤقتاً.";
  }else status.textContent=error.message||"تعذر تحميل المعرض.";
 }
}
async function prepareGalleryUploadDataUrl(asset){
 const source=String(asset?.dataUrl||"");
 const maxChars=2.5*1024*1024;
 if(!source.startsWith("data:image/"))throw Error("الصورة لا تحتوي على بيانات صورة صالحة.");
 if(source.length<=maxChars)return source;
 const image=new Image();
 await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error("تعذر تجهيز الصورة للحفظ."));image.src=source});
 if(!image.naturalWidth||!image.naturalHeight)throw Error("تعذر قراءة أبعاد الصورة للحفظ.");
 let scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight));
 for(let pass=0;pass<7;pass++){
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
  canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  const context=canvas.getContext("2d");
  if(!context)throw Error("تعذر إنشاء مساحة ضغط الصورة.");
  context.fillStyle="#fff";context.fillRect(0,0,canvas.width,canvas.height);
  context.drawImage(image,0,0,canvas.width,canvas.height);
  for(const quality of [0.9,0.84,0.78,0.72]){
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",quality));
   if(!blob)continue;
   const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||""));reader.onerror=()=>reject(Error("تعذر قراءة الصورة المضغوطة."));reader.readAsDataURL(blob)});
   if(dataUrl.length<=maxChars)return dataUrl;
  }
  scale*=0.84;
 }
 throw Error("تعذر ضغط الصورة إلى حجم الرفع الآمن. لم تُحذف الصورة الأصلية من الاستوديو.");
}
async function saveGeneratedImageToGallery(asset,prompt,model){
 const uploadImageDataUrl=await prepareGalleryUploadDataUrl(asset);
 const requestBody=JSON.stringify({imageDataUrl:uploadImageDataUrl,title:asset.name,prompt,model,width:asset.width,height:asset.height});
 if(new Blob([requestBody]).size>3*1024*1024)throw Error("حجم طلب الحفظ ما زال كبيراً بعد الضغط؛ لم يُرسل إلى الخادم.");
 const response=await fetch("/api/gallery",{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json","Accept":"application/json"},body:requestBody});
 const payload=await response.json().catch(()=>({}));
 if(!response.ok||payload.ok!==true||!payload.item?.shareUrl){
  const message=payload.message||payload.error||(response.status===413?"رفض الخادم حجم الصورة (413).":"تعذر حفظ الصورة في المعرض (HTTP "+response.status+").");
  throw Error(message);
 }
 asset.galleryItem=payload.item;
 rememberConfirmedGalleryItem(payload.item);
 const share=$("imageGenerationShareLink");
 if(share){share.href=payload.item.shareUrl;share.hidden=false}
 await refreshProductionGallery();
 return payload.item;
}
async function checkImageProviderConnection(){
 const statusNode=$("imageGenerationStatus");
 if(!statusNode)return;
 renderCharacterReferences();
 statusNode.textContent="يفحص اتصال الاستوديو بخدمة الصور دون توليد صورة…";
 try{
  const response=await fetch("/api/images",{method:"GET",cache:"no-store",headers:{"Accept":"application/json"}});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok||payload.ok!==true)throw Error(payload.message||payload.error||("فشل فحص الاتصال ("+response.status+")."));
  statusNode.textContent="الاتصال جاهز: Vercel وCloudflare متصلان ورمز الوصول صحيح. فحص الاتصال لم يستهلك حصة التوليد.";
 }catch(error){
  statusNode.textContent="تعذر تهيئة محرك الصور: "+(error.message||"خطأ اتصال غير معروف.")+" يمكنك إعادة تحميل الصفحة بعد إصلاح الإعداد.";
 }
}
function syncImageGenerationModelControls(){
 const model=$("imageGenerationModel");
 const aspectGroup=$("imageGenerationAspectGroup");
 if(model&&characterReferenceImages.length&&model.value!=="flux-2-klein-4b")model.value="flux-2-klein-4b";
 if(model&&aspectGroup)aspectGroup.hidden=model.value!=="flux-2-klein-4b";
}
$("imageGenerationModel")?.addEventListener("change",syncImageGenerationModelControls);
syncImageGenerationModelControls();
$("generateRasterImageBtn").onclick=async()=>{
 const promptText=$("imageGenerationPrompt").value.trim(),button=$("generateRasterImageBtn"),statusNode=$("imageGenerationStatus");
 const model=$("imageGenerationModel")?.value||"flux-1-schnell";
 const aspectRatio=$("imageGenerationAspectRatio")?.value||"16:9";
 const referenceCount=model==="flux-2-klein-4b"?characterReferenceImages.length:0;
 if(!promptText){statusNode.textContent="اكتب وصف الصورة أولاً.";return}
 button.disabled=true;$("importGeneratedRasterBtn").disabled=true;generatedRasterAsset=null;$("imageGenerationResult").hidden=true;
 statusNode.textContent=referenceCount?"يضغط المراجع لتقليل حجم الطلب، ثم يرسل FLUX.2 مع "+referenceCount+" صور مرجعية…":"يرسل طلب التوليد إلى Cloudflare Workers AI…";
 try{
  const normalizedReferences=model==="flux-2-klein-4b"?await Promise.all(characterReferenceImages.map(reference=>normalizeCharacterReference(reference.dataUrl,reference.name))):[];
  if(normalizedReferences.length){characterReferenceImages=normalizedReferences;persistCharacterReferences();renderCharacterReferences()}
  const references=normalizedReferences.map(reference=>reference.dataUrl);
  const requestBody=JSON.stringify({prompt:promptText,model,...(model==="flux-2-klein-4b"?{aspectRatio,...(references.length?{references}:{})}:{})});
  if(new TextEncoder().encode(requestBody).byteLength>2*1024*1024)throw Error("حجم المراجع لا يزال كبيراً. أزل بعض المراجع وأعد المحاولة.");
  const response=await fetch("/api/images",{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json","Accept":"application/json"},body:requestBody});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(payload.message||payload.error||("تعذر توليد الصورة (HTTP "+response.status+")."));
  if(payload.ok!==true||typeof payload.imageDataUrl!=="string"||!payload.imageDataUrl.startsWith("data:image/"))throw Error("استجابة محرك الصور غير صالحة.");
  const image=new Image();
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error("تعذر تحميل معاينة الصورة."));image.src=payload.imageDataUrl});
  if(!image.naturalWidth||!image.naturalHeight)throw Error("الصورة الناتجة بلا أبعاد صالحة.");
  generatedRasterAsset={name:"صورة مولدة · "+new Date().toLocaleTimeString(),dataUrl:payload.imageDataUrl,mimeType:payload.mimeType||"image/jpeg",width:image.naturalWidth,height:image.naturalHeight};
  $("generatedRasterPreview").src=payload.imageDataUrl;$("imageGenerationResult").hidden=false;$("importGeneratedRasterBtn").disabled=false;
  statusNode.textContent="وصلت الصورة من "+(payload.model||"محرك الصور")+" — "+image.naturalWidth+"×"+image.naturalHeight+(payload.referenceCount?" مع "+payload.referenceCount+" مراجع":"")+". جارٍ حفظ نسخة في معرض الإنتاج…";
  try{const saved=await saveGeneratedImageToGallery(generatedRasterAsset,promptText,payload.model||"@cf/black-forest-labs/flux-1-schnell");statusNode.textContent="تم توليد الصورة وحفظها في معرض الإنتاج. رابط المراجعة جاهز للمشاركة."}catch(saveError){statusNode.textContent="تم توليد الصورة، لكن تعذر حفظها سحابياً: "+saveError.message+" احتفظ بها داخل المشروع أو أعد محاولة الحفظ."}
 }catch(error){statusNode.textContent=error.message||"تعذر الاتصال بمحرك الصور."}
 finally{button.disabled=false}
};
$("addCharacterReferenceBtn").onclick=()=>$("characterReferenceFiles").click();
$("characterReferenceFiles").addEventListener("change",async event=>{
 try{await addCharacterReferenceFiles(event.target.files);$("imageGenerationStatus").textContent="تم تجهيز صور المرجع وحفظها لهذا المشروع على الهاتف."}
 catch(error){$("characterReferenceStatus").textContent=error.message||"تعذر إضافة صور المرجع."}
 finally{event.target.value=""}
});
$("useGeneratedImageAsCharacterReferenceBtn").onclick=async()=>{
 if(!generatedRasterAsset){$("imageGenerationStatus").textContent="لا توجد صورة مولدة حالية لاعتمادها مرجعاً.";return}
 const button=$("useGeneratedImageAsCharacterReferenceBtn");button.disabled=true;
 try{await setPrimaryCharacterReference(generatedRasterAsset.dataUrl,generatedRasterAsset.name)}catch(error){$("imageGenerationStatus").textContent=error.message||"تعذر اعتماد الصورة مرجعاً."}
 finally{button.disabled=false}
};
$("importGeneratedRasterBtn").onclick=()=>{
 if(!generatedRasterAsset){$("imageGenerationStatus").textContent="لا توجد صورة جاهزة للإدخال.";return}
 try{
  if(frame().layers.length>=100)throw Error("بلغ الإطار الحد الأقصى للطبقات.");
  snapshot();
  const added=addRasterLayer(frame(),generatedRasterAsset);
  activeLayerId=added.id;selection=null;render();
  $("imageGenerationStatus").textContent="أُدخلت الصورة كطبقة Raster مستقلة. احفظ المشروع للاحتفاظ بها.";
 }catch(error){$("imageGenerationStatus").textContent="تعذر إدخال الصورة: "+error.message}
};
checkImageProviderConnection();
refreshProductionGallery();
$("refreshProductionGalleryBtn").onclick=refreshProductionGallery;
$("ai2dGenerateBtn").onclick=async()=>{const key=$("geminiApiKey").value.trim(),promptText=$("aiPrompt").value.trim();if(!key){aiStatus("أدخل مفتاح Gemini API أولاً.",false);return}if(!promptText){aiStatus("اكتب وصف المشهد أولاً.",false);return}const button=$("ai2dGenerateBtn");button.disabled=true;$("aiGenerateBtn").disabled=true;$("ai3dGenerateBtn").disabled=true;aiStatus("المخرج الفني يخطط الكاميرا والمنظور ثم يرسم سبع طبقات 2D…");clearProposal();try{let result,critique,revisionBrief="";for(let pass=1;pass<=2;pass++){result=await generateAnimeVectorBackground(key,promptText,fetch,"gemini-3.5-flash-lite",{fallbackModels:["gemini-3.1-flash-lite"],revisionBrief,onProgress:info=>aiStatus("الجولة "+pass+" — "+info.message)});aiStatus("يعرض المراجع الفني معاينة الرسم ويفحص المنظور والخامات والإضاءة…");const png=await animeLayersPreviewPng(result.layers);try{critique=await reviewAnimeVectorPreview(key,promptText,png,fetch,result.model,{fallbackModels:["gemini-3.1-flash-lite"]})}catch(reviewError){throw Error("لم يجتز الرسم مراجعة الجودة لأن الفحص البصري فشل: "+reviewError.message+". لم يُعرض زر الاعتماد.");}if(critique.overallScore>=8&&critique.looksLike2DAnime&&critique.criticalIssues.length===0)break;if(pass===1){revisionBrief=critique.nextRevisionBrief||critique.issues.map(item=>item.area+": "+item.problem+" — "+item.correction).join("\n");aiStatus("كشف الفحص نقاطاً تحتاج تحسيناً (التقييم "+critique.overallScore+"/10). يعيد الفنان رسمها الآن…")} }proposedLayers=result.layers;proposalTarget={frameId:frame().id};proposedLayers.forEach((entry,index)=>{const previewLayer={id:"ai-2d-proposal-"+index,name:entry.name,visible:true,operations:entry.operations.map(path=>({kind:"stroke",path}))};renderLayerInto(proposal,previewLayer,index,"ai-2d-proposal-"+index)});$("aiReview").hidden=false;const passed=Boolean(critique&&critique.overallScore>=8&&critique.looksLike2DAnime&&critique.criticalIssues.length===0);$("aiApproveBtn").disabled=!passed;const quality=critique?" التقييم البصري: "+critique.overallScore+"/10.":"";const issues=critique?.issues?.length?" أبرز الملاحظات: "+critique.issues.slice(0,2).map(item=>item.problem).join("؛ "):"";aiStatus((passed?"اجتاز بوابة الجودة. ":"لم يجتز بوابة الجودة؛ يلزم تحسين الرسم قبل اعتماده. ")+"اقتراح الخلفية 2D: "+proposedLayers.length+" طبقات و"+result.totalOperations+" مساراً متجهياً."+quality+issues)}catch(error){aiStatus(error.message||"تعذر إنتاج الخلفية ثنائية الأبعاد.",false)}finally{button.disabled=false;$("aiGenerateBtn").disabled=false;$("ai3dGenerateBtn").disabled=false}};
$("aiGenerateBtn").onclick=async()=>{const key=$("geminiApiKey").value.trim(),promptText=$("aiPrompt").value.trim();if(!key){aiStatus("أدخل مفتاح Gemini API أولاً.",false);return}if(!promptText){aiStatus("اكتب وصفاً للرسم أولاً.",false);return}const button=$("aiGenerateBtn");button.disabled=true;$("ai3dGenerateBtn").disabled=true;$("ai2dGenerateBtn").disabled=true;aiStatus("يرسم الاقتراح المتجهي الآن…");clearProposal();try{const result=await generateSceneProposal(key,promptText);proposedLayers=result.layers;proposalTarget={frameId:frame().id};proposedLayers.forEach((entry,index)=>{const previewLayer={id:"ai-proposal-"+index,name:entry.name,visible:true,operations:entry.operations.map(path=>({kind:"stroke",path}))};renderLayerInto(proposal,previewLayer,index,"ai-proposal-"+index)});$("aiReview").hidden=false;aiStatus("اكتمل اقتراح المشهد: "+proposedLayers.length+" طبقات و"+result.totalOperations+" مساراً متجهياً. راجعه ثم اعتمده أو ارفضه.")}catch(error){aiStatus(error.message||"تعذر إنشاء الاقتراح.",false)}finally{button.disabled=false;$("ai3dGenerateBtn").disabled=false;$("ai2dGenerateBtn").disabled=false}};
$("ai3dGenerateBtn").onclick=async()=>{const key=$("geminiApiKey").value.trim(),promptText=$("aiPrompt").value.trim();if(!key){aiStatus("أدخل مفتاح Gemini API أولاً.",false);return}if(!promptText){aiStatus("اكتب وصف البيئة أولاً.",false);return}const button=$("ai3dGenerateBtn");button.disabled=true;$("aiGenerateBtn").disabled=true;$("ai2dGenerateBtn").disabled=true;aiStatus("يبني الفنان المشهد ثلاثي الأبعاد ويحوّله إلى SVG…");clearProposal();try{const result=await generateMeshEnvironmentProposal(key,promptText);proposedLayers=result.layers;proposalTarget={frameId:frame().id};proposedLayers.forEach((entry,index)=>{const previewLayer={id:"ai-3d-proposal-"+index,name:entry.name,visible:true,operations:entry.operations.map(path=>({kind:"stroke",path}))};renderLayerInto(proposal,previewLayer,index,"ai-3d-proposal-"+index)});$("aiReview").hidden=false;aiStatus("اكتمل المشهد ثلاثي الأبعاد: "+proposedLayers.length+" طبقات و"+result.totalOperations+" مساراً متجهياً. راجعه قبل الاعتماد.")}catch(error){aiStatus(error.message||"تعذر إنشاء البيئة ثلاثية الأبعاد.",false)}finally{button.disabled=false;$("aiGenerateBtn").disabled=false;$("ai2dGenerateBtn").disabled=false}};
$("aiApproveBtn").onclick=()=>{if(!proposalTarget||proposalTarget.frameId!==frame().id){aiStatus("تغير الإطار منذ إنشاء الاقتراح. ارفضه وأنشئ اقتراحاً جديداً.",false);return}try{if(frame().layers.length+proposedLayers.length>100)throw Error("لا توجد مساحة كافية لإضافة طبقات المشهد");snapshot();let count=0;for(const entry of proposedLayers){const target=addLayer(frame(),entry.name);entry.operations.forEach(path=>{appendOperation(target,"stroke",path);count++});activeLayerId=target.id}const layerCount=proposedLayers.length;clearProposal();render();aiStatus("تم اعتماد المشهد: "+layerCount+" طبقات و"+count+" مساراً متجهياً قابلاً للتحرير.")}catch(error){aiStatus("تعذر اعتماد الاقتراح: "+error.message,false)}};
$("aiRejectBtn").onclick=()=>{clearProposal();aiStatus("تم رفض الاقتراح. لم يتغير المشروع.")};
$("applyCommandsBtn").onclick=()=>{try{const d=JSON.parse($("commandInput").value);if(d.version!==1||!Array.isArray(d.operations)||d.operations.length>100)throw Error("المخطط يتطلب version 1 و100 عملية كحد أقصى");const ops=d.operations.map(validatePath);snapshot();if(layer().type==="raster"){const vector=addLayer(frame(),"رسم متجهي فوق: "+layer().name);activeLayerId=vector.id}ops.forEach(p=>appendOperation(layer(),"stroke",p));render();status("أضيفت "+ops.length+" عملية إلى "+layer().name)}catch(err){status("لم تُضف الأوامر: "+err.message,false)}};
function stop(){playing=false;clearInterval(timer);$("playBtn").textContent="▶ معاينة"}$("playBtn").onclick=()=>{if(playing){stop();render();return}if(project.frames.length<2)return;playing=true;$("playBtn").textContent="■ إيقاف";let i=current;timer=setInterval(()=>{i=(i+1)%project.frames.length;current=i;renderFrame(art,frame());$("frameInfo").textContent="الإطار "+(i+1)+" من "+project.frames.length},1000/+$("fpsSelect").value)};
$("focusDrawingBtn").onclick=()=>{$("drawingWorkspace").scrollIntoView({behavior:"smooth",block:"start"});resetCanvasView();};
$("newProjectBtn").onclick=()=>{if(!confirm("بدء مشروع جديد؟ احفظ عملك الحالي أولاً"))return;stop();snapshot(false,true);project=createProject("مشروع جديد");current=0;activeLayerId=frame().layers[0].id;activeAnimeMotionPlan=null;activeAnimeAnatomySequence=null;$("animeAnatomyGuideToggleLabel").hidden=true;$("animeAnatomyConstructionLayer").replaceChildren();renderCharacterLibrary();renderAnimeAnatomyDNASelect();resetRigModel();$("projectName").value="مشروع جديد";$("saveState").textContent="مشروع جديد";render()};
if("serviceWorker"in navigator&&location.protocol!=="file:")addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));try{render();resetRigModel();renderCharacterLibrary();wireAnimeAnatomyCalibration();renderAnimeAnatomyDNASelect();$("appRuntimeStatus").hidden=true}catch(error){const panel=$("appRuntimeStatus");panel.hidden=false;panel.textContent="تعذر تهيئة واجهة الرسم: "+(error?.message||String(error));console.error("ZERO STUDIO startup failed",error)}})();