import{createFrame,createRasterLayer}from"./engine.mjs";
// ZERO STUDIO anime motion planning: pose guides direct drawing, never deform final artwork.
// Final frames are independent raster drawings. No SVG path tween or puppet transform is emitted here.
export const ANIME_MOTION_FPS=24;
export const ANIME_MOTION_PHASES=Object.freeze(["anticipation","action","contact","passing","recovery","settle","hold"]);
export const ANIME_POSE_JOINTS=Object.freeze(["root","pelvis","chest","neck","head","shoulderL","elbowL","wristL","shoulderR","elbowR","wristR","hipL","kneeL","ankleL","hipR","kneeR","ankleR"]);
const MAX_DURATION_SECONDS=120;
const clean=(v,max=160)=>String(v??"").trim().replace(/[\u0000-\u001f]/g,"").slice(0,max);
function fail(message){throw Error(message)}
function validPoint(point,label){
 const x=Number(point?.x),y=Number(point?.y),z=Number(point?.z??0);
 if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(z)||x<0||x>1||y<0||y>1||z< -1||z>1)fail("موضع المفصل "+label+" خارج المجال المعياري.");
 return{x,y,z};
}
function normalizePoseGuide(source){
 if(!source||typeof source!=="object")fail("مرجع وضعية الجسم مفقود.");
 const joints={};
 for(const name of ANIME_POSE_JOINTS)joints[name]=validPoint(source.joints?.[name],name);
 const contacts=source.contacts&&typeof source.contacts==="object"?{...source.contacts}:{};
 const allowedContacts=["planted","swing","airborne","unknown"];
 for(const key of ["footL","footR"]){const value=String(contacts[key]||"unknown");if(!allowedContacts.includes(value))fail("حالة تماس القدم غير مدعومة.");contacts[key]=value}
 const view=String(source.view||"side");
 if(!["front","three-quarter","side","back"].includes(view))fail("زاوية وضعية الجسم غير مدعومة.");
 return{joints,contacts:{footL:contacts.footL,footR:contacts.footR},view};
}
function normalizeKeyPose(pose,index,totalFrames){
 if(!pose||typeof pose!=="object")fail("إحدى الوضعيات المفتاحية غير صالحة.");
 const frame=Number(pose.frame),id=clean(pose.id,100),description=clean(pose.description,1200),phase=String(pose.phase||"action");
 if(!id||!Number.isInteger(frame)||frame<0||frame>=totalFrames||!description)fail("بيانات الوضعية المفتاحية رقم "+(index+1)+" غير مكتملة.");
 if(!ANIME_MOTION_PHASES.includes(phase))fail("مرحلة الحركة في الوضعية المفتاحية غير معروفة.");
 const easeToNext=String(pose.easeToNext||"linear");
 if(!["linear","ease-in","ease-out","ease-in-out"].includes(easeToNext))fail("منحنى توقيت الوضعية المفتاحية غير مدعوم.");
 return{id,frame,description,phase,easeToNext,guide:normalizePoseGuide(pose.guide)};
}
export function createAnimeMotionPlan({shotId="shot-1",action,characterAssetId,characterBibleId,backgroundAssetId=null,referenceAssetIds=[],durationSeconds=1,fps=ANIME_MOTION_FPS,keyPoses,camera={locked:true,description:"fixed camera"},motionNotes=""}={}){
 const shot=clean(shotId,100),brief=clean(action,2000),character=clean(characterAssetId,160),bible=clean(characterBibleId||characterAssetId,160);
 if(!shot||!brief||!character)fail("يجب تحديد اللقطة والحركة وأصل الشخصية المعتمد.");
 if(fps!==ANIME_MOTION_FPS)fail("يحافظ ZERO STUDIO على هدف 24 رسمة مستقلة في الثانية.");
 if(!Number.isInteger(durationSeconds)||durationSeconds<1||durationSeconds>MAX_DURATION_SECONDS)fail("مدة الحركة يجب أن تكون من ثانية إلى 120 ثانية.");
 if(!Array.isArray(keyPoses)||keyPoses.length<2||keyPoses.length>durationSeconds*ANIME_MOTION_FPS)fail("تحتاج الحركة إلى وضعيتين مفتاحيتين على الأقل.");
 const totalFrames=durationSeconds*fps,poses=keyPoses.map((pose,index)=>normalizeKeyPose(pose,index,totalFrames));
 if(poses[0].frame!==0||poses.at(-1).frame!==totalFrames-1)fail("يجب أن تغطي الوضعيات المفتاحية بداية اللقطة ونهايتها.");
 const poseIds=new Set();for(let i=0;i<poses.length;i++){if(i>0&&poses[i].frame<=poses[i-1].frame)fail("يجب ترتيب الوضعيات المفتاحية زمنياً دون تكرار.");if(poseIds.has(poses[i].id))fail("معرّفات الوضعيات المفتاحية مكررة.");poseIds.add(poses[i].id);}
 const refs=[...new Set((Array.isArray(referenceAssetIds)?referenceAssetIds:[]).map(v=>clean(v,160)).filter(Boolean))];
 const bg=backgroundAssetId?clean(backgroundAssetId,160):null;
 const cameraRecord={locked:camera?.locked!==false,description:clean(camera?.description||"fixed camera",400)};
 return{format:"zero-studio-anime-motion-plan",version:1,shotId:shot,action:brief,characterAssetId:character,characterBibleId:bible,backgroundAssetId:bg,referenceAssetIds:refs,durationSeconds,fps,totalFrames,targetUniqueDrawingsPerSecond:24,camera:cameraRecord,motionNotes:clean(motionNotes,1200),keyPoses:poses};
}
function validPlan(plan){
 if(!plan||plan.format!=="zero-studio-anime-motion-plan"||plan.version!==1||plan.fps!==24||plan.totalFrames!==plan.durationSeconds*24||!Array.isArray(plan.keyPoses)||plan.keyPoses.length<2)fail("خطة التحريك غير صالحة.");
 return plan;
}
export function getAnimeFrameRole(plan,frameIndex){
 validPlan(plan);
 if(!Number.isInteger(frameIndex)||frameIndex<0||frameIndex>=plan.totalFrames)fail("رقم إطار الحركة خارج الحدود.");
 const exact=plan.keyPoses.find(pose=>pose.frame===frameIndex);
 if(exact)return{frameIndex,timeSeconds:frameIndex/plan.fps,kind:"key-drawing",keyPoseId:exact.id,fromKeyPoseId:exact.id,toKeyPoseId:exact.id};
 const before=[...plan.keyPoses].reverse().find(pose=>pose.frame<frameIndex);
 const after=plan.keyPoses.find(pose=>pose.frame>frameIndex);
 return{frameIndex,timeSeconds:frameIndex/plan.fps,kind:"inbetween-drawing",keyPoseId:null,fromKeyPoseId:before.id,toKeyPoseId:after.id};
}
function eased(t,curve){
 if(curve==="ease-in")return t*t;
 if(curve==="ease-out")return 1-(1-t)*(1-t);
 if(curve==="ease-in-out")return t*t*(3-2*t);
 return t;
}
/**
 * Samples only a normalized spatial pose guide between approved key poses.
 * This data may drive a 3D blocking preview or guide a new 2D drawing.
 * It MUST NOT be applied as a transform/warp to the approved character artwork.
 */
export function sampleAnimePoseGuide(plan,frameIndex){
 const role=getAnimeFrameRole(plan,frameIndex);
 const exact=plan.keyPoses.find(pose=>pose.frame===frameIndex);
 if(exact)return{frameIndex,source:"key-pose-guide",poseId:exact.id,description:exact.description,phase:exact.phase,guide:{joints:Object.fromEntries(ANIME_POSE_JOINTS.map(name=>[name,{...exact.guide.joints[name]}])),contacts:{...exact.guide.contacts},view:exact.guide.view}};
 const from=plan.keyPoses.find(pose=>pose.id===role.fromKeyPoseId),to=plan.keyPoses.find(pose=>pose.id===role.toKeyPoseId);
 const raw=(frameIndex-from.frame)/(to.frame-from.frame),t=eased(raw,from.easeToNext),joints={};
 for(const name of ANIME_POSE_JOINTS){const a=from.guide.joints[name],b=to.guide.joints[name];joints[name]={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t};}
 const contacts={footL:raw<.5?from.guide.contacts.footL:to.guide.contacts.footL,footR:raw<.5?from.guide.contacts.footR:to.guide.contacts.footR};
 return{frameIndex,source:"interpolated-pose-guide-only",fromPoseId:from.id,toPoseId:to.id,progress:Number(t.toFixed(5)),guide:{joints,contacts,view:raw<.5?from.guide.view:to.guide.view}};
}
export function createAnimeDrawingSchedule(plan){
 validPlan(plan);
 return Array.from({length:plan.totalFrames},(_,frameIndex)=>({...getAnimeFrameRole(plan,frameIndex),guide:sampleAnimePoseGuide(plan,frameIndex),requirement:"independent-raster-drawing",exposureFrames:1,backgroundAssetId:plan.backgroundAssetId}));
}
const POSE_GUIDE_BONES=Object.freeze([
 ["root","pelvis"],["pelvis","chest"],["chest","neck"],["neck","head"],
 ["chest","shoulderL"],["shoulderL","elbowL"],["elbowL","wristL"],
 ["chest","shoulderR"],["shoulderR","elbowR"],["elbowR","wristR"],
 ["pelvis","hipL"],["hipL","kneeL"],["kneeL","ankleL"],
 ["pelvis","hipR"],["hipR","kneeR"],["kneeR","ankleR"]
]);
/**
 * Paints a temporary raster pose reference into a supplied browser Canvas.
 * It is only a spatial guide for a separate full 2D drawing request.
 * The canvas image is never accepted as a final character frame.
 */
export function renderAnimePoseGuidePng(canvas,plan,frameIndex,{width=512,height=512}={}){
 if(!canvas||typeof canvas.getContext!=="function"||typeof canvas.toDataURL!=="function")fail("لوحة Canvas غير متاحة لرسم دليل الوضعية.");
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<256||height<256||width>2048||height>2048)fail("أبعاد دليل الوضعية غير مدعومة.");
 const sampled=sampleAnimePoseGuide(plan,frameIndex),guide=sampled.guide;
 canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext("2d");
 if(!ctx)fail("تعذر تهيئة سطح Canvas ثنائي الأبعاد.");
 const point=name=>({x:guide.joints[name].x*width,y:guide.joints[name].y*height,z:guide.joints[name].z});
 ctx.clearRect(0,0,width,height);
 ctx.fillStyle="#F5F7FA";ctx.fillRect(0,0,width,height);
 ctx.strokeStyle="#A8B2C0";ctx.lineWidth=2;ctx.setLineDash([8,8]);ctx.beginPath();ctx.moveTo(0,height*.9);ctx.lineTo(width,height*.9);ctx.stroke();ctx.setLineDash([]);
 ctx.lineCap="round";ctx.lineJoin="round";
 for(const [from,to] of POSE_GUIDE_BONES){
  const a=point(from),b=point(to),depth=(a.z+b.z)/2;
  ctx.strokeStyle=depth>.25?"#B65C43":depth<-.25?"#5478A8":"#25364C";
  ctx.lineWidth=Math.max(3,Math.min(13,8+depth*2));
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
 }
 const head=point("head"),neck=point("neck");
 ctx.strokeStyle="#25364C";ctx.lineWidth=4;ctx.beginPath();ctx.arc(head.x,head.y,Math.max(10,width*.028),0,Math.PI*2);ctx.stroke();
 for(const name of ANIME_POSE_JOINTS){
  const p=point(name),radius=Math.max(3,Math.min(8,5+p.z*1.5));
  ctx.fillStyle=name==="root"||name==="pelvis"?"#D68A39":"#F9FAFB";
  ctx.strokeStyle="#25364C";ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();ctx.stroke();
 }
 for(const [side,foot] of [["L","footL"],["R","footR"]]){
  const ankle=point("ankle"+side),contact=guide.contacts[foot],ground=height*.9;
  ctx.strokeStyle=contact==="planted"?"#2D8B67":"#C58A36";ctx.lineWidth=3;
  if(contact==="planted"){ctx.beginPath();ctx.ellipse(ankle.x,ground,Math.max(9,width*.035),Math.max(3,height*.009),0,0,Math.PI*2);ctx.stroke();}
  else if(contact==="swing"||contact==="airborne"){ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(ankle.x,ankle.y);ctx.lineTo(ankle.x,ground);ctx.stroke();ctx.setLineDash([]);}
 }
 const dataUrl=canvas.toDataURL("image/png");
 if(typeof dataUrl!=="string"||!dataUrl.startsWith("data:image/png;base64,"))fail("تعذر تصدير دليل الوضعية كصورة PNG.");
 return{dataUrl,width,height,mimeType:"image/png",frameIndex,source:sampled.source,guideOnly:true};
}
function normalizeAnimeReferenceDataUrl(dataUrl,label){
 if(typeof dataUrl!=="string")fail("الصورة المرجعية "+label+" مفقودة.");
 const match=/^data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(dataUrl);
 if(!match)fail("الصورة المرجعية "+label+" ليست PNG أو JPEG أو WebP صالحة.");
 const estimatedBytes=Math.floor(match[1].length*3/4);
 if(estimatedBytes<1||estimatedBytes>512*1024)fail("الصورة المرجعية "+label+" تتجاوز حد 512 كيلوبايت.");
 return dataUrl;
}
/**
 * Builds a single-still request for the existing FLUX.2 image department.
 * It never calls a provider and never asks for a video or frame interpolation.
 * Reference order is explicit because the current Worker accepts four inputs.
 */
export function createAnimeStillDrawingRequest(plan,frameIndex,{
 characterReferenceDataUrl,
 modelSheetDataUrl,
 poseGuideDataUrl,
 previousKeyDrawingDataUrl,
 fromKeyDrawingDataUrl,
 toKeyDrawingDataUrl,
 aspectRatio="16:9"
}={}){
 const role=getAnimeFrameRole(plan,frameIndex),pose=sampleAnimePoseGuide(plan,frameIndex);
 if(!["16:9","1:1"].includes(aspectRatio))fail("نسبة أبعاد الرسمة غير مدعومة.");
 const references=[],labels=[];
 const add=(dataUrl,label)=>{references.push(normalizeAnimeReferenceDataUrl(dataUrl,label));labels.push(label)};
 add(characterReferenceDataUrl,"هوية الشخصية المعتمدة");
 if(role.kind==="key-drawing"){
  add(poseGuideDataUrl,"مرجع الوضعية");
  if(previousKeyDrawingDataUrl)add(previousKeyDrawingDataUrl,"الرسمة المفتاحية السابقة");
  if(modelSheetDataUrl)add(modelSheetDataUrl,"ورقة نموذج الشخصية");
 }else{
  add(fromKeyDrawingDataUrl,"الرسمة المفتاحية السابقة");
  add(toKeyDrawingDataUrl,"الرسمة المفتاحية التالية");
  add(poseGuideDataUrl,"دليل الوضعية المستهدف");
 }
 if(references.length>4)fail("يتجاوز عدد الصور المرجعية الحد المدعوم.");
 const poseDescription=pose.description||plan.keyPoses.find(item=>item.id===role.fromKeyPoseId)?.description||"";
 const action=clean(plan.action,220),motionNotes=clean(plan.motionNotes,120);
 const referenceGuide=labels.map((label,index)=>"Image "+(index+1)+": "+label+".").join(" ");
 const frameBrief=role.kind==="key-drawing"
  ? "KEY DRAWING: choose a readable story pose and strong silhouette."
  : "IN-BETWEEN: draw a NEW complete pose at this exact time, respecting both adjacent approved drawings. Never blend, morph, ghost, or copy them.";
 const prompt=[
  "Create ONE finished, full-body 2D Japanese anime production drawing for frame "+(frameIndex+1)+"/"+plan.totalFrames+" at "+(frameIndex/24).toFixed(4)+"s.",
  frameBrief,
  referenceGuide,
  "Keep the exact same character identity: face/profile, eyes, hairstyle, accessories, costume, colours, proportions and distinctive details. Do not redesign.",
  "Pose: "+clean(poseDescription,220),
  "Action: "+action,
  motionNotes?"Motion note: "+motionNotes:"",
  "Draw head, hands, legs and feet with correct anatomy, perspective, foreshortening, clean anime linework, cel shading and detailed hair/cloth folds.",
  "Use the pose guide only for body position, orientation and foot contact. Never draw its skeleton, mannequin, guide marks or labels.",
  "One character only. No panels, extra poses, text, logos, scenery, motion blur or speed-line substitutes.",
  "Flat uniform chroma-blue (#00AEEF) background, no gradient or cast shadow; separate every hair strand, sleeve and accessory cleanly for alpha cutout.",
  "Return one new static raster drawing, never a video, sprite sheet, vector or transformed copy."
 ].filter(Boolean).join(" ");
 if(prompt.length>1800)fail("تعليمات الرسمة تتجاوز حد محرك الصور.");
 return{endpoint:"/api/images",method:"POST",model:"flux-2-klein-4b",aspectRatio,prompt,references,frameIndex,frameNumber:frameIndex+1,frameKind:role.kind,fromKeyPoseId:role.fromKeyPoseId,toKeyPoseId:role.toKeyPoseId,referenceLabels:labels};
}
export function createAnimeMotionSequence(plan){
 validPlan(plan);
 return{format:"zero-studio-anime-raster-sequence",version:1,shotId:plan.shotId,fps:24,durationSeconds:plan.durationSeconds,backgroundAssetId:plan.backgroundAssetId,characterAssetId:plan.characterAssetId,plan,frames:createAnimeDrawingSchedule(plan).map(item=>({...item,drawing:null}))};
}
export function attachAnimeRasterDrawing(sequence,frameIndex,drawing){
 if(!sequence||sequence.format!=="zero-studio-anime-raster-sequence"||sequence.version!==1||!Array.isArray(sequence.frames))fail("تسلسل رسومات الأنمي غير صالح.");
 const frame=sequence.frames[frameIndex];
 if(!frame||frame.frameIndex!==frameIndex)fail("الإطار المطلوب غير موجود في التسلسل.");
 if(frame.drawing)fail("هذا الإطار يحتوي رسمة معتمدة بالفعل.");
 const assetId=clean(drawing?.assetId,160),contentHash=String(drawing?.contentHash||"").trim().toLowerCase(),mimeType=String(drawing?.mimeType||""),width=Number(drawing?.width),height=Number(drawing?.height),dataUrl=drawing?.dataUrl;
 if(!assetId||!/^[a-f0-9]{16,128}$/.test(contentHash)||!["image/png","image/webp"].includes(mimeType)||!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>8192||height>8192)fail("بيانات رسمة Raster المستقلة غير مكتملة أو غير مدعومة.");
 if(dataUrl!==undefined){const prefix="data:"+mimeType+";base64,";if(typeof dataUrl!=="string"||!dataUrl.startsWith(prefix)||dataUrl.length>32*1024*1024||!/^[A-Za-z0-9+/]*={0,2}$/.test(dataUrl.slice(prefix.length)))fail("محتوى رسمة Raster غير صالح.");}
 if(sequence.frames.some(item=>item.drawing?.contentHash===contentHash||item.drawing?.assetId===assetId))fail("يجب أن تكون كل رسمة في التسلسل مستقلة وغير مكررة.");
 frame.drawing={assetId,contentHash,mimeType,width,height,alpha:true, ...(dataUrl!==undefined?{dataUrl}:{})};
 return frame;
}
export function validateAnimeMotionSequence(sequence,{requireComplete=true}={}){
 if(!sequence||sequence.format!=="zero-studio-anime-raster-sequence"||sequence.version!==1||sequence.fps!==24||!Array.isArray(sequence.frames)||sequence.frames.length!==sequence.durationSeconds*24)fail("تسلسل إطارات الأنمي لا يطابق خطة 24 إطاراً في الثانية.");
 const hashes=new Set(),assets=new Set();let completed=0;
 for(let i=0;i<sequence.frames.length;i++){
  const frame=sequence.frames[i];
  if(frame.frameIndex!==i||frame.timeSeconds!==i/24||frame.exposureFrames!==1||!["key-drawing","inbetween-drawing"].includes(frame.kind)||frame.requirement!=="independent-raster-drawing")fail("بيانات إطار الأنمي رقم "+(i+1)+" غير مطابقة للتسلسل.");
  if(!frame.drawing){if(requireComplete)fail("الرسمة النقطية للإطار "+(i+1)+" لم تُعتمد بعد.");continue;}
  if(hashes.has(frame.drawing.contentHash)||assets.has(frame.drawing.assetId))fail("توجد رسومات مكررة داخل تسلسل الأنمي.");
  hashes.add(frame.drawing.contentHash);assets.add(frame.drawing.assetId);completed++;
 }
 return{frameCount:sequence.frames.length,completedDrawings:completed,missingDrawings:sequence.frames.length-completed,uniqueDrawingCount:hashes.size,uniqueDrawingsPerSecond:Number((hashes.size/sequence.durationSeconds).toFixed(3)),meets24UniqueDrawingsPerSecond:completed===sequence.frames.length&&hashes.size===sequence.frames.length};
}

/**
 * Converts a fully approved sequence into native ZERO STUDIO frame records.
 * Each timestamp becomes its own Canvas/Raster-compatible layer; no pixel
 * tween, vector path, or character transform is created.
 */
export function materializeAnimeRasterFrames(sequence,{layerNamePrefix="Character"}={}){
 validateAnimeMotionSequence(sequence);
 const prefix=clean(layerNamePrefix,60)||"Character";
 return sequence.frames.map((frame,index)=>{
  const drawing=frame.drawing;
  if(!drawing?.dataUrl)fail("ملف الصورة النقطية للإطار "+(index+1)+" غير متاح للاستيراد إلى مشروع ZERO STUDIO.");
  const layer=createRasterLayer({name:prefix+" — "+String(index+1).padStart(2,"0"),dataUrl:drawing.dataUrl,mimeType:drawing.mimeType,width:drawing.width,height:drawing.height,opacity:1,blendMode:"normal"});
  const projectFrame=createFrame();
  projectFrame.layers=[layer];
  return projectFrame;
 });
}
