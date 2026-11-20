import test from "node:test";
import assert from "node:assert/strict";
import {createProject,createRasterLayer,addRasterLayer,normalizeProject,frameSvg,layerSvg} from "../app/engine.mjs";

const pixel="data:image/png;base64,iVBORw0KGgo=";

test("raster layers persist through ZERO project normalization without flattening vector layers",()=>{
 const project=createProject("Hybrid");
 const frame=project.frames[0];
 frame.layers[0].operations.push({id:"ink-1",kind:"stroke",path:{d:"M 1 1 L 2 2",stroke:"#000",width:2,fill:"none"}});
 const raster=addRasterLayer(frame,{name:"Painted background",dataUrl:pixel,mimeType:"image/png",width:1,height:1,opacity:.8,blendMode:"multiply"});
 assert.equal(raster.type,"raster");
 const reopened=normalizeProject(JSON.parse(JSON.stringify(project)));
 assert.equal(reopened.frames[0].layers.length,2);
 assert.equal(reopened.frames[0].layers[0].operations.length,1);
 assert.equal(reopened.frames[0].layers[1].type,"raster");
 assert.equal(reopened.frames[0].layers[1].dataUrl,pixel);
 assert.equal(reopened.frames[0].layers[1].opacity,.8);
 assert.equal(reopened.frames[0].layers[1].blendMode,"multiply");
});

test("raster layer is composited into SVG output as an embedded image",()=>{
 const layer=createRasterLayer({dataUrl:pixel,mimeType:"image/png",width:1,height:1});
 const markup=layerSvg(layer);
 assert.match(markup,/preserveAspectRatio="xMidYMid meet"/);
 assert.match(markup,/<image href="data:image\/png;base64,/);
 const project=createProject();
 addRasterLayer(project.frames[0],{dataUrl:pixel,mimeType:"image/png",width:1,height:1});
 assert.match(frameSvg(project.frames[0]),/<image href="data:image\/png;base64,/);
});

test("raster layer validation rejects unsafe data, unsupported MIME and oversized dimensions",()=>{
 assert.throws(()=>createRasterLayer({dataUrl:"https://example.com/a.png",mimeType:"image/png",width:1,height:1}),/غير صالحة/);
 assert.throws(()=>createRasterLayer({dataUrl:pixel,mimeType:"image/svg+xml",width:1,height:1}),/غير مدعوم/);
 assert.throws(()=>createRasterLayer({dataUrl:pixel,mimeType:"image/png",width:20000,height:1}),/أبعاد/);
 assert.throws(()=>createRasterLayer({dataUrl:pixel,mimeType:"image/png",width:1,height:1,opacity:2}),/شفافية/);
});
