import test from "node:test";
import assert from "node:assert/strict";
import {buildAnimeConstructionModel,auditAnimeConstructionModel} from "../app/anime-construction-artist.mjs";

test("construction model derives head, eye systems, torso and hair from one normalized design",()=>{
 const model=buildAnimeConstructionModel();
 assert.equal(model.format,"zero-studio-anime-construction-model");
 assert.equal(model.head.derivedFromHeadBounds,true);
 assert.equal(model.eyes.length,2);
 assert.equal(model.hair.length,7);
 assert.ok(model.hair.filter(clump=>clump.id.startsWith("fringe-")).every(clump=>clump.widthProfile.rootWidth<=.06));
 assert.ok(model.torso.ribcage.width>model.torso.waist.width);
 assert.ok(model.folds.length>=3);
 assert.ok(model.shadows.light);
 const audit=auditAnimeConstructionModel(model);
 assert.equal(audit.valid,true);
 assert.equal(audit.checks.visualQualityMeasured,false);
 assert.equal(audit.checks.semanticRecognitionPerformed,false);
});

test("three-quarter construction scales the far eye and shifts the head axis",()=>{
 const front=buildAnimeConstructionModel({viewYaw:0});
 const threeQuarter=buildAnimeConstructionModel({viewYaw:.72});
 assert.notEqual(threeQuarter.eyes[0].bounds.width,threeQuarter.eyes[1].bounds.width);
 assert.notEqual(front.head.axes.centerline.from.x,threeQuarter.head.axes.centerline.from.x);
});

test("hair clumps require independent ids and normalized, in-canvas control points",()=>{
 const base=buildAnimeConstructionModel();
 const guides=base.hair.map(item=>({id:item.id,root:item.root,control1:item.flow[5],control2:item.flow[12],tip:item.tip,rootWidth:item.widthProfile.rootWidth,tipWidth:item.widthProfile.tipWidth,samples:18,side:1}));
 guides[1].id=guides[0].id;
 assert.throws(()=>buildAnimeConstructionModel({hairGuides:guides}),/unique/);
 const invalid=structuredClone(guides);invalid[0].root={x:-.2,y:.2};
 assert.throws(()=>buildAnimeConstructionModel({hairGuides:invalid}),/normalized/);
});

test("pose and light inputs are bounded and deterministic",()=>{
 assert.throws(()=>buildAnimeConstructionModel({pose:{shoulderTilt:2}}),/Pose parameters/);
 assert.throws(()=>buildAnimeConstructionModel({lightDirection:{x:0,y:0}}),/light direction/);
 const a=buildAnimeConstructionModel({lightDirection:{x:-1,y:-1}});
 const b=buildAnimeConstructionModel({lightDirection:{x:-2,y:-2}});
 assert.deepEqual(a.shadows.light,b.shadows.light);
});

test("construction audit reports geometry defects without claiming visual quality",()=>{
 const model=buildAnimeConstructionModel();
 model.hair[0].outline[0]={x:1.4,y:.4};
 model.eyes[0].upperLidWeight=.1;
 const audit=auditAnimeConstructionModel(model);
 assert.equal(audit.valid,false);
 assert.ok(audit.findings.some(item=>item.code==="hair-out-of-bounds"));
 assert.ok(audit.findings.some(item=>item.code==="lid-hierarchy"));
 assert.equal(audit.checks.visualQualityMeasured,false);
});
