import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("native Raster pencil and paintbrush are wired into the mobile drawing workspace",async()=>{
 const [app,html,serviceWorker]=await Promise.all([
  readFile(new URL("../app/app.js",import.meta.url),"utf8"),
  readFile(new URL("../app/index.html",import.meta.url),"utf8"),
  readFile(new URL("../app/sw.js",import.meta.url),"utf8")
 ]);
 assert.match(app,/from"\.\/raster-brushes\.mjs"/);
 assert.match(app,/drawRasterBrushStroke\(context,mapped\.points/);
 assert.match(app,/rasterBrushTools\.has\(tool\)/);
 assert.match(app,/addRasterLayer\(frame\(\),\{name:tool==="raster-pencil"/);
 assert.match(html,/class="tool active" data-tool="raster-pencil"/);
 assert.match(app,/tool="raster-pencil"/);
 assert.match(app,/مسار فرشاة متصل/);
 assert.match(html,/id="legacyArtistControls" hidden/);
 assert.match(html,/data-tool="raster-brush"/);
 for(const id of ["rasterBrushPreset","rasterBrushOpacity","rasterBrushTexture"])assert.ok(html.includes(id),id);
 assert.ok(serviceWorker.includes("./raster-brushes.mjs"));
});
test("Raster paint commit preserves source dimensions and keeps vector authoring distinct",async()=>{
 const app=await readFile(new URL("../app/app.js",import.meta.url),"utf8");
 assert.match(app,/mapPointsToRaster\(strokePoints,WIDTH,HEIGHT,target\.width,target\.height/);
 assert.match(app,/target\.dataUrl=nextData;target\.mimeType="image\/png"/);
 assert.match(app,/رسم متجهي فوق:/);
 assert.match(app,/historyLimit=project\.frames\.length>600\?40:rasterBytes>8\*1024\*1024\?3/);
});

test("Raster strokes are serialized and large canvases fail safely on mobile",async()=>{
 const [app,surface]=await Promise.all([readFile(new URL("../app/app.js",import.meta.url),"utf8"),readFile(new URL("../app/raster-surface.mjs",import.meta.url),"utf8")]);
 assert.match(app,/rasterCommitPending/);
 assert.match(app,/if\(playing\|\|e\.button>0\|\|rasterCommitPending\)return/);
 assert.match(surface,/maxPixels=8\*1024\*1024/);
 assert.match(surface,/width\*height>maxPixels/);
 assert.match(app,/createPersistentRasterSurfaceManager/);
 assert.match(app,/resolveBrushPressure\(activePointerType,e\.pressure,fallbackPressure\)/);
 assert.match(app,/Number\.isFinite\(e\?\.clientX\).*?addPoint\(e\);drawing=false/);
});

test("Raster eraser clears pixels on an active image layer instead of creating SVG paths",async()=>{
 const app=await readFile(new URL("../app/app.js",import.meta.url),"utf8");
 assert.match(app,/tool==="eraser"&&layer\(\)\.type==="raster"/);
 assert.match(app,/erase:rasterErase/);
 assert.match(app,/مُحيت بكسلات من طبقة Raster/);
});
