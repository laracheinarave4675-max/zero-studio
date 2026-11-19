import fs from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { generateAnimeVectorBackground, reviewAnimeVectorPreview } from "../app/scene-production.mjs";

const key = String(process.env.GEMINI_API_KEY || "").trim();
const out = "artifacts/gemini-visual-acceptance";
await fs.mkdir(out, { recursive: true });
const scenes = [
  { id:"woodland-japanese-house", title:"Traditional Japanese house in a sunlit forest", prompt:"Create an original premium cinematic 2D Japanese anime background: a large traditional two-storey Japanese wooden residence on a gentle stone terrace, layered dark ceramic tile roofs with accurate eaves and exposed timber joinery, veranda and sliding windows, mature irregular trees and dense varied foliage framing the house, moss, stone retaining wall and garden plants. Wide 16:9 establishing shot, coherent three-quarter architectural perspective, warm late-afternoon sun entering from upper right, cool deep forest shadows, delicate atmospheric depth, carefully observed painted materials. No people, no logos, no copied film frame." },
  { id:"rural-japanese-convenience-store", title:"Small Japanese convenience store at a quiet intersection", prompt:"Create an original premium cinematic 2D Japanese anime background: a small Japanese neighborhood convenience store on a quiet rural intersection, low wide storefront with glass windows, sliding entrance, colorful but fictional horizontal fascia bands, vending machine, benches, utility poles and overhead wires, road markings, curb and sidewalk, distant wooded hills and lush summer trees. Wide 16:9 street-level establishing shot with accurate one-point perspective, warm afternoon sunlight, believable glass reflections and asphalt texture, detailed painted foliage and architecture. No readable brand logos, no copied film frame." },
  { id:"rural-ramen-restaurant", title:"Roadside ramen restaurant in the Japanese countryside", prompt:"Create an original premium cinematic 2D Japanese anime background: a modest two-storey roadside ramen restaurant in rural Japan, traditional tiled sloping roof, wooden signboard with abstract non-readable lettering, noren entrance curtain, planters, parking shoulder and sidewalk, two-lane road receding toward green hills, utility poles and distant countryside. Wide 16:9 cinematic composition from the roadside, accurate perspective and scale, golden-hour sunlight from the left, long soft shadows, layered mountains, lush natural vegetation, finely observed wood, tile, concrete and asphalt. No people, no real logos, no copied film frame." }
];
const html = await fs.readFile("app/index.html","utf8");
const defs = [...html.matchAll(/<defs>[\\s\\S]*?<\\/defs>/g)].map(m=>m[0]).join("");
if (!defs) throw new Error("ZERO STUDIO SVG material/filter definitions were not found.");
function renderSvg(layers) {
  const groups = layers.map(layer => '<g data-layer="'+String(layer.name).replaceAll("&","&amp;").replaceAll('"',"&quot;")+'">'+layer.operations.map(op => '<path d="'+op.d+'" fill="'+(op.fill||"none")+'" stroke="'+(op.stroke||"none")+'" stroke-width="'+(op.width||1)+'" stroke-linecap="round" stroke-linejoin="round"'+(op.opacity===undefined?"":' opacity="'+op.opacity+'"')+(op.filter?' filter="'+op.filter+'"':"")+'/>').join("")+'</g>').join("");
  return '<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">'+defs+groups+'</svg>';
}
const report={branch:"feature/fixed-background-visual-review",method:"ZERO STUDIO seven-layer SVG artist + Gemini PNG vision reviewer; SVG rasterized with resvg",scenes:[],startedAt:new Date().toISOString()};
for(const scene of scenes){
  const item={id:scene.id,title:scene.title,prompt:scene.prompt,passes:[]};
  let revisionBrief="";
  try{
    for(let pass=1;pass<=2;pass++){
      const result=await generateAnimeVectorBackground(key,scene.prompt,fetch,"gemini-3.5-flash-lite",{fallbackModels:["gemini-3.1-flash-lite"],revisionBrief});
      const svg=renderSvg(result.layers);
      const png=new Resvg(svg,{fitTo:{mode:"width",value:1280}}).render().asPng();
      const critique=await reviewAnimeVectorPreview(key,scene.prompt,new Uint8Array(png),fetch,result.model,{fallbackModels:["gemini-3.1-flash-lite"]});
      const passed=critique.overallScore>=8&&critique.looksLike2DAnime===true&&Array.isArray(critique.criticalIssues)&&critique.criticalIssues.length===0;
      item.passes.push({pass,model:result.model,layerCount:result.layers.length,totalOperations:result.totalOperations,score:critique.overallScore,looksLike2DAnime:critique.looksLike2DAnime,criticalIssues:critique.criticalIssues,issues:critique.issues,nextRevisionBrief:critique.nextRevisionBrief,qualityGatePassed:passed});
      await fs.writeFile(path.join(out,scene.id+"-pass-"+pass+".svg"),svg);
      await fs.writeFile(path.join(out,scene.id+"-pass-"+pass+".png"),png);
      if(passed){item.finalPass=pass;item.qualityGatePassed=true;break;}
      if(pass===1)revisionBrief=critique.nextRevisionBrief||critique.issues.map(x=>x.area+": "+x.problem+" — "+x.correction).join("\\n");
      else item.qualityGatePassed=false;
    }
  }catch(error){item.error=String(error?.message||error);item.qualityGatePassed=false;}
  report.scenes.push(item);
  await fs.writeFile(path.join(out,scene.id+".json"),JSON.stringify(item,null,2));
  await fs.writeFile(path.join(out,"report.json"),JSON.stringify(report,null,2));
}
report.finishedAt=new Date().toISOString();
await fs.writeFile(path.join(out,"report.json"),JSON.stringify(report,null,2));
const rows=report.scenes.map(s=>{const p=s.passes.at(-1);return "| "+s.title+" | "+(p?.score??"n/a")+"/10 | "+(s.qualityGatePassed?"PASS":"FAIL")+" | "+(p?.totalOperations??0)+" | "+(s.error||"").replaceAll("|","/")+" |";}).join("\\n");
await fs.appendFile(process.env.GITHUB_STEP_SUMMARY||"/dev/null","## ZERO STUDIO — Gemini visual acceptance\\n\\n| Scene | Gemini score | Quality gate | SVG operations | Error |\\n|---|---:|---|---:|---|\\n"+rows+"\\n\\nSVG source, PNG previews and JSON critique reports are attached as the `gemini-visual-acceptance` workflow artifact.\\n");
if(report.scenes.length!==3||report.scenes.some(s=>!s.qualityGatePassed))process.exitCode=1;
