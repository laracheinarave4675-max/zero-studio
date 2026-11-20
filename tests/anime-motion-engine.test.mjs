import test from"node:test";
import assert from"node:assert/strict";
import{ANIME_MOTION_FPS,ANIME_POSE_JOINTS,createAnimeMotionPlan,createAnimeMotionSequence,createAnimeDrawingSchedule,sampleAnimePoseGuide,createAnimeStillDrawingRequest,renderAnimePoseGuidePng,attachAnimeRasterDrawing,validateAnimeMotionSequence,materializeAnimeRasterFrames}from"../app/anime-motion-engine.mjs";
const makeGuide=(shift=0)=>({
 view:"side",contacts:{footL:"planted",footR:"swing"},
 joints:Object.fromEntries(ANIME_POSE_JOINTS.map((name,index)=>[name,{x:Math.min(.98,.2+index*.025+shift),y:Math.min(.95,.12+index*.035),z:0}]))
});
function plan(overrides={}){return createAnimeMotionPlan({
 shotId:"walk-shot",action:"A full-body side-profile walk with anticipation, foot contact, weight transfer and settling.",
 characterAssetId:"char-approved-01",characterBibleId:"bible-01",backgroundAssetId:"bg-approved-01",
 referenceAssetIds:["model-front","model-side","model-side"],durationSeconds:1,fps:24,
 keyPoses:[
  {id:"anticipation",frame:0,phase:"anticipation",description:"The body lowers and the weight shifts over the planted rear foot.",guide:makeGuide(),easeToNext:"ease-in-out"},
  {id:"contact",frame:12,phase:"contact",description:"The leading foot contacts the ground; the torso counterbalances.",guide:makeGuide(.1),easeToNext:"ease-out"},
  {id:"settle",frame:23,phase:"settle",description:"The weight settles and the trailing foot begins to follow.",guide:makeGuide(.04)}
 ],...overrides
})}
const drawing=(i)=>({assetId:"png-"+i,contentHash:(i+1).toString(16).padStart(16,"0"),mimeType:"image/png",width:1920,height:1080});
test("anime motion plan fixes playback at 24 fps and keeps character/background assets linked",()=>{
 const p=plan();assert.equal(ANIME_MOTION_FPS,24);assert.equal(p.totalFrames,24);assert.equal(p.targetUniqueDrawingsPerSecond,24);assert.equal(p.characterAssetId,"char-approved-01");assert.equal(p.backgroundAssetId,"bg-approved-01");assert.deepEqual(p.referenceAssetIds,["model-front","model-side"]);
});
test("plan rejects non-24 fps and requires first and last drawings to be key poses",()=>{
 assert.throws(()=>plan({fps:12}),/24/);
 const p=plan();assert.throws(()=>createAnimeMotionPlan({...p,keyPoses:p.keyPoses.slice(1)}),/بداية اللقطة ونهايتها/);
});
const refImage=(mime="image/png")=>"data:"+mime+";base64,AAAA";
test("pose blocking creates a temporary full-body raster PNG guide, not a final animation frame",()=>{
 let draws=0;const ctx={clearRect(){draws++},fillRect(){draws++},setLineDash(){draws++},beginPath(){draws++},moveTo(){draws++},lineTo(){draws++},stroke(){draws++},arc(){draws++},fill(){draws++},ellipse(){draws++}};
 const canvas={width:0,height:0,getContext(type){assert.equal(type,"2d");return ctx},toDataURL(type){assert.equal(type,"image/png");return"data:image/png;base64,AAAA"}};
 const output=renderAnimePoseGuidePng(canvas,plan(),6,{width:512,height:640});
 assert.equal(canvas.width,512);assert.equal(canvas.height,640);assert.equal(output.width,512);assert.equal(output.height,640);
 assert.equal(output.mimeType,"image/png");assert.equal(output.guideOnly,true);assert.equal(output.frameIndex,6);
 assert.ok(draws>ANIME_POSE_JOINTS.length);assert.match(output.dataUrl,/^data:image\/png;base64,/);
});
test("pose-guide renderer rejects unavailable Canvas and unsafe raster dimensions",()=>{
 assert.throws(()=>renderAnimePoseGuidePng(null,plan(),0),/Canvas غير متاحة/);
 const canvas={getContext(){return{}},toDataURL(){return"data:image/png;base64,AAAA"}};
 assert.throws(()=>renderAnimePoseGuidePng(canvas,plan(),0,{width:100,height:100}),/أبعاد دليل الوضعية/);
});
test("key-drawing request calls the existing still-image API with identity, pose, previous drawing and model sheet references",()=>{
 const p=plan();const req=createAnimeStillDrawingRequest(p,12,{characterReferenceDataUrl:refImage(),poseGuideDataUrl:refImage(),previousKeyDrawingDataUrl:refImage("image/webp"),modelSheetDataUrl:refImage("image/jpeg")});
 assert.equal(req.endpoint,"/api/images");assert.equal(req.method,"POST");assert.equal(req.model,"flux-2-klein-4b");assert.equal(req.aspectRatio,"16:9");
 assert.equal(req.frameKind,"key-drawing");assert.equal(req.frameNumber,13);assert.equal(req.references.length,4);
 assert.deepEqual(req.referenceLabels,["approved character identity","spatial pose guide only","previous approved key drawing","character model sheet"]);
 assert.match(req.prompt,/Create ONE full-body/);assert.match(req.prompt,/Do not redesign/);assert.match(req.prompt,/Do not reproduce skeleton lines/);
 assert.match(req.prompt,/chroma-blue background/);assert.ok(req.prompt.length<=1800);
});
test("in-between request receives the two adjacent approved key drawings and the exact target pose",()=>{
 const req=createAnimeStillDrawingRequest(plan(),6,{characterReferenceDataUrl:refImage(),fromKeyDrawingDataUrl:refImage("image/jpeg"),toKeyDrawingDataUrl:refImage("image/webp"),poseGuideDataUrl:refImage()});
 assert.equal(req.frameKind,"inbetween-drawing");assert.equal(req.frameNumber,7);
 assert.deepEqual(req.referenceLabels,["approved character identity","previous approved key drawing","next approved key drawing","target spatial pose guide"]);
 assert.equal(req.references.length,4);assert.match(req.prompt,/Never blend, morph, ghost, or copy them/);
});
test("still drawing request rejects missing pose references, malformed images and over-limit references",()=>{
 const p=plan();assert.throws(()=>createAnimeStillDrawingRequest(p,0,{characterReferenceDataUrl:refImage()}),/مفقودة/);
 assert.throws(()=>createAnimeStillDrawingRequest(p,6,{characterReferenceDataUrl:refImage(),poseGuideDataUrl:refImage()}),/الرسمة المفتاحية السابقة مفقودة/);
 assert.throws(()=>createAnimeStillDrawingRequest(p,0,{characterReferenceDataUrl:"data:image/svg+xml;base64,AAAA",poseGuideDataUrl:refImage()}),/ليست PNG أو JPEG أو WebP صالحة/);
 const oversized="data:image/png;base64,"+"A".repeat(700000);
 assert.throws(()=>createAnimeStillDrawingRequest(p,0,{characterReferenceDataUrl:oversized,poseGuideDataUrl:refImage()}),/تتجاوز حد 512 كيلوبايت/);
 assert.throws(()=>createAnimeStillDrawingRequest(p,0,{characterReferenceDataUrl:refImage(),poseGuideDataUrl:refImage(),aspectRatio:"4:3"}),/نسبة أبعاد الرسمة/);
});
test("key pose schedule identifies key drawings and intervening drawing tasks without holds",()=>{
 const schedule=createAnimeDrawingSchedule(plan());assert.equal(schedule.length,24);
 assert.equal(schedule[0].kind,"key-drawing");assert.equal(schedule[12].kind,"key-drawing");assert.equal(schedule[23].kind,"key-drawing");
 assert.equal(schedule[6].kind,"inbetween-drawing");assert.equal(schedule[6].fromKeyPoseId,"anticipation");assert.equal(schedule[6].toKeyPoseId,"contact");
 assert.ok(schedule.every(frame=>frame.requirement==="independent-raster-drawing"&&frame.exposureFrames===1));
});
test("sampled 3D pose guides interpolate joints only and are explicitly not final artwork transforms",()=>{
 const p=plan(),sample=sampleAnimePoseGuide(p,6);assert.equal(sample.source,"interpolated-pose-guide-only");
 assert.equal(sample.fromPoseId,"anticipation");assert.equal(sample.toPoseId,"contact");
 assert.ok(sample.guide.joints.head.x>p.keyPoses[0].guide.joints.head.x);
 assert.ok(sample.guide.joints.head.x<p.keyPoses[1].guide.joints.head.x);
 assert.equal(sample.guide.view,"side");
});
test("pose guides validate all joints, normalized coordinates, view and foot contact states",()=>{
 const p=plan();assert.equal(Object.keys(p.keyPoses[0].guide.joints).length,ANIME_POSE_JOINTS.length);
 assert.throws(()=>plan({keyPoses:[{...p.keyPoses[0],guide:makeGuide()} ,{...p.keyPoses[1],frame:12,guide:{...makeGuide(),joints:{...makeGuide().joints,head:{x:2,y:.2}}}},{...p.keyPoses[2]}]}),/المفصل head/);
});
test("raster sequence counts only unique independent PNG/WebP drawings, not pose guides or background",()=>{
 const seq=createAnimeMotionSequence(plan());for(let i=0;i<24;i++)attachAnimeRasterDrawing(seq,i,drawing(i));
 const result=validateAnimeMotionSequence(seq);assert.equal(result.frameCount,24);assert.equal(result.completedDrawings,24);assert.equal(result.uniqueDrawingCount,24);assert.equal(result.uniqueDrawingsPerSecond,24);assert.equal(result.meets24UniqueDrawingsPerSecond,true);
});
test("raster sequence rejects reused image assets and duplicate content hashes",()=>{
 const seq=createAnimeMotionSequence(plan());attachAnimeRasterDrawing(seq,0,drawing(0));
 assert.throws(()=>attachAnimeRasterDrawing(seq,1,{...drawing(1),contentHash:drawing(0).contentHash}),/مكررة/);
 assert.throws(()=>attachAnimeRasterDrawing(seq,1,{...drawing(1),assetId:drawing(0).assetId}),/مكررة/);
});
test("incomplete sequences report remaining raster drawings instead of pretending FPS means unique drawings",()=>{
 const seq=createAnimeMotionSequence(plan());attachAnimeRasterDrawing(seq,0,drawing(0));attachAnimeRasterDrawing(seq,1,drawing(1));
 const result=validateAnimeMotionSequence(seq,{requireComplete:false});assert.equal(result.completedDrawings,2);assert.equal(result.missingDrawings,22);assert.equal(result.uniqueDrawingCount,2);assert.equal(result.uniqueDrawingsPerSecond,2);assert.equal(result.meets24UniqueDrawingsPerSecond,false);
 assert.throws(()=>validateAnimeMotionSequence(seq),/لم تُعتمد بعد/);
});
test("raster frame contract rejects vector-only payloads and invalid frame sizes",()=>{
 const seq=createAnimeMotionSequence(plan());assert.throws(()=>attachAnimeRasterDrawing(seq,0,{assetId:"x",contentHash:"1234567890abcdef",mimeType:"image/svg+xml",width:1920,height:1080}),/غير مكتملة أو غير مدعومة/);
 assert.throws(()=>attachAnimeRasterDrawing(seq,0,{...drawing(0),width:20000}),/غير مكتملة أو غير مدعومة/);
});
test("approved anime drawings materialize as independent native ZERO STUDIO raster frames",()=>{
 const seq=createAnimeMotionSequence(plan());for(let i=0;i<24;i++)attachAnimeRasterDrawing(seq,i,{...drawing(i),dataUrl:"data:image/png;base64,AAAA"});
 const frames=materializeAnimeRasterFrames(seq,{layerNamePrefix:"Nori"});
 assert.equal(frames.length,24);assert.ok(frames.every(frame=>frame.layers.length===1&&frame.layers[0].type==="raster"));
 assert.equal(frames[0].layers[0].name,"Nori — 01");assert.equal(frames[23].layers[0].name,"Nori — 24");
 assert.ok(frames.every(frame=>frame.layers[0].dataUrl==="data:image/png;base64,AAAA"));
 assert.ok(frames.every(frame=>frame.layers[0].operations.length===0));
});
test("raster materialization refuses frames whose full image bytes are not present",()=>{
 const seq=createAnimeMotionSequence(plan());for(let i=0;i<24;i++)attachAnimeRasterDrawing(seq,i,drawing(i));
 assert.throws(()=>materializeAnimeRasterFrames(seq),/غير متاح للاستيراد/);
});
test("raster frame data URLs are checked against their declared image format",()=>{
 const seq=createAnimeMotionSequence(plan());assert.throws(()=>attachAnimeRasterDrawing(seq,0,{...drawing(0),dataUrl:"data:image/jpeg;base64,AAAA"}),/محتوى رسمة Raster غير صالح/);
 assert.doesNotThrow(()=>attachAnimeRasterDrawing(seq,0,{...drawing(0),dataUrl:"data:image/png;base64,AAAA"}));
});
