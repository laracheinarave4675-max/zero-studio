import{validatePath}from"./engine.mjs";
const PALETTE={ink:"#34434a",shadow:"#46565a",deep:"#263f43",sky:"#d9e8df",sun:"#f5d69b",far:"#a8b9a0",mid:"#65866d",leaf:"#477255",lightLeaf:"#8aa66f",wall:"#d5c4a5",wallLight:"#ead9b9",wood:"#745746",roof:"#514b48",roofLight:"#827064",glass:"#7da7a2",glassLight:"#c4ded0",road:"#646d68",curb:"#c8bea7",red:"#a64c43",metal:"#596b6b"};
const p=(d,fill="none",stroke="none",width=1)=>validatePath({d,fill,stroke,width});
const fmt=n=>Number(n.toFixed(2)).toString();
const poly=points=>"M "+points.map(([x,y])=>fmt(x)+" "+fmt(y)).join(" L ")+" Z";
const curve=(x,y,w,h)=>`M ${fmt(x)} ${fmt(y+h)} C ${fmt(x+w*.1)} ${fmt(y+h*.35)} ${fmt(x+w*.25)} ${fmt(y+h*.2)} ${fmt(x+w*.38)} ${fmt(y+h*.42)} C ${fmt(x+w*.52)} ${fmt(y+h*.05)} ${fmt(x+w*.7)} ${fmt(y+h*.12)} ${fmt(x+w*.82)} ${fmt(y+h*.35)} C ${fmt(x+w*.94)} ${fmt(y+h*.28)} ${fmt(x+w)} ${fmt(y+h*.5)} ${fmt(x+w)} ${fmt(y+h)} Z`;
function layer(name,operations){return{name,operations}}
function ellipse(cx,cy,rx,ry,fill,stroke="none",width=1){const k=.5523;return p(`M ${fmt(cx)} ${fmt(cy-ry)} C ${fmt(cx+k*rx)} ${fmt(cy-ry)} ${fmt(cx+rx)} ${fmt(cy-k*ry)} ${fmt(cx+rx)} ${fmt(cy)} C ${fmt(cx+rx)} ${fmt(cy+k*ry)} ${fmt(cx+k*rx)} ${fmt(cy+ry)} ${fmt(cx)} ${fmt(cy+ry)} C ${fmt(cx-k*rx)} ${fmt(cy+ry)} ${fmt(cx-rx)} ${fmt(cy+k*ry)} ${fmt(cx-rx)} ${fmt(cy)} C ${fmt(cx-rx)} ${fmt(cy-k*ry)} ${fmt(cx-k*rx)} ${fmt(cy-ry)} ${fmt(cx)} ${fmt(cy-ry)} Z`,fill,stroke,width)}
function rect(x,y,w,h,fill,stroke="none",width=1){return p(poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]]),fill,stroke,width)}
function organicLeaf(cx,cy,rx,ry,fill,tilt=0){const x=rx*.35,y=ry*.35;return p(`M ${fmt(cx-rx)} ${fmt(cy)} C ${fmt(cx-rx*.75)} ${fmt(cy-ry)} ${fmt(cx+x)} ${fmt(cy-ry*1.12)} ${fmt(cx+rx)} ${fmt(cy-tilt)} C ${fmt(cx+rx*.65)} ${fmt(cy+ry)} ${fmt(cx-x)} ${fmt(cy+ry*1.08)} ${fmt(cx-rx)} ${fmt(cy)} Z`,fill)}
function tree(x,y,s,colors= [PALETTE.deep,PALETTE.mid,PALETTE.leaf,PALETTE.lightLeaf]){
 const a=[];
 a.push(p(`M ${fmt(x)} ${fmt(y)} Q ${fmt(x-12*s)} ${fmt(y-45*s)} ${fmt(x+2*s)} ${fmt(y-100*s)} Q ${fmt(x+8*s)} ${fmt(y-125*s)} ${fmt(x+18*s)} ${fmt(y-140*s)} Q ${fmt(x+14*s)} ${fmt(y-75*s)} ${fmt(x+24*s)} ${fmt(y)} Z`, "#665b45"));
 a.push(p(`M ${fmt(x+5*s)} ${fmt(y-45*s)} Q ${fmt(x-25*s)} ${fmt(y-82*s)} ${fmt(x-50*s)} ${fmt(y-94*s)} M ${fmt(x+12*s)} ${fmt(y-68*s)} Q ${fmt(x+40*s)} ${fmt(y-102*s)} ${fmt(x+58*s)} ${fmt(y-112*s)}`,"none","#665b45",5*s));
 const clusters=[[-35,-108,42,28],[-2,-143,48,34],[40,-115,42,29],[-65,-80,38,25],[24,-82,48,30],[70,-86,30,23]];
 clusters.forEach(([dx,dy,rx,ry],i)=>{a.push(organicLeaf(x+dx*s,y+dy*s,rx*s,ry*s,colors[i%colors.length],5*s));for(let j=0;j<2;j++){const ox=dx*s+(j-1)*rx*s*.42,oy=dy*s+((j%2)?-1:1)*ry*s*.42;a.push(organicLeaf(x+ox,y+oy,rx*s*.34,ry*s*.42,colors[(i+j+1)%colors.length],2*s));}});
 a.push(p(`M ${fmt(x-56*s)} ${fmt(y-90*s)} Q ${fmt(x-20*s)} ${fmt(y-125*s)} ${fmt(x+10*s)} ${fmt(y-113*s)} M ${fmt(x+4*s)} ${fmt(y-120*s)} Q ${fmt(x+38*s)} ${fmt(y-145*s)} ${fmt(x+56*s)} ${fmt(y-137*s)}`,"none","#b0bd83",3*s));
 return a;
}
function windowUnit(x,y,w,h){
 const a=[rect(x-10,y-9,w+20,h+18,"#5c5146"),rect(x-5,y-5,w+10,h+10,PALETTE.wood),rect(x,y,w,h,PALETTE.glass),rect(x+5,y+5,w*.43,h*.38,PALETTE.glassLight),rect(x+w*.54,y+5,w*.4,h*.38,"#9bbcb2"),p(`M ${fmt(x+w*.5)} ${fmt(y)} L ${fmt(x+w*.5)} ${fmt(y+h)} M ${fmt(x)} ${fmt(y+h*.54)} L ${fmt(x+w)} ${fmt(y+h*.54)}`,"none",PALETTE.wood,5),p(`M ${fmt(x+8)} ${fmt(y+10)} L ${fmt(x+w*.38)} ${fmt(y+10)} M ${fmt(x+w*.63)} ${fmt(y+10)} L ${fmt(x+w-8)} ${fmt(y+10)}`,"none","#e3e9d6",3),p(`M ${fmt(x+10)} ${fmt(y+h-8)} L ${fmt(x+w-10)} ${fmt(y+h-8)}`,"none","#587d79",2),p(`M ${fmt(x+w*.18)} ${fmt(y+8)} L ${fmt(x+w*.08)} ${fmt(y+h*.42)} M ${fmt(x+w*.78)} ${fmt(y+8)} L ${fmt(x+w*.68)} ${fmt(y+h*.38)}`,"none","#e8efe0",2),p(`M ${fmt(x-10)} ${fmt(y+h+9)} Q ${fmt(x+w*.5)} ${fmt(y+h+18)} ${fmt(x+w+10)} ${fmt(y+h+9)}`,"none","#554b40",5)];
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
 const source=plan.building,scaledHeight=Math.min(source.height,Math.max(220,790-source.y)),scale=Math.min(1,scaledHeight/source.height),buildingY=Math.min(source.y,790-scaledHeight);
 const scaled=item=>item?{...item,x:item.x*scale,y:item.y*scale,width:item.width*scale,height:item.height*scale}:item;
 const b={...source,x:source.x+source.width*(1-scale)/2,y:buildingY,width:source.width*scale,height:source.height*scale,roofHeight:source.roofHeight*scale,windows:(source.windows||[]).map(scaled),door:scaled(source.door),sign:scaled(source.sign),awning:scaled(source.awning),balcony:scaled(source.balcony)};
 const x=b.x,y=b.y,w=b.width,h=b.height,rh=b.roofHeight;
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
 for(let i=1;i<=8;i++){const t=i/9,yy=y+rh-12-(rh-40)*t,left=x+30+(w*.48-30)*t,right=x+w-30-(w*.52-30)*t;architecture.push(p(`M ${fmt(left)} ${fmt(yy)} Q ${fmt(x+w*.5)} ${fmt(yy+7)} ${fmt(right)} ${fmt(yy)}`,"none","#a18b78",2));for(let j=1;j<8;j++){const q=j/8,xx=left+(right-left)*q;architecture.push(p(`M ${fmt(xx)} ${fmt(yy-5)} L ${fmt(xx-4)} ${fmt(yy+5)}`,"none","#403d3b",1.5));}}
 architecture.push(p(poly([[x+25,y+rh],[x+w-25,y+rh],[x+w-25,y+h],[x+25,y+h]]),b.wall||PALETTE.wall,PALETTE.ink,5));
 architecture.push(p(poly([[x+25,y+rh],[x+w-25,y+rh],[x+w-25,y+rh+55],[x+25,y+rh+55]]),"#b7a88f"));
 for(let i=1;i<8;i++){const xx=x+25+(w-50)*i/8;architecture.push(p(`M ${fmt(xx)} ${fmt(y+rh+55)} L ${fmt(xx)} ${fmt(y+h-12)}`,"none","#b09b7d",3));}
 architecture.push(p(`M ${fmt(x+25)} ${fmt(y+h-12)} L ${fmt(x+w-25)} ${fmt(y+h-12)}`,"none","#f0dfbd",8));
 architecture.push(p(`M ${fmt(x+18)} ${fmt(y+rh+5)} Q ${fmt(x+w*.5)} ${fmt(y+rh+32)} ${fmt(x+w-18)} ${fmt(y+rh+5)}`,"none","#67584a",7));
 architecture.push(p(poly([[x+25,y+rh],[x+w*.48,y+rh-75],[x+w-25,y+rh],[x+w-25,y+rh+38],[x+25,y+rh+38]]),"#bca98d"));
 (b.windows||[]).forEach(win=>architecture.push(...windowUnit(x+win.x,y+win.y,win.width,win.height)));
 if(b.door){architecture.push(rect(x+b.door.x,y+b.door.y,b.door.width,b.door.height,PALETTE.wood,PALETTE.ink,4),rect(x+b.door.x+9,y+b.door.y+10,b.door.width-18,b.door.height-20,PALETTE.glass),ellipse(x+b.door.x+b.door.width-18,y+b.door.y+b.door.height*.55,4,4,PALETTE.sun));}
 if(b.sign){const sx=x+b.sign.x,sy=y+b.sign.y;architecture.push(rect(sx,sy,b.sign.width,b.sign.height,PALETTE.deep,PALETTE.ink,4),rect(sx+8,sy+8,b.sign.width-16,b.sign.height-16,"#8c6656"),p(`M ${sx+15} ${sy+b.sign.height*.5} Q ${sx+b.sign.width*.5} ${sy-8} ${sx+b.sign.width-15} ${sy+b.sign.height*.5}`,"none","#e3c4a0",4));}
 architecture.push(p(`M ${x-18} ${y+rh+4} Q ${x+w*.5} ${y+rh+28} ${x+w+18} ${y+rh+4}`,"none","#4a4540",9));
 if(b.awning){const a=b.awning,ax=x+a.x,ay=y+a.y,aw=a.width,ah=a.height,color=a.color||PALETTE.red;architecture.push(rect(ax,ay,aw,ah,color,PALETTE.ink,3),rect(ax,ay,aw,ah*.22,"#d9b49a"));for(let j=0;j<6;j++){const xx=ax+j*aw/6;architecture.push(p(`M ${fmt(xx)} ${fmt(ay+ah*.2)} L ${fmt(xx)} ${fmt(ay+ah*.76)} Q ${fmt(xx+aw/12)} ${fmt(ay+ah*1.15)} ${fmt(xx+aw/6)} ${fmt(ay+ah*.76)} L ${fmt(xx+aw/6)} ${fmt(ay+ah*.2)} Z`,j%2?"#b95c4d":"#8e3f3b",PALETTE.ink,1.5));}}
 if(b.balcony){const a=b.balcony,bx=x+a.x,by=y+a.y;architecture.push(p(`M ${bx} ${by} L ${bx+a.width} ${by} L ${bx+a.width} ${by+a.height} L ${bx} ${by+a.height} Z`,"none",PALETTE.wood,5),p(`M ${bx} ${by+a.height*.55} L ${bx+a.width} ${by+a.height*.55}`,"none",PALETTE.wood,5));for(let j=1;j<9;j++){const xx=bx+a.width*j/9;architecture.push(p(`M ${xx} ${by} L ${xx} ${by+a.height*.55}`,"none",PALETTE.wood,3));}}
 for(let i=0;i<5;i++){const xx=x+35+i*(w-70)/5;architecture.push(p(`M ${fmt(xx)} ${fmt(y+rh+65)} L ${fmt(xx)} ${fmt(y+h-20)}`,"none","#f0ddbb",2));}
 architecture.push(p(`M ${fmt(x+20)} ${fmt(y+h-2)} Q ${fmt(x+w*.5)} ${fmt(y+h+18)} ${fmt(x+w-20)} ${fmt(y+h-2)}`,"none","#554b42",8));
 layers.push(layer("04 — العمارة والخامات المعمارية",architecture));
 const near=[];
 const roadY=Math.max(810,Math.min(880,y+h+35));
 plan.trees.filter(t=>t.depth==="near").forEach(t=>near.push(...tree(t.x,t.y,t.scale)));
 plan.shrubs?.forEach(s=>near.push(...shrub(s.x,s.y,s.scale,s.color||PALETTE.mid)));
 for(let i=0;i<4;i++){const px=130+i*510,py=roadY-10+(i%2)*16;near.push(p(`M ${px} ${py} Q ${px+24} ${py-16} ${px+50} ${py-2} Q ${px+75} ${py+8} ${px+98} ${py-4}`,"none","#8d927e",3));}
 near.push(p(`M 0 ${roadY-26} C 420 ${roadY-58} 1150 ${roadY-38} 1920 ${roadY-82} L 1920 1080 L 0 1080 Z`,PALETTE.curb),p(`M 0 ${roadY} C 430 ${roadY-30} 1160 ${roadY-15} 1920 ${roadY-56} L 1920 1080 L 0 1080 Z`,PALETTE.road));
 for(let i=0;i<7;i++){const xx=100+i*285,yy=roadY+135-i*5;near.push(p(`M ${xx} ${yy} L ${xx+115} ${yy-4}`,"none","#e8e2cb",7));}
 near.push(p(`M 220 ${roadY+255} C 360 ${roadY+242} 410 ${roadY+248} 520 ${roadY+235}`,"none","#4c5752",3),p(`M 780 ${roadY+180} Q 860 ${roadY+165} 950 ${roadY+175}`,"none","#81857a",2));
 const curbLine=roadY-26;near.push(p(`M 0 ${curbLine} C 420 ${curbLine-32} 1150 ${curbLine-12} 1920 ${curbLine-56}`,"none","#e8dec5",5));
 if(plan.poles?.length){plan.poles.slice(0,3).forEach((pole,index)=>{const px=pole.x,py=pole.y,ht=pole.height||420;near.push(p(`M ${px-7} ${py} L ${px+6} ${py-ht} L ${px+13} ${py-ht} L ${px+8} ${py} Z`,"#6b6354","#403e38",2),p(`M ${px-42} ${py-ht+22} L ${px+65} ${py-ht+22} M ${px-28} ${py-ht+8} L ${px-28} ${py-ht+38} M ${px+48} ${py-ht+8} L ${px+48} ${py-ht+38}`,"none","#4b4a43",4),ellipse(px-28,py-ht+22,5,5,"#d8d0b4"),ellipse(px+48,py-ht+22,5,5,"#d8d0b4"));if(index===0&&plan.poles.length>1){const next=plan.poles[1];near.push(p(`M ${px+48} ${py-ht+22} Q ${(px+next.x)/2} ${py-ht-35} ${next.x-28} ${next.y-(next.height||420)+22}`,"none","#454943",2));}});}
 if(plan.van){const v=plan.van;near.push(p(poly([[v.x,v.y+v.height*.45],[v.x+v.width*.12,v.y+v.height*.12],[v.x+v.width*.7,v.y+v.height*.12],[v.x+v.width*.9,v.y+v.height*.42],[v.x+v.width,v.y+v.height*.7],[v.x+v.width,v.y+v.height],[v.x,v.y+v.height]]),"#e1dfd1",PALETTE.ink,5),p(poly([[v.x+v.width*.2,v.y+v.height*.2],[v.x+v.width*.65,v.y+v.height*.2],[v.x+v.width*.78,v.y+v.height*.55],[v.x+v.width*.16,v.y+v.height*.55]]),PALETTE.glass,PALETTE.ink,3),ellipse(v.x+v.width*.24,v.y+v.height,18,18,PALETTE.deep),ellipse(v.x+v.width*.78,v.y+v.height,18,18,PALETTE.deep));}
 layers.push(layer("05 — المقدمة والطريق والعناصر",near));
 const all=layers.flatMap(l=>l.operations);
 if(all.length>300)throw Error("تجاوزت تفاصيل البيئة حد 300 مسار؛ قلل عدد عناصر المخطط.");
 return{version:1,layers,totalOperations:all.length};
}
export const environmentPalette=Object.freeze({...PALETTE});
