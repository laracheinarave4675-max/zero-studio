import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createProject, normalizeProject, appendOperation, frameSvg } from "../app/engine.mjs";
import { createNoriModel } from "../app/character-model.mjs";
import { saveCharacterToLibrary } from "../app/character-library.mjs";
import { captureFrameHistory, applyFrameHistory } from "../app/frame-history.mjs";
import {
  ANIME_ANATOMY_FPS, ANIME_ANATOMY_JOINTS, createAnimeCharacterDNA,
  createAnimeAnatomyPlan, sampleAnimeAnatomyGuide, buildAnimeAnatomyConstruction,
  createAnimeFrameDrawingTasks, createAnimeAnatomySequence, attachAnimeFrameDrawing,
  reviewAnimeFrame, auditAnimeAnatomySequence, renderAnimeAnatomyGuide, validateAnimeFrameRasterAsset
} from "../app/anime-anatomy-engine.mjs";

function guide(shift = 0, contacts = { footL: "planted", footR: "swing" }) {
  const base = {
    root: [.50,.52], pelvis: [.50,.58], chest: [.50,.36], neck: [.50,.26], head: [.50,.16],
    shoulderL: [.43,.37], elbowL: [.35,.47], wristL: [.30,.56],
    shoulderR: [.57,.37], elbowR: [.65,.47], wristR: [.70,.56],
    hipL: [.46,.59], kneeL: [.44,.75], ankleL: [.43,.91], toeL: [.38,.93],
    hipR: [.54,.59], kneeR: [.56,.75], ankleR: [.57,.91], toeR: [.62,.93]
  };
  return {
    view: "side", contacts,
    joints: Object.fromEntries(Object.entries(base).map(([name,[x,y]]) => [
      name, { x: Math.max(.02,Math.min(.98,x+shift)), y }
    ]))
  };
}

function createFixture() {
  const first = guide(0);
  const dna = createAnimeCharacterDNA({
    characterAssetId: "character-approved-01",
    characterBibleId: "character-bible-01",
    modelSheetAssetIds: ["model-front-01","model-side-01"],
    anchorGuide: first,
    notes: "Canonical proportions measured from the approved side-view drawing."
  });
  const plan = createAnimeAnatomyPlan({
    shotId: "walk-proof-01",
    action: "A restrained side-view walk with weight transfer and planted-foot contact.",
    characterDNA: dna,
    backgroundAssetId: "background-approved-01",
    durationSeconds: 1,
    fps: 24,
    keyDrawings: [
      { id:"contact-start", frame:0, drawingAssetId:"key-drawing-00", approved:true, phase:"contact", guide:first, easeToNext:"ease-in-out" },
      { id:"passing", frame:12, drawingAssetId:"key-drawing-12", approved:true, phase:"passing", guide:guide(.02,{footL:"swing",footR:"planted"}), easeToNext:"ease-out" },
      { id:"recovery", frame:23, drawingAssetId:"key-drawing-23", approved:true, phase:"recovery", guide:guide(0,{footL:"swing",footR:"planted"}) }
    ],
    motionNotes: "Keep the camera locked; preserve hair and costume details in every drawing."
  });
  return { dna, plan };
}

const raster = index => ({
  assetId: "artist-frame-" + index,
  contentHash: (index + 1).toString(16).padStart(16, "0"),
  mimeType: "image/png", width: 1920, height: 1080, alpha: true,
  dataUrl: "data:image/png;base64,AAAA"
});
const passedReview = { identity:true, anatomy:true, lineQuality:true, timing:true };

test("character DNA locks one approved identity and measured anatomical proportions", () => {
  const { dna } = createFixture();
  assert.equal(dna.format, "zero-studio-character-dna");
  assert.equal(dna.characterAssetId, "character-approved-01");
  assert.ok(Math.abs(dna.boneLengths.upperArmL - Math.hypot(.08*1920/1080,.10)) < 1e-6);
  assert.ok(Math.abs(dna.boneLengths.shinR - Math.hypot(.01*1920/1080,.16)) < 1e-6);
  assert.deepEqual(dna.modelSheetAssetIds, ["model-front-01","model-side-01"]);
});


test("Character DNA survives native ZERO project save/open normalization", () => {
  const { dna } = createFixture();
  const project = createProject("Anatomy proof");
  const storedDNA = { ...dna, name: "Nori", sourceFrameId: project.frames[0].id, sourceFrameIndex:0, sourceSignature:"a".repeat(64) };
  project.animeCharacterDNA.push(storedDNA);
  const reopened = normalizeProject(JSON.parse(JSON.stringify(project)));
  assert.equal(reopened.animeCharacterDNA.length, 1);
  assert.equal(reopened.animeCharacterDNA[0].characterAssetId, dna.characterAssetId);
  assert.equal(reopened.animeCharacterDNA[0].sourceFrameId, project.frames[0].id);
  assert.equal(reopened.animeCharacterDNA[0].sourceSignature, "a".repeat(64));
  assert.throws(() => normalizeProject({
    ...project, animeCharacterDNA:[{...storedDNA,sourceSignature:undefined}]
  }), /مرجع الرسم الأصلي/);
  assert.throws(() => normalizeProject({
    ...project, animeCharacterDNA:[{...storedDNA,sourceSignature:"bad"}]
  }), /مرجع الرسم الأصلي/);
  assert.throws(() => normalizeProject({
    ...project, animeCharacterDNA:[{...storedDNA,sourceFrameIndex:-1}]
  }), /موضع الرسم الأصلي/);
  assert.throws(() => normalizeProject({
    ...project, animeCharacterDNA: [storedDNA, storedDNA]
  }), /مكررة/);
  assert.throws(() => normalizeProject({
    ...project, animeCharacterDNA: [{ ...storedDNA, boneLengths: {} }]
  }), /قياسات الشخصية الثابتة/);
});



function finalRasterRecord(index=0, patch={}) {
  return {
    assetId: "final-frame-" + index,
    contentHash: (index+1).toString(16).padStart(64,"0"),
    sourceSignature: (index+101).toString(16).padStart(64,"0"),
    mimeType: "image/png", width:1920, height:1080, alpha:true,
    dataUrl:"data:image/png;base64,AAAA",
    review:{status:"approved",identity:true,anatomy:true,lineQuality:true,timing:true,note:"Reviewed"},
    ...patch
  };
}

test("independent transparent final raster drawings are validated and persisted in native project files", () => {
  const project=createProject("Raster frame proof");
  appendOperation(project.frames[0].layers[0],"stroke",{d:"M 10 10 L 60 60",stroke:"#172033",width:5,fill:"none"});
  const beforeSvg=frameSvg(project.frames[0],"stable-signature",[]);
  project.frames[0].animeRaster=finalRasterRecord(0);
  const reopened=normalizeProject(JSON.parse(JSON.stringify(project)));
  assert.equal(frameSvg(reopened.frames[0],"stable-signature",[]),beforeSvg,"frame SVG source signature must survive native .zero reopen");
  assert.equal(reopened.frames[0].animeRaster.assetId,"final-frame-0");
  assert.equal(reopened.frames[0].animeRaster.review.status,"approved");
  assert.equal(reopened.frames[0].animeRaster.width,1920);
  assert.equal(reopened.frames[0].animeRaster.alpha,true);
  assert.throws(()=>validateAnimeFrameRasterAsset(finalRasterRecord(0,{sourceSignature:"bad"})),/بصمتها غير صالحة/);
  assert.throws(()=>validateAnimeFrameRasterAsset(finalRasterRecord(0,{alpha:false})),/بصمتها غير صالحة/);
  assert.throws(()=>validateAnimeFrameRasterAsset(finalRasterRecord(0,{dataUrl:"data:image/png;base64,%%%"})),/بيانات PNG\/WebP/);
  assert.throws(()=>validateAnimeFrameRasterAsset(finalRasterRecord(0,{review:{status:"approved",identity:true,anatomy:true,lineQuality:false,timing:true}})),/لا يمكن اعتماد رسمة/);
  assert.throws(()=>normalizeProject({
    ...project,frames:[project.frames[0],{...createProject().frames[0],animeRaster:finalRasterRecord(0)}]
  }),/مكررة بين إطارات المشروع/);
});




test("large-project undo metadata preserves anatomy identity records", () => {
  const { dna } = createFixture();
  const project = createProject("Large timeline");
  project.animeCharacterDNA.push({ ...dna, name:"Nori" });
  const before = captureFrameHistory(project, 0, { includeCharacterLibrary:true });
  project.animeCharacterDNA = [];
  applyFrameHistory(project, before);
  assert.equal(project.animeCharacterDNA.length, 1);
  assert.equal(project.animeCharacterDNA[0].name, "Nori");
});


test("mobile Character DNA calibration panel is connected to the drawing project", () => {
  const html = readFileSync(new URL("../app/index.html", import.meta.url), "utf8");
  const app = readFileSync(new URL("../app/app.js", import.meta.url), "utf8");
  assert.doesNotMatch(app, /async\s+async\s+function/, "motion-plan restore must remain valid JavaScript");
  assert.match(app, /async function saveAnimeAnatomyDNA\(\)/, "DNA save handler must be async because key-drawing save is awaited");
  assert.match(app, /dna\.sourceSignature=sourceSignature/);
  assert.match(app, /async function verifyAnimeCharacterAnchor\(dna\)/);
  assert.match(app, /await verifyAnimeCharacterAnchor\(dna\)/);
  assert.match(app, /protectedDNA=\(project\.animeCharacterDNA\|\|\[\]\)\.filter/);
  assert.match(app, /keyDrawings\|\|\[\]\)\.some\(key=>key\.drawingAssetId===frame\(\)\.id\)/);
  assert.match(app, /لا يمكن حذف هذا الإطار لأنه الرسم المرجعي الأصلي/);
  assert.match(readFileSync(new URL("../app/engine.mjs", import.meta.url), "utf8"), /الرسم الأصلي المرتبط بهوية الشخصية غير موجود/);
  assert.match(app, /f\.animeRaster\?\.dataUrl\?\.length\|\|0/);
  assert.match(app, /const compactHistory=!forceFull&&\(project\.frames\.length>600\|\|rasterBytes>2\*1024\*1024\)/);
  for (const id of [
    "animeAnatomyCanvas", "animeAnatomySource", "animeAnatomyMarkers", "animeAnatomyLibrarySelect",
    "startAnimeAnatomyBtn", "saveAnimeAnatomyDNABtn", "animeAnatomyDNASelect",
    "startAnimeKeyDrawingBtn", "buildAnimeMotionPlanBtn", "prepareAnime24FrameBtn",
    "animeAnatomyConstructionLayer", "animeAnatomyGuideToggle",
    "saveAnimeRasterFrameBtn", "auditAnimeRasterFramesBtn",
    "exportAnimeRasterSequenceBtn", "animeReviewIdentity", "animeReviewAnatomy",
    "animeReviewLineQuality", "animeReviewTiming"
  ]) assert.ok(html.includes('id="' + id + '"'), "missing UI element: " + id);
  assert.match(app, /function beginAnimeAnatomyCalibration\(\)/);
  assert.match(app, /function saveAnimeAnatomyDNA\(\)/);
  assert.match(app, /createAnimeCharacterDNA\(/);
  assert.match(app, /characterModelAssetId:linkedAsset\.id/);
  assert.match(app, /dna\.characterModelAssetId===id/);
  assert.match(app, /لا يمكن حذف هذا النموذج لأنه مرتبط بهوية تشريحية محفوظة/);
  assert.match(app, /linked character-library asset/);
  assert.match(app, /animeAnatomyLibrarySelect/);
  assert.match(app, /renderAnimeAnatomyDNASelect\(\)/);
  assert.match(app, /project\.animeCharacterDNA\.push\(dna\)/);
  assert.match(app, /async function saveCurrentAnimeRasterFrame\(\)/);
  assert.match(app, /async function buildStoredAnimeRasterSequence\(\)/);
  assert.match(app, /async function auditStoredAnimeRasterFrames\(exportZip=false\)/);
  assert.match(app, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(app, /if\(sourceSignature!==stored\.sourceSignature\)/);
});


test("anatomical DNA keeps a validated character-library model link across project reopen", () => {
  const { dna } = createFixture();
  const project = createProject("Linked anime character");
  const libraryAsset = saveCharacterToLibrary(project, createNoriModel("happy", "side", "walk"), "Nori");
  const linkedDNA = { ...dna, characterModelAssetId: libraryAsset.id,
    sourceFrameId: project.frames[0].id, sourceFrameIndex: 0, sourceSignature: "b".repeat(64) };
  project.animeCharacterDNA.push(linkedDNA);
  const reopened = normalizeProject(JSON.parse(JSON.stringify(project)));
  assert.equal(reopened.animeCharacterDNA[0].characterModelAssetId, libraryAsset.id);
  assert.throws(() => normalizeProject({
    ...project, animeCharacterDNA: [{ ...linkedDNA, characterModelAssetId: "missing-character-model" }]
  }), /نموذج الشخصية المرتبط بالهوية التشريحية غير موجود/);
});

test("DNA rejects missing joints, invalid proportions and identity-less characters", () => {
  const base = guide();
  assert.throws(() => createAnimeCharacterDNA({ anchorGuide:base }), /أصل الشخصية بكتاب هويتها/);
  const invalid = guide();
  delete invalid.joints.wristR;
  assert.throws(() => createAnimeCharacterDNA({
    characterAssetId:"a", characterBibleId:"b", anchorGuide:invalid
  }), /wristR/);
  assert.throws(() => createAnimeCharacterDNA({
    characterAssetId:"a", characterBibleId:"b", anchorGuide:guide(), anatomyVersion:2
  }), /إصدار البنية/);
});

test("the one-second plan requires full approved key drawings and preserves 24 unique timepoints", () => {
  const { plan } = createFixture();
  assert.equal(ANIME_ANATOMY_FPS, 24);
  assert.equal(plan.totalFrames, 24);
  assert.equal(plan.targetUniqueDrawingsPerSecond, 24);
  assert.equal(plan.characterAssetId, "character-approved-01");
  assert.equal(plan.backgroundAssetId, "background-approved-01");
  assert.throws(() => createAnimeAnatomyPlan({
    ...plan, fps:12, characterDNA:plan.characterDNA
  }), /24/);
  assert.throws(() => createAnimeAnatomyPlan({
    ...plan, keyDrawings:plan.keyDrawings.map((key,i)=>i===1?{...key,approved:false}:key)
  }), /معتمداً من الفنان/);
});

test("anatomical guide interpolates a complete joint set without changing the canonical identity", () => {
  const { plan } = createFixture();
  const sample = sampleAnimeAnatomyGuide(plan, 6);
  assert.equal(sample.source, "anatomy-constrained-construction-guide");
  assert.equal(sample.fromKeyDrawingId, "contact-start");
  assert.equal(sample.toKeyDrawingId, "passing");
  assert.equal(Object.keys(sample.guide.joints).length, ANIME_ANATOMY_JOINTS.length);
  assert.equal(sample.guide.view, "side");
  assert.equal(plan.characterAssetId, "character-approved-01");
  assert.ok(sample.centerOfMass.x > .45 && sample.centerOfMass.x < .60);
});

test("planted foot stays anchored to the last planted contact instead of sliding with the body", () => {
  const { plan } = createFixture();
  const sample = sampleAnimeAnatomyGuide(plan, 6);
  assert.equal(sample.lockedFeet.footL, "contact-start");
  assert.equal(sample.guide.joints.ankleL.x, plan.keyDrawings[0].guide.joints.ankleL.x);
  assert.equal(sample.guide.joints.toeL.x, plan.keyDrawings[0].guide.joints.toeL.x);
  const later = sampleAnimeAnatomyGuide(plan, 18);
  assert.equal(later.lockedFeet.footR, "passing");
});

test("construction model exposes body segments as guide-only measurements, not finished character art", () => {
  const { plan } = createFixture();
  const construction = buildAnimeAnatomyConstruction(plan, 6);
  assert.equal(construction.guideOnly, true);
  assert.equal(construction.characterAssetId, "character-approved-01");
  assert.equal(construction.segments.length, 11);
  assert.ok(construction.segments.every(segment => segment.width > 0));
});

test("all 24 tasks require a complete independent artist redraw, with one-frame exposure", () => {
  const { plan } = createFixture();
  const tasks = createAnimeFrameDrawingTasks(plan);
  assert.equal(tasks.length, 24);
  assert.equal(tasks[0].kind, "key-drawing");
  assert.equal(tasks[6].kind, "artist-inbetween");
  assert.equal(tasks[6].drawingRequirement, "complete-independent-raster-redraw");
  assert.equal(tasks[6].authoringMode, "artist-redraw-from-anatomy-guide");
  assert.ok(tasks.every(task => task.exposureFrames === 1 && task.drawing === null));
});

test("the anatomy canvas renderer emits a temporary guide PNG only", () => {
  const { plan } = createFixture();
  let calls = 0;
  const context = {
    clearRect(){calls++}, beginPath(){calls++}, moveTo(){calls++}, lineTo(){calls++},
    stroke(){calls++}, arc(){calls++}, fill(){calls++}
  };
  const canvas = {
    width:0,height:0,
    getContext(type){assert.equal(type,"2d");return context;},
    toDataURL(type){assert.equal(type,"image/png");return "data:image/png;base64,AAAA";}
  };
  const result = renderAnimeAnatomyGuide(canvas, plan, 6, {width:512,height:640});
  assert.equal(result.guideOnly,true);
  assert.match(result.warning,/يجب رسم الشخصية كاملة/);
  assert.ok(calls > 20);
  assert.throws(() => renderAnimeAnatomyGuide(null, plan, 6), /Canvas غير متاحة/);
});

test("24 final drawings must be unique transparent raster assets and artist-approved", () => {
  const { plan } = createFixture();
  const sequence = createAnimeAnatomySequence(plan);
  for (let i=0;i<24;i++) {
    attachAnimeFrameDrawing(sequence, i, raster(i));
    reviewAnimeFrame(sequence, i, passedReview);
  }
  const audit = auditAnimeAnatomySequence(sequence);
  assert.equal(audit.frameCount,24);
  assert.equal(audit.drawnFrames,24);
  assert.equal(audit.approvedFrames,24);
  assert.equal(audit.uniqueDrawingCount,24);
  assert.equal(audit.uniqueDrawingsPerSecond,24);
  assert.equal(audit.meets24UniqueApprovedDrawingsPerSecond,true);
});

test("duplicate image hashes, non-transparent artwork and unreviewed frames are rejected", () => {
  const { plan } = createFixture();
  const sequence = createAnimeAnatomySequence(plan);
  attachAnimeFrameDrawing(sequence, 0, raster(0));
  assert.throws(() => attachAnimeFrameDrawing(sequence, 1, {...raster(1),contentHash:raster(0).contentHash}), /الرسمة نفسها مرتين/);
  assert.throws(() => attachAnimeFrameDrawing(sequence, 1, {...raster(1),alpha:false}), /قناة شفافية/);
  assert.throws(() => auditAnimeAnatomySequence(sequence), /لم يجتز المراجعة الفنية/);
  reviewAnimeFrame(sequence,0,{identity:true,anatomy:true,lineQuality:false,timing:true});
  const partial = auditAnimeAnatomySequence(sequence,{requireApproved:false});
  assert.equal(partial.rejectedFrames,1);
  assert.equal(partial.meets24UniqueApprovedDrawingsPerSecond,false);
});
