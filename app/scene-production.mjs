import{validatePath}from"./engine.mjs";
export const GEMINI_MODEL="gemini-3.5-flash-lite";
const ENDPOINT="https://generativelanguage.googleapis.com/v1beta/models/"+GEMINI_MODEL+":generateContent";
function parseResponse(payload){
 const text=payload?.candidates?.[0]?.content?.parts?.map(part=>part.text||"").join("").trim();
 if(!text)throw Error("لم يُرجع النموذج اقتراحاً نصياً. قد يكون الطلب محظوراً أو غير مكتمل.");
 try{return JSON.parse(text)}catch{throw Error("رد النموذج ليس JSON صالحاً. أعد صياغة الوصف وحاول مجدداً.")}
}
async function request(apiKey,instruction,fetcher){
 const response=await fetcher(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},body:JSON.stringify({contents:[{role:"user",parts:[{text:instruction}]}],generationConfig:{responseMimeType:"application/json",temperature:.2,maxOutputTokens:8192}})});
 let payload;try{payload=await response.json()}catch{throw Error("لم يصل رد JSON صالح من خدمة الرسم.")}
 if(!response.ok){const message=payload?.error?.message||"HTTP "+response.status;if(response.status===429)throw Error("وصلت إلى حد الطلبات أو الحصة المجانية. انتظر ثم حاول لاحقاً.");if(response.status===400&&/location|region/i.test(message))throw Error("الخدمة رفضت موقع الاتصال. تحقق من دعم المنطقة وحالة الحساب.");if(response.status===400||response.status===403)throw Error("رفضت Google الطلب أو المفتاح: "+message);throw Error("تعذر الاتصال بخدمة Gemini: "+message)}
 return parseResponse(payload);
}
function credentials(apiKey,prompt){
 const key=String(apiKey??"").trim(),description=String(prompt??"").trim();
 if(!key||key.length>200)throw Error("مفتاح API غير صالح.");
 if(!description||description.length>1000)throw Error("الوصف مطلوب ويجب ألا يتجاوز 1000 حرف.");
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
export async function generateSceneProposal(apiKey,prompt,fetcher=fetch){
 const{key,description}=credentials(apiKey,prompt);
 const instruction='You are the lead anime scene artist of ZERO STUDIO. Draw the requested scene as editable SVG vector path operations only, never an image. Canvas 1920x1080. Return ONLY JSON: {"version":1,"layers":[{"name":"Character - body","operations":[{"d":"M ...","stroke":"#172033","width":5,"fill":"none"}]}]}. Make 2 to 12 clearly named, semantically separated layers in back-to-front order. Split important objects into editable layers (for a character, separate body, clothing, face, hair, and accessories when relevant). Each layer has 1 to 100 paths; total paths at most 300. Use only M L H V C S Q T A Z path commands and numeric coordinates. Keep artwork within x=0..1920 and y=0..1080. Use coherent anime line art, deliberate composition, readable silhouettes, consistent proportions, and restrained colors. Do not return XML, SVG markup, scripts, data URLs, raster images, base64, markdown, or explanatory prose. If the request cannot be drawn, return {"version":1,"layers":[]}. Request: '+description;
 const parsed=await request(key,instruction,fetcher);
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
