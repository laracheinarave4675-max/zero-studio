import test from"node:test";
import assert from"node:assert/strict";
import{createRequire}from"node:module";
const require=createRequire(import.meta.url);
const handler=require("../app/api/anime-segment.js");
const ORIGIN="https://zero-studio-preview.vercel.app";
const IMAGE_ID="7bae987b-038b-44a2-b89d-5ef905719fc7";
function responseRecorder(){return{headers:{},statusCode:200,body:null,setHeader(name,value){this.headers[name]=value},status(code){this.statusCode=code;return this},json(value){this.body=value;return this},send(value){this.body=value;return this}}}
function req({method="POST",origin=ORIGIN,sourceId=IMAGE_ID}={}){return{method,headers:{origin,host:new URL(origin).host,"content-type":"application/json"},body:{sourceId}}}
function restore(saved){for(const [key,value]of Object.entries(saved)){if(value===undefined)delete process.env[key];else process.env[key]=value}}
const envKeys=["ZERO_STUDIO_APP_ORIGIN","ZERO_STUDIO_ACCESS_TOKEN","ZERO_STUDIO_IMAGE_WORKER_URL"];
function saveEnv(){return Object.fromEntries(envKeys.map(k=>[k,process.env[k]]))}
function setup(){process.env.ZERO_STUDIO_APP_ORIGIN=ORIGIN;process.env.ZERO_STUDIO_ACCESS_TOKEN="unit-test-secret";process.env.ZERO_STUDIO_IMAGE_WORKER_URL="https://worker.example"}
test("anime segmentation proxy returns only a verified PNG cutout from the protected Worker",async()=>{
 const old=saveEnv(),fetcher=globalThis.fetch;setup();let observed;
 const png=Buffer.from([137,80,78,71,13,10,26,10]);
 globalThis.fetch=async(url,options)=>{observed={url,options};return new Response(png,{status:200,headers:{"content-type":"image/png","x-zero-segmentation":"cloudflare-images-birefnet"}})};
 try{
  const res=responseRecorder();await handler(req(),res);
  assert.equal(res.statusCode,200);assert.equal(res.headers["Content-Type"],"image/png");
  assert.equal(res.headers["X-Zero-Segmentation"],"cloudflare-images-birefnet");
  assert.deepEqual(res.body,png);
  assert.equal(observed.url,"https://worker.example/v1/anime/segment");
  assert.equal(observed.options.method,"POST");
  assert.equal(observed.options.headers.Authorization,"Bearer unit-test-secret");
  assert.deepEqual(JSON.parse(observed.options.body),{sourceId:IMAGE_ID});
 }finally{globalThis.fetch=fetcher;restore(old)}
});
test("anime segmentation proxy rejects unapproved origin, invalid gallery ID and non-POST methods before network",async()=>{
 const old=saveEnv(),fetcher=globalThis.fetch;setup();let calls=0;globalThis.fetch=async()=>{calls++;return new Response("x")};
 try{
  const denied=responseRecorder();await handler(req({origin:"https://attacker.example"}),denied);assert.equal(denied.statusCode,403);
  const invalid=responseRecorder();await handler(req({sourceId:"../secrets"}),invalid);assert.equal(invalid.statusCode,400);
  const method=responseRecorder();await handler(req({method:"GET"}),method);assert.equal(method.statusCode,405);
  assert.equal(calls,0);
 }finally{globalThis.fetch=fetcher;restore(old)}
});
test("anime segmentation proxy reports the free transformation cap without trying a paid provider",async()=>{
 const old=saveEnv(),fetcher=globalThis.fetch;setup();let calls=0;
 globalThis.fetch=async()=>{calls++;return Response.json({ok:false,error:"free_transformation_limit_reached",message:"انتهت حصة تحويلات الصور المجانية لهذا الشهر. لم تُفرض رسوم."},{status:429})};
 try{
  const res=responseRecorder();await handler(req(),res);
  assert.equal(res.statusCode,429);assert.equal(res.body.error,"free_transformation_limit_reached");assert.equal(calls,1);
  assert.match(res.body.message,/لم تُفرض رسوم/);
 }finally{globalThis.fetch=fetcher;restore(old)}
});
test("anime segmentation proxy refuses unverified output MIME and provider markers",async()=>{
 const old=saveEnv(),fetcher=globalThis.fetch;setup();globalThis.fetch=async()=>new Response("image",{status:200,headers:{"content-type":"image/jpeg","x-zero-segmentation":"other"}});
 try{const res=responseRecorder();await handler(req(),res);assert.equal(res.statusCode,502);assert.equal(res.body.error,"invalid_segmentation_response")}
 finally{globalThis.fetch=fetcher;restore(old)}
});
