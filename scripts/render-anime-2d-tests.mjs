import{writeFile,mkdir}from"node:fs/promises";
import{createProject,uid,validatePath,frameSvg}from"../app/engine.mjs";
import{renderAnimeBackground,createAnimeBackgroundTestPlans}from"../app/anime-background-painter.mjs";
const names={"urban-store":"01-urban-store","rural-ramen":"02-rural-ramen-shop","forest-house":"03-forest-house"};
const descriptions={"urban-store":"A Japanese urban convenience-store frontage with street furniture, vending machine, pedestrians, bicycle, trees and road","rural-ramen":"A rural ramen shop in three-quarter view beside a road receding to distant hills at golden hour","forest-house":"A traditional Japanese timber house surrounded by dense forest, layered foliage, stone retaining wall and filtered warm sunlight"};
await mkdir("artifacts/anime-2d-tests",{recursive:true});
const rows=[];
for(const plan of createAnimeBackgroundTestPlans()){
 const result=renderAnimeBackground(plan),slug=names[plan.kind];
 const project=createProject("ZERO STUDIO — "+descriptions[plan.kind]);
 const frame=project.frames[0];frame.layers=result.layers.map(source=>({id:uid("layer"),name:source.name,visible:true,locked:false,operations:source.operations.map(path=>({id:uid("op"),kind:"stroke",path:validatePath(path)}))}));
 const dir="artifacts/anime-2d-tests/"+slug;await mkdir(dir,{recursive:true});
 const svg=frameSvg(frame,slug);
 await writeFile(dir+"/scene.zero",JSON.stringify(project));
 await writeFile(dir+"/scene.svg",'<?xml version="1.0" encoding="UTF-8"?>'+svg);
 const report={kind:plan.kind,description:descriptions[plan.kind],style:"cinematic-2D-anime-background",sceneLayoutSource:"hand-authored 2D composition plan for renderer validation",drawingSource:"editable vector path operations authored by ZERO STUDIO local painter; no raster image generation",geminiUsed:false,referenceImagesSent:false,layers:frame.layers.map(l=>({name:l.name,pathCount:l.operations.length})),totalPaths:result.totalOperations,projectFormat:project.format,editable:true,uniqueFrameCount:1,visualQualityStatus:"requires human visual review against user's original references"};
 await writeFile(dir+"/report.json",JSON.stringify(report,null,2));
 rows.push({slug,kind:plan.kind,paths:result.totalOperations,layers:frame.layers.length,description:descriptions[plan.kind]});
}
const html='<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ZERO STUDIO — 2D Anime Background Tests</title><style>body{font-family:system-ui;background:#17211f;color:#f4ead7;margin:24px}main{max-width:1200px;margin:auto}section{margin:28px 0;padding:20px;background:#26342e;border-radius:16px}img{width:100%;height:auto;background:#d9e4dc;border-radius:10px}h1{font-size:28px}p{line-height:1.7;color:#d2d6c8}.meta{font-size:13px;color:#bac7b6}</style><main><h1>دراسات الخلفيات الأنمية 2D — ZERO STUDIO</h1><p>ثلاثة اختبارات مختلفة لمحرك الرسم المتجهي ثنائي الأبعاد. هذه دراسات للمحرك وليست اعتماداً نهائياً على أنها وصلت إلى مستوى الصور المرجعية.</p>'+rows.map(r=>'<section><h2>'+r.kind+'</h2><p>'+r.description+'</p><p class="meta">'+r.paths+' مساراً متجهياً · '+r.layers+' طبقات · ملف SVG وملف مشروع ZERO</p><img src="'+r.slug+'/scene.svg"></section>').join("")+'</main></html>';
await writeFile("artifacts/anime-2d-tests/index.html",html);
await writeFile("artifacts/anime-2d-tests/summary.json",JSON.stringify(rows,null,2));
console.log(JSON.stringify(rows,null,2));
