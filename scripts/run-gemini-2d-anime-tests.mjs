import{writeFile,mkdir}from"node:fs/promises";
import{Resvg}from"@resvg/resvg-js";
import{createProject,uid,validatePath,frameSvg}from"../app/engine.mjs";
import{generateAnimeVectorBackground,reviewAnimeVectorPreview}from"../app/scene-production.mjs";
const key=process.env.GEMINI_API_KEY,model=process.env.GEMINI_MODEL||"gemini-3.5-flash-lite",maxPasses=Math.min(3,Math.max(2,Number(process.env.MAX_ART_PASSES)||3));
if(!key)throw Error("GEMINI_API_KEY is not configured.");
const scenes=[
 {slug:"01-urban-store",name:"Japanese urban convenience-store street",prompt:"A wide cinematic 2D anime background of a Japanese neighborhood convenience store on a quiet summer afternoon. Three-quarter street-level view with the store frontage extending across frame and a little visible side depth. Detailed glass storefront with reflections of trees and sky, metal mullions, colored fascia bands, sign, entrance door, vending machines, benches, curb, road markings and overhead street infrastructure. Dense mature trees behind the roof, layered shrubs and foreground plants. Two small high-school-age passersby and one bicycle provide scale without becoming the focal point. Warm late afternoon sun from upper right, soft leaf shadows and reflected green light. Rich believable urban material details, natural Japanese neighborhood ambience."},
 {slug:"02-rural-ramen",name:"Rural Japanese ramen shop at golden hour",prompt:"A cinematic 2D anime environment background of a small Japanese countryside ramen restaurant beside a gently receding two-lane road. Three-quarter view from the sidewalk, eye-level camera. Detailed two-storey timber-and-plaster shop with complex tiled roof, thick eaves, wood lattice windows, reflective glass, vertical hand-painted signs, fabric noren curtain at the doorway, potted plants and a small parked kei van. Utility poles and overhead cables follow the road into distant green hills. A low warm sun from the left creates long soft shadows, golden rim light, reflected green bounce and atmospheric haze. Strong perspective and natural scale, rich surface details and layered vegetation."},
 {slug:"03-forest-house",name:"Traditional Japanese house in a dense forest garden",prompt:"A rich cinematic 2D anime background painting of a traditional Japanese timber house nestled in dense green woodland. Wide three-quarter camera view. Large detailed house with layered tiled roofs, visible roof thickness, ornate eaves, timber beams, wooden balcony and veranda, lattice windows, glass reflections, plaster walls and a stone retaining wall with an irregular garden path. Multiple overlapping trees of varied species and heights frame the building at foreground, midground and distance. Dense organic foliage with visible branches, varied leaf silhouettes and dappled sunlight passing through canopy. Warm late-afternoon light from upper right, soft volumetric light shafts, contact shadows, cool green reflected light and atmospheric depth. The house remains the focal point."}
];
await mkdir("artifacts/gemini-2d-anime-scenes",{recursive:true});
const summary=[];
for(const scene of scenes){
 console.log("Starting "+scene.slug+"; maximum visual passes: "+maxPasses);
 let revisionBrief="",finalResult,finalPreview,finalCritique;
 const critiqueHistory=[];
 for(let pass=1;pass<=maxPasses;pass++){
  console.log("Drawing "+scene.slug+" — pass "+pass);
  const result=await generateAnimeVectorBackground(key,scene.prompt,fetch,model,{fallbackModels:["gemini-3.1-flash-lite","gemini-3-flash"],revisionBrief,onProgress:info=>console.log(info.message)});
  const project=createProject("ZERO STUDIO — "+scene.name),frame=project.frames[0];
  frame.layers=result.layers.map(source=>({id:uid("layer"),name:source.name,visible:true,locked:false,operations:source.operations.map(path=>({id:uid("op"),kind:"stroke",path:validatePath(path)}))}));
  const svg='<?xml version="1.0" encoding="UTF-8"?>'+frameSvg(frame,scene.slug);
  const png=new Resvg(svg,{fitTo:{mode:"width",value:1280}}).render().asPng();
  console.log("Visually reviewing "+scene.slug+" preview ("+png.length+" bytes)");
  const critique=await reviewAnimeVectorPreview(key,scene.prompt,png,fetch,result.model);
  critiqueHistory.push({pass,model:critique.model,score:critique.overallScore,looksLike2DAnime:critique.looksLike2DAnime,criticalIssues:critique.criticalIssues,issues:critique.issues,strengths:critique.strengths});
  console.log(JSON.stringify({scene:scene.slug,pass,score:critique.overallScore,looksLike2DAnime:critique.looksLike2DAnime,issues:critique.issues.length}));
  finalResult={...result,model:result.model,pass};finalPreview=png;finalCritique=critique;
  if(critique.overallScore>=8&&critique.looksLike2DAnime&&critique.criticalIssues.length===0)break;
  revisionBrief=critique.nextRevisionBrief||critique.issues.map(x=>x.area+": "+x.problem+" — "+x.correction).join("\n");
 }
 const frameProject=createProject("ZERO STUDIO — "+scene.name);
 frameProject.frames[0].layers=finalResult.layers.map(source=>({id:uid("layer"),name:source.name,visible:true,locked:false,operations:source.operations.map(path=>({id:uid("op"),kind:"stroke",path:validatePath(path)}))}));
 const dir="artifacts/gemini-2d-anime-scenes/"+scene.slug;await mkdir(dir,{recursive:true});
 await writeFile(dir+"/scene.zero",JSON.stringify(frameProject));
 await writeFile(dir+"/scene.svg",'<?xml version="1.0" encoding="UTF-8?>'+frameSvg(frameProject.frames[0],scene.slug));
 await writeFile(dir+"/scene-preview.png",finalPreview);
 const report={scene:scene.name,scenePrompt:scene.prompt,model:finalResult.model,provider:"Google Gemini Developer API",artist:"seven-pass 2D vector background artist with visual critique and revision",referenceImagesSent:false,referenceBasis:"the assistant analysed the user's original references; Gemini received a written scene brief only",style:finalResult.style,blueprint:finalResult.plan,layers:frameProject.frames[0].layers.map(layer=>({name:layer.name,paths:layer.operations.length})),totalPaths:finalResult.totalOperations,editable:true,passes:critiqueHistory,finalCritique,visualQualityStatus:finalCritique.overallScore>=8&&finalCritique.looksLike2DAnime&&finalCritique.criticalIssues.length===0?"automated-gate-passed-pending-user-approval":"below-artistic-acceptance-target"};
 await writeFile(dir+"/report.json",JSON.stringify(report,null,2));
 summary.push({slug:scene.slug,name:scene.name,totalPaths:finalResult.totalOperations,layers:frameProject.frames[0].layers.length,score:finalCritique.overallScore,looksLike2DAnime:finalCritique.looksLike2DAnime,passes:critiqueHistory.length,status:report.visualQualityStatus});
 console.log(JSON.stringify(summary.at(-1)));
}
await writeFile("artifacts/gemini-2d-anime-scenes/summary.json",JSON.stringify(summary,null,2));
const gallery='<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ZERO STUDIO — Gemini 2D Anime Tests</title><style>body{margin:24px;background:#17211f;color:#f4ead7;font-family:system-ui}main{max-width:1280px;margin:auto}section{background:#26342e;padding:20px;margin:26px 0;border-radius:16px}img{width:100%;height:auto;background:#d9e4dc;border-radius:10px}p{line-height:1.7}.meta{color:#bac7b6;font-size:13px}</style><main><h1>اختبارات رسام الأنمي ثنائي الأبعاد — ZERO STUDIO</h1><p>ثلاثة مشاهد مستقلة، سبع طبقات SVG قابلة للتحرير لكل مشهد، مع معاينة بصرية ونقد وتصحيح آلي محدود. المعاينة النقطية للفحص فقط؛ العمل النهائي SVG.</p>'+summary.map(s=>'<section><h2>'+s.name+'</h2><p class="meta">'+s.totalPaths+' مساراً متجهياً · '+s.layers+' طبقات · تقييم بصري آلي '+s.score+'/10 · '+s.passes+' جولات</p><img src="'+s.slug+'/scene-preview.png"></section>').join("")+'</main></html>';
await writeFile("artifacts/gemini-2d-anime-scenes/index.html",gallery);
console.log("Completed "+summary.length+" editable 2D anime scenes with visual critique reports.");
