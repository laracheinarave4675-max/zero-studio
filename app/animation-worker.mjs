import{createAnimationBatchPrompt,appendAnimationBatch,getAnimationBatchRange}from"./animation-production.mjs";
function fail(message){throw Error(message)}
function abort(signal){if(signal?.aborted){const error=Error("تم إيقاف إنتاج الحركة.");error.name="AbortError";throw error}}
function extractPayload(response){
 if(response&&typeof response==="object"&&!Array.isArray(response)&&typeof response.text==="string")response=response.text;
 if(typeof response==="string"){
  if(response.length>32*1024*1024)fail("استجابة مزوّد الرسم تتجاوز 32 ميغابايت.");
  try{return JSON.parse(response)}catch{fail("لم يُرجع المزوّد JSON صالحاً لدفعة الرسوم.")}
 }
 if(!response||typeof response!=="object"||Array.isArray(response))fail("استجابة مزوّد الرسم يجب أن تكون كائن دفعة JSON.");
 return response;
}
export async function runAnimationProduction(project,provider,{maxBatches=1,maxRetries=1,signal,onBatch}={}){
 if(!project||!project.animationProduction)fail("ابدأ خطة إنتاج الحركة داخل المشروع أولاً.");
 if(typeof provider!=="function")fail("يجب توفير موصل رسم متوافق مع واجهة ZERO STUDIO.");
 if(!Number.isInteger(maxBatches)||maxBatches<1||maxBatches>1000)fail("عدد الدفعات في التشغيل الواحد يجب أن يكون بين 1 و1000.");
 if(!Number.isInteger(maxRetries)||maxRetries<0||maxRetries>3)fail("عدد المحاولات الإضافية يجب أن يكون بين 0 و3.");
 const accepted=[];
 for(let count=0;count<maxBatches;count++){
  abort(signal);
  const job=project.animationProduction;
  if(job.completedFrames>=job.totalFrames)break;
  const range=getAnimationBatchRange(job);
  let lastError=null,lastErrorTransient=false,done=false;
  for(let attempt=0;attempt<=maxRetries&&!done;attempt++){
   abort(signal);
   const prompt=createAnimationBatchPrompt(job);
   const correction=lastError&&!lastErrorTransient?"\n\nCORRECTION REQUIRED AFTER THE LAST REJECTED RESPONSE: "+lastError+" Return the entire exact next batch again, with all required full-scene frames and the continuityNote. Do not omit frames or change their indexes.": "";
   let result;
   try{
    const response=await provider({prompt:prompt+correction,jobId:job.id,batchIndex:range.batchIndex,startFrame:range.startFrame,frameCount:range.frameCount,fps:job.fps,responseFormat:"json",attempt:attempt+1,signal});
    abort(signal);
    const payload=extractPayload(response);
    result=appendAnimationBatch(project,payload);
    accepted.push(result);
    done=true;
   }catch(error){
    if(error?.name==="AbortError"||signal?.aborted)throw error;
    lastError=String(error?.message||error).slice(0,1000);
    lastErrorTransient=/\\b(?:429|500|502|503|504)\\b/.test(lastError);
    if(attempt===maxRetries)throw Error("تعذر إنتاج الدفعة "+(range.batchIndex+1)+" بعد "+(attempt+1)+" محاولات: "+lastError);
    if(lastErrorTransient){
     const delayMs=Math.min(20000,5000*(2**attempt));
     await new Promise(resolve=>setTimeout(resolve,delayMs));
     abort(signal);
    }
   }
   if(done&&typeof onBatch==="function"){
    try{await onBatch({jobId:job.id,...result})}
    catch(error){throw Error("قُبلت الدفعة "+(range.batchIndex+1)+" وأضيفت إلى المشروع، لكن تعذر حفظ نقطة الاستكمال: "+String(error?.message||error).slice(0,500)+". احفظ ملف .zero قبل المتابعة.")}
   }
  }
 }
 const job=project.animationProduction;
 return{acceptedBatches:accepted.length,addedFrames:accepted.reduce((sum,item)=>sum+item.addedFrames,0),completedFrames:job.completedFrames,totalFrames:job.totalFrames,remainingBatches:job.batchCount-job.nextBatchIndex,complete:job.completedFrames===job.totalFrames,batches:accepted};
}
