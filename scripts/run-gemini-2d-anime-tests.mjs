import{writeFile,mkdir}from"node:fs/promises";
import{createProject,uid,validatePath,frameSvg}from"../app/engine.mjs";
import{generateAnimeVectorBackground}from"../app/scene-production.mjs";
const key=process.env.GEMINI_API_KEY,model=process.env.GEMINI_MODEL||"gemini-3.5-flash-lite";
if(!key)throw Error("GEMINI_API_KEY is not configured.");
const scenes=[
 {slug:"01-urban-store",name:"Japanese urban convenience-store street",prompt:"A wide cinematic 2D anime background of a Japanese neighborhood convenience store on a quiet summer afternoon. Three-quarter street-level view with the store frontage extending across frame and a little visible side depth. Detailed glass storefront with reflections of trees and sky, metal mullions, colored fascia bands, sign, entrance door, vending machines, benches, curb, road markings and overhead street infrastructure. Dense mature trees behind the roof, layered shrubs and foreground plants. Two small high-school-age passersby and one bicycle provide scale without becoming the focal point. Warm late afternoon sun from upper right, soft leaf shadows and reflected green light. Rich believable urban material details, natural Japanese neighborhood ambience."},
 {slug:"02-rural-ramen",name:"Rural Japanese ramen shop at golden hour",prompt:"A cinematic 2D anime environment background of a small Japanese countryside ramen restaurant beside a gently receding two-lane road. Three-quarter view from the sidewalk, eye-level camera. Detailed two-storey timber-and-plaster shop with complex tiled roof, thick eaves, wood lattice windows, reflective glass, vertical hand-painted signs, fabric noren curtain at the doorway, potted plants and a small parked kei van. Utility poles and overhead cables follow the road into distant green hills. A low warm sun from the left creates long soft shadows, golden rim light, reflected green bounce and atmospheric haze. Strong perspective and natural scale, rich surface details and layered vegetation."},
 {slug:"03-forest-house",name:"Traditional Japanese house in a dense forest garden",prompt:"A rich cinematic 2D anime background painting of a traditional Japanese timber house nestled in dense green woodland. Wide three-quarter camera view. Large detailed house with layered tiled roofs, visible roof thickness, ornate eaves, timber beams, wooden balcony and veranda, lattice windows, glass reflections, plaster walls and a stone retaining wall with an irregular garden path. Multiple overlapping trees of varied species and heights frame the building at foreground, midground and distance. Dense organic foliage with visible branches, varied leaf silhouettes and dappled sunlight passing through canopy. Warm late-afternoon light from upper right, soft volumetric light shafts, contact shadows, cool green reflected light and atmospheric depth. The house remains the focal point."}
];
await mkdir("artifacts/gemini-2d-anime-scenes",{recursive:true});
const summary=[];
for(const scene of scenes){
 console.log("Generating "+scene.slug+" with "+model);
 const result=await generateAnimeVectorBackground(key,scene.prompt,fetch,model,{fallbackModels:["gemini-3.1-flash-lite","gemini-3-flash"]});
 model=result.model;
 const project=createProject("ZERO STUDIO — "+scene.name);
 const frame=project.frames[0];
 frame.layers=result.layers.map(source=>({id:uid("layer"),name:source.name,visible:true,locked:false,operations:source.operations.map(path=>({id:uid("op"),kind:"stroke",path:validatePath(path)}))}));
 const dir="artifacts/gemini-2d-anime-scenes/"+scene.slug;
 await mkdir(dir,{recursive:true});
 await writeFile(dir+"/scene.zero",JSON.stringify(project));
 await writeFile(dir+"/scene.svg",'<?xml version="1.0" encoding="UTF-8"?>'+frameSvg(frame,scene.slug));
 const report={scene:scene.name,scenePrompt:scene.prompt,model,provider:"Google Gemini Developer API",artist:"seven-pass 2D vector background artist",referenceImagesSent:false,referenceBasis:"user-provided reference images analysed by the assistant; only a textual brief was sent to Gemini",style:result.style,blueprint:result.plan,layers:frame.layers.map(layer=>({name:layer.name,paths:layer.operations.length})),totalPaths:result.totalOperations,editable:true,uniqueFrames:1,visualQualityStatus:"pending human full-resolution review"};
 await writeFile(dir+"/report.json",JSON.stringify(report,null,2));
 summary.push({slug:scene.slug,name:scene.name,totalPaths:result.totalOperations,layers:frame.layers.length,layerDetails:report.layers});
 console.log(JSON.stringify({scene:scene.slug,totalPaths:result.totalOperations,layerCount:frame.layers.length}));
}
await writeFile("artifacts/gemini-2d-anime-scenes/summary.json",JSON.stringify(summary,null,2));
const gallery='<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ZERO STUDIO — Gemini 2D Anime Tests</title><style>body{margin:24px;background:#17211f;color:#f4ead7;font-family:system-ui}main{max-width:1280px;margin:auto}section{background:#26342e;padding:20px;margin:26px 0;border-radius:16px}img{width:100%;height:auto;background:#d9e4dc;border-radius:10px}p{line-height:1.7}.meta{color:#bac7b6;font-size:13px}</style><main><h1>اختبارات رسام الأنمي ثنائي الأبعاد — ZERO STUDIO</h1><p>المشاهد الثلاثة مرسومة بواسطة Gemini على سبع طبقات SVG مستقلة لكل مشهد. لم تُستخدم صور Raster أو مولدات فيديو.</p>'+summary.map(s=>'<section><h2>'+s.name+'</h2><p class="meta">'+s.totalPaths+' مساراً متجهياً · '+s.layers+' طبقات · SVG وZERO قابلان للتحرير</p><img src="'+s.slug+'/scene.svg"></section>').join("")+'</main></html>';
await writeFile("artifacts/gemini-2d-anime-scenes/index.html",gallery);
console.log("Completed "+summary.length+" editable anime environment scenes.");
