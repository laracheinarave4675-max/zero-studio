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
  const style=validateAnimeStyleProfile(profile);
  const x=Number(bounds?.x),y=Number(bounds?.y),width=Number(bounds?.width),height=Number(bounds?.height),yaw=Number(viewYaw);
  if (![x,y,width,height,yaw].every(Number.isFinite)||width<=0||height<=0||x<0||y<0||x+width>1||y+height>1||yaw < -1||yaw > 1) fail("Head bounds and view yaw must be normalized and within the canvas.");
  const absYaw=Math.abs(yaw),direction=Math.sign(yaw),cx=x+width/2;
  const cosYaw=Math.cos(absYaw*Math.PI*.46),sinYaw=Math.sin(absYaw*Math.PI*.46);
  const at=ratio=>y+height*ratio;
  const nearSideScale=1+absYaw*.09;
  const farSideScale=1-absYaw*.42;
  const project=(localX,depth=0)=>{
    const normalizedX=localX-.5;
    const sideIsNear=normalizedX===0||Math.sign(normalizedX)===direction;
    const sideScale=direction===0?1:(sideIsNear?nearSideScale:farSideScale);
    return cx+width*(normalizedX*cosYaw*sideScale+direction*depth*sinYaw*.34);
  };
  const eyeY=at(style.head.eyeLine),browY=at(style.head.browLine);
  const noseY=at(style.head.noseBase),mouthY=at(style.head.mouthLine);
  const nearScale=1-absYaw*.035;
  const farScale=1-absYaw*(1-style.eyes.farEyeScaleAtFullYaw);
  const eyeOffset=style.eyes.centerOffsetToFace;
  const eyeWidth=width*style.eyes.widthToFace*cosYaw;
  const eyeHeight=eyeWidth*style.eyes.heightToWidth;
  const nearSide=direction||1;
  const eye=side=>{
    const localX=.5+side*eyeOffset;
    const depth=Math.sqrt(Math.max(0,1-Math.pow((localX-.5)*2,2)))*.22;
    const near=side===nearSide,scale=near?nearScale:farScale;
    const centerX=project(localX,depth);
    return {center:{x:centerX,y:eyeY},bounds:{x:centerX-eyeWidth*scale/2,y:eyeY-eyeHeight*scale/2,width:eyeWidth*scale,height:eyeHeight*scale},scale,side:side<0?"left":"right",upperLidWeight:style.eyes.upperLidWeight,lowerLidWeight:style.eyes.lowerLidWeight,nearSide:near};
  };
  const cheekDepth=.17;
  const cheekLeft={x:project(.08,cheekDepth),y:at(.59)};
  const cheekRight={x:project(.92,cheekDepth),y:at(.59)};
  const jawLeft={x:project(.5-style.head.jawWidth*.5,.11),y:at(.79)};
  const jawRight={x:project(.5+style.head.jawWidth*.5,.11),y:at(.79)};
  const chin={x:project(.5+direction*absYaw*.035,.27),y:at(1)};
  const noseBase={x:project(.5+direction*absYaw*.035,.42),y:noseY};
  const mouthCenter={x:project(.5+direction*absYaw*.02,.31),y:mouthY};
  const silhouette=[];
  for(let i=0;i<=96;i++){
    const angle=-Math.PI/2+i/96*Math.PI*2;
    const side=Math.cos(angle),vertical=Math.sin(angle);
    const lowerProgress=clamp((vertical-.12)/.88,0,1);
    const jawTaper=1-.62*Math.pow(lowerProgress,1.18);
    const cheekBulge=1+.045*Math.exp(-Math.pow((vertical-.2)/.22,2));
    const localX=.5+side*.5*jawTaper*cheekBulge;
    const depth=Math.sqrt(Math.max(0,1-Math.pow(side,2)))*.19;
    const projectedX=project(localX,depth);
    silhouette.push({x:projectedX,y:y+height*.5+vertical*height*.5});
  }
  const nearCheek=direction>=0?cheekRight:cheekLeft;
  const farCheek=direction>=0?cheekLeft:cheekRight;
  return {
    profileId:style.id,viewYaw:yaw,
    bounds:{x,y,width,height,projectedWidth:width*cosYaw,projectedCenter:project(.5,.0)},
    axes:{
      centerline:{from:{x:project(.5,.2),y},to:{x:chin.x,y:y+height}},
      browY,eyeY,noseY,mouthY,
      nearCheekX:nearCheek.x,farCheekX:farCheek.x
    },
    landmarks:{crown:{x:project(.5,.12),y},chin,cheekLeft,cheekRight,jawLeft,jawRight,noseBase,mouthCenter,nearCheek,farCheek},
    planes:{
      nearCheek:{center:nearCheek,scale:1-absYaw*.07},
      farCheek:{center:farCheek,scale:1-absYaw*.38},
      noseProjection:{bridge:{x:project(.5,.33),y:at(.52)},tip:{x:project(.5,.48),y:noseY},base:noseBase},
      jawVisibility:{nearSide:direction>=0?"right":"left",farSideScale:1-absYaw*.34}
    },
    silhouette,
    faceCrossSections:[
      {id:"brow",y:browY,left:project(.08,.12),right:project(.92,.12)},
      {id:"eye",y:eyeY,left:project(.09,.18),right:project(.91,.18)},
      {id:"cheek",y:at(.59),left:cheekLeft.x,right:cheekRight.x},
      {id:"jaw",y:at(.79),left:jawLeft.x,right:jawRight.x},
      {id:"chin",y:chin.y,left:chin.x-width*.025,right:chin.x+width*.025}
    ],
    eyes:[eye(-1),eye(1)],
    projection:{yaw,cosYaw,sinYaw,faceDepth:.34,nearSideScale,farSideScale},
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
