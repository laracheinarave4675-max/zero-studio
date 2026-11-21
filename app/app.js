import{WIDTH,HEIGHT,MAX_FRAMES,createProject,createFrame,createLayer,normalizeProject,validatePath,appendOperation,removeOperation,translateOperation,updateOperation,duplicateOperation,addLayer,addRasterLayer,renameLayer,removeLayer,reorderLayer,frameSvg,renderLayerInto,pointsToPath,shapePath,pressureOutlinePath,createInbetweenFrames,analyzeDrawingCadence,getPathEditHandles,movePathAnchor,movePathControlPoint,uid}from"./engine.mjs";
import{createZip}from"./zip.mjs";
import{generateSceneProposal,generateMeshEnvironmentProposal,generateAnimeVectorBackground,reviewAnimeVectorPreview}from"./scene-production.mjs";
import{createAnimationPlan,beginAnimationProduction,createAnimationBatchPrompt,appendAnimationBatch}from"./animation-production.mjs";
import{captureFrameHistory,captureFrameHistoryAfter,applyFrameHistory}from"./frame-history.mjs";
import{createNoriModel,validateCharacterModel,addCharacterModelToFrame,applyNoriPalette,applyNoriRigPose,solveNoriRigJoint,interpolateNoriRigModels,NORI_JOINT_KEYS,NORI_RIG_BONES,createNoriModelSheetSvg,createCharacterModelFromFrame,rotateNoriHead,rotateNoriBody,copyCharacterInstanceToFrame,replaceCharacterInstanceInFrame}from"./character-model.mjs";
import{saveCharacterToLibrary,loadCharacterFromLibrary,removeCharacterFromLibrary}from"./character-library.mjs";
import{addBackgroundToFrame,BACKGROUND_PRESETS}from"./backgrounds.mjs";
import{drawRasterBrushStroke,fillRasterRegion,mapPointsToRaster,resolveBrushPressure}from"./raster-brushes.mjs";import{createPersistentRasterSurfaceManager,encodeRasterSurfaceStroke}from"./raster-surface.mjs";
import{compileDigitalArtistBrushPlan}from"./digital-artist-brush-engine.mjs";import{buildAnimeVisionBrushPlan}from"./digital-artist-vision-brush-planner.mjs";import{createDigitalArtistDemoPlan}from"./digital-artist-demo-plan.mjs";import{executeDigitalArtistBrushStream}from"./digital-artist-brush-executor.mjs";import{validateDigitalArtistStrokeEdit}from"./digital-artist-stroke-edit.mjs";import{analyzeRasterPixels,analyzeStrokeGeometry,inspectRegionFillGroup,compareAnatomyGuideToDNA,compareAnimeEyeDesign,compareAnimeHairFlow}from"./digital-artist-eyes.mjs";import{getAnimeArtistCurriculum}from"./anime-artist-curriculum.mjs";import{createAnimeDrawingSession,getAnimeDrawingStudy}from"./anime-drawing-training.mjs";import{createArtistLearningRecord,recordArtistAssessment,evaluateArtistSkillProgress,recommendNextArtistPractice}from"./digital-artist-learning.mjs";import{buildArtistCorrectionPlan}from"./digital-artist-corrections.mjs";
import{ANIME_ANATOMY_JOINTS,createAnimeCharacterDNA,validateAnimeCharacterDNA,createAnimeAnatomyPlan,createAnimeFrameDrawingTasks,createAnimeAnatomySequence,attachAnimeFrameDrawing,reviewAnimeFrame,auditAnimeAnatomySequence,validateAnimeFrameRasterAsset,getAnimeAnatomyFrameRole,buildAnimeAnatomyConstruction}from"./anime-anatomy-engine.mjs";
import{createKimonoSideWalkChart,getKimonoSideWalkFrameBrief,KIMONO_WALK_REFERENCE}from"./kimono-side-walk-chart.mjs";
import{createAnimeAutoDrawingPlan,createAnimeAutoDrawingOrder,createAnimeAutoDrawingRequest,removeAnimeChromaKeyFromRgba}from"./anime-auto-drawing-engine.mjs";
(()=>{"use strict";const rasterSurfaces=createPersistentRasterSurfaceManager({createCanvas:()=>document.createElement("canvas"),loadImage:src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error("تعذر فتح صورة الطبقة النقطية."));image.src=src})});const $=id=>document.getElementById(id),NS="http://www.w3.org/2000/svg";const TIMELINE_PAGE_SIZE=24;let project=createProject(),current=0,activeLayerId=project.frames[0].layers[0].id,tool="raster-pencil",drawing=false,points=[],startPoint=null,activePointerType="mouse",history=[],future=[],playing=false,timer=null,animeAutoDrawingBusy=false,animeAutoDrawingStopRequested=false;const canvas=$("drawingCanvas"),art=$("artLayer"),onion=$("onionLayer"),proposal=$("proposalLayer"),selectionLayer=$("selectionLayer"),nodeEditLayer=$("nodeEditLayer"),active=$("activeStroke"),rigCanvas=$("characterRigCanvas"),rigArt=$("characterRigArt"),rigBones=$("characterRigBones"),rigHandles=$("characterRigHandles"),animeAnatomyCanvas=$("animeAnatomyCanvas"),animeAnatomySource=$("animeAnatomySource"),animeAnatomyMarkers=$("animeAnatomyMarkers"),animeAnatomyConstructionLayer=$("animeAnatomyConstructionLayer");let proposedLayers=[],proposalTarget=null,selectedCharacterModel=null,selection=null,selectionDrag=null,nodeEditing=false,nodeDrag=null,panGesture=null,rigModel=null,rigDrag=null,animeAnatomyActive=false,animeAnatomyStep=0,animeAnatomyPoints={},animeAnatomyDraggingKey=null,animeAnatomyMode="dna",activeAnimeDNAId=null,activeAnimeMotionPlan=null,activeAnimeAnatomySequence=null,activeKimonoWalkChart=null,selectedDigitalArtistStrokeKey=null,latestDigitalArtistInspection=null;const frame=()=>project.frames[current],layer=()=>frame().layers.find(l=>l.id===activeLayerId)||frame().layers[0];
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
 const animeLink=$("animeAnatomyLibrarySelect");
 if(animeLink){const linked=animeLink.value;animeLink.replaceChildren();const placeholder=document.createElement("option");placeholder.value="";placeholder.textContent="هوية جديدة (غير مرتبطة بنموذج مكتبة)";animeLink.appendChild(placeholder);for(const asset of assets){const option=document.createElement("option");option.value=asset.id;option.textContent=asset.name;animeLink.appendChild(option)}if(assets.some(asset=>asset.id===linked))animeLink.value=linked;}
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

function status(s,ok=true){$("commandStatus").textContent=s;$("commandStatus").style.color=ok?"var(--accent)":"#ff9999"}function snapshot(includeCharacterLibrary=false,forceFull=false){const rasterBytes=project.frames.reduce((sum,f)=>sum+(f.animeRaster?.dataUrl?.length||0)+f.layers.reduce((n,l)=>n+(l.type==="raster"?(l.dataUrl?.length||0):0),0),0);const compactHistory=!forceFull&&(project.frames.length>600||rasterBytes>2*1024*1024);const entry=compactHistory?captureFrameHistory(project,current,{includeCharacterLibrary}):JSON.stringify(project);history.push(entry);const historyLimit=project.frames.length>600?40:rasterBytes>8*1024*1024?3:rasterBytes>2*1024*1024?5:100;if(history.length>historyLimit)history.shift();future=[];buttons()}function restore(state){if(typeof state==="string"){project=JSON.parse(state);current=Math.min(current,project.frames.length-1)}else{applyFrameHistory(project,state);current=Math.min(state.index,project.frames.length-1)}activeLayerId=frame().layers[0].id;selection=null;selectionDrag=null;render();renderCharacterLibrary()}function buttons(){$("undoBtn").disabled=!history.length;$("redoBtn").disabled=!future.length;const selected=selection&&frame().layers.find(l=>l.id===selection.layerId);$("deleteSelectionBtn").disabled=!selected||selected.locked;$("applyStyleBtn").disabled=!selected||selected.locked;$("duplicateSelectionBtn").disabled=!selected||selected.locked;$("nodeEditBtn").disabled=!selected||selected.locked;$("nodeEditBtn").classList.toggle("active",nodeEditing&&!!selected)}function undo(){if(history.length){const entry=history.pop();future.push(typeof entry==="string"?JSON.stringify(project):captureFrameHistoryAfter(project,entry));restore(entry);buttons()}}function redo(){if(future.length){const entry=future.pop();history.push(typeof entry==="string"?JSON.stringify(project):captureFrameHistory(project,entry.index));restore(entry);buttons()}}
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
  activeKimonoWalkChart=dna.lastMotionPreset==="kimono-side-walk-v2"?createKimonoSideWalkChart():null;
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
  renderAnimeAnatomyConstructionOverlay();renderKimonoWalkTaskNavigator();
  if(project.frames.slice(0,24).some(item=>item.animeRaster))await auditStoredAnimeRasterFrames(false);
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
  label.textContent=String(index+1);label.setAttribute("data-anatomy-joint",item.key);label.style.pointerEvents="auto";animeAnatomyMarkers.appendChild(label);
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
 animeAnatomyActive=true;animeAnatomyStep=0;animeAnatomyPoints={};animeAnatomyDraggingKey=null;
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
 animeAnatomyActive=false;animeAnatomyStep=0;animeAnatomyPoints={};animeAnatomyDraggingKey=null;animeAnatomyMode="dna";activeAnimeDNAId=null;
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
 animeAnatomyStatus("حُفظت الوضعية المفتاحية الكاملة وربطت بالإطار الأصلي. لا تُنتج هذه العملية رسمة جديدة.");renderKimonoWalkTaskNavigator();
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
  if(activeKimonoWalkChart){
   const missing=KIMONO_WALK_REFERENCE.keyDrawingFrames.filter(frameIndex=>!keys.some(key=>key.frame===frameIndex));
   if(missing.length)throw Error("قالب مشي الكيمونو يحتاج اعتماد خمس وضعيات مفتاحية كاملة في الإطارات: "+missing.map(index=>index+1).join("، ")+".");
  }
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
  snapshot(true);dna.lastMotionAction=action;dna.lastMotionShotId=plan.shotId;dna.lastMotionPreset=activeKimonoWalkChart?"kimono-side-walk-v2":null;
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
  renderAnimeAnatomyConstructionOverlay();renderKimonoWalkTaskNavigator();
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
  const linkedLibraryId=$("animeAnatomyLibrarySelect")?.value||"";
  const linkedAsset=(project.characterLibrary||[]).find(item=>item.id===linkedLibraryId)||null;
  if(linkedLibraryId&&!linkedAsset)throw Error("نموذج الشخصية المحدد لم يعد موجوداً في المكتبة.");
  const id=linkedAsset?linkedAsset.id+"-anime-dna":uid("anime-character"),name=linkedAsset?.name||$("animeAnatomyName").value.trim()||"شخصية جديدة";
  if((project.animeCharacterDNA||[]).some(item=>item.characterAssetId===id))throw Error("هذه الشخصية مرتبطة بهوية تشريحية محفوظة بالفعل؛ اخترها من قائمة الهويات أو اربط نموذجاً آخر.");
  const guide={
   view:$("animeAnatomyView").value,
   contacts:{footL:$("animeAnatomyLeftContact").value,footR:$("animeAnatomyRightContact").value},
   joints:Object.fromEntries(ANIME_ANATOMY_LABELS.map(item=>[item.key,animeAnatomyPoints[item.key]]))
  };
  if(!currentFrameHasDrawing())throw Error("الإطار الحالي فارغ؛ ارسم الشخصية كاملة قبل حفظ هويتها.");
  if(activeKimonoWalkChart&&current!==0)throw Error("ابدأ اعتماد هوية مشي الكيمونو من الإطار 1 أولاً حتى يصبح الرسم نفسه أول وضعية مفتاحية.");
  const sourceFrame=sourceFrameWithoutAnimeRaster(frame());
  const sourceSignature=await sha256Hex(frameSvg(sourceFrame,"anime-final-"+sourceFrame.id,[]));
  const dna=createAnimeCharacterDNA({
   characterAssetId:id,characterBibleId:(linkedAsset?linkedAsset.id:id)+"-bible",modelSheetAssetIds:[],...(linkedAsset?{characterModelAssetId:linkedAsset.id}:{}),anchorGuide:guide,
   notes:"Calibrated on native project frame "+(current+1)+"; source frame ID "+frame().id+(linkedAsset?"; linked character-library asset "+linkedAsset.id:"")
  });
  dna.name=name;dna.sourceFrameId=frame().id;dna.sourceFrameIndex=current;dna.sourceSignature=sourceSignature;
  if(activeKimonoWalkChart){dna.keyDrawings=[{id:uid("anime-key"),frame:0,drawingAssetId:frame().id,sourceSignature,approved:true,phase:$("animeKeyDrawingPhase").value,easeToNext:$("animeKeyDrawingEase").value,guide:JSON.parse(JSON.stringify(guide)),note:"Artist-approved first full drawing and identity anchor for kimono side-walk."}];}
  snapshot(true);
  if(!Array.isArray(project.animeCharacterDNA))project.animeCharacterDNA=[];
  if(project.animeCharacterDNA.length>=100)throw Error("بلغت مكتبة هويات الشخصيات حد 100.");
  project.animeCharacterDNA.push(dna);
  activeAnimeMotionPlan=null;activeAnimeAnatomySequence=null;
  $("animeAnatomyGuideToggleLabel").hidden=true;$("animeAnatomyConstructionLayer").replaceChildren();
  updateAnimeRasterControls();
  renderAnimeAnatomyDNASelect(id);
  cancelAnimeAnatomyCalibration();
  animeAnatomyStatus(activeKimonoWalkChart?"حُفظت هوية "+name+"، وسُجل الإطار 1 تلقائياً كأول وضعية مفتاحية. أكمل الإطارات 7 و13 و19 و24.":"حُفظت هوية "+name+" مع 19 نقطة تشريحية داخل المشروع .zero. لم تُعدّل الرسمة الأصلية.");renderKimonoWalkTaskNavigator();
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
 $("animeMotionPlanStatus").textContent="تم إنشاء 24 خانة فارغة لمسار الرسم اليدوي القديم فقط؛ لا يستخدمها محرك التحريك الآلي. شغّل مولّد الرسومات المستقلة لإنتاج التسلسل الفعلي دون رسم يدوي.";
}

function selectKimonoWalkFrame(frameIndex){
 if(!activeKimonoWalkChart||!Number.isInteger(frameIndex)||frameIndex<0||frameIndex>=24||frameIndex>=project.frames.length)return;
 stop();current=frameIndex;activeLayerId=frame().layers[0].id;selection=null;selectionDrag=null;clearProposal();
 const brief=getKimonoSideWalkFrameBrief(frameIndex);
 $("animeKeyDrawingPhase").value=brief.phase;
 $("animeAnatomyView").value="side";
 render();
}
function renderKimonoWalkTaskNavigator(){
 const panel=$("animeWalkTaskPanel");if(!panel)return;
 panel.hidden=!activeKimonoWalkChart;
 if(!activeKimonoWalkChart)return;
 const brief=getKimonoSideWalkFrameBrief(Math.max(0,Math.min(23,current)));
 const dna=(project.animeCharacterDNA||[]).find(item=>item.characterAssetId===$("animeAnatomyDNASelect").value);
 const keys=Array.isArray(dna?.keyDrawings)?dna.keyDrawings:[];
 const keyDrawing=keys.find(item=>item.frame===current);
 const saved=frame().animeRaster;
 const approvedCount=project.frames.slice(0,24).filter(item=>item.animeRaster?.review?.status==="approved").length;
 const drawnCount=project.frames.slice(0,24).filter(item=>item.layers.some(entry=>entry.type==="raster"?!!entry.dataUrl:Array.isArray(entry.operations)&&entry.operations.length>0)).length;
 const keyCount=keys.filter(item=>item.frame>=0&&item.frame<24).length;
 $("animeWalkTaskHeading").textContent="الإطار "+brief.frameNumber+" من 24 — "+brief.title;
 $("animeWalkTaskTime").textContent=brief.timeSeconds.toFixed(3)+" ثانية · "+brief.phase;
 $("animeWalkTaskDescription").textContent=brief.description;
 let statusText=saved?.review?.status==="approved"?"PNG مستقل محفوظ ومعتمد لهذا الإطار.":saved?"PNG محفوظ، لكنه يحتاج مراجعة فنية.":currentFrameHasDrawing()?"يوجد رسم في طبقات هذا الإطار؛ بعد اكتماله احفظه كـ PNG وراجعه.":"هذا الإطار لا يحتوي على رسمة بعد؛ سيُنشئها محرك التحريك الآلي.";
 if(brief.kind==="key-drawing")statusText+=" هذه وضعية مفتاحية مقترحة. بعد إكمال الرسم، اضغط «تسجيل الإطار الحالي كوضعية مفتاحية كاملة» وحدد المفاصل الـ19.";
 else statusText+=" هذا إطار وسيط؛ سيعيد محرك التحريك رسم الشخصية كاملة بدلاً من نسخ الإطار السابق.";
 if(!dna)statusText+=" احفظ هوية الشخصية التشريحية أولاً من رسم الإطار 1.";
 else if(keyDrawing)statusText+=" تم تسجيل هذه الوضعية المفتاحية وربطها بالرسم الأصلي.";
 $("animeWalkTaskState").textContent=statusText;
 $("animeWalkProgress").textContent="رسومات في طبقات: "+drawnCount+"/24 · PNG معتمدة: "+approvedCount+"/24 · وضعيات مفتاحية: "+keyCount+"/5 مستهدفة";
 const list=$("animeWalkTaskList");list.replaceChildren();
 for(let index=0;index<24;index++){
  const task=getKimonoSideWalkFrameBrief(index),source=project.frames[index];
  const savedFrame=source?.animeRaster;
  const hasDrawing=!!source&&source.layers.some(entry=>entry.type==="raster"?!!entry.dataUrl:Array.isArray(entry.operations)&&entry.operations.length>0);
  const isKey=task.kind==="key-drawing",registered=keys.some(item=>item.frame===index);
  const button=document.createElement("button");
  button.type="button";
  button.className="anime-walk-task"+(index===current?" active":"")+(isKey?" key":"")+(savedFrame?.review?.status==="approved"?" approved":savedFrame?" saved":hasDrawing?" drawn":"");
  button.textContent=String(index+1).padStart(2,"0")+(isKey?" ★":"")+(savedFrame?.review?.status==="approved"?" ✓":registered?" ◆":hasDrawing?" •":"");
  button.title="الإطار "+(index+1)+" — "+task.title+(registered?" — وضعية مفتاحية مسجلة":"");
  button.setAttribute("aria-label",button.title);
  button.onclick=()=>selectKimonoWalkFrame(index);
  list.appendChild(button);
 }
 $("animeWalkFramePrevBtn").disabled=current<=0;
 $("animeWalkFrameNextBtn").disabled=current>=23;
}
function applyKimonoWalkPreset(){
 activeKimonoWalkChart=null;
 activeAnimeMotionPlan=null;activeAnimeAnatomySequence=null;
 $("animeMotionAction").value="A restrained, natural one-second side-view walk for the approved kimono character, with readable weight transfer, planted-foot contact, gentle arm counter-swing, and controlled skirt and hair follow-through.";
 $("animeAnatomyView").value="side";
 $("animeAnatomyGuideToggleLabel").hidden=true;
 $("animeAnatomyConstructionLayer").replaceChildren();
 $("animeWalkTaskPanel").hidden=true;
 $("animeMotionPlanStatus").style.color="var(--accent)";
 $("animeMotionPlanStatus").textContent="تم إعداد وصف حركة المشي الجانبي. لا حاجة لرسم الإطارات أو تسجيل الوضعيات يدوياً؛ استخدم زر «توليد 24 رسمة أنمي تلقائياً» أدناه.";
 animeAnatomyStatus("تم اختيار حركة المشي الجانبي. ورقة التصميم هي مرجع الهوية فقط؛ سيعيد محرك التحريك رسم الشخصية كاملة في كل إطار.");
}
function updateAnimeRasterControls(){
 const ready=!!activeAnimeMotionPlan;
 $("saveAnimeRasterFrameBtn").disabled=!ready||current>=24;
 $("auditAnimeRasterFramesBtn").disabled=!ready;
 $("exportAnimeRasterSequenceBtn").disabled=true;
 const sequence=project.animeAutoSequence;
 const autoFrames=sequence?project.frames.slice(sequence.baseFrameIndex,sequence.baseFrameIndex+24):[];
 const autoComplete=!!sequence&&autoFrames.length===24&&autoFrames.every((item,index)=>item?.animeAutoDrawing?.batchId===sequence.batchId&&item.animeAutoDrawing.frameIndex===index&&getAnimeAutoDrawingLayer(item,index));
 const autoApproved=autoComplete&&autoFrames.every(item=>item.animeAutoDrawing.review?.status==="approved");
 $("auditAnimeAutoSequenceBtn").disabled=!sequence;
 $("exportAnimeAutoSequenceBtn").disabled=!autoApproved||animeAutoDrawingBusy;
}

async function removeAnimeBlueBackdrop(imageDataUrl){
 const image=new Image();
 await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error("تعذر فتح الإطار الذي ولّده محرك التحريك."));image.src=imageDataUrl});
 if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth>4096||image.naturalHeight>4096)throw Error("أبعاد الإطار المولّد غير صالحة.");
 const canvas=document.createElement("canvas");canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
 const context=canvas.getContext("2d",{willReadFrequently:true});if(!context)throw Error("تعذر إنشاء سطح معالجة Raster شفاف.");
 context.drawImage(image,0,0,canvas.width,canvas.height);
 const pixels=context.getImageData(0,0,canvas.width,canvas.height);
 const matte=removeAnimeChromaKeyFromRgba(pixels.data);
 pixels.data.set(matte.data);context.putImageData(pixels,0,0);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
 if(!blob||blob.type!=="image/png"||blob.size<128)throw Error("تعذر حفظ رسمة الأنمي كـ PNG شفاف.");
 return{blob,dataUrl:await readBlobAsDataUrl(blob),width:canvas.width,height:canvas.height,matte};
}
function getAnimeAutoDrawingLayer(targetFrame,frameIndex){
 return targetFrame?.layers?.find(item=>item.type==="raster"&&item.name==="Anime Auto Drawing "+String(frameIndex+1).padStart(2,"0")&&typeof item.dataUrl==="string")||null;
}
async function loadAnimeAutoIdentityReference(galleryId){
 const response=await fetch("/api/gallery-image?id="+encodeURIComponent(galleryId),{method:"GET",cache:"no-store",headers:{"Accept":"application/json"}});
 const payload=await response.json().catch(()=>({}));
 if(!response.ok||payload.ok!==true||typeof payload.imageDataUrl!=="string")throw Error(payload.message||payload.error||"تعذر تحميل ورقة تصميم الشخصية من معرض الإنتاج.");
 const reference=await normalizeCharacterReference(payload.imageDataUrl,"ورقة تصميم الهوية المعتمدة");
 return reference.dataUrl;
}
function ensureAnimeAutoSequence(action,galleryId){
 const active=project.animeAutoSequence;
 if(active&&active.status!=="complete")return active;
 if(project.frames.length+24>MAX_FRAMES)throw Error("لا توجد مساحة كافية لإضافة 24 إطاراً جديداً دون حذف رسومات المشروع الحالية.");
 const batchId=("anime-auto-"+uid("shot")).replace(/[^a-z0-9_-]/gi,"").toLowerCase();
 const baseFrameIndex=project.frames.length;
 for(let index=0;index<24;index++){
  const next=createFrame();
  next.layers[0].name="ZERO-AUTO:"+batchId+":"+String(index).padStart(2,"0");
  project.frames.push(next);
 }
 project.animeAutoSequence={
  format:"zero-studio-anime-auto-sequence",version:1,batchId,baseFrameIndex,
  fps:24,durationSeconds:1,totalFrames:24,action:String(action||"").trim(),
  characterReferenceGalleryId:galleryId,status:"paused"
 };
 current=baseFrameIndex;activeLayerId=frame().layers[0].id;selection=null;render();
 return project.animeAutoSequence;
}
async function generateAnimeAutoWalkSequence(){
 const statusNode=$("animeAutoDrawingStatus");
 if(statusNode)statusNode.textContent="تم إيقاف توليد الصور للحركة نهائياً في هذا المسار. افتح مختبر الرسم النقطي المحلي بدلاً منه.";
 return;
 if(animeAutoDrawingBusy)return;
 const button=$("startAnimeAutoDrawingBtn"),stopButton=$("stopAnimeAutoDrawingBtn");
 animeAutoDrawingBusy=true;animeAutoDrawingStopRequested=false;
 if(button)button.disabled=true;if(stopButton)stopButton.disabled=false;
 const setStatus=message=>{if(statusNode)statusNode.textContent=message};
 try{
  setStatus("يفحص الاستوديو الاتصال وحاجز منع الرسوم قبل إنشاء أي إطار…");
  const probe=await fetch("/api/images",{method:"GET",cache:"no-store",headers:{"Accept":"application/json"}});
  const probePayload=await probe.json().catch(()=>({}));
  if(!probe.ok||probePayload.ok!==true)throw Error(probePayload.message||probePayload.error||"محرك الصور غير متصل.");
  if(probePayload.inferenceStarted===true)throw Error("فشل فحص الأمان: بدأ استدعاء توليد غير متوقع أثناء الفحص.");
  if(probePayload.animeAutoFreeTierConfirmed!==true)throw Error("أوقفت العملية لحماية الميزانية: لم أتمكن من إثبات تفعيل وضع مجاني فقط على Vercel وCloudflare معاً. لم يتم إنشاء الإطارات ولم يُستدعَ نموذج الصور.");
  let sequence=project.animeAutoSequence;
  const galleryId=sequence&&sequence.status!=="complete"?sequence.characterReferenceGalleryId:KIMONO_WALK_REFERENCE.galleryAssetId;
  const identityReference=await loadAnimeAutoIdentityReference(galleryId);
  if(!sequence||sequence.status==="complete"){
   const action=$("animeMotionAction").value.trim();
   if(!action)throw Error("أدخل وصف الحركة أولاً.");
   sequence=ensureAnimeAutoSequence(action,galleryId);
  }
  const plan=createAnimeAutoDrawingPlan({action:sequence.action,characterName:"the approved long-black-haired kimono character"});
  sequence.status="running";
  const generatedFrames=new Map(),knownHashes=new Set();
  let completed=0;
  for(let index=0;index<24;index++){
   const target=project.frames[sequence.baseFrameIndex+index];
   const record=target?.animeAutoDrawing;
   const savedLayer=getAnimeAutoDrawingLayer(target,index);
   if(record&&record.batchId===sequence.batchId&&savedLayer){
    const verifiedHash=await sha256Hex(blobFromBase64DataUrl(savedLayer.dataUrl,"image/png"));
    if(verifiedHash!==record.contentHash)throw Error("بصمة الرسمة المحفوظة للإطار "+(index+1)+" لا تطابق محتواها. أوقف الاستئناف لحماية التسلسل.");
    if(knownHashes.has(verifiedHash))throw Error("يوجد إطار مكرر داخل التسلسل الآلي؛ لن أتابع إنتاج نسخة مكررة.");
    knownHashes.add(verifiedHash);
    const reference=await normalizeCharacterReference(savedLayer.dataUrl,"رسم سابق للإطار "+(index+1));
    generatedFrames.set(index,reference.dataUrl);completed++;
   }else if(record||savedLayer){
    throw Error("بيانات الإطار "+(index+1)+" غير متطابقة؛ لا يمكن استئناف التسلسل بأمان.");
   }
  }
  const order=createAnimeAutoDrawingOrder(plan);
  setStatus("بدأ محرك التحريك: "+completed+"/24 رسمة موجودة. ينتج الوضعيات المفتاحية أولاً ثم الإطارات الوسيطة، رسماً كاملاً جديداً لكل إطار.");
  for(const index of order){
   if(animeAutoDrawingStopRequested)break;
   if(generatedFrames.has(index))continue;
   const request=createAnimeAutoDrawingRequest(plan,index,{identityReference,generatedFrames});
   setStatus("يرسم FLUX.2 الإطار "+(index+1)+"/24 — "+(request.frameKind==="key-drawing"?"وضعية مفتاحية":"إطار وسيط")+". لا يتم نسخ رسمة الإطار السابق.");
   const response=await fetch("/api/images",{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({
    prompt:request.prompt,model:request.model,aspectRatio:request.aspectRatio,
    references:request.references,referenceRoles:request.referenceRoles,workload:"anime-auto-drawing"
   })});
   const payload=await response.json().catch(()=>({}));
   if(!response.ok||payload.ok!==true||typeof payload.imageDataUrl!=="string"||!payload.imageDataUrl.startsWith("data:image/")){
    throw Error(payload.message||payload.error||("تعذر توليد الإطار "+(index+1)+" (HTTP "+response.status+")."));
   }
   const poseReference=await normalizeCharacterReference(payload.imageDataUrl,"وضعية مولدة للإطار "+(index+1));
   const transparent=await removeAnimeBlueBackdrop(payload.imageDataUrl);
   const contentHash=await sha256Hex(transparent.blob);
   if(knownHashes.has(contentHash))throw Error("أعاد النموذج رسمة مطابقة لإطار سابق عند الإطار "+(index+1)+". أوقفت التسلسل بدلاً من احتسابها رسماً مستقلاً.");
   const target=project.frames[sequence.baseFrameIndex+index];
   const added=addRasterLayer(target,{name:"Anime Auto Drawing "+String(index+1).padStart(2,"0"),dataUrl:transparent.dataUrl,mimeType:"image/png",width:transparent.width,height:transparent.height});
   const sourceFrame=sourceFrameWithoutAnimeRaster(target);
   const sourceSignature=await sha256Hex(frameSvg(sourceFrame,"anime-auto-final-"+target.id,[]));
   target.animeAutoDrawing={
    format:"zero-studio-auto-drawing-frame",version:1,batchId:sequence.batchId,
    frameIndex:index,assetId:uid("anime-auto-art"),contentHash,sourceSignature,
    mimeType:"image/png",width:transparent.width,height:transparent.height,alpha:true,
    review:{status:"pending",identity:false,anatomy:false,lineQuality:false,timing:false,note:"Generated independently by the automatic animation engine; awaiting visual review."}
   };
   knownHashes.add(contentHash);generatedFrames.set(index,poseReference.dataUrl);completed++;
   current=sequence.baseFrameIndex+index;activeLayerId=added.id;render();
   setStatus("اكتمل رسم الإطار "+(index+1)+"/24 بصيغة PNG شفافة مستقلة. الرسومات الموجودة: "+completed+"/24. المراجعة الفنية ما زالت مطلوبة.");
  }
  sequence.status=completed===24?"complete":"paused";
  if(sequence.status==="complete"){
   setStatus("اكتمل توليد 24 رسمة أنمي مستقلة. جميعها محفوظة في الخط الزمني كطبقات PNG شفافة منفصلة، ولم تُعتمد فنياً بعد. راجع كل إطار قبل التصدير.");
   await auditAnimeAutoDrawingSequence(false);
  }else{
   setStatus("توقف التوليد بأمان عند "+completed+"/24. الرسومات المكتملة محفوظة في المشروع ويمكن استئناف الباقي لاحقاً.");
  }
  render();
 }catch(error){
  if(project.animeAutoSequence&&project.animeAutoSequence.status==="running")project.animeAutoSequence.status="paused";
  setStatus("توقف محرك التحريك: "+(error.message||"خطأ غير معروف")+". لم يتم استخدام أي بديل مدفوع.");
  render();
 }finally{
  animeAutoDrawingBusy=false;
  if(button)button.disabled=false;if(stopButton)stopButton.disabled=true;
 }
}
function requestStopAnimeAutoDrawing(){
 if(!animeAutoDrawingBusy)return;
 animeAutoDrawingStopRequested=true;
 const node=$("animeAutoDrawingStatus");
 if(node)node.textContent="سيوقف المحرك بعد انتهاء طلب الإطار الجاري، ويحفظ ما أُنجز حتى الآن.";
}
function saveAnimeAutoDrawingReview(){
 const record=frame().animeAutoDrawing;
 if(!record){const node=$("animeAutoDrawingAuditStatus");if(node)node.textContent="لا يوجد رسم أنمي آلي في الإطار الحالي لمراجعته.";return}
 const review={
  identity:$("animeReviewIdentity").checked,
  anatomy:$("animeReviewAnatomy").checked,
  lineQuality:$("animeReviewLineQuality").checked,
  timing:$("animeReviewTiming").checked
 };
 const complete=Object.values(review).every(Boolean);
 record.review={status:complete?"approved":"pending",...review,note:complete?"Artist review completed in ZERO STUDIO.":"Artist review is incomplete."};
 render();updateAnimeRasterControls();
 const audit=$("animeAutoDrawingAuditStatus");
 if(audit)audit.textContent=complete?"تم اعتماد مراجعة الإطار "+(record.frameIndex+1)+".":"حُفظت المراجعة الجزئية؛ لا يزال هذا الإطار غير معتمد.";
}
async function auditAnimeAutoDrawingSequence(exportZip=false){
 try{
  const sequence=project.animeAutoSequence;
  if(!sequence)throw Error("لا يوجد تسلسل أنمي آلي في المشروع.");
  const entries=[],records=[],hashes=new Set();let missing=0,approved=0,stale=0;
  for(let index=0;index<24;index++){
   const target=project.frames[sequence.baseFrameIndex+index],record=target?.animeAutoDrawing;
   const imageLayer=getAnimeAutoDrawingLayer(target,index);
   if(!record||record.batchId!==sequence.batchId||record.frameIndex!==index||!imageLayer){missing++;continue}
   const blob=blobFromBase64DataUrl(imageLayer.dataUrl,"image/png");
   const hash=await sha256Hex(blob);
   const signature=await sha256Hex(frameSvg(sourceFrameWithoutAnimeRaster(target),"anime-auto-final-"+target.id,[]));
   if(hash!==record.contentHash||signature!==record.sourceSignature){stale++;continue}
   if(hashes.has(hash))throw Error("توجد بصمتان متطابقتان بين رسومات التسلسل.");
   hashes.add(hash);records.push({frameIndex:index,filename:"frames/frame-"+String(index+1).padStart(4,"0")+".png",assetId:record.assetId,contentHash:hash,sourceSignature:signature,review:record.review});
   if(record.review?.status==="approved")approved++;
   if(exportZip){
    const encoded=imageLayer.dataUrl.slice(imageLayer.dataUrl.indexOf(",")+1),binary=atob(encoded),bytes=new Uint8Array(binary.length);
    for(let offset=0;offset<binary.length;offset++)bytes[offset]=binary.charCodeAt(offset);
    entries.push({name:"frames/frame-"+String(index+1).padStart(4,"0")+".png",data:bytes});
   }
  }
  const complete=missing===0&&stale===0&&records.length===24&&hashes.size===24;
  const report="الرسومات المستقلة: "+records.length+"/24 · المراجعة الفنية المعتمدة: "+approved+"/24 · المفقودة: "+missing+" · البصمات المتغيرة: "+stale;
  const statusNode=$("animeAutoDrawingAuditStatus");
  if(!exportZip){
   if(statusNode)statusNode.textContent=report+(complete?" — التسلسل مكتمل تقنياً.":" — لم يكتمل بعد.");
   $("exportAnimeAutoSequenceBtn").disabled=!(complete&&approved===24);
   return{complete,approved,missing,stale,unique:hashes.size};
  }
  if(!complete||approved!==24)throw Error("التصدير محظور حتى تكتمل 24 رسمة فريدة وتُعتمد مراجعة كل إطار على حدة. "+report);
  entries.push({name:"manifest.json",data:JSON.stringify({
   format:"zero-studio-auto-anime-drawings",version:1,fps:24,durationSeconds:1,
   targetUniqueDrawingsPerSecond:24,batchId:sequence.batchId,
   characterReferenceGalleryId:sequence.characterReferenceGalleryId,
   action:sequence.action,drawingCount:24,reviewStatus:"all-24-approved",frames:records
  },null,2)});
  if(entries.filter(item=>/^frames\/frame-\d{4}\.png$/.test(item.name)).length!==24)throw Error("حزمة التصدير لا تحتوي على 24 صورة PNG مستقلة بالضبط.");
  const archive=createZip(entries);
  if(!(archive instanceof Uint8Array)||archive.length<1024||archive[0]!==0x50||archive[1]!==0x4b)throw Error("ملف ZIP الناتج غير صالح.");
  download("zero-studio-ai-anime-24-independent-drawings.zip",new Blob([archive],{type:"application/zip"}));
  if(statusNode)statusNode.textContent="تم تصدير 24 رسمة PNG مستقلة بعد اعتماد المراجعات الأربع لكل إطار.";
  return{complete:true,approved:24};
 }catch(error){
  $("exportAnimeAutoSequenceBtn").disabled=true;
  const statusNode=$("animeAutoDrawingAuditStatus");
  if(statusNode)statusNode.textContent="تعذر الفحص أو التصدير: "+error.message;
  return null;
 }
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
  animeRasterStatus("حُفظ PNG مستقل للإطار "+(frameIndex+1)+". المكتمل: "+audit.drawnFrames+"/24، المعتمد: "+audit.approvedFrames+"/24، المفقود: "+audit.missingFrames+".",approved);renderKimonoWalkTaskNavigator();
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
    drawingCount:24,reviewStatus:"all-24-approved",
    frames:project.frames.slice(0,24).map((entry,index)=>({
     frameIndex:index,filename:"frames/frame-"+String(index+1).padStart(4,"0")+".png",
     assetId:entry.animeRaster.assetId,contentHash:entry.animeRaster.contentHash,
     sourceSignature:entry.animeRaster.sourceSignature,review:entry.animeRaster.review
    }))
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
  const frameEntries=entries.filter(entry=>/^frames\/frame-\d{4}\.png$/.test(entry.name));
  if(frameEntries.length!==24||new Set(frameEntries.map(entry=>entry.name)).size!==24)throw Error("فشل تحقق حزمة التصدير: يجب أن تحتوي على 24 ملف PNG منفصلاً بالضبط.");
  const archive=createZip(entries);
  if(!(archive instanceof Uint8Array)||archive.length<1024||archive[0]!==0x50||archive[1]!==0x4b)throw Error("ملف ZIP الناتج غير صالح أو فارغ.");
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
 $("applyKimonoWalkPresetBtn").onclick=applyKimonoWalkPreset;
 $("animeWalkFramePrevBtn").onclick=()=>selectKimonoWalkFrame(current-1);
 $("animeWalkFrameNextBtn").onclick=()=>selectKimonoWalkFrame(current+1);
 $("animeAnatomyGuideToggle").onchange=renderAnimeAnatomyConstructionOverlay;
 $("saveAnimeRasterFrameBtn").onclick=saveCurrentAnimeRasterFrame;
 $("auditAnimeRasterFramesBtn").onclick=()=>{auditStoredAnimeRasterFrames(false).catch(()=>{})};
 $("exportAnimeRasterSequenceBtn").onclick=()=>{auditStoredAnimeRasterFrames(true).catch(()=>{})};
 $("startAnimeAutoDrawingBtn").onclick=generateAnimeAutoWalkSequence;
 $("stopAnimeAutoDrawingBtn").onclick=requestStopAnimeAutoDrawing;
 $("saveAnimeAutoReviewBtn").onclick=saveAnimeAutoDrawingReview;
 $("auditAnimeAutoSequenceBtn").onclick=()=>{auditAnimeAutoDrawingSequence(false).catch(()=>{})};
 $("exportAnimeAutoSequenceBtn").onclick=()=>{auditAnimeAutoDrawingSequence(true).catch(()=>{})};
 animeAnatomyCanvas.addEventListener("pointerdown",event=>{
  if(!animeAnatomyActive)return;
  const selectedJoint=event.target?.getAttribute?.("data-anatomy-joint");
  if(selectedJoint&&animeAnatomyPoints[selectedJoint]){
   animeAnatomyDraggingKey=selectedJoint;
   try{animeAnatomyCanvas.setPointerCapture?.(event.pointerId)}catch{}
   event.preventDefault();return;
  }
  if(animeAnatomyStep>=ANIME_ANATOMY_LABELS.length)return;
  try{
   const point=animeAnatomyCoords(event);
   animeAnatomyPoints[ANIME_ANATOMY_LABELS[animeAnatomyStep].key]=point;
   animeAnatomyStep++;renderAnimeAnatomyMarkers();event.preventDefault();
  }catch(error){animeAnatomyStatus(error.message,false)}
 });
 animeAnatomyCanvas.addEventListener("pointermove",event=>{
  if(!animeAnatomyActive||!animeAnatomyDraggingKey)return;
  try{animeAnatomyPoints[animeAnatomyDraggingKey]=animeAnatomyCoords(event);renderAnimeAnatomyMarkers();event.preventDefault()}
  catch(error){animeAnatomyStatus(error.message,false)}
 });
 const finishAnimeLandmarkDrag=event=>{
  if(!animeAnatomyDraggingKey)return;
  animeAnatomyDraggingKey=null;
  try{if(animeAnatomyCanvas.hasPointerCapture?.(event.pointerId))animeAnatomyCanvas.releasePointerCapture(event.pointerId)}catch{}
 };
 animeAnatomyCanvas.addEventListener("pointerup",finishAnimeLandmarkDrag);
 animeAnatomyCanvas.addEventListener("pointercancel",finishAnimeLandmarkDrag);
 $("undoAnimeAnatomyPointBtn").onclick=()=>{
  if(!animeAnatomyStep)return;
  animeAnatomyStep--;delete animeAnatomyPoints[ANIME_ANATOMY_LABELS[animeAnatomyStep].key];
  renderAnimeAnatomyMarkers();
 };
 $("cancelAnimeAnatomyBtn").onclick=cancelAnimeAnatomyCalibration;
 $("saveAnimeAnatomyDNABtn").onclick=saveAnimeAnatomyDNA;
 $("animeAnatomyDNASelect").onchange=()=>{const selected=$("animeAnatomyDNASelect").value;const active=!!selected;$("exportAnimeAnatomyDNABtn").disabled=!active;$("startAnimeKeyDrawingBtn").disabled=!active;$("buildAnimeMotionPlanBtn").disabled=!active;activeAnimeMotionPlan=null;activeAnimeAnatomySequence=null;updateAnimeRasterControls();$("animeAnatomyGuideToggleLabel").hidden=true;$("animeAnatomyConstructionLayer").replaceChildren();const dna=(project.animeCharacterDNA||[]).find(item=>item.characterAssetId===selected);activeKimonoWalkChart=dna?.lastMotionPreset==="kimono-side-walk-v2"?createKimonoSideWalkChart():null;if(dna?.lastMotionAction){
  $("animeMotionAction").value=dna.lastMotionAction;
  restoreAnimeMotionPlan(dna).catch(error=>{
   activeAnimeMotionPlan=null;activeAnimeAnatomySequence=null;updateAnimeRasterControls();
   animeRasterStatus("تحتاج بعض الرسومات المفتاحية إلى تسجيل جديد: "+error.message,false);
  });
 }else updateAnimeRasterControls();renderKimonoWalkTaskNavigator()};
 $("exportAnimeAnatomyDNABtn").onclick=()=>{
  const selected=$("animeAnatomyDNASelect").value;
  const dna=(project.animeCharacterDNA||[]).find(item=>item.characterAssetId===selected);
  if(!dna)return animeAnatomyStatus("اختر هوية شخصية محفوظة أولاً.",false);
  download((dna.name||"character")+"-anatomy-dna.json",new Blob([JSON.stringify(dna,null,2)],{type:"application/json"}));
  animeAnatomyStatus("تم تصدير بيانات الهوية التشريحية المحددة.");
 };
 renderAnimeAnatomyDNASelect();
}
function syncAnimeRasterReviewControls(){const review=frame().animeAutoDrawing?.review||frame().animeRaster?.review||{};$("animeReviewIdentity").checked=review.identity===true;$("animeReviewAnatomy").checked=review.anatomy===true;$("animeReviewLineQuality").checked=review.lineQuality===true;$("animeReviewTiming").checked=review.timing===true}

function collectDigitalArtistStrokeRecords(){
 const records=[];
 project.frames.forEach((frameData,frameIndex)=>{
  (frameData.layers||[]).forEach(layerData=>{
   if(layerData.type!=="raster"||!Array.isArray(layerData.strokes))return;
   layerData.strokes.forEach(stroke=>{
    if(stroke?.source!=="digital-artist")return;
    records.push({key:frameIndex+"|"+layerData.id+"|"+stroke.id,frameIndex,layer:layerData,stroke});
   });
  });
 });
 return records;
}
function rebuildDigitalArtistRasterLayerDataUrl(layer,strokes){
 if(!layer||layer.type!=="raster")throw Error("طبقة Raster صالحة مطلوبة لإعادة الرسم");
 const width=Number(layer.width),height=Number(layer.height);
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>8*1024*1024)throw Error("أبعاد طبقة التصحيح تتجاوز حد الذاكرة الآمن");
 const scratch=document.createElement("canvas");scratch.width=width;scratch.height=height;
 const ctx=scratch.getContext("2d");if(!ctx)throw Error("تعذر إنشاء سطح Raster لإعادة الرسم");
 for(const stroke of strokes){
  const options=stroke.options||{};
  const mapped=mapPointsToRaster(stroke.points,WIDTH,HEIGHT,width,height,options.size??1);
  if(stroke.kind==="raster-region-fill")fillRasterRegion(ctx,mapped.points,options);
  else drawRasterBrushStroke(ctx,mapped.points,{...options,size:mapped.size});
 }
 const dataUrl=scratch.toDataURL("image/png"),prefix="data:image/png;base64,";
 if(typeof dataUrl!=="string"||!dataUrl.startsWith(prefix))throw Error("تعذر ترميز طبقة التصحيح إلى PNG");
 const encodedLength=dataUrl.length-prefix.length,decodedBytes=Math.floor(encodedLength*3/4);
 if(dataUrl.length>24*1024*1024||decodedBytes>16*1024*1024)throw Error("حجم الطبقة بعد التصحيح تجاوز الحد الآمن");
 return dataUrl;
}
function applyDigitalArtistStrokeCorrection(){
 const record=collectDigitalArtistStrokeRecords().find(item=>item.key===selectedDigitalArtistStrokeKey);
 const input=$("digitalArtistStrokeEditInput"),button=$("digitalArtistStrokeApplyEditBtn"),details=$("digitalArtistStrokeDetails");
 if(!record||!input||!button||button.disabled)return;
 try{
  if(record.layer.locked)throw Error("افتح قفل الطبقة قبل تصحيح ضرباتها");
  const edit=JSON.parse(input.value);
  const corrected=validateDigitalArtistStrokeEdit(record.stroke,edit);
  const nextStrokes=record.layer.strokes.map(stroke=>stroke.id===record.stroke.id?corrected:stroke);
  const nextDataUrl=rebuildDigitalArtistRasterLayerDataUrl(record.layer,nextStrokes);
  snapshot();
  record.layer.strokes=nextStrokes;
  record.layer.dataUrl=nextDataUrl;
  record.layer.mimeType="image/png";
  rasterSurfaces.invalidate(record.layer);
  buttons();
  render();
  if(details)details.textContent="تم حفظ تصحيح "+corrected.id+" وإعادة تنفيذ "+nextStrokes.length+" عملية في الطبقة من سجلها الأصلي. عادت الضربة إلى انتظار المراجعة.";
 }catch(error){
  if(details)details.textContent="لم يُحفظ التصحيح: "+(error?.message||String(error));
 }
}
function renderDigitalArtistStrokePreview(record){
 const preview=$("digitalArtistStrokePreview");
 if(!preview)return;
 const ctx=preview.getContext("2d");
 if(!ctx)return;
 const width=preview.width,height=preview.height;
 ctx.clearRect(0,0,width,height);
 ctx.fillStyle="#fff";ctx.fillRect(0,0,width,height);
 ctx.strokeStyle="#e1ddd5";ctx.lineWidth=1;ctx.strokeRect(.5,.5,width-1,height-1);
 if(!record)return;
 try{
  const points=record.stroke.points||[];
  if(!points.length)return;
  const xs=points.map(point=>Number(point.x)),ys=points.map(point=>Number(point.y));
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const rangeX=Math.max(1,maxX-minX),rangeY=Math.max(1,maxY-minY),padding=42;
  const scale=Math.min((width-padding*2)/rangeX,(height-padding*2)/rangeY);
  const offsetX=(width-rangeX*scale)/2-minX*scale,offsetY=(height-rangeY*scale)/2-minY*scale;
  const mapped=points.map(point=>({x:point.x*scale+offsetX,y:point.y*scale+offsetY,pressure:Number(point.pressure??1)}));
  if(record.stroke.kind==="raster-region-fill"){
   fillRasterRegion(ctx,mapped,record.stroke.options||{});
  }else{
   const options=record.stroke.options||{};
   drawRasterBrushStroke(ctx,mapped,{...options,size:Math.max(.5,Number(options.size||8)*scale)});
  }
 }catch(error){
  ctx.fillStyle="#9b3342";ctx.font="16px sans-serif";ctx.fillText("تعذرت معاينة هذه الضربة",18,30);
 }
}
function renderDigitalArtistStrokeReview(){
 const select=$("digitalArtistStrokeSelect"),details=$("digitalArtistStrokeDetails");
 if(!select||!details)return;
 const records=collectDigitalArtistStrokeRecords();
 if(!records.length){
  selectedDigitalArtistStrokeKey=null;
  select.replaceChildren(new Option("لا توجد ضربات فنان بعد",""));
  details.textContent="نفّذ خطة الفنان لعرض عملياتها هنا.";
  renderDigitalArtistStrokePreview(null);
  const editInput=$("digitalArtistStrokeEditInput"),applyEdit=$("digitalArtistStrokeApplyEditBtn");if(editInput)editInput.value="";if(applyEdit)applyEdit.disabled=true;
  for(const id of ["digitalArtistStrokePrevBtn","digitalArtistStrokeNextBtn","digitalArtistStrokeApproveBtn","digitalArtistStrokeRejectBtn","digitalArtistStrokeResetBtn"]){const button=$(id);if(button)button.disabled=true;}
  return;
 }
 if(!records.some(record=>record.key===selectedDigitalArtistStrokeKey))selectedDigitalArtistStrokeKey=records[0].key;
 select.replaceChildren();
 records.forEach((record,index)=>{
  const option=document.createElement("option");
  option.value=record.key;
  option.textContent=(index+1)+"/"+records.length+" · "+record.layer.name+" · "+record.stroke.id+" — "+record.stroke.intent;
  select.append(option);
 });
 select.value=selectedDigitalArtistStrokeKey;
 const index=records.findIndex(record=>record.key===selectedDigitalArtistStrokeKey),record=records[index];
 const review=record.stroke.review==="approved"?"معتمدة":record.stroke.review==="rejected"?"مرفوضة":"بانتظار المراجعة";
 const kind=record.stroke.kind==="raster-region-fill"?"تعبئة منطقة مغلقة":"ضربة فرشاة";
 details.textContent="الإطار "+(record.frameIndex+1)+" · "+record.layer.name+" · "+record.stroke.id+" · "+kind+" · "+(record.stroke.points?.length||0)+" نقطة · الحالة: "+review+"\n"+record.stroke.intent;
 const editInput=$("digitalArtistStrokeEditInput"),applyEdit=$("digitalArtistStrokeApplyEditBtn");
 if(editInput)editInput.value=JSON.stringify({intent:record.stroke.intent,points:record.stroke.points,options:record.stroke.options},null,2);
 if(applyEdit)applyEdit.disabled=false;
 renderDigitalArtistStrokePreview(record);
 const prev=$("digitalArtistStrokePrevBtn"),next=$("digitalArtistStrokeNextBtn");
 if(prev)prev.disabled=index<=0;
 if(next)next.disabled=index>=records.length-1;
 const approve=$("digitalArtistStrokeApproveBtn"),reject=$("digitalArtistStrokeRejectBtn"),reset=$("digitalArtistStrokeResetBtn");
 if(approve)approve.disabled=record.stroke.review==="approved";
 if(reject)reject.disabled=record.stroke.review==="rejected";
 if(reset)reset.disabled=!record.stroke.review||record.stroke.review==="pending";
}
function moveDigitalArtistStrokeSelection(direction){
 const records=collectDigitalArtistStrokeRecords(),index=records.findIndex(record=>record.key===selectedDigitalArtistStrokeKey);
 const target=records[index+direction];
 if(!target)return;
 selectedDigitalArtistStrokeKey=target.key;renderDigitalArtistStrokeReview();
}
function setDigitalArtistStrokeReview(review){
 const record=collectDigitalArtistStrokeRecords().find(item=>item.key===selectedDigitalArtistStrokeKey);
 if(!record)return;
 snapshot();record.stroke.review=review;buttons();renderDigitalArtistStrokeReview();
}
function ensureArtistLearningRecord(){
 if(!project.artistLearning)project.artistLearning=createArtistLearningRecord();
 return project.artistLearning;
}
function renderDigitalArtistLearning(){
 const record=ensureArtistLearningRecord(),progress=evaluateArtistSkillProgress(record);
 const summary=$("digitalArtistLearningSummary"),nextNode=$("digitalArtistNextPractice"),historyNode=$("digitalArtistLearningHistory");
 if(summary)summary.textContent="المهارات المتقنة: "+progress.summary.mastered+" / "+progress.summary.totalSkills+" · قيد التدريب: "+progress.summary.practicing+" · لم تبدأ: "+progress.summary.notStarted+" · المحاولات المسجلة: "+record.attempts.length;
 if(nextNode){
  const next=recommendNextArtistPractice(record);
  nextNode.textContent=next?"التدريب التالي: "+next.skillId+" — "+next.reason+"\nالتمارين: "+next.exercises.join(" | ")+"\nمعايير القياس: "+next.metrics.join(" · "):"اكتمل المنهج وفق سجلات التقييم الحالية.";
 }
 if(historyNode){
  const recent=record.attempts.slice(-8).reverse();
  historyNode.textContent=recent.length?recent.map(item=>item.skillId+" · "+Math.round(item.score*100)+"% · "+(item.passed?"اجتاز":"يحتاج إلى تدريب")+" · "+item.observedAt).join("\n"):"لا توجد تقييمات محفوظة بعد.";
 }
 const button=$("recordDigitalArtistAssessmentBtn");
 if(button)button.disabled=!latestDigitalArtistInspection||latestDigitalArtistInspection.frame!==current;
}
async function recordLatestDigitalArtistAssessment(){
 const status=$("digitalArtistLearningStatus"),button=$("recordDigitalArtistAssessmentBtn");
 if(!latestDigitalArtistInspection||latestDigitalArtistInspection.frame!==current)throw Error("افحص الإطار الحالي أولاً قبل تسجيل محاولة تدريب.");
 if(!globalThis.crypto?.subtle)throw Error("SHA-256 غير متاح في هذا المتصفح.");
 const select=$("animeArtistSkillSelect"),skillId=select?.value;
 if(!skillId)throw Error("اختر مهارة من منهج الأنمي أولاً.");
 const report=latestDigitalArtistInspection;
 const anatomy=report.characterIdentity?.anatomy;
 let checks;
 if(skillId==="head-and-face"||skillId==="body-anatomy"){
  if(!anatomy||anatomy.skipped||!Array.isArray(anatomy.measurements)||anatomy.measurements.length<3)throw Error("هذه المهارة تحتاج مقارنة تشريحية فعلية مع Character DNA وقياس ثلاثة معالم على الأقل؛ لم يتوفر ذلك في هذا الفحص.");
  checks=[
   {id:"anatomy-reference-available",passed:true},
   {id:"anatomy-measurements-present",passed:anatomy.measurements.length>=3},
   {id:"anatomy-all-measurements-within-tolerance",passed:anatomy.passed===true&&anatomy.measurements.every(item=>item.passed===true)}
  ];
 }else if(skillId==="anime-inking"){
  const lineLayers=report.layerEyes.filter(item=>item.averageStrokeLength!==null&&item.averageStrokeLength!==undefined);
  if(!report.operations||!lineLayers.length)throw Error("هذه المهارة تحتاج عمليات خطوط قابلة للقياس في الفحص الحالي.");
  checks=[
   {id:"line-operations-present",passed:report.operationKinds.brushes>0},
   {id:"line-geometry-warnings",passed:report.strokeWarnings.length===0},
   {id:"line-measurable-paths",passed:lineLayers.every(item=>Number.isFinite(item.averageStrokeLength)&&item.averageStrokeLength>0)}
  ];
 }else if(skillId==="flat-color-groups"){
  if(!report.fillEyes.length)throw Error("هذه المهارة تحتاج مناطق تعبئة Raster مفحوصة؛ لا توجد مناطق في التقرير الحالي.");
  checks=[
   {id:"fill-regions-present",passed:report.fillEyes.length>0},
   {id:"fill-interior-coverage",passed:report.fillEyes.every(item=>item.passed===true&&item.insideCoverage>=0.9)},
   {id:"fill-outside-leakage",passed:report.fillEyes.every(item=>item.passed===true&&item.outsideLeakage<=0.02)}
  ];
 }else{
  throw Error("لم نربط هذه المهارة بعد بمقاييس عين موثوقة. حالياً يمكن تسجيل تقييم الرأس والتشريح والخطوط والتلوين المسطح فقط؛ لن نخترع درجات لبقية المهارات.");
 }
 const canonical=JSON.stringify({frame:report.frame,operations:report.operations,visiblePixels:report.visiblePixels,fillEyes:report.fillEyes,strokeWarnings:report.strokeWarnings,characterIdentity:report.characterIdentity,layerEyes:report.layerEyes});
 const digestBytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical));
 const reportDigest=Array.from(new Uint8Array(digestBytes),byte=>byte.toString(16).padStart(2,"0")).join("");
 const record=ensureArtistLearningRecord();
 snapshot();
 recordArtistAssessment(record,{id:uid("artist-assessment"),skillId,reportDigest,checks});
 renderDigitalArtistLearning();
 if(status)status.textContent="سُجلت المحاولة بواقع "+checks.filter(item=>item.passed).length+"/"+checks.length+" فحوص ناجحة. هذه نتيجة تقييم موثق وليست تدريباً تلقائياً لنموذج عصبي.";
 if(button)button.disabled=true;
}
function mountDigitalArtistLearning(){
 const button=$("recordDigitalArtistAssessmentBtn");
 if(button&&!button.dataset.bound){button.dataset.bound="true";button.onclick=()=>recordLatestDigitalArtistAssessment().catch(error=>{$("digitalArtistLearningStatus").textContent="تعذر تسجيل التقييم: "+error.message;});}
 renderDigitalArtistLearning();
}
function mountAnimeArtistCurriculum(){
 const select=$("animeArtistSkillSelect"),details=$("animeArtistSkillDetails");
 const difficulty=$("animeArtistDifficulty"),startButton=$("startAnimeArtistPracticeBtn"),sessionNode=$("animeArtistPracticeSession");
 if(!select||!details||select.dataset.bound==="true")return;
 const skills=getAnimeArtistCurriculum();
 select.replaceChildren();
 skills.forEach(skill=>{
  const study=getAnimeDrawingStudy(skill.id),option=document.createElement("option");
  option.value=skill.id;
  option.textContent="م"+skill.level+" · "+study.title;
  select.append(option);
 });
 const update=()=>{
  const skill=skills.find(item=>item.id===select.value);
  if(!skill)return;
  const study=getAnimeDrawingStudy(skill.id);
  details.textContent=[
   study.title+" · المستوى "+skill.level,
   "المبدأ الفني: "+study.principle,
   "المتطلبات السابقة: "+(skill.prerequisites.join("، ")||"لا يوجد"),
   "محاور الدراسة: "+study.focus.join(" · "),
   "تسلسل التدريب: "+study.sequence.join(" ← "),
   "أخطاء يجب تجنبها: "+study.mistakes.join(" | "),
   "معايير المراجعة: "+study.rubric.map(item=>item[1]).join(" · "),
   "المخرج المطلوب: "+study.deliverable,
   "قاعدة التعلم: هذه تعليمات تدريب مفصلة وليست ادعاءً بأن النموذج تدرب تلقائياً أو أتقن المهارة."
  ].join("\\n");
  if(sessionNode)sessionNode.textContent="اختر «ابدأ تمرين الرسم» لإنشاء جلسة عملية لهذه المهارة.";
 };
 select.addEventListener("change",update);
 if(difficulty)difficulty.addEventListener("change",update);
 if(startButton&&startButton.dataset.bound!=="true"){
  startButton.dataset.bound="true";
  startButton.onclick=()=>{
   try{
    const session=createAnimeDrawingSession({skillId:select.value,difficulty:difficulty?.value||"foundation",characterId:project.activeCharacterId||""});
    if(sessionNode)sessionNode.textContent=[
     "جلسة تدريب جاهزة: "+session.title,
     "المبدأ: "+session.principle,
     "المستوى: "+session.difficulty+" · "+session.recommendedScale,
     "ترتيب العمل: "+session.sequence.join(" ← "),
     "طبقات الرسم: "+session.drawingLayers.join(" → "),
     "تجنب: "+session.mistakesToAvoid.join(" | "),
     "التقييم: "+session.rubric.map(item=>item.description+" ["+item.evaluation+"]").join(" · "),
     "المخرج: "+session.deliverable,
     "طريقة التنفيذ: ارسم على طبقات Raster مستقلة باستخدام الفرش الأصلية، ثم افحص العمل بعين الفنان. لا توجد صورة مولدة ولا درجة إتقان تلقائية."
    ].join("\\n");
   }catch(error){if(sessionNode)sessionNode.textContent="تعذر إنشاء الجلسة: "+error.message;}
  };
 }
 select.dataset.bound="true";
 update();artistLearningStatus();
}
async function compareAnimeDesignLandmarks(){
 const input=$("animeDesignLandmarkInput"),status=$("animeDesignLandmarkStatus");
 if(!input||!status)return;
 try{
  const raw=input.value.trim();
  if(!raw||raw.length>65536)throw Error("أدخل بيانات معالم لا تتجاوز 64 KiB.");
  const payload=JSON.parse(raw);
  if(!payload||typeof payload!=="object"||!payload.eyes)throw Error("يلزم قسم eyes وفيه reference وcurrent.");
  const eyeComparison=compareAnimeEyeDesign(payload.eyes.reference,payload.eyes.current);
  let hairComparison=null;
  if(payload.hair){
   hairComparison=compareAnimeHairFlow(payload.hair.reference,payload.hair.current,{headWidth:payload.hair.headWidth??1});
  }
  const report=latestDigitalArtistInspection||{frame:current,operations:0,visiblePixels:0,fillEyes:[],strokeWarnings:[],layerEyes:[],characterIdentity:null};
  report.animeEyeComparison=eyeComparison;
  if(hairComparison)report.animeHairFlowComparison=hairComparison;
  report.correctionPlan=buildArtistCorrectionPlan(report);
  latestDigitalArtistInspection=report;
  const eyeFailed=eyeComparison.failures.length;
  const hairFailed=hairComparison?.failures.length??0;
  status.textContent=[
   "مقارنة تصميم الأنمي اكتملت اعتماداً على المعالم التي أدخلتها.",
   "العيون: "+(eyeComparison.passed?"مطابقة ضمن هامش السماح":"تحتاج إلى تصحيح "+eyeFailed+" قياسات من "+eyeComparison.compared),
   ...eyeComparison.checks.filter(item=>!item.passed).map(item=>"• "+item.id+" — الانحراف "+(Number.isFinite(item.deviation)?item.deviation.toFixed(3):"خارج حدود العين")),
   ...(hairComparison?["الشعر: "+(hairComparison.passed?"اتجاه الكتل مطابق":"تحتاج "+hairFailed+" كتل إلى التصحيح"),...hairComparison.checks.filter(item=>!item.passed).map(item=>"• كتلة "+item.id)]:[]),
   "تم إنشاء "+report.correctionPlan.summary.total+" اقتراح تصحيح مرتبط بمهارات الأنمي.",
   "حدود الفحص: هذه مقارنة هندسية لمعالم مقدمة يدوياً أو من تقرير رؤية؛ لا تستخرج المعالم من البكسلات ولا تثبت جودة الرسم وحدها."
  ].join("\\n");
  const eyesStatus=$("digitalArtistEyesReport");
  if(eyesStatus&&latestDigitalArtistInspection)eyesStatus.dataset.report=JSON.stringify(report);
 }catch(error){status.textContent="تعذرت مقارنة معالم الأنمي: "+(error?.message||String(error));}
}
async function inspectDigitalArtistEyes(){
 const status=$("digitalArtistEyesReport"),button=$("digitalArtistEyesBtn");
 if(!status||!button||button.disabled)return;
 button.disabled=true;status.textContent="تعمل أعين الفنان على قياس طبقات الرسم وضرباته محلياً...";
 try{
  const frameRecords=collectDigitalArtistStrokeRecords().filter(record=>record.frameIndex===current);
  if(!frameRecords.length)throw Error("لا توجد ضربات فنان رقمي في الإطار الحالي؛ نفّذ خطة رسم أولاً");
  const layers=[...new Map(frameRecords.map(record=>[record.layer.id,record.layer])).values()];
  const layerEyes=[];
  for(const layer of layers){
   if(!layer.dataUrl)continue;
   const image=new Image();
   await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error("تعذر قراءة طبقة "+layer.name));image.src=layer.dataUrl;});
   const width=Number(layer.width)||image.naturalWidth,height=Number(layer.height)||image.naturalHeight;
   if(!width||!height||width*height>8*1024*1024)throw Error("طبقة "+layer.name+" تتجاوز حد الفحص الآمن");
   const inspectionScale=Math.min(1,960/width,540/height);
   const inspectionWidth=Math.max(1,Math.round(width*inspectionScale)),inspectionHeight=Math.max(1,Math.round(height*inspectionScale));
   const scratch=document.createElement("canvas");scratch.width=inspectionWidth;scratch.height=inspectionHeight;
   const ctx=scratch.getContext("2d",{willReadFrequently:true});
   if(!ctx)throw Error("تعذر إنشاء سطح فحص الطبقة");
   ctx.drawImage(image,0,0,inspectionWidth,inspectionHeight);
   const pixels=ctx.getImageData(0,0,inspectionWidth,inspectionHeight);
   const raster=analyzeRasterPixels(pixels);
   raster.inspectionScale=inspectionScale;
   if(raster.bounds)raster.bounds={x:Math.round(raster.bounds.x/inspectionScale),y:Math.round(raster.bounds.y/inspectionScale),width:Math.round(raster.bounds.width/inspectionScale),height:Math.round(raster.bounds.height/inspectionScale)};
   const records=frameRecords.filter(record=>record.layer.id===layer.id);
   const geometries=records.map(record=>analyzeStrokeGeometry(record.stroke));
   const pressureSamples=geometries.filter(item=>item.kind==="brush-stroke"&&item.sampleCount>1);
   const fillEyes=[],fillGroups=new Map();
   const stride=Math.max(1,Math.floor(Math.max(inspectionWidth,inspectionHeight)/360));
   for(const record of records.filter(item=>item.stroke.kind==="raster-region-fill")){
    const color=String(record.stroke.options?.color||"#000000").toLowerCase();
    const mapped=mapPointsToRaster(record.stroke.points,WIDTH,HEIGHT,inspectionWidth,inspectionHeight,1);
    if(!fillGroups.has(color))fillGroups.set(color,[]);
    fillGroups.get(color).push({record,points:mapped.points});
   }
   for(const [color,group] of fillGroups){
    const fill=inspectRegionFillGroup(pixels,group.map(item=>item.points),color,{
     stride,margin:Math.max(3,Math.round(8*inspectionScale)),
     colorTolerance:28,minimumCoverage:.88,maximumLeakage:.005
    });
    for(const item of group)fillEyes.push({id:item.record.stroke.id,intent:item.record.stroke.intent,color,groupRegions:group.length,...fill});
   }
   const meanLength=geometries.length?geometries.reduce((sum,item)=>sum+item.length,0)/geometries.length:0;
   layerEyes.push({name:layer.name,role:layer.role,visible:layer.visible!==false,raster,geometries,meanLength,pressureSamples,fillEyes});
  }
  const allGeometry=layerEyes.flatMap(layer=>layer.geometries);
  const strokeWarnings=allGeometry.flatMap(item=>item.warnings.map(code=>({id:item.id,code,intent:item.intent})));
  const totalVisible=layerEyes.reduce((sum,layer)=>sum+layer.raster.visiblePixels,0);
  const palette=new Map();
  layerEyes.forEach(layer=>layer.raster.dominantPalette.forEach(item=>palette.set(item.color,(palette.get(item.color)||0)+item.pixels)));
  const topColors=[...palette.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([color])=>color);
  const approvals=frameRecords.reduce((acc,record)=>{acc[record.stroke.review||"pending"]=(acc[record.stroke.review||"pending"]||0)+1;return acc;},{});
  const selectedDNAId=$("animeAnatomyDNASelect")?.value||"";
  const selectedDNA=(project.animeCharacterDNA||[]).find(item=>item.characterAssetId===selectedDNAId);
  let anatomyEye=null;
  if(selectedDNA){
   try{
    const dna=validateAnimeCharacterDNA(selectedDNA);
    const savedKey=(dna.keyDrawings||[]).find(item=>item.frame===current&&item.approved===true);
    const liveGuide=animeAnatomyActive&&$("animeAnatomyView")?.value===dna.canonicalView&&
     Object.keys(animeAnatomyPoints).length===ANIME_ANATOMY_JOINTS.length
      ?{view:dna.canonicalView,joints:animeAnatomyPoints}
      :savedKey?.guide||null;
    if(liveGuide)anatomyEye=compareAnatomyGuideToDNA(dna,liveGuide,{relativeTolerance:.15});
    else anatomyEye={skipped:true,passed:null,reason:"no-approved-current-frame-guide",compared:0,measurements:[]};
   }catch(error){anatomyEye={skipped:true,passed:null,reason:"invalid-character-dna",message:error?.message||String(error),compared:0,measurements:[]};}
  }
  const report={
   version:1,frame:current+1,analyzedLayers:layerEyes.length,operations:allGeometry.length,
   visiblePixels:totalVisible,topColors,
   operationKinds:{fills:allGeometry.filter(item=>item.kind==="region-fill").length,brushes:allGeometry.filter(item=>item.kind==="brush-stroke").length},
   approvals,strokeWarnings,
   characterIdentity:{characterAssetId:selectedDNA?.characterAssetId||null,characterName:selectedDNA?.name||null,anatomy:anatomyEye},
   fillEyes:layerEyes.flatMap(layer=>layer.fillEyes.map(fill=>({layer:layer.name,...fill}))),
   layerEyes:layerEyes.map(layer=>({
    name:layer.name,role:layer.role,visible:layer.visible,
    visiblePixels:layer.raster.visiblePixels,alphaCoverage:layer.raster.alphaCoverage,
    bounds:layer.raster.bounds,dominantPalette:layer.raster.dominantPalette.slice(0,4),
    averageStrokeLength:layer.meanLength,
    fillPassed:layer.fillEyes.filter(fill=>fill.passed).length,
    fillFailed:layer.fillEyes.filter(fill=>!fill.passed).length
   }))
  };
  report.correctionPlan=buildArtistCorrectionPlan(report);
  latestDigitalArtistInspection=report;
  renderDigitalArtistLearning();
  status.textContent=[
   "فحص الفنان — الإطار "+report.frame,
   "عين البنية: "+report.analyzedLayers+" طبقات، "+report.visiblePixels.toLocaleString("en-US")+" بكسل ظاهر",
   "عين الخط: "+report.operations+" عملية؛ "+report.operationKinds.brushes+" ضربات فرشاة و"+report.operationKinds.fills+" تعبئات مغلقة",
   "العين اللونية: "+(topColors.join(" · ")||"لا توجد ألوان قابلة للقياس"),
   "عين التعبئة: "+report.fillEyes.filter(item=>item.passed).length+"/"+report.fillEyes.length+" مناطق اجتازت اختبار التغطية والتسرب"+(report.fillEyes.some(item=>!item.passed)?" — "+report.fillEyes.filter(item=>!item.passed).map(item=>item.id).join("، "):""),
   "عين التشريح: "+(!anatomyEye?"اختر هوية Character DNA معتمدة":anatomyEye.skipped?(anatomyEye.reason==="no-approved-current-frame-guide"?"لا توجد وضعية معتمدة لهذا الإطار بعد":anatomyEye.reason==="camera-view-mismatch"?"تغير منظور الكاميرا؛ تم تخطي المقارنة":"تعذر استخدام مرجع الهوية"):anatomyEye.passed?"نسب العظام ضمن هامش 15% من Character DNA":"توجد انحرافات في "+anatomyEye.measurements.filter(item=>!item.passed).map(item=>item.name).join("، ")),
   "عين جودة الخط: "+(strokeWarnings.length?strokeWarnings.length+" ملاحظة في "+[...new Set(strokeWarnings.map(item=>item.id))].join("، "):"لم تُكتشف عيوب هندسية واضحة في الضربات"),
   "مراجعة العمليات: "+Object.entries(approvals).map(([key,value])=>key+" "+value).join("، "),
   "اقتراحات التصحيح: "+(report.correctionPlan.summary.total?report.correctionPlan.summary.total+" اقتراحاً ("+report.correctionPlan.summary.high+" مهم، "+report.correctionPlan.summary.medium+" متوسط)\n"+report.correctionPlan.suggestions.slice(0,8).map((item,index)=>(index+1)+". ["+item.skillId+"] "+item.title+(item.targetStrokeId?" · "+item.targetStrokeId:"")+"\n   السبب: "+item.diagnosis+"\n   التصحيح: "+item.action+"\n   تمرين: "+item.exercise+"\n   معيار النجاح: "+item.success).join("\n"):"لا توجد اقتراحات تصحيح آلية القواعد لهذا الفحص"),
   "ملاحظة: هذه توصيات تعليمية مبنية على قواعد القياس، ولا تعدّل الرسم أو تعتمد الضربات تلقائياً.",
   ...report.layerEyes.map(layer=>layer.name+": "+(layer.bounds?"حدود "+layer.bounds.width+"×"+layer.bounds.height:"طبقة فارغة")+"، تغطية "+(layer.alphaCoverage*100).toFixed(1)+"%")
  ].join("\n");
  status.dataset.report=JSON.stringify(report);
 }catch(error){
  status.textContent="لم يكتمل الفحص: "+(error?.message||String(error));
 }finally{
  button.disabled=false;
 }
}
function mountDigitalArtistStrokeReview(){
 const select=$("digitalArtistStrokeSelect"),eyesButton=$("digitalArtistEyesBtn");
 if(eyesButton&&eyesButton.dataset.bound!=="true"){eyesButton.dataset.bound="true";eyesButton.onclick=()=>inspectDigitalArtistEyes();}
 if(!select||select.dataset.bound==="true")return;
 select.dataset.bound="true";
 select.addEventListener("change",()=>{selectedDigitalArtistStrokeKey=select.value;renderDigitalArtistStrokeReview();});
 $("digitalArtistStrokePrevBtn").onclick=()=>moveDigitalArtistStrokeSelection(-1);
 $("digitalArtistStrokeNextBtn").onclick=()=>moveDigitalArtistStrokeSelection(1);
 $("digitalArtistStrokeApproveBtn").onclick=()=>setDigitalArtistStrokeReview("approved");
 $("digitalArtistStrokeRejectBtn").onclick=()=>setDigitalArtistStrokeReview("rejected");
 $("digitalArtistStrokeResetBtn").onclick=()=>setDigitalArtistStrokeReview("pending");
 $("digitalArtistStrokeApplyEditBtn").onclick=()=>applyDigitalArtistStrokeCorrection();
}
function mountDigitalArtistBrushPanel(){
 const input=$("digitalArtistBrushPlanInput"),loadButton=$("loadDigitalArtistDemoBtn"),runButton=$("runDigitalArtistPlanBtn"),statusNode=$("digitalArtistBrushStatus");
 const visionInput=$("digitalArtistVisionReportInput"),visionButton=$("buildDigitalArtistVisionPlanBtn"),visionStatus=$("digitalArtistVisionStatus"),approvalRow=$("digitalArtistVisionApprovalRow"),approvalCheck=$("digitalArtistVisionApproval");
 const referenceFile=$("digitalArtistVisionReferenceFile"),visionPrompt=$("digitalArtistVisionPrompt"),copyPromptButton=$("copyDigitalArtistVisionPromptBtn");
 if(!input||!loadButton||!runButton||!statusNode)return;
 mountDigitalArtistStrokeReview();
 if(copyPromptButton&&visionPrompt){copyPromptButton.onclick=async()=>{try{await navigator.clipboard.writeText(visionPrompt.value);if(visionStatus)visionStatus.textContent="تم نسخ أمر تحليل الصورة. افتح نموذج SmolVLM وألصق الأمر بعد رفع المرجع.";}catch(error){if(visionStatus)visionStatus.textContent="تعذر النسخ التلقائي؛ حدد نص الأمر وانسخه يدوياً.";}};}
 if(visionButton&&visionInput&&visionStatus&&approvalRow&&approvalCheck&&referenceFile){
  visionButton.onclick=async()=>{
   try{
    const file=referenceFile.files?.[0];if(!file)throw Error("ارفع صورة المرجع نفسها التي حللها نموذج الرؤية أولاً.");
    if(!globalThis.crypto?.subtle)throw Error("حساب SHA-256 غير متاح في هذا المتصفح الآمن.");
    const report=JSON.parse(visionInput.value);
    const digestBytes=await globalThis.crypto.subtle.digest("SHA-256",await file.arrayBuffer());
    const referenceDigest=Array.from(new Uint8Array(digestBytes),byte=>byte.toString(16).padStart(2,"0")).join("");
    if(report.referenceDigest&&/^(?:sha256:)?[a-f0-9]{64}$/i.test(String(report.referenceDigest))&&String(report.referenceDigest).replace(/^sha256:/i,"").toLowerCase()!==referenceDigest)throw Error("تقرير الرؤية لا يطابق صورة المرجع المرفوعة. أعد تحليل الصورة الصحيحة.");
    report.referenceDigest=referenceDigest;
    const result=buildAnimeVisionBrushPlan(report,{approveObservations:false});
    input.value=JSON.stringify(result.plan,null,2);
    approvalRow.hidden=false;approvalCheck.checked=false;runButton.disabled=true;
    const warnings=result.review.warnings.slice(0,4).join(" ");
    visionStatus.textContent="تم تحويل الملاحظات إلى مسودة من "+result.review.estimatedStrokeCount+" عملية رسم على "+result.plan.layers.length+" طبقات. راجع خطة الرسم أدناه. "+warnings+" لم يتم تحليل صورة هنا؛ هذه الخطوة تحول تقرير رؤية موجوداً إلى أوامر فرشاة.";
    statusNode.textContent="أُنشئت مسودة رؤية. لا يمكن تنفيذها قبل اعتمادك الصريح أدناه.";
   }catch(error){visionStatus.textContent="تعذر تحويل تقرير الرؤية: "+(error?.message||String(error));}
  };
  approvalCheck.onchange=()=>{runButton.disabled=!approvalCheck.checked;};
 }
 loadButton.onclick=()=>{
  input.value=JSON.stringify(createDigitalArtistDemoPlan(),null,2);
  if(approvalRow&&approvalCheck){approvalRow.hidden=true;approvalCheck.checked=false;runButton.disabled=false;}
  statusNode.textContent="تم تحميل مثال بورتريه من 7 طبقات. هذه خطة اختبار ثابتة للتحقق من الفرشاة والتنفيذ، وليست ناتج نموذج ذكاء اصطناعي.";
 };
 runButton.onclick=async()=>{
  if(runButton.disabled)return;
  const targetFrame=frame(),historyBefore=history.length,previousFuture=future.slice(),previousActiveLayerId=activeLayerId;
  let snapshotMade=false,executionCompleted=false;
  try{
   const plan=JSON.parse(input.value);
   const stream=compileDigitalArtistBrushPlan(plan);
   if(targetFrame.layers.length+stream.layers.length>100)throw Error("لا توجد مساحة كافية لإضافة طبقات الفنان؛ الحد الأقصى 100 طبقة في الإطار.");
   const blank=document.createElement("canvas");blank.width=WIDTH;blank.height=HEIGHT;
   const blankDataUrl=blank.toDataURL("image/png");
   snapshot();snapshotMade=true;
   runButton.disabled=true;loadButton.disabled=true;
   statusNode.textContent="بدأ تنفيذ "+stream.commands.length+" ضربة Raster على "+stream.layers.length+" طبقات…";
   const outcome=await executeDigitalArtistBrushStream(stream,{
    createLayer:descriptor=>{
     const target=addRasterLayer(targetFrame,{name:descriptor.name,dataUrl:blankDataUrl,mimeType:"image/png",width:WIDTH,height:HEIGHT});
     target.visible=descriptor.visible;target.locked=false;
     return target;
    },
    paintStroke:async(target,command)=>{
     const surface=await rasterSurfaces.get(target);
     const mapped=mapPointsToRaster(command.points,WIDTH,HEIGHT,target.width,target.height,command.options.size??1);
     const result=command.kind==="raster-region-fill"
      ?fillRasterRegion(surface.context,mapped.points,command.options)
      :drawRasterBrushStroke(surface.context,mapped.points,{...command.options,size:mapped.size});
     target.strokes.push({
      id:command.strokeId,intent:command.intent,source:"digital-artist",kind:command.kind,
      points:command.points.map(point=>({x:point.x,y:point.y,pressure:point.pressure??1})),
      options:{...command.options},review:"pending"
     });
     return result;
    },
    finalizeLayer:(target,descriptor)=>{
     const surfacePromise=rasterSurfaces.get(target);
     return surfacePromise.then(surface=>{
      const dataUrl=surface.canvas.toDataURL("image/png"),prefix="data:image/png;base64,";
      if(typeof dataUrl!=="string"||!dataUrl.startsWith(prefix))throw Error("تعذر ترميز طبقة الفنان إلى PNG.");
      const decodedBytes=Math.floor((dataUrl.length-prefix.length)*3/4);
      if(dataUrl.length>24*1024*1024||decodedBytes>16*1024*1024)throw Error("حجم طبقة «"+descriptor.name+"» تجاوز الحد الآمن؛ قسّم الرسم إلى طبقات أقل تعقيداً.");
      target.dataUrl=dataUrl;target.mimeType="image/png";target.visible=descriptor.visible;target.locked=descriptor.locked;
      rasterSurfaces.invalidate(target);
     });
    },
    rollbackLayers:layers=>{
     const ids=new Set(layers.map(item=>item.id));
     for(const item of layers)rasterSurfaces.invalidate(item);
     targetFrame.layers=targetFrame.layers.filter(item=>!ids.has(item.id));
    },
    onProgress:progress=>{
     statusNode.textContent="يرسم الفنان: "+progress.completed+"/"+progress.total+" — "+progress.layerName+" — "+progress.strokeId;
    }
   });
   executionCompleted=true;
   if(targetFrame===frame()){
    activeLayerId=outcome.createdLayers[outcome.createdLayers.length-1]?.id||previousActiveLayerId;
    selection=null;render();
   }else renderFrames();
   statusNode.textContent="اكتمل التنفيذ: "+outcome.strokeCount+" ضربة فعلية، "+outcome.layerCount+" طبقات Raster. سُجلت نية كل ضربة ونقاطها وخياراتها داخل المشروع؛ لا يوجد استدلال AI موصول بعد.";
  }catch(error){
   if(snapshotMade&&!executionCompleted){
    if(history.length>historyBefore)history.pop();
    future=previousFuture;activeLayerId=previousActiveLayerId;buttons();
   }
   if(targetFrame===frame())render();
   statusNode.textContent="توقف تنفيذ خطة الفنان دون اعتماد جزئي: "+(error?.message||String(error));
  }finally{
   runButton.disabled=Boolean(approvalRow&&!approvalRow.hidden&&approvalCheck&&!approvalCheck.checked);loadButton.disabled=false;
  }
 };
}

function render(){syncAnimeRasterReviewControls();renderFrame(art,frame());if($("onionToggle").checked&&current>0)renderFrame(onion,project.frames[current-1],.18,false);else onion.replaceChildren();renderAnimeAnatomyConstructionOverlay();updateAnimeRasterControls();renderKimonoWalkTaskNavigator();renderFrames();renderLayers();renderDigitalArtistStrokeReview();renderCharacterInstances();renderSelection();$("frameInfo").textContent="الإطار "+(current+1)+" من "+project.frames.length;$("frameCount").textContent=project.frames.length+" إطار";$("canvasHint").style.display=frame().layers.some(l=>l.operations.some(o=>o.kind==="stroke"))||(project.animationBackground||[]).length?"none":"block";renderAnimationProduction();buttons()}
function renderFrames(){const list=$("frameList");list.replaceChildren();const start=Math.floor(current/TIMELINE_PAGE_SIZE)*TIMELINE_PAGE_SIZE,end=Math.min(project.frames.length,start+TIMELINE_PAGE_SIZE);for(let i=start;i<end;i++){const f=project.frames[i],b=document.createElement("button");b.className="frame-thumb"+(i===current?" selected":"");b.type="button";b.setAttribute("aria-label","اختيار الإطار "+(i+1));const thumb=document.createElementNS(NS,"svg");thumb.setAttribute("viewBox","0 0 1920 1080");const bg=document.createElementNS(NS,"rect");bg.setAttribute("width",WIDTH);bg.setAttribute("height",HEIGHT);bg.setAttribute("fill","#fff");thumb.appendChild(bg);[...(project.animationBackground||[]),...f.layers].forEach((l,n)=>renderLayerInto(thumb,l,n,"thumb-"+i));b.appendChild(thumb);if(f.animeRaster){const reviewDot=document.createElement("span");reviewDot.className="frame-raster-status"+(f.animeRaster.review?.status==="approved"?" approved":" pending");reviewDot.textContent=f.animeRaster.review?.status==="approved"?"✓":"•";reviewDot.title=f.animeRaster.review?.status==="approved"?"رسمة PNG مستقلة معتمدة":"رسمة PNG محفوظة وتحتاج مراجعة";reviewDot.setAttribute("aria-label",reviewDot.title);b.appendChild(reviewDot)}if(f.animeAutoDrawing){const autoDot=document.createElement("span");autoDot.className="frame-raster-status"+(f.animeAutoDrawing.review?.status==="approved"?" approved":" pending");autoDot.textContent=f.animeAutoDrawing.review?.status==="approved"?"✓":"•";autoDot.title=f.animeAutoDrawing.review?.status==="approved"?"رسمة أنمي مولدة ومراجعة":"رسمة أنمي مولدة وتحتاج مراجعة بصرية";autoDot.setAttribute("aria-label",autoDot.title);b.appendChild(autoDot)}const n=document.createElement("span");n.textContent=i+1;b.appendChild(n);b.onclick=()=>{stop();current=i;activeLayerId=frame().layers[0].id;selection=null;selectionDrag=null;clearProposal();render()};list.appendChild(b)}$("framePageInfo").textContent="الإطارات "+(start+1)+"–"+end+" من "+project.frames.length;$("framePagePrev").disabled=start===0;$("framePageNext").disabled=end>=project.frames.length;$("frameJumpInput").max=String(project.frames.length);$("frameJumpInput").value=String(current+1)}
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
$("deleteCharacterLibraryBtn").onclick=()=>{try{const id=$("characterLibrarySelect").value,entry=(project.characterLibrary||[]).find(item=>item.id===id);if(!entry)throw Error("اختر شخصية من المكتبة أولاً");if((project.animeCharacterDNA||[]).some(dna=>dna.characterModelAssetId===id))throw Error("لا يمكن حذف هذا النموذج لأنه مرتبط بهوية تشريحية محفوظة. احذف الهوية أو غيّر مرجعها أولاً.");snapshot(true);removeCharacterFromLibrary(project,id);if(selectedCharacterModel?.id===entry.model.id)resetRigModel();renderCharacterLibrary();$("characterStatus").textContent="حُذفت "+entry.name+" من مكتبة المشروع."}catch(error){$("characterStatus").textContent="تعذر حذف الشخصية: "+error.message}};
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
$("deleteFrameBtn").onclick=()=>{
 if(project.frames.length===1)return alert("يجب إبقاء إطار واحد على الأقل");
 const protectedDNA=(project.animeCharacterDNA||[]).filter(dna=>dna.sourceFrameId===frame().id||(dna.keyDrawings||[]).some(key=>key.drawingAssetId===frame().id));
 if(protectedDNA.length)return alert("لا يمكن حذف هذا الإطار لأنه الرسم المرجعي الأصلي لهوية الشخصية: "+protectedDNA.map(dna=>dna.name||dna.characterAssetId).join("، ")+". احذف الهوية التشريحية أولاً أو احتفظ بالإطار.");
 snapshot();project.frames.splice(current,1);current=Math.max(0,current-1);activeLayerId=frame().layers[0].id;render()
};
function data(){return{...project,name:$("projectName").value.trim()||"مشروع بدون اسم",fps:+$("fpsSelect").value}}function download(name,blob){const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1500)}
$("saveBtn").onclick=()=>{const p=data();download((p.name.replace(/[^\p{L}\p{N}-]+/gu,"-")||"zero-project")+".zero",new Blob([JSON.stringify(p,null,2)],{type:"application/json"}));$("saveState").textContent="تم تنزيل نسخة الحفظ"};$("openBtn").onclick=()=>$("openFile").click();
$("openFile").onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>128*1024*1024)throw Error("الملف أكبر من 128 ميغابايت؛ قسّم المشروع إلى أجزاء أصغر على الهاتف.");const next=normalizeProject(JSON.parse(await file.text()));snapshot(false,true);project=next;current=0;activeLayerId=frame().layers[0].id;selection=null;activeAnimeMotionPlan=null;activeAnimeAnatomySequence=null;$("animeAnatomyGuideToggleLabel").hidden=true;$("animeAnatomyConstructionLayer").replaceChildren();renderCharacterLibrary();const selectedAnimeDNA=project.animeCharacterDNA?.find(item=>item.lastMotionAction&&Array.isArray(item.keyDrawings)&&item.keyDrawings.length>=2)||project.animeCharacterDNA?.[0];renderAnimeAnatomyDNASelect(selectedAnimeDNA?.characterAssetId||"");$("projectName").value=project.name;$("fpsSelect").value=String(project.fps);render();if(selectedAnimeDNA?.lastMotionAction)await restoreAnimeMotionPlan(selectedAnimeDNA);$("saveState").textContent="تم فتح المشروع"}catch(err){alert("تعذر فتح المشروع: "+err.message)}finally{e.target.value=""}};
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
if("serviceWorker"in navigator&&location.protocol!=="file:")addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));try{ensureArtistLearningRecord();mountDigitalArtistBrushPanel();mountAnimeArtistCurriculum();mountDigitalArtistLearning();render();resetRigModel();renderCharacterLibrary();wireAnimeAnatomyCalibration();renderAnimeAnatomyDNASelect();$("appRuntimeStatus").hidden=true}catch(error){const panel=$("appRuntimeStatus");panel.hidden=false;panel.textContent="تعذر تهيئة واجهة الرسم: "+(error?.message||String(error));console.error("ZERO STUDIO startup failed",error)}})();