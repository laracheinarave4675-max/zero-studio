// ZERO STUDIO — authored blocking chart for the retrieved kimono model sheet.
// This creates 24 distinct SIDE-VIEW pose guides for an artist to redraw.
// It deliberately does not create, deform, or export final character artwork.
export const KIMONO_WALK_REFERENCE = Object.freeze({
  galleryAssetId: "be172712-e073-4d06-9587-eec7e6c62a84",
  galleryUrl: "https://zero-studio-flux2-preview.9test4675a26.workers.dev/gallery/be172712-e073-4d06-9587-eec7e6c62a84",
  fps: 24,
  durationSeconds: 1,
  view: "side",
  keyDrawingFrames: Object.freeze([0, 6, 12, 18, 23]),
  notes: [
    "Preserve the approved face, long black hair, ivory-and-rose kimono, obi and sandals.",
    "The wide kimono skirt conceals the knees: draw the lower-leg silhouettes and sandal positions clearly beneath the hem.",
    "Do not slide a planted sandal. Keep the planted foot fixed until toe-off.",
    "Every scheduled frame requires a fresh, complete, independently authored drawing."
  ]
});

const clamp = (v, lo = 0.02, hi = 0.98) => Math.max(lo, Math.min(hi, v));
const point = (x, y) => ({ x: Number(clamp(x).toFixed(5)), y: Number(clamp(y).toFixed(5)) });

/**
 * A one-second 24-drawing walk blocking chart. The guides are not artwork.
 * An artist must redraw the whole character for every frame, including hair,
 * sleeves, obi, skirt folds, legs and sandals.
 */
export function createKimonoSideWalkChart() {
  const frames = [];
  for (let frame = 0; frame < 24; frame++) {
    const phase = (frame / 24) * Math.PI * 2;
    const stride = Math.sin(phase);
    const liftL = Math.max(0, Math.sin(phase)) * 0.055;
    const liftR = Math.max(0, -Math.sin(phase)) * 0.055;
    const bob = (1 - Math.cos(phase * 2)) * 0.008;
    const pelvisX = 0.50 + Math.sin(phase) * 0.012;
    const pelvisY = 0.57 + bob;
    const kneeL = point(0.475 + stride * 0.055, 0.735 - liftL * 0.25);
    const kneeR = point(0.525 - stride * 0.055, 0.735 - liftR * 0.25);
    const ankleL = point(0.475 + stride * 0.105, 0.895 - liftL);
    const ankleR = point(0.525 - stride * 0.105, 0.895 - liftR);
    const toeL = point(ankleL.x - 0.035, ankleL.y + 0.018);
    const toeR = point(ankleR.x - 0.035, ankleR.y + 0.018);
    const joints = {
      root: point(pelvisX, pelvisY - 0.025),
      pelvis: point(pelvisX, pelvisY),
      chest: point(0.50 + Math.sin(phase + 0.18) * 0.008, 0.355 + bob * 0.35),
      neck: point(0.50, 0.265 + bob * 0.2),
      head: point(0.50, 0.165 + bob * 0.2),
      shoulderL: point(0.465, 0.365),
      elbowL: point(0.435 + stride * 0.012, 0.475),
      wristL: point(0.425 + stride * 0.02, 0.565),
      shoulderR: point(0.535, 0.365),
      elbowR: point(0.565 - stride * 0.012, 0.475),
      wristR: point(0.575 - stride * 0.02, 0.565),
      hipL: point(0.475, pelvisY + 0.012),
      kneeL,
      ankleL,
      toeL,
      hipR: point(0.525, pelvisY + 0.012),
      kneeR,
      ankleR,
      toeR
    };
    const plantedLeft = Math.sin(phase) <= 0;
    frames.push({
      frame,
      timeSeconds: Number((frame / 24).toFixed(5)),
      kind: KIMONO_WALK_REFERENCE.keyDrawingFrames.includes(frame) ? "key-drawing-guide" : "inbetween-drawing-guide",
      phase: frame < 3 || frame > 20 ? "contact" : frame < 9 ? "passing" : frame < 15 ? "contact" : "recovery",
      view: "side",
      contacts: {
        footL: plantedLeft ? "planted" : (liftL > 0.01 ? "airborne" : "swing"),
        footR: plantedLeft ? (liftR > 0.01 ? "airborne" : "swing") : "planted"
      },
      joints,
      drawingRequirement: "complete-independent-character-redraw",
      finalArtwork: null
    });
  }
  return {
    format: "zero-studio-kimono-side-walk-chart",
    version: 1,
    reference: KIMONO_WALK_REFERENCE,
    fps: 24,
    totalFrames: 24,
    uniqueFinalDrawings: 0,
    artistRedrawsRequired: 24,
    frames
  };
}
