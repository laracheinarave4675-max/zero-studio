import test from "node:test";
import assert from "node:assert/strict";
import {createGeminiAnimationProvider} from "../app/gemini-animation.mjs";
test("Gemini animation provider sends JSON mode request and returns parsed batch",async()=>{
 let request;
 const provider=createGeminiAnimationProvider({apiKey:"test-secret",model:"gemini-3.5-flash-lite",fetcher:async(url,options)=>{request={url,options};return{ok:true,json:async()=>({candidates:[{content:{parts:[{text:'{"version":1,"frames":[]}' }]}}]})}}});
 const result=await provider({prompt:"draw six frames"});
 assert.deepEqual(result,{version:1,frames:[]});
 assert.match(request.url,/gemini-3\.5-flash-lite:generateContent$/);
 assert.equal(request.options.headers["x-goog-api-key"],"test-secret");
 assert.equal(JSON.parse(request.options.body).generationConfig.responseMimeType,"application/json");
});
test("Gemini animation provider requires key and rejects unsupported models",()=>{
 assert.throws(()=>createGeminiAnimationProvider({apiKey:""}),/GEMINI_API_KEY/);
 assert.throws(()=>createGeminiAnimationProvider({apiKey:"x",model:"unknown"}),/Unsupported/);
});
test("Gemini animation provider reports HTTP quota errors without hiding status",async()=>{
 const provider=createGeminiAnimationProvider({apiKey:"x",fetcher:async()=>({ok:false,status:429,json:async()=>({error:{message:"quota exceeded"}})})});
 await assert.rejects(()=>provider({prompt:"test"}),error=>error.status===429&&/quota exceeded/.test(error.message));
});
