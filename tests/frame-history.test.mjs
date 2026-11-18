import test from"node:test";
import assert from"node:assert/strict";
import{captureFrameHistory,captureFrameHistoryAfter,applyFrameHistory}from"../app/frame-history.mjs";
const frame=(id)=>({id,layers:[{name:"ink",operations:[{path:{d:"M 0 0 L "+id+" 1"}}]}]});
function project(count=700){return{frames:Array.from({length:count},(_,i)=>frame(i)),fps:24,animationProduction:{id:"job",completedFrames:0,frameSignatures:[]}}}
test("large edit undo restores only the selected frame and keeps the rest untouched",()=>{
 const p=project(),before=captureFrameHistory(p,350);
 p.frames[350]=frame(9999);
 const after=captureFrameHistoryAfter(p,before);
 applyFrameHistory(p,before);
 assert.equal(p.frames.length,700);assert.equal(p.frames[350].id,350);assert.equal(p.frames[349].id,349);assert.equal(p.frames[351].id,351);
 applyFrameHistory(p,after);assert.equal(p.frames[350].id,9999);
});
test("large frame insertion undo and redo removes and restores exact inserted range",()=>{
 const p=project(),before=captureFrameHistory(p,350);
 const inserted=[frame(7001),frame(7002),frame(7003)];p.frames.splice(351,0,...inserted);
 const after=captureFrameHistoryAfter(p,before);
 applyFrameHistory(p,before);assert.equal(p.frames.length,700);assert.equal(p.frames[351].id,351);
 applyFrameHistory(p,after);assert.equal(p.frames.length,703);assert.deepEqual(p.frames.slice(351,354).map(x=>x.id),[7001,7002,7003]);
});
test("large frame deletion undo and redo restores then removes the exact frame",()=>{
 const p=project(),before=captureFrameHistory(p,350);p.frames.splice(350,1);
 const after=captureFrameHistoryAfter(p,before);
 applyFrameHistory(p,before);assert.equal(p.frames.length,700);assert.equal(p.frames[350].id,350);
 applyFrameHistory(p,after);assert.equal(p.frames.length,699);assert.equal(p.frames[350].id,351);
});
test("large frame history also restores animation production progress",()=>{
 const p=project(),before=captureFrameHistory(p,699);
 p.animationProduction.completedFrames=6;p.animationProduction.frameSignatures=["0123456789abcdef"];
 const after=captureFrameHistoryAfter(p,before);
 applyFrameHistory(p,before);assert.equal(p.animationProduction.completedFrames,0);assert.equal(p.animationProduction.frameSignatures.length,0);
 applyFrameHistory(p,after);assert.equal(p.animationProduction.completedFrames,6);assert.equal(p.animationProduction.frameSignatures.length,1);
});
test("large frame history is isolated from frame and project IDs",()=>{
 const p=project(),before=captureFrameHistory(p,600);
 p.frames[600]=frame(3);const after=captureFrameHistoryAfter(p,before);
 applyFrameHistory(p,before);assert.equal(p.frames[600].id,600);
 applyFrameHistory(p,after);assert.equal(p.frames[600].id,3);
});

test("large-project character library history is captured only when requested",()=>{
 const p=project();p.characterLibrary=[{id:"old"}];const before=captureFrameHistory(p,10,{includeCharacterLibrary:true});
 p.characterLibrary.push({id:"new"});
 const after=captureFrameHistoryAfter(p,before);
 applyFrameHistory(p,before);assert.deepEqual(p.characterLibrary,[{id:"old"}]);
 applyFrameHistory(p,after);assert.deepEqual(p.characterLibrary,[{id:"old"},{id:"new"}]);
});
