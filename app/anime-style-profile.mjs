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
    widthToFace: 0.205, heightToWidth: 0.43, centerOffsetToFace: 0.225,
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
  ["eyes","widthToFace",0.12,0.3],["eyes","heightToWidth",0.25,0.7],
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
  const result = structuredClone(input);
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
  const cx=x+width/2, at=ratio=>y+height*ratio;
  const eyeY=at(style.head.eyeLine), browY=at(style.head.browLine);
  const noseY=at(style.head.noseBase), mouthY=at(style.head.mouthLine);
  const nearScale=1-Math.abs(yaw)*0.12, farScale=1-Math.abs(yaw)*(1-style.eyes.farEyeScaleAtFullYaw);
  const yawShift=yaw*width*0.1;
  const eyeOffset=width*style.eyes.centerOffsetToFace;
  const eyeWidth=width*style.eyes.widthToFace;
  const eyeHeight=eyeWidth*style.eyes.heightToWidth;
  const nearSide=yaw>=0?1:-1;
  const eye=(side)=> {
    const near=side===nearSide,scale=near?nearScale:farScale;
    const centerX=cx + side*eyeOffset - yawShift;
    return {center:{x:centerX,y:eyeY},bounds:{x:centerX-eyeWidth*scale/2,y:eyeY-eyeHeight*scale/2,width:eyeWidth*scale,height:eyeHeight*scale},scale,side:side<0?"left":"right",upperLidWeight:style.eyes.upperLidWeight,lowerLidWeight:style.eyes.lowerLidWeight};
  };
  return {
    profileId:style.id,viewYaw:yaw,
    bounds:{x,y,width,height},
    axes:{centerline:{from:{x:cx-yawShift,y},to:{x:cx+yawShift,y:y+height}},browY,eyeY,noseY,mouthY},
    landmarks:{
      crown:{x:cx,y},chin:{x:cx-yawShift*0.35,y:y+height},
      cheekLeft:{x:cx-width*style.head.cheekWidth/2,y:at(.59)},
      cheekRight:{x:cx+width*style.head.cheekWidth/2,y:at(.59)},
      jawLeft:{x:cx-width*style.head.jawWidth/2,y:at(.78)},
      jawRight:{x:cx+width*style.head.jawWidth/2,y:at(.78)},
      noseBase:{x:cx-yawShift*.25,y:noseY},
      mouthCenter:{x:cx-yawShift*.32,y:mouthY}
    },
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
  if (points.some(point=>![Number(point?.x),Number(point?.y)].every(Number.isFinite)) ||
      [rootWidth,tipWidth,samples,side].some(value=>!Number.isFinite(Number(value))) ||
      rootWidth<=0||rootWidth>0.3||tipWidth<0||tipWidth>rootWidth||!Number.isInteger(samples)||samples<6||samples>96||![1,-1].includes(side)) {
    fail("Anime hair clump needs valid normalized root, controls, tip, width and sample count.");
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
