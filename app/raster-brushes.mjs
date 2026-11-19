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
 for(let segment=0;segment<samples.length-1;segment++){
  const a=samples[segment],b=samples[segment+1],dx=b.x-a.x,dy=b.y-a.y,distance=Math.hypot(dx,dy);
  if(distance<0.001)continue;
  const angle=Math.atan2(dy,dx),steps=Math.max(1,Math.ceil(distance/spacing));
  for(let step=segment===0?0:1;step<=steps;step++){
   if(output.length>=30000)return output;
   const t=step/steps,x=a.x+dx*t,y=a.y+dy*t,p=a.pressure+(b.pressure-a.pressure)*t;
   if(last&&Math.hypot(x-last.x,y-last.y)<spacing*0.35&&segment===0&&step===0)continue;
   emit(x,y,p,angle,serial++);last={x,y};
  }
 }
 return output;
}
export function drawRasterBrushStroke(context,points,options={}){
 if(!context||typeof context.save!=="function"||typeof context.fill!=="function"||typeof context.ellipse!=="function")throw Error("سياق الرسم النقطي غير صالح");
 const brush=String(options.brush||"gouache"),opacity=clamp(Number(options.opacity??1),0,1),color=String(options.color||"#243348");
 const texture=clamp(Number(options.texture??0.55),0,1),dabs=buildBrushDabs(points,{...options,brush});
 context.save();
 context.globalCompositeOperation=options.erase?"destination-out":"source-over";
 for(const dab of dabs){
  context.save();
  context.translate(dab.x,dab.y);
  context.rotate(dab.angle);
  context.globalAlpha=clamp(dab.alpha*opacity,0,1);
  context.fillStyle=color;
  if(brush==="watercolor"&&typeof context.createRadialGradient==="function"){
   const gradient=context.createRadialGradient(0,0,dab.radius*0.08,0,0,dab.radius);
   gradient.addColorStop(0,color);gradient.addColorStop(0.62,color);gradient.addColorStop(1,"rgba(255,255,255,0)");
   context.fillStyle=gradient;
  }
  context.beginPath();
  context.ellipse(0,0,dab.radius,dab.radius*dab.aspect,0,0,Math.PI*2);
  context.fill();
  if(texture>0&&dab.grain>0){
   const marks=brush==="graphite"?3:brush==="gouache"?4:brush==="foliage"?1:0;
   context.globalAlpha=clamp(dab.alpha*opacity*texture*dab.grain*0.42,0,0.48);
   context.fillStyle=brush==="graphite"?"#18212c":color;
   for(let mark=0;mark<marks;mark++){
    const angle=hash(Number(options.seed)||1,dab.index,mark+8)*Math.PI*2;
    const distance=dab.radius*(0.18+hash(Number(options.seed)||1,dab.index,mark+13)*0.62);
    const r=Math.max(0.18,dab.radius*(brush==="graphite"?0.055:0.09));
    context.beginPath();
    context.ellipse(Math.cos(angle)*distance,Math.sin(angle)*distance,r,r*0.65,angle,0,Math.PI*2);
    context.fill();
   }
  }
  context.restore();
 }
 context.restore();
 return{dabCount:dabs.length,brush};
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
