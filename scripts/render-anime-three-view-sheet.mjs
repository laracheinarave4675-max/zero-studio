import {mkdir,writeFile} from "node:fs/promises";
import {createCanvas} from "@napi-rs/canvas";
import {buildAnimeConstructionModel,auditAnimeConstructionModel} from "../app/anime-construction-artist.mjs";
import {buildAnimeConstructionBrushPlan,compileAnimeConstructionBrushPlan} from "../app/anime-construction-brush-plan.mjs";
import {executeDigitalArtistBrushStream} from "../app/digital-artist-brush-executor.mjs";
import {drawRasterBrushStroke,fillRasterRegion,mapPointsToRaster} from "../app/raster-brushes.mjs";

const width=1920,height=1080,out="artifacts/anime-three-view-sheet";
const views=[{id:"left-three-quarter",yaw:-.42,center:.1667},{id:"front",yaw:0,center:.5},{id:"right-three-quarter",yaw:.42,center:.8333}];
const sheet=createCanvas(width,height),sheetCtx=sheet.getContext("2d");
sheetCtx.fillStyle="#f5e9e1";sheetCtx.fillRect(0,0,width,height);
const summaries=[];
for(const view of views){
 const model=buildAnimeConstructionModel({headBounds:{x:view.center-.08,y:.06,width:.16,height:.32},viewYaw:view.yaw,lightDirection:{x:-.7,y:-.7}});
 const audit=auditAnimeConstructionModel(model);
 if(!audit.valid)throw new Error("Invalid "+view.id+" construction: "+JSON.stringify(audit.findings));
 const plan=buildAnimeConstructionBrushPlan(model);
 const backgroundLayer=plan.layers.find(layer=>layer.id==="flats");
 backgroundLayer.strokes=backgroundLayer.strokes.filter(stroke=>stroke.id!=="background-field");
 const panel=createCanvas(width,height),panelCtx=panel.getContext("2d");
 const stream=compileAnimeConstructionBrushPlan(model);
 const result=await executeDigitalArtistBrushStream(stream,{
  createLayer:async descriptor=>{const canvas=createCanvas(width,height);return{descriptor,canvas,context:canvas.getContext("2d")};},
  paintStroke:async(target,command)=>{
   const mapped=mapPointsToRaster(command.points,width,height,width,height,command.options.size??1);
   if(command.kind==="raster-region-fill")return fillRasterRegion(target.context,mapped.points,command.options);
   return drawRasterBrushStroke(target.context,mapped.points,{...command.options,size:mapped.size});
  },
  finalizeLayer:async target=>{if(target.descriptor.visible!==false)panelCtx.drawImage(target.canvas,0,0);}
 });
 sheetCtx.drawImage(panel,0,0);
 summaries.push({id:view.id,yaw:view.yaw,profileId:model.profileId,eyeSystems:model.eyes.length,hairClumps:model.hair.length,farEyeWidth:model.eyes.find(eye=>eye.farSide)?.bounds.width??null,nearEyeWidth:model.eyes.find(eye=>!eye.farSide)?.bounds.width??null,strokeCount:result.strokeCount,layerCount:result.layerCount,constructionAudit:audit});
}
sheetCtx.strokeStyle="#d5c7c0";sheetCtx.lineWidth=2;
for(const x of [640,1280]){sheetCtx.beginPath();sheetCtx.moveTo(x,40);sheetCtx.lineTo(x,1040);sheetCtx.stroke();}
await mkdir(out,{recursive:true});
const png=sheet.toBuffer("image/png");
await writeFile(out+"/anime-three-view-sheet.png",png);
await writeFile(out+"/report.json",JSON.stringify({
 renderer:"ZERO STUDIO native Canvas2D brush executor",
 source:"same anime style profile and construction pipeline across left three-quarter, front and right three-quarter views",
 generatedImageUsed:false,externalImageGeneration:false,canvas:{width,height},views:summaries,
 identityContinuity:"same profile id, same seven hair-clump ids, same normalized head/feature construction rules; view-dependent eye, hair and ear geometry",
 limitation:"This is a geometry-consistency study, not proof of full semantic identity preservation or final artistic quality. Pose, skull depth and occlusion still need further refinement."
},null,2));
console.log(JSON.stringify({output:out+"/anime-three-view-sheet.png",bytes:png.length,views:summaries.map(v=>({id:v.id,farEyeWidth:v.farEyeWidth,nearEyeWidth:v.nearEyeWidth}))}));
