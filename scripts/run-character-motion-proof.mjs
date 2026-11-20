import{writeFile,mkdir,rename,readFile}from"node:fs/promises";
import{createProject,createLayer,frameSvg,normalizeProject}from"../app/engine.mjs";
import{createAnimationPlan,beginAnimationProduction,validateAnimationCheckpoint}from"../app/animation-production.mjs";
import{runAnimationProduction}from"../app/animation-worker.mjs";
import{createGeminiAnimationProvider}from"../app/gemini-animation.mjs";

const apiKey=process.env.GEMINI_API_KEY;
const model=process.env.GEMINI_MODEL||"gemini-3.5-flash-lite";
const referenceUrl=process.env.CHARACTER_REFERENCE_URL||"https://zero-studio-flux2-preview.9test4675a26.workers.dev/gallery/83d6357f-4e5f-4f78-a603-0eb2c61ada6d";
if(!apiKey)throw Error("GEMINI_API_KEY is not configured.");
const outputDirectory="artifacts/character-motion";
const checkpointOutput=outputDirectory+"/character-motion.zero";
await mkdir(outputDirectory+"/frames",{recursive:true});
const description=[
 "Create a one-second, 24-drawing anime character motion study based on the attached approved full-body side-profile reference.",
 "The same young adult anime woman remains in strict LEFT-FACING side profile throughout: long straight dark navy-black hair reaching below the waist, pale ivory kimono with soft pink shading toward the sleeves and lower hem, red obi sash, matching pink footwear. Preserve the exact palette, face profile, hairstyle silhouette, costume design, body proportions and scale from the reference.",
 "Action: one small, natural walking step in place toward screen-left. Frames 0–5: subtle anticipation and weight transfer onto the supporting foot. Frames 6–11: the leading foot lifts and swings forward while the torso counterbalances and the sleeve begins to lag. Frames 12–17: the leading foot reaches and makes gentle ground contact; show believable ankle/knee geometry and stable balance. Frames 18–23: weight settles onto the new foot, the trailing foot follows slightly, and long hair and kimono fabric complete a restrained follow-through and settle.",
 "Keep the camera locked, full body visible from hair top to both feet, centered at the same scale on a plain transparent canvas. No camera motion, zoom, cuts, scene changes, new props, extra people, or background painting.",
 "Draw each timestamp as a genuinely new complete character pose using editable SVG paths, not a moved still image, not transforms of a single pose, not duplicated/held frames, and not a raster or video output. Preserve anatomy, silhouette, contact with the ground, cloth layering, hair continuity and consistent line weight.",
 "Use semantic layers in stable back-to-front order: rear hair, kimono/body, legs/feet, arms/sleeves, head/front hair/details. Every layer must be named consistently in all 24 frames. The output should look like polished 2D anime character key animation, not geometric stick figures or a wireframe."
].join("\n");
let project;
const checkpointInput=String(process.env.MOTION_CHECKPOINT_PATH||"").trim();
if(checkpointInput){
 const checkpointRaw=JSON.parse(await readFile(checkpointInput,"utf8"));
 project=normalizeProject(checkpointRaw);
 const checkpoint=validateAnimationCheckpoint(project);
 console.log("Restored checkpoint: "+checkpoint.completedFrames+"/"+checkpoint.totalFrames+" frames; next batch "+(checkpoint.nextBatchIndex+1)+" of "+checkpoint.batchCount+".");
}else{
 project=createProject("ZERO STUDIO — One-second anime character motion proof");
 const background=createLayer("خلفية بيضاء ثابتة");
 background.locked=true;
 background.operations=[{id:"motion-white-background",kind:"stroke",path:{d:"M 0 0 L 1920 0 L 1920 1080 L 0 1080 Z",stroke:"none",width:0,fill:"#ffffff"}}];
 project.animationBackground=[background];
 beginAnimationProduction(project,createAnimationPlan(description,{durationSeconds:1,fps:24,batchSize:6}));
}
const saveCheckpoint=async()=>{
 const temporary=checkpointOutput+".tmp";
 await writeFile(temporary,JSON.stringify(project));
 await rename(temporary,checkpointOutput);
};
await saveCheckpoint();
const imageResponse=await fetch(referenceUrl,{signal:AbortSignal.timeout(30000)});
if(!imageResponse.ok)throw Error("Could not retrieve the approved character reference: HTTP "+imageResponse.status);
const mimeType=(imageResponse.headers.get("content-type")||"").split(";")[0].toLowerCase();
if(!["image/jpeg","image/png","image/webp"].includes(mimeType))throw Error("The character reference must be JPEG, PNG, or WebP.");
const imageBytes=Buffer.from(await imageResponse.arrayBuffer());
if(!imageBytes.length||imageBytes.length>6*1024*1024)throw Error("Character reference is empty or exceeds 6 MiB.");
const provider=createGeminiAnimationProvider({apiKey,model,referenceImage:{mimeType,data:imageBytes.toString("base64")}});
const result=await runAnimationProduction(project,provider,{maxBatches:4,maxRetries:4,retryBaseDelayMs:5000,retryMaxDelayMs:60000,onBatch:saveCheckpoint});
await saveCheckpoint();
for(let index=0;index<project.frames.length;index++){
 const frame=project.frames[index];
 await writeFile("artifacts/character-motion/frames/frame-"+String(index).padStart(2,"0")+".svg",frameSvg(frame,"motion-"+index,project.animationBackground));
}

const frameCards=project.frames.map((_,index)=>'<button class="thumb" type="button" data-frame="'+index+'" aria-label="Frame '+(index+1)+'"><img loading="lazy" src="frames/frame-'+String(index).padStart(2,"0")+'.svg" alt="Frame '+(index+1)+'"><span>'+String(index+1).padStart(2,"0")+'</span></button>').join("");
const frameNames=project.frames.map((_,index)=>"frames/frame-"+String(index).padStart(2,"0")+".svg");
const previewHtml=`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ZERO STUDIO — 24-frame character motion proof</title>
<style>
:root{color-scheme:dark;font:16px system-ui,sans-serif;background:#111827;color:#f3f4f6}
*{box-sizing:border-box}body{margin:0 auto;padding:18px;max-width:1100px}
h1{font-size:1.2rem;margin:0 0 6px}.meta{color:#aab5c5;font-size:.9rem;margin:0 0 18px}
.stage{background:#fff;border-radius:10px;overflow:hidden;width:100%;aspect-ratio:16/9;display:grid;place-items:center}
.stage img{display:block;width:100%;height:100%;object-fit:contain}
.controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:14px 0}
button{font:inherit;color:#f8fafc;background:#263449;border:1px solid #50617b;border-radius:8px;padding:9px 13px}
button:focus-visible{outline:3px solid #93c5fd;outline-offset:2px}
#frameNumber{margin-left:auto;color:#cbd5e1;font-variant-numeric:tabular-nums}
.grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-top:18px}
.thumb{padding:3px;min-width:0;display:grid;gap:4px}.thumb img{display:block;width:100%;aspect-ratio:16/9;object-fit:contain;background:#fff;border-radius:4px}.thumb span{font-size:.75rem;color:#cbd5e1}
.thumb[aria-pressed="true"]{border-color:#93c5fd;background:#334155}
@media(max-width:560px){body{padding:10px}.grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}.controls button{padding:8px 10px}}
</style>
</head>
<body>
<h1>ZERO STUDIO — Anime Character Motion Proof</h1>
<p class="meta">24 separately drawn SVG frames · 24 drawings per second · 1 second · Gemini model: ${model}</p>
<div class="stage"><img id="current" src="${frameNames[0]}" alt="Motion frame 1"></div>
<div class="controls">
<button id="play" type="button">Play at 24 fps</button><button id="pause" type="button">Pause</button>
<button id="previous" type="button">Previous</button><button id="next" type="button">Next</button>
<span id="frameNumber">Frame 01 / 24</span>
</div>
<div class="grid" id="frames">${frameCards}</div>
<script>
const sources=${JSON.stringify(frameNames)};
const current=document.getElementById("current");
const label=document.getElementById("frameNumber");
const thumbs=[...document.querySelectorAll("[data-frame]")];
let frame=0,playing=false,last=0,elapsed=0;
function show(index){frame=(index+sources.length)%sources.length;current.src=sources[frame];current.alt="Motion frame "+(frame+1);label.textContent="Frame "+String(frame+1).padStart(2,"0")+" / "+sources.length;thumbs.forEach((thumb,i)=>thumb.setAttribute("aria-pressed",String(i===frame)));}
function tick(now){if(!playing)return;if(!last)last=now;elapsed+=now-last;last=now;const interval=1000/24;while(elapsed>=interval){frame=(frame+1)%sources.length;elapsed-=interval;}show(frame);requestAnimationFrame(tick);}
document.getElementById("play").addEventListener("click",()=>{if(!playing){playing=true;last=0;requestAnimationFrame(tick);}});
document.getElementById("pause").addEventListener("click",()=>{playing=false;last=0;});
document.getElementById("previous").addEventListener("click",()=>show(frame-1));
document.getElementById("next").addEventListener("click",()=>show(frame+1));
thumbs.forEach(thumb=>thumb.addEventListener("click",()=>show(Number(thumb.dataset.frame))));
show(0);
</script>
</body></html>`;
await writeFile("artifacts/character-motion/index.html",previewHtml);

await writeFile("artifacts/character-motion/summary.json",JSON.stringify({model,referenceUrl,mimeType,referenceBytes:imageBytes.length,...result,frameCount:project.frames.length,fps:project.fps,preview:"index.html"},null,2));
console.log(JSON.stringify({model,...result,frameCount:project.frames.length,artifact:"artifacts/character-motion/character-motion.zero"}));
