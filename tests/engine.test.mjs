import test from "node:test";
import assert from "node:assert/strict";
import {createProject,createFrame,createLayer,normalizeProject,addLayer,renameLayer,removeLayer,reorderLayer,appendOperation,validatePath,layerSvg,frameSvg,pointsToPath} from "../app/engine.mjs";

const line=(x=10)=>({d:"M "+x+" 10 L "+(x+40)+" 40",stroke:"#172033",width:5,fill:"none"});
test("new projects use v2 with one editable layer",()=>{const p=createProject();assert.equal(p.version,2);assert.equal(p.frames[0].layers.length,1);assert.deepEqual(p.frames[0].layers[0].operations,[])});
test("v1 projects migrate their paths into a layer",()=>{const p=normalizeProject({format:"zero-studio",version:1,name:"old",fps:24,frames:[{id:"f1",paths:[line()]}]});assert.equal(p.version,2);assert.equal(p.frames[0].layers[0].operations[0].kind,"stroke");assert.equal(p.frames[0].layers[0].operations[0].path.d,line().d)});
test("add, reorder and remove layers while retaining one",()=>{const f=createFrame(),a=f.layers[0],b=addLayer(f,"حبر");assert.equal(f.layers.length,2);assert.equal(reorderLayer(f,b.id,-1),true);assert.equal(f.layers[0].id,b.id);removeLayer(f,b.id);assert.equal(f.layers.length,1);assert.throws(()=>removeLayer(f,a.id),/طبقة واحدة/)});
test("layer rename trims whitespace and rejects empty or overlong names",()=>{const f=createFrame(),l=f.layers[0];assert.equal(renameLayer(f,l.id,"  حبر رئيسي  ").name,"حبر رئيسي");assert.throws(()=>renameLayer(f,l.id,"   "),/فارغ/);assert.throws(()=>renameLayer(f,l.id,"x".repeat(81)),/80/);assert.throws(()=>renameLayer(f,"missing","x"),/غير موجودة/)});
test("locked layers reject drawing operations",()=>{const l=createLayer();l.locked=true;assert.throws(()=>appendOperation(l,"stroke",line()),/مقفلة/)});
test("vector eraser creates a real SVG mask rather than a white paint stroke",()=>{const l=createLayer();appendOperation(l,"stroke",line());appendOperation(l,"erase",{d:"M 20 20 L 30 30",stroke:"#000",width:24,fill:"none"});const svg=layerSvg(l);assert.match(svg,/<mask/);assert.match(svg,/stroke="black"/);assert.doesNotMatch(svg,/stroke="#fff"/)});
test("eraser affects earlier strokes, later strokes remain on top",()=>{const l=createLayer();appendOperation(l,"stroke",line(1));appendOperation(l,"erase",line(2));appendOperation(l,"stroke",line(3));const svg=layerSvg(l);assert.ok(svg.indexOf("<g mask=")<svg.lastIndexOf('d="M 3 10'))});
test("hidden layers are omitted from SVG export",()=>{const l=createLayer();appendOperation(l,"stroke",line());l.visible=false;assert.equal(layerSvg(l),"")});
test("invalid SVG path data and extreme coordinates are rejected",()=>{assert.throws(()=>validatePath({d:"<script>alert(1)</script>"}));assert.throws(()=>validatePath({d:"M 1000001 2 L 3 4"}))});
test("frame export includes visible vector layer content and mask definitions",()=>{const f=createFrame();appendOperation(f.layers[0],"stroke",line());appendOperation(f.layers[0],"erase",line(2));const svg=frameSvg(f);assert.match(svg,/<svg/);assert.match(svg,/<mask/);assert.match(svg,/data-layer=/)});
test("project v2 round trip preserves layer flags and ordered eraser operations",()=>{const p=createProject();const l=p.frames[0].layers[0];l.name="Ink";l.visible=false;appendOperation(l,"stroke",line());appendOperation(l,"erase",line(2));l.locked=true;const q=normalizeProject(JSON.parse(JSON.stringify(p)));assert.equal(q.frames[0].layers[0].name,"Ink");assert.equal(q.frames[0].layers[0].visible,false);assert.equal(q.frames[0].layers[0].locked,true);assert.deepEqual(q.frames[0].layers[0].operations.map(o=>o.kind),["stroke","erase"])});

test("consecutive eraser strokes are combined before later artwork",()=>{const l=createLayer();appendOperation(l,"stroke",line());appendOperation(l,"erase",line(2));appendOperation(l,"erase",line(4));appendOperation(l,"stroke",line(6));const svg=layerSvg(l);assert.equal((svg.match(/<mask /g)||[]).length,1);assert.equal((svg.match(/stroke="black"/g)||[]).length,2);assert.ok(svg.indexOf("<g mask=")<svg.lastIndexOf('d="M 6 10'))});

test("mask ids are unique between separate layers in one exported frame",()=>{const f=createFrame();const second=addLayer(f,"تفاصيل");appendOperation(f.layers[0],"stroke",line());appendOperation(f.layers[0],"erase",line(2));appendOperation(second,"stroke",line(3));appendOperation(second,"erase",line(4));const svg=frameSvg(f,"check-frame");const ids=[...svg.matchAll(/id="(erase-mask-[^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,2);assert.notEqual(ids[0],ids[1])});

test("smooth freehand paths use cubic curves while preserving the sampled endpoints",()=>{
 const d=pointsToPath([{x:0,y:0},{x:10,y:20},{x:20,y:0},{x:30,y:20}]);
 assert.match(d,/^M 0 0 C /);assert.equal((d.match(/ C /g)||[]).length,3);assert.ok(d.endsWith("30 20"));
});
test("freehand path conversion handles taps, straight gestures and invalid points",()=>{
 assert.equal(pointsToPath([]),"");
 assert.match(pointsToPath([{x:4,y:5}]),/^M 4 5 l 0.1 0$/);
 assert.equal(pointsToPath([{x:1,y:2},{x:3,y:4}]),"M 1 2 L 3 4");
 assert.throws(()=>pointsToPath([{x:0,y:0},{x:Infinity,y:2}]),/غير صالحة/);
});

test("geometric tools create editable line, rectangle and closed ellipse vector paths",()=>{
 const a={x:10,y:20},b={x:110,y:220};
 assert.equal(shapePath("line",a,b),"M 10 20 L 110 220");
 assert.equal(shapePath("rect",a,b),"M 10 20 L 110 20 L 110 220 L 10 220 Z");
 const ellipse=shapePath("ellipse",a,b);
 assert.match(ellipse,/^M 60 20 C /);assert.equal((ellipse.match(/ C /g)||[]).length,4);assert.ok(ellipse.endsWith("Z"));
});
test("geometric tools reject invalid coordinates and unknown shapes",()=>{
 assert.throws(()=>shapePath("ellipse",{x:NaN,y:0},{x:1,y:2}),/غير صالحة/);
 assert.throws(()=>shapePath("star",{x:0,y:0},{x:5,y:5}),/غير مدعومة/);
});
