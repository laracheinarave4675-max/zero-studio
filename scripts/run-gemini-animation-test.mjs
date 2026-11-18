import{writeFile,mkdir}from"node:fs/promises";
import{createProject}from"../app/engine.mjs";
import{createAnimationPlan,beginAnimationProduction}from"../app/animation-production.mjs";
import{runAnimationProduction}from"../app/animation-worker.mjs";
import{createGeminiAnimationProvider}from"../app/gemini-animation.mjs";
const apiKey=process.env.GEMINI_API_KEY;
const requestedModel=process.env.GEMINI_MODEL||"gemini-3-flash";
if(!apiKey)throw Error("GEMINI_API_KEY is not configured in GitHub Actions repository secrets.");
const description="Create a complete, coherent anime-style urban street scene in daylight. Use a wide cinematic camera view with clear perspective, sidewalks, storefronts, buildings, trees, streetlights and road markings. Several distinct cars must travel through the scene in both directions, with varied speeds and spacing. Animate wheel rotation, vehicle movement, natural shadows and subtle environmental motion. Preserve the exact street layout, perspective, lighting and visual style throughout all 240 frames. Draw every frame as editable vector artwork using separate named layers. No raster images, no video generation, no static-image animation tricks. Deliver a complete 10-second sequence.";
const project=createProject("ZERO STUDIO — Gemini vector animation test");
const plan=createAnimationPlan(description,{durationSeconds:10,fps:24,batchSize:6});
beginAnimationProduction(project,plan);
const fallbacks=[requestedModel,...["gemini-3.5-flash-lite","gemini-3.1-flash-lite"].filter(model=>model!==requestedModel)];
let result,lastError,usedModel;
for(const model of fallbacks){
 try{
  const provider=createGeminiAnimationProvider({apiKey,model});
  result=await runAnimationProduction(project,provider,{maxBatches:1,maxRetries:0});
  usedModel=model;break;
 }catch(error){
  lastError=error;
  console.error("Model attempt failed:",model,String(error?.message||error));
  if(!/Gemini (503|429):/.test(String(error?.message||error)))throw error;
 }
}
if(!result)throw lastError||Error("All configured Gemini models were unavailable.");
const pathCounts=project.frames.map(frame=>frame.layers.reduce((sum,layer)=>sum+layer.operations.length,0));
if(pathCounts.some(count=>count<24))throw Error("The sample is technically valid JSON but fails the visual-detail gate: every complete frame needs at least 24 editable paths. Received: "+pathCounts.join(", "));
await mkdir("artifacts",{recursive:true});
await writeFile("artifacts/gemini-test.zero",JSON.stringify(project));
const escape=value=>String(value).replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;");
const frame=project.frames[0];
const body=frame.layers.filter(layer=>layer.visible!==false).map(layer=>'<g data-layer="'+escape(layer.name)+'">'+layer.operations.map(op=>'<path d="'+escape(op.path.d)+'" stroke="'+escape(op.path.stroke)+'" stroke-width="'+op.path.width+'" fill="'+escape(op.path.fill)+'" stroke-linecap="round" stroke-linejoin="round"/>').join("")+'</g>').join("");
await writeFile("artifacts/frame-000.svg",'<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">'+body+'</svg>');
const report={requestedModel,usedModel,fallbacksTried:fallbacks.slice(0,fallbacks.indexOf(usedModel)+1),requestedFrames:6,acceptedFrames:result.addedFrames,totalPlannedFrames:240,plannedBatches:40,completedFrames:result.completedFrames,layerNames:project.animationProduction.layerNames,continuityNote:project.animationProduction.continuityNote,projectFile:"gemini-test.zero",previewFile:"frame-000.svg",status:result.complete?"complete":"sample-batch-only"};
await writeFile("artifacts/report.json",JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
