import{validatePath}from"./engine.mjs";
const PALETTE={ink:"#34434a",shadow:"#46565a",deep:"#263f43",sky:"#d9e8df",sun:"#f5d69b",far:"#a8b9a0",mid:"#65866d",leaf:"#477255",lightLeaf:"#8aa66f",wall:"#d5c4a5",wallLight:"#ead9b9",wood:"#745746",roof:"#514b48",roofLight:"#827064",glass:"#7da7a2",glassLight:"#c4ded0",road:"#646d68",curb:"#c8bea7",red:"#a64c43",metal:"#596b6b"};
const p=(d,fill="none",stroke="none",width=1)=>validatePath({d,fill,stroke,width});
const fmt=n=>Number(n.toFixed(2)).toString();
const poly=points=>"M "+points.map(([x,y])=>fmt(x)+" "+fmt(y)).join(" L ")+" Z";
const curve=(x,y,w,h)=>`M ${fmt(x)} ${fmt(y+h)} C ${fmt(x+w*.1)} ${fmt(y+h*.35)} ${fmt(x+w*.25)} ${fmt(y+h*.2)} ${fmt(x+w*.38)} ${fmt(y+h*.42)} C ${fmt(x+w*.52)} ${fmt(y+h*.05)} ${fmt(x+w*.7)} ${fmt(y+h*.12)} ${fmt(x+w*.82)} ${fmt(y+h*.35)} C ${fmt(x+w*.94)} ${fmt(y+h*.28)} ${fmt(x+w)} ${fmt(y+h*.5)} ${fmt(x+w)} ${fmt(y+h)} Z`;
function layer(name,operations){return{name,operations}}
function ellipse(cx,cy,rx,ry,fill,stroke="none",width=1){const k=.5523;return p(`M ${fmt(cx)} ${fmt(cy-ry)} C ${fmt(cx+k*rx)} ${fmt(cy-ry)} ${fmt(cx+rx)} ${fmt(cy-k*ry)} ${fmt(cx+rx)} ${fmt(cy)} C ${fmt(cx+rx)} ${fmt(cy+k*ry)} ${fmt(cx+k*rx)} ${fmt(cy+ry)} ${fmt(cx)} ${fmt(cy+ry)} C ${fmt(cx-k*rx)} ${fmt(cy+ry)} ${fmt(cx-rx)} ${fmt(cy+k*ry)} ${fmt(cx-rx)} ${fmt(cy)} C ${fmt(cx-rx)} ${fmt(cy-k*ry)} ${fmt(cx-k*rx)} ${fmt(cy-ry)} ${fmt(cx)} ${fmt(cy-ry)} Z`,fill,stroke,width)}
function rect(x,y,w,h,fill,stroke="none",width=1){return p(poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]]),fill,stroke,width)}
function tree(x,y,s,colors= [PALETTE.deep,PALETTE.mid,PALETTE.leaf,PALETTE.lightLeaf]){
 const a=[];
 a.push(p(`M ${fmt(x)} ${fmt(y)} Q ${fmt(x-12*s)} ${fmt(y-45*s)} ${fmt(x+2*s)} ${fmt(y-100*s)} Q ${fmt(x+8*s)} ${fmt(y-125*s)} ${fmt(x+18*s)} ${fmt(y-140*s)} Q ${fmt(x+14*s)} ${fmt(y-75*s)} ${fmt(x+24*s)} ${fmt(y)} Z`, "#665b45"));
 a.push(p(`M ${fmt(x+5*s)} ${fmt(y-45*s)} Q ${fmt(x-25*s)} ${fmt(y-82*s)} ${fmt(x-50*s)} ${fmt(y-94*s)} M ${fmt(x+12*s)} ${fmt(y-68*s)} Q ${fmt(x+40*s)} ${fmt(y-102*s)} ${fmt(x+58*s)} ${fmt(y-112*s)}`,"none","#665b45",5*s));
 const clusters=[[-35,-108,42,28],[-2,-143,48,34],[40,-115,42,29],[-65,-80,38,25],[24,-82,48,30],[70,-86,30,23],[-10,-105,48,33]];
 clusters.forEach(([dx,dy,rx,ry],i)=>a.push(ellipse(x+dx*s,y+dy*s,rx*s,ry*s,colors[i%colors.length])));
 a.push(p(`M ${fmt(x-56*s)} ${fmt(y-90*s)} Q ${fmt(x-20*s)} ${fmt(y-125*s)} ${fmt(x+10*s)} ${fmt(y-113*s)}`,"none","#b0bd83",3*s));
 return a;
}
function windowUnit(x,y,w,h){
 const a=[rect(x-7,y-7,w+14,h+14,PALETTE.wood),rect(x,y,w,h,PALETTE.glass),rect(x+5,y+5,w*.43,h*.38,PALETTE.glassLight),rect(x+w*.54,y+5,w*.4,h*.38,"#9bbcb2"),p(`M ${fmt(x+w*.5)} ${fmt(y)} L ${fmt(x+w*.5)} ${fmt(y+h)} M ${fmt(x)} ${fmt(y+h*.54)} L ${fmt(x+w)} ${fmt(y+h*.54)}`,"none",PALETTE.wood,5),p(`M ${fmt(x+8)} ${fmt(y+10)} L ${fmt(x+w*.38)} ${fmt(y+10)} M ${fmt(x+w*.63)} ${fmt(y+10)} L ${fmt(x+w-8)} ${fmt(y+10)}`,"none","#e3e9d6",3),p(`M ${fmt(x+10)} ${fmt(y+h-8)} L ${fmt(x+w-10)} ${fmt(y+h-8)}`,"none","#587d79",2)];
 return a;
}
function shrub(x,y,s,color=PALETTE.mid){
 const a=[];
 [[0,0,30,16],[-25,-8,25,18],[24,-12,27,20],[45,-2,22,15],[-44,-1,19,13]].forEach(([dx,dy,rx,ry],i)=>a.push(ellipse(x+dx*s,y+dy*s,rx*s,ry*s,[color,PALETTE.lightLeaf,PALETTE.leaf][i%3])));
 a.push(p(`M ${fmt(x-42*s)} ${fmt(y+5*s)} Q ${fmt(x)} ${fmt(y-4*s)} ${fmt(x+48*s)} ${fmt(y+6*s)}`,"none","#a8b67c",2*s));
 return a;
}
export function renderEnvironmentScene(plan){
 if(!plan||plan.version!==1||!plan.building||!Array.isArray(plan.trees)||plan.trees.length<2||plan.trees.length>18)throw Error("مخطط البيئة غير مكتمل: يلزم مبنى وأشجار موزعة على العمق.");
 const b=plan.building,x=b.x,y=b.y,w=b.width,h=b.height,rh=b.roofHeight;
 if([x,y,w,h,rh].some(v=>!Number.isFinite(v))||w<300||h<180||x<0||y<0||x+w>1920||y+h>1080||rh<80||rh>h)throw Error("أبعاد المبنى أو السقف خارج نطاق التكوين.");
 const layers=[];
 const sky=[rect(0,0,1920,1080,plan.sky||PALETTE.sky),ellipse(1550,170,115,115,plan.sun||PALETTE.sun)];
 (plan.mountains||[]).forEach((d,i)=>sky.push(p(d,[ "#bdcbb4","#9eb49e","#829e8a"][i%3])));
 layers.push(layer("01 — السماء والجبال البعيدة",sky));
 const distant=[];
 plan.trees.filter(t=>t.depth==="far").forEach(t=>distant.push(...tree(t.x,t.y,t.scale,[ "#647f70","#809b78","#9caf7c","#a9b887"])));
 layers.push(layer("02 — الغطاء النباتي البعيد",distant));
 const ground=[p("M 0 640 C 360 610 620 650 920 630 C 1280 600 1600 620 1920 585 L 1920 1080 L 0 1080 Z","#899a79"),p("M 0 820 C 450 760 850 790 1180 760 C 1500 735 1710 760 1920 730 L 1920 1080 L 0 1080 Z","#72866d")];
 plan.trees.filter(t=>t.depth==="mid").forEach(t=>ground.push(...tree(t.x,t.y,t.scale)));
 layers.push(layer("03 — الأرض والأشجار الوسطى",ground));
 const architecture=[];
 architecture.push(p(`M ${x-35} ${y+rh} L ${x+w*.48} ${y-35} L ${x+w+45} ${y+rh} L ${x+w+15} ${y+rh+24} L ${x-20} ${y+rh+24} Z`,PALETTE.shadow));
 architecture.push(p(poly([[x,y+rh],[x+w*.48,y-20],[x+w,y+rh],[x+w-18,y+rh+12],[x+18,y+rh+12]]),b.roof||PALETTE.roof,PALETTE.ink,5));
 architecture.push(p(`M ${x+20} ${y+rh-4} L ${x+w*.48} ${y+12} L ${x+w-20} ${y+rh-4}`,"none",PALETTE.roofLight,8));
 for(let i=1;i<=9;i++){const t=i/10,yy=y+rh-12-(rh-40)*t;architecture.push(p(`M ${fmt(x+30+(w*.48-30)*t)} ${fmt(yy)} L ${fmt(x+w-30-(w*.52-30)*t)} ${fmt(yy)}`,"none","#918071",2));}
 architecture.push(p(poly([[x+25,y+rh],[x+w-25,y+rh],[x+w-25,y+h],[x+25,y+h]]),b.wall||PALETTE.wall,PALETTE.ink,5));
 architecture.push(p(poly([[x+25,y+rh],[x+w*.48,y+rh-75],[x+w-25,y+rh],[x+w-25,y+rh+38],[x+25,y+rh+38]]),"#bca98d"));
 (b.windows||[]).forEach(win=>architecture.push(...windowUnit(x+win.x,y+win.y,win.width,win.height)));
 if(b.door){architecture.push(rect(x+b.door.x,y+b.door.y,b.door.width,b.door.height,PALETTE.wood,PALETTE.ink,4),rect(x+b.door.x+9,y+b.door.y+10,b.door.width-18,b.door.height-20,PALETTE.glass),ellipse(x+b.door.x+b.door.width-18,y+b.door.y+b.door.height*.55,4,4,PALETTE.sun));}
 if(b.sign){const sx=x+b.sign.x,sy=y+b.sign.y;architecture.push(rect(sx,sy,b.sign.width,b.sign.height,PALETTE.deep,PALETTE.ink,4),rect(sx+8,sy+8,b.sign.width-16,b.sign.height-16,"#8c6656"),p(`M ${sx+15} ${sy+b.sign.height*.5} Q ${sx+b.sign.width*.5} ${sy-8} ${sx+b.sign.width-15} ${sy+b.sign.height*.5}`,"none","#e3c4a0",4));}
 architecture.push(p(`M ${x-18} ${y+rh+4} Q ${x+w*.5} ${y+rh+28} ${x+w+18} ${y+rh+4}`,"none","#4a4540",9));
 layers.push(layer("04 — العمارة والخامات المعمارية",architecture));
 const near=[];
 plan.trees.filter(t=>t.depth==="near").forEach(t=>near.push(...tree(t.x,t.y,t.scale)));
 plan.shrubs?.forEach(s=>near.push(...shrub(s.x,s.y,s.scale,s.color||PALETTE.mid)));
 if(plan.road){near.push(p(plan.road.edge,PALETTE.curb),p(plan.road.surface,PALETTE.road),p(plan.road.centerLine,"none","#e8e2cb",7));}
 if(plan.van){const v=plan.van;near.push(p(poly([[v.x,v.y+v.height*.45],[v.x+v.width*.12,v.y+v.height*.12],[v.x+v.width*.7,v.y+v.height*.12],[v.x+v.width*.9,v.y+v.height*.42],[v.x+v.width,v.y+v.height*.7],[v.x+v.width,v.y+v.height],[v.x,v.y+v.height]]),"#e1dfd1",PALETTE.ink,5),p(poly([[v.x+v.width*.2,v.y+v.height*.2],[v.x+v.width*.65,v.y+v.height*.2],[v.x+v.width*.78,v.y+v.height*.55],[v.x+v.width*.16,v.y+v.height*.55]]),PALETTE.glass,PALETTE.ink,3),ellipse(v.x+v.width*.24,v.y+v.height,18,18,PALETTE.deep),ellipse(v.x+v.width*.78,v.y+v.height,18,18,PALETTE.deep));}
 layers.push(layer("05 — المقدمة والطريق والعناصر",near));
 const all=layers.flatMap(l=>l.operations);
 if(all.length>300)throw Error("تجاوزت تفاصيل البيئة حد 300 مسار؛ قلل عدد عناصر المخطط.");
 return{version:1,layers,totalOperations:all.length};
}
export const environmentPalette=Object.freeze({...PALETTE});
