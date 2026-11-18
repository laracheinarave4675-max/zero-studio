import{writeFile,mkdir}from"node:fs/promises";
import{createProject,uid,validatePath}from"../app/engine.mjs";
import{generateSceneProposal}from"../app/scene-production.mjs";
const key=process.env.GEMINI_API_KEY;
if(!key)throw Error("GEMINI_API_KEY is not configured.");
const description="Create a premium cinematic anime background painting of a small Japanese countryside ramen restaurant at golden hour, viewed from a three-quarter street-side camera. Show a detailed two-storey timber-and-plaster restaurant with a complex tiled sloping roof, deep eaves, wooden lattice windows, glass reflections, a noren fabric entrance curtain, hand-painted vertical signboards, potted plants and a small parked kei van. The building sits beside a gently curving rural road and sidewalk that recede toward distant green hills. Add utility poles and overhead wires, layered trees and shrubs in foreground, middle distance and background, atmospheric hills, a warm low sun from frame-left, long cast shadows, soft bounce light, and subtle reflected light. The architecture must obey a coherent perspective and sit firmly on the ground. Rich nuanced materials, irregular foliage, realistic proportions, selective fine linework, warm cinematic color grading, painterly anime film-background finish. No people are required. Avoid flat front elevation, cartoon icon style, repeated circles, thick black outlines, empty black areas, and simple geometric placeholders.";
const proposal=await generateSceneProposal(key,description);
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
await writeFile("artifacts/cinematic-ramen-shop.svg",'<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">'+body+'</svg>');
const counts=frame.layers.map(layer=>({name:layer.name,paths:layer.operations.length}));
const report={model:"gemini-3.5-flash-lite",layers:counts.length,totalPaths:proposal.totalOperations,layerBreakdown:counts,editable:true,referenceImagesSent:false,visualQualityStatus:"awaiting-human-review",sceneDescription:description};
await writeFile("artifacts/report.json",JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
