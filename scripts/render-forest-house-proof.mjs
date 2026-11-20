import{mkdir,writeFile}from"node:fs/promises";
import sharp from"sharp";
import{renderAnimeBackground}from"../app/anime-background-painter.mjs";
import{SVG_ART_DEFS}from"../app/engine.mjs";

const scene=renderAnimeBackground({version:1,kind:"forest-house"});
const esc=value=>String(value??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;");
const body=scene.layers.map(layer=>'<g data-layer="'+esc(layer.name)+'">'+layer.operations.map(op=>'<path d="'+esc(op.d)+'" fill="'+esc(op.fill??"none")+'" stroke="'+esc(op.stroke??"none")+'" stroke-width="'+Number(op.width??1)+'" opacity="'+Number(op.opacity??1)+'"'+(op.filter?' filter="'+esc(op.filter)+'"':"")+'/>').join("")+"</g>").join("");
const svg='<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">'+SVG_ART_DEFS+body+"</svg>";
const dir="artifacts/forest-house-proof";
await mkdir(dir,{recursive:true});
await writeFile(dir+"/forest-house.svg",svg);
await sharp(Buffer.from(svg)).png({compressionLevel:9}).toFile(dir+"/forest-house.png");
const meta=await sharp(dir+"/forest-house.png").metadata();
const report={renderer:"app/anime-background-painter.mjs :: renderAnimeBackground",scene:"forest-house",width:meta.width,height:meta.height,layers:scene.layers.map(layer=>({name:layer.name,operations:layer.operations.length})),totalOperations:scene.totalOperations,deterministic:true,generativeImageOrVideoModelUsed:false,importantLimitation:"This is the repository's current deterministic vector scene painter rasterized for visual inspection. It is NOT the new Canvas2D raster brush workspace and does not prove professional anime-background quality.",visualAcceptance:"pending human review"};
await writeFile(dir+"/report.json",JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
