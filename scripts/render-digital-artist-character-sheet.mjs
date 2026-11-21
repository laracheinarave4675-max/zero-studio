import { mkdir, writeFile } from "node:fs/promises";
import { createCanvas } from "@napi-rs/canvas";
import { drawRasterBrushStroke, fillRasterRegion, mapPointsToRaster } from "../app/raster-brushes.mjs";
import { compileDigitalArtistBrushPlan } from "../app/digital-artist-brush-engine.mjs";
import { executeDigitalArtistBrushStream } from "../app/digital-artist-brush-executor.mjs";
import { analyzeRasterPixels, analyzeStrokeGeometry } from "../app/digital-artist-eyes.mjs";
import { createDigitalArtistCharacterSheetPlan } from "../app/digital-artist-character-sheet-plan.mjs";

const width=1920,height=1080,output="artifacts/digital-artist-character-sheet-proof";
const plan=createDigitalArtistCharacterSheetPlan();
const stream=compileDigitalArtistBrushPlan(plan);
const composite=createCanvas(width,height),ctx=composite.getContext("2d");
ctx.fillStyle="#fffdf9";ctx.fillRect(0,0,width,height);
const layers=[],layerReports=[];
await mkdir(output+"/layers",{recursive:true});
const result=await executeDigitalArtistBrushStream(stream,{
 createLayer:async descriptor=>({descriptor,canvas:createCanvas(width,height),strokeCount:0,fillCount:0}),
 paintStroke:async(target,command)=>{
  const mapped=mapPointsToRaster(command.points,width,height,width,height,command.options.size??1);
  const painted=command.kind==="raster-region-fill"
   ?fillRasterRegion(target.canvas.getContext("2d"),mapped.points,command.options)
   :drawRasterBrushStroke(target.canvas.getContext("2d"),mapped.points,{...command.options,size:mapped.size});
  target.strokeCount++;
  if(command.kind==="raster-region-fill")target.fillCount++;
  return painted;
 },
 finalizeLayer:async target=>{
  const c=target.canvas.getContext("2d"),pixels=c.getImageData(0,0,width,height).data;
  let paintedPixels=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>0)paintedPixels++;
  if(paintedPixels<30)throw new Error("Artist layer rendered too few pixels: "+target.descriptor.id);
  if(target.descriptor.visible!==false)ctx.drawImage(target.canvas,0,0);
  const filename=String(layers.length+1).padStart(2,"0")+"-"+target.descriptor.id+".png";
  await writeFile(output+"/layers/"+filename,target.canvas.toBuffer("image/png"));
  const raster=analyzeRasterPixels({width,height,data:pixels});
  layerReports.push({id:target.descriptor.id,name:target.descriptor.name,role:target.descriptor.role,visible:target.descriptor.visible!==false,strokeCount:target.strokeCount,regionFillCount:target.fillCount,paintedPixels,bounds:raster.bounds,alphaCoverage:raster.alphaCoverage});
  layers.push(target);
 }
});
const raster=analyzeRasterPixels({width,height,data:ctx.getImageData(0,0,width,height).data});
const png=composite.toBuffer("image/png");
await writeFile(output+"/character-sheet-raster.png",png);
const report={
 renderer:"ZERO STUDIO native Canvas2D drawRasterBrushStroke + fillRasterRegion",
 sourceReference:{galleryAssetId:"be172712-e073-4d06-9587-eec7e6c62a84",originalSize:"1280x720"},
 sourcePixelsEmbedded:false,imageGenerationUsed:false,modelInferenceUsed:false,
 canvas:{width,height},strokeCount:result.strokeCount,regionFillCount:result.regionFillCount,
 layers:layerReports,artistEyes:{raster,strokeGeometry:stream.commands.map(analyzeStrokeGeometry)},
 qualityScope:"Native brush execution and layer geometry verified; visual likeness and exact costume details require human review against the source reference.",
};
await writeFile(output+"/report.json",JSON.stringify(report,null,2));
const summary=process.env.GITHUB_STEP_SUMMARY;
if(summary){
 const rows=layerReports.map(x=>"| "+x.name+" | "+x.role+" | "+x.strokeCount+" | "+x.regionFillCount+" | "+x.paintedPixels+" |").join("\n");
 const text="# ZERO STUDIO character-sheet brush test\n\n- Reference asset: `be172712-e073-4d06-9587-eec7e6c62a84`\n- Renderer: native Canvas2D raster brushes\n- Strokes: "+result.strokeCount+"\n- Region fills: "+result.regionFillCount+"\n\n| Layer | Role | Strokes | Fills | Painted pixels |\n|---|---|---:|---:|---:|\n"+rows+"\n";
 await (await import("node:fs/promises")).appendFile(summary,text);
}
console.log(JSON.stringify({output,strokeCount:result.strokeCount,regionFillCount:result.regionFillCount,layers:layerReports.length},null,2));
