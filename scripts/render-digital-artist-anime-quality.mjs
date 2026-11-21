import { mkdir, writeFile } from "node:fs/promises";
import { createCanvas } from "@napi-rs/canvas";
import { compileDigitalArtistBrushPlan } from "../app/digital-artist-brush-engine.mjs";
import { executeDigitalArtistBrushStream } from "../app/digital-artist-brush-executor.mjs";
import { drawRasterBrushStroke, fillRasterRegion, mapPointsToRaster } from "../app/raster-brushes.mjs";
import { analyzeRasterPixels, analyzeStrokeGeometry } from "../app/digital-artist-eyes.mjs";
import { createDigitalArtistAnimeQualityPlan } from "../app/digital-artist-anime-quality-plan.mjs";

const width=1920,height=1080,plan=createDigitalArtistAnimeQualityPlan(),stream=compileDigitalArtistBrushPlan(plan);
const composite=createCanvas(width,height),ctx=composite.getContext("2d");
const out="artifacts/digital-artist-anime-quality-proof";
await mkdir(out+"/layers",{recursive:true});
const layers=[],geometry=[];
const result=await executeDigitalArtistBrushStream(stream,{
 createLayer:async descriptor=>{const canvas=createCanvas(width,height);return{descriptor,canvas,context:canvas.getContext("2d"),strokeCount:0,fillCount:0};},
 paintStroke:async(target,command)=>{
  const mapped=mapPointsToRaster(command.points,width,height,width,height,command.options.size??1);
  const painted=command.kind==="raster-region-fill"
   ?fillRasterRegion(target.context,mapped.points,command.options)
   :drawRasterBrushStroke(target.context,mapped.points,{...command.options,size:mapped.size});
  target.strokeCount++;if(command.kind==="raster-region-fill")target.fillCount++;
  geometry.push({id:command.id,kind:command.kind,brush:command.options.brush??"region-fill",...analyzeStrokeGeometry({points:command.points})});
  return painted;
 },
 finalizeLayer:async target=>{
  const data=target.context.getImageData(0,0,width,height).data;
  const eye=analyzeRasterPixels({width,height,data});
  if(eye.visiblePixels<100)throw new Error("Quality benchmark layer rendered too few pixels: "+target.descriptor.id);
  if(target.descriptor.visible!==false)ctx.drawImage(target.canvas,0,0);
  const name=target.descriptor.id.replace(/[^a-z0-9-]/gi,"-");
  await writeFile(out+"/layers/"+name+".png",target.canvas.toBuffer("image/png"));
  layers.push({id:target.descriptor.id,name:target.descriptor.name,role:target.descriptor.role,strokeCount:target.strokeCount,fillCount:target.fillCount,eye});
 }
});
const pixels=ctx.getImageData(0,0,width,height).data;
const eye=analyzeRasterPixels({width,height,data:pixels});
const png=composite.toBuffer("image/png");
await writeFile(out+"/anime-quality-benchmark.png",png);
const report={
 renderer:"ZERO STUDIO native Canvas2D brush executor",
 authoredSource:"deterministic hand-authored general anime drawing study",
 modelInferenceUsed:false,generatedImageUsed:false,externalImageGeneration:false,
 canvas:{width,height},layers,strokeCount:result.strokeCount,layerCount:result.layerCount,
 fillCount:layers.reduce((n,x)=>n+x.fillCount,0),rasterEye:eye,strokeGeometry:geometry,
 note:"This benchmark tests general anime drawing craft before any user character likeness test. It is not a vision-model inference or final artistic acceptance."
};
await writeFile(out+"/report.json",JSON.stringify(report,null,2));
console.log(JSON.stringify({output:out+"/anime-quality-benchmark.png",bytes:png.length,strokeCount:result.strokeCount,layerCount:result.layerCount,fillCount:report.fillCount,bounds:eye.bounds,quantizedColorCount:eye.quantizedColorCount}));
