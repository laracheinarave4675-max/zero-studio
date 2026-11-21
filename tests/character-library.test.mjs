import test from "node:test";
import assert from "node:assert/strict";
import {createProject,normalizeProject} from "../app/engine.mjs";
import {createNoriModel} from "../app/character-model.mjs";
import {saveCharacterToLibrary,loadCharacterFromLibrary,removeCharacterFromLibrary,MAX_CHARACTER_LIBRARY} from "../app/character-library.mjs";

test("character library stores validated independent copies and reloads them",()=>{
 const project=createProject(),source=createNoriModel("happy","side","walk");
 const entry=saveCharacterToLibrary(project,source);
 source.parts[0].path.d="M 0 0 L 1 1";
 const loaded=loadCharacterFromLibrary(project,entry.id);
 assert.equal(loaded.expression,"happy");
 assert.equal(loaded.view,"side");
 assert.equal(loaded.pose,"walk");
 assert.notEqual(loaded.parts[0].path.d,source.parts[0].path.d);
});
test("character library removes only the selected asset",()=>{
 const project=createProject(),a=saveCharacterToLibrary(project,createNoriModel()),b=saveCharacterToLibrary(project,createNoriModel("sad"));
 removeCharacterFromLibrary(project,a.id);
 assert.equal(project.characterLibrary.length,1);
 assert.equal(loadCharacterFromLibrary(project,b.id).expression,"sad");
 assert.throws(()=>loadCharacterFromLibrary(project,a.id),/غير موجودة/);
});
test("character library rejects invalid models, blank names and malformed projects",()=>{
 const project=createProject();
 assert.throws(()=>saveCharacterToLibrary(project,{format:"wrong"}),/غير مدعومة/);
 assert.throws(()=>saveCharacterToLibrary(project,createNoriModel(),"   "),/فارغ/);
 assert.throws(()=>saveCharacterToLibrary({format:"wrong",version:2},createNoriModel()),/غير صالح/);
});
test("character library enforces the 100-model project limit",()=>{
 const project=createProject();
 for(let i=0;i<MAX_CHARACTER_LIBRARY;i++)saveCharacterToLibrary(project,createNoriModel(),"Nori "+i);
 assert.equal(project.characterLibrary.length,MAX_CHARACTER_LIBRARY);
 assert.throws(()=>saveCharacterToLibrary(project,createNoriModel()),/ممتلئة/);
});

test("character library survives ZERO project serialization and normalization",()=>{
 const project=createProject(),entry=saveCharacterToLibrary(project,createNoriModel("surprised","back","sit"));
 const reopened=normalizeProject(JSON.parse(JSON.stringify(project)));
 assert.equal(reopened.characterLibrary.length,1);
 const loaded=loadCharacterFromLibrary(reopened,entry.id);
 assert.equal(loaded.expression,"surprised");
 assert.equal(loaded.view,"back");
 assert.equal(loaded.pose,"sit");
});

test("character library prevents removal of a model linked to anime character DNA",()=>{
 const project=createProject(),entry=saveCharacterToLibrary(project,createNoriModel());
 project.animeCharacterDNA.push({characterModelAssetId:entry.id});
 assert.throws(()=>removeCharacterFromLibrary(project,entry.id),/مرتبط بهوية تشريحية محفوظة/);
 assert.equal(project.characterLibrary.length,1);
 project.animeCharacterDNA=[];
 removeCharacterFromLibrary(project,entry.id);
 assert.equal(project.characterLibrary.length,0);
});
