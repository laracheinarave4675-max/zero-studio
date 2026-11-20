import{writeFile,mkdir}from"node:fs/promises";
import{createProject,createLayer,frameSvg}from"../app/engine.mjs";
import{createAnimationPlan,beginAnimationProduction}from"../app/animation-production.mjs";
import{runAnimationProduction}from"../app/animation-worker.mjs";
import{createGeminiAnimationProvider}from"../app/gemini-animation.mjs";

const apiKey=process.env.GEMINI_API_KEY;
const model=process.env.GEMINI_MODEL||"gemini-3.1-flash-lite";
const referenceUrl=process.env.CHARACTER_REFERENCE_URL||"https://zero-studio-flux2-preview.9test4675a26.workers.dev/gallery/83d6357f-4e5f-4f78-a603-0eb2c61ada6d";
if(!apiKey)throw Error("GEMINI_API_KEY is not configured.");
const imageResponse=await fetch(referenceUrl,{signal:AbortSignal.timeout(30000)});
if(!imageResponse.ok)throw Error("Could not retrieve the approved character reference: HTTP "+imageResponse.status);
const mimeType=(imageResponse.headers.get("content-type")||"").split(";")[0].toLowerCase();
if(!["image/jpeg","image/png","image/webp"].includes(mimeType))throw Error("The character reference must be JPEG, PNG, or WebP.");
const imageBytes=Buffer.from(await imageResponse.arrayBuffer());
if(!imageBytes.length||imageBytes.length>6*1024*1024)throw Error("Character reference is empty or exceeds 6 MiB.");

const project=createProject("ZERO STUDIO — One-second anime character motion proof");
const background=createLayer("خلفية بيضاء ثابتة");
background.locked=true;
background.operations=[{id:"motion-white-background",kind:"stroke",path:{d:"M 0 0 L 1920 0 L 1920 1080 L 0 1080 Z",stroke:"none",width:0,fill:"#ffffff"}}];
project.animationBackground=[background];
const description=[
 "Create a one-second, 24-drawing anime character motion study based on the attached approved full-body side-profile reference.",
 "The same young adult anime woman remains in strict LEFT-FACING side profile throughout: long straight dark navy-black hair reaching below the waist, pale ivory kimono with soft pink shading toward the sleeves and lower hem, red obi sash, matching pink footwear. Preserve the exact palette, face profile, hairstyle silhouette, costume design, body proportions and scale from the reference.",
 "Action: one small, natural walking step in place toward screen-left. Frames 0–5: subtle anticipation and weight transfer onto the supporting foot. Frames 6–11: the leading foot lifts and swings forward while the torso counterbalances and the sleeve begins to lag. Frames 12–17: the leading foot reaches and makes gentle ground contact; show believable ankle/knee geometry and stable balance. Frames 18–23: weight settles onto the new foot, the trailing foot follows slightly, and long hair and kimono fabric complete a restrained follow-through and settle.",
 "Keep the camera locked, full body visible from hair top to both feet, centered at the same scale on a plain transparent canvas. No camera motion, zoom, cuts, scene changes, new props, extra people, or background painting.",
 "Draw each timestamp as a genuinely new complete character pose using editable SVG paths, not a moved still image, not transforms of a single pose, not duplicated/held frames, and not a raster or video output. Preserve anatomy, silhouette, contact with the ground, cloth layering, hair continuity and consistent line weight.",
 "Use semantic layers in stable back-to-front order: rear hair, kimono/body, legs/feet, arms/sleeves, head/front hair/details. Every layer must be named consistently in all 24 frames. The output should look like polished 2D anime character key animation, not geometric stick figures or a wireframe."
].join("\n");
const plan=createAnimationPlan(description,{durationSeconds:1,fps:24,batchSize:6});
beginAnimationProduction(project,plan);
await mkdir("artifacts/character-motion/frames",{recursive:true});
const saveCheckpoint=()=>writeFile("artifacts/character-motion/character-motion.zero",JSON.stringify(project));
const provider=createGeminiAnimationProvider({apiKey,model,referenceImage:{mimeType,data:imageBytes.toString("base64")}});
const result=await runAnimationProduction(project,provider,{maxBatches:4,maxRetries:0,onBatch:saveCheckpoint});
await saveCheckpoint();
for(let index=0;index<project.frames.length;index++){
 const frame=project.frames[index];
 await writeFile("artifacts/character-motion/frames/frame-"+String(index).padStart(2,"0")+".svg",frameSvg(frame,"motion-"+index,project.animationBackground));
}
await writeFile("artifacts/character-motion/summary.json",JSON.stringify({model,referenceUrl,mimeType,referenceBytes:imageBytes.length,...result,frameCount:project.frames.length,fps:project.fps},null,2));
console.log(JSON.stringify({model,...result,frameCount:project.frames.length,artifact:"artifacts/character-motion/character-motion.zero"}));
