import test from "node:test";
import assert from "node:assert/strict";
import { createProject, createFrame, normalizeProject } from "../app/engine.mjs";

const batchId = "anime-auto-test-batch-001";
const galleryId = "be172712-e073-4d06-9587-eec7e6c62a84";

function sequenceProject() {
  const project = createProject();
  const baseFrameIndex = project.frames.length;
  for (let index = 0; index < 24; index++) {
    const frame = createFrame();
    frame.layers[0].name = "ZERO-AUTO:" + batchId + ":" + String(index).padStart(2, "0");
    project.frames.push(frame);
  }
  project.animeAutoSequence = {
    format: "zero-studio-anime-auto-sequence",
    version: 1,
    batchId,
    baseFrameIndex,
    fps: 24,
    durationSeconds: 1,
    totalFrames: 24,
    action: "A natural side-view walk",
    characterReferenceGalleryId: galleryId,
    status: "paused"
  };
  return project;
}

test("automatic anime sequence state survives native project normalization", () => {
  const normalized = normalizeProject(sequenceProject());
  assert.equal(normalized.animeAutoSequence.batchId, batchId);
  assert.equal(normalized.animeAutoSequence.status, "paused");
  assert.equal(normalized.frames.length, 25);
});

test("automatic sequence marker mismatch rejects corrupted project metadata", () => {
  const project = sequenceProject();
  project.frames[10].layers[0].name = "ordinary layer";
  assert.throws(() => normalizeProject(project), /marker.*missing/i);
});

test("automatic drawing review metadata requires a unique transparent PNG record", () => {
  const project = sequenceProject();
  const frame = project.frames[1];
  frame.layers.push({
    ...frame.layers[0],
    id: "layer-auto-test",
    name: "Generated Anime Drawing",
    type: "raster",
    dataUrl: "data:image/png;base64,aGVsbG8=",
    mimeType: "image/png",
    width: 1280,
    height: 720
  });
  frame.animeAutoDrawing = {
    format: "zero-studio-auto-drawing-frame",
    version: 1,
    batchId,
    frameIndex: 0,
    assetId: "anime-auto-asset-001",
    contentHash: "a".repeat(64),
    sourceSignature: "b".repeat(64),
    mimeType: "image/png",
    width: 1280,
    height: 720,
    alpha: true,
    review: { status: "pending", identity: false, anatomy: false, lineQuality: false, timing: false, note: "" }
  };
  const normalized = normalizeProject(project);
  assert.equal(normalized.frames[1].animeAutoDrawing.review.status, "pending");
  project.frames[1].animeAutoDrawing.contentHash = "invalid";
  assert.throws(() => normalizeProject(project), /audit.*invalid|not valid/i);
});
