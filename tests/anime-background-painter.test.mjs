import test from"node:test";
import assert from"node:assert/strict";
import{validatePath,SVG_ART_DEFS,frameSvg}from"../app/engine.mjs";
import{renderAnimeBackground,createAnimeBackgroundTestPlans,validateAnimeBackgroundPlan}from"../app/anime-background-painter.mjs";
test("anime painter returns three 2D-first editable background studies",()=>{const plans=createAnimeBackgroundTestPlans();assert.deepEqual(plans.map(p=>p.kind),["urban-store","rural-ramen","forest-house"]);for(const plan of plans){const result=renderAnimeBackground(plan);assert.equal(result.version,1);assert.ok(result.layers.length>=5);assert.ok(result.totalOperations>250);assert.ok(result.totalOperations<=2800);for(const layer of result.layers){assert.ok(layer.name.length>5);assert.ok(layer.operations.length>0);for(const p of layer.operations){assert.ok(p.d.startsWith("M "));assert.ok(p.fill!==undefined);assert.ok(Number.isFinite(p.opacity));}}}});
test("anime painter builds distinct layouts for all three reference scene families",()=>{const outputs=createAnimeBackgroundTestPlans().map(p=>renderAnimeBackground(p));const signatures=outputs.map(o=>o.layers.map(l=>l.operations.map(p=>p.d).join("")).join(""));assert.equal(new Set(signatures).size,3);assert.ok(outputs[0].totalOperations>outputs[0].layers.length*20);assert.ok(outputs[2].layers.some(l=>l.name.includes("المنزل")));});
test("anime background accepts only known 2D scene plan types",()=>{assert.throws(()=>validateAnimeBackgroundPlan({version:1,kind:"low-poly"}),/غير مدعوم/);assert.throws(()=>renderAnimeBackground(null),/غير مدعوم/);});
test("material paths preserve bounded opacity and known effect references",()=>{const p=validatePath({d:"M 10 10 L 100 100",stroke:"none",width:1,fill:"url(#zero-anime-plaster)",opacity:.38,filter:"url(#zero-anime-soft-shadow)"});assert.equal(p.opacity,.38);assert.equal(p.filter,"url(#zero-anime-soft-shadow)");assert.equal(validatePath({d:"M 10 10 L 100 100",fill:"url(#zero-anime-plaster)",opacity:4,filter:"url(https://evil.example/x)"}).opacity,1);assert.equal(validatePath({d:"M 10 10 L 100 100",fill:"url(#zero-anime-plaster)",opacity:-2}).opacity,0);});
test("vector art effects are embedded in exported SVG",()=>{const frame={layers:[{id:"x",visible:true,operations:[{kind:"stroke",id:"p",path:validatePath({d:"M 10 10 L 500 200",stroke:"none",fill:"url(#zero-anime-leaf)",filter:"url(#zero-anime-paper-grain)",opacity:.5})}]}]};const svg=frameSvg(frame);assert.ok(svg.includes('id="zero-anime-leaf"'));assert.ok(svg.includes('id="zero-anime-paper-grain"'));assert.ok(svg.includes('filter="url(#zero-anime-paper-grain)"'));assert.ok(svg.includes('opacity="0.5"'));assert.ok(SVG_ART_DEFS.includes("zero-anime-woodgrain"));});

import{applyPainterlyForestPass}from"../app/painterly-forest-pass.mjs";
test("forest-house receives deterministic tapered brush marks and directional light pass",()=>{
 const source={version:1,kind:"forest-house",layers:[]};
 const first=applyPainterlyForestPass({version:1,kind:"forest-house",layers:[]});
 const second=applyPainterlyForestPass({version:1,kind:"forest-house",layers:[]});
 assert.equal(first.layers.length,1);
 assert.equal(first.layers[0].name,"08 — ضربات الفرشاة والضوء الاتجاهي");
 assert.ok(first.layers[0].operations.length>=140);
 assert.ok(first.layers[0].operations.length<=160);
 assert.deepEqual(first.layers[0].operations,second.layers[0].operations);
 assert.ok(first.layers[0].operations.some(op=>op.d.includes(" Q ")&&op.fill.startsWith("#")));
 assert.ok(first.layers[0].operations.some(op=>op.opacity<.2));
 assert.equal(applyPainterlyForestPass({version:1,kind:"urban-store",layers:[]}).layers.length,0);
});
test("rendered forest house includes the painterly pass without exceeding operation budget",()=>{
 const result=renderAnimeBackground({version:1,kind:"forest-house"});
 assert.ok(result.layers.some(layer=>layer.name==="08 — ضربات الفرشاة والضوء الاتجاهي"));
 assert.ok(result.totalOperations<=2800);
});
