import { buildAnimeConstructionModel } from "./anime-construction-artist.mjs";
import { validateDigitalArtistBrushPlan, compileDigitalArtistBrushPlan } from "./digital-artist-brush-engine.mjs";

const W=1920,H=1080;
const px=point=>({x:Math.round(point.x*W),y:Math.round(point.y*H),pressure:.72});
const fill=(id,intent,color,points,extra={})=>({id,intent,kind:"region-fill",color,points:points.map(px),...extra});
const stroke=(id,intent,brush,color,size,points,extra={})=>({id,intent,brush,color,size,points:points.map(px),...extra});
const ellipsePoints=(cx,cy,rx,ry,count=36)=>Array.from({length:count},(_,i)=>({x:cx+Math.cos(i/count*Math.PI*2)*rx,y:cy+Math.sin(i/count*Math.PI*2)*ry}));
const facePolygon=head=>{
  const {x,y,width,height}=head.bounds,cx=head.landmarks.chin.x;
  return Array.from({length:64},(_,i)=>{
    const a=-Math.PI/2+i/63*Math.PI*2;
    const sy=Math.sin(a),jaw=1-.24*Math.max(0,sy);
    return {x:cx+Math.cos(a)*width*.49*jaw,y:y+height*.5+sy*height*.5};
  });
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
    ...model.ears.map(ear=>fill(ear.id,"Establish the ear silhouette at the head side plane.","#e7b29f",ear.outline)),
    ...model.hair.map(clump=>fill("hair-"+clump.id,"Fill one independent root-to-tip hair clump.","#30283d",clump.outline)),
    ...model.eyes.flatMap(eye=>{
      const center=eye.iris.reduce((sum,p)=>({x:sum.x+p.x/eye.iris.length,y:sum.y+p.y/eye.iris.length}),{x:0,y:0});
      return [
        fill(eye.id+"-sclera","Fill the almond-shaped sclera bounded by upper and lower lids.","#fff9f2",eye.sclera),
        fill(eye.id+"-iris","Fill the iris inside its eye boundary.","#9d625a",eye.iris,{clipPolygon:eye.sclera.map(px)}),
        fill(eye.id+"-pupil","Fill the pupil inside its eye boundary.","#30283b",eye.pupil,{clipPolygon:eye.sclera.map(px)}),
        fill(eye.id+"-catchlight","Add a small catchlight to make the eye read as glossy and alive.","#ffffff",ellipsePoints(center.x-eye.bounds.width*.035,center.y-eye.bounds.height*.12,eye.bounds.width*.035,eye.bounds.height*.1,12),{clipPolygon:eye.sclera.map(px)})
      ];
    })
  ];
  const ink=[
    stroke("head-contour","Ink the constructed head silhouette.","ink","#332b38",7,headShape),
    ...model.brows.map(brow=>stroke(brow.id,"Ink an expressive brow aligned to the derived brow axis.","ink","#443443",4,brow.points)),
    stroke("nose-bridge","Indicate the nose bridge with a restrained anime line.","ink","#b47f7c",2.5,model.nose.points),
    stroke("mouth-line","Ink the mouth curve aligned to the derived mouth landmark.","ink","#9e5e69",3,model.mouth.points),
    ...model.ears.map(ear=>stroke(ear.id+"-inner","Indicate the inner ear fold with a restrained curved line.","ink","#a97878",2,ear.outline.slice(3,13))),
    ...model.eyes.flatMap(eye=>{
      const left=eye.upperLid[0],right=eye.upperLid[eye.upperLid.length-1];
      return [
        stroke(eye.id+"-upper-lid","Ink the expressive upper eyelid with stronger line weight.","ink","#2b2635",7,eye.upperLid),
        stroke(eye.id+"-lower-lid","Ink the lighter lower eyelid.","ink","#66566a",3,eye.lowerLid),
        stroke(eye.id+"-outer-lashes","Add three tapered outer lashes to the upper lid.","ink","#2b2635",3,[left,{x:left.x-.018,y:left.y-.026},{x:left.x-.03,y:left.y-.045}]),
        stroke(eye.id+"-inner-lashes","Add a short inner lash accent.","ink","#2b2635",2.5,[right,{x:right.x+.014,y:right.y-.02}])
      ];
    }),
    ...model.folds.map(fold=>stroke("cloth-fold-"+fold.id,"Draw a soft cloth fold from its tension or compression anchor.","ink","#9a8ba7",2.2,[fold.anchor,{x:fold.anchor.x+(fold.target.x-fold.anchor.x)*.45,y:fold.anchor.y+(fold.target.y-fold.anchor.y)*.45},fold.target])),
    ...model.hair.map(clump=>stroke("hair-flow-"+clump.id,"Ink the root-to-tip direction of this hair clump.","ink","#574b66",2.5,clump.flow))
  ];
  const shadowLeft=model.head.landmarks.cheekLeft.x;
  const shadowPoints=[
    {x:shadowLeft+.006,y:model.head.axes.eyeY+model.head.bounds.height*.1},
    {x:shadowLeft+.045,y:model.head.axes.noseY-model.head.bounds.height*.02},
    {x:shadowLeft+.055,y:model.head.axes.mouthY-model.head.bounds.height*.02},
    {x:shadowLeft+.028,y:model.head.landmarks.chin.y-model.head.bounds.height*.13},
    {x:shadowLeft-.002,y:model.head.landmarks.chin.y-model.head.bounds.height*.23}
  ];
  const shadows=[fill("face-cast-shadow","Place a soft-sided cheek and jaw shadow on the side opposite the declared key light.","#c98f91",shadowPoints,{clipPolygon:headShape.map(px)})];
  const plan={
    format:"zero-studio-digital-artist-brush-plan",version:1,
    title:"Construction-driven anime character study",
    identity:{characterAssetId:"construction-driven-anime-study"},
    layers:[
      {id:"construction",name:"01 Head and body construction",role:"construction",visible:false,strokes:construction},
      {id:"flats",name:"02 Form and feature flats",role:"flat-color",strokes:flat},
      {id:"ink",name:"03 Feature, silhouette and hair-flow ink",role:"clean-line",strokes:ink},
      {id:"shadows",name:"04 Light-direction shadow pass",role:"shadow",strokes:shadows}
    ]
  };
  return validateDigitalArtistBrushPlan(plan);
}

export function compileAnimeConstructionBrushPlan(model) {
  return compileDigitalArtistBrushPlan(buildAnimeConstructionBrushPlan(model));
}
