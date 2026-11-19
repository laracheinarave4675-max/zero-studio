import test from "node:test";
import assert from "node:assert/strict";
import {createProject,createFrame,createLayer,createRasterLayer,normalizeProject,addLayer,renameLayer,removeLayer,reorderLayer,appendOperation,validatePath,layerSvg,frameSvg,pointsToPath,shapePath,interpolatePathData,createInbetweenFrames,pressureOutlinePath,pathGeometryBounds,removeOperation,translateOperation,translatePathData,updateOperation,duplicateOperation,analyzeDrawingCadence,rotatePathData,getPathAnchors,movePathAnchor,getPathEditHandles,movePathControlPoint} from "../app/engine.mjs";

const line=(x=10)=>({d:"M "+x+" 10 L "+(x+40)+" 40",stroke:"#172033",width:5,fill:"none"});
test("new projects use v2 with one editable layer",()=>{const p=createProject();assert.equal(p.version,2);assert.equal(p.frames[0].layers.length,1);assert.deepEqual(p.frames[0].layers[0].operations,[])});
test("static animation backgrounds persist separately and are included in SVG composites",()=>{const p=createProject("background");const bg=createLayer("fixed background");appendOperation(bg,"stroke",line(20));p.animationBackground=[bg];const reopened=normalizeProject(JSON.parse(JSON.stringify(p)));assert.equal(reopened.animationBackground.length,1);assert.equal(reopened.animationBackground[0].locked,true);assert.ok(frameSvg(reopened.frames[0],"test",reopened.animationBackground).includes(line(20).d));assert.throws(()=>normalizeProject({...p,animationBackground:[bg,{...bg,id:"duplicate",name:"fixed background"}]}),/مكررة/)});
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

test("drawing cadence audit counts distinct artwork rather than frame IDs or playback rate",()=>{
 const first=createFrame(),copy=JSON.parse(JSON.stringify(first));copy.id="different-frame-id";
 const third=createFrame();appendOperation(third.layers[0],"stroke",line(100));
 const audit=analyzeDrawingCadence([first,copy,third],24);
 assert.equal(audit.frameCount,3);
 assert.equal(audit.uniqueDrawingCount,2);
 assert.equal(audit.duplicateDrawingCount,1);
 assert.equal(audit.playbackFps,24);
 assert.equal(audit.uniqueDrawingsPerSecond,16);
 assert.equal(audit.meets24UniqueDrawingsPerSecond,false);
});
test("drawing cadence audit recognizes a full second of 24 independent drawings",()=>{
 const frames=Array.from({length:24},(_,i)=>{const f=createFrame();appendOperation(f.layers[0],"stroke",line(20+i*20));return f});
 const audit=analyzeDrawingCadence(frames,24);
 assert.equal(audit.uniqueDrawingCount,24);
 assert.equal(audit.uniqueDrawingsPerSecond,24);
 assert.equal(audit.meets24UniqueDrawingsPerSecond,true);
});
test("drawing cadence audit rejects unsupported frame rates and malformed frames",()=>{
 assert.throws(()=>analyzeDrawingCadence([createFrame()],30),/معدل العرض/);
 assert.throws(()=>analyzeDrawingCadence([]),/قائمة الإطارات/);
 assert.throws(()=>analyzeDrawingCadence([{}]),/بنية أحد الإطارات/);
});

test("project normalization validates character instance layer metadata",()=>{
 const p=createProject(),l=p.frames[0].layers[0];
 l.characterInstance={id:"instance-1",modelId:"nori",name:"Nori",partIds:["head","body"]};
 assert.equal(normalizeProject(p).frames[0].layers[0].characterInstance.id,"instance-1");
 assert.throws(()=>normalizeProject({...p,frames:[{...p.frames[0],layers:[{...l,characterInstance:{id:"",modelId:"nori",name:"Nori",partIds:["head"]}}]}]}),/مثيل الشخصية/);
});

test("SVG path rotation preserves line, curve, arc and relative path geometry",()=>{
 assert.equal(rotatePathData("M 10 0 L 20 0",90,0,0),"M 0 10 L 0 20");
 assert.equal(rotatePathData("M 10 10 H 20 V 30",90,0,0),"M -10 10 L -10 20 L -30 20");
 const rotated=rotatePathData("m 10 0 l 10 0",90,0,0);
 assert.equal(rotated,"M 0 10 L 0 20");
 const arc=rotatePathData("M 10 0 A 5 6 0 0 1 20 0",90,0,0);
 assert.match(arc,/A 5 6 90 0 1 0 20/);
});
test("SVG path rotation rejects invalid angles and pivots",()=>{
 assert.throws(()=>rotatePathData("M 0 0 L 1 1",NaN),/غير صالحة/);
 assert.throws(()=>rotatePathData("M 0 0 L 1 1",0,Infinity,0),/غير صالحة/);
});

test("SVG path anchor editor reads endpoints and moves a selected node without changing controls",()=>{
 const d="M 10 10 C 20 10 20 30 30 30 Q 40 40 50 50";
 const anchors=getPathAnchors(d);
 assert.deepEqual(anchors.map(p=>[p.x,p.y]),[[10,10],[30,30],[50,50]]);
 const moved=movePathAnchor(d,1,35,25);
 assert.match(moved,/C 20 10 20 30 35 25/);
 assert.match(moved,/Q 40 40 50 50/);
 assert.deepEqual(getPathAnchors(moved).map(p=>[p.x,p.y]),[[10,10],[35,25],[50,50]]);
});
test("SVG path anchor editor handles arcs, relative paths and invalid node indices",()=>{
 const d="m 10 0 l 10 0 A 5 5 0 0 1 30 10";
 const anchors=getPathAnchors(d);
 assert.deepEqual(anchors.map(p=>[p.x,p.y]),[[10,0],[20,0],[30,10]]);
 const moved=movePathAnchor(d,2,40,20);
 assert.deepEqual(getPathAnchors(moved).map(p=>[p.x,p.y]),[[10,0],[20,0],[40,20]]);
 assert.throws(()=>movePathAnchor(d,8,1,1),/غير موجودة/);
 assert.throws(()=>movePathAnchor(d,0,Infinity,1),/غير صالح/);
});

test("SVG node editor exposes Bézier controls separately from path anchors",()=>{
 const handles=getPathEditHandles("M 0 0 C 10 0 10 20 20 20 Q 30 30 40 40");
 assert.equal(handles.anchors.length,3);
 assert.equal(handles.controls.length,3);
 assert.deepEqual(handles.controls.map(p=>[p.x,p.y]),[[10,0],[10,20],[30,30]]);
});
test("SVG Bézier control movement changes only the selected control handle",()=>{
 const d="M 0 0 C 10 0 10 20 20 20";
 const moved=movePathControlPoint(d,1,15,25);
 assert.match(moved,/C 10 0 15 25 20 20/);
 assert.deepEqual(getPathAnchors(moved).map(p=>[p.x,p.y]),[[0,0],[20,20]]);
 assert.throws(()=>movePathControlPoint(d,9,0,0),/غير موجود/);
});

test("raster layers preserve editable stroke samples and brush settings across project reopen",()=>{
 const dataUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pS8AAAAASUVORK5CYII=";
 const p=createProject("raster history"),layer=createRasterLayer({name:"paint",dataUrl,mimeType:"image/png",width:1,height:1});
 layer.strokes=[{points:[{x:12,y:24,pressure:.7},{x:18,y:29,pressure:1}],options:{brush:"gouache",size:14,color:"#52764b",opacity:.8,texture:.6,blendMode:"multiply",seed:91}}];
 p.frames[0].layers=[layer];
 const reopened=normalizeProject(JSON.parse(JSON.stringify(p)));
 assert.deepEqual(reopened.frames[0].layers[0].strokes,layer.strokes);
});
test("raster layer rejects malformed or excessive editable stroke history",()=>{
 const dataUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pS8AAAAASUVORK5CYII=";
 const p=createProject(),layer=createRasterLayer({dataUrl,mimeType:"image/png",width:1,height:1});
 layer.strokes=[{points:[{x:Infinity,y:0,pressure:.5}],options:{brush:"ink"}}];p.frames[0].layers=[layer];
 assert.throws(()=>normalizeProject(JSON.parse(JSON.stringify(p))),/نقطة ضربة Raster/);
});
