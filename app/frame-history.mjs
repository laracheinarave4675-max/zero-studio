const clone=value=>JSON.parse(JSON.stringify(value));
function metadata(project,includeCharacterLibrary=false){return{animationProduction:project.animationProduction?clone(project.animationProduction):null,fps:project.fps,includeCharacterLibrary, ...(includeCharacterLibrary?{characterLibrary:clone(project.characterLibrary||[])}:{})}}
export function captureFrameHistory(project,index,{includeCharacterLibrary=false}={}){
 if(!project||!Array.isArray(project.frames)||!Number.isInteger(index)||index<0||index>=project.frames.length)throw Error("موضع سجل الإطار غير صالح.");
 return{kind:"zero-frame-history",mode:"before",index,frameCount:project.frames.length,frame:clone(project.frames[index]),...metadata(project,includeCharacterLibrary)};
}
export function captureFrameHistoryAfter(project,before){
 if(!before||before.kind!=="zero-frame-history"||before.mode!=="before")throw Error("لقطة التراجع غير صالحة.");
 const delta=project.frames.length-before.frameCount,index=before.index;
 if(delta>0)return{kind:"zero-frame-history",mode:"after-insert",index,frameCount:project.frames.length,frameAtIndex:clone(project.frames[index]),insertedFrames:clone(project.frames.slice(index+1,index+1+delta)),...metadata(project,before.includeCharacterLibrary)};
 if(delta<0)return{kind:"zero-frame-history",mode:"after-delete",index,frameCount:project.frames.length,deletedCount:-delta,...metadata(project,before.includeCharacterLibrary)};
 return{kind:"zero-frame-history",mode:"after-replace",index,frameCount:project.frames.length,frameAtIndex:clone(project.frames[index]),...metadata(project,before.includeCharacterLibrary)};
}
export function applyFrameHistory(project,entry){
 if(!project||!Array.isArray(project.frames)||entry?.kind!=="zero-frame-history"||!Number.isInteger(entry.index)||entry.index<0)throw Error("بيانات التراجع على مستوى الإطار غير صالحة.");
 const index=entry.index;
 if(entry.mode==="before"){
  const delta=project.frames.length-entry.frameCount;
  if(delta>0){project.frames.splice(index+1,delta);project.frames[index]=clone(entry.frame)}
  else if(delta<0){project.frames.splice(index,0,clone(entry.frame))}
  else project.frames[index]=clone(entry.frame);
 }else if(entry.mode==="after-insert"){
  if(!Array.isArray(entry.insertedFrames)||entry.insertedFrames.length!==entry.frameCount-(project.frames.length))throw Error("سجل الإطارات المضافة غير متطابق.");
  project.frames[index]=clone(entry.frameAtIndex);
  project.frames.splice(index+1,0,...clone(entry.insertedFrames));
 }else if(entry.mode==="after-delete"){
  if(!Number.isInteger(entry.deletedCount)||entry.deletedCount<1||project.frames.length-entry.deletedCount<1)throw Error("عدد الإطارات المحذوفة غير صالح.");
  project.frames.splice(index,entry.deletedCount);
 }else if(entry.mode==="after-replace"){
  project.frames[index]=clone(entry.frameAtIndex);
 }else throw Error("نوع عملية التراجع غير معروف.");
 project.animationProduction=entry.animationProduction?clone(entry.animationProduction):null;
 project.fps=entry.fps;
 if(entry.includeCharacterLibrary)project.characterLibrary=clone(entry.characterLibrary||[]);
 return project;
}
