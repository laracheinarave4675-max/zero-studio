import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeProject} from "../app/engine.mjs";
const raw=JSON.parse(readFileSync(new URL("../examples/24-drawings-one-second.zero",import.meta.url),"utf8"));
test("one-second animation proof contains 24 distinct drawings at 24 FPS",()=>{const project=normalizeProject(raw);assert.equal(project.fps,24);assert.equal(project.frames.length,24);assert.equal(new Set(project.frames.map(frame=>JSON.stringify(frame))).size,24);const armPaths=project.frames.map(frame=>frame.layers.find(layer=>layer.name==="حركة التلويح").operations[1].path.d);assert.equal(new Set(armPaths).size,24)});
test("animation proof keeps stable editable layer structure",()=>{for(const frame of raw.frames){assert.equal(frame.layers.length,3);assert.deepEqual(frame.layers.map(layer=>layer.name),["الشكل والملابس","الوجه والتعبير","حركة التلويح"]);assert.ok(frame.layers.every(layer=>layer.operations.every(operation=>operation.kind==="stroke"))) }});
