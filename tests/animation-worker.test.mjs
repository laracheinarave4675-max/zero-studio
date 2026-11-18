import test from"node:test";
import assert from"node:assert/strict";
import{createProject}from"../app/engine.mjs";
import{createAnimationPlan,beginAnimationProduction,getAnimationBatchRange}from"../app/animation-production.mjs";
import{runAnimationProduction}from"../app/animation-worker.mjs";
function batchFor(job,batchIndex=job.nextBatchIndex){
 const range=getAnimationBatchRange(job,batchIndex);
 return{version:1,jobId:job.id,batchIndex,startFrame:range.startFrame,continuityNote:"شارع نهاري ثابت، سيارات حمراء، الكاميرا لا تتحرك.",frames:Array.from({length:range.frameCount},(_,offset)=>{
  const index=range.startFrame+offset;
  return{index,timeSeconds:index/24,layers:[
   {name:"الخلفية",operations:[{d:"M 0 0 L 1920 0 L 1920 1080 L 0 1080 Z",stroke:"#334455",width:2,fill:"#eeeeee"}]},
   {name:"السيارات",operations:[{d:"M "+(200+index*3)+" 700 L "+(420+index*3)+" 700 L "+(400+index*3)+" 780 Z",stroke:"#172033",width:5,fill:"#cc3333"}]}
  ]}
 })}
}
function project(){const p=createProject();beginAnimationProduction(p,createAnimationPlan("سيارات تعبر شارعاً نهاراً",{durationSeconds:1,batchSize:6}));return p}
test("provider-neutral worker sequentially produces and appends multiple batches",async()=>{
 const p=project(),calls=[],saved=[];
 const result=await runAnimationProduction(p,async request=>{calls.push(request);return JSON.stringify(batchFor(p.animationProduction,request.batchIndex))},{maxBatches:2,maxRetries:0,onBatch:state=>saved.push(state)});
 assert.equal(result.acceptedBatches,2);assert.equal(result.addedFrames,12);assert.equal(result.completedFrames,12);assert.equal(result.remainingBatches,2);assert.equal(p.frames.length,12);assert.equal(saved.length,2);
 assert.match(calls[1].prompt,/CONTINUITY NOTE FROM THE PREVIOUS APPROVED BATCH/);assert.match(calls[1].prompt,/شارع نهاري ثابت/);
});
test("worker retries a rejected batch without mutating the project",async()=>{
 const p=project();let attempts=0;
 const result=await runAnimationProduction(p,async request=>{attempts++;if(attempts===1)return "not json";return JSON.stringify(batchFor(p.animationProduction,request.batchIndex))},{maxBatches:1,maxRetries:1});
 assert.equal(attempts,2);assert.equal(result.completedFrames,6);assert.equal(p.frames.length,6);
});
test("worker fails safely after retry limit and leaves rejected batch uncommitted",async()=>{
 const p=project();
 await assert.rejects(()=>runAnimationProduction(p,async()=>"{bad json",{maxBatches:1,maxRetries:2}),/3 محاولات/);
 assert.equal(p.animationProduction.completedFrames,0);assert.equal(p.frames.length,1);
});
test("worker can accept structured provider output as well as JSON text",async()=>{
 const p=project();
 const result=await runAnimationProduction(p,async request=>({text:JSON.stringify(batchFor(p.animationProduction,request.batchIndex))}),{maxBatches:1,maxRetries:0});
 assert.equal(result.addedFrames,6);
});
test("worker stops when the supplied signal is already aborted",async()=>{
 const p=project();let called=false;
 await assert.rejects(()=>runAnimationProduction(p,async()=>{called=true;return""},{signal:{aborted:true}}),error=>error.name==="AbortError");
 assert.equal(called,false);assert.equal(p.animationProduction.completedFrames,0);
});
test("worker validates bounds for run size and retry count",async()=>{
 const p=project();
 await assert.rejects(()=>runAnimationProduction(p,async()=>"",{maxBatches:0}),/بين 1 و1000/);
 await assert.rejects(()=>runAnimationProduction(p,async()=>"",{maxRetries:4}),/بين 0 و3/);
});
