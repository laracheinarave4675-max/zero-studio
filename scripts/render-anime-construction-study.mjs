import {mkdir,writeFile} from "node:fs/promises";
import {createCanvas} from "@napi-rs/canvas";
import {buildAnimeConstructionModel,auditAnimeConstructionModel} from "../app/anime-construction-artist.mjs";
import {compileAnimeConstructionBrushPlan} from "../app/anime-construction-brush-plan.mjs";
import {executeDigitalArtistBrushStream} from "../app/digital-artist-brush-executor.mjs";
import {drawRasterBrushStroke,fillRasterRegion,mapPointsToRaster} from "../app/raster-brushes.mjs";
import {analyzeRasterPixels,analyzeStrokeGeometry} from "../app/digital-artist-eyes.mjs";

const width=1920,height=1080,out="artifacts/anime-construction-study";
const model=buildAnimeConstructionModel({viewYaw:.18,lightDirection:{x:-.7,y:-.7}});
const modelAudit=auditAnimeConstructionModel(model);
if(!modelAudit.valid)throw new Error("Anime construction model audit failed: "+JSON.stringify(modelAudit.findings));
const plan=compileAnimeConstructionBrushPlan(model);
const composite=createCanvas(width,height),ctx=composite.getContext("2d");
await mkdir(out+"/layers",{recursive:true});
const layers=[],geometry=[];
const result=await executeDigitalArtistBrushStream(plan,{
 createLayer:async descriptor=>{const canvas=createCanvas(width,height);return{descriptor,canvas,context:canvas.getContext("2d"),strokeCount:0,fillCount:0};},
 paintStroke:async(target,command)=>{
  const mapped=mapPointsToRaster(command.points,width,height,width,height,command.options.size??1);
  const painted=command.kind==="raster-region-fill"
   ?fillRasterRegion(target.context,mapped.points,command.options)
   :drawRasterBrushStroke(target.context,mapped.points,{...command.options,size:mapped.size});
  target.strokeCount++;if(command.kind==="raster-region-fill")target.fillCount++;
  geometry.push({id:command.strokeId,kind:command.kind,...analyzeStrokeGeometry({points:command.points})});
  return painted;
 },
 finalizeLayer:async target=>{
  const data=target.context.getImageData(0,0,width,height).data;
  const raster=analyzeRasterPixels({width,height,data});
  if(raster.visiblePixels<10)throw new Error("Construction study layer is empty: "+target.descriptor.id);
  if(target.descriptor.visible!==false)ctx.drawImage(target.canvas,0,0);
  const name=target.descriptor.id.replace(/[^a-z0-9-]/gi,"-");
  await writeFile(out+"/layers/"+name+".png",target.canvas.toBuffer("image/png"));
  layers.push({id:target.descriptor.id,name:target.descriptor.name,role:target.descriptor.role,strokeCount:target.strokeCount,fillCount:target.fillCount,raster});
 }
});
const pixels=ctx.getImageData(0,0,width,height).data;
const raster=analyzeRasterPixels({width,height,data:pixels});
const png=composite.toBuffer("image/png");
await writeFile(out+"/anime-construction-study.png",png);
const report={
 renderer:"ZERO STUDIO native Canvas2D brush executor",
 source:"parameterized construction model -> validated editable brush plan -> native raster commands",
 modelInferenceUsed:false,generatedImageUsed:false,externalImageGeneration:false,
 canvas:{width,height},constructionAudit:modelAudit,
 model:{profileId:model.profileId,view:model.view,eyeSystems:model.eyes.length,hairClumps:model.hair.length,clothAnchors:model.folds.length,light:model.shadows.light},
 layers,strokeCount:result.strokeCount,layerCount:result.layerCount,
 fillCount:layers.reduce((n,layer)=>n+layer.fillCount,0),raster,
 strokeGeometry:geometry,
 limitation:"This is the first rendered integration of parameterized construction geometry, not semantic vision or artistic acceptance. Head silhouette, torso, organic overlap masks, facial details, and shadow boundaries remain subject to visual specialist review."
};
await writeFile(out+"/report.json",JSON.stringify(report,null,2));
console.log(JSON.stringify({output:out+"/anime-construction-study.png",bytes:png.length,strokeCount:result.strokeCount,layerCount:result.layerCount,fillCount:report.fillCount,visiblePixels:raster.visiblePixels,modelAudit:modelAudit.valid}));
