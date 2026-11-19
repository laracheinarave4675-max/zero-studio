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
  const cached=surfaces.get(layer);if(cached)return cached;
  const canvas=createCanvas();canvas.width=width;canvas.height=height;
  const context=canvas.getContext("2d");if(!context)throw Error("Unable to create a 2D raster context");
  if(layer.dataUrl){const image=await loadImage(layer.dataUrl);context.drawImage(image,0,0,width,height);}
  const surface={canvas,context,width,height};surfaces.set(layer,surface);return surface;
 }
 function invalidate(layer){if(layer)surfaces.delete(layer);}
 return Object.freeze({get,invalidate});
}
