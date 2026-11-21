import { buildAnimeConstructionModel } from "./anime-construction-artist.mjs";
import { validateDigitalArtistBrushPlan, compileDigitalArtistBrushPlan } from "./digital-artist-brush-engine.mjs";

const W=1920,H=1080;
const px=point=>({x:Math.round(point.x*W),y:Math.round(point.y*H),pressure:Math.max(.06,Math.min(1,Number(point.pressure??.72)))});
const fill=(id,intent,color,points,extra={})=>({id,intent,kind:"region-fill",color,points:points.map(px),...extra});
const stroke=(id,intent,brush,color,size,points,extra={})=>({id,intent,brush,color,size,points:points.map(px),...extra});
const ellipsePoints=(cx,cy,rx,ry,count=36)=>Array.from({length:count},(_,i)=>({x:cx+Math.cos(i/count*Math.PI*2)*rx,y:cy+Math.sin(i/count*Math.PI*2)*ry}));
const quadraticPoints=(a,control,b,count=10)=>Array.from({length:count+1},(_,i)=>{const t=i/count,u=1-t;return{x:u*u*a.x+2*u*t*control.x+t*t*b.x,y:u*u*a.y+2*u*t*control.y+t*t*b.y};});
const facePolygon=head=>{
  if(!Array.isArray(head?.silhouette)||head.silhouette.length<16)throw new Error("Yaw-projected head silhouette is required.");
  return head.silhouette;
};

/** Convert construction geometry into editable native raster brush operations. */
export function buildAnimeConstructionBrushPlan(model=buildAnimeConstructionModel()) {
  if(!model||model.format!=="zero-studio-anime-construction-model"||model.version!==1)throw new Error("A version 1 anime construction model is required.");
  const headShape=facePolygon(model.head);
  const construction=[
    stroke("construction-head-axis","Establish the head centerline from the derived yaw-aware construction.","graphite","#8a8290",2,[model.head.axes.centerline.from,model.head.axes.centerline.to]),
    stroke("construction-brow-axis","Mark the derived brow axis.","graphite","#8a8290",1.5,[{x:model.head.bounds.x,y:model.head.axes.browY},{x:model.head.bounds.x+model.head.bounds.width,y:model.head.axes.browY}]),
    stroke("construction-eye-axis","Mark the derived eye axis.","graphite","#8a8290",1.5,[{x:model.head.bounds.x,y:model.head.axes.eyeY},{x:model.head.bounds.x+model.head.bounds.width,y:model.head.axes.eyeY}]),
    stroke("construction-nose-axis","Mark the derived nose axis.","graphite","#8a8290",1.5,[{x:model.head.bounds.x,y:model.head.axes.noseY},{x:model.head.bounds.x+model.head.bounds.width,y:model.head.axes.noseY}]),
    stroke("construction-shoulder-axis","Connect the shoulder construction masses.","graphite","#8a8290",2,[model.torso.shoulders.left,model.torso.shoulders.center,model.torso.shoulders.right])
  ];
  const flat=[
    fill("background-field","Lay down a warm neutral drawing-paper field.","#f5e9e1",[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}]),
    fill("rear-hair-mass","Establish the rear hair silhouette behind the face and shoulders.","#292438",model.hairBackSilhouette),
    fill("neck-base","Connect the jaw to the torso with a tapered neck volume.","#e7b29f",model.torso.neck.polygon),
    fill("torso-base","Build the shoulder-to-waist torso silhouette from its anatomical anchors.","#d4c9df",model.torso.outline),
    fill("face-base","Lay in the head volume derived from the head construction.","#f0c4b0",headShape),
    ...model.ears.filter(ear=>ear.visible!==false).map(ear=>fill(ear.id,"Establish the visible ear silhouette at the head side plane.","#e7b29f",ear.outline)),
    ...model.hair.map(clump=>fill("hair-"+clump.id,"Fill one independent root-to-tip hair clump.","#30283d",clump.outline)),
    ...model.eyes.flatMap(eye=>{
      const center=eye.iris.reduce((sum,p)=>({x:sum.x+p.x/eye.iris.length,y:sum.y+p.y/eye.iris.length}),{x:0,y:0});
      return [
        fill(eye.id+"-sclera","Fill the almond-shaped sclera bounded by upper and lower lids.","#fff9f2",eye.sclera),
        fill(eye.id+"-iris","Fill the iris inside its eye boundary.","#9d625a",eye.iris,{clipPolygon:eye.sclera.map(px)}),
        fill(eye.id+"-pupil","Fill the pupil inside its eye boundary.","#30283b",eye.pupil,{clipPolygon:eye.sclera.map(px)}),
        fill(eye.id+"-catchlight","Add a small catchlight to make the eye read as glossy and alive.","#ffffff",ellipsePoints(center.x-eye.bounds.width*.045,center.y-eye.bounds.height*.14,eye.bounds.width*.045,eye.bounds.height*.12,12),{clipPolygon:eye.sclera.map(px)})
      ];
    })
  ];
  const ink=[
    stroke("head-contour","Ink the constructed head silhouette with tapered anime line weight: lighter crown, stronger jaw, softer chin.","ink","#332b38",8,headShape.map((point,index)=>({...point,pressure:.38+.42*Math.pow(Math.abs(Math.sin(index/(headShape.length-1)*Math.PI*2)),1.4)}))),
    ...model.brows.map(brow=>stroke(brow.id,"Ink an expressive brow aligned to the derived brow axis.","ink","#443443",4,brow.points)),
    stroke("nose-bridge","Indicate the nose bridge with a restrained anime line.","ink","#b47f7c",2.5,model.nose.points),
    stroke("mouth-line","Ink the mouth curve aligned to the derived mouth landmark.","ink","#9e5e69",3,model.mouth.points),
    ...model.ears.filter(ear=>ear.visible!==false).map(ear=>stroke(ear.id+"-inner","Indicate the visible inner ear fold with a restrained curved line.","ink","#a97878",2,ear.outline.slice(3,13))),
    ...model.eyes.flatMap(eye=>{
      const left=eye.upperLid[0],right=eye.upperLid[eye.upperLid.length-1];
      return [
        stroke(eye.id+"-upper-lid","Ink the expressive upper eyelid with stronger line weight.","ink","#2b2635",9,eye.upperLid),
        stroke(eye.id+"-upper-crease","Add the upper eyelid crease to establish the eye socket.","ink","#806d79",2.1,eye.upperCrease,{opacity:.68}),
        stroke(eye.id+"-lower-lid","Ink the lighter lower eyelid.","ink","#66566a",3,eye.lowerLid),
        ...eye.lashFan.map((lash,index)=>stroke(eye.id+(index===0?"-outer-lashes":"-outer-lash-"+index),"Fan a tapered lash from the outer eye corner.","ink","#2b2635",2.6,[lash.from,lash.to])),
        stroke(eye.id+"-inner-lashes","Add a short inner lash accent.","ink","#2b2635",2.5,[right,{x:right.x+.014,y:right.y-.02}])
      ];
    }),
    stroke("garment-collar-seam","Define the neckline as a controlled V-shaped garment seam.","ink","#8f819d",3,[model.torso.neck.polygon[3],{x:model.torso.shoulders.center.x,y:model.torso.shoulders.center.y+model.head.bounds.height*.12},model.torso.neck.polygon[2]]),
    ...model.folds.map(fold=>stroke("cloth-fold-"+fold.id,"Draw a soft cloth fold from its tension or compression anchor.","ink","#9a8ba7",2.2,[fold.anchor,{x:fold.anchor.x+(fold.target.x-fold.anchor.x)*.45,y:fold.anchor.y+(fold.target.y-fold.anchor.y)*.45},fold.target])),
    ...model.hair.map(clump=>stroke("hair-flow-"+clump.id,"Ink the root-to-tip direction of this hair clump with a tapered root-to-tip pressure curve.","ink","#574b66",3.4,clump.flow.map((point,index)=>({...point,pressure:.82-.68*index/Math.max(1,clump.flow.length-1)}))))
  ];
  const highlights=[
    ...model.hair.flatMap(clump=>clump.strands.map((strand,index)=>stroke("hair-sheen-"+clump.id+(index?"-"+index:""),"Place a narrow reflected-light ribbon that follows the local hair-clump curvature.","ink",index?"#887b9a":"#c0b3c9",index?2.8:4.2,strand,{opacity:index?.5:.78}))),
    ...model.eyes.map(eye=>stroke(eye.id+"-iris-upper-rim","Define the upper iris rim beneath the eyelid.","ink","#694a57",1.8,eye.iris.slice(5,15),{opacity:.8}))
  ];
  const lightFromLeft=model.shadows.light.x<0;
  const shadowDirection=lightFromLeft?1:-1;
  const headWidth=model.head.bounds.width,headHeight=model.head.bounds.height;
  const faceCenter=model.head.bounds.projectedCenter;
  const nose=model.head.landmarks.noseBase,mouth=model.head.landmarks.mouthCenter,chin=model.head.landmarks.chin;
  const shadowTop={x:nose.x+shadowDirection*headWidth*.018,y:model.head.axes.noseY-headHeight*.015};
  const shadowMid={x:faceCenter+shadowDirection*headWidth*.19,y:model.head.axes.noseY+headHeight*.16};
  const shadowLow={x:chin.x+shadowDirection*headWidth*.025,y:chin.y-headHeight*.035};
  const shadowMouth={x:mouth.x+shadowDirection*headWidth*.04,y:model.head.axes.mouthY+headHeight*.025};
  const shadowPoints=[
    ...quadraticPoints(shadowTop,{x:faceCenter+shadowDirection*headWidth*.11,y:model.head.axes.noseY+headHeight*.015},shadowMid,9),
    ...quadraticPoints(shadowMid,{x:faceCenter+shadowDirection*headWidth*.20,y:model.head.axes.mouthY-headHeight*.025},shadowLow,9).slice(1),
    ...quadraticPoints(shadowLow,{x:mouth.x+shadowDirection*headWidth*.08,y:model.head.axes.mouthY+headHeight*.07},shadowMouth,9).slice(1),
    ...quadraticPoints(shadowMouth,{x:nose.x+shadowDirection*headWidth*.025,y:model.head.axes.noseY+headHeight*.045},shadowTop,9).slice(1)
  ];
  const shadows=[fill("face-cast-shadow","Place a compact cheek-plane cel shadow on the side opposite the key light, following the cheek-to-jaw turn.","#c98f91",shadowPoints,{clipPolygon:headShape.map(px),opacity:.68})];
  const plan={
    format:"zero-studio-digital-artist-brush-plan",version:1,
    title:"Construction-driven anime character study",
    identity:{characterAssetId:"construction-driven-anime-study"},
    layers:[
      {id:"construction",name:"01 Head and body construction",role:"construction",visible:false,strokes:construction},
      {id:"flats",name:"02 Form and feature flats",role:"flat-color",strokes:flat},
      {id:"ink",name:"03 Feature, silhouette and hair-flow ink",role:"clean-line",strokes:ink},
      {id:"shadows",name:"04 Light-direction shadow pass",role:"shadow",strokes:shadows},
      {id:"highlights",name:"05 Hair sheen and eye accents",role:"highlight",strokes:highlights}
    ]
  };
  return validateDigitalArtistBrushPlan(plan);
}

export function compileAnimeConstructionBrushPlan(model) {
  return compileDigitalArtistBrushPlan(buildAnimeConstructionBrushPlan(model));
}
