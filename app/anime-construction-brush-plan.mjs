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
    fill("face-base","Lay in the head volume derived from the head construction.","#f0c4b0",headShape),
    fill("neck-base","Fill the neck mass connecting jaw and torso.","#e7b29f",[model.torso.neck.left,model.torso.neck.right,model.torso.neck.base]),
    fill("torso-base","Block the torso mass between the shoulder and waist anchors.","#d4c9df",ellipsePoints(model.torso.ribcage.center.x,model.torso.ribcage.center.y,model.torso.ribcage.width/2,model.torso.ribcage.height/2)),
    ...model.hair.map(clump=>fill("hair-"+clump.id,"Fill one independent root-to-tip hair clump.","#30283d",clump.outline)),
    ...model.eyes.flatMap(eye=>[
      fill(eye.id+"-sclera","Fill the sclera inside the derived eye system.","#fff9f2",eye.sclera),
      fill(eye.id+"-iris","Fill the iris inside its eye boundary.","#9d625a",eye.iris,{clipPolygon:eye.sclera.map(px)}),
      fill(eye.id+"-pupil","Fill the pupil inside its eye boundary.","#30283b",eye.pupil,{clipPolygon:eye.sclera.map(px)})
    ])
  ];
  const ink=[
    stroke("head-contour","Ink the constructed head silhouette.","ink","#332b38",7,headShape),
    ...model.eyes.flatMap(eye=>[
      stroke(eye.id+"-upper-lid","Ink the expressive upper eyelid with stronger line weight.","ink","#2b2635",7,eye.upperLid),
      stroke(eye.id+"-lower-lid","Ink the lighter lower eyelid.","ink","#66566a",3,eye.lowerLid)
    ]),
    ...model.hair.map(clump=>stroke("hair-flow-"+clump.id,"Ink the root-to-tip direction of this hair clump.","ink","#574b66",3,clump.flow))
  ];
  const shadowAnchor=model.shadows.facePlane.anchor,shadowNormal=model.shadows.facePlane.normal;
  const shadowPoints=[
    shadowAnchor,
    {x:shadowAnchor.x+shadowNormal.x*.07,y:shadowAnchor.y+shadowNormal.y*.07},
    {x:shadowAnchor.x+shadowNormal.x*.13,y:shadowAnchor.y+shadowNormal.y*.12},
    {x:shadowAnchor.x+shadowNormal.x*.04,y:shadowAnchor.y+shadowNormal.y*.18}
  ].map(point=>({x:Math.max(0,Math.min(1,point.x)),y:Math.max(0,Math.min(1,point.y))}));
  const shadows=[fill("face-cast-shadow","Place a small first-pass cast shadow using the declared light direction.","#c98f91",shadowPoints)];
  const plan={
    format:"zero-studio-digital-artist-brush-plan",version:1,
    title:"Construction-driven anime character study",
    identity:{characterAssetId:"construction-driven-anime-study"},
    layers:[
      {id:"construction",name:"01 Head and body construction",role:"construction",strokes:construction},
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
