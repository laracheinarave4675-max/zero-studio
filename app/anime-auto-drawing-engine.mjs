// ZERO STUDIO — automatic 24-drawing anime walk generator.
// This module creates full-redraw image requests; it never converts a rig,
// skeleton, SVG, or warped reference image into final artwork.

export const ANIME_AUTO_DRAWING_FPS = 24;
export const ANIME_AUTO_DRAWING_FRAMES = 24;
export const ANIME_AUTO_KEY_FRAMES = Object.freeze([0, 6, 12, 18, 23]);

const WALK_POSES = Object.freeze([
  ["contact", "Start on the side-view contact pose: the leading sandal reaches the ground, the rear heel is lifting, the pelvis is over the supporting leg, and the torso remains upright."],
  ["weight-shift", "Shift the body weight onto the forward supporting sandal; move the opposite arm forward and the other arm back in a small natural counter-swing."],
  ["toe-off", "The trailing sandal rolls onto its toes and begins push-off; the supporting knee absorbs the weight and the long hair lags slightly behind."],
  ["push-off", "Push the trailing foot away from the floor; bend that knee, keep the leading leg stable, and let the kimono hem react to the acceleration."],
  ["early-swing", "The rear leg swings forward under the kimono; its sandal is clearly airborne while the planted leg supports the pelvis."],
  ["pre-passing", "The swinging knee advances toward the supporting leg; keep the two sandals separated and show a subtle opposite arm swing."],
  ["passing", "Passing pose: the lifted foot passes the supporting ankle, the pelvis moves above the support foot, and the sleeves and hair follow the torso."],
  ["late-passing", "Continue the lifted foot forward beyond the supporting ankle; maintain an upright head and readable side silhouette."],
  ["forward-swing", "The moving thigh travels forward and the lower leg begins to open; the supporting sandal remains planted without sliding."],
  ["leg-extension", "Extend the swinging lower leg forward with the sandal angled slightly upward; shift the torso smoothly toward the next contact."],
  ["contact-preparation", "Prepare for landing: the forward sandal approaches the ground, the knee softens, and the kimono skirt and sleeves settle around the motion."],
  ["heel-approach", "Bring the forward heel just above the ground; keep the rear foot behind and preserve the side-view silhouette."],
  ["new-contact", "The forward sandal makes a clear first contact with the floor; transfer the body's weight without changing character proportions."],
  ["weight-transfer", "Transfer weight onto the newly planted foot; the rear heel rises and the arms counter-swing naturally."],
  ["rear-toe-off", "The back foot rolls onto its toes and begins to release; keep the planted sandal fixed to the floor."],
  ["rear-push", "The trailing leg pushes off and bends behind the body; show cloth folds changing with the leg movement."],
  ["body-pass", "The pelvis passes over the forward supporting foot; the trailing leg moves beneath the kimono and the head stays calm."],
  ["recovery", "Recover from the push-off: the trailing sandal leaves the floor and the hair tips and loose sleeves continue their follow-through."],
  ["second-passing", "Second passing pose: the lifted foot moves beside the supporting ankle, with a clear gap between the sandals."],
  ["second-forward-swing", "Swing the lifted leg forward again; counter-swing both arms and maintain the same face, hairline, and costume design."],
  ["second-leg-extension", "Extend the moving lower leg toward the next contact; keep the torso balanced and the obi level."],
  ["second-contact-preparation", "Approach the next landing with the forward sandal just above floor level; preserve the original side camera."],
  ["return-contact", "The forward sandal is almost touching down in a pose that leads naturally back to the initial contact."],
  ["cycle-close", "Close the one-second walk cycle in a readable side-view contact pose close to the opening silhouette, with a distinct newly drawn image."]
]);

const clean = (value, max = 1800) => String(value ?? "").trim().replace(/[\u0000-\u001f]/g, "").slice(0, max);
const fail = message => { throw new Error(message); };
const isImageDataUrl = value => typeof value === "string" &&
  /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(value) &&
  value.length <= 720 * 1024;

export function createAnimeAutoDrawingPlan({ action, characterName = "the approved kimono character" } = {}) {
  const brief = clean(action || "A restrained, natural one-second side-view walk with readable weight transfer, fixed foot contacts, gentle arm counter-swing, and controlled hair and kimono follow-through.");
  const name = clean(characterName, 100) || "the approved character";
  if (!brief) fail("A motion description is required.");
  return {
    format: "zero-studio-anime-auto-drawing-plan",
    version: 1,
    fps: ANIME_AUTO_DRAWING_FPS,
    durationSeconds: 1,
    totalFrames: ANIME_AUTO_DRAWING_FRAMES,
    targetUniqueDrawingsPerSecond: ANIME_AUTO_DRAWING_FPS,
    characterName: name,
    action: brief,
    camera: { view: "side", locked: true },
    keyDrawingFrames: [...ANIME_AUTO_KEY_FRAMES],
    frames: WALK_POSES.map(([phase, pose], frameIndex) => ({
      frameIndex,
      frameNumber: frameIndex + 1,
      timeSeconds: Number((frameIndex / ANIME_AUTO_DRAWING_FPS).toFixed(5)),
      phase,
      pose,
      kind: ANIME_AUTO_KEY_FRAMES.includes(frameIndex) ? "key-drawing" : "inbetween-drawing",
      exposureFrames: 1,
      requirement: "independent-full-character-redraw"
    }))
  };
}

export function createAnimeAutoDrawingOrder(plan) {
  validatePlan(plan);
  const keys = [...plan.keyDrawingFrames];
  const intermediates = plan.frames.map(item => item.frameIndex).filter(index => !keys.includes(index));
  return [...keys, ...intermediates];
}

function validatePlan(plan) {
  if (!plan || plan.format !== "zero-studio-anime-auto-drawing-plan" ||
      plan.version !== 1 || plan.fps !== 24 || plan.totalFrames !== 24 ||
      plan.durationSeconds !== 1 || !Array.isArray(plan.frames) || plan.frames.length !== 24 ||
      !Array.isArray(plan.keyDrawingFrames) || plan.keyDrawingFrames.join(",") !== "0,6,12,18,23") {
    fail("The automatic animation plan is invalid.");
  }
}

function lookupFrame(generatedFrames, index) {
  const item = generatedFrames instanceof Map ? generatedFrames.get(index) : generatedFrames?.[index];
  return item?.dataUrl || item || null;
}

/**
 * Build a single FLUX.2 full-redraw request. The model sheet is always the
 * identity reference. Key/in-between drawings are pose-only continuity refs.
 */
export function createAnimeAutoDrawingRequest(plan, frameIndex, {
  identityReference,
  generatedFrames = {}
} = {}) {
  validatePlan(plan);
  if (!Number.isInteger(frameIndex) || frameIndex < 0 || frameIndex >= 24) {
    fail("The requested frame index must be between 0 and 23.");
  }
  if (!isImageDataUrl(identityReference)) {
    fail("A compressed PNG, JPEG, or WebP identity reference is required.");
  }

  const frame = plan.frames[frameIndex];
  const refs = [identityReference];
  const roles = ["identity"];
  const labels = ["approved character model sheet"];

  const add = (index, role, label) => {
    const dataUrl = lookupFrame(generatedFrames, index);
    if (!isImageDataUrl(dataUrl)) fail("The required pose reference for frame " + (index + 1) + " is missing or too large.");
    if (refs.length >= 4 || refs.includes(dataUrl)) return;
    refs.push(dataUrl);
    roles.push(role);
    labels.push(label);
  };

  if (frame.kind === "key-drawing") {
    const priorKeys = plan.keyDrawingFrames.filter(index => index < frameIndex);
    const previousKey = priorKeys.at(-1);
    if (previousKey !== undefined) add(previousKey, "pose", "previous approved/generated key pose");
    if (frameIndex === 23) add(0, "pose", "opening pose for cycle closure");
  } else {
    const fromKey = [...plan.keyDrawingFrames].reverse().find(index => index < frameIndex);
    const toKey = plan.keyDrawingFrames.find(index => index > frameIndex);
    if (fromKey === undefined || toKey === undefined) fail("An in-between frame must be bracketed by two generated key drawings.");
    add(fromKey, "pose", "preceding key drawing");
    add(toKey, "pose", "following key drawing");
    if (frameIndex > 0) {
      const previousFrame = lookupFrame(generatedFrames, frameIndex - 1);
      if (previousFrame && !refs.includes(previousFrame)) add(frameIndex - 1, "continuity", "immediately preceding drawing for motion continuity");
    }
  }

  const roleNotes = labels.map((label, index) => "Image " + index + " (" + roles[index] + "): " + label + ".").join(" ");
  const prompt = [
    "Create exactly ONE new, complete, full-body Japanese 2D anime drawing for animation frame " +
      frame.frameNumber + " of 24 at " + frame.timeSeconds.toFixed(4) + " seconds.",
    "This is a single independent redraw, not a video, contact sheet, multi-panel layout, sprite sheet, collage, crop, puppet, mesh warp, or transformed copy.",
    "Reference roles: " + roleNotes,
    "Image 0 is the sole character-design authority. Preserve the exact same face, eyes, long black hair and hairline, ivory kimono, rose-pink sleeves and hem, obi, floral motifs, sandals, palette, and proportions.",
    "Pose-reference images control pose and movement only. Do not copy their exact drawing, combine frames, or reproduce the model-sheet layout.",
    "Camera: locked full-body side view. Keep the entire character and both sandals inside the frame.",
    "Action: " + plan.action,
    "Frame pose: " + frame.pose,
    "Draw all visible anatomy, hands, hair strands, sleeves, kimono folds and sandals anew with polished 2D anime line art, confident clean contours, and restrained cel shading.",
    "Use a perfectly flat chroma-blue background (#00AEEF), no gradient, floor line, cast shadow, props, text, or scenery. The character must be separated clearly from the background for transparent cutout.",
    "The image must show one character in one pose only. Produce a visibly different drawing for every frame."
  ].join(" ");

  if (prompt.length > 1800) fail("The generated drawing prompt exceeds the image service limit.");
  return {
    endpoint: "/api/images",
    method: "POST",
    model: "flux-2-klein-4b",
    aspectRatio: "16:9",
    prompt,
    references: refs,
    referenceRoles: roles,
    referenceLabels: labels,
    frameIndex,
    frameNumber: frame.frameNumber,
    frameKind: frame.kind,
    phase: frame.phase
  };
}

export function validateAnimeAutoDrawingPlan(plan) {
  validatePlan(plan);
  return JSON.parse(JSON.stringify(plan));
}

/**
 * Removes the deliberately flat chroma-blue background from a generated
 * raster drawing. It changes only alpha/edge spill; it never warps or redraws
 * the character. Returns a fresh clamped pixel buffer plus QA counts.
 */
export function removeAnimeChromaKeyFromRgba(source, {
  key = [0, 174, 239],
  transparentDistance = 28,
  opaqueDistance = 164
} = {}) {
  if (!source || typeof source.length !== "number" || source.length < 4 || source.length % 4 !== 0) {
    fail("A valid RGBA pixel buffer is required for background removal.");
  }
  if (!Array.isArray(key) || key.length !== 3 || key.some(value => !Number.isFinite(value) || value < 0 || value > 255) ||
      !Number.isFinite(transparentDistance) || !Number.isFinite(opaqueDistance) ||
      transparentDistance < 0 || opaqueDistance <= transparentDistance) {
    fail("Chroma-key parameters are invalid.");
  }
  const output = new Uint8ClampedArray(source.length);
  let transparentPixels = 0, opaquePixels = 0, partialPixels = 0;
  const clamp = (number, minimum, maximum) => Math.min(maximum, Math.max(minimum, number));
  const smooth = value => {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  };
  for (let index = 0; index < source.length; index += 4) {
    const red = Number(source[index]), green = Number(source[index + 1]);
    const blue = Number(source[index + 2]), originalAlpha = Number(source[index + 3]);
    if (![red, green, blue, originalAlpha].every(Number.isFinite)) fail("Pixel buffer contains a non-finite value.");
    const distance = Math.hypot(red - key[0], green - key[1], blue - key[2]);
    const coverage = smooth((distance - transparentDistance) / (opaqueDistance - transparentDistance));
    const alpha = Math.round(originalAlpha * coverage);
    output[index + 3] = alpha;
    if (alpha <= 2) {
      output[index] = output[index + 1] = output[index + 2] = 0;
      transparentPixels++;
      continue;
    }
    if (alpha >= 253) {
      output[index] = red; output[index + 1] = green; output[index + 2] = blue;
      opaquePixels++;
      continue;
    }
    partialPixels++;
    const amount = alpha / 255;
    output[index] = clamp((red - key[0] * (1 - amount)) / amount, 0, 255);
    output[index + 1] = clamp((green - key[1] * (1 - amount)) / amount, 0, 255);
    output[index + 2] = clamp((blue - key[2] * (1 - amount)) / amount, 0, 255);
  }
  if (!transparentPixels || opaquePixels + partialPixels === 0) {
    fail("The generated frame did not contain both a removable blue backdrop and visible character pixels.");
  }
  return { data: output, transparentPixels, opaquePixels, partialPixels };
}
