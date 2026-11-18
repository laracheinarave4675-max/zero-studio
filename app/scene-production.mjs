import{validatePath}from"./engine.mjs";
export const GEMINI_MODEL="gemini-3.5-flash-lite";
const ALLOWED_MODELS=new Set([GEMINI_MODEL,"gemini-3.1-flash-lite","gemini-3-flash","gemini-2.5-flash-lite"]);
const endpointFor=model=>{if(!ALLOWED_MODELS.has(model))throw Error("نموذج Gemini غير مدعوم.");return "https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent"};
function parseResponse(payload){
 const text=payload?.candidates?.[0]?.content?.parts?.map(part=>part.text||"").join("").trim();
 if(!text)throw Error("لم يُرجع النموذج اقتراحاً نصياً. قد يكون الطلب محظوراً أو غير مكتمل.");
 try{return JSON.parse(text)}catch{throw Error("رد النموذج ليس JSON صالحاً. أعد صياغة الوصف وحاول مجدداً.")}
}
async function request(apiKey,instruction,fetcher,model=GEMINI_MODEL){
 const response=await fetcher(endpointFor(model),{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},body:JSON.stringify({contents:[{role:"user",parts:[{text:instruction}]}],generationConfig:{responseMimeType:"application/json",temperature:.2,maxOutputTokens:8192}})});
 let payload;try{payload=await response.json()}catch{throw Error("لم يصل رد JSON صالح من خدمة الرسم.")}
 if(!response.ok){const message=payload?.error?.message||"HTTP "+response.status;if(response.status===429)throw Error("وصلت إلى حد الطلبات أو الحصة المجانية. انتظر ثم حاول لاحقاً.");if(response.status===400&&/location|region/i.test(message))throw Error("الخدمة رفضت موقع الاتصال. تحقق من دعم المنطقة وحالة الحساب.");if(response.status===400||response.status===403)throw Error("رفضت Google الطلب أو المفتاح: "+message);throw Error("تعذر الاتصال بخدمة Gemini: "+message)}
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
