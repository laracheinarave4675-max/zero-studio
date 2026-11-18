import{writeFile,mkdir}from"node:fs/promises";
import{createProject,uid,validatePath,SVG_DEFS}from"../app/engine.mjs";
import{generateMeshEnvironmentProposal}from"../app/scene-production.mjs";
const key=process.env.GEMINI_API_KEY;
if(!key)throw Error("GEMINI_API_KEY is not configured.");
const description="Premium cinematic anime background painting of a small Japanese countryside ramen restaurant at golden hour, seen from a three-quarter street-side camera. A detailed two-storey timber-and-plaster building with a complex tiled roof, deep eaves, wooden lattice windows, glass reflections, fabric entrance curtain, painted vertical signboards, potted plants and a small parked kei van. The building stands beside a gently curving rural road and sidewalk receding toward distant green hills. Include utility poles and overhead wires, layered trees and shrubs in foreground, middle distance and background, atmospheric hills, warm low sun from frame-left, long cast shadows, soft bounce light and subtle reflections. Coherent architectural perspective and grounded objects. Rich material variation, irregular foliage, natural proportions, selective fine linework, warm cinematic grading, painterly anime film-background finish. No people. Avoid flat front elevation, cartoon icons, repeated circles, thick black outlines, empty black gaps and geometric placeholders.";
const model=process.env.GEMINI_MODEL||"gemini-3.5-flash-lite";
const proposal=await generateMeshEnvironmentProposal(key,description,fetch,model);
const project=createProject("ZERO STUDIO — Cinematic anime environment artist test");
const frame=project.frames[0];frame.layers=[];
for(const source of proposal.layers){
 const layer={id:uid("layer"),name:source.name,visible:true,locked:false,operations:source.operations.map(path=>({id:uid("op"),kind:"stroke",path:validatePath(path)}))};
 frame.layers.push(layer);
}
const escape=value=>String(value).replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;");
const body=frame.layers.map(layer=>'<g data-layer="'+escape(layer.name)+'">'+layer.operations.map(op=>'<path d="'+escape(op.path.d)+'" stroke="'+escape(op.path.stroke)+'" stroke-width="'+op.path.width+'" fill="'+escape(op.path.fill)+'" stroke-linecap="round" stroke-linejoin="round"/>').join("")+'</g>').join("");
await mkdir("artifacts",{recursive:true});
await writeFile("artifacts/cinematic-ramen-shop.zero",JSON.stringify(project));
await writeFile("artifacts/cinematic-ramen-shop.svg",'<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">'+SVG_DEFS+body+'</svg>');
const counts=frame.layers.map(layer=>({name:layer.name,paths:layer.operations.length}));
const report={model,layers:counts.length,totalPaths:proposal.totalOperations,layerBreakdown:counts,editable:true,referenceImagesSent:false,renderer:"3D mesh projection with per-face directional shading to editable SVG",visualQualityStatus:"awaiting-human-review",sceneDescription:description,blueprint:proposal.plan,camera:proposal.camera};
await writeFile("artifacts/report.json",JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
