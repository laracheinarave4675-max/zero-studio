// Deterministic natural-media marks for hand-painted environment work.
// These are Canvas2D drawing primitives, not generated images or prompt-driven art.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const hash=(seed,index,salt=0)=>{const x=Math.sin(seed*12.9898+index*78.233+salt*37.719)*43758.5453;return x-Math.floor(x);};
function colorShift(color,amount){
 const m=/^#([0-9a-f]{6})$/i.exec(color);if(!m)return color;
 const n=parseInt(m[1],16),v=[n>>16&255,n>>8&255,n&255];
 return "#"+v.map(c=>Math.round(clamp(c+(amount>=0?(255-c)*amount:c*amount),0,255)).toString(16).padStart(2,"0")).join("");
}
function leaf(ctx,x,y,length,width,angle,color,alpha,vein=true){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=clamp(alpha,0,1);ctx.fillStyle=color;
 ctx.beginPath();ctx.moveTo(-length*.62,0);
 ctx.bezierCurveTo(-length*.28,-width*1.24,length*.22,-width*1.12,length*.72,-width*.08);
 ctx.quadraticCurveTo(length*.84,width*.12,-length*.62,0);ctx.fill();
 if(vein){ctx.globalAlpha*=.42;ctx.strokeStyle=colorShift(color,.36);ctx.lineWidth=Math.max(.35,length*.022);ctx.beginPath();ctx.moveTo(-length*.48,0);ctx.quadraticCurveTo(0,width*.04,length*.68,width*.02);ctx.stroke();}
 ctx.restore();
}
export function paintNaturalFoliageCluster(ctx,{x,y,size=28,angle=-Math.PI/2,color="#477b4d",seed=1,opacity=.9,texture=.55}={}){
 if(!ctx||typeof ctx.bezierCurveTo!=="function")throw Error("Canvas2D context required");
 const r=i=>hash(seed,i,17),base=Math.max(2,size);
 ctx.save();
 // A branching twig gives the foliage a coherent growth direction.
 ctx.globalAlpha=opacity*.72;ctx.strokeStyle=colorShift(color,-.42);ctx.lineWidth=Math.max(.7,base*.055);ctx.lineCap="round";
 ctx.beginPath();ctx.moveTo(x-base*.12,y+base*.58);
 const tipX=x+Math.cos(angle)*base*.52,tipY=y+Math.sin(angle)*base*.52;
 ctx.quadraticCurveTo(x+Math.cos(angle-.3)*base*.2,y+Math.sin(angle-.3)*base*.2,tipX,tipY);ctx.stroke();
 const count=7+Math.round(texture*7);
 for(let i=0;i<count;i++){
  const t=.12+r(i)*.82,side=i%2?1:-1;
  const bx=x+Math.cos(angle)*base*(t*.52),by=y+Math.sin(angle)*base*(t*.52);
  const spread=(.38+r(i+90)*.72)*side;
  const a=angle+spread,leafLen=base*(.34+r(i+20)*.43),leafWidth=leafLen*(.25+r(i+30)*.17);
  const shade=(i%5===0)?.23:(i%3===0?-.2:(r(i+40)-.5)*.24);
  const tone=colorShift(color,shade);
  leaf(ctx,bx,by,leafLen,leafWidth,a,tone,opacity*(.66+r(i+50)*.32),texture>.12);
  if(texture>.35&&i%3===0){
   const hx=bx+Math.cos(a)*leafLen*.18,hy=by+Math.sin(a)*leafLen*.18;
   leaf(ctx,hx,hy,leafLen*.46,leafWidth*.42,a+.16,colorShift(color,.34),opacity*.34,false);
  }
 }
 ctx.restore();
 return{leafCount:count,branchCount:1};
}
export function paintBarkTexture(ctx,{x,y,length=100,width=18,color="#69503b",seed=1,opacity=.65}={}){
 const r=i=>hash(seed,i,71);ctx.save();ctx.lineCap="round";
 for(let i=0;i<Math.max(4,Math.round(length/13));i++){
  const px=x+(r(i)-.5)*width,py=y+(r(i+30)-.5)*length;
  const h=length*(.035+r(i+60)*.12),bend=(r(i+90)-.5)*width*.22;
  ctx.globalAlpha=opacity*(.12+r(i+120)*.25);ctx.strokeStyle=i%3?colorShift(color,-.24):colorShift(color,.28);
  ctx.lineWidth=.5+r(i+150)*1.3;ctx.beginPath();ctx.moveTo(px,py);ctx.quadraticCurveTo(px+bend,py+h*.5,px+bend*.4,py+h);ctx.stroke();
 }
 ctx.restore();
}
export function paintStoneGrain(ctx,{x,y,width=100,height=50,color="#9a927f",seed=1,opacity=.45}={}){
 const r=i=>hash(seed,i,131);ctx.save();
 for(let i=0;i<Math.max(8,Math.round(width*height/420));i++){
  const px=x+r(i)*width,py=y+r(i+40)*height,rx=.8+r(i+80)*3.8,ry=.5+r(i+120)*1.8;
  ctx.globalAlpha=opacity*(.12+r(i+160)*.3);ctx.fillStyle=i%4?colorShift(color,-.2):colorShift(color,.22);
  ctx.beginPath();ctx.ellipse(px,py,rx,ry,(r(i+200)-.5)*.7,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
