import test from "node:test";
import assert from "node:assert/strict";
import {createProject,createFrame,createLayer,normalizeProject,addLayer,renameLayer,removeLayer,reorderLayer,appendOperation,validatePath,layerSvg,frameSvg,pointsToPath,shapePath,interpolatePathData,createInbetweenFrames,pressureOutlinePath,pathGeometryBounds,removeOperation,translateOperation,translatePathData,updateOperation,duplicateOperation} from "../app/engine.mjs";

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

test("SVG path interpolation preserves command topology and interpolates coordinates",()=>{
 const mid=interpolatePathData("M 0 0 Q 10 20 20 0","M 10 10 Q 30 40 50 10",.5);
 assert.equal(mid,"M 5 5 Q 20 30 35 5");
 assert.throws(()=>interpolatePathData("M 0 0 L 10 10","M 0 0 C 1 1 2 2 10 10",.5),/غير متطابقة/);
 assert.throws(()=>interpolatePathData("M 0 0","M 1 1",2),/بين صفر وواحد/);
});
test("in-between frame generation creates independent editable vector frames",()=>{
 const a=createFrame(),b=createFrame();
 appendOperation(a.layers[0],"stroke",{d:"M 0 0 L 100 100",stroke:"#172033",width:4,fill:"none"});
 appendOperation(b.layers[0],"stroke",{d:"M 20 40 L 200 240",stroke:"#172033",width:8,fill:"none"});
 const frames=createInbetweenFrames(a,b,2);
 assert.equal(frames.length,2);assert.notEqual(frames[0].id,frames[1].id);
 assert.equal(frames[0].layers[0].operations[0].path.d,"M 6.667 13.333 L 133.333 146.667");
 assert.equal(frames[0].layers[0].operations[0].path.width,5.333333333333333);
 frames[0].layers[0].operations[0].path.d="M 1 1";
 assert.notEqual(frames[1].layers[0].operations[0].path.d,"M 1 1");
});
test("in-between generation rejects mismatched layer structure and unsupported operation topology",()=>{
 const a=createFrame(),b=createFrame();
 appendOperation(a.layers[0],"stroke",{d:"M 0 0 L 10 10"});
 appendOperation(b.layers[0],"stroke",{d:"M 0 0 C 1 1 2 2 10 10"});
 assert.throws(()=>createInbetweenFrames(a,b,1),/غير متطابقة/);
 assert.throws(()=>createInbetweenFrames(a,b,0),/من 1 إلى 24/);
});

test("pressure-sensitive strokes create filled outlines whose width follows stylus pressure",()=>{
 const light=pressureOutlinePath([{x:10,y:10,pressure:.1},{x:50,y:10,pressure:.1}],20);
 const firm=pressureOutlinePath([{x:10,y:10,pressure:1},{x:50,y:10,pressure:1}],20);
 assert.match(light,/^M /);assert.match(light,/ Z$/);
 assert.notEqual(light,firm);
 assert.ok(Math.abs((+firm.match(/M [0-9.]+ ([0-9.]+)/)[1])-(+light.match(/M [0-9.]+ ([0-9.]+)/)[1]))>5);
});
test("pressure outline handles taps and rejects invalid samples",()=>{
 assert.match(pressureOutlinePath([{x:5,y:8,pressure:.5}],12),/^M .* Z$/);
 assert.equal(pressureOutlinePath([],10),"");
 assert.throws(()=>pressureOutlinePath([{x:0,y:0,pressure:Infinity}],5),/غير صالحة/);
 assert.throws(()=>pressureOutlinePath([{x:0,y:0}],101),/غير صالح/);
});

test("SVG parser validates command arity, move origin, arc flags and relative geometry",()=>{
 const valid="M 10 10 l 20 0 h 5 v 5 C 40 20 45 25 50 30 s 10 10 20 0 Q 80 20 90 30 t 10 10 A 4 5 0 0 1 110 50 z";
 const bounds=pathGeometryBounds(valid);
 assert.ok(bounds.minX<=10&&bounds.maxX>=110&&bounds.minY<=10&&bounds.maxY>=50);
 assert.throws(()=>validatePath({d:"M 0"}),/معاملات/);
 assert.throws(()=>validatePath({d:"L 0 0"}),/يبدأ/);
 assert.throws(()=>validatePath({d:"M 0 0 C 1 2"}),/معاملات/);
 assert.throws(()=>validatePath({d:"M 0 0 A 5 5 0 2 0 20 20"}),/قوس/);
 assert.throws(()=>validatePath({d:"M 999999 0 l 10 0"}),/التراكمية/);
});

test("drawn operations receive stable IDs that survive project normalization and export",()=>{
 const frame=createFrame(),layer=frame.layers[0],id=appendOperation(layer,"stroke",line());
 assert.ok(id);assert.equal(layer.operations[0].id,id);
 const normalized=normalizeProject({format:"zero-studio",version:2,name:"ids",frames:[{id:"f",layers:[{...layer,operations:[{...layer.operations[0]}]}]}]});
 assert.equal(normalized.frames[0].layers[0].operations[0].id,id);
 assert.match(frameSvg(normalized.frames[0]),new RegExp('data-operation="'+id+'"'));
});
test("translate vector paths moves absolute coordinates while retaining relative deltas",()=>{
 assert.equal(translatePathData("M 10 20 l 5 6 H 30 V 40",5,-2),"M 15 18 l 5 6 H 35 V 38");
 assert.equal(translatePathData("M 0 0 C 10 10 20 20 30 30",2,3),"M 2 3 C 12 13 22 23 32 33");
 assert.throws(()=>translatePathData("M 0 0",Infinity,1),/غير صالحة/);
});
test("selected vector operations can be moved and deleted, but locked layers reject edits",()=>{
 const layer=createLayer(),id=appendOperation(layer,"stroke",line(10));
 translateOperation(layer,id,5,10);
 assert.equal(layer.operations[0].path.d,"M 15 20 L 55 50");
 const removed=removeOperation(layer,id);
 assert.equal(removed.id,id);assert.equal(layer.operations.length,0);
 layer.locked=true;
 assert.throws(()=>removeOperation(layer,"missing"),/مقفلة/);
 assert.throws(()=>translateOperation(layer,"missing",1,1),/مقفلة/);
});
test("legacy layers receive unique operation IDs during normalization",()=>{
 const p=normalizeProject({format:"zero-studio",version:1,name:"legacy",fps:24,frames:[{paths:[line(),line(80)]}]});
 const ids=p.frames[0].layers[0].operations.map(op=>op.id);
 assert.equal(ids.length,2);assert.equal(new Set(ids).size,2);
});

test("selected vector operations can be restyled and duplicated with new identities",()=>{
 const layer=createLayer(),id=appendOperation(layer,"stroke",{d:"M 0 0 L 20 20",stroke:"#112233",width:3,fill:"none"});
 const updated=updateOperation(layer,id,{stroke:"#abcdef",width:9});
 assert.equal(updated.path.stroke,"#abcdef");assert.equal(updated.path.width,9);
 const copy=duplicateOperation(layer,id);
 assert.notEqual(copy.id,id);assert.equal(copy.path.stroke,"#abcdef");assert.equal(layer.operations.length,2);
 assert.equal(layer.operations[0].id,id);assert.equal(layer.operations[1].id,copy.id);
 assert.throws(()=>updateOperation(layer,"missing",{stroke:"#ffffff"}),/غير موجود/);
});
test("restyle and duplicate reject unsafe styles and locked layers",()=>{
 const layer=createLayer(),id=appendOperation(layer,"stroke",line());
 assert.equal(updateOperation(layer,id,{stroke:"url(javascript:alert(1))"}).path.stroke,"#172033");
 layer.locked=true;
 assert.throws(()=>updateOperation(layer,id,{width:20}),/مقفلة/);
 assert.throws(()=>duplicateOperation(layer,id),/مقفلة/);
});
