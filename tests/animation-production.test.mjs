import test from"node:test";
import assert from"node:assert/strict";
import{createProject,normalizeProject,MAX_FRAMES}from"../app/engine.mjs";
import{createAnimationPlan,beginAnimationProduction,getAnimationBatchRange,createAnimationBatchPrompt,validateAnimationBatch,appendAnimationBatch}from"../app/animation-production.mjs";
function batchFor(job,batchIndex=job.nextBatchIndex){
 const range=getAnimationBatchRange(job,batchIndex);
 return{version:1,jobId:job.id,batchIndex,startFrame:range.startFrame,continuityNote:"نفس الشارع والمباني والسيارات الحمراء، الكاميرا ثابتة، السيارة الأولى تتجه يميناً والثانية يساراً.",frames:Array.from({length:range.frameCount},(_,offset)=>{
  const index=range.startFrame+offset;
  return{index,timeSeconds:index/24,layers:[
   {name:"الخلفية",operations:[{d:"M 0 0 L 1920 0 L 1920 1080 L 0 1080 Z",stroke:"#334455",width:2,fill:"#eeeeee"}]},
   {name:"السيارات",operations:[{d:"M "+(200+index*3)+" 700 L "+(420+index*3)+" 700 L "+(400+index*3)+" 780 Z",stroke:"#172033",width:5,fill:"#cc3333"}]}
  ]}
 })}
}
test("10-second 24-drawing plan is split into resumable six-frame batches",()=>{
 const plan=createAnimationPlan("شارع نهاري تمر فيه سيارات",{durationSeconds:10,fps:24,batchSize:6});
 assert.equal(plan.totalFrames,240);assert.equal(plan.batchCount,40);assert.equal(plan.targetUniqueDrawingsPerSecond,24);
});
test("production plan preserves exactly 24 unique drawings per second",()=>{
 assert.throws(()=>createAnimationPlan("مشهد",{durationSeconds:10,fps:12}),/24 رسمة/);
});
test("plan rejects durations beyond the 30000-frame ceiling",()=>{
 assert.throws(()=>createAnimationPlan("مشهد",{durationSeconds:1251}),/30000/);
});
test("batch prompt specifies its exact global frame numbers and forbids static-image reuse",()=>{
 const project=createProject();const plan=createAnimationPlan("مشهد سيارة في شارع",{durationSeconds:2,batchSize:6});const job=beginAnimationProduction(project,plan);
 job.continuityNote="شارع واحد، كاميرا ثابتة، مبانٍ رمادية وسيارات حمراء.";const prompt=createAnimationBatchPrompt(job,1);
 assert.match(prompt,/BATCH 2 OF 8/);assert.match(prompt,/CONTINUITY NOTE FROM THE PREVIOUS APPROVED BATCH/);assert.match(prompt,/شارع واحد/);assert.match(prompt,/6 @ 0\.2500s/);assert.match(prompt,/independently drawn/);assert.match(prompt,/Do not reference, reuse/);
});
test("fixed-background jobs request only independently redrawn moving artwork",()=>{const project=createProject();project.animationBackground=[{id:"bg",name:"Background",visible:true,locked:true,operations:[{id:"bg-op",kind:"stroke",path:{d:"M 0 0 L 1920 1080",stroke:"#172033",width:2,fill:"none"}}]}];const job=beginAnimationProduction(project,createAnimationPlan("فتاة تمشي أمام متجر ياباني",{durationSeconds:1,batchSize:6}));assert.equal(job.backgroundMode,true);const prompt=createAnimationBatchPrompt(job);assert.match(prompt,/fixed, approved, editable vector background/);assert.match(prompt,/Draw ONLY the moving characters/);assert.match(prompt,/Do NOT redraw the static architecture/);assert.doesNotMatch(prompt,/Each frame must contain the complete scene/);});
test("fixed-background batches require explicitly tagged moving layers only",()=>{const project=createProject();project.animationBackground=[{id:"bg",name:"Background",visible:true,locked:true,operations:[{id:"bg-op",kind:"stroke",path:{d:"M 0 0 L 1920 1080",stroke:"#172033",width:2,fill:"none"}}]}];const job=beginAnimationProduction(project,createAnimationPlan("شخصية تمشي أمام متجر",{durationSeconds:1,batchSize:6}));const payload=batchFor(job);for(const frame of payload.frames)for(const layer of frame.layers)layer.role="moving";assert.equal(validateAnimationBatch(job,payload).frames.length,6);const invalid=batchFor(job);assert.throws(()=>validateAnimationBatch(job,invalid),/role=\\"moving\\"/);});
test("batch validation requires every complete frame and stable layer ordering",()=>{
 const project=createProject();const job=beginAnimationProduction(project,createAnimationPlan("مشهد",{durationSeconds:1,batchSize:6}));
 const batch=batchFor(job);const parsed=validateAnimationBatch(job,batch);
 assert.equal(parsed.frames.length,6);assert.equal(parsed.layerNames.length,2);assert.equal(parsed.frames[0].layers[1].operations[0].path.fill,"#cc3333");
});
test("batch validation rejects duplicate drawings instead of counting held frames as new drawings",()=>{
 const project=createProject();const job=beginAnimationProduction(project,createAnimationPlan("مشهد",{durationSeconds:1,batchSize:6}));
 const batch=batchFor(job);batch.frames[1].layers[1].operations[0].d=batch.frames[0].layers[1].operations[0].d;
 assert.throws(()=>validateAnimationBatch(job,batch),/نسخة مطابقة/);
});
test("batch validation rejects wrong sequence index, wrong frame count, and unsafe paths",()=>{
 const project=createProject();const job=beginAnimationProduction(project,createAnimationPlan("مشهد",{durationSeconds:1,batchSize:6}));
 const wrongIndex=batchFor(job);wrongIndex.frames[0].index=4;assert.throws(()=>validateAnimationBatch(job,wrongIndex),/ترقيم أو توقيت/);
 const wrongCount=batchFor(job);wrongCount.frames.pop();assert.throws(()=>validateAnimationBatch(job,wrongCount),/عدد الإطارات/);
 const unsafe=batchFor(job);unsafe.frames[0].layers[1].operations[0].d="M 1 1 <script>";assert.throws(()=>validateAnimationBatch(job,unsafe),/مسار/);
});
test("batches must be imported in order and cannot be imported twice",()=>{
 const project=createProject();const job=beginAnimationProduction(project,createAnimationPlan("مشهد",{durationSeconds:1,batchSize:6}));
 const second=batchFor(job,1);assert.throws(()=>appendAnimationBatch(project,second),/الدفعة التالية/);
 const first=batchFor(job);const result=appendAnimationBatch(project,first);assert.equal(result.completedFrames,6);
 assert.throws(()=>appendAnimationBatch(project,first),/الدفعة التالية/);
});
test("completed batches append real editable frames and survive project save/open",()=>{
 const project=createProject("اختبار");beginAnimationProduction(project,createAnimationPlan("سيارات تعبر الشارع",{durationSeconds:1,batchSize:6}));
 appendAnimationBatch(project,batchFor(project.animationProduction));
 appendAnimationBatch(project,batchFor(project.animationProduction));
 assert.equal(project.frames.length,12);assert.equal(project.animationProduction.completedFrames,12);
 const reopened=normalizeProject(JSON.parse(JSON.stringify(project)));
 assert.equal(reopened.frames.length,12);assert.equal(reopened.animationProduction.completedFrames,12);assert.match(reopened.animationProduction.continuityNote,/نفس الشارع/);
 assert.equal(reopened.frames[11].layers[1].operations.length,1);
});
test("final partial batch is accepted and completes the plan exactly",()=>{
 const project=createProject();beginAnimationProduction(project,createAnimationPlan("مشهد",{durationSeconds:1,batchSize:8}));
 for(let index=0;index<3;index++)appendAnimationBatch(project,batchFor(project.animationProduction));
 assert.equal(project.animationProduction.completedFrames,24);assert.equal(project.animationProduction.nextBatchIndex,3);
 assert.equal(project.frames.length,24);
 assert.throws(()=>appendAnimationBatch(project,batchFor(project.animationProduction)),/لا توجد دفعة/);
});
test("large project frame ceiling is 30000 and the former 600-frame ceiling is removed",()=>{
 assert.equal(MAX_FRAMES,30000);
 const project={format:"zero-studio",version:2,name:"large",fps:24,frames:Array.from({length:601},()=>({layers:[{name:"empty",visible:true,locked:false,operations:[]}]}))};
 assert.equal(normalizeProject(project).frames.length,601);
});
