import{MAX_FRAMES,MAX_LAYERS,createLayer,uid,validatePath}from"./engine.mjs";
export const ANIMATION_BATCH_SIZE_DEFAULT=6;
export const ANIMATION_BATCH_SIZE_OPTIONS=Object.freeze([1,2,3,4,6,8,12,24]);
const MAX_DESCRIPTION=10000;
const cleanName=value=>String(value??"").trim().replace(/[<>\u0000-\u001f]/g,"").slice(0,60);
function fail(message){throw Error(message)}
function validJob(job){
 if(!job||job.format!=="zero-studio-animation-job"||job.version!==1||typeof job.id!=="string"||!job.id)fail("خطة إنتاج الحركة غير صالحة.");
 if(typeof job.description!=="string"||!job.description.trim()||job.description.length>MAX_DESCRIPTION)fail("وصف المشهد في الخطة غير صالح.");
 if(typeof job.continuityNote!=="string"||job.continuityNote.length>2000)fail("ملاحظة استمرارية المشهد غير صالحة.");
 if(job.fps!==24||!Number.isInteger(job.durationSeconds)||job.durationSeconds<1||job.totalFrames!==job.durationSeconds*24||job.totalFrames>MAX_FRAMES)fail("عدد إطارات خطة الحركة غير صالح.");
 if(!ANIMATION_BATCH_SIZE_OPTIONS.includes(job.batchSize))fail("حجم دفعة الرسم غير مدعوم.");
 if(!Number.isInteger(job.completedFrames)||job.completedFrames<0||job.completedFrames>job.totalFrames)fail("تقدم إنتاج الحركة غير صالح.");
 const expected=Math.ceil(job.completedFrames/job.batchSize);
 if(!Number.isInteger(job.nextBatchIndex)||job.nextBatchIndex!==expected)fail("مؤشر الدفعة لا يطابق تقدم الإنتاج.");
 if(!Number.isInteger(job.baseFrameCount)||job.baseFrameCount<0||job.baseFrameCount>MAX_FRAMES)fail("موضع بداية الإنتاج غير صالح.");
 if(!Array.isArray(job.frameSignatures)||job.frameSignatures.length!==job.completedFrames)fail("سجل الرسومات السابقة غير مكتمل.");
 if(job.backgroundMode!==undefined&&typeof job.backgroundMode!=="boolean")fail("وضع الخلفية الثابتة غير صالح.");
 return job;
}
export function createAnimationPlan(description,{durationSeconds=10,fps=24,batchSize=ANIMATION_BATCH_SIZE_DEFAULT}={}){
 const brief=String(description??"").trim();
 if(!brief||brief.length>MAX_DESCRIPTION)fail("اكتب وصف المشهد أولاً، وبحد أقصى 10000 حرف.");
 if(fps!==24)fail("هذه الخطة تحافظ على الهدف الأصلي: 24 رسمة مستقلة كل ثانية.");
 if(!Number.isInteger(durationSeconds)||durationSeconds<1||durationSeconds*24>MAX_FRAMES)fail("المدة يجب أن تكون عدداً صحيحاً من الثواني، ولا تتجاوز سعة 30000 إطار.");
 if(!ANIMATION_BATCH_SIZE_OPTIONS.includes(batchSize))fail("اختر حجم دفعة من الخيارات المدعومة.");
 return{format:"zero-studio-animation-plan",version:1,id:uid("animation"),description:brief,fps:24,durationSeconds,totalFrames:durationSeconds*24,batchSize,batchCount:Math.ceil(durationSeconds*24/batchSize),targetUniqueDrawingsPerSecond:24};
}
export function beginAnimationProduction(project,plan){
 if(!project||!Array.isArray(project.frames))fail("المشروع غير صالح.");
 if(project.animationProduction&&project.animationProduction.completedFrames<project.animationProduction.totalFrames)fail("هناك إنتاج حركة سابق لم يكتمل. أكمل دفعاته أولاً.");
 if(!plan||plan.format!=="zero-studio-animation-plan"||plan.version!==1)fail("ملف خطة الحركة غير صالح.");
 const blank=project.frames.length===1&&project.frames[0].layers.every(layer=>layer.operations.length===0);
 const baseFrameCount=blank?0:project.frames.length;
 if(baseFrameCount+plan.totalFrames>MAX_FRAMES)fail("لا توجد سعة كافية لإضافة هذه الحركة إلى المشروع.");
 project.animationProduction={format:"zero-studio-animation-job",version:1,id:plan.id,description:plan.description,fps:plan.fps,durationSeconds:plan.durationSeconds,totalFrames:plan.totalFrames,batchSize:plan.batchSize,batchCount:plan.batchCount,completedFrames:0,nextBatchIndex:0,baseFrameCount,layerNames:null,continuityNote:"",frameSignatures:[],backgroundMode:Array.isArray(project.animationBackground)&&project.animationBackground.length>0};
 return project.animationProduction;
}
export function reconfigureAnimationCheckpointBatchSize(project,batchSize=2){
 const job=validJob(project?.animationProduction);
 if(!ANIMATION_BATCH_SIZE_OPTIONS.includes(batchSize))fail("حجم دفعة الاستكمال غير مدعوم.");
 if(!Array.isArray(project.frames)||project.frames.length!==Math.max(1,job.baseFrameCount+job.completedFrames))fail("عدد إطارات ملف الاستكمال غير متطابق.");
 if(job.completedFrames%batchSize!==0)fail("لا يمكن تقسيم الإطارات المحفوظة بالتساوي على حجم الدفعة الجديد.");
 job.batchSize=batchSize;
 job.batchCount=Math.ceil(job.totalFrames/batchSize);
 job.nextBatchIndex=job.completedFrames/batchSize;
 validJob(job);
 return job;
}
export function validateAnimationCheckpoint(project,{durationSeconds=1,fps=24,batchSize=6}={}){
 const job=validJob(project?.animationProduction);
 if(project?.format!=="zero-studio"||project?.fps!==fps||job.fps!==fps||job.durationSeconds!==durationSeconds||job.totalFrames!==durationSeconds*fps||job.batchSize!==batchSize)fail("ملف الاستكمال لا يطابق اختبار الحركة المحدد (ثانية واحدة، 24 إطاراً، ودفعات من ستة).");
 if(job.completedFrames!==0&&job.completedFrames!==job.totalFrames&&job.completedFrames%job.batchSize!==0)fail("نقطة الاستكمال لا تنتهي عند حد دفعة محفوظة.");
 if(!Array.isArray(project.frames)||project.frames.length!==Math.max(1,job.baseFrameCount+job.completedFrames))fail("عدد الرسومات المحفوظة لا يطابق سجل نقطة الاستكمال.");
 if(job.backgroundMode&&(!Array.isArray(project.animationBackground)||project.animationBackground.length===0))fail("طبقة الخلفية الثابتة مفقودة من ملف الاستكمال.");
 return job;
}
export function getAnimationBatchRange(job,batchIndex=job?.nextBatchIndex){
 validJob(job);
 if(!Number.isInteger(batchIndex)||batchIndex<0||batchIndex>=job.batchCount)fail("لا توجد دفعة بهذا الرقم.");
 const startFrame=batchIndex*job.batchSize;
 return{batchIndex,startFrame,frameCount:Math.min(job.batchSize,job.totalFrames-startFrame),startTimeSeconds:startFrame/job.fps,endTimeSeconds:(startFrame+Math.min(job.batchSize,job.totalFrames-startFrame)-1)/job.fps};
}
export function createAnimationBatchPrompt(job,batchIndex=job?.nextBatchIndex,continuityNote=job?.continuityNote??""){
 const range=getAnimationBatchRange(job,batchIndex);
 const previous=String(continuityNote??"").trim().slice(0,2000);
 const frameList=Array.from({length:range.frameCount},(_,i)=>{const index=range.startFrame+i;return index+" @ "+(index/job.fps).toFixed(4)+"s"}).join(", ");
 return [
 "You are the frame-by-frame vector animation drawing department of ZERO STUDIO.",
 "Create "+range.frameCount+" COMPLETE, independently drawn anime scene frames for one continuous shot. Canvas: 1920x1080. Frame rate: exactly 24 drawings per second.",
 "SCENE BRIEF (preserve its meaning):",
 job.description,
 "BATCH "+(range.batchIndex+1)+" OF "+job.batchCount+". Zero-based global frame indexes and timestamps: "+frameList+".",
 job.backgroundMode?"A fixed, approved, editable vector background is stored separately in the ZERO STUDIO project and is composited once beneath every frame. Draw ONLY the moving characters and genuinely moving foreground elements on a transparent canvas. Do NOT redraw the static architecture, sky, road, trees, buildings, or fixed props. Do not reference, reuse, embed, or depend on raster images, video, external assets, or another frame. Every moving character pose must be independently redrawn as new editable vector geometry at this timestamp; no held drawings, tween-only motion, or raster transforms.":"Draw every frame as a complete image with all visible scene elements represented by editable SVG paths. Do not reference, reuse, embed, or depend on a raster image, video, external asset, or another frame. Do not return keyframes, tween instructions, transforms that merely move a still image, or a single image to be reused.",
 "Maintain one consistent camera, perspective, lighting, color language, object identity, and stable ordered layer names across every frame and across batches. Motion must advance naturally at the exact frame timestamps. Give moving objects genuinely updated vector geometry in each frame. Keep silhouettes, proportions, and scene continuity coherent.",
 job.layerNames?"REQUIRED LAYER NAMES AND BACK-TO-FRONT ORDER (match exactly): "+job.layerNames.join(" > "):"For the first batch, establish concise layer names that remain unchanged for the whole shot.",
 job.backgroundMode?"Use the exact previously established moving-art layer names and back-to-front order; do not include background layers. Include every established layer in every frame, mark each layer role as moving, and never return an empty layer. For each of the 5 character layers provide at least 2 separate, meaningful, visible editable SVG path operations (at least 10 total per frame): rear_hair needs a hair silhouette plus separate locks; kimono_body needs garment silhouette plus folds/obi details; legs_feet needs separate leg and foot contours; arms_sleeves needs arm/sleeve contour plus cloth folds; head_front_hair needs head/face contour plus front-hair/face details. Prefer 15–25 paths per frame. Count the path operations before returning JSON. Do not merge all details into one path, omit a body part, use empty arrays, or pad with tiny meaningless marks. Keep the full-body character readable and anatomically coherent. Maximum 100 paths per layer and 300 per frame. Every frame must have genuinely different editable vector geometry and a new pose; never duplicate a drawing.":"Use 2 to 12 named layers in back-to-front order. Each frame must contain the complete scene. Each frame MUST contain at least 24 and preferably 35–60 distinct paths, distributed across the layers (normally 4–16 paths per layer); maximum 100 paths per layer and 300 per frame. A frame with fewer than 24 paths is an incomplete draft and must not be returned. Build recognizable storefront facades with doors, windows, signs, awnings and architectural edges; multiple buildings with perspective; sidewalk curbs and pavement seams; road lane markings; at least two fully drawn cars with body contours, windows, bumpers, headlights, and two separately drawn wheels each; trees with trunks and branching foliage; streetlights with poles and fixtures; layered shadows and small environmental details. Do not reduce objects to colored rectangles or triangles. Every frame must be visually distinct from all other frames; never duplicate a frame.",
 "Allowed SVG path commands only: M L H V C S Q T A Z. Coordinates should remain within x=0..1920 and y=0..1080. Each operation has {d,stroke,width,fill}. No SVG/XML markup, scripts, style blocks, URLs, base64, raster data, markdown fences, or prose.",
 job.backgroundMode?"Return ONLY valid JSON with exactly this structure: {\"version\":1,\"jobId\":\""+job.id+"\",\"batchIndex\":"+range.batchIndex+",\"startFrame\":"+range.startFrame+",\"continuityNote\":\"...\",\"frames\":[{\"index\":0,\"timeSeconds\":0,\"layers\":[{\"name\":\"Moving character\",\"role\":\"moving\",\"operations\":[{\"d\":\"M 1 1 L 2 2\",\"stroke\":\"#172033\",\"width\":2,\"fill\":\"none\"}]}]}]}. Return exactly "+range.frameCount+" timestamped frames.":"Return ONLY valid JSON with exactly this structure: {\"version\":1,\"jobId\":\""+job.id+"\",\"batchIndex\":"+range.batchIndex+",\"startFrame\":"+range.startFrame+",\"continuityNote\":\"Summarize fixed scene layout, object identity, visual style, movement direction and end-of-batch state for the next batch (max 2000 characters).\",\"frames\":[{\"index\":0,\"timeSeconds\":0,\"layers\":[{\"name\":\"Background\",\"operations\":[{\"d\":\"M 0 0 L 1 1\",\"stroke\":\"#172033\",\"width\":2,\"fill\":\"none\"}]}]}]}. The frames array must contain exactly "+range.frameCount+" entries, in the specified order, with the exact zero-based index and timeSeconds for each entry.",
 previous?"CONTINUITY NOTE FROM THE PREVIOUS APPROVED BATCH: "+previous:"For this first batch, establish the definitive scene design, camera, depth, and visual style.",
 "Only output the JSON object. If the request cannot be fulfilled safely or within the limits, return {\"version\":1,\"jobId\":\""+job.id+"\",\"batchIndex\":"+range.batchIndex+",\"startFrame\":"+range.startFrame+",\"frames\":[]}. Do not silently reduce the number of frames."
 ].join("\n\n");
}
function signature(layers){
 let source="";
 for(const layer of layers){
  source+=layer.name+"|"+(layer.visible===false?"0":"1")+";";
  for(const operation of layer.operations)source+=operation.kind+"|"+operation.path.d+"|"+operation.path.stroke+"|"+operation.path.width+"|"+operation.path.fill+";";
 }
 let a=2166136261,b=0x9e3779b9;
 for(let i=0;i<source.length;i++){const c=source.charCodeAt(i);a=Math.imul(a^c,16777619)>>>0;b=Math.imul(b^(c+i),2246822519)>>>0}
 return a.toString(16).padStart(8,"0")+b.toString(16).padStart(8,"0");
}
export function validateAnimationBatch(job,payload){
 validJob(job);
 if(!payload||payload.version!==1||payload.jobId!==job.id)fail("هذه الدفعة لا تنتمي إلى خطة الإنتاج الحالية.");
 const batchIndex=payload.batchIndex;
 const continuityNote=String(payload.continuityNote??"").trim();
 if(!continuityNote||continuityNote.length>2000)fail("يجب أن تتضمن الدفعة ملاحظة استمرارية موجزة لا تتجاوز 2000 حرف.");
 if(batchIndex!==job.nextBatchIndex)fail("هذه ليست الدفعة التالية المطلوبة. لا يمكن تخطي دفعة أو استيرادها مرتين.");
 const range=getAnimationBatchRange(job,batchIndex);
 if(payload.startFrame!==range.startFrame||!Array.isArray(payload.frames)||payload.frames.length!==range.frameCount)fail("عدد الإطارات أو موضع بداية الدفعة غير مطابق للخطة.");
 const names=null,seen=new Set(),signatures=new Set(job.frameSignatures);
 let expectedNames=null;
 const frames=payload.frames.map((entry,index)=>{
  const globalIndex=range.startFrame+index;
  if(!entry||entry.index!==globalIndex||Math.abs(Number(entry.timeSeconds)-globalIndex/job.fps)>.0001)fail("ترقيم أو توقيت الإطار "+(globalIndex+1)+" غير مطابق للخطة.");
  if(!Array.isArray(entry.layers)||entry.layers.length<2||entry.layers.length>12)fail("يجب تقسيم كل إطار كامل إلى 2–12 طبقة مسماة.");
  const localNames=new Set();let total=0;
  const layers=entry.layers.map((source,layerIndex)=>{
   const name=cleanName(source?.name);
   if(!name||localNames.has(name))fail("اسم طبقة فارغ أو مكرر في الإطار "+(globalIndex+1)+".");
   if(job.backgroundMode&&source.role!=="moving")fail('وضع الخلفية الثابتة يتطلب role="moving" لكل طبقة؛ لا تعِد رسم الخلفية.');
   localNames.add(name);
   if(!Array.isArray(source.operations)||source.operations.length>100)fail("عدد مسارات الطبقة "+name+" غير صالح.");
   total+=source.operations.length;
   if(total>300)fail("تجاوز الإطار "+(globalIndex+1)+" حد 300 مسار متجهي.");
   const layer=createLayer(name);
   layer.operations=source.operations.map((operation,pathIndex)=>{try{return{id:uid("op"),kind:"stroke",path:validatePath(operation)}}catch(error){fail("الإطار "+(globalIndex+1)+"، الطبقة "+name+"، المسار "+(pathIndex+1)+": "+error.message)}});
   return layer;
  });
  if(job.backgroundMode&&(total<10||layers.some(layer=>layer.operations.length===0))){const counts=layers.map(layer=>layer.name+"="+layer.operations.length).join(", ");fail("الإطار "+(globalIndex+1)+" يحتوي "+total+" مسارات فقط ("+counts+"). المطلوب 10 مسارات متجهية منفصلة على الأقل، ومساران على الأقل في كل طبقة متحركة، دون طبقات فارغة.");}else if(!job.backgroundMode&&total<1)fail("الإطار "+(globalIndex+1)+" لا يحتوي رسومات مستقلة.");
  const layerNames=layers.map(layer=>layer.name);
  if(expectedNames===null)expectedNames=layerNames;
  else if(expectedNames.length!==layerNames.length||expectedNames.some((name,i)=>name!==layerNames[i]))fail("يجب الحفاظ على أسماء الطبقات وترتيبها في جميع إطارات الدفعة.");
  if(job.layerNames&&(job.layerNames.length!==layerNames.length||job.layerNames.some((name,i)=>name!==layerNames[i])))fail("ترتيب الطبقات لا يتوافق مع الدفعات المعتمدة سابقاً.");
  const frameSignature=signature(layers);
  if(signatures.has(frameSignature))fail("الإطار "+(globalIndex+1)+" نسخة مطابقة لإطار آخر؛ المطلوب رسمة مستقلة لكل إطار.");
  signatures.add(frameSignature);
  return{id:uid("frame"),layers,signature:frameSignature};
 });
 return{batchIndex,startFrame:range.startFrame,frameCount:frames.length,layerNames:expectedNames,continuityNote,frames:frames.map(({signature,...frame})=>frame),signatures:frames.map(frame=>frame.signature)};
}
export function appendAnimationBatch(project,payload){
 const job=project?.animationProduction;
 validJob(job);
 const batch=validateAnimationBatch(job,payload);
 const totalAfter=job.baseFrameCount+job.completedFrames+batch.frameCount;
 if(totalAfter>MAX_FRAMES)fail("ستتجاوز هذه الدفعة الحد الأقصى البالغ 30000 إطار.");
 const blank=job.baseFrameCount===0&&job.completedFrames===0&&project.frames.length===1&&project.frames[0].layers.every(layer=>layer.operations.length===0);
 if(blank)project.frames.splice(0,1);
 if(project.frames.length!==job.baseFrameCount+job.completedFrames)fail("تغير عدد إطارات المشروع بعد بدء الإنتاج؛ أوقف التغييرات ثم استعد آخر نسخة متوافقة.");
 project.frames.push(...batch.frames);
 job.layerNames=job.layerNames||batch.layerNames;
 job.continuityNote=batch.continuityNote;
 job.frameSignatures.push(...batch.signatures);
 job.completedFrames+=batch.frameCount;
 job.nextBatchIndex++;
 return{addedFrames:batch.frameCount,completedFrames:job.completedFrames,totalFrames:job.totalFrames,nextBatchIndex:job.nextBatchIndex,complete:job.completedFrames===job.totalFrames};
}
