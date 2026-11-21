import test from "node:test";
import assert from "node:assert/strict";
import {buildAnimeConstructionModel,auditAnimeConstructionModel} from "../app/anime-construction-artist.mjs";
import {buildAnimeConstructionBrushPlan} from "../app/anime-construction-brush-plan.mjs";

test("refined construction includes rear hair, tapered neck, torso silhouette and facial features",()=>{
 const model=buildAnimeConstructionModel();
 assert.ok(model.hairBackSilhouette.length>=50);
 assert.equal(model.torso.neck.polygon.length,4);
 assert.ok(model.torso.outline.length>=7);
 assert.equal(model.brows.length,2);
 assert.ok(model.nose.points.length>=2);
 assert.ok(model.mouth.points.length>=10);
 assert.ok(model.eyes.every(eye=>eye.sclera.length>=30));
 assert.ok(model.eyes.every(eye=>eye.bounds.height/eye.bounds.width>.5));
 assert.equal(auditAnimeConstructionModel(model).valid,true);
});

test("refined brush plan paints a background and rear hair before the face",()=>{
 const plan=buildAnimeConstructionBrushPlan();
 const fills=plan.layers.find(layer=>layer.id==="flats").strokes.map(stroke=>stroke.id);
 assert.ok(fills.indexOf("background-field")<fills.indexOf("rear-hair-mass"));
 assert.ok(fills.indexOf("rear-hair-mass")<fills.indexOf("face-base"));
 assert.ok(fills.indexOf("neck-base")<fills.indexOf("face-base"));
 const ink=plan.layers.find(layer=>layer.id==="ink").strokes.map(stroke=>stroke.id);
 for(const id of ["brow-left","brow-right","nose-bridge","mouth-line"])assert.ok(ink.includes(id));
 const shadow=plan.layers.find(layer=>layer.id==="shadows").strokes.find(stroke=>stroke.id==="face-cast-shadow");
 assert.ok(shadow.clipPolygon?.length>=3);
});
