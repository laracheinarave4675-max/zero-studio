import test from"node:test";
import assert from"node:assert/strict";
import{paintNaturalFoliageCluster,paintBarkTexture,paintStoneGrain}from"../app/raster-environment-media.mjs";
function context(){
 const calls=[];
 return{calls,save(){calls.push("save")},restore(){calls.push("restore")},translate(){},rotate(){},beginPath(){calls.push("begin")},moveTo(){},lineTo(){},quadraticCurveTo(){calls.push("quadratic")},bezierCurveTo(){calls.push("bezier")},ellipse(){calls.push("ellipse")},fill(){calls.push("fill")},stroke(){calls.push("stroke")},set fillStyle(v){},set strokeStyle(v){},set globalAlpha(v){},set lineWidth(v){},set lineCap(v){}};
}
test("natural foliage clusters draw a connected twig and varied leaf silhouettes deterministically",()=>{
 const a=context(),b=context();
 const opts={x:120,y:80,size:42,angle:-1.1,color:"#477b4d",seed:99,opacity:.8,texture:.9};
 const ra=paintNaturalFoliageCluster(a,opts),rb=paintNaturalFoliageCluster(b,opts);
 assert.deepEqual(ra,rb);assert.deepEqual(a.calls,b.calls);
 assert.ok(ra.leafCount>=7);assert.equal(ra.branchCount,1);
 assert.ok(a.calls.includes("bezier")&&a.calls.includes("quadratic")&&a.calls.includes("stroke"));
});
test("bark and stone media add deterministic material grain without image assets",()=>{
 const bark=context(),stone=context();
 paintBarkTexture(bark,{x:10,y:20,length:160,width:30,seed:7});
 paintStoneGrain(stone,{x:0,y:0,width:120,height:60,seed:8});
 assert.ok(bark.calls.filter(c=>c==="quadratic").length>=4);
 assert.ok(stone.calls.filter(c=>c==="ellipse").length>=8);
 assert.ok(bark.calls.includes("stroke")&&stone.calls.includes("fill"));
});
