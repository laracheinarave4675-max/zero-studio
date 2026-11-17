import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../app/index.html",import.meta.url),"utf8");
const app=readFileSync(new URL("../app/app.js",import.meta.url),"utf8");
test("all controller DOM ids exist in the mobile workspace",()=>{const present=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]));const used=new Set([...app.matchAll(/\$\("([A-Za-z][\w-]*)"\)/g)].map(match=>match[1]));const missing=[...used].filter(id=>!present.has(id));assert.deepEqual(missing,[])});
test("AI proposal controls and preview layer are present",()=>{for(const id of ["geminiApiKey","aiPrompt","aiGenerateBtn","aiApproveBtn","aiRejectBtn","aiReview","proposalLayer"])assert.match(html,new RegExp('id="'+id+'"'))});
