import{validatePath,pathGeometryBounds}from"./engine.mjs";
import{renderEnvironmentScene}from"./environment-art.mjs";
import{renderMeshEnvironment}from"./mesh-scene-renderer.mjs";
export const GEMINI_MODEL="gemini-3.5-flash-lite";
const ALLOWED_MODELS=new Set([GEMINI_MODEL,"gemini-3.1-flash-lite","gemini-3-flash"]);
const endpointFor=model=>{if(!ALLOWED_MODELS.has(model))throw Error("نموذج Gemini غير مدعوم.");return "https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent"};
function parseResponse(payload){
 const text=payload?.candidates?.[0]?.content?.parts?.map(part=>part.text||"").join("").trim();
 if(!text)throw Error("لم يُرجع النموذج اقتراحاً نصياً. قد يكون الطلب محظوراً أو غير مكتمل.");
 try{return JSON.parse(text)}catch{throw Error("رد النموذج ليس JSON صالحاً. أعد صياغة الوصف وحاول مجدداً.")}
}
async function request(apiKey,instruction,fetcher,model=GEMINI_MODEL,settings={}){
 let response,payload,lastError;
 for(let attempt=0;attempt<3;attempt++){
  try{
   response=await fetcher(endpointFor(model),{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},body:JSON.stringify({contents:[{role:"user",parts:[{text:instruction}]}],generationConfig:{responseMimeType:"application/json",temperature:Number.isFinite(settings.temperature)?settings.temperature:.2,maxOutputTokens:Number.isFinite(settings.maxOutputTokens)?settings.maxOutputTokens:8192}})});
   if(response.ok)break;
   try{payload=await response.json()}catch{throw Error("لم يصل رد JSON صالح من خدمة الرسم.")}
   const message=payload?.error?.message||"HTTP "+response.status;
   if(![502,503,504].includes(response.status)||attempt===2){
    if(response.status===429)throw Error("وصلت إلى حد الطلبات أو الحصة المجانية. انتظر ثم حاول لاحقاً.");
    if(response.status===400&&/location|region/i.test(message))throw Error("الخدمة رفضت موقع الاتصال. تحقق من دعم المنطقة وحالة الحساب.");
    if(response.status===400||response.status===403)throw Error("رفضت Google الطلب أو المفتاح: "+message);
    throw Error("تعذر الاتصال بخدمة Gemini: "+message);
   }
  }catch(error){
   lastError=error;
   if(attempt===2||!/fetch failed|network|503|502|504|تعذر الاتصال بخدمة Gemini/.test(String(error?.message||error)))throw error;
  }
  await new Promise(resolve=>setTimeout(resolve,1200*(attempt+1)));
 }
 if(!response?.ok)throw lastError||Error("تعذر الاتصال بخدمة Gemini.");
 try{payload=await response.json()}catch{throw Error("لم يصل رد JSON صالح من خدمة الرسم.")}
 return parseResponse(payload);
}
function credentials(apiKey,prompt){
 const key=String(apiKey??"").trim(),description=String(prompt??"").trim();
 if(!key||key.length>200)throw Error("مفتاح API غير صالح.");
 if(!description||description.length>2000)throw Error("الوصف مطلوب ويجب ألا يتجاوز 2000 حرف.");
 return{key,description};
}
export async function generateVectorProposal(apiKey,prompt,fetcher=fetch){
 const{key,description}=credentials(apiKey,prompt);
 const instruction='You are the vector drawing department of ZERO STUDIO. Create editable SVG path operations, not images. Canvas is 1920 by 1080. Return ONLY JSON with this exact shape: {"version":1,"operations":[{"d":"SVG path data","stroke":"#172033","width":5,"fill":"none"}]}. Use only SVG path commands M L H V C S Q T A Z and numeric coordinates. Keep x coordinates between 0 and 1920 and y coordinates between 0 and 1080. Use 1 to 100 paths. Prefer clean coherent anime-style line art with separate editable paths. No XML, SVG markup, scripts, data URLs, raster images, base64, or markdown fences. If impossible, return {"version":1,"operations":[]}. User drawing request: '+description;
 const parsed=await request(key,instruction,fetcher);
 if(parsed?.version!==1||!Array.isArray(parsed.operations)||parsed.operations.length<1||parsed.operations.length>100)throw Error("صيغة الاقتراح غير صالحة أو لا تحتوي على مسارات.");
 const operations=parsed.operations.map((operation,index)=>{try{return validatePath(operation)}catch(error){throw Error("المسار رقم "+(index+1)+" غير صالح: "+error.message)}});
 return{version:1,operations};
}
export async function generateSceneProposal(apiKey,prompt,fetcher=fetch,model=GEMINI_MODEL){
 const{key,description}=credentials(apiKey,prompt);
 const instruction=`You are ZERO STUDIO\'s senior cinematic anime environment art director and production background painter. Do not make flat icons, clip-art, a logo, or a geometric diagram. Create a richly observed cinematic anime environment with convincing spatial depth and painterly 2.5D dimensionality using ONLY editable SVG vector paths. Canvas 1920x1080.

VISUAL TARGET: premium theatrical anime background art: believable real-world architecture, atmospheric perspective, carefully designed composition, nuanced natural color, warm directional sunlight, soft bounced light, contact shadows, ambient occlusion, reflected light, layered foliage, rich surface detail, and a hand-painted finish translated into deliberate vector shapes. It must feel like a carefully painted film background, not flat 2D clip-art. Do not claim true 3D geometry; create the strongest 2.5D depth illusion possible with overlapping planes, perspective, shading, and material detail.

MANDATORY DEPTH AND CAMERA: establish camera height, lens feel, horizon line, vanishing point(s), and ground plane. Divide the composition into at least five perceptual depth zones: foreground framing elements, near-ground props, hero architecture, midground vegetation/buildings, and distant environment/sky. Use scale falloff, occlusion, atmospheric contrast, and progressively softer/lower-contrast distant forms. Every major object must sit convincingly on the ground plane. Architectural edges, roof lines, windows, sidewalks, fences, and road markings must obey the same perspective. Avoid front-on flat elevations unless explicitly requested.

LIGHTING: choose one clear sun direction and keep it consistent. Build light-facing planes, half-tone planes, cast shadows, contact shadows, occlusion under eaves/awnings, window reflections, and subtle bounce light as separate editable shapes. Avoid one flat fill per object. Construct broad tonal planes where gradients are unavailable. No random highlights.

MATERIALS: distinguish plaster, painted wood, roof tile, glass, metal, asphalt, concrete, soil, leaves, and fabric through different value ranges, edge treatment, highlights, seams, grain-like marks, reflections, and irregularity. Windows need frames, recess depth, interior darkness, sky/foliage reflections, and selective highlights. Roofs need thickness, layered eaves, tile rhythm, ridge details, and cast shadow. Plants need varied leaf clusters, branching silhouettes, depth layers, and non-repeating shapes—not rows of identical circles. Roads and sidewalks need perspective taper, curb thickness, cracks/seams, subtle tonal variation, and grounded contact shadows.

COMPOSITION: preserve a clear focal hierarchy. Use foreground framing and overlapping forms to create depth; do not center every object or distribute details uniformly. Large forms first, medium structures second, small storytelling details last. Use asymmetry and natural imperfections. Avoid empty black gaps, floating objects, repeated oval foliage, rectangular-only buildings, triangular-only roofs, and thick uniform black outlines around every object.

STYLE: cinematic anime background painting, semi-realistic environmental design, naturalistic proportions, nuanced color scripting, soft painterly edges mixed with selective crisp architectural edges. Linework is selective and subordinate to light and form; no heavy cartoon outlines. Do not imitate any named living artist.

DETAIL BUDGET: use 2–12 semantic layers in back-to-front order, 1–100 paths per layer, maximum 300 paths total. Spend paths on meaningful shape complexity: compound curves, irregular contours, roof tiles, window divisions, trim, branches, foliage clumps, signage, paving, shadows, highlights, and props. Prefer a few complex, well-designed paths over piles of primitive rectangles and circles. At least 70% of paths should contribute to scene structure, material, lighting, or depth—not decorative noise.

OUTPUT: Return ONLY JSON with exact shape {"version":1,"layers":[{"name":"Distant atmosphere","operations":[{"d":"M ...","stroke":"none","width":1,"fill":"#..."}]}]}. Each layer has 1–100 operations; total <=300. Use only SVG path commands M L H V C S Q T A Z and numeric coordinates. Keep x=0..1920, y=0..1080. Use intentional tonal relationships; stroke may be none or a restrained material-specific color. No XML/SVG markup, scripts, data URLs, raster images, base64, markdown, or prose. Never output a single flat silhouette scene. If unable, return {"version":1,"layers":[]}.

SCENE REQUEST: `+description;
 const parsed=await request(key,instruction,fetcher,model);
 if(parsed?.version!==1||!Array.isArray(parsed.layers)||parsed.layers.length<2||parsed.layers.length>12)throw Error("لم يُرجع الفنان مشهداً صالحاً مقسماً إلى طبقتين على الأقل و12 طبقة كحد أقصى.");
 let total=0;const names=new Set();
 const layers=parsed.layers.map((entry,index)=>{
  const name=String(entry?.name??"").trim().replace(/[<>\u0000-\u001f]/g,"").slice(0,60);
  if(!name||names.has(name))throw Error("اسم الطبقة رقم "+(index+1)+" فارغ أو مكرر.");
  names.add(name);
  if(!Array.isArray(entry.operations)||entry.operations.length<1||entry.operations.length>100)throw Error("عدد المسارات في الطبقة "+name+" غير صالح.");
  total+=entry.operations.length;if(total>300)throw Error("تجاوز المشهد حد 300 مسار متجهي.");
  return{name,operations:entry.operations.map((operation,pathIndex)=>{try{return validatePath(operation)}catch(error){throw Error("الطبقة "+name+"، المسار "+(pathIndex+1)+": "+error.message)}})};
 });
 return{version:1,layers,totalOperations:total};
}

export async function generateEnvironmentProposal(apiKey,prompt,fetcher=fetch,model=GEMINI_MODEL){
 const{key,description}=credentials(apiKey,prompt);
 const instruction=`You are the senior environment concept designer for ZERO STUDIO. Return a precise spatial scene blueprint for a premium cinematic anime film background. Do NOT return SVG paths for the building or trees; the local deterministic art renderer will construct detailed editable vector geometry from your spatial design. Your task is composition, perspective, scale, lighting, depth, and coherent placement. Canvas 1920x1080. The desired look is painterly semi-realistic anime background art with a convincing 2.5D illusion, not flat 2D icons.

Return ONLY JSON with this shape: {"version":1,"sky":"#d9e8df","sun":"#f5d69b","mountains":["SVG path 1","SVG path 2","SVG path 3"],"trees":[{"x":100,"y":700,"scale":1,"depth":"far"},{"x":300,"y":780,"scale":1.2,"depth":"mid"},{"x":1600,"y":900,"scale":1.4,"depth":"near"}],"building":{"x":500,"y":250,"width":900,"height":650,"roofHeight":300,"wall":"#d5c4a5","roof":"#514b48","windows":[{"x":100,"y":390,"width":150,"height":160},{"x":300,"y":390,"width":150,"height":160}],"door":{"x":680,"y":440,"width":120,"height":210},"sign":{"x":350,"y":300,"width":360,"height":90}},"shrubs":[{"x":300,"y":950,"scale":1}],"road":{"edge":"SVG path","surface":"SVG path","centerLine":"SVG path"},"van":{"x":180,"y":820,"width":180,"height":100}}

COMPOSITION: three-quarter camera view, coherent vanishing point and ground plane, asymmetric cinematic framing, foreground framing foliage, distant hills, a readable hero building, believable roof thickness and eaves, layered windows, material variation, cast shadows. Keep all coordinates in 0..1920 x 0..1080. Building x 200..1200, width 450..1200, height 350..760, roofHeight 120..380. Use 3-8 windows with varied sizes and positions. Trees 4-12, distributed across far/mid/near depth. Add 2-6 shrubs. Include a road with a perspective-tapered surface and a curb edge. Include one small vehicle only if suitable. Use 2-3 mountain silhouette paths with valid SVG M/L/C/Q/Z commands. Make architecture and objects spatially consistent; objects must rest on ground, not float.

Output must be valid JSON, no markdown. SVG path strings may contain only M L H V C S Q T A Z commands and numeric coordinates. Request: ${description}`;
 const plan=await request(key,instruction,fetcher,model);
 if(plan?.version!==1||!plan.building||!Array.isArray(plan.trees)||!Array.isArray(plan.mountains)||!plan.road)throw Error("لم يُرجع مصمم البيئة مخططاً مكانياً مكتملاً.");
 const scene=renderEnvironmentScene(plan);
 return{plan, ...scene};
}

export async function generateMeshEnvironmentProposal(apiKey,prompt,fetcher=fetch,model=GEMINI_MODEL){
 const{key,description}=credentials(apiKey,prompt);
 const instruction=`You are ZERO STUDIO's senior 3D anime environment art director. Design a real 3D scene graph blueprint, NOT a 2D drawing and NOT SVG paths. The local mesh renderer will construct 3D meshes, project them through a perspective camera, shade every visible face from a directional sun, and export editable SVG paths. Your job is to make the spatial design convincing and cinematic.

Return ONLY JSON with this shape: {"version":1,"camera":{"position":[9,8,19],"target":[0,2.4,0]},"sky":"#c9ded9","sun":"#f3d39a","sunDirection":[-0.55,0.9,0.35],"building":{"width":9,"height":4.5,"depth":4.5,"wall":"#d8c6a8","roof":"#514b48","windows":[{"x":-3.5,"y":1.4,"width":1.3,"height":1.5},{"x":-1.5,"y":1.4,"width":1.3,"height":1.5},{"x":0.5,"y":1.4,"width":1.3,"height":1.5}],"door":{"x":2.5,"y":0,"width":1.2,"height":2.7},"sign":{"x":-1.5,"y":3.6,"width":3.2,"height":0.6},"awning":{"x":-3.8,"y":2.9,"width":4.6,"height":0.6,"color":"#a64c43"}},"trees":[{"x":-8,"z":-3,"scale":1.2,"color":"#477255"},{"x":8,"z":-4,"scale":1.1,"color":"#6d916a"},{"x":11,"z":4,"scale":1.3,"color":"#477255"}],"shrubs":[{"x":-5,"z":3,"scale":1,"color":"#6f925d"},{"x":4,"z":4,"scale":1.2,"color":"#8aa66f"}],"poles":[{"x":9,"z":0,"height":8},{"x":13,"z":-3,"height":7}],"van":{"x":-9,"z":5,"width":2.8,"depth":1.6}}

WORLD AND CAMERA: world axes x=left/right, y=height, z=depth. The street-facing building facade must face the camera at positive z. Use a three-quarter camera position so both the front facade and one side wall are visible; avoid a flat front elevation. Camera target should look at the center of the hero building. Use realistic relative scales and keep the whole building inside the view. Camera position values typically range x=6..13, y=6..11, z=15..24; target near [0,2,0].

BUILDING: a distinctive Japanese countryside ramen shop, two-story or strongly articulated facade, gabled tiled roof with deep eaves, thick roof ridge, visible side wall, 3-6 windows, a clear entrance, signboard and red fabric awning/noren. Width 7..12, height 4..6, depth 3.5..7. Place all windows/door/sign inside the front facade. Roof and facade must not intersect the road. Use warm plaster/wood with a dark tile roof.

ENVIRONMENT: 3-4 trees, distributed in depth and at varied sizes, never all in one row. Add 3-5 low shrubs or potted plants near the entrance and foreground. Add 1-2 utility poles with overhead wire. Include a small parked van only if it improves composition. A foreground road and sidewalk are generated automatically. Sun direction should create clear dimensional tonal differences across roof, wall and side surfaces. Palette should feel like a premium anime film background at late-afternoon golden hour.

All 3D positions and dimensions must be finite and plausible. Use only hex colors. No prose or markdown. Scene request: ${description}`;
 const plan=await request(key,instruction,fetcher,model);
 if(plan?.version!==1||!plan.building||!Array.isArray(plan.trees)||!Array.isArray(plan.camera?.position)||!Array.isArray(plan.camera?.target))throw Error("لم يُرجع الفنان مخططاً ثلاثي الأبعاد مكتملاً.");
 const scene=renderMeshEnvironment(plan);
 return{plan,...scene};
}

const ANIME_2D_LAYERS=[
 {name:"01 — السماء والجو البعيد",role:"Sky, distant atmosphere, clouds, sun glow, far mountains and silhouettes",budget:110},
 {name:"02 — الكتل النباتية البعيدة",role:"Distant tree lines, varied canopy silhouettes, distant shrubs and landscape masses",budget:140},
 {name:"03 — العمارة الأساسية",role:"Hero building silhouette, roof masses, side walls, porch, large structural surfaces",budget:150},
 {name:"04 — تفاصيل العمارة والخامات",role:"Roof tiles, eaves, beams, windows, shutters, reflections, doors, signs, noren fabric, material grain",budget:170},
 {name:"05 — الطريق والبنية الحضرية",role:"Road perspective, sidewalk, curb, utility poles, wires, vehicles, benches, street props and planters",budget:140},
 {name:"06 — النباتات والعناصر الأمامية",role:"Foreground trees, shrubs, individual leaf clusters, branches, garden plants and foreground objects",budget:150},
 {name:"07 — الضوء والظلال والتركيب",role:"Cast shadows, contact shadows, reflected light, dappled sunlight, rays, atmospheric haze and finishing accents",budget:100}
];
function validateAnimeLayoutPlan(plan){
 if(!plan||plan.version!==1||!plan.layerNotes||typeof plan.layerNotes!=="object")throw Error("لم يرجع مخرج الفن مخططاً ثنائي الأبعاد صالحاً.");
 const point=v=>Array.isArray(v)&&v.length===2&&v.every(n=>Number.isFinite(n)&&n>=0&&n<=1920);
 if(!Number.isFinite(plan.horizonY)||plan.horizonY<100||plan.horizonY>950)throw Error("خط الأفق في المخطط خارج حدود الكادر.");
 if(!point(plan.vanishingPoint)||!point(plan.sunPosition))throw Error("موضع نقطة التلاشي أو الشمس غير صالح.");
 const required=["sky","distance","architecture","architectureDetails","road","foreground","lighting"];
 for(const key of required)if(typeof plan.layerNotes[key]!=="string"||plan.layerNotes[key].trim().length<12)throw Error("الوصف الفني للطبقة "+key+" مفقود.");
 if(typeof plan.architecture!=="string"||typeof plan.camera!=="string"||typeof plan.lighting!=="string"||typeof plan.vegetation!=="string"||typeof plan.road!=="string")throw Error("وصف الكاميرا أو البيئة أو الإضاءة ناقص.");
 return plan;
}
export async function generateAnimeVectorBackground(apiKey,prompt,fetcher=fetch,model=GEMINI_MODEL,options={}){
 const{key,description}=credentials(apiKey,prompt);
 let activeModel=model;
 const fallbackModels=[model,...(Array.isArray(options.fallbackModels)?options.fallbackModels:[])].filter((value,index,array)=>ALLOWED_MODELS.has(value)&&array.indexOf(value)===index);
 async function requestWithFallback(instruction,settings){let lastError;for(const candidate of fallbackModels){try{const result=await request(key,instruction,fetcher,candidate,settings);activeModel=candidate;return result}catch(error){lastError=error;const message=String(error?.message||error);if(!/high demand|503|502|504|temporarily unavailable/i.test(message))throw error;}}throw lastError||Error("تعذر الاتصال بنماذج الرسم المتاحة.");}
 const artDirection="Cinematic 2D anime background painting, semi-realistic Japanese environment art. The final surface must read as carefully painted 2D artwork, never low-poly 3D, never flat icon art, never children's clip-art. Strong wide cinematic perspective, layered foreground/midground/background, richly observed architecture, natural irregular foliage, believable materials, selective delicate linework, warm/cool color separation, soft bounced sunlight, ambient occlusion, reflections and atmospheric depth. Avoid generic rectangles, repeated circles, identical leaves, thick black outlines, empty silhouette gaps and oversimplified roof triangles.";
 const layoutPrompt="You are the lead art director and background layout designer for a high-end 2D anime film. Produce a precise scene blueprint that a separate vector background painting department will draw. Do not output SVG paths yet. Canvas 1920x1080. "+artDirection+"\nReturn ONLY JSON:\n{\"version\":1,\"title\":\"...\",\"camera\":\"precise camera height, lens feel, three-quarter/wide view, framing\",\"horizonY\":520,\"vanishingPoint\":[980,540],\"sunPosition\":[280,150],\"lighting\":\"sun direction, warmth, cast shadow direction, bounce light\",\"architecture\":\"detailed building form, proportions, position, roof structure, facade, depth and materials\",\"vegetation\":\"tree shape variation, branch/canopy layering, foliage placement, density\",\"road\":\"ground plane, street/sidewalk geometry and perspective\",\"layerNotes\":{\"sky\":\"...\",\"distance\":\"...\",\"architecture\":\"...\",\"architectureDetails\":\"...\",\"road\":\"...\",\"foreground\":\"...\",\"lighting\":\"...\"}}\nUse the scene request below. Keep all coordinates tied to a 1920x1080 wide frame. Buildings, road, poles, vegetation and props must share one coherent perspective. Use a visible focal hierarchy. LayerNotes must explain exact object placement and detail rather than generic style words. Avoid placing the whole building dead centre unless composition warrants it. Request: "+description;
 let rawPlan=await requestWithFallback(layoutPrompt,{temperature:.42,maxOutputTokens:5000}),plan;
 try{plan=validateAnimeLayoutPlan(rawPlan)}
 catch(firstError){
  const repairPrompt="You are repairing an incomplete 2D anime film layout blueprint. The prior JSON failed validation with this exact error: "+String(firstError.message)+". Return a corrected complete JSON object matching this schema exactly, keeping and improving all existing detailed scene information. REQUIRED layerNotes keys: sky, distance, architecture, architectureDetails, road, foreground, lighting. Every field must have concrete scene-specific instructions, not placeholders or ellipses. Required numeric horizonY and coordinate pairs vanishingPoint and sunPosition. Also include non-empty camera, lighting, architecture, vegetation and road descriptions. Return ONLY JSON, no prose. Previous blueprint: "+JSON.stringify(rawPlan)+"\nScene request: "+description;
  rawPlan=await requestWithFallback(repairPrompt,{temperature:.22,maxOutputTokens:5000});
  try{plan=validateAnimeLayoutPlan(rawPlan)}catch(secondError){throw Error("تعذر إصلاح مخطط الفنان بعد محاولة تصحيح واحدة: "+secondError.message);}
 }
 if(typeof options.onProgress==="function")options.onProgress({stage:"layout",completed:0,total:ANIME_2D_LAYERS.length,message:"اكتمل تخطيط الكاميرا والمنظور؛ يبدأ الآن رسم الطبقات الفنية."});
 const layers=[],allPaths=new Set();let totalOperations=0;
 for(let i=0;i<ANIME_2D_LAYERS.length;i++){
  const spec=ANIME_2D_LAYERS[i],keys=["sky","distance","architecture","architectureDetails","road","foreground","lighting"],note=plan.layerNotes[keys[i]];
  const globalPlan=JSON.stringify({title:plan.title,camera:plan.camera,horizonY:plan.horizonY,vanishingPoint:plan.vanishingPoint,sunPosition:plan.sunPosition,lighting:plan.lighting,architecture:plan.architecture,vegetation:plan.vegetation,road:plan.road,layerNotes:plan.layerNotes});
  const layerPrompt="You are the principal 2D anime background painter, not a 3D modeller. Draw ONE layer of a finished cinematic anime environment as editable SVG path operations. Canvas 1920x1080. "+artDirection+
  "\nGLOBAL LAYOUT PLAN:\n"+globalPlan+
  "\nYOUR LAYER: "+spec.name+
  "\nLAYER ROLE: "+spec.role+
  "\nEXACT ART DIRECTION FOR THIS LAYER: "+note+
  "\nQUALITY REQUIREMENTS:\n- Produce about "+Math.floor(spec.budget*.65)+" to "+spec.budget+" meaningful paths. Minimum 28 paths unless this layer truly has fewer visible objects.\n- Use complex organic cubic/quadratic Bezier contours and varied path scale. Do not assemble the whole scene from rectangles, ellipses or triangles.\n- Every object must follow the shared perspective, overlap correctly and rest on a supporting surface.\n- Distinguish material identity with shapes for light planes, half-tones, seams, grains, fine edges, highlights and shadows. Glass requires recess, frames, reflection streaks and interior value. Roof tiles require overlapping courses, ridge caps and eave thickness. Wood requires grain direction and joinery. Foliage requires branch structure, irregular overlapping leaf masses and varied individual leaf silhouettes. Asphalt/concrete requires surface patches, joints, cracks and tapered perspective.\n- Use selective fine outlines in material colors, not thick uniform black. Preserve warm sunlit surfaces and cooler blue/green shadow planes.\n- Do NOT draw elements assigned to other layers, except small overlaps needed for clean occlusion.\n- Use fill colours as hex values or approved material references: url(#zero-anime-sky), url(#zero-anime-plaster), url(#zero-anime-timber), url(#zero-anime-tile), url(#zero-anime-glass), url(#zero-anime-asphalt), url(#zero-anime-leaf), url(#zero-anime-leaf-sun), url(#zero-anime-shadow), url(#zero-anime-sun), url(#zero-anime-woodgrain), url(#zero-anime-asphalt-grain). Filter only url(#zero-anime-soft-shadow), url(#zero-anime-small-blur), url(#zero-anime-glow), url(#zero-anime-paper-grain).\nReturn ONLY JSON: {\"version\":1,\"operations\":[{\"d\":\"M ... C ... Z\",\"fill\":\"#...\",\"stroke\":\"none\",\"width\":1,\"opacity\":1}]}\nUse SVG path commands M L H V C S Q T A Z, numeric coordinates only. Use explicit closed paths for filled areas. Keep x=-100..2020 and y=-100..1180. No SVG markup, no text outside JSON, no scripts, no data URLs, no raster images/base64, no markdown. Maximum "+spec.budget+" paths. Scene description: "+description;
  let parsed=null,lastError=null;
  for(let attempt=0;attempt<2;attempt++){
   try{
    parsed=await requestWithFallback(layerPrompt,{temperature:.52,maxOutputTokens:8192});
    if(parsed?.version!==1||!Array.isArray(parsed.operations))throw Error("صيغة طبقة 2D غير صالحة: "+spec.name);
    if(parsed.operations.length<12)throw Error("طبقة 2D قليلة التفاصيل ("+parsed.operations.length+" مساراً): "+spec.name);
    if(parsed.operations.length>spec.budget)throw Error("تجاوزت الطبقة ميزانية المسارات: "+spec.name);
    break;
   }catch(error){
    lastError=error;
    const msg=String(error?.message||error);
    if(attempt===1||/الحصة المجانية|حد الطلبات|رفضت Google|موقع الاتصال/.test(msg))throw error;
    await new Promise(resolve=>setTimeout(resolve,1600));
   }
  }
  const operations=[];
  for(let j=0;j<parsed.operations.length;j++){
   let operation;
   try{operation=validatePath(parsed.operations[j]);}
   catch(error){throw Error("مسار غير صالح في "+spec.name+"، رقم "+(j+1)+": "+error.message);}
   const bounds=pathGeometryBounds(operation.d);
   if(bounds.minX< -120||bounds.minY< -120||bounds.maxX>2040||bounds.maxY>1200)throw Error("مسار خارج حدود الكادر في "+spec.name+".");
   const keyPath=operation.d+"|"+operation.fill+"|"+operation.stroke;
   if(allPaths.has(keyPath))continue;
   allPaths.add(keyPath);operations.push(operation);
  }
  if(operations.length<12)throw lastError||Error("طبقة غير كافية بعد إزالة المسارات المكررة: "+spec.name);
  totalOperations+=operations.length;
  layers.push({name:spec.name,operations});
  if(typeof options.onProgress==="function")options.onProgress({stage:"layer",completed:i+1,total:ANIME_2D_LAYERS.length,message:"اكتملت الطبقة "+(i+1)+" من "+ANIME_2D_LAYERS.length+": "+spec.name});
  if(i<ANIME_2D_LAYERS.length-1){const delay=Number.isFinite(options.interRequestDelayMs)?Math.max(0,Math.min(10000,options.interRequestDelayMs)):4200;if(delay)await new Promise(resolve=>setTimeout(resolve,delay));}
 }
 if(totalOperations<220||totalOperations>1100)throw Error("عدد المسارات الكلي لا يحقق حد جودة المشهد: "+totalOperations);
 return{version:1,kind:"gemini-2d-vector-scene",plan,layers,totalOperations,style:"cinematic-2d-anime-background",model:activeModel};
}
