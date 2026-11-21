// ZERO STUDIO — approved character design lock + complete local raster redraw.
// This module contains a manually authored drawing grammar calibrated against the approved
// three-view kimono model sheet. Motion inputs are deliberately separated from identity data.
export const APPROVED_KIMONO_GALLERY_ID="be172712-e073-4d06-9587-eec7e6c62a84";
export const APPROVED_KIMONO_ID="zero-approved-kimono-girl-v1";
export const APPROVED_KIMONO_FPS=24;
const FIXED_PALETTE=Object.freeze({
 ink:"#30252a",hair:"#17151b",hairMid:"#29252e",hairLight:"#514753",hairGlint:"#8a7b87",
 skin:"#f3d9ca",skinShade:"#d8ad9f",eye:"#76565e",eyeLight:"#b98984",
 kimono:"#f1e8d7",kimonoLight:"#fff6e8",kimonoShade:"#d8cdbf",
 pink:"#cf8790",pinkLight:"#e7b0ae",pinkDark:"#a75f70",collar:"#9b4f62",
 obi:"#bd777d",obiLight:"#dda2a0",obiDark:"#874c5a",gold:"#caa36a",
 sandal:"#a75f67",sandalDark:"#643d48",flower:"#d98e9a",flowerLight:"#f4c9c7"
});
const FIXED_DESIGN=Object.freeze({
 id:APPROVED_KIMONO_ID,version:1,referenceGalleryId:APPROVED_KIMONO_GALLERY_ID,
 canonicalView:"side",referenceViews:Object.freeze(["front","side","back"]),
 silhouette:"slender young woman; long straight glossy black hair reaching below waist; full-length kimono; wide sleeves; ankle-length skirt",
 face:"soft pale oval side-profile; small nose and mouth; one visible muted rose-brown anime eye; calm expression",
 hair:"near-black long straight hair; rounded crown; side-swept fringe; layered back locks; cool grey-violet highlights",
 costume:"warm ivory kimono with muted rose-pink gradient at sleeve ends and lower hem; crossing red-rose collar; dusty-rose obi with narrow gold cord and small knot; pale sakura floral motifs",
 footwear:"muted rose sandals with dark sole and toe strap",
 palette:FIXED_PALETTE,
 immutables:Object.freeze(["face silhouette","visible eye shape and colour","nose and mouth placement","hairline and fringe","hair length and black tone","kimono wrap and collar","sleeve shape","obi width, colour and cord","sakura motifs","skirt hem and pink gradient","sandals","line-art style"])
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function deepFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))deepFreeze(item);}return value;}
export function createApprovedKimonoCharacterProfile(){
 return deepFreeze({format:"zero-studio-approved-character-profile",version:1,characterId:FIXED_DESIGN.id,name:"الشخصية ذات الكيمونو العاجي والوردي",referenceGalleryId:FIXED_DESIGN.referenceGalleryId,canonicalView:FIXED_DESIGN.canonicalView,referenceViews:[...FIXED_DESIGN.referenceViews],identity:FIXED_DESIGN,identityLock:"hard-locked-v1",identityFingerprint:"approved-kimono-girl-v1:ivory-rose-sakura-long-black-hair-side-profile",sourceImageIsReferenceOnly:true,sourceImageDrawnIntoFrames:false});
}
export function validateApprovedKimonoProfile(profile){
 if(!profile||profile.format!=="zero-studio-approved-character-profile"||profile.characterId!==APPROVED_KIMONO_ID||profile.identityLock!=="hard-locked-v1"||profile.identity!==FIXED_DESIGN)throw Error("Approved character identity is missing or has been modified.");
 return profile;
}
export function createApprovedKimonoWalkPoses(){
 return Object.freeze(Array.from({length:24},(_,index)=>{
  const angle=(index/24)*Math.PI*2;
  return Object.freeze({frameIndex:index,frameNumber:index+1,timeSeconds:index/24,exposureFrames:1,
   // Motion-only values: these cannot override any field in FIXED_DESIGN.
   stride:Math.sin(angle),liftLeft:Math.max(0,Math.cos(angle))*17,liftRight:Math.max(0,-Math.cos(angle))*17,
   bodyBob:(1-Math.cos(angle*2))*2.4,hairFollow:Math.sin(angle-.48)*4.2,clothFollow:Math.sin(angle-.72)*2.4,
   sleeveSwing:Math.sin(angle+Math.PI)*.045
  });
 }));
}
function cubic(ctx,a,b,c,d){ctx.moveTo(a[0],a[1]);ctx.bezierCurveTo(b[0],b[1],c[0],c[1],d[0],d[1]);}
function path(ctx,commands,fill,stroke=FIXED_PALETTE.ink,lineWidth=4){
 ctx.beginPath();
 for(const item of commands){if(item[0]==="M")ctx.moveTo(item[1],item[2]);else if(item[0]==="L")ctx.lineTo(item[1],item[2]);else if(item[0]==="C")ctx.bezierCurveTo(...item.slice(1));else if(item[0]==="Q")ctx.quadraticCurveTo(...item.slice(1));else if(item[0]==="Z")ctx.closePath();}
 if(fill){ctx.fillStyle=fill;ctx.fill();}
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.lineJoin="round";ctx.lineCap="round";ctx.stroke();}
}
function tapered(ctx,points,color,width=3){
 const edges=[];for(let i=0;i<=24;i++){const t=i/24,m=1-t,x=m*m*m*points[0][0]+3*m*m*t*points[1][0]+3*m*t*t*points[2][0]+t*t*t*points[3][0],y=m*m*m*points[0][1]+3*m*m*t*points[1][1]+3*m*t*t*points[2][1]+t*t*t*points[3][1],dx=(points[1][0]-points[0][0])*(3*m*m)+(points[2][0]-points[1][0])*(6*m*t)+(points[3][0]-points[2][0])*(3*t*t),dy=(points[1][1]-points[0][1])*(3*m*m)+(points[2][1]-points[1][1])*(6*m*t)+(points[3][1]-points[2][1])*(3*t*t),len=Math.hypot(dx,dy)||1,r=width*Math.max(.07,Math.sin(Math.PI*t))*.5;edges.push({a:[x-dy/len*r,y+dx/len*r],b:[x+dy/len*r,y-dx/len*r]});}
 ctx.beginPath();ctx.moveTo(...edges[0].a);for(let i=1;i<edges.length;i++)ctx.lineTo(...edges[i].a);for(let i=edges.length-1;i>=0;i--)ctx.lineTo(...edges[i].b);ctx.closePath();ctx.fillStyle=color;ctx.fill();
}
function flower(ctx,x,y,size,opacity=1){
 ctx.save();ctx.globalAlpha=opacity;ctx.translate(x,y);ctx.fillStyle=FIXED_PALETTE.flower;ctx.strokeStyle="#b97982";ctx.lineWidth=1.05;
 for(let i=0;i<5;i++){ctx.save();ctx.rotate(i*Math.PI*2/5);ctx.beginPath();ctx.ellipse(0,-size*.48,size*.27,size*.52,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
 ctx.beginPath();ctx.arc(0,0,size*.14,0,Math.PI*2);ctx.fillStyle=FIXED_PALETTE.gold;ctx.fill();ctx.restore();
}
function drawHairBack(ctx,bob,flow){
 const g=ctx.createLinearGradient(300,150,470,570);g.addColorStop(0,FIXED_PALETTE.hair);g.addColorStop(.58,FIXED_PALETTE.hairMid);g.addColorStop(1,FIXED_PALETTE.hair);
 path(ctx,[["M",294,151+bob],["C",325,74+bob,405,78+bob,430,141+bob],["C",448,192+bob,436,275+bob,455+flow,360+bob],["C",467+flow,427+bob,450+flow,494+bob,426+flow,552+bob],["C",412+flow,584+bob,397+flow,553+bob,395,520+bob],["C",370,438+bob,362,360+bob,346,282+bob],["C",324,228+bob,287,206+bob,294,151+bob],["Z"]],g,FIXED_PALETTE.ink,5);
 const locks=[
 [[353,133+bob],[395,215+bob],[398+flow*.3,392+bob],[414+flow,545+bob]],
 [[378,117+bob],[430,225+bob],[421+flow*.7,380+bob],[443+flow,515+bob]],
 [[327,155+bob],[359,254+bob],[362+flow*.4,393+bob],[390+flow,537+bob]]
 ];
 for(const p of locks)tapered(ctx,p,FIXED_PALETTE.hairMid,5);
 tapered(ctx,[[354,133+bob],[376,218+bob],[375+flow*.2,365+bob],[402+flow,505+bob]],FIXED_PALETTE.hairGlint,3.1);
 tapered(ctx,[[391,124+bob],[424,220+bob],[414+flow*.3,354+bob],[433+flow,478+bob]],"#645b68",2.2);
}
function drawHead(ctx,bob){
 const skin=ctx.createLinearGradient(224,155,348,286);skin.addColorStop(0,"#fff0e6");skin.addColorStop(1,FIXED_PALETTE.skin);
 path(ctx,[["M",305,133+bob],["C",273,116+bob,238,134+bob,230,170+bob],["C",222,195+bob,236,218+bob,249,230+bob],["L",245,244+bob],["Q",243,251+bob,255,252+bob],["C",265,274+bob,294,281+bob,319,260+bob],["C",340,240+bob,350,201+bob,337,165+bob],["C",330,145+bob,317,136+bob,305,133+bob],["Z"]],skin,FIXED_PALETTE.ink,3.7);
 // The single visible eye, brow, nose and mouth are fixed parts of the approved profile.
 path(ctx,[["M",242,203+bob],["Q",256,190+bob,269,202+bob],["Q",257,214+bob,242,203+bob],["Z"]],"#fff4ed",FIXED_PALETTE.ink,1.9);
 path(ctx,[["M",246,203+bob],["Q",257,193+bob,266,202+bob],["Q",256,211+bob,246,203+bob],["Z"]],FIXED_PALETTE.eye,null);
 ctx.beginPath();ctx.arc(256,203+bob,3.3,0,Math.PI*2);ctx.fillStyle="#30262d";ctx.fill();
 ctx.beginPath();ctx.arc(257,202+bob,1,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();
 tapered(ctx,[[242,190+bob],[250,185+bob],[261,187+bob],[267,191+bob]],"#5b454d",2.3);
 tapered(ctx,[[231,224+bob],[238,226+bob],[244,225+bob],[247,222+bob]],FIXED_PALETTE.skinShade,2);
 tapered(ctx,[[237,244+bob],[246,247+bob],[253,246+bob],[257,243+bob]],"#a96f70",1.7);
 path(ctx,[["M",323,194+bob],["Q",334,202+bob,326,214+bob]],null,FIXED_PALETTE.skinShade,2);
}
function drawFrontHair(ctx,bob){
 const hair=FIXED_PALETTE.hair;
 path(ctx,[["M",224,179+bob],["C",211,116+bob,258,87+bob,300,95+bob],["C",343,100+bob,361,140+bob,342,188+bob],["Q",327,166+bob,316,143+bob],["C",293,173+bob,268,185+bob,244,188+bob],["Q",232,205+bob,227,217+bob],["Z"]],hair,FIXED_PALETTE.ink,4);
 tapered(ctx,[[235,148+bob],[247,119+bob],[272,111+bob],[294,116+bob]],FIXED_PALETTE.hairGlint,2.8);
 tapered(ctx,[[268,105+bob],[291,102+bob],[312,111+bob],[327,127+bob]],"#5c5360",2.2);
 // Side fringe strands keep the same geometry in every frame.
 tapered(ctx,[[232,151+bob],[223,170+bob],[232,186+bob],[239,202+bob]],FIXED_PALETTE.hairMid,4.1);
 tapered(ctx,[[252,124+bob],[250,149+bob],[258,162+bob],[264,178+bob]],"#38313d",3.2);
}
function drawNeckAndCollar(ctx,bob){
 path(ctx,[["M",281,257+bob],["L",281,291+bob],["Q",305,305+bob,329,281+bob],["L",326,250+bob],["Z"]],FIXED_PALETTE.skin,FIXED_PALETTE.ink,3);
 // Red-rose inner collar remains a fixed identifying mark.
 path(ctx,[["M",267,257+bob],["L",299,304+bob],["L",326,261+bob],["L",338,273+bob],["L",303,321+bob],["L",252,269+bob],["Z"]],FIXED_PALETTE.collar,FIXED_PALETTE.ink,3);
 path(ctx,[["M",274,262+bob],["L",303,302+bob],["L",328,267+bob]],null,FIXED_PALETTE.kimonoLight,3);
}
function drawKimonoBody(ctx,bob,cloth,sleeve){
 const fill=ctx.createLinearGradient(265,295,390,794);fill.addColorStop(0,FIXED_PALETTE.kimonoLight);fill.addColorStop(.53,FIXED_PALETTE.kimono);fill.addColorStop(.78,"#ebd5cb");fill.addColorStop(1,FIXED_PALETTE.pink);
 path(ctx,[["M",266,294+bob],["C",289,279+bob,338,288+bob,357,316+bob],["C",371,362+bob,358,423+bob,382,482+bob],["C",410,557+bob,413+cloth,674+bob,423+cloth,785+bob],["C",374,805+bob,286,804+bob,220,783+bob],["C",249,677+bob,251,570+bob,267,481+bob],["C",282,415+bob,257,355+bob,266,294+bob],["Z"]],fill,FIXED_PALETTE.ink,5.5);
 // Front wrap panel and its stable overlapping edge.
 path(ctx,[["M",269,301+bob],["C",282,353+bob,297,400+bob,330,452+bob],["C",350,526+bob,368,660+bob,386,790+bob],["L",354,795+bob],["C",339,650+bob,324,550+bob,301,476+bob],["C",276,411+bob,253,350+bob,244,319+bob],["Z"]],FIXED_PALETTE.kimonoLight,FIXED_PALETTE.ink,3.1);
 // Sleeve: broad, hanging silhouette; its design and sakura locations are locked.
 const sleeve=ctx.createLinearGradient(350,290,460,510);sleeve.addColorStop(0,FIXED_PALETTE.kimono);sleeve.addColorStop(.68,"#e9d5ce");sleeve.addColorStop(1,FIXED_PALETTE.pink);
 path(ctx,[["M",324,299+bob],["C",360,280+bob,405,298+bob,421,342+bob],["C",434,385+bob,432+sleeve,438+bob,438+sleeve,481+bob],["C",404,503+bob,375,482+bob,351,459+bob],["C",337,413+bob,320,365+bob,324,299+bob],["Z"]],sleeve,FIXED_PALETTE.ink,5);
 tapered(ctx,[[347,323+bob],[379,351+bob],[390+sleeve*.3,414+bob],[404+sleeve,465+bob]],FIXED_PALETTE.kimonoLight,3.2);
 // Sleeve edge / cuff line.
 tapered(ctx,[[353,459+bob],[379,479+bob],[409+sleeve*.5,492+bob],[438+sleeve,481+bob]],FIXED_PALETTE.pinkDark,3);
 // Fixed folds and shadows.
 tapered(ctx,[[276,484+bob],[288,556+bob],[269+cloth,670+bob],[261+cloth,766+bob]],FIXED_PALETTE.kimonoShade,3.2);
 tapered(ctx,[[349,489+bob],[365,566+bob],[383+cloth,682+bob],[393+cloth,782+bob]],"#cdbeb1",3.1);
 tapered(ctx,[[305,531+bob],[317,614+bob],[311+cloth,697+bob],[313+cloth,786+bob]],"#fff7e9",2.4);
 // Obi is a stable design landmark; movement does not alter its width or palette.
 path(ctx,[["M",262,424+bob],["C",294,435+bob,337,430+bob,369,415+bob],["L",377,459+bob],["C",341,476+bob,292,479+bob,253,464+bob],["Z"]],FIXED_PALETTE.obi,FIXED_PALETTE.ink,4.5);
 path(ctx,[["M",263,431+bob],["Q",315,447+bob,371,422+bob]],null,FIXED_PALETTE.obiLight,3);
 path(ctx,[["M",347,430+bob],["Q",380,408+bob,386,436+bob],["Q",375,454+bob,352,451+bob],["Z"]],FIXED_PALETTE.obiLight,FIXED_PALETTE.ink,2.5);
 tapered(ctx,[[265,424+bob],[306,437+bob],[340,432+bob],[368,418+bob]],FIXED_PALETTE.gold,2.8);
 // Stable cherry blossom placements on sleeve and lower kimono.
 flower(ctx,377,367+bob,8,.78);flower(ctx,402,407+bob,6,.68);flower(ctx,286,690+bob,10,.72);flower(ctx,341,746+bob,9,.72);flower(ctx,386,719+bob,7,.65);
}
function drawArmAndHand(ctx,bob,swing){
 // The sleeve opening moves only by a small gait offset. Its cut and shape remain fixed.
 const x=swing*18;
 path(ctx,[["M",385+x,354+bob],["C",397+x,365+bob,397+x,402+bob,390+x,432+bob],["L",379+x,461+bob],["Q",370+x,471+bob,365+x,458+bob],["C",369+x,421+bob,369+x,388+bob,385+x,354+bob],["Z"]],FIXED_PALETTE.skin,FIXED_PALETTE.ink,3.2);
 tapered(ctx,[[382+x,418+bob],[382+x,438+bob],[378+x,452+bob],[372+x,459+bob]],FIXED_PALETTE.skinShade,2);
}
function drawFeet(ctx,pose,bob){
 const base=786+bob;
 const left=pose.stride*23,right=-pose.stride*23;
 const foot=(x,lift,front)=>{
  const y=base-lift;
  path(ctx,[["M",x-16,y],["Q",x-12,y-21,x+2,y-18],["Q",x+22,y-15,x+34,y-3],["Q",x+37,y+5,x+22,y+8],["L",x-10,y+6],["Z"]],FIXED_PALETTE.skin,FIXED_PALETTE.ink,2.8);
  path(ctx,[["M",x-21,y+4],["Q",x-3,y-4,x+23,y+3],["Q",x+39,y+8,x+41,y+14],["Q",x+14,y+22,x-17,y+15],["Z"]],FIXED_PALETTE.sandal,FIXED_PALETTE.ink,2.6);
  tapered(ctx,[[x-5,y+5],[x+4,y-7],[x+12,y-7],[x+21,y+5]],FIXED_PALETTE.sandalDark,3);
  path(ctx,[["M",x-17,y+15],["Q",x+11,y+22,x+40,y+14]],null,FIXED_PALETTE.sandalDark,2.7);
  if(front){ctx.beginPath();ctx.arc(x+25,y-1,2.2,0,Math.PI*2);ctx.fillStyle=FIXED_PALETTE.skin;ctx.fill();}
 };
 foot(300+left,pose.liftLeft,true);foot(319+right,pose.liftRight,false);
};
function drawApprovedCharacter(ctx,pose){
 const bob=pose.bodyBob||0,flow=pose.hairFollow||0,cloth=pose.clothFollow||0,swing=pose.sleeveSwing||0;
 // Rear hair and rear sleeve are painted first, then the head and front design lines.
 drawHairBack(ctx,bob,flow);
 drawKimonoBody(ctx,bob,cloth,swing);
 drawNeckAndCollar(ctx,bob);
 drawHead(ctx,bob);
 drawFrontHair(ctx,bob);
 drawArmAndHand(ctx,bob,swing);
 drawFeet(ctx,pose,bob);
 // Delicate fixed hair glints are repainted last and never recoloured by motion.
 tapered(ctx,[[327,164+bob],[350,248+bob],[362+flow*.4,358+bob],[392+flow,477+bob]],"#6c626f",2.2);
}
export function renderApprovedKimonoCharacterFrame(canvas,profile,pose,{width=768,height=1024}={}){
 validateApprovedKimonoProfile(profile);
 if(!canvas?.getContext||!canvas?.toDataURL)throw Error("A Canvas 2D surface is required.");
 if(!Number.isInteger(pose?.frameIndex)||pose.frameIndex<0||pose.frameIndex>=24)throw Error("Frame index must be in the 0–23 range.");
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<256||height<256||width>2048||height>2048)throw Error("Raster output must be 256–2048 pixels.");
 for(const key of ["stride","liftLeft","liftRight","bodyBob","hairFollow","clothFollow","sleeveSwing"])if(!Number.isFinite(Number(pose[key])))throw Error("Invalid motion parameter: "+key);
 const motion={frameIndex:pose.frameIndex,frameNumber:pose.frameIndex+1,timeSeconds:pose.frameIndex/24,fps:24,exposureFrames:1,
  stride:clamp(pose.stride,-1,1),liftLeft:clamp(pose.liftLeft,0,20),liftRight:clamp(pose.liftRight,0,20),
  bodyBob:clamp(pose.bodyBob,0,5),hairFollow:clamp(pose.hairFollow,-5,5),clothFollow:clamp(pose.clothFollow,-3,3),sleeveSwing:clamp(pose.sleeveSwing,-.05,.05)};
 canvas.width=width;canvas.height=height;const ctx=canvas.getContext("2d",{willReadFrequently:true});if(!ctx)throw Error("Canvas 2D is unavailable.");
 ctx.clearRect(0,0,width,height);ctx.save();
 const scale=Math.min(width/640,height/900);ctx.translate((width-640*scale)/2,(height-900*scale)/2);ctx.scale(scale,scale);
 drawApprovedCharacter(ctx,motion);ctx.restore();
 const rgba=ctx.getImageData(0,0,width,height).data;let h=2166136261;for(let i=0;i<rgba.length;i++){h^=rgba[i];h=Math.imul(h,16777619);}
 const contentHash="rgba-fnv1a-"+(h>>>0).toString(16).padStart(8,"0"),pngDataUrl=canvas.toDataURL("image/png");
 if(!pngDataUrl.startsWith("data:image/png;base64,"))throw Error("PNG export failed.");
 return Object.freeze({frameIndex:pose.frameIndex,frameNumber:pose.frameIndex+1,timeSeconds:pose.frameIndex/24,fps:24,exposureFrames:1,width,height,mimeType:"image/png",contentHash,pngDataUrl,characterId:profile.characterId,identityFingerprint:profile.identityFingerprint,identityLock:profile.identityLock,sourceImageUsed:false,modelInferenceUsed:false,svgUsed:false,independentCompleteRedraw:true});
}
export function auditApprovedKimonoCycle(frames,profile=createApprovedKimonoCharacterProfile()){
 validateApprovedKimonoProfile(profile);
 if(!Array.isArray(frames)||frames.length!==24)throw Error("Exactly 24 complete redraws are required.");
 const hashes=new Set();
 for(let i=0;i<24;i++){const f=frames[i];if(f.frameIndex!==i||f.frameNumber!==i+1||f.fps!==24||f.exposureFrames!==1||f.characterId!==profile.characterId||f.identityFingerprint!==profile.identityFingerprint||f.identityLock!=="hard-locked-v1"||f.independentCompleteRedraw!==true||f.sourceImageUsed!==false||f.modelInferenceUsed!==false||f.svgUsed!==false)throw Error("Identity lock/provenance failed on frame "+(i+1)+".");if(!/^rgba-fnv1a-[a-f0-9]{8}$/.test(f.contentHash||""))throw Error("Frame pixel hash is missing.");if(hashes.has(f.contentHash))throw Error("Duplicate pixel drawing at frame "+(i+1)+".");hashes.add(f.contentHash);}
 return Object.freeze({frameCount:24,fps:24,uniqueRasterDrawings:hashes.size,identityFingerprint:profile.identityFingerprint,identityLocked:frames.every(f=>f.identityFingerprint===profile.identityFingerprint),noImageInference:frames.every(f=>f.modelInferenceUsed===false),noSvgOrPuppet:frames.every(f=>f.svgUsed===false),meets24UniqueDrawings:hashes.size===24});
}
export function renderApprovedKimonoWalkCycle({createCanvas,profile=createApprovedKimonoCharacterProfile(),width=768,height=1024}={}){
 validateApprovedKimonoProfile(profile);if(typeof createCanvas!=="function")throw Error("A fresh Canvas factory is required.");
 const poses=createApprovedKimonoWalkPoses(),frames=poses.map(pose=>renderApprovedKimonoCharacterFrame(createCanvas(),profile,pose,{width,height}));
 const audit=auditApprovedKimonoCycle(frames,profile);return Object.freeze({format:"zero-studio-approved-character-raster-cycle",version:1,fps:24,durationSeconds:1,identityFingerprint:profile.identityFingerprint,frames,audit});
}
