const DEFAULT_MODEL="gemini-3.5-flash-lite";
const ALLOWED_MODELS=new Set(["gemini-3.5-flash-lite","gemini-3.1-flash-lite","gemini-3-flash"]);
export function createGeminiAnimationProvider({apiKey,model=DEFAULT_MODEL,fetcher=fetch}={}){
 const key=String(apiKey??"").trim();
 if(!key)throw Error("GEMINI_API_KEY is missing.");
 if(!ALLOWED_MODELS.has(model))throw Error("Unsupported Gemini model.");
 return async function generateBatch({prompt,signal}={}){
  if(typeof prompt!=="string"||!prompt.trim())throw Error("Animation batch prompt is required.");
  const response=await fetcher("https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent",{
   method:"POST",signal,headers:{"Content-Type":"application/json","x-goog-api-key":key},
   body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{responseMimeType:"application/json",temperature:0.2,maxOutputTokens:32768}})
  });
  let body;try{body=await response.json()}catch{throw Error("Gemini returned a non-JSON HTTP response.")}
  if(!response.ok){const message=body?.error?.message||"HTTP "+response.status;const error=Error("Gemini "+response.status+": "+message);error.status=response.status;throw error;}
  const text=body?.candidates?.[0]?.content?.parts?.map(part=>part.text||"").join("").trim();
  if(!text)throw Error("Gemini returned no candidate text; finish reason: "+(body?.candidates?.[0]?.finishReason||"unknown"));
  let parsed;try{parsed=JSON.parse(text)}catch{throw Error("Gemini response was not valid JSON.")}
  return parsed;
 };
}
export const GEMINI_ANIMATION_DEFAULT_MODEL=DEFAULT_MODEL;
