import test from "node:test";
import assert from "node:assert/strict";
import {
  APPROVED_KIMONO_ATLAS_FRAME_COUNT,
  APPROVED_KIMONO_ATLAS_LAYOUT,
  createApprovedKimonoRasterAtlas,
  createApprovedKimonoFootPoses,
  renderApprovedKimonoAtlasWalkCycle,
  auditApprovedKimonoAtlasCycle
} from "../app/approved-kimono-raster-atlas.mjs";

function mockCanvas(seed = 1) {
  const calls = [];
  const context = new Proxy({
    getImageData(_x, _y, _width, height) {
      return { data: height === APPROVED_KIMONO_ATLAS_LAYOUT.motionZone.identityRegionHeight
        ? new Uint8Array([11, 22, 33, 255])
        : new Uint8Array([seed & 255, (seed * 7) & 255, 91, 255]) };
    }
  }, {
    get(target, key) {
      if (key in target) return target[key];
      return (...args) => calls.push([String(key), ...args]);
    },
    set(target, key, value) { target[key] = value; return true; }
  });
  return {
    calls, width: 0, height: 0,
    getContext() { return context; },
    toDataURL() { return "data:image/png;base64,AAAA"; }
  };
}

test("atlas crops exact native-resolution assets from the approved 1280x720 sheet", () => {
  let created = 0;
  const atlas = createApprovedKimonoRasterAtlas({ width: 1280, height: 720 }, { createCanvas: () => { created++; return mockCanvas(); } });
  assert.equal(created, Object.keys(APPROVED_KIMONO_ATLAS_LAYOUT.crops).length);
  assert.equal(atlas.sourcePixelsPreserved, true);
  assert.equal(atlas.assets.sideFigure.width, 210);
  assert.equal(atlas.assets.faceAndHair.height, 270);
});

test("foot motion plan contains 24 one-exposure poses and changes only the motion zone", () => {
  const poses = createApprovedKimonoFootPoses();
  assert.equal(poses.length, 24);
  assert.equal(poses.every((pose, index) => pose.frameIndex === index && pose.exposureFrames === 1), true);
  assert.equal(new Set(poses.map(pose => [pose.nearOffset, pose.farOffset, pose.nearLift, pose.farLift].join("|"))).size, 24);
  assert.ok(poses.every(pose => Math.abs(pose.nearOffset) <= 12 && pose.nearLift <= 11));
});

test("rendered sequence repaints a full raster composite while retaining a pixel-identical identity region", () => {
  const atlas = createApprovedKimonoRasterAtlas({ width: 1280, height: 720 }, { createCanvas: () => mockCanvas() });
  let frameCanvases = 0;
  const cycle = renderApprovedKimonoAtlasWalkCycle({ atlas, createCanvas: () => mockCanvas(++frameCanvases) });
  assert.equal(frameCanvases, APPROVED_KIMONO_ATLAS_FRAME_COUNT);
  assert.equal(cycle.frames.length, 24);
  assert.equal(cycle.audit.uniqueFrameCount, 24);
  assert.equal(cycle.audit.identityRegionStable, true);
  assert.equal(cycle.audit.preservesPixelIdentityOutsideMotionZone, true);
  assert.equal(cycle.audit.modelInferenceCalls, 0);
  assert.equal(cycle.audit.svgOutputs, 0);
  assert.equal(cycle.audit.puppetTransforms, 0);
  assert.ok(cycle.frames.every(frame => frame.referencePixelsReusedForIdentity && frame.motionZoneRedrawn && frame.independentRasterComposite));
});

test("audit rejects any identity-region pixel drift", () => {
  const frames = Array.from({ length: 24 }, (_, index) => ({
    frameIndex: index, frameNumber: index + 1, fps: 24, exposureFrames: 1,
    referencePixelsReusedForIdentity: true, motionZoneRedrawn: true, independentRasterComposite: true,
    modelInferenceUsed: false, svgUsed: false, puppetTransformsUsed: false,
    contentHash: "rgba-fnv1a-" + (index + 1).toString(16).padStart(8, "0"),
    identityRegionHash: index === 12 ? "rgba-fnv1a-deadbeef" : "rgba-fnv1a-12345678"
  }));
  const audit = auditApprovedKimonoAtlasCycle(frames);
  assert.equal(audit.identityRegionStable, false);
  assert.equal(audit.preservesPixelIdentityOutsideMotionZone, false);
});

test("audit rejects duplicate full-frame rasters", () => {
  const frames = Array.from({ length: 24 }, (_, index) => ({
    frameIndex: index, frameNumber: index + 1, fps: 24, exposureFrames: 1,
    referencePixelsReusedForIdentity: true, motionZoneRedrawn: true, independentRasterComposite: true,
    modelInferenceUsed: false, svgUsed: false, puppetTransformsUsed: false,
    contentHash: "rgba-fnv1a-00000001", identityRegionHash: "rgba-fnv1a-12345678"
  }));
  assert.throws(() => auditApprovedKimonoAtlasCycle(frames), /Duplicate frame/);
});
