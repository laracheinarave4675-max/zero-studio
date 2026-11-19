import{mkdir,writeFile}from"node:fs/promises";
import{createCanvas}from"@napi-rs/canvas";
import{RASTER_BRUSH_PRESETS,drawRasterBrushStroke}from"../app/raster-brushes.mjs";

const width=1600,height=1080;
const canvas=createCanvas(width,height),ctx=canvas.getContext("2d");
ctx.fillStyle="#f4efe4";ctx.fillRect(0,0,width,height);
ctx.fillStyle="#26323a";ctx.font="700 34px sans-serif";ctx.fillText("ZERO STUDIO — RASTER BRUSH PROOF",64,58);
ctx.fillStyle="#667078";ctx.font="16px sans-serif";ctx.fillText("Native Canvas2D marks · deterministic sample paths · no generated artwork",66,88);

const rows=[
 {name:"GRAPHITE",brush:"graphite",color:"#34383d",size:38,opacity:1,texture:.92,points:[{x:320,y:165,pressure:.14},{x:510,y:145,pressure:.42},{x:730,y:178,pressure:.78},{x:960,y:138,pressure:.36},{x:1260,y:165,pressure:.18}]},
 {name:"INK",brush:"ink",color:"#172b3a",size:27,opacity:1,texture:0,points:[{x:320,y:355,pressure:.2},{x:520,y:325,pressure:.85},{x:730,y:375,pressure:.3},{x:980,y:320,pressure:1},{x:1260,y:350,pressure:.32}]},
 {name:"GOUACHE",brush:"gouache",color:"#477653",size:52,opacity:1,texture:.92,points:[{x:320,y:545,pressure:.24},{x:520,y:585,pressure:.9},{x:730,y:530,pressure:.52},{x:990,y:585,pressure:1},{x:1260,y:545,pressure:.25}]},
 {name:"WATERCOLOR",brush:"watercolor",color:"#4d87a3",size:62,opacity:1,texture:.86,points:[{x:320,y:735,pressure:.22},{x:520,y:705,pressure:.7},{x:740,y:760,pressure:.95},{x:980,y:700,pressure:.42},{x:1260,y:735,pressure:.2}]},
 {name:"FOLIAGE",brush:"foliage",color:"#456f42",size:34,opacity:1,texture:.9,points:[{x:320,y:925,pressure:.3},{x:510,y:880,pressure:.8},{x:740,y:930,pressure:.55},{x:980,y:875,pressure:.95},{x:1260,y:920,pressure:.35}]}
];

const report=[];
for(let i=0;i<rows.length;i++){
 const row=rows[i],y=i*190+120;
 ctx.strokeStyle="rgba(68,77,82,.16)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(64,y+92);ctx.lineTo(1536,y+92);ctx.stroke();
 ctx.fillStyle="#26323a";ctx.font="700 18px sans-serif";ctx.fillText(row.name,68,y+30);
 ctx.fillStyle="#778087";ctx.font="13px sans-serif";ctx.fillText("Pressure-shaped stroke",68,y+52);
 const result=drawRasterBrushStroke(ctx,row.points,{brush:row.brush,color:row.color,size:row.size,opacity:row.opacity,texture:row.texture,seed:20261119});
 if(!result.dabCount||result.dabCount<2)throw new Error(row.brush+" did not produce enough brush samples");
 // Confirm that the actual Canvas2D output changed pixels in the stroke band.
 // The label sits to the left, and the divider sits below this band, so neither
 // can make an otherwise empty brush appear to pass.
 const pixels=ctx.getImageData(280,y+12,1040,70).data;
 let paintedPixels=0;
 for(let px=0;px<pixels.length;px+=4){
  const delta=Math.abs(pixels[px]-244)+Math.abs(pixels[px+1]-239)+Math.abs(pixels[px+2]-228);
  if(delta>26)paintedPixels++;
 }
 if(paintedPixels<200)throw new Error(row.brush+" produced too few visibly changed raster pixels: "+paintedPixels);
 report.push({brush:row.brush,dabCount:result.dabCount,paintedPixels,renderMode:result.renderMode,pressureSamples:row.points.map(p=>p.pressure)});
}
const dir="artifacts/raster-brush-proof";
await mkdir(dir,{recursive:true});
const png=canvas.toBuffer("image/png");
await writeFile(dir+"/raster-brush-proof.png",png);
await writeFile(dir+"/report.json",JSON.stringify({
 renderer:"ZERO STUDIO drawRasterBrushStroke / Canvas2D",
 generatedArtwork:false,
 externalImageGeneration:false,
 size:{width,height},
 rows:report,
 note:"This is a brush-behaviour proof sheet, not an anime scene or artist acceptance test."
},null,2));
console.log(JSON.stringify({output:dir+"/raster-brush-proof.png",bytes:png.length,rows:report}));
