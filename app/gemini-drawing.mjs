import{validatePath}from"./engine.mjs";
export const GEMINI_MODEL="gemini-3.5-flash-lite";
const ENDPOINT="https://generativelanguage.googleapis.com/v1beta/models/"+GEMINI_MODEL+":generateContent";
export async function generateVectorProposal(apiKey,prompt,fetcher=fetch){
 const key=String(apiKey??"").trim(),description=String(prompt??"").trim();
 if(!key||key.length>200)throw Error("مفتاح API غير صالح.");
 if(!description||description.length>1000)throw Error("الوصف مطلوب ويجب ألا يتجاوز 1000 حرف.");
 const instruction='You are the vector drawing department of ZERO STUDIO. Create editable SVG path operations, not images. Canvas is 1920 by 1080. Return ONLY JSON with this exact shape: {"version":1,"operations":[{"d":"SVG path data","stroke":"#172033","width":5,"fill":"none"}]}. Use only SVG path commands M L H V C S Q T A Z and numeric coordinates. Keep x coordinates between 0 and 1920 and y coordinates between 0 and 1080. Use 1 to 100 paths. Prefer clean coherent anime-style line art with separate editable paths. No XML, SVG markup, scripts, data URLs, raster images, base64, or markdown fences. If impossible, return {"version":1,"operations":[]}. User drawing request: '+description;
 const response=await fetcher(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{role:"user",parts:[{text:instruction}]}],generationConfig:{responseMimeType:"application/json",temperature:0.2,maxOutputTokens:4096}})});
 let payload;try{payload=await response.json()}catch{throw Error("لم يصل رد JSON صالح من خدمة الرسم.")}
 if(!response.ok){const message=payload?.error?.message||"HTTP "+response.status;if(response.status===429)throw Error("وصلت إلى حد الطلبات أو الحصة المجانية. انتظر ثم حاول لاحقاً.");if(response.status===400&&/location|region/i.test(message))throw Error("الخدمة رفضت موقع الاتصال. تحقق من دعم المنطقة وحالة الحساب.");if(response.status===400||response.status===403)throw Error("رفضت Google الطلب أو المفتاح: "+message);throw Error("تعذر الاتصال بخدمة Gemini: "+message)}
 const text=payload?.candidates?.[0]?.content?.parts?.map(part=>part.text||"").join("").trim();
 if(!text)throw Error("لم يُرجع النموذج اقتراحاً نصياً. قد يكون الطلب محظوراً أو غير مكتمل.");
 let parsed;try{parsed=JSON.parse(text)}catch{throw Error("رد النموذج ليس JSON صالحاً. أعد صياغة الوصف وحاول مجدداً.")}
 if(parsed?.version!==1||!Array.isArray(parsed.operations)||parsed.operations.length<1||parsed.operations.length>100)throw Error("صيغة الاقتراح غير صالحة أو لا تحتوي على مسارات.");
 const operations=parsed.operations.map((operation,index)=>{try{return validatePath(operation)}catch(error){throw Error("المسار رقم "+(index+1)+" غير صالح: "+error.message)}});
 return{version:1,operations};
}
