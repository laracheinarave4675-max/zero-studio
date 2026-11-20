const WALK_KEYS=Object.freeze([
 {id:"contact-left",frame:0,beat:"left-foot-contact",weight:"left",description:"Left foot reaches forward and plants; right foot trails behind; pelvis slightly forward; torso counter-rotates."},
 {id:"down-left",frame:6,beat:"down-compression",weight:"left",description:"Body lowers over the planted left foot; knee compresses; head settles; trailing heel lifts."},
 {id:"passing",frame:12,beat:"passing-position",weight:"center",description:"Right leg passes beneath the body; pelvis crosses support; arms counter-swing; torso remains balanced."},
 {id:"up-right",frame:18,beat:"up-recovery",weight:"right",description:"Body rises into the next step; right foot prepares to contact; hair and loose cloth follow with a slight delay."}
]);
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export function createAnimeMotionSheet({action="walk",durationSeconds=1,fps=24}={}){
 if(action!=="walk")throw Error("The first raster proof currently supports only the approved walk action.");
 if(!Number.isFinite(durationSeconds)||durationSeconds!==1)throw Error("The first proof is fixed to exactly one second.");
 if(!Number.isInteger(fps)||fps!==24)throw Error("The first proof is fixed to 24 FPS.");
 const totalFrames=durationSeconds*fps;
 const keyframes=WALK_KEYS.map((key,index)=>({...key,timeSeconds:key.frame/fps,holdFrames:1,source:"full-raster-key-drawing"}));
 return Object.freeze({version:1,action,durationSeconds,fps,totalFrames,distinctDrawingTarget:24,interpolation:"anime-aware-raster-inbetween",keyframes,frames:Array.from({length:totalFrames},(_,frame)=>({index:frame,timeSeconds:frame/fps,keyframe:keyframes.find(k=>k.frame===frame)?.id??null,segment:Math.min(3,Math.floor(frame/(totalFrames/4))),progress:(frame%(totalFrames/4))/(totalFrames/4)}))});
}
export function validateAnimeMotionSheet(sheet){
 if(!sheet||sheet.version!==1||sheet.action!=="walk"||sheet.fps!==24||sheet.totalFrames!==24||sheet.distinctDrawingTarget!==24)throw Error("Anime motion sheet does not meet the 24-distinct-raster-frame proof contract.");
 if(!Array.isArray(sheet.keyframes)||sheet.keyframes.length!==4||!Array.isArray(sheet.frames)||sheet.frames.length!==24)throw Error("Anime motion sheet must contain four key drawings and 24 frame slots.");
 const indices=sheet.keyframes.map(k=>k.frame);
 if(indices.some((v,i)=>!Number.isInteger(v)||v<0||v>23||(i&&v<=indices[i-1])))throw Error("Key drawings must be strictly ordered within the one-second shot.");
 if(sheet.keyframes.some(k=>k.source!=="full-raster-key-drawing"))throw Error("Every key pose must be a complete raster drawing, not a rig or SVG path set.");
 return true;
}
export function getMotionSegment(sheet,frameIndex){
 validateAnimeMotionSheet(sheet);
 if(!Number.isInteger(frameIndex)||frameIndex<0||frameIndex>=sheet.totalFrames)throw Error("Frame index is outside the motion sheet.");
 const keys=sheet.keyframes;let left=keys[0],right=keys[keys.length-1];
 for(let i=0;i<keys.length-1;i++){if(frameIndex>=keys[i].frame&&frameIndex<keys[i+1].frame){left=keys[i];right=keys[i+1];break;}}
 const span=right.frame-left.frame;
 return {leftKeyframe:left.id,rightKeyframe:right.id,progress:span?clamp((frameIndex-left.frame)/span,0,1):0};
}
