const DEFAULT_MODEL="gemini-3.1-flash-lite";
const ALLOWED_MODELS=new Set(["gemini-3.1-flash-lite","gemini-3.1-flash-lite","gemini-3-flash-preview","gemini-3.8-flash"]);
const REFERENCE_MIME_TYPES=new Set(["image/jpeg","image/png","image/webp"]);
function normalizeReferenceImage(referenceImage){
 if(referenceImage===undefined||referenceImage===null)return null;
 const mimeType=String(referenceImage.mimeType||"").toLowerCase();
 const data=String(referenceImage.data||"").trim();
 if(!REFERENCE_MIME_TYPES.has(mimeType))throw Error("Character reference must be JPEG, PNG, or WebP.");
 if(!data||data.length>8*1024*1024||!/^[A-Za-z0-9+/]+={0,2}$/.test(data))throw Error("Character reference image data is invalid or exceeds 6 MiB.");
 return{mimeType,data};
}
function retryDelayFrom(value){
 if(value===null||value===undefined||value==="")return null;
 const text=String(value).trim();
 if(/^\d+(?:\.\d+)?$/.test(text))return Math.max(0,Number(text)*1000);
 const duration=text.match(/^(\d+(?:\.\d+)?)s$/i);
 if(duration)return Math.max(0,Number(duration[1])*1000);
 const date=Date.parse(text);
 return Number.isFinite(date)?Math.max(0,date-Date.now()):null;
}
function providerRetryAfterMs(response,body){
 let delay=null;
 try{delay=retryDelayFrom(response.headers?.get?.("retry-after"))}catch{}
 if(delay!==null)return delay;
 const details=Array.isArray(body?.error?.details)?body.error.details:[];
 const retryInfo=details.find(item=>String(item?.["@type"]||"").includes("RetryInfo"));
 return retryDelayFrom(retryInfo?.retryDelay);
}
export function createGeminiAnimationProvider({apiKey,model=DEFAULT_MODEL,fetcher=fetch,referenceImage}={}){
 const key=String(apiKey??"").trim();
 if(!key)throw Error("GEMINI_API_KEY is missing.");
 if(!ALLOWED_MODELS.has(model))throw Error("Unsupported Gemini model.");
 const reference=normalizeReferenceImage(referenceImage);
 return async function generateBatch({prompt,signal}={}){
  if(typeof prompt!=="string"||!prompt.trim())throw Error("Animation batch prompt is required.");
  const parts=[{text:prompt}];
  if(reference)parts.push({text:"CHARACTER IDENTITY REFERENCE: The attached image is the approved visual reference for the character. Match the same face profile, long dark hairstyle, pale kimono with pink shading, red waist sash, proportions, silhouette, and palette. Use it only as a visual design reference. Redraw every requested frame as fresh editable SVG path geometry on the transparent moving-art canvas. Do not embed, trace as a single bitmap, or reuse the raster image as an animation frame. Preserve the character identity while changing pose and anatomy coherently."},{inline_data:{mime_type:reference.mimeType,data:reference.data}});
  const response=await fetcher("https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent",{
   method:"POST",signal,headers:{"Content-Type":"application/json","x-goog-api-key":key},
   body:JSON.stringify({contents:[{role:"user",parts}],generationConfig:{responseMimeType:"application/json",temperature:0.2,maxOutputTokens:32768}})
  });
  let body;try{body=await response.json()}catch{throw Error("Gemini returned a non-JSON HTTP response.")}
  if(!response.ok){const message=body?.error?.message||"HTTP "+response.status;const retryAfterMs=providerRetryAfterMs(response,body);const retryable=[500,502,503,504].includes(response.status)||(response.status===429&&retryAfterMs!==null);const error=Error("Gemini "+response.status+": "+message);error.status=response.status;error.retryAfterMs=retryAfterMs;error.retryable=retryable;throw error;}
  const text=body?.candidates?.[0]?.content?.parts?.map(part=>part.text||"").join("").trim();
  if(!text)throw Error("Gemini returned no candidate text; finish reason: "+(body?.candidates?.[0]?.finishReason||"unknown"));
  let parsed;try{parsed=JSON.parse(text)}catch{throw Error("Gemini response was not valid JSON.")}
  return parsed;
 };
}
export const GEMINI_ANIMATION_DEFAULT_MODEL=DEFAULT_MODEL;
