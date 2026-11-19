import{mkdir,writeFile}from"node:fs/promises";
import{createCanvas}from"@napi-rs/canvas";
import{renderJapaneseForestHouseRaster}from"../app/raster-anime-scene.mjs";
const width=1920,height=1080,canvas=createCanvas(width,height),ctx=canvas.getContext("2d");
const report=renderJapaneseForestHouseRaster(ctx,{width,height,seed:2026});
const dir="artifacts/raster-anime-scene";await mkdir(dir,{recursive:true});
await writeFile(dir+"/japanese-forest-house.png",canvas.toBuffer("image/png"));
await writeFile(dir+"/report.json",JSON.stringify({...report,output:"japanese-forest-house.png",imageWidth:width,imageHeight:height,generatedBy:"ZERO STUDIO deterministic Canvas2D renderer",externalImageModel:false,visualReview:"pending"},null,2));
console.log(JSON.stringify(report));
