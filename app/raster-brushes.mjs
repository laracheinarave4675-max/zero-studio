// Human-operated raster brush engine. It generates editable-in-project pixel marks,
// never artwork from a prompt or an external image-generation model.
export const RASTER_BRUSH_PRESETS = Object.freeze({
 graphite: { spacing: 0.16, radius: 0.44, opacity: 0.28, jitter: 0.12, aspect: 0.72, grain: 0.7 },
 ink: { spacing: 0.2, radius: 0.5, opacity: 0.94, jitter: 0.025, aspect: 0.96, grain: 0.04 },
 gouache: { spacing: 0.18, radius: 0.58, opacity: 0.62, jitter: 0.13, aspect: 0.64, grain: 0.54 },
 watercolor: { spacing: 0.24, radius: 0.82, opacity: 0.2, jitter: 0.08, aspect: 0.82, grain: 0.08 },
 foliage: { spacing: 0.78, radius: 0.72, opacity: 0.84, jitter: 0.48, aspect: 0.34, grain: 0.18 }
});
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const hash=(seed,index,salt=0)=>{const x=Math.sin(seed*12.9898+index*78.233+salt*37.719)*43758.5453;return x-Math.floor(x)};
function cleanPoints(points){
 if(!Array.isArray(points)||!points.length||points.length>20000)throw Error("نقاط ضربة الفرشاة غير صالحة");
 return points.map(point=>{
  const x=Number(point?.x),y=Number(point?.y),pressure=Number(point?.pressure??0.55);
  if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>1000000||Math.abs(y)>1000000||!Number.isFinite(pressure))throw Error("إحداثيات أو ضغط الفرشاة غير صالح");
  return{x,y,pressure:clamp(pressure,0.06,1)};
 });
}
export function buildBrushDabs(points,options={}){
 const samples=cleanPoints(points),brush=String(options.brush||"gouache"),profile=RASTER_BRUSH_PRESETS[brush];
 if(!profile)throw Error("نوع الفرشاة النقطية غير معروف");
 const size=Number(options.size??12);
 if(!Number.isFinite(size)||size<0.5||size>240)throw Error("حجم الفرشاة خارج الحدود");
 const pressureEnabled=options.pressureSensitive!==false;
 const seed=Number.isFinite(+options.seed)?+options.seed:Math.round(samples[0].x*17+samples[0].y*31+size*13);
 const spacing=Math.max(0.65,size*profile.spacing);
 const output=[];
 const emit=(x,y,pressure,angle,index)=>{
  const p=pressureEnabled?clamp(pressure,0.06,1):0.72;
  const randomA=hash(seed,index,1)-0.5,randomB=hash(seed,index,2)-0.5;
  const radius=Math.max(0.3,size*profile.radius*(0.24+0.76*p)*0.5);
  output.push({
   x:x+randomA*radius*profile.jitter*2,
   y:y+randomB*radius*profile.jitter*2,
   radius,
   alpha:clamp(profile.opacity*(0.42+0.58*p),0.015,1),
   angle:angle+(hash(seed,index,3)-0.5)*profile.jitter*1.7,
   aspect:profile.aspect*(0.82+hash(seed,index,4)*0.36),
   grain:profile.grain,
   index
  });
 };
 if(samples.length===1){emit(samples[0].x,samples[0].y,samples[0].pressure,0,0);return output}
 let serial=0,last=null;
 const curve=(a,b,c,d,t)=>0.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
 const tangent=(a,b,c,d,t)=>0.5*((-a+c)+2*(2*a-5*b+4*c-d)*t+3*(-a+3*b-3*c+d)*t*t);
 for(let segment=0;segment<samples.length-1;segment++){
  const a=samples[segment],b=samples[segment+1],distance=Math.hypot(b.x-a.x,b.y-a.y);
  if(distance<0.001)continue;
  const p0=samples[Math.max(0,segment-1)],p3=samples[Math.min(samples.length-1,segment+2)],steps=Math.max(1,Math.ceil(distance/spacing));
  for(let step=segment===0?0:1;step<=steps;step++){
   if(output.length>=30000)return output;
   const t=step/steps,x=curve(p0.x,a.x,b.x,p3.x,t),y=curve(p0.y,a.y,b.y,p3.y,t),p=a.pressure+(b.pressure-a.pressure)*t;
   const dx=tangent(p0.x,a.x,b.x,p3.x,t),dy=tangent(p0.y,a.y,b.y,p3.y,t),angle=Math.atan2(dy,dx);
   if(last&&Math.hypot(x-last.x,y-last.y)<spacing*0.35&&segment===0&&step===0)continue;
   emit(x,y,p,angle,serial++);last={x,y};
  }
 }
 return output;
}
function colorVariant(color,amount){
 const m=/^#([0-9a-f]{6})$/i.exec(color);if(!m)return color;
 const n=parseInt(m[1],16),v=[n>>16&255,n>>8&255,n&255];
 return "#"+v.map(c=>Math.round(clamp(c+(amount>=0?(255-c)*amount:c*amount),0,255)).toString(16).padStart(2,"0")).join("");
}
function paintRibbon(ctx,dabs,{color,opacity,seed,widthScale=1,roughness=.08,texture=.4,bristles=5,edgePigment=.16,dryness=.18}){
 if(!dabs.length)return;
 if(dabs.length===1){const d=dabs[0];ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.angle);ctx.globalAlpha=opacity*d.alpha;ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,0,d.radius*widthScale,d.radius*d.aspect,0,0,Math.PI*2);ctx.fill();ctx.restore();return;}
 // Build one continuous pressure-shaped body. The edge variation is correlated
 // along the stroke so it reads as a hand-loaded brush, not random noisy pixels.
 const stride=Math.max(1,Math.ceil(dabs.length/3600)),s=dabs.filter((_,i)=>i%stride===0||i===dabs.length-1),left=[],right=[],edge=[];
 for(let i=0;i<s.length;i++){
  const d=s[i],p=s[Math.max(0,i-1)],n=s[Math.min(s.length-1,i+1)];
  let dx=n.x-p.x,dy=n.y-p.y,len=Math.hypot(dx,dy);
  if(len<.001){dx=Math.cos(d.angle);dy=Math.sin(d.angle);len=1;}
  const nx=-dy/len,ny=dx/len;
  const slow=(hash(seed,Math.floor(i/5),131)-.5)*roughness;
  const fine=(hash(seed,i,137)-.5)*roughness*.42;
  const h=Math.max(.22,d.radius*widthScale),wobble=(slow+fine)*h;
  left.push([d.x+nx*(h+wobble),d.y+ny*(h+wobble)]);
  right.push([d.x-nx*(h-wobble*.72),d.y-ny*(h-wobble*.72)]);
  edge.push({d,nx,ny,h});
 }
 ctx.save();ctx.globalAlpha=opacity;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(left[0][0],left[0][1]);
 for(let i=1;i<left.length;i++)ctx.lineTo(left[i][0],left[i][1]);
 for(let i=right.length-1;i>=0;i--)ctx.lineTo(right[i][0],right[i][1]);
 ctx.closePath();ctx.fill();ctx.restore();
 // Pigment gathers lightly at the outside edge of a loaded gouache stroke.
 if(edgePigment>0){
  ctx.save();ctx.strokeStyle=color;ctx.lineCap="round";ctx.lineJoin="round";ctx.beginPath();
  for(let i=0;i<edge.length;i+=Math.max(1,Math.ceil(edge.length/900))){
   const e=edge[i],side=i%2?1:-1,x=e.d.x+e.nx*e.h*side,y=e.d.y+e.ny*e.h*side;
   if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.globalAlpha=opacity*edgePigment;ctx.lineWidth=Math.max(.35,Math.min(2.4,s[0].radius*.075));ctx.stroke();ctx.restore();
 }
 if(texture<=0||bristles<=0)return;
 // Bristle lanes are broken into short, irregular passages. This creates dry
 // pigment skips and visible brush direction instead of uniform parallel wires.
 const laneCount=Math.max(2,Math.min(16,Math.round(bristles+texture*5))),step=Math.max(1,Math.ceil(s.length/1100));
 ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
 for(let lane=0;lane<laneCount;lane++){
  let drawing=false,run=0;
  for(let i=0;i<s.length;i+=step){
   const d=s[i],p=s[Math.max(0,i-1)],n=s[Math.min(s.length-1,i+1)];
   let dx=n.x-p.x,dy=n.y-p.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
   const across=(lane/(Math.max(1,laneCount-1))-.5)*1.42;
   const jitter=(hash(seed,d.index,lane+181)-.5)*d.radius*.16;
   const x=d.x+nx*(across*d.radius+jitter),y=d.y+ny*(across*d.radius+jitter);
   const skip=hash(seed,d.index,lane+223)<dryness*(.18+.62*(1-texture));
   if(skip){if(drawing){ctx.stroke();ctx.beginPath();drawing=false;}continue;}
   if(!drawing){ctx.beginPath();ctx.moveTo(x,y);drawing=true;run=0;}else ctx.lineTo(x,y);
   run++;
   if(run>4&&hash(seed,d.index,lane+251)<dryness*.13){ctx.stroke();ctx.beginPath();ctx.moveTo(x,y);run=0;}
   ctx.strokeStyle=colorVariant(color,hash(seed,lane,71)>.5?.19:-.24);
   ctx.lineWidth=Math.max(.28,texture*(.32+hash(seed,lane,97)*.9));
   ctx.globalAlpha=opacity*(.07+hash(seed,lane,113)*.2);
  }
  if(drawing)ctx.stroke();
 }
 ctx.restore();
}
export function drawRasterBrushStroke(context,points,options={}){
 if(!context||typeof context.save!=="function"||typeof context.fill!=="function"||typeof context.beginPath!=="function"||typeof context.ellipse!=="function")throw Error("سياق الرسم النقطي غير صالح");
 const brush=String(options.brush||"gouache"),opacity=clamp(Number(options.opacity??1),0,1),color=String(options.color||"#243348"),texture=clamp(Number(options.texture??.55),0,1),seed=Number.isFinite(+options.seed)?+options.seed:1,dabs=buildBrushDabs(points,{...options,brush});
 context.save();context.globalCompositeOperation=options.erase?"destination-out":"source-over";
 if(brush==="watercolor"){for(const d of dabs){context.save();context.translate(d.x,d.y);context.rotate(d.angle);context.globalAlpha=clamp(d.alpha*opacity*.62,0,.32);context.fillStyle=color;if(typeof context.createRadialGradient==="function"){const g=context.createRadialGradient(0,0,d.radius*.1,0,0,d.radius*1.3);g.addColorStop(0,color);g.addColorStop(.72,color);g.addColorStop(1,"rgba(255,255,255,0)");context.fillStyle=g;}context.beginPath();context.ellipse(0,0,d.radius*1.18,d.radius*d.aspect*1.24,0,0,Math.PI*2);context.fill();context.restore();}}
 else if(brush==="foliage"){for(const d of dabs){context.save();context.translate(d.x,d.y);context.rotate(d.angle);context.globalAlpha=clamp(d.alpha*opacity,0,1);context.fillStyle=color;context.beginPath();context.moveTo(-d.radius*.95,0);context.quadraticCurveTo(-d.radius*.25,-d.radius*d.aspect*1.85,d.radius,0);context.quadraticCurveTo(-d.radius*.25,d.radius*d.aspect*1.85,-d.radius*.95,0);context.fill();if(texture>0){context.globalAlpha*=.42;context.strokeStyle=colorVariant(color,.32);context.lineWidth=Math.max(.35,d.radius*.07);context.beginPath();context.moveTo(-d.radius*.72,0);context.lineTo(d.radius*.8,0);context.stroke();}context.restore();}}
 else{const widthScale=brush==="graphite"?.66:1,alpha=clamp(opacity*(brush==="graphite"?.65:1),0,1);paintRibbon(context,dabs,{color,opacity:alpha,seed,widthScale,roughness:brush==="ink"?.018:brush==="graphite"?.17:.12,texture:brush==="ink"?0:texture,bristles:brush==="ink"?0:brush==="graphite"?7:Math.max(3,Math.round(9*texture))});}
 context.restore();return{dabCount:dabs.length,brush,renderMode:brush==="watercolor"?"wash":brush==="foliage"?"leaf-marks":"continuous-ribbon"};
}
export function mapPointsToRaster(points,canvasWidth,canvasHeight,imageWidth,imageHeight,brushSize){
 const values=[canvasWidth,canvasHeight,imageWidth,imageHeight,brushSize].map(Number);
 if(values.some(value=>!Number.isFinite(value)||value<=0))throw Error("أبعاد مساحة الرسم غير صالحة");
 const scale=Math.min(canvasWidth/imageWidth,canvasHeight/imageHeight);
 const offsetX=(canvasWidth-imageWidth*scale)/2,offsetY=(canvasHeight-imageHeight*scale)/2;
 return{
  points:cleanPoints(points).map(point=>({x:(point.x-offsetX)/scale,y:(point.y-offsetY)/scale,pressure:point.pressure})),
  size:clamp(brushSize/scale,0.5,240),
  scale,offsetX,offsetY
 };
}
