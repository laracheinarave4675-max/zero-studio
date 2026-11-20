// Persistent Canvas2D surfaces for native raster layers.
// Each layer is decoded once per in-memory session; subsequent brush strokes
// paint into the same canvas instead of rebuilding it from its PNG data URL.
export function createPersistentRasterSurfaceManager({createCanvas,loadImage,maxPixels=8*1024*1024}={}){
 if(typeof createCanvas!=="function"||typeof loadImage!=="function")throw Error("Raster surface adapters are required");
 const surfaces=new WeakMap();
 async function get(layer){
  if(!layer||layer.type!=="raster")throw Error("A raster layer is required");
  const width=Number(layer.width),height=Number(layer.height);
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>maxPixels)throw Error("Raster layer dimensions exceed the safe surface limit");
  const sourceDataUrl=String(layer.dataUrl||"");
  const cached=surfaces.get(layer);
  if(cached&&cached.width===width&&cached.height===height&&cached.sourceDataUrl===sourceDataUrl)return cached;
  if(cached)surfaces.delete(layer);
  const canvas=createCanvas();canvas.width=width;canvas.height=height;
  const context=canvas.getContext("2d");if(!context)throw Error("Unable to create a 2D raster context");
  if(sourceDataUrl){const image=await loadImage(sourceDataUrl);context.drawImage(image,0,0,width,height);}
  const surface={canvas,context,width,height,sourceDataUrl};surfaces.set(layer,surface);return surface;
 }
 function markCurrent(layer){const surface=surfaces.get(layer);if(surface)surface.sourceDataUrl=String(layer?.dataUrl||"");}
 function invalidate(layer){if(layer)surfaces.delete(layer);}
 return Object.freeze({get,markCurrent,invalidate});
}
/**
 * Paints and encodes a raster stroke as one transaction. If painting or PNG
 * encoding fails, discard the mutated in-memory surface so the next access
 * reloads the last committed layer.dataUrl instead of leaking rejected pixels.
 */
export async function encodeRasterSurfaceStroke(manager,layer,paint,{maxDataUrlChars=24*1024*1024,maxImageBytes=16*1024*1024}={}){
 if(!manager||typeof manager.get!=="function"||typeof manager.invalidate!=="function")throw Error("A persistent raster surface manager is required");
 if(typeof paint!=="function")throw Error("A raster paint callback is required");
 const surface=await manager.get(layer);
 try{
  const result=await paint(surface);
  const dataUrl=surface.canvas.toDataURL("image/png");
  const prefix="data:image/png;base64,";
  if(typeof dataUrl!=="string"||!dataUrl.startsWith(prefix))throw Error("Unable to encode the raster surface as PNG");
  const encodedLength=dataUrl.length-prefix.length;
  const decodedBytes=Math.floor(encodedLength*3/4);
  if(dataUrl.length>maxDataUrlChars||decodedBytes>maxImageBytes)throw Error("حجم الطبقة بعد الرسم تجاوز الحد الآمن؛ خفّض أبعاد الصورة أو قسّم العمل إلى طبقات.");
  return{surface,result,dataUrl};
 }catch(error){
  manager.invalidate(layer);
  throw error;
 }
}
