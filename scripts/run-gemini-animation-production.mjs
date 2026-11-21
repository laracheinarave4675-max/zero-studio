import{writeFile,mkdir}from"node:fs/promises";
import{setTimeout as sleep}from"node:timers/promises";
import{createProject,analyzeDrawingCadence}from"../app/engine.mjs";
import{createAnimationPlan,beginAnimationProduction}from"../app/animation-production.mjs";
import{runAnimationProduction}from"../app/animation-worker.mjs";
import{createGeminiAnimationProvider}from"../app/gemini-animation.mjs";
const apiKey=process.env.GEMINI_API_KEY;
const model=process.env.GEMINI_MODEL||"gemini-3.1-flash-lite";
if(!apiKey)throw Error("GEMINI_API_KEY is not configured in GitHub Actions repository secrets.");
const description="Create a complete, coherent anime-style urban street scene in daylight. Use a wide cinematic camera view with clear perspective, sidewalks, storefronts, buildings, trees, streetlights and road markings. Several distinct cars must travel through the scene in both directions, with varied speeds and spacing. Animate wheel rotation, vehicle movement, natural shadows and subtle environmental motion. Preserve the exact street layout, perspective, lighting and visual style throughout all 240 frames. Draw every frame as editable vector artwork using separate named layers. No raster images, no video generation, no static-image animation tricks. Deliver a complete 10-second sequence.";
const project=createProject("ZERO STUDIO — 10-second Gemini anime street sequence");
const plan=createAnimationPlan(description,{durationSeconds:10,fps:24,batchSize:1});
beginAnimationProduction(project,plan);
await mkdir("artifacts/frames",{recursive:true});
const saveCheckpoint=async()=>writeFile("artifacts/gemini-street.zero",JSON.stringify(project));
const baseProvider=createGeminiAnimationProvider({apiKey,model});
const provider=async args=>{
 for(let attempt=0;attempt<3;attempt++){
  try{return await baseProvider(args)}
  catch(error){
   if(attempt===2||![429,503].includes(error?.status))throw error;
   const wait=error.status===429?60000:30000*(attempt+1);
   console.log("Temporary Gemini availability/quota response; waiting "+wait/1000+" seconds before retry "+(attempt+2)+"/3.");
   await sleep(wait);
  }
 }
};
const escape=value=>String(value).replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;");
const writeFrame=async(index)=>{
 const frame=project.frames[index];
 const body=frame.layers.filter(layer=>layer.visible!==false).map(layer=>'<g data-layer="'+escape(layer.name)+'">'+layer.operations.map(op=>'<path d="'+escape(op.path.d)+'" stroke="'+escape(op.path.stroke)+'" stroke-width="'+op.path.width+'" fill="'+escape(op.path.fill)+'" stroke-linecap="round" stroke-linejoin="round"/>').join("")+'</g>').join("");
 const svg='<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">'+body+'</svg>';
 await writeFile("artifacts/frames/frame-"+String(index).padStart(3,"0")+".svg",svg);
};
let result,errorMessage=null;
try{
 result=await runAnimationProduction(project,provider,{maxBatches:240,maxRetries:0,onBatch:async info=>{
  await saveCheckpoint();
  console.log("Checkpoint saved: "+info.completedFrames+"/240 unique drawings.");
 }});
}catch(error){
 errorMessage=String(error?.message||error);
 console.error("Production paused with a resumable checkpoint:",errorMessage);
}
await saveCheckpoint();
for(let i=0;i<project.frames.length;i++)await writeFrame(i);
let cadence=null;
if(project.frames.length)cadence=analyzeDrawingCadence(project.frames,24);
const report={model,requestedFrames:240,completedFrames:project.animationProduction.completedFrames,totalPlannedFrames:240,requestedUniqueDrawingsPerSecond:24,actualCadence:cadence,layerNames:project.animationProduction.layerNames,continuityNote:project.animationProduction.continuityNote,projectFile:"gemini-street.zero",svgFrameDirectory:"frames/",complete:project.animationProduction.completedFrames===240,error:errorMessage};
await writeFile("artifacts/report.json",JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(!report.complete)process.exitCode=1;
