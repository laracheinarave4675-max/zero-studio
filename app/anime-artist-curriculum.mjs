const RIGHTS_BASES = Object.freeze(["user-owned", "user-authorized", "public-domain", "open-license", "commercial-license"]);
const PURPOSES = Object.freeze(["study", "training", "commercial-production"]);
const fail = message => { throw new Error(message); };
const clone = value => JSON.parse(JSON.stringify(value));

export const ANIME_ARTIST_SKILL_CATALOG = Object.freeze([
  { id:"gesture-silhouette", domain:"construction", level:1, prerequisites:[], lessons:["line of action","gesture rhythm","outer silhouette","negative spaces"], exercises:["draw 5 gesture thumbnails","compare silhouette readability at thumbnail size"], metrics:["silhouette-closure","negative-space-ratio","pose-balance"] },
  { id:"head-and-face", domain:"anatomy", level:1, prerequisites:["gesture-silhouette"], lessons:["head masses","facial centerline","eye line","jaw and cheek planes"], exercises:["construct front and three-quarter heads","measure eye, nose, mouth and chin landmarks"], metrics:["landmark-deviation","head-proportion-error","view-consistency"] },
  { id:"anime-eyes-expressions", domain:"face-design", level:1, prerequisites:["head-and-face"], lessons:["eye construction","eyelid thickness","iris and pupil","eyebrow language","expression shapes"], exercises:["draw six expressions on one model sheet","keep eye spacing stable across expressions"], metrics:["eye-spacing-drift","expression-readability","identity-consistency"] },
  { id:"hair-masses", domain:"hair", level:2, prerequisites:["head-and-face"], lessons:["large hair masses","clump grouping","strand direction","overlap order","highlight ribbons"], exercises:["build hair from 3–7 readable masses","draw fringe and side locks from front and profile"], metrics:["mass-readability","strand-flow","silhouette-closure","fill-leakage"] },
  { id:"body-anatomy", domain:"anatomy", level:2, prerequisites:["gesture-silhouette"], lessons:["torso volumes","shoulder and pelvis axes","limb proportions","joints","center of mass"], exercises:["construct standing, walking and reaching poses","check limb lengths and balance"], metrics:["landmark-deviation","limb-ratio-error","pose-balance"] },
  { id:"hands-and-feet", domain:"anatomy", level:3, prerequisites:["body-anatomy"], lessons:["palm block","finger grouping","thumb opposition","foot wedge","contact and weight"], exercises:["draw hand rotations and grip poses","draw planted and passing feet"], metrics:["digit-count","joint-alignment","contact-consistency"] },
  { id:"costume-and-folds", domain:"materials", level:2, prerequisites:["body-anatomy"], lessons:["garment construction","seams and hems","fold tension points","fold families","layer overlap"], exercises:["draw one costume in neutral and action poses","track fold flow from shoulder, elbow, waist and knee"], metrics:["fold-flow","costume-landmark-drift","overlap-clarity"] },
  { id:"perspective-and-camera", domain:"spatial-design", level:2, prerequisites:["gesture-silhouette"], lessons:["horizon and vanishing points","foreshortening","camera distance","three-quarter forms"], exercises:["draw one subject in front, three-quarter and side views","compare near/far limb scale"], metrics:["perspective-consistency","foreshortening-ratio"] },
  { id:"anime-inking", domain:"line-art", level:2, prerequisites:["head-and-face"], lessons:["outer vs inner line weight","pressure taper","curve stability","line joins","overlap priority"], exercises:["ink face, hair and costume with varied line hierarchy","clean a rough sketch without losing its gesture"], metrics:["curve-smoothness","pressure-hierarchy","corner-artifacts","line-continuity"] },
  { id:"flat-color-groups", domain:"color", level:2, prerequisites:["hair-masses","costume-and-folds"], lessons:["semantic color regions","closed boundaries","palette families","local color","edge cleanup"], exercises:["flat-color one character using separate regions","audit color leakage around every region"], metrics:["region-coverage","outside-leakage","palette-deviation","unpainted-holes"] },
  { id:"cel-shadows-and-light", domain:"color", level:3, prerequisites:["flat-color-groups"], lessons:["light direction","form shadow","cast shadow","shadow grouping","edge hardness"], exercises:["shade one character with one key light","make shadow shapes read at thumbnail size"], metrics:["light-direction-consistency","shadow-region-closure","value-separation"] },
  { id:"highlights-and-materials", domain:"rendering", level:3, prerequisites:["cel-shadows-and-light"], lessons:["hair highlights","skin accents","fabric response","metal and glass accents","specular restraint"], exercises:["render hair, cloth and metal with distinct highlight behavior"], metrics:["material-separation","highlight-placement","palette-control"] },
  { id:"model-sheet-identity", domain:"continuity", level:3, prerequisites:["anime-eyes-expressions","hair-masses","costume-and-folds"], lessons:["canonical proportions","front/side/back turnaround","palette swatches","costume landmarks","expression range"], exercises:["create a model sheet from one approved character","draw the same character in 3 views without redesign"], metrics:["landmark-deviation","palette-deviation","design-drift"] },
  { id:"shot-composition", domain:"cinematography", level:3, prerequisites:["perspective-and-camera"], lessons:["shot scale","screen direction","staging","focal hierarchy","background integration"], exercises:["stage the same action as wide, medium and close-up shots"], metrics:["focal-readability","screen-direction","depth-separation"] },
  { id:"animation-drawing-continuity", domain:"animation", level:4, prerequisites:["model-sheet-identity","body-anatomy","anime-inking"], lessons:["key poses","timing and spacing","arcs","overlap and follow-through","volume consistency"], exercises:["draw a short action as independent drawings","audit identity and anatomy across the sequence"], metrics:["frame-identity-drift","volume-jitter","arc-consistency","unique-drawing-count"] }
]);

const SKILLS = new Map(ANIME_ARTIST_SKILL_CATALOG.map(skill => [skill.id, skill]));

/** Return the structured anime craft curriculum; no external model is needed to read it. */
export function getAnimeArtistCurriculum() {
  return clone(ANIME_ARTIST_SKILL_CATALOG);
}

/**
 * Validate provenance and declared permissions before a reference enters the
 * study/training/production library. This validates declarations; it is not
 * a legal determination that an external license has been interpreted right.
 */
export function validateAnimeReferenceCard(input, purpose = "study") {
  if (!input || typeof input !== "object" || Array.isArray(input)) fail("An anime reference card is required.");
  if (!PURPOSES.includes(purpose)) fail("Unsupported anime reference purpose.");
  const id = String(input.id ?? "").trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,119}$/.test(id)) fail("A reference needs a stable ID.");
  const title = String(input.title ?? "").trim().slice(0, 160);
  const creator = String(input.creator ?? "").trim().slice(0, 160);
  const source = String(input.source ?? "").trim().slice(0, 500);
  const license = String(input.license ?? "").trim().slice(0, 160);
  const rightsBasis = String(input.rightsBasis ?? "");
  if (!title || !creator || !source || !license) fail("Reference title, creator, source and license/provenance are required.");
  if (!RIGHTS_BASES.includes(rightsBasis)) fail("The reference rights basis is not recognized.");
  if (rightsBasis === "user-authorized" && input.authorizationConfirmed !== true) fail("User authorization must be explicitly confirmed.");
  if (rightsBasis === "open-license" && !input.licenseTermsReviewed) fail("Open-license terms must be reviewed before use.");
  if (purpose === "training" && input.trainingAllowed !== true) fail("This reference is not cleared for model/tool training.");
  if (purpose === "commercial-production" && input.commercialUseAllowed !== true) fail("This reference is not cleared for commercial production.");
  if (input.redistributionAllowed !== true && purpose === "study" && input.copyIntoPublicDataset === true) {
    fail("This reference cannot be copied into a redistributed dataset.");
  }
  const tags = Array.isArray(input.tags) ? [...new Set(input.tags.map(tag => String(tag).trim().slice(0, 60)).filter(Boolean))].slice(0, 40) : [];
  return {
    id, title, creator, source, license, rightsBasis,
    authorizationConfirmed: input.authorizationConfirmed === true,
    licenseTermsReviewed: input.licenseTermsReviewed === true,
    trainingAllowed: input.trainingAllowed === true,
    commercialUseAllowed: input.commercialUseAllowed === true,
    redistributionAllowed: input.redistributionAllowed === true,
    tags,
    purpose,
    reviewedAt: String(input.reviewedAt ?? "").slice(0, 40)
  };
}

/** Create a measurable drawing practice task from a known skill and permitted reference. */
export function createAnimePracticeTask({ skillId, reference, purpose = "study", focus = "" } = {}) {
  const skill = SKILLS.get(String(skillId ?? ""));
  if (!skill) fail("Unknown anime drawing skill.");
  const safeReference = validateAnimeReferenceCard(reference, purpose);
  return {
    id: "practice-" + skill.id + "-" + safeReference.id,
    skillId: skill.id,
    domain: skill.domain,
    level: skill.level,
    referenceId: safeReference.id,
    purpose,
    focus: String(focus ?? "").trim().slice(0, 240),
    prerequisites: [...skill.prerequisites],
    studyTopics: [...skill.lessons],
    exercises: [...skill.exercises],
    evaluationMetrics: [...skill.metrics],
    outputRule: "native-raster-brush-operations-only",
    finalImageGenerationAllowed: false,
    status: "not-started"
  };
}
