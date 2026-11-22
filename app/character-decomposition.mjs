// ZERO STUDIO — pixel-preserving character decomposition and conservative 2D rig.
// Masks are explicitly authored; semantic segmentation and hidden-area invention are never implied.
export const CHARACTER_DECOMPOSITION_FORMAT="zero-studio-character-decomposition";
export const CHARACTER_RIG_FORMAT="zero-studio-character-rig";
const MAX_PIXELS=16_000_000,MAX_PARTS=48,MAX_BYTES=64*1024*1024;
const fail=m=>{throw Error(m)},clean=(v,n=120)=>String(v??"").trim().replace(/[\u0000-\u001f]/g,"").slice(0,n);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function bytes(value,length,label){
 if(!(value instanceof Uint8Array||value instanceof Uint8ClampedArray||Array.isArray(value))||value.length!==length)fail(label+" has an invalid byte array.");
 for(const v of value)if(!Number.isInteger(Number(v))||Number(v)<0||Number(v)>255)fail(label+" contains invalid channel values.");
 return Uint8Array.from(value);
}
export function hashCharacterPixels(input){
 if(!(input instanceof Uint8Array||input instanceof Uint8ClampedArray||Array.isArray(input))||!input.length)fail("RGBA pixel bytes are required.");
 let h=2166136261;for(const v of input){h^=v;h=Math.imul(h,16777619)}return"rgba-fnv1a-"+(h>>>0).toString(16).padStart(8,"0");
}
function sourceOf(source){
 const width=Number(source?.width),height=Number(source?.height);
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>MAX_PIXELS)fail("Source dimensions must be positive and at most 16 megapixels.");
 const rgba=bytes(source.data,width*height*4,"Source RGBA");
 return{width,height,rgba,sourceHash:hashCharacterPixels(rgba)};
}
function boundsOf(mask,width,height){
 let x0=width,y0=height,x1=-1,y1=-1,count=0;
 for(let i=0;i<mask.length;i++)if(mask[i]){const x=i%width,y=Math.floor(i/width);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);count++}
 return count?{x:x0,y:y0,width:x1-x0+1,height:y1-y0+1,pixelCount:count}:null;
}
function cropMaskAndPixels(mask,pixels,width,bounds){
 const m=new Uint8Array(bounds.width*bounds.height),p=new Uint8Array(m.length*4);
 for(let y=0;y<bounds.height;y++)for(let x=0;x<bounds.width;x++){
  const local=y*bounds.width+x,global=(bounds.y+y)*width+bounds.x+x;
  m[local]=mask[global];if(m[local])p.set(pixels.subarray(global*4,global*4+4),local*4);
 }
 return{mask:m,pixels:p};
}
function cropLayerFromSource(image,mask,bounds){
 const pixels=new Uint8Array(image.width*image.height*4);
 for(let i=0;i<mask.length;i++)if(mask[i])pixels.set(image.rgba.subarray(i*4,i*4+4),i*4);
 return cropMaskAndPixels(mask,pixels,image.width,bounds);
}
function cropRepair(raw,width,height,id){
 const fullMask=bytes(raw.mask,width*height,"Occlusion mask "+id),fullPixels=bytes(raw.pixels,width*height*4,"Occlusion patch "+id);
 for(const v of fullMask)if(v!==0&&v!==255)fail("Occlusion masks must be binary.");
 const bounds=boundsOf(fullMask,width,height);if(!bounds)fail("Occlusion repair "+id+" has an empty mask.");
 const cropped=cropMaskAndPixels(fullMask,fullPixels,width,bounds);let required=0,supplied=0;
 for(let i=0;i<cropped.mask.length;i++)if(cropped.mask[i]){required++;if(cropped.pixels[i*4+3])supplied++}
 if(required!==supplied)fail("Repair patch "+id+" must provide opaque pixel data for every hidden-area mask pixel.");
 return{bounds,mask:Array.from(cropped.mask),pixels:Array.from(cropped.pixels),requiredPixels:required,suppliedPixels:supplied};
}
export function createCharacterDecomposition({characterAssetId,source,parts,occlusionRegions=[],sourceLabel=""}={}){
 const id=clean(characterAssetId),image=sourceOf(source),count=image.width*image.height;
 if(!id)fail("A stable character library asset ID is required.");
 if(!Array.isArray(parts)||parts.length<2||parts.length>MAX_PARTS)fail("A decomposition needs 2–48 explicitly segmented parts.");
 const ids=new Set(),ownership=new Uint8Array(count),normalized=[];let estimate=image.rgba.byteLength;
 for(const [index,raw]of parts.entries()){
  const partId=clean(raw?.id),name=clean(raw?.name),role=clean(raw?.role,48);
  if(!partId||!name||!role||ids.has(partId))fail("Part IDs, names and semantic roles must be present and unique.");ids.add(partId);
  const mask=bytes(raw.mask,count,"Mask for "+partId);
  for(let i=0;i<count;i++)if(mask[i]){
   if(mask[i]!==255)fail("Masks must be binary (0 or 255); antialiased edges stay in the source RGBA.");
   if(!image.rgba[i*4+3])fail("A part mask cannot claim fully transparent source pixels.");
   if(ownership[i])fail("Part masks overlap at pixel "+i+"; define one owner per source pixel.");
   ownership[i]=1;
  }
  const bounds=boundsOf(mask,image.width,image.height);if(!bounds)fail("Part "+partId+" has an empty mask.");
  const cropped=cropLayerFromSource(image,mask,bounds);
  estimate+=cropped.mask.byteLength+cropped.pixels.byteLength;
  normalized.push({id:partId,name,role,order:Number.isInteger(raw.order)?raw.order:index,parentId:raw.parentId?clean(raw.parentId):null,identityLocked:raw.identityLocked!==false,visible:raw.visible!==false,bounds,mask:Array.from(cropped.mask),pixels:Array.from(cropped.pixels),pixelHash:hashCharacterPixels(cropped.pixels)});
 }
 for(let i=0;i<count;i++)if(image.rgba[i*4+3]&&!ownership[i])fail("Source pixel "+i+" is not assigned to a part; decomposition would lose original artwork.");
 normalized.sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));
 for(const part of normalized)if(part.parentId&&!ids.has(part.parentId))fail("Part "+part.id+" references a missing parent.");
 if(!Array.isArray(occlusionRegions)||occlusionRegions.length>32)fail("At most 32 occlusion repair regions are supported.");
 const repairIds=new Set(),repairs=occlusionRegions.map(raw=>{
  const repairId=clean(raw?.id),name=clean(raw?.name),method=String(raw?.method||"");
  if(!repairId||!name||repairIds.has(repairId))fail("Occlusion repair IDs and names must be unique.");repairIds.add(repairId);
  if(!["manual-paint","clone-source","approved-reference-patch"].includes(method))fail("Hidden areas require an explicit, reviewable repair method.");
  const cropped=cropRepair(raw,image.width,image.height,repairId);estimate+=cropped.mask.length+cropped.pixels.length;
  const occludedByPartId=clean(raw.occludedByPartId);if(!occludedByPartId||!ids.has(occludedByPartId))fail("A hidden-area repair must name the foreground part that occludes it.");
  return{id:repairId,name,method,occludedByPartId,reviewStatus:raw.reviewStatus==="approved"?"approved":"pending",...cropped,pixelHash:hashCharacterPixels(cropped.pixels)};
 });
 if(estimate>MAX_BYTES)fail("Decomposition exceeds the 64 MB in-memory asset limit.");
 return{format:CHARACTER_DECOMPOSITION_FORMAT,version:1,characterAssetId:id,sourceLabel:clean(sourceLabel,160),width:image.width,height:image.height,sourceHash:image.sourceHash,sourcePixels:Array.from(image.rgba),parts:normalized,occlusionRepairs:repairs,provenance:{segmentation:"artist-supplied-binary-masks",hiddenAreaRecovery:"explicit-repair-patches-only",generativeFillUsed:false}};
}
function validateCrop(item,width,height,label,channels){
 const b=item?.bounds;if(!b||![b.x,b.y,b.width,b.height].every(Number.isInteger)||b.x<0||b.y<0||b.width<1||b.height<1||b.x+b.width>width||b.y+b.height>height)fail(label+" bounds are invalid.");
 const m=bytes(item.mask,b.width*b.height,label+" mask"),p=bytes(item.pixels,b.width*b.height*4,label+" pixels");
 for(const v of m)if(v!==0&&v!==255)fail(label+" mask is not binary.");
 if(hashCharacterPixels(p)!==item.pixelHash)fail(label+" pixel hash mismatch.");
 return{bounds:b,mask:m,pixels:p};
}
export function validateCharacterDecomposition(record){
 if(!record||record.format!==CHARACTER_DECOMPOSITION_FORMAT||record.version!==1||!clean(record.characterAssetId)||!Array.isArray(record.parts)||record.parts.length<2||record.parts.length>MAX_PARTS)fail("Character decomposition record is invalid.");
 const image=sourceOf({width:record.width,height:record.height,data:record.sourcePixels});
 if(image.sourceHash!==record.sourceHash)fail("Immutable source pixels changed after decomposition.");
 const ownership=new Uint8Array(record.width*record.height),ids=new Set();
 for(const part of record.parts){
  if(!part?.id||ids.has(part.id))fail("Part IDs are missing or duplicated.");ids.add(part.id);
  const crop=validateCrop(part,record.width,record.height,"Part "+part.id);
  for(let y=0;y<crop.bounds.height;y++)for(let x=0;x<crop.bounds.width;x++){
   const local=y*crop.bounds.width+x;if(!crop.mask[local])continue;
   const global=(crop.bounds.y+y)*record.width+crop.bounds.x+x,o=global*4,po=local*4;
   if(ownership[global])fail("Part masks overlap.");ownership[global]=1;
   for(let c=0;c<4;c++)if(crop.pixels[po+c]!==image.rgba[o+c])fail("Original source pixel changed in part "+part.id+".");
  }
 }
 for(let i=0;i<ownership.length;i++)if(image.rgba[i*4+3]&&!ownership[i])fail("Decomposition no longer covers the complete source silhouette.");
 if(!Array.isArray(record.occlusionRepairs)||record.occlusionRepairs.length>32)fail("Occlusion repair list is invalid.");
 const repairIds=new Set();
 for(const repair of record.occlusionRepairs){
  if(!repair?.id||repairIds.has(repair.id)||!ids.has(repair.occludedByPartId))fail("Occlusion repair IDs or occluding part link are invalid.");repairIds.add(repair.id);
  if(!["manual-paint","clone-source","approved-reference-patch"].includes(repair.method))fail("Occlusion repair method is invalid.");
  const crop=validateCrop(repair,record.width,record.height,"Repair "+repair.id);let required=0,supplied=0;
  for(let i=0;i<crop.mask.length;i++)if(crop.mask[i]){required++;if(crop.pixels[i*4+3])supplied++}
  if(!required||required!==supplied||required!==repair.requiredPixels||supplied!==repair.suppliedPixels)fail("Occlusion repair coverage is incomplete.");
 }
 return{valid:true,sourceHash:image.sourceHash,partCount:record.parts.length,pixelExactSource:true};
}
export function compositeCharacterDecomposition(record,{includeRepairs=false}={}){
 validateCharacterDecomposition(record);const out=new Uint8ClampedArray(record.width*record.height*4);
 const paint=item=>{const b=item.bounds,m=item.mask,p=item.pixels;for(let y=0;y<b.height;y++)for(let x=0;x<b.width;x++){const i=y*b.width+x;if(!m[i])continue;const target=((b.y+y)*record.width+b.x+x)*4,from=i*4;out.set(p.slice(from,from+4),target)}};
 const parts=[...record.parts].sort((a,b)=>a.order-b.order);
 for(const part of parts){
  if(includeRepairs)for(const repair of record.occlusionRepairs)if(repair.reviewStatus==="approved"&&repair.occludedByPartId===part.id)paint({...repair,mask:bytes(repair.mask,repair.bounds.width*repair.bounds.height,"repair mask"),pixels:bytes(repair.pixels,repair.bounds.width*repair.bounds.height*4,"repair pixels")});
  if(part.visible)paint({...part,mask:bytes(part.mask,part.bounds.width*part.bounds.height,"mask"),pixels:bytes(part.pixels,part.bounds.width*part.bounds.height*4,"pixels")});
 }
 return out;
}
export function auditCharacterDecomposition(record){
 const validation=validateCharacterDecomposition(record),composite=compositeCharacterDecomposition(record),source=record.sourcePixels;
 let mismatchedChannels=0;for(let i=0;i<source.length;i++)if(composite[i]!==source[i])mismatchedChannels++;
 const repairs=record.occlusionRepairs.map(r=>({id:r.id,method:r.method,requiredPixels:r.requiredPixels,suppliedPixels:r.suppliedPixels,complete:r.requiredPixels===r.suppliedPixels,approved:r.reviewStatus==="approved"}));
 return{...validation,sourceCompositeExact:mismatchedChannels===0,mismatchedChannels,occlusionRepairCount:repairs.length,occlusionRepairs:repairs,allRepairsApproved:repairs.every(r=>r.approved),readyForLayerMotion:mismatchedChannels===0&&repairs.every(r=>r.approved)};
}
export function approveOcclusionRepair(record,repairId){
 validateCharacterDecomposition(record);const repair=record.occlusionRepairs.find(r=>r.id===repairId);if(!repair)fail("Occlusion repair was not found.");repair.reviewStatus="approved";return repair;
}
const DEFAULT_LIMITS=Object.freeze({translateX:4,translateY:4,rotation:.035,scaleMin:.99,scaleMax:1.01,opacityMin:.92});
export function createCharacterRig({decomposition,nodes,constraints=DEFAULT_LIMITS}={}){
 validateCharacterDecomposition(decomposition);
 if(!Array.isArray(nodes)||!nodes.length||nodes.length>MAX_PARTS)fail("Rig requires 1–48 nodes.");
 const partIds=new Set(decomposition.parts.map(p=>p.id)),ids=new Set(),normalized=[];
 for(const raw of nodes){
  const id=clean(raw?.id),partId=clean(raw?.partId);if(!id||ids.has(id)||!partIds.has(partId))fail("Rig node IDs must be unique and reference an existing decomposed part.");ids.add(id);
  const pivot={x:Number(raw.pivot?.x??.5),y:Number(raw.pivot?.y??.5)};
  if(!Number.isFinite(pivot.x)||!Number.isFinite(pivot.y)||pivot.x<0||pivot.x>1||pivot.y<0||pivot.y>1)fail("Rig pivots must be normalized between 0 and 1.");
  const identityLocked=raw.identityLocked!==false,repairIds=Array.isArray(raw.repairIds)?raw.repairIds.map(v=>clean(v)):[];
  if(!identityLocked){if(!repairIds.length)fail("A moving part needs approved hidden-area repair links.");for(const repairId of repairIds){const repair=decomposition.occlusionRepairs.find(r=>r.id===repairId);if(!repair||repair.reviewStatus!=="approved"||repair.occludedByPartId!==partId)fail("Moving part "+partId+" requires an approved repair behind that exact part.");}}
  normalized.push({id,partId,parentId:raw.parentId?clean(raw.parentId):null,pivot,identityLocked,repairIds});
 }
 for(const node of normalized)if(node.parentId&&!ids.has(node.parentId))fail("Rig node parent does not exist: "+node.parentId);
 for(const node of normalized){const visited=new Set([node.id]);let parent=node.parentId;while(parent){if(visited.has(parent))fail("Rig hierarchy contains a cycle.");visited.add(parent);parent=normalized.find(n=>n.id===parent)?.parentId||null;}}
 if(normalized.length!==decomposition.parts.length||new Set(normalized.map(n=>n.partId)).size!==decomposition.parts.length)fail("Every decomposed part must have exactly one rig node.");
 const limits={translateX:clamp(Number(constraints.translateX??4),0,12),translateY:clamp(Number(constraints.translateY??4),0,12),rotation:clamp(Number(constraints.rotation??.035),0,.08),scaleMin:clamp(Number(constraints.scaleMin??.99),.97,1),scaleMax:clamp(Number(constraints.scaleMax??1.01),1,1.03),opacityMin:clamp(Number(constraints.opacityMin??.92),.8,1)};
 if(Object.values(limits).some(v=>!Number.isFinite(v))||limits.scaleMin>limits.scaleMax)fail("Rig constraints are invalid.");
 return{format:CHARACTER_RIG_FORMAT,version:1,characterAssetId:decomposition.characterAssetId,sourceHash:decomposition.sourceHash,limits,nodes:normalized,identityFingerprint:decomposition.sourceHash,deformationMode:"rigid-layer-only",meshWarpEnabled:false,sourcePixelsMutable:false};
}
export function sampleCharacterRig(rig,pose={}){
 if(!rig||rig.format!==CHARACTER_RIG_FORMAT||rig.version!==1||!Array.isArray(rig.nodes))fail("Character rig is invalid.");
 const transforms={};
 for(const node of rig.nodes){
  const raw=pose[node.id]||{},locked=node.identityLocked;
  const t={translateX:locked?0:clamp(Number(raw.translateX||0),-rig.limits.translateX,rig.limits.translateX),translateY:locked?0:clamp(Number(raw.translateY||0),-rig.limits.translateY,rig.limits.translateY),rotation:locked?0:clamp(Number(raw.rotation||0),-rig.limits.rotation,rig.limits.rotation),scaleX:locked?1:clamp(Number(raw.scaleX??1),rig.limits.scaleMin,rig.limits.scaleMax),scaleY:locked?1:clamp(Number(raw.scaleY??1),rig.limits.scaleMin,rig.limits.scaleMax),opacity:locked?1:clamp(Number(raw.opacity??1),rig.limits.opacityMin,1)};
  if(Object.values(t).some(v=>!Number.isFinite(v)))fail("Rig transform contains a non-finite value.");
  transforms[node.id]={...t,pivot:{...node.pivot},partId:node.partId,identityLocked:locked};
 }
 return{characterAssetId:rig.characterAssetId,sourceHash:rig.sourceHash,identityFingerprint:rig.identityFingerprint,deformationMode:"rigid-layer-only",transforms};
}
export function validateCharacterRig(rig,decomposition){
 validateCharacterDecomposition(decomposition);
 if(!rig||rig.format!==CHARACTER_RIG_FORMAT||rig.version!==1||rig.characterAssetId!==decomposition.characterAssetId||rig.sourceHash!==decomposition.sourceHash||rig.identityFingerprint!==decomposition.sourceHash)fail("Rig does not belong to this exact character decomposition.");
 return createCharacterRig({decomposition,nodes:rig.nodes,constraints:rig.limits});
}
export function auditCharacterRig(rig,pose={}){
 const sampled=sampleCharacterRig(rig,pose),values=Object.values(sampled.transforms);
 return{valid:true,nodeCount:rig.nodes.length,sourceHashUnchanged:sampled.sourceHash===rig.sourceHash,meshWarpEnabled:false,sourcePixelsMutable:false,transformsWithinLimits:values.every(t=>Math.abs(t.translateX)<=rig.limits.translateX&&Math.abs(t.translateY)<=rig.limits.translateY&&Math.abs(t.rotation)<=rig.limits.rotation&&t.scaleX>=rig.limits.scaleMin&&t.scaleX<=rig.limits.scaleMax&&t.scaleY>=rig.limits.scaleMin&&t.scaleY<=rig.limits.scaleMax),identityLocksRespected:values.every(t=>!t.identityLocked||(t.translateX===0&&t.translateY===0&&t.rotation===0&&t.scaleX===1&&t.scaleY===1&&t.opacity===1))};
}
