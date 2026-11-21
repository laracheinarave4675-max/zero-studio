import test from "node:test";
import assert from "node:assert/strict";
import { buildAnimeVisionBrushPlan } from "../app/digital-artist-vision-brush-planner.mjs";

const report = (contour) => ({
  format:"zero-studio-anime-vision-report",
  version:1,
  referenceDigest:"a".repeat(64),
  subject:"anime heroine",
  style:"soft cel-shaded anime",
  composition:"head and shoulders",
  landmarks:[{id:"eye-center",label:"eye center",x:.5,y:.4,confidence:.95}],
  regions:[{
    id:"hair-main",label:"hair mass",x:.2,y:.1,width:.6,height:.5,
    ...(contour?{contour}:{}),confidence:.96
  }],
  palette:[{id:"hair-color",label:"hair",color:"#28334b",confidence:.99}],
  identityLocks:["preserve eye shape","preserve hair silhouette"]
});

test("reviewed organic contours become both native region fills and clean ink strokes",()=>{
  const contour=[{x:.5,y:.1},{x:.72,y:.25},{x:.65,y:.48},{x:.35,y:.48},{x:.28,y:.25}];
  const result=buildAnimeVisionBrushPlan(report(contour));
  const layers=result.plan.layers;
  const fill=layers.find(layer=>layer.role==="flat-color");
  const ink=layers.find(layer=>layer.role==="clean-line");
  assert.ok(fill);
  assert.ok(ink);
  assert.equal(fill.strokes[0].kind,"region-fill");
  assert.equal(fill.strokes[0].points.length,contour.length);
  assert.equal(ink.strokes[0].brush,"ink");
  assert.equal(ink.strokes[0].points.length,contour.length+1);
  assert.deepEqual(ink.strokes[0].points[0],ink.strokes[0].points.at(-1));
  assert.equal(result.review.inferencePerformed,false);
  assert.equal(result.review.requiresHumanApproval,true);
  assert.match(result.review.approximation,/contour-polygons/);
});

test("bounding-box fallback remains explicit and visibly warned when no contour is supplied",()=>{
  const result=buildAnimeVisionBrushPlan(report(null));
  assert.ok(result.review.warnings.some(item=>item.includes("rectangular bounding-box approximation")));
  assert.equal(result.review.requiresHumanApproval,true);
});
