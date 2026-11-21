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

test("head and torso anchor handles are exposed by the character rig editor",()=>{
 assert.match(app,/torso-center/);
 assert.match(app,/head-center/);
 assert.match(app,/const anchor=key==="torso-center"/);
 assert.match(html,/المقابض الذهبية/);
});

test("custom character creation from the current vector frame is exposed",()=>{
 for(const id of ["characterDraftName","createCharacterFromFrameBtn"])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(app,/createCharacterModelFromFrame/);
 assert.match(app,/saveCharacterToLibrary/);
});

test("head rotation slider is exposed and wired to the vector rig",()=>{
 assert.match(html,/id="headRotationRange"/);
 assert.match(html,/id="headRotationValue"/);
 assert.match(app,/rotateNoriHead/);
});

test("whole-body lean slider is present and wired to the character rig",()=>{
 assert.match(html,/id="bodyRotationRange"/);
 assert.match(html,/id="bodyRotationValue"/);
 assert.match(app,/rotateNoriBody/);
});

test("vector path node editor controls and overlay are present and wired",()=>{
 assert.match(html,/id="nodeEditBtn"/);
 assert.match(html,/id="nodeEditLayer"/);
 assert.match(app,/getPathEditHandles/);
 assert.match(app,/movePathAnchor/);
 assert.match(app,/movePathControlPoint/);
 assert.match(app,/nodeDrag/);
});

test("editable background library controls are present and connected to the drawing engine",()=>{
 for(const id of ["backgroundPreset","addBackgroundBtn","backgroundStatus"])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(app,/addBackgroundToFrame/);
 assert.match(app,/BACKGROUND_PRESETS/);
 const sw=readFileSync(new URL("../app/sw.js",import.meta.url),"utf8");
 assert.match(sw,/backgrounds\.mjs/);
});
