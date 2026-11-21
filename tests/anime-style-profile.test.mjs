import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_TV_ANIME_STYLE_PROFILE,
  validateAnimeStyleProfile,
  deriveAnimeHeadConstruction,
  buildAnimeHairClump
} from "../app/anime-style-profile.mjs";

test("default anime style profile is a bounded and ordered craft specification",()=>{
 const profile=validateAnimeStyleProfile(DEFAULT_TV_ANIME_STYLE_PROFILE);
 assert.equal(profile.id,"tv-anime-balanced");
 assert.ok(profile.head.browLine<profile.head.eyeLine);
 assert.ok(profile.head.eyeLine<profile.head.noseBase);
 assert.ok(profile.head.noseBase<profile.head.mouthLine);
 assert.ok(profile.eyes.upperLidWeight>profile.eyes.lowerLidWeight);
});

test("head construction derives facial axes and eye proportions from head bounds",()=>{
 const front=deriveAnimeHeadConstruction({bounds:{x:.35,y:.12,width:.3,height:.48}});
 const threeQuarter=deriveAnimeHeadConstruction({bounds:{x:.35,y:.12,width:.3,height:.48},viewYaw:.7});
 assert.equal(front.derivedFromHeadBounds,true);
 assert.ok(front.axes.browY<front.axes.eyeY&&front.axes.eyeY<front.axes.noseY&&front.axes.noseY<front.axes.mouthY);
 assert.ok(front.eyes[0].bounds.width>0&&front.eyes[1].bounds.width>0);
 assert.notEqual(threeQuarter.eyes[0].scale,threeQuarter.eyes[1].scale);
 assert.notEqual(threeQuarter.axes.centerline.from.x,threeQuarter.axes.centerline.to.x);
});

test("anime head construction rejects invalid normalized bounds and facial style order",()=>{
 assert.throws(()=>deriveAnimeHeadConstruction({bounds:{x:.9,y:.2,width:.2,height:.4}}),/normalized/);
 const invalid=structuredClone(DEFAULT_TV_ANIME_STYLE_PROFILE);
 invalid.head.eyeLine=.7;
 assert.throws(()=>validateAnimeStyleProfile(invalid),/Facial construction lines/);
});

test("hair clump geometry has root-to-tip flow and a tapered organic outline",()=>{
 const clump=buildAnimeHairClump({
  root:{x:.4,y:.2},control1:{x:.35,y:.3},control2:{x:.48,y:.52},tip:{x:.55,y:.7},
  rootWidth:.09,tipWidth:.002,samples:24
 });
 assert.equal(clump.flow.length,25);
 assert.equal(clump.outline.length,50);
 assert.deepEqual(clump.flow[0],{x:.4,y:.2});
 assert.deepEqual(clump.flow.at(-1),{x:.55,y:.7});
 assert.ok(clump.widthProfile.rootWidth>clump.widthProfile.tipWidth);
 assert.ok(clump.outline.every(point=>point.x>=0&&point.x<=1&&point.y>=0&&point.y<=1));
});

test("hair clump geometry rejects malformed or out-of-canvas control points",()=>{
 assert.throws(()=>buildAnimeHairClump({root:{x:-.1,y:.2},control1:{x:.3,y:.3},control2:{x:.4,y:.4},tip:{x:.5,y:.6}}),/normalized/);
 assert.throws(()=>buildAnimeHairClump({root:{x:.2,y:.2},control1:{x:.3,y:.3},control2:{x:.4,y:.4},tip:{x:.5,y:.6},samples:3}),/sample count/);
});
