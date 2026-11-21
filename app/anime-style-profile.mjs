export const ANIME_STYLE_PROFILE_FORMAT = "zero-studio-anime-style-profile";
export const ANIME_STYLE_PROFILE_VERSION = 1;

const fail = message => { throw new Error(message); };
const clamp = (value,min,max) => Math.max(min,Math.min(max,value));

export const DEFAULT_TV_ANIME_STYLE_PROFILE = Object.freeze({
  format: ANIME_STYLE_PROFILE_FORMAT,
  version: ANIME_STYLE_PROFILE_VERSION,
  id: "tv-anime-balanced",
  description: "A controllable contemporary TV-anime construction baseline; not a universal anime template.",
  head: Object.freeze({
    eyeLine: 0.435, browLine: 0.355, noseBase: 0.635, mouthLine: 0.765,
    jawWidth: 0.72, cheekWidth: 0.94, chinRoundness: 0.12
  }),
  eyes: Object.freeze({
    widthToFace: 0.205, heightToWidth: 0.82, centerOffsetToFace: 0.225,
    irisToEyeHeight: 0.82, upperLidWeight: 1.55, lowerLidWeight: 0.62,
    farEyeScaleAtFullYaw: 0.78, asymmetryAllowance: 0.06
  }),
  hair: Object.freeze({
    majorMasses: 3, clumpCount: 7, tipSharpness: 0.72,
    rootToTipFlow: 0.88, negativeSpaceTarget: 0.12
  }),
  line: Object.freeze({
    silhouetteToDetail: 2.35, overlapToDetail: 1.7,
    featureToDetail: 1.25, taperStart: 0.12, taperEnd: 0.28
  }),
  paint: Object.freeze({
    flatValueGroups: 4, shadowGroups: 2, highlightGroups: 2,
    castShadowHardness: 0.82, paletteMaxColors: 12
  })
});

const numericPaths = [
  ["head","eyeLine",0.35,0.55],["head","browLine",0.25,0.48],
  ["head","noseBase",0.52,0.78],["head","mouthLine",0.65,0.9],
  ["head","jawWidth",0.45,0.95],["head","cheekWidth",0.7,1],
  ["eyes","widthToFace",0.12,0.3],["eyes","heightToWidth",0.25,0.9],
  ["eyes","centerOffsetToFace",0.15,0.32],["eyes","irisToEyeHeight",0.55,1],
  ["eyes","upperLidWeight",1,2.5],["eyes","lowerLidWeight",0.3,1.2],
  ["eyes","farEyeScaleAtFullYaw",0.5,1],["eyes","asymmetryAllowance",0,0.15],
  ["hair","majorMasses",2,8],["hair","clumpCount",3,16],
  ["hair","tipSharpness",0.2,1],["hair","rootToTipFlow",0.4,1],
  ["hair","negativeSpaceTarget",0.02,0.3],
  ["line","silhouetteToDetail",1.2,4],["line","overlapToDetail",1,3],
  ["line","featureToDetail",0.8,2],["line","taperStart",0,0.45],["line","taperEnd",0,0.6],
  ["paint","flatValueGroups",3,6],["paint","shadowGroups",1,4],
  ["paint","highlightGroups",1,4],["paint","castShadowHardness",0.2,1],
  ["paint","paletteMaxColors",4,20]
];

export function validateAnimeStyleProfile(input) {
  if (!input || typeof input !== "object" || input.format !== ANIME_STYLE_PROFILE_FORMAT || input.version !== ANIME_STYLE_PROFILE_VERSION) fail("Unsupported anime style profile.");
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(String(input.id ?? ""))) fail("Anime style profile needs a stable id.");
  const result = JSON.parse(JSON.stringify(input));
  for (const [section,key,min,max] of numericPaths) {
    const value = Number(result[section]?.[key]);
    if (!Number.isFinite(value) || value < min || value > max) fail("Anime style profile value outside supported range: "+section+"."+key);
    result[section][key] = value;
    if (["majorMasses","clumpCount","flatValueGroups","shadowGroups","highlightGroups","paletteMaxColors"].includes(key) && !Number.isInteger(value)) fail("Anime style counts must be integers: "+section+"."+key);
  }
  if (result.head.browLine >= result.head.eyeLine || result.head.eyeLine >= result.head.noseBase || result.head.noseBase >= result.head.mouthLine) fail("Facial construction lines must descend in brow/eye/nose/mouth order.");
  if (result.eyes.centerOffsetToFace <= result.eyes.widthToFace/2) fail("Anime eye centers must leave a positive inter-eye gap.");
  return result;
}

export function deriveAnimeHeadConstruction({bounds, viewYaw=0, profile=DEFAULT_TV_ANIME_STYLE_PROFILE}={}) {
  const style = validateAnimeStyleProfile(profile);
  const x=Number(bounds?.x),y=Number(bounds?.y),width=Number(bounds?.width),height=Number(bounds?.height),yaw=Number(viewYaw);
  if (![x,y,width,height,yaw].every(Number.isFinite)||width<=0||height<=0||x<0||y<0||x+width>1||y+height>1||yaw < -1||yaw > 1) fail("Head bounds and view yaw must be normalized and within the canvas.");
  const absYaw=Math.abs(yaw),direction=Math.sign(yaw),cx=x+width/2;
  // Yaw is treated as a projection parameter: the far cheek/skull plane
  // compresses, the facial centerline moves toward the near side, and the
  // jaw/chin are projected from the same head volume (not shifted separately).
  const projectedWidth=width*(1-absYaw*.28);
  const centerShift=direction*width*absYaw*.105;
  const projectedCenter=cx-centerShift;
  const at=ratio=>y+height*ratio;
  const eyeY=at(style.head.eyeLine),browY=at(style.head.browLine);
  const noseY=at(style.head.noseBase),mouthY=at(style.head.mouthLine);
  const nearScale=1-absYaw*.045;
  const farScale=1-absYaw*(1-style.eyes.farEyeScaleAtFullYaw);
  const eyeOffset=projectedWidth*style.eyes.centerOffsetToFace;
  const eyeWidth=projectedWidth*style.eyes.widthToFace;
  const eyeHeight=eyeWidth*style.eyes.heightToWidth;
  const nearSide=direction||1;
  const eye=side=>{
    const near=side===nearSide,scale=near?nearScale:farScale;
    const centerX=projectedCenter+side*eyeOffset;
    return {center:{x:centerX,y:eyeY},bounds:{x:centerX-eyeWidth*scale/2,y:eyeY-eyeHeight*scale/2,width:eyeWidth*scale,height:eyeHeight*scale},scale,side:side<0?"left":"right",upperLidWeight:style.eyes.upperLidWeight,lowerLidWeight:style.eyes.lowerLidWeight,nearSide:near};
  };
  const cheekHalf=projectedWidth*style.head.cheekWidth/2;
  const jawHalf=projectedWidth*style.head.jawWidth/2;
  const cheekLeft={x:projectedCenter-cheekHalf,y:at(.59)};
  const cheekRight={x:projectedCenter+cheekHalf,y:at(.59)};
  const jawLeft={x:projectedCenter-jawHalf*(yaw>0?.82:1),y:at(.78)};
  const jawRight={x:projectedCenter+jawHalf*(yaw<0?.82:1),y:at(.78)};
  const chin={x:projectedCenter+direction*width*absYaw*.035,y:at(1)};
  const noseBase={x:projectedCenter+direction*projectedWidth*absYaw*.16,y:noseY};
  const mouthCenter={x:projectedCenter+direction*projectedWidth*absYaw*.075,y:mouthY};
  const silhouette=Array.from({length:65},(_,i)=>{
    const angle=-Math.PI/2+i/64*Math.PI*2;
    const side=Math.cos(angle),vertical=Math.sin(angle);
    const far=direction!==0&&side*direction<0;
    const planeScale=far?1-absYaw*.42:1-absYaw*.08;
    const lower=1-.29*Math.max(0,vertical);
    const cheek=1+.035*Math.max(0,vertical);
    return {x:projectedCenter+side*projectedWidth*.5*planeScale*lower*cheek,y:y+height*.5+vertical*height*.5};
  });
  const farEarVisible=absYaw<.12 || absYaw<.9;
  return {
    profileId:style.id,viewYaw:yaw,
    bounds:{x,y,width,height,projectedWidth,projectedCenter},
    axes:{
      centerline:{from:{x:projectedCenter+direction*projectedWidth*.08,y},to:{x:projectedCenter-direction*projectedWidth*.035,y:y+height}},
      browY,eyeY,noseY,mouthY,
      nearCheekX:direction>=0?cheekRight.x:cheekLeft.x,
      farCheekX:direction>=0?cheekLeft.x:cheekRight.x
    },
    landmarks:{
      crown:{x:projectedCenter,y},chin,cheekLeft,cheekRight,jawLeft,jawRight,
      noseBase,mouthCenter,
      nearCheek:direction>=0?cheekRight:cheekLeft,
      farCheek:direction>=0?cheekLeft:cheekRight
    },
    planes:{
      nearCheek:{center:direction>=0?cheekRight:cheekLeft,scale:1-absYaw*.08},
      farCheek:{center:direction>=0?cheekLeft:cheekRight,scale:1-absYaw*.42},
      noseProjection:{bridge:{x:projectedCenter+direction*projectedWidth*absYaw*.11,y:at(.52)},tip:{x:noseBase.x+direction*projectedWidth*absYaw*.035,y:noseY},base:noseBase},
      jawVisibility:{nearSide:direction>=0?"right":"left",farSideScale:1-absYaw*.38}
    },
    silhouette,
    eyes:[eye(-1),eye(1)],
    derivedFromHeadBounds:true
  };
}

const cubic = (a,b,c,d,t) => {
  const u=1-t;
  return {x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};
};

/** Build one organic hair clump from a root-to-tip cubic flow and a width profile. */
export function buildAnimeHairClump({root,control1,control2,tip,rootWidth=0.08,tipWidth=0.002,samples=18,side=1}={}) {
  const points=[root,control1,control2,tip];
  if (points.some(point=>![Number(point?.x),Number(point?.y)].every(Number.isFinite)||Number(point.x)<0||Number(point.x)>1||Number(point.y)<0||Number(point.y)>1)) throw new Error("Anime hair clump control points must use normalized coordinates.");
  if (
      [rootWidth,tipWidth,samples,side].some(value=>!Number.isFinite(Number(value))) ||
      rootWidth<=0||rootWidth>0.3||tipWidth<0||tipWidth>rootWidth||!Number.isInteger(samples)||samples<6||samples>96||![1,-1].includes(side)) {
    fail("Anime hair clump needs valid widths, side direction and sample count (6–96).");
  }
  const left=[],right=[],center=[];
  for(let i=0;i<=samples;i++){
    const t=i/samples,p=cubic(root,control1,control2,tip,t);
    const before=cubic(root,control1,control2,tip,Math.max(0,t-.005));
    const after=cubic(root,control1,control2,tip,Math.min(1,t+.005));
    const dx=after.x-before.x,dy=after.y-before.y,length=Math.hypot(dx,dy)||1;
    const nx=-dy/length*side,ny=dx/length*side;
    const width=rootWidth*(1-t)*(1-t)+tipWidth*(2*t-t*t);
    left.push({x:p.x+nx*width/2,y:p.y+ny*width/2});
    right.push({x:p.x-nx*width/2,y:p.y-ny*width/2});
    center.push(p);
  }
  return {root:{...root},tip:{...tip},flow:center,outline:[...left,...right.reverse()],widthProfile:{rootWidth,tipWidth},samples};
}
