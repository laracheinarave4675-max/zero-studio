const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function random(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
const pt=n=>Number(n.toFixed(2));
function taperedStroke(x,y,dx,dy,width,color,opacity=1,bend=0){
 const len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
 const w0=width,w1=width*.035;
 const x1=x+dx*.34+nx*bend,y1=y+dy*.34+ny*bend;
 const x2=x+dx*.72+nx*bend*.45,y2=y+dy*.72+ny*bend*.45;
 const d=`M ${pt(x)} ${pt(y)} Q ${pt(x1+nx*w0*.5)} ${pt(y1+ny*w0*.5)} ${pt(x+dx+nx*w1)} ${pt(y+dy+ny*w1)} Q ${pt(x2)} ${pt(y2)} ${pt(x1-nx*w0*.5)} ${pt(y1-ny*w0*.5)} Z`;
 return{d,fill:color,stroke:"none",width:0.1,opacity:clamp(opacity,0.04,1)};
}
function softPatch(d,fill,opacity){return{d,fill,stroke:"none",width:0.1,opacity};}
export function applyPainterlyForestPass(scene){
 if(!scene||scene.kind!=="forest-house")return scene;
 const r=random(0x5a17c0de),ops=[];
 const canopyZones=[
  [0,300,390,470],[1500,260,420,470],[0,650,500,360],[1420,650,500,360],
  [300,650,360,260],[1250,650,380,270]
 ];
 const greens=["#183f35","#285440","#3b6947","#568653","#71985b","#a4ad68","#d2c78a","#41634a","#8a9c60","#d8d39a"];
 // Layered, tapered leaf strokes: each mark has a pointed tip and a hand-varied axis.
 for(let i=0;i<220;i++){
  const z=canopyZones[Math.floor(r()*canopyZones.length)];
  const x=z[0]+r()*z[2],y=z[1]+r()*z[3];
  const angle=-.95+r()*1.9,len=5+r()*22,w=1.1+r()*5.4;
  const col=greens[Math.floor(r()*greens.length)];
  ops.push(taperedStroke(x,y,Math.cos(angle)*len,Math.sin(angle)*len,w,col,.38+r()*.52,(r()-.5)*3));
 }
 // Fine grass blades and small sunlit ground strokes follow the garden slope.
 const grass=["#405f43","#58764a","#789157","#a1a56a","#c3b77d"];
 for(let i=0;i<55;i++){
  const x=80+r()*1760,y=790+r()*280;
  const len=5+r()*20,lean=(r()-.5)*12;
  ops.push(taperedStroke(x,y,lean,-len,.8+r()*2.2,grass[Math.floor(r()*grass.length)],.32+r()*.48,(r()-.5)*2));
 }
 // Irregular roof glints and broken tile accents, not repeated straight courses.
 for(let i=0;i<35;i++){
  const x=470+r()*850,y=115+r()*245,len=12+r()*38;
  ops.push(taperedStroke(x,y,len,(-.35+r()*.7)*len,.8+r()*1.8,r()<.65?"#d8c49c":"#343c39",.18+r()*.3,(r()-.5)*2));
 }
 // Directional late-afternoon light: broad translucent shafts and local bounce patches.
 ops.push(softPatch("M 1390 0 L 1510 0 L 1115 710 L 1000 710 Z","#f6d99c",.075));
 ops.push(softPatch("M 1570 0 L 1640 0 L 1370 600 L 1300 600 Z","#fff0bd",.055));
 ops.push(softPatch("M 1180 0 L 1230 0 L 850 540 L 800 540 Z","#f3d9a2",.035));
 // Cool occlusion under the roof/eaves and warm bounced light on the facade.
 ops.push(softPatch("M 425 370 Q 850 330 1395 385 L 1380 420 Q 900 380 430 415 Z","#263d37",.26));
 ops.push(softPatch("M 455 395 Q 520 405 650 392 L 645 445 Q 540 432 450 430 Z","#465347",.14));
 ops.push(softPatch("M 1060 390 Q 1210 392 1380 420 L 1368 458 Q 1210 430 1068 425 Z","#273b37",.18));
 ops.push(softPatch("M 560 470 Q 800 435 1120 465 L 1110 485 Q 800 465 560 490 Z","#f1d29a",.16));
 // Dappled sun spots are deliberately irregular, clustered, and low-contrast.
 for(let i=0;i<20;i++){
  const x=800+r()*620,y=470+r()*330,rx=5+r()*18,ry=2+r()*8;
  const d=`M ${pt(x-rx)} ${pt(y)} Q ${pt(x-rx*.65)} ${pt(y-ry*1.3)} ${pt(x+rx*.25)} ${pt(y-ry)} Q ${pt(x+rx*1.25)} ${pt(y-ry*.2)} ${pt(x+rx)} ${pt(y+ry*.25)} Q ${pt(x)} ${pt(y+ry*1.25)} ${pt(x-rx)} ${pt(y)} Z`;
  ops.push(softPatch(d,r()<.55?"#f4d99d":"#e9dcae",.08+r()*.12));
 }
 scene.layers.push({name:"08 — ضربات الفرشاة والضوء الاتجاهي",operations:ops});
 return scene;
}
