import test from "node:test";
import assert from "node:assert/strict";
import {createFrame,frameSvg,normalizeProject,createProject} from "../app/engine.mjs";
import {BACKGROUND_PRESETS,createBackgroundLayers,addBackgroundToFrame} from "../app/backgrounds.mjs";
test("background library exposes four named editable vector scenes",()=>{
 assert.deepEqual(BACKGROUND_PRESETS.map(x=>x.id),["day-city","forest","room","night-city"]);
 for(const preset of BACKGROUND_PRESETS){const layers=createBackgroundLayers(preset.id);assert.ok(layers.length>=4);assert.ok(layers.every(layer=>layer.name.startsWith("خلفية ·")&&layer.operations.length>0));assert.ok(layers.every(layer=>layer.operations.every(op=>op.kind==="stroke"&&op.path.d.startsWith("M "))))}
});
test("background layers are inserted behind existing character and ink layers",()=>{
 const frame=createFrame(),original=frame.layers[0];original.name="حبر الشخصية";const added=addBackgroundToFrame(frame,"forest");assert.equal(frame.layers[0],added[0]);assert.equal(frame.layers.at(-1),original);assert.match(frameSvg(frame),/<svg/);
});
test("background insertion rejects unknown presets and capacity overflow without partial mutation",()=>{
 const frame=createFrame();assert.throws(()=>addBackgroundToFrame(frame,"unknown"),/غير معروف|اختر/);
 const full=createFrame();full.layers=Array.from({length:99},(_,i)=>({id:"l"+i,name:"l",visible:true,locked:false,operations:[]}));assert.throws(()=>addBackgroundToFrame(full,"room"),/مساحة/);assert.equal(full.layers.length,99);
});
test("background vectors survive project save/open normalization",()=>{
 const project=createProject();addBackgroundToFrame(project.frames[0],"night-city");const loaded=normalizeProject(JSON.parse(JSON.stringify(project)));assert.equal(loaded.frames[0].layers.length,7);assert.ok(loaded.frames[0].layers[0].operations.length>0);
});
