import{validatePath}from"./engine.mjs";
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
async function request(apiKey,instruction,fetcher,model=GEMINI_MODEL){
 let response,payload,lastError;
 for(let attempt=0;attempt<3;attempt++){
  try{
   response=await fetcher(endpointFor(model),{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},body:JSON.stringify({contents:[{role:"user",parts:[{text:instruction}]}],generationConfig:{responseMimeType:"application/json",temperature:.2,maxOutputTokens:8192}})});
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
