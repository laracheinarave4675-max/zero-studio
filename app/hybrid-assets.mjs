const MAX_LAYERS=256;
const MAX_DIMENSION=16384;
const MAX_SOURCE_BYTES=256*1024*1024;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const BLENDS=new Set(["normal","multiply","screen","overlay","darken","lighten","difference"]);
function fail(message){throw new Error(message)}
function text(value,label,max=160){const result=String(value??"").trim();if(!result||result.length>max)fail(label+" غير صالح.");return result}
function finite(value,label,min,max){const n=Number(value);if(!Number.isFinite(n)||n<min||n>max)fail(label+" خارج الحدود المسموحة.");return n}
function safeId(value,label){const id=text(value,label,128);if(!ID.test(id))fail(label+" يحتوي رموزاً غير مسموحة.");return id}
function safeSourceRef(value,label){const ref=text(value,label,240);if(ref.startsWith("/")||ref.includes("\\\\")||ref.split("/").some(part=>!part||part==="."||part===".."||!/^[A-Za-z0-9._-]+$/.test(part)))fail(label+" يحتوي مساراً غير آمن.");return ref}
export function validateHybridAssetManifest(input){
 if(!input||typeof input!=="object"||input.version!==1)fail("إصدار بيان الأصول غير مدعوم.");
 const assetId=safeId(input.assetId,"معرّف الأصل");
 const width=finite(input.width,"عرض اللوحة",1,MAX_DIMENSION);
 const height=finite(input.height,"ارتفاع اللوحة",1,MAX_DIMENSION);
 if(!Array.isArray(input.layers)||input.layers.length<1||input.layers.length>MAX_LAYERS)fail("عدد الطبقات غير صالح.");
 const ids=new Set();
 const layers=input.layers.map((source,index)=>{
  if(!source||typeof source!=="object")fail("بيانات الطبقة "+(index+1)+" غير صالحة.");
  const id=safeId(source.id,"معرّف الطبقة");if(ids.has(id))fail("معرّف طبقة مكرر: "+id);ids.add(id);
  const name=text(source.name,"اسم الطبقة",80);
  const type=source.type;if(type!=="raster"&&type!=="vector")fail("نوع الطبقة يجب أن يكون raster أو vector.");
  const opacity=finite(source.opacity??1,"شفافية الطبقة",0,1);
  const visible=source.visible!==false;
  const blendMode=text(source.blendMode??"normal","نمط المزج",32).toLowerCase();
  if(!BLENDS.has(blendMode))fail("نمط المزج غير مدعوم: "+blendMode);
  const common={id,name,type,visible,opacity,blendMode,order:index};
  if(type==="raster"){
   const mimeType=text(source.mimeType,"نوع ملف الطبقة",80).toLowerCase();
   if(!["image/png","image/webp","image/jpeg"].includes(mimeType))fail("نوع ملف Raster غير مسموح.");
   const sourceFile=safeSourceRef(source.sourceFile,"مرجع ملف الطبقة");
   const bytes=finite(source.bytes,"حجم ملف الطبقة",1,MAX_SOURCE_BYTES);
   const layerWidth=finite(source.width??width,"عرض الطبقة",1,MAX_DIMENSION);
   const layerHeight=finite(source.height??height,"ارتفاع الطبقة",1,MAX_DIMENSION);
   const digest=source.sha256==null?null:text(source.sha256,"بصمة الملف",64).toLowerCase();
   if(digest!==null&&!/^[a-f0-9]{64}$/.test(digest))fail("بصمة SHA-256 غير صالحة.");
   return{...common,mimeType,sourceFile,bytes,width:layerWidth,height:layerHeight,hasAlpha:source.hasAlpha===true,sha256:digest};
  }
  const sourceFile=safeSourceRef(source.sourceFile,"مرجع ملف SVG");
  if(source.svg!==undefined&&typeof source.svg!=="string")fail("مصدر SVG يجب أن يكون نصاً.");
  return{...common,sourceFile,svg:source.svg??null};
 });
 return{version:1,assetId,width,height,layers,layerCount:layers.length,hasRaster:layers.some(x=>x.type==="raster"),hasVector:layers.some(x=>x.type==="vector"),mixed:layers.some(x=>x.type==="raster")&&layers.some(x=>x.type==="vector")};
}
export function createHybridFrameSignature(frame){
 if(!frame||!Array.isArray(frame.layers)||frame.layers.length===0)fail("الإطار الهجين لا يحتوي طبقات.");
 const canonical=frame.layers.map(layer=>{
  if(layer.type==="vector")return[layer.id,layer.name,layer.visible!==false,layer.opacity??1,layer.blendMode??"normal","vector",layer.svg??JSON.stringify(layer.operations??[])];
  if(layer.type==="raster")return[layer.id,layer.name,layer.visible!==false,layer.opacity??1,layer.blendMode??"normal","raster",layer.sourceFile,layer.sha256??null,layer.width,layer.height];
  fail("نوع طبقة غير معروف في توقيع الإطار.");
 });
 const source=JSON.stringify(canonical);let a=2166136261,b=0x9e3779b9;
 for(let i=0;i<source.length;i++){const c=source.charCodeAt(i);a=Math.imul(a^c,16777619)>>>0;b=Math.imul(b^(c+i),2246822519)>>>0}
 return a.toString(16).padStart(8,"0")+b.toString(16).padStart(8,"0");
}
export function validateHybridAnimationCadence(frames,{fps=24}={}){
 if(fps!==24)fail("يجب الحفاظ على 24 رسمة مستقلة في الثانية.");
 if(!Array.isArray(frames)||frames.length===0)fail("لا توجد إطارات للتحقق.");
 const signatures=frames.map(createHybridFrameSignature);
 const unique=new Set(signatures).size;
 return{fps,frameCount:frames.length,uniqueDrawings:unique,duplicateDrawings:frames.length-unique,uniqueDrawingsPerSecond:unique/(frames.length/fps),meetsStructuralTarget:unique===frames.length};
}
