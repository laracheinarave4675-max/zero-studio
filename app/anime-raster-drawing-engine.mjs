// ZERO STUDIO — local procedural raster drawing proof. No model inference, SVG, or source-image deformation.
export const ANIME_RASTER_DRAWING_FPS=24;
export const ANIME_RASTER_DRAWING_FRAME_COUNT=24;
const DEFAULT_PALETTE={ink:"#30252a",hair:"#211b24",hairLight:"#51404b",skin:"#f2d7c8",skinShade:"#d7a99d",kimono:"#eee0d7",kimonoShade:"#d7c3bb",obi:"#b66d7d",obiLight:"#d99ba6",accent:"#a85f70",sandal:"#55424a",sole:"#2c242a"};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=(n,d)=>Number.isFinite(Number(n))?Number(n):d;
export function createAnimeRasterCharacterProfile(input={}){
 const palette={...DEFAULT_PALETTE,...(input.palette||{})};
 for(const [key,value] of Object.entries(palette))if(!/^#[0-9a-f]{6}$/i.test(String(value)))throw Error("Invalid six-digit colour for "+key+".");
 return Object.freeze({format:"zero-studio-raster-character-profile",version:1,name:String(input.name||"Procedural kimono study").slice(0,100),view:"side",palette:Object.freeze(palette),proportions:Object.freeze({head:clamp(finite(input.proportions?.head,1),.85,1.15),hair:clamp(finite(input.proportions?.hair,1),.75,1.25)}),sourceImageUsed:false});
}
export function createAnimeRasterWalkCycle({profile=createAnimeRasterCharacterProfile(),fps=24}={}){
 if(profile?.format!=="zero-studio-raster-character-profile"||fps!==24)throw Error("A valid character profile and 24 FPS are required.");
 return Object.freeze(Array.from({length:24},(_,i)=>{
  const phase=i/24*Math.PI*2,s=Math.sin(phase),c=Math.cos(phase);
  return Object.freeze({frameIndex:i,frameNumber:i+1,timeSeconds:i/24,exposureFrames:1,phase,stride:s,back:-s,bob:(1-Math.cos(2*phase))*5.5,footA:s*52,footB:-s*52,liftA:Math.max(0,c)*27,liftB:Math.max(0,-c)*27,arm:Math.sin(phase+Math.PI)*.22,hair:Math.sin(phase-.45)*11,cloth:Math.sin(phase-.7)*7});
 }));
}
function cubic(a,b,c,d,t){const m=1-t;return{x:m*m*m*a.x+3*m*m*t*b.x+3*m*t*t*c.x+t*t*t*d.x,y:m*m*m*a.y+3*m*m*t*b.y+3*m*t*t*c.y+t*t*t*d.y};}
export function drawTaperedRasterStroke(ctx,points,{color="#30252a",width=6,taper=.85}={}){
 if(!ctx||!Array.isArray(points)||points.length!==4)throw Error("A cubic brush stroke needs four points.");
 const edge=[];for(let i=0;i<=28;i++){const t=i/28,p=cubic(...points,t),a=cubic(...points,Math.max(0,t-.002)),b=cubic(...points,Math.min(1,t+.002)),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,r=width*Math.max(.08,Math.pow(Math.sin(Math.PI*t),taper))/2,nx=-dy/len,ny=dx/len;edge.push({l:{x:p.x+nx*r,y:p.y+ny*r},r:{x:p.x-nx*r,y:p.y-ny*r}});}
 ctx.beginPath();ctx.moveTo(edge[0].l.x,edge[0].l.y);for(let i=1;i<edge.length;i++)ctx.lineTo(edge[i].l.x,edge[i].l.y);for(let i=edge.length-1;i>=0;i--)ctx.lineTo(edge[i].r.x,edge[i].r.y);ctx.closePath();ctx.fillStyle=color;ctx.fill();
}
function shape(ctx,build,fill,stroke,width=5){ctx.beginPath();build(ctx);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.lineJoin="round";ctx.lineCap="round";ctx.stroke();}}
function ink(ctx,pts,color,width){drawTaperedRasterStroke(ctx,pts,{color,width});}
function leg(ctx,hip,offset,lift,p){
 const knee=hip+offset*.44,ankle=hip+offset,ky=750-lift*.35,ay=860-lift;
 shape(ctx,g=>{g.moveTo(hip-15,642);g.quadraticCurveTo(knee-20,ky-18,knee-10,ky+4);g.quadraticCurveTo(ankle-16,ay-12,ankle-10,ay);g.lineTo(ankle+14,ay+4);g.quadraticCurveTo(knee+18,ky+12,hip+16,661);g.closePath();},p.skin,p.ink,4.5);
 ink(ctx,[{x:knee-5,y:ky+8},{x:knee+3,y:ky+35},{x:ankle-2,y:ay-40},{x:ankle+3,y:ay-5}],p.skinShade,3);
 shape(ctx,g=>{g.moveTo(ankle-17,ay+9);g.quadraticCurveTo(ankle+7,ay-1,ankle+44,ay+12);g.quadraticCurveTo(ankle+52,ay+20,ankle+41,ay+24);g.lineTo(ankle-13,ay+22);g.closePath();},p.sandal,p.ink,4);
 shape(ctx,g=>{g.moveTo(ankle-13,ay+23);g.quadraticCurveTo(ankle+13,ay+29,ankle+42,ay+24);},null,p.sole,3);
 ink(ctx,[{x:ankle-4,y:ay+8},{x:ankle+4,y:ay-10},{x:ankle+18,y:ay-9},{x:ankle+25,y:ay+12}],p.obiLight,4);
}
function hair(ctx,bob,flow,p){
 const y=bob;
 shape(ctx,g=>{g.moveTo(335,245+y);g.quadraticCurveTo(302,165+y,367,129+y);g.quadraticCurveTo(448,86+y,493,162+y);g.quadraticCurveTo(525,211+y,493,287+y);g.quadraticCurveTo(456,344+y,403,331+y);g.closePath();},p.hair,p.ink,6);
 shape(ctx,g=>{g.moveTo(344,206+y);g.quadraticCurveTo(287,302+y,306+flow,468+y);g.quadraticCurveTo(312+flow,549+y,276+flow,628+y);g.quadraticCurveTo(366+flow,586+y,390,474+y);g.quadraticCurveTo(421,353+y,410,252+y);g.closePath();},p.hair,p.ink,6);
 ink(ctx,[{x:349,y:226+y},{x:312+flow*.2,y:350+y},{x:349+flow*.7,y:491+y},{x:302+flow,y:603+y}],p.hairLight,5);
 ink(ctx,[{x:376,y:181+y},{x:345+flow*.2,y:303+y},{x:389+flow*.6,y:433+y},{x:344+flow,y:559+y}], "#65515e",3);
}
function kimono(ctx,bob,cloth,arm,p){
 const y=bob;
 shape(ctx,g=>{g.moveTo(372,327+y);g.quadraticCurveTo(319,321+y,277,354+y);g.quadraticCurveTo(240,389+y,267,448+y);g.quadraticCurveTo(310,456+y,357,415+y);g.lineTo(389,376+y);g.closePath();},p.kimonoShade,p.ink,6);
 shape(ctx,g=>{g.moveTo(366,303+y);g.quadraticCurveTo(404,284+y,451,318+y);g.quadraticCurveTo(464,382+y,453,465+y);g.quadraticCurveTo(451+cloth*.2,558+y,487+cloth,739+y);g.quadraticCurveTo(413,768+y,330,728+y);g.quadraticCurveTo(352,623+y,344,527+y);g.closePath();},p.kimono,p.ink,7);
 shape(ctx,g=>{g.moveTo(397,305+y);g.quadraticCurveTo(425,362+y,444,421+y);g.lineTo(413,494+y);g.quadraticCurveTo(389,408+y,364,346+y);g.closePath();},p.kimonoShade,p.ink,4);
 shape(ctx,g=>{g.moveTo(407,324+y);g.quadraticCurveTo(457,314+y,493,352+y);g.quadraticCurveTo(516,389+y,495,441+y);g.quadraticCurveTo(451,454+y,418,416+y);g.closePath();},p.kimono,p.ink,6);
 ink(ctx,[{x:463,y:355+y},{x:468+arm*24,y:390+y},{x:453+arm*48,y:423+y},{x:439+arm*58,y:444+y}],p.skinShade,4);
 shape(ctx,g=>{g.moveTo(425+arm*44,428+y);g.quadraticCurveTo(443+arm*56,421+y,455+arm*55,439+y);g.quadraticCurveTo(456+arm*52,459+y,441+arm*42,462+y);g.closePath();},p.skin,p.ink,3);
 shape(ctx,g=>{g.moveTo(356,477+y);g.quadraticCurveTo(410,492+y,461,469+y);g.lineTo(463,524+y);g.quadraticCurveTo(403,540+y,352,517+y);g.closePath();},p.obi,p.ink,5);
 shape(ctx,g=>{g.moveTo(430,480+y);g.quadraticCurveTo(461,464+y,476,487+y);g.quadraticCurveTo(459,507+y,433,499+y);g.closePath();},p.obiLight,p.ink,3);
 ink(ctx,[{x:370,y:542+y},{x:386,y:601+y},{x:358+cloth*.6,y:673+y},{x:347+cloth,y:718+y}],p.kimonoShade,4);
 ink(ctx,[{x:424,y:541+y},{x:442,y:590+y},{x:454+cloth*.7,y:655+y},{x:465+cloth,y:724+y}],p.kimonoShade,4);
}
function face(ctx,bob,p,scale){
 ctx.save();ctx.translate(0,bob);ctx.scale(scale,scale);ctx.translate(0,-bob);
 shape(ctx,g=>{g.moveTo(385,194);g.quadraticCurveTo(438,157,476,203);g.quadraticCurveTo(500,230,490,271);g.lineTo(507,292);g.quadraticCurveTo(511,302,493,306);g.quadraticCurveTo(483,350,438,355);g.quadraticCurveTo(391,346,374,304);g.quadraticCurveTo(359,244,385,194);g.closePath();},p.skin,p.ink,5);
 ink(ctx,[{x:458,y:263},{x:469,y:263},{x:479,y:267},{x:483,y:274}],p.ink,3.5);
 shape(ctx,g=>{g.moveTo(392,279);g.quadraticCurveTo(376,275,379,296);g.quadraticCurveTo(384,319,399,311);},p.skinShade,p.ink,3);
 ctx.restore();
}
function frontHair(ctx,bob,p){
 shape(ctx,g=>{g.moveTo(354,235+bob);g.quadraticCurveTo(335,170+bob,390,132+bob);g.quadraticCurveTo(449,98+bob,486,157+bob);g.quadraticCurveTo(506,191+bob,488,245+bob);g.quadraticCurveTo(462,219+bob,443,188+bob);g.quadraticCurveTo(420,235+bob,388,254+bob);g.closePath();},p.hair,p.ink,5.5);
 ink(ctx,[{x:367,y:212+bob},{x:385,y:174+bob},{x:411,y:162+bob},{x:442,y:174+bob}],p.hairLight,4);
}
export function hashRgbaPixels(bytes){
 if(!bytes||bytes.length===0||bytes.length%4!==0)throw Error("Valid RGBA pixels are required.");
 let h=2166136261;for(let i=0;i<bytes.length;i++){h^=bytes[i];h=Math.imul(h,16777619);}return "rgba-fnv1a-"+(h>>>0).toString(16).padStart(8,"0");
}
export function renderAnimeRasterCharacterFrame(canvas,profile,pose,{width=768,height=1024}={}){
 if(!canvas?.getContext||!canvas?.toDataURL)throw Error("Browser Canvas 2D is required.");
 if(profile?.format!=="zero-studio-raster-character-profile"||!Number.isInteger(pose?.frameIndex)||pose.frameIndex<0||pose.frameIndex>23)throw Error("Invalid profile or frame pose.");
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<256||height<256||width>2048||height>2048)throw Error("Raster size must be 256–2048 px.");
 canvas.width=width;canvas.height=height;const ctx=canvas.getContext("2d",{willReadFrequently:true});if(!ctx)throw Error("Canvas 2D context unavailable.");
 ctx.clearRect(0,0,width,height);ctx.save();const unit=Math.min(width/768,height/1024);ctx.translate((width-768*unit)/2,(height-1024*unit)/2);ctx.scale(unit,unit);
 const p=profile.palette,b=pose.bob||0;
 leg(ctx,402,pose.footB*.82-13,pose.liftB,false,p);
 leg(ctx,421,pose.footA*.82+13,pose.liftA,true,p);
 kimono(ctx,b,pose.cloth,pose.arm,p);hair(ctx,b,pose.hair,p);face(ctx,b,p,profile.proportions.head);frontHair(ctx,b,p);
 ink(ctx,[{x:366,y:353+b},{x:371,y:389+b},{x:384,y:418+b},{x:399,y:434+b}],p.kimonoShade,3);
 ctx.restore();
 const hash=hashRgbaPixels(ctx.getImageData(0,0,width,height).data),png=canvas.toDataURL("image/png");
 if(!png.startsWith("data:image/png;base64,"))throw Error("PNG export failed.");
 return Object.freeze({frameIndex:pose.frameIndex,frameNumber:pose.frameNumber,timeSeconds:pose.timeSeconds,fps:24,width,height,mimeType:"image/png",contentHash:hash,pngDataUrl:png,independentRedraw:true,sourceImageUsed:false,modelInferenceUsed:false,svgUsed:false});
}
export function auditAnimeRasterDrawingSequence(frames){
 if(!Array.isArray(frames)||frames.length!==24)throw Error("The walk proof needs exactly 24 drawings.");
 const hashes=new Set();
 for(let i=0;i<24;i++){const f=frames[i];if(f.frameIndex!==i||f.frameNumber!==i+1||f.fps!==24||f.independentRedraw!==true||f.sourceImageUsed!==false||f.modelInferenceUsed!==false||f.svgUsed!==false)throw Error("Invalid provenance on frame "+(i+1)+".");if(!/^rgba-fnv1a-[0-9a-f]{8}$/.test(f.contentHash||""))throw Error("Missing pixel hash on frame "+(i+1)+".");if(hashes.has(f.contentHash))throw Error("Duplicate raster drawing at frame "+(i+1)+".");hashes.add(f.contentHash);}
 return Object.freeze({frameCount:24,uniqueFrameCount:hashes.size,fps:24,independentRasterDrawingsPerSecond:hashes.size,meets24UniqueRasterDrawings:hashes.size===24});
}
export function renderAnimeRasterWalkCycle(profile,{createCanvas,width=768,height=1024}={}){
 if(typeof createCanvas!=="function")throw Error("A fresh-canvas factory is required.");
 const frames=createAnimeRasterWalkCycle({profile}).map(pose=>renderAnimeRasterCharacterFrame(createCanvas(),profile,pose,{width,height}));
 const audit=auditAnimeRasterDrawingSequence(frames);
 return Object.freeze({format:"zero-studio-independent-raster-drawing",version:1,fps:24,durationSeconds:1,frames,audit});
}
