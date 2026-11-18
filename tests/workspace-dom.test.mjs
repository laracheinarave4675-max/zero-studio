import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../app/index.html",import.meta.url),"utf8");
const app=readFileSync(new URL("../app/app.js",import.meta.url),"utf8");
test("all controller DOM ids exist in the mobile workspace",()=>{const present=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]));const used=new Set([...app.matchAll(/\$\("([A-Za-z][\w-]*)"\)/g)].map(match=>match[1]));const missing=[...used].filter(id=>!present.has(id));assert.deepEqual(missing,[])});
test("AI proposal controls and preview layer are present",()=>{for(const id of ["geminiApiKey","aiPrompt","aiGenerateBtn","aiApproveBtn","aiRejectBtn","aiReview","proposalLayer"])assert.match(html,new RegExp('id="'+id+'"'))});

test("selection, move, and delete controls are present in the mobile workspace",()=>{
 for(const id of ["selectionLayer","deleteSelectionBtn","applyStyleBtn","duplicateSelectionBtn","drawingCanvas"])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/data-tool="select"/);
 assert.match(app,/translateOperation/);
 assert.match(app,/removeOperation/);
});

test("canvas pan and zoom controls are wired for mobile drawing",()=>{
 for(const id of ["zoomInBtn","zoomOutBtn","zoomResetBtn"])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/data-tool="pan"/);
 assert.match(app,/function zoomCanvas/);
 assert.match(app,/function resetCanvasView/);
});

test("character rig editor has a touch-sized viewport and draggable joints",()=>{
 assert.match(html,/id="characterRigCanvas"/);
 assert.match(html,/id="characterRigHandles"/);
 assert.match(app,/rigCanvas\.addEventListener\("pointermove"/);
 assert.match(app,/data-joint/);
});

test("character library and unique-drawing audit controls are present and wired",()=>{
 for(const id of ["characterLibrarySelect","saveCharacterLibraryBtn","loadCharacterLibraryBtn","deleteCharacterLibraryBtn","analyzeCadenceBtn","cadenceStatus"])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(app,/saveCharacterToLibrary/);
 assert.match(app,/loadCharacterFromLibrary/);
 assert.match(app,/removeCharacterFromLibrary/);
 assert.match(app,/analyzeDrawingCadence/);
});

test("rig-aware character pose interpolation controls are present and wired",()=>{
 for(const id of ["rigBlendStartSelect","rigBlendEndSelect","rigBlendProgress","rigBlendValue","interpolateRigBtn"])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(app,/interpolateNoriRigModels/);
 assert.match(app,/rigBlendProgress/);
});

test("linked character instance frame controls are present and connected",()=>{
 for(const id of ["characterInstanceSelect","copyCharacterToNextFrameBtn","updateCharacterInstanceBtn"])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(app,/copyCharacterInstanceToFrame/);
 assert.match(app,/replaceCharacterInstanceInFrame/);
 assert.match(app,/renderCharacterInstances/);
});
