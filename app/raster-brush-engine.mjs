const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const hash=(seed,index)=>{let x=(seed|0)+Math.imul(index+1,0x9e3779b1);x=Math.imul(x^(x>>>16),0x85ebca6b);x=Math.imul(x^(x>>>13),0xc2b2ae35);return((x^(x>>>16))>>>0)/4294967296};
const validColor=value=>typeof value==="string"&&/^#[0-9a-f]{6}$/i.test(value);

export function normalizeBrushSettings(input={}){
 const color=validColor(input.color)?input.color:"#252525";
 return Object.freeze({
  color,size:clamp(finite(input.size,18),0.5,240),
  opacity:clamp(finite(input.opacity,0.9),0.01,1),
  hardness:clamp(finite(input.hardness,0.42),0.05,1),
  spacing:clamp(finite(input.spacing,0.16),0.035,0.8),
  texture:clamp(finite(input.texture,0.35),0,1),
  pressure:input.pressure!==false,
  seed:Math.trunc(finite(input.seed,1))|0
 });
}
function pointOf(p){
 if(!p||!Number.isFinite(Number(p.x))||!Number.isFinite(Number(p.y)))throw new TypeError("Brush points require finite x and y coordinates.");
 return{x:Number(p.x),y:Number(p.y),pressure:clamp(finite(p.pressure,0.5),0.03,1),tiltX:clamp(finite(p.tiltX,0),-90,90),tiltY:clamp(finite(p.tiltY,0),-90,90)};
}
export function resampleBrushStroke(points,settings={}){
 const s=normalizeBrushSettings(settings),src=(points||[]).map(pointOf);
 if(!src.length)return[];
 if(src.length===1)return[src[0]];
 const out=[src[0]];
 for(let i=1;i<src.length;i++){
  const a=src[i-1],b=src[i],dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy);
  const avgPressure=(a.pressure+b.pressure)/2;
  const step=Math.max(0.75,s.size*s.spacing*(s.pressure?avgPressure:1));
  const count=Math.max(1,Math.ceil(dist/step));
  for(let j=1;j<=count;j++){
   const t=j/count;
   out.push({x:a.x+dx*t,y:a.y+dy*t,pressure:a.pressure+(b.pressure-a.pressure)*t,tiltX:a.tiltX+(b.tiltX-a.tiltX)*t,tiltY:a.tiltY+(b.tiltY-a.tiltY)*t});
  }
 }
 return out;
}
function rgba(hex,alpha){
 const n=parseInt(hex.slice(1),16),r=n>>16&255,g=n>>8&255,b=n&255;
 return`rgba(${r},${g},${b},${clamp(alpha,0,1)})`;
}
function dab(ctx,p,s,index){
 const pressure=s.pressure?p.pressure:1;
 const radius=Math.max(0.35,s.size*pressure/2);
 const tilt=Math.hypot(p.tiltX,p.tiltY)/90;
 const angle=Math.atan2(p.tiltY,p.tiltX);
 const stretch=1+tilt*0.7;
 const jitter=(hash(s.seed,index)-0.5)*s.texture*radius*0.18;
 const alpha=s.opacity*(0.72+hash(s.seed+31,index)*0.28);
 ctx.save();
 ctx.translate(p.x+jitter,p.y-jitter*0.6);
 ctx.rotate(angle);
 ctx.scale(stretch,1);
 const gradient=ctx.createRadialGradient(0,0,radius*s.hardness,0,0,radius);
 gradient.addColorStop(0,rgba(s.color,alpha));
 gradient.addColorStop(Math.max(0.05,s.hardness),rgba(s.color,alpha*0.98));
 gradient.addColorStop(1,rgba(s.color,0));
 ctx.fillStyle=gradient;
 ctx.globalAlpha=1;
 ctx.beginPath();
 ctx.arc(0,0,radius,0,Math.PI*2);
 ctx.fill();
 if(s.texture>0){
  const flecks=Math.round(2+s.texture*9);
  for(let k=0;k<flecks;k++){
   const a=hash(s.seed+index*17,k)*Math.PI*2;
   const r=Math.sqrt(hash(s.seed+index*29,k+7))*radius*0.88;
   const dot=0.25+hash(s.seed+index*43,k+13)*Math.max(0.5,radius*0.045);
   ctx.fillStyle=rgba(s.color,alpha*s.texture*(0.12+hash(s.seed+index*53,k+19)*0.2));
   ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r,dot,0,Math.PI*2);ctx.fill();
  }
 }
 ctx.restore();
}
export function paintRasterBrushStroke(context,points,settings={}){
 if(!context||typeof context.save!=="function"||typeof context.createRadialGradient!=="function")throw new TypeError("A Canvas 2D rendering context is required.");
 const s=normalizeBrushSettings(settings),samples=resampleBrushStroke(points,s);
 if(!samples.length)return{stampCount:0,bounds:null,settings:s};
 const bounds={minX:Infinity,minY:Infinity,maxX:-Infinity,maxY:-Infinity};
 samples.forEach((p,index)=>{
  const radius=s.size*(s.pressure?p.pressure:1)/2*(1+Math.hypot(p.tiltX,p.tiltY)/90*0.7);
  bounds.minX=Math.min(bounds.minX,p.x-radius);bounds.minY=Math.min(bounds.minY,p.y-radius);
  bounds.maxX=Math.max(bounds.maxX,p.x+radius);bounds.maxY=Math.max(bounds.maxY,p.y+radius);
  dab(context,p,s,index);
 });
 return{stampCount:samples.length,bounds,settings:s};
}
