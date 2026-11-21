import {
  DEFAULT_TV_ANIME_STYLE_PROFILE,
  validateAnimeStyleProfile,
  deriveAnimeHeadConstruction,
  buildAnimeHairClump
} from "./anime-style-profile.mjs";

const fail = message => { throw new Error(message); };
const finitePoint = point => point && Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y));
const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
const ellipse = (cx,cy,rx,ry,count=32) => Array.from({length:count},(_,i)=>{
  const angle=Math.PI*2*i/count;
  return {x:cx+Math.cos(angle)*rx,y:cy+Math.sin(angle)*ry};
});
const boundsOf = points => ({
  minX:Math.min(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),
  maxX:Math.max(...points.map(p=>p.x)),maxY:Math.max(...points.map(p=>p.y))
});

/**
 * Build a normalized, construction-first anime character model.
 * All coordinates are normalized to [0,1] and remain geometry, not pixels.
 * This stage does not claim semantic vision: its inputs are explicit design
 * parameters and its outputs are a coherent drawing scaffold.
 */
export function buildAnimeConstructionModel({
  headBounds={x:.36,y:.1,width:.28,height:.46},
  viewYaw=0,
  profile=DEFAULT_TV_ANIME_STYLE_PROFILE,
  pose={shoulderTilt:0,torsoLean:0,shoulderWidth:1},
  hairGuides=null,
  lightDirection={x:-.7,y:-.7}
}={}) {
  const style=validateAnimeStyleProfile(profile);
  const head=deriveAnimeHeadConstruction({bounds:headBounds,viewYaw,profile:style});
  const yaw=Number(viewYaw);
  const tilt=Number(pose?.shoulderTilt??0),lean=Number(pose?.torsoLean??0),shoulderScale=Number(pose?.shoulderWidth??1);
  if (![tilt,lean,shoulderScale].every(Number.isFinite)||Math.abs(tilt)>.3||Math.abs(lean)>.25||shoulderScale<.65||shoulderScale>1.5) fail("Pose parameters exceed supported construction bounds.");

  const {x,y,width,height}=headBounds;
  const chin=head.landmarks.chin;
  const neckTop=y+height*.82,neckBottom=Math.min(.88,chin.y+height*.34);
  const neckWidth=width*.24;
  const neckLeft={x:chin.x-neckWidth/2,y:neckTop};
  const neckRight={x:chin.x+neckWidth/2,y:neckTop};
  const neckBase={x:chin.x+lean,y:neckBottom};
  const neckBaseLeft={x:neckBase.x-neckWidth*.62,y:neckBottom};
  const neckBaseRight={x:neckBase.x+neckWidth*.62,y:neckBottom};
  const neck={left:neckLeft,right:neckRight,base:neckBase,polygon:[neckLeft,neckRight,neckBaseRight,neckBaseLeft]};
  const shoulderY=clamp(neckBottom+height*.17,.68,.94);
  const shoulderHalf=width*.92*shoulderScale;
  const shoulders={
    left:{x:clamp(chin.x-shoulderHalf+tilt,0,1),y:shoulderY+tilt*.35},
    center:{x:clamp(chin.x+lean,0,1),y:shoulderY},
    right:{x:clamp(chin.x+shoulderHalf+tilt,0,1),y:shoulderY-tilt*.35}
  };
  const waistCenter={x:shoulders.center.x+lean,y:Math.min(.99,shoulderY+height*.66)};
  const waistWidth=shoulderHalf*1.05;
  const waist={center:waistCenter,width:waistWidth};
  const ribcage={center:{x:shoulders.center.x+lean*.45,y:shoulderY+height*.2},width:shoulderHalf*1.45,height:height*.34};
  const torsoOutline=[
    shoulders.left,
    {x:shoulders.left.x+shoulderHalf*.08,y:shoulderY+height*.22},
    {x:waistCenter.x-waistWidth/2,y:waistCenter.y},
    {x:waistCenter.x+waistWidth/2,y:waistCenter.y},
    {x:shoulders.right.x-shoulderHalf*.08,y:shoulderY+height*.22},
    shoulders.right,
    neckBaseRight,
    neckBaseLeft
  ];
  const torso={neck,shoulders,ribcage,waist,outline:torsoOutline};

  const eyes=head.eyes.map((eye,index)=>{
    const b=eye.bounds,cx=eye.center.x,cy=eye.center.y;
    const irisCenter={x:cx+(index===0?1:-1)*b.width*.025,y:cy+b.height*.045};
    const iris=ellipse(irisCenter.x,irisCenter.y,b.width*.205,b.height*.39,28);
    const pupil=ellipse(irisCenter.x,irisCenter.y+b.height*.035,b.width*.105,b.height*.25,24);
    const upperLid=Array.from({length:17},(_,i)=>{
      const t=i/16,px=cx-b.width*.5+b.width*t;
      return {x:px,y:cy-b.height*.075-Math.sin(Math.PI*t)*b.height*.47};
    });
    const lowerLid=Array.from({length:17},(_,i)=>{
      const t=i/16,px=cx-b.width*.5+b.width*t;
      return {x:px,y:cy+b.height*.075+Math.sin(Math.PI*t)*b.height*.37};
    });
    const sclera=[...upperLid,...lowerLid.slice().reverse()];
    return {id:index===0?"eye-left":"eye-right",bounds:b,sclera,iris,pupil,upperLid,lowerLid,upperLidWeight:style.eyes.upperLidWeight,lowerLidWeight:style.eyes.lowerLidWeight,farSide:eye.scale<.999};
  });

  const guides=hairGuides??[
    {id:"fringe-left",root:{x:x+width*.22,y:y+height*.1},control1:{x:x+width*.04,y:y+height*.03},control2:{x:x+width*.12,y:y+height*.28},tip:{x:x+width*.29,y:y+height*.34},rootWidth:width*.2,tipWidth:width*.004,side:1},
    {id:"fringe-center",root:{x:x+width*.46,y:y+height*.025},control1:{x:x+width*.6,y:y+height*.04},control2:{x:x+width*.48,y:y+height*.25},tip:{x:x+width*.52,y:y+height*.34},rootWidth:width*.22,tipWidth:width*.003,side:1},
    {id:"fringe-right",root:{x:x+width*.78,y:y+height*.1},control1:{x:x+width*.98,y:y+height*.03},control2:{x:x+width*.88,y:y+height*.28},tip:{x:x+width*.7,y:y+height*.34},rootWidth:width*.2,tipWidth:width*.004,side:-1},
    {id:"side-left",root:{x:x+width*.04,y:y+height*.3},control1:{x:x-width*.12,y:y+height*.55},control2:{x:x-width*.06,y:y+height*1.18},tip:{x:x+width*.1,y:y+height*1.55},rootWidth:width*.17,tipWidth:width*.003,side:1},
    {id:"side-right",root:{x:x+width*.96,y:y+height*.3},control1:{x:x+width*1.12,y:y+height*.55},control2:{x:x+width*1.06,y:y+height*1.18},tip:{x:x+width*.9,y:y+height*1.55},rootWidth:width*.17,tipWidth:width*.003,side:-1}
  ];
  const cubicPoints=(a,b,c,d,count=18)=>Array.from({length:count+1},(_,i)=>{
    const t=i/count,u=1-t;
    return {x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};
  });
  const joinPoints=(...parts)=>parts.flatMap((part,index)=>index?part.slice(1):part);
  const hairBackSilhouette=joinPoints(
    cubicPoints({x:x+width*.5,y:y-height*.09},{x:x+width*1.35,y:y-height*.08},{x:x+width*1.32,y:y+height*.75},{x:x+width*1.18,y:y+height*1.58},22),
    cubicPoints({x:x+width*1.18,y:y+height*1.58},{x:x+width*.95,y:y+height*1.78},{x:x+width*.15,y:y+height*1.78},{x:x-width*.18,y:y+height*1.55},18),
    cubicPoints({x:x-width*.18,y:y+height*1.55},{x:x-width*.32,y:y+height*.75},{x:x-width*.35,y:y-height*.08},{x:x+width*.5,y:y-height*.09},22)
  );
  const brows=head.eyes.map((eye,index)=>{
    const b=eye.bounds,cx=eye.center.x,side=index===0?-1:1;
    return {id:index===0?"brow-left":"brow-right",points:Array.from({length:11},(_,i)=>{const t=i/10;return{x:cx-b.width*.52+b.width*1.04*t,y:head.axes.browY-Math.sin(Math.PI*t)*height*.018};})};
  });
  const nose={points:[{x:head.landmarks.noseBase.x+width*.012,y:head.axes.noseY-height*.015},{x:head.landmarks.noseBase.x+width*.004,y:head.axes.noseY+height*.045},{x:head.landmarks.noseBase.x+width*.035,y:head.axes.noseY+height*.055}]};
  const mouth={points:Array.from({length:13},(_,i)=>{const t=i/12;return{x:head.landmarks.mouthCenter.x-width*.055+width*.11*t,y:head.axes.mouthY+Math.sin(Math.PI*t)*height*.012};})};
  if(!Array.isArray(guides)||guides.length<3||guides.length>32)fail("Anime hair needs 3–32 explicit root-to-tip clump guides.");
  const hair=guides.map(guide=>{
    if(!guide||typeof guide.id!=="string"||!guide.id.trim())fail("Every hair clump needs a stable id.");
    const clump=buildAnimeHairClump(guide);
    return {id:guide.id,...clump,rootToTipLength:Math.hypot(guide.tip.x-guide.root.x,guide.tip.y-guide.root.y)};
  });
  if(new Set(hair.map(item=>item.id)).size!==hair.length)fail("Hair clump ids must be unique.");

  const folds=[
    {id:"left-shoulder-tension",anchor:shoulders.left,target:torso.ribcage.center,kind:"tension"},
    {id:"right-shoulder-tension",anchor:shoulders.right,target:torso.ribcage.center,kind:"tension"},
    {id:"collar-center",anchor:{x:neck.base.x,y:neck.base.y},target:torso.ribcage.center,kind:"compression"},
    {id:"waist-gather",anchor:torso.waist.center,target:torso.ribcage.center,kind:"compression"}
  ];
  const lx=Number(lightDirection?.x),ly=Number(lightDirection?.y),lightLength=Math.hypot(lx,ly);
  if(!Number.isFinite(lightLength)||lightLength<.001)fail("A non-zero light direction is required.");
  const light={x:lx/lightLength,y:ly/lightLength};
  const shadowDirection={x:-light.x,y:-light.y};
  const shadows={
    light,
    direction:shadowDirection,
    facePlane:{anchor:{x:head.landmarks.cheekLeft.x,y:head.axes.eyeY},normal:shadowDirection,clipTo:"face-silhouette"},
    neckCast:{anchor:neck.base,normal:shadowDirection,clipTo:"neck-volume"},
    garmentOcclusion:{anchor:torso.ribcage.center,normal:shadowDirection,clipTo:"garment-panels"}
  };

  return {
    format:"zero-studio-anime-construction-model",version:1,profileId:style.id,
    canvasSpace:"normalized-0-to-1",view:{yaw,pose:{shoulderTilt:tilt,torsoLean:lean,shoulderWidth:shoulderScale}},
    head,eyes,torso,hair,brows,nose,mouth,hairBackSilhouette,folds,shadows,
    constructionOrder:["gesture-and-axis","head-volume","facial-feature-zones","torso-volume","hair-root-to-tip-clumps","cloth-tension-anchors","light-and-occlusion"]
  };
}

/** Structural diagnostics only; they do not substitute for visual/artistic review. */
export function auditAnimeConstructionModel(model) {
  const findings=[];
  if(!model||model.format!=="zero-studio-anime-construction-model")return {valid:false,findings:[{severity:"error",code:"invalid-model",message:"A construction model is required."}]};
  const ids=model.hair?.map(item=>item.id)??[];
  if(ids.length<3)findings.push({severity:"error",code:"insufficient-hair-clumps",message:"At least three independent hair clumps are required."});
  if(new Set(ids).size!==ids.length)findings.push({severity:"error",code:"duplicate-hair-ids",message:"Hair clump identifiers are not unique."});
  for(const eye of model.eyes??[]){
    if(!eye.sclera?.every(finitePoint)||!eye.iris?.every(finitePoint)||!eye.pupil?.every(finitePoint))findings.push({severity:"error",code:"invalid-eye-geometry",target:eye.id,message:"Eye components contain invalid geometry."});
    if(!(eye.upperLidWeight>eye.lowerLidWeight))findings.push({severity:"warning",code:"lid-hierarchy",target:eye.id,message:"Upper lid should carry greater line weight than lower lid."});
  }
  for(const clump of model.hair??[]){
    if(!finitePoint(clump.root)||!finitePoint(clump.tip)||clump.flow.length<7)findings.push({severity:"error",code:"invalid-hair-flow",target:clump.id,message:"Hair clump is missing a valid root-to-tip flow."});
    const box=boundsOf(clump.outline);
    if(box.minX<0||box.minY<0||box.maxX>1||box.maxY>1)findings.push({severity:"error",code:"hair-out-of-bounds",target:clump.id,message:"Hair clump outline leaves the normalized canvas."});
  }
  if((model.folds??[]).length<3)findings.push({severity:"warning",code:"missing-cloth-tension",message:"Cloth fold anchors are insufficient."});
  if(!finitePoint(model.shadows?.light)||Math.abs(Math.hypot(model.shadows.light.x,model.shadows.light.y)-1)>.001)findings.push({severity:"error",code:"invalid-light-vector",message:"Light direction must be normalized."});
  const errors=findings.filter(item=>item.severity==="error").length;
  return {valid:errors===0,errors,warnings:findings.filter(item=>item.severity==="warning").length,findings,checks:{headDerivedFromBounds:!!model.head?.derivedFromHeadBounds,eyeSystems:model.eyes?.length??0,hairClumps:model.hair?.length??0,clothAnchors:model.folds?.length??0,lightDeclared:!!model.shadows?.light,visualQualityMeasured:false,semanticRecognitionPerformed:false}};
}
