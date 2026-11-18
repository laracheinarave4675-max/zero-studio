import{validatePath}from"./engine.mjs";
const C={
 ink:"#3e4947",inkSoft:"#58635b",sky:"#b8d6d4",far:"#a9bd9f",hill:"#819b79",hillDark:"#607b66",
 leaf0:"#294f43",leaf1:"#37674e",leaf2:"#4e8057",leaf3:"#6f995e",leaf4:"#9eb46d",leafSun:"#d1c887",
 bark:"#66513d",barkLight:"#9b7854",wall:"#dcc9a8",wallDark:"#b39c7d",wood:"#76543c",
 roof:"#55564f",roof2:"#393f40",tile:"#77786d",glass:"#6f9c9d",glassLight:"#c7ded2",
 asphalt:"#5c6763",curb:"#c7b99d",red:"#a44b41",gold:"#e4b75f",cream:"#f2e4c5"
};
const fmt=n=>Number(n.toFixed(1)).toString(),pt=(x,y)=>fmt(x)+" "+fmt(y),esc=s=>String(s).replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;");
function makePath(d,fill="none",stroke="none",width=1,opacity=1,filter=""){
 return validatePath({d,fill,stroke,width,opacity,filter});
}
function poly(points,fill,stroke="none",width=1,opacity=1,filter=""){
 return makePath("M "+points.map(q=>pt(q[0],q[1])).join(" L ")+" Z",fill,stroke,width,opacity,filter);
}
function line(d,stroke,width=2,opacity=1,filter=""){return makePath(d,"none",stroke,width,opacity,filter)}
function rect(x,y,w,h,fill,stroke="none",width=1,opacity=1,filter=""){
 return poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],fill,stroke,width,opacity,filter);
}
function ellipse(cx,cy,rx,ry,fill,stroke="none",width=1,opacity=1,filter=""){
 const k=.55228475;
 return makePath("M "+pt(cx,cy-ry)+" C "+pt(cx+k*rx,cy-ry)+" "+pt(cx+rx,cy-k*ry)+" "+pt(cx+rx,cy)+" C "+pt(cx+rx,cy+k*ry)+" "+pt(cx+k*rx,cy+ry)+" "+pt(cx,cy+ry)+" C "+pt(cx-k*rx,cy+ry)+" "+pt(cx-rx,cy+k*ry)+" "+pt(cx-rx,cy)+" C "+pt(cx-rx,cy-k*ry)+" "+pt(cx-k*rx,cy-ry)+" "+pt(cx,cy-ry)+" Z",fill,stroke,width,opacity,filter);
}
function organicLeaf(cx,cy,rx,ry,angle,fill,opacity=1){
 const co=Math.cos(angle),si=Math.sin(angle);
 const v=(x,y)=>[cx+x*co-y*si,cy+x*si+y*co];
 const a=v(-rx,0),b=v(-rx*.58,-ry*.88),c=v(rx*.42,-ry*.9),d=v(rx,0),e=v(rx*.48,ry*.84),f=v(-rx*.52,ry*.9);
 return makePath("M "+pt(...a)+" C "+pt(...b)+" "+pt(...c)+" "+pt(...d)+" C "+pt(...e)+" "+pt(...f)+" "+pt(...a)+" Z",fill,"none",1,opacity);
}
function branch(x,y,scale,angle,length,color,width=5){
 const x2=x+Math.cos(angle)*length*scale,y2=y+Math.sin(angle)*length*scale;
 const bend=length*.27*scale;
 return line("M "+pt(x,y)+" C "+pt(x+Math.cos(angle-.35)*bend,y+Math.sin(angle-.35)*bend)+" "+pt(x2-Math.cos(angle+.3)*bend,y2-Math.sin(angle+.3)*bend)+" "+pt(x2,y2),color,width*scale);
}
function rng(seed){let s=(seed>>>0)||1;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}}
function layer(name,operations){return{name,operations}}
function addCloud(target,x,y,s,opacity=.5){
 target.push(ellipse(x,y,s*1.15,s*.25,"#fff1db","none",1,opacity));
 target.push(ellipse(x-s*.48,y-s*.08,s*.55,s*.42,"#fff7e8","none",1,opacity*.85));
 target.push(ellipse(x+s*.16,y-s*.14,s*.72,s*.48,"#fff5df","none",1,opacity*.92));
 target.push(line("M "+pt(x-s,y+s*.12)+" Q "+pt(x,y+s*.22)+" "+pt(x+s,y+s*.1),"#fff0d7",2,opacity*.55));
}
function canopyLobe(ops,x,y,rx,ry,seed,fill,opacity=1){
 const r=rng(seed),j1=.82+r()*.3,j2=.84+r()*.28,j3=.84+r()*.3,j4=.82+r()*.3;
 const d="M "+pt(x-rx,y)+" C "+pt(x-rx*1.18,y-ry*.56)+" "+pt(x-rx*.56*j1,y-ry*1.13)+" "+pt(x-rx*.08,y-ry*.86)+" C "+pt(x+rx*.37,y-ry*1.12*j2)+" "+pt(x+rx*.93,y-ry*.72)+" "+pt(x+rx,y-ry*.06)+" C "+pt(x+rx*1.15,y+ry*.47)+" "+pt(x+rx*.58*j3,y+ry*1.08)+" "+pt(x+rx*.03,y+ry*.84)+" C "+pt(x-rx*.48,y+ry*1.12*j4)+" "+pt(x-rx*1.13,y+ry*.61)+" "+pt(x-rx,y)+" Z";
 ops.push(makePath(d,fill,"none",1,opacity));
}
function drawTree(target,x,y,scale,seed,depth="mid",species="broadleaf"){
 const r=rng(seed),far=depth==="far",dark=far?["#6e8d79","#7f9b7e","#94aa83"]:[C.leaf0,C.leaf1,C.leaf2],light=depth==="near"?[C.leaf2,C.leaf3,C.leaf4,C.leafSun]:[C.leaf1,C.leaf2,C.leaf3,C.leaf4];
 const trunkW=scale*(species==="pine"?13:22),canopyY=y-scale*185;
 target.push(makePath("M "+pt(x-trunkW*.38,y)+" C "+pt(x-trunkW*.68,y-scale*90)+" "+pt(x+trunkW*.34,y-scale*180)+" "+pt(x+trunkW*.18,y-scale*315)+" Q "+pt(x+trunkW*.8,y-scale*190)+" "+pt(x+trunkW*.66,y)+" Z","url(#zero-anime-timber)",C.bark,2));
 for(let i=0;i<7;i++){
  const a=-2.68+i*.43,len=105+r()*90,baseY=y-scale*(70+i*24);
  target.push(branch(x,baseY,scale,a,len,i%2?C.bark:C.barkLight,2.6));
 }
 const lobes=far?7:10;
 for(let i=0;i<lobes;i++){
  const a=(i/lobes)*Math.PI*2,rad=scale*(48+r()*55),cx=x+Math.cos(a)*rad,cy=canopyY+Math.sin(a)*rad*.67;
  const rx=scale*(62+r()*36),ry=scale*(42+r()*27);
  const col=i%4===0?dark[0]:dark[i%dark.length];
  canopyLobe(target,cx,cy,rx,ry,seed+i*13,col,far?.88:.98);
 }
 const count=far?55:depth==="near"?118:88;
 for(let i=0;i<count;i++){
  const a=r()*Math.PI*2,rad=Math.sqrt(r())*scale*(species==="pine"?104:178);
  const cx=x+Math.cos(a)*rad,cy=canopyY+Math.sin(a)*rad*.72;
  const rx=scale*(18+r()*31)*(far?.78:1),ry=rx*(.46+r()*.42),rot=(r()-.5)*1.12;
  const shade= r()<.12?light[light.length-1]:r()<.5?light[Math.floor(r()*light.length)]:dark[Math.floor(r()*dark.length)];
  target.push(organicLeaf(cx,cy,rx,ry,rot,shade,far?.82:.97));
  if(i%5===0){
   target.push(line("M "+pt(cx-rx*.54,cy-ry*.12)+" Q "+pt(cx,cy+ry*.05)+" "+pt(cx+rx*.54,cy+ry*.1),i%2?"#d4d69a":"#b1c88b",1.4,far?.25:.46));
  }
 }
 for(let i=0;i<14;i++){
  const cx=x+(r()-.5)*scale*300,cy=canopyY-scale*80+(r()-.5)*scale*140;
  target.push(organicLeaf(cx,cy,scale*(13+r()*12),scale*(7+r()*8),(r()-.5)*1.3,light[Math.floor(r()*light.length)],.72));
 }
}
function drawShrub(target,x,y,scale,seed){
 const r=rng(seed);
 canopyLobe(target,x,y-scale*12,scale*65,scale*30,seed,C.leaf1,.96);
 for(let i=0;i<42;i++){
  const cx=x+(r()-.5)*scale*132,cy=y-scale*10+(r()-.5)*scale*54,rx=scale*(12+r()*21),ry=scale*(7+r()*14);
  const col=[C.leaf1,C.leaf2,C.leaf3,C.leaf4][Math.floor(r()*4)];
  target.push(organicLeaf(cx,cy,rx,ry,(r()-.5)*1.2,col));
  if(i%7===0)target.push(line("M "+pt(cx-rx*.48,cy)+" Q "+pt(cx,cy-ry*.18)+" "+pt(cx+rx*.47,cy+ry*.06),"#d1d18e",1.4,.56));
 }
}
function drawHill(target,d,fill,opacity=1){target.push(makePath(d,fill,"none",1,opacity))}
function drawWindow(ops,x,y,w,h,seed=0){
 const r=rng(seed);
 ops.push(rect(x-10,y-10,w+20,h+20,"#5c5145","#453f37",5));
 ops.push(rect(x-3,y-3,w+6,h+6,"url(#zero-anime-wood)","#ead8b8",2));
 ops.push(rect(x,y,w,h,"url(#zero-anime-glass)","#435a58",3));
 ops.push(poly([[x+6,y+6],[x+w*.48,y+6],[x+w*.48,y+h*.46],[x+6,y+h*.46]],"#c8e0d5","none",1,.68));
 ops.push(poly([[x+w*.52,y+h*.52],[x+w-5,y+h*.52],[x+w-5,y+h-5],[x+w*.52,y+h-5]],"#527c7d","none",1,.34));
 ops.push(line("M "+pt(x+w*.5,y)+" L "+pt(x+w*.5,y+h),"#4a5149",4));
 ops.push(line("M "+pt(x,y+h*.56)+" L "+pt(x+w,y+h*.56),"#4a5149",3));
 ops.push(line("M "+pt(x+w*.08,y+h*.18)+" L "+pt(x+w*.34,y+h*.08)+" L "+pt(x+w*.29,y+h*.4),"#f4f0d9",3,.72));
 ops.push(line("M "+pt(x+w*.66,y+h*.78)+" Q "+pt(x+w*.8,y+h*.55)+" "+pt(x+w*.92,y+h*.62),"#d8eadc",2,.55));
 ops.push(line("M "+pt(x-7,y+h+12)+" Q "+pt(x+w*.5,y+h+17)+" "+pt(x+w+7,y+h+12),"#554a3f",5,.85));
 for(let i=0;i<3;i++){
  const xx=x+12+r()*Math.max(12,w-24),yy=y+12+r()*Math.max(12,h-24);
  ops.push(line("M "+pt(xx,yy)+" l "+pt(w*.035,h*.045),"#fff8df",1,.38));
 }
}
function drawBench(ops,x,y,scale=1){
 ops.push(poly([[x,y],[x+155*scale,y],[x+142*scale,y+18*scale],[x+10*scale,y+18*scale]],"#80664f","#564b3d",3));
 ops.push(poly([[x+5*scale,y+20*scale],[x+150*scale,y+20*scale],[x+148*scale,y+31*scale],[x+8*scale,y+31*scale]],"#5c4939","#4c4338",2));
 for(const dx of [20,130])ops.push(line("M "+pt(x+dx*scale,y+30*scale)+" L "+pt(x+(dx-5)*scale,y+74*scale),"#4a4940",5));
 ops.push(line("M "+pt(x+12*scale,y+10*scale)+" L "+pt(x+142*scale,y+10*scale),"#c4a883",2,.7));
}
function drawVendingMachine(ops,x,y,w,h){
 ops.push(rect(x+8,y+10,w,h,"url(#zero-anime-shadow)","none",1,.5,"url(#zero-anime-soft-shadow)"));
 ops.push(rect(x,y,w,h,"#d8d5c4","#5a5b56",5));
 ops.push(rect(x+10,y+12,w-20,h*.62,"#a8c5b7","#536361",2));
 for(let i=0;i<3;i++)for(let j=0;j<2;j++){
  const xx=x+18+j*(w*.43),yy=y+20+i*(h*.18);
  ops.push(rect(xx,yy,w*.32,h*.13,["#dca66b","#b65f4f","#739b9c","#d3c59c"][((i*2+j)%4)],"#7c7865",1));
  ops.push(ellipse(xx+w*.25,yy+h*.07,w*.08,h*.04,"#f1dfb9","none",1,.65));
 }
 ops.push(rect(x+w*.68,y+18,w*.22,h*.6,"#45605e","#344644",1.5));
 ops.push(rect(x+10,y+h*.73,w-20,h*.17,"#e7e2d0","#77766d",1));
 ops.push(ellipse(x+w*.78,y+h*.82,5,5,"#7f5145"));
 ops.push(line("M "+pt(x+6,y+4)+" L "+pt(x+w-6,y+4),"#fbf5db",2,.6));
}
function drawPerson(ops,x,y,scale,kind="walking"){
 const coat=kind==="rider"?"#efe4cb":"#d6d6c5",skirt=kind==="rider"?"#775747":"#8b594f";
 ops.push(ellipse(x,y-scale*110,scale*14,scale*17,"#302a27"));
 ops.push(ellipse(x+2*scale,y-scale*108,scale*9,scale*12,"#d5ad8e"));
 ops.push(makePath("M "+pt(x-scale*12,y-scale*92)+" Q "+pt(x,y-scale*105)+" "+pt(x+scale*13,y-scale*91)+" L "+pt(x+scale*18,y-scale*40)+" Q "+pt(x,y-scale*31)+" "+pt(x-scale*18,y-scale*42)+" Z",coat,"#4c4540",2));
 ops.push(poly([[x-scale*17,y-scale*47],[x+scale*18,y-scale*47],[x+scale*27,y-scale*10],[x-scale*25,y-scale*10]],skirt,"#574a42",2));
 ops.push(line("M "+pt(x-scale*9,y-scale*10)+" L "+pt(x-scale*14,y),"#51433c",4));
 ops.push(line("M "+pt(x+scale*9,y-scale*10)+" L "+pt(x+scale*18,y),"#51433c",4));
 ops.push(ellipse(x-scale*14,y,scale*9,scale*4,"#3a3834"));
 ops.push(ellipse(x+scale*18,y,scale*9,scale*4,"#3a3834"));
 ops.push(line("M "+pt(x-scale*14,y-scale*80)+" Q "+pt(x-scale*30,y-scale*55)+" "+pt(x-scale*23,y-scale*35),"#c79d7c",4));
 ops.push(line("M "+pt(x+scale*12,y-scale*80)+" Q "+pt(x+scale*28,y-scale*68)+" "+pt(x+scale*34,y-scale*49),"#c79d7c",4));
}
function drawBicycle(ops,x,y,scale=1){
 const r=48*scale;
 ops.push(ellipse(x,y-r*.1,r,r,"none","#414946",4));
 ops.push(ellipse(x+112*scale,y-r*.1,r,r,"none","#414946",4));
 ops.push(line("M "+pt(x,y-r*.1)+" L "+pt(x+43*scale,y-r*1.2)+" L "+pt(x+112*scale,y-r*.1)+" L "+pt(x+57*scale,y-r*.1)+" Z","#784d39",4));
 ops.push(line("M "+pt(x+43*scale,y-r*1.2)+" L "+pt(x+38*scale,y-r*1.48),"#464e4a",4));
 ops.push(line("M "+pt(x+19*scale,y-r*1.45)+" L "+pt(x+57*scale,y-r*1.45),"#4b4d47",5));
 ops.push(line("M "+pt(x+112*scale,y-r*.1)+" L "+pt(x+128*scale,y-r*1.28),"#464e4a",4));
 ops.push(line("M "+pt(x+116*scale,y-r*1.4)+" L "+pt(x+145*scale,y-r*1.4),"#464e4a",4));
 ops.push(ellipse(x+56*scale,y-r*.1,8*scale,8*scale,"#65523d"));
}
function drawRoofTiles(ops,x,y,w,h,rows=8,cols=18,kind="gable"){
 const base=makePath("M "+pt(x,y+h)+" Q "+pt(x+w*.5,y-18)+" "+pt(x+w,y+h)+" L "+pt(x+w-18,y+h+22)+" Q "+pt(x+w*.5,y+8)+" "+pt(x+18,y+h+22)+" Z","url(#zero-anime-tile)","#343d3d",5);
 ops.push(base);
 for(let row=1;row<=rows;row++){
  const t=row/(rows+1),yy=y+h-t*(h*.82);
  const left=x+20+Math.sin(t*Math.PI)*8,right=x+w-20-Math.sin(t*Math.PI)*8;
  ops.push(line("M "+pt(left,yy)+" Q "+pt((left+right)/2,yy+5)+" "+pt(right,yy),"#a6a08a",2,.72));
  for(let col=0;col<cols;col++){
   const xx=left+(right-left)*col/cols,ww=(right-left)/cols;
   const curveY=yy+3+Math.sin((col/cols)*Math.PI)*4;
   ops.push(line("M "+pt(xx+2,curveY-5)+" Q "+pt(xx+ww*.44,curveY-10)+" "+pt(xx+ww-2,curveY-3),"#c1b49a",1.3,.58));
   if((row+col)%4===0)ops.push(line("M "+pt(xx+ww*.5,curveY-3)+" l "+pt(0,5),"#303b3d",1,.45));
  }
 }
 ops.push(line("M "+pt(x-15,y+h+5)+" Q "+pt(x+w*.5,y+h+37)+" "+pt(x+w+15,y+h+5),"#ddc49b",8,.9));
 ops.push(line("M "+pt(x-8,y+h+14)+" Q "+pt(x+w*.5,y+h+42)+" "+pt(x+w+8,y+h+14),"#453d37",4,.82));
}
function drawSign(ops,x,y,w,h,vertical=false){
 ops.push(rect(x+5,y+8,w,h,"#343c3b","#282f31",4));
 ops.push(rect(x+12,y+14,w-24,h-28,"url(#zero-anime-timber)","#d5b88f",2));
 const n=vertical?Math.max(4,Math.floor(h/32)):Math.max(3,Math.floor(w/72));
 for(let i=0;i<n;i++){
  const cx=vertical?x+w*.5:x+w*(i+.5)/n,cy=vertical?y+h*(i+.5)/n:y+h*.5;
  const s=vertical?Math.min(w*.25,11):Math.min(h*.22,10);
  ops.push(line("M "+pt(cx-s,cy-s*.8)+" Q "+pt(cx+s*.5,cy-s*.2)+" "+pt(cx+s*.35,cy+s)+" M "+pt(cx-s*.65,cy+s*.3)+" Q "+pt(cx,cy-s*.1)+" "+pt(cx+s*.8,cy+s*.2),"#f0d8b1",2.2,.92));
 }
}
function drawPlanter(ops,x,y,scale=1,seed=7){
 const r=rng(seed);
 ops.push(poly([[x-scale*28,y-scale*6],[x+scale*30,y-scale*6],[x+scale*23,y+scale*32],[x-scale*22,y+scale*32]],"#9c7452","#574b3e",2));
 ops.push(ellipse(x,y-scale*7,scale*29,scale*7,"#53684d","#445744",1));
 for(let i=0;i<11;i++){
  const px=x+(r()-.5)*scale*44,py=y-scale*(26+r()*36),q=scale*(10+r()*7);
  ops.push(organicLeaf(px,py,q,q*.55,(r()-.5)*1.4,[C.leaf1,C.leaf2,C.leaf3,C.leaf4][Math.floor(r()*4)]));
 }
}
function drawRoad(ops,variant){
 if(variant==="recede"){
  ops.push(poly([[0,460],[720,540],[1920,470],[1920,1080],[0,1080]],"url(#zero-anime-asphalt)","#414d49",3));
  ops.push(poly([[0,420],[710,505],[1920,440],[1920,510],[710,575],[0,493]],C.curb,"none"));
  ops.push(line("M 0 455 Q 380 495 710 540 Q 1300 505 1920 475","#e9dfc9",5,.8));
  for(let i=0;i<6;i++){
   const x=120+i*310,y=700-i*28,w=160-i*17;
   ops.push(line("M "+pt(x,y)+" L "+pt(x+w,y-5),"#ece5d1",6-i*.5,.88));
  }
  ops.push(line("M 40 900 L 220 886 M 490 858 L 630 848 M 930 832 L 1050 828","#d4d0bd",2,.28));
 }else{
  ops.push(poly([[0,690],[1920,665],[1920,1080],[0,1080]],"url(#zero-anime-asphalt)","#424e4a",3));
  ops.push(poly([[0,645],[1920,625],[1920,700],[0,724]],C.curb,"none"));
  ops.push(line("M 0 683 Q 860 662 1920 648","#e6ddc8",5,.72));
  for(let i=0;i<5;i++){
   const x=60+i*420,y=890-i*8;
   ops.push(line("M "+pt(x,y)+" L "+pt(x+220,y-6),"#ebe5d5",7,.8));
  }
  for(let i=0;i<26;i++){
   const x=80+i*69,y=780+(i%4)*59;
   ops.push(line("M "+pt(x,y)+" l "+pt(18+(i%3)*6,-2),"#aab1a7",1,.16));
  }
 }
 ops.push(makePath("M 0 0 L 1920 0 L 1920 1080 L 0 1080 Z","url(#zero-anime-asphalt-grain)","none",1,.13));
}
function drawFacadeUrban(ops){
 const x=260,y=330,w=1100,h=355;
 ops.push(poly([[x-50,y+18],[x+w+60,y+8],[x+w+36,y+150],[x-24,y+163]],"#687975","#3e4c49",4));
 ops.push(poly([[x,y+102],[x+w,y+92],[x+w,y+h],[x,y+h+12]],"url(#zero-anime-plaster)","#475550",5));
 ops.push(poly([[x-22,y+102],[x+w+35,y+91],[x+w+20,y+145],[x-17,y+156]],"#2f4e4b","#2b403e",4));
 for(let i=0;i<9;i++){
  const yy=y+113+i*8;
  ops.push(line("M "+pt(x-12,yy)+" L "+pt(x+w+20,yy-6),"#b7ad94",1,.28));
 }
 const bandY=y+4;
 ops.push(poly([[x-12,bandY+4],[x+w+24,bandY-3],[x+w+30,bandY+93],[x-12,bandY+101]],"#6b7770","#384744",4));
 const bands=[["#24778a",bandY+13,27],["#e0b44e",bandY+41,23],["#df6f42",bandY+65,24]];
 bands.forEach(([col,by,bh])=>ops.push(poly([[x+6,by],[x+w+12,by-4],[x+w+16,by+bh],[x+6,by+bh+5]],col,"none")));
 for(let i=0;i<8;i++){
  const wx=x+32+i*132,ww=118;
  ops.push(rect(wx-8,y+177,ww+16,158,"#435b58","#3b4b49",3));
  ops.push(rect(wx,y+185,ww,141,"url(#zero-anime-glass)","#1f666b",2));
  ops.push(rect(wx+6,y+191,ww*.45,48,"#c7ded4","#7aa4a0",1,.75));
  ops.push(line("M "+pt(wx+ww*.5,y+185)+" L "+pt(wx+ww*.5,y+326),"#4b605d",4));
  ops.push(line("M "+pt(wx,y+255)+" L "+pt(wx+ww,y+255),"#4b605d",3));
  ops.push(line("M "+pt(wx+12,y+300)+" L "+pt(wx+38,y+204)+" L "+pt(wx+54,y+201),"#e7efdf",3,.72));
  ops.push(line("M "+pt(wx+70,y+198)+" Q "+pt(wx+91,y+220)+" "+pt(wx+102,y+296),"#e7efdf",2,.38));
 }
 ops.push(rect(x+650,y+179,92,170,"url(#zero-anime-timber)","#3d4e49",5));
 ops.push(rect(x+661,y+191,69,138,"url(#zero-anime-glass)","#b1c7b5",3));
 ops.push(ellipse(x+718,y+268,4,4,"#e2c38f"));
 drawBench(ops,x+150,y+395,.82);drawBench(ops,x+345,y+395,.82);
 drawVendingMachine(ops,x+790,y+175,78,190);
 ops.push(rect(x+20,y+432,54,68,"#c35a49","#654e42",3));
 ops.push(line("M "+pt(x+29,y+446)+" L "+pt(x+65,y+446)+" M "+pt(x+29,y+461)+" L "+pt(x+61,y+461),"#f1d9b5",2));
 ops.push(rect(x-20,y+596,w+38,26,"#79684e","#655844",2));
 ops.push(line("M "+pt(x-12,y+623)+" L "+pt(x+w+14,y+616),"#ece0c4",4,.8));
}
function drawRamenBuilding(ops){
 const x=920,y=315,w=590,h=388;
 ops.push(makePath("M "+pt(x-95,y+250)+" L "+pt(x+65,y-64)+" L "+pt(x+w+115,y-8)+" L "+pt(x+w+72,y+295)+" L "+pt(x+w+40,y+365)+" L "+pt(x-98,y+360)+" Z","#6a5848","#473e37",4,1,""));
 ops.push(poly([[x,y],[x+w,y+10],[x+w,y+350],[x,y+350]],"url(#zero-anime-plaster)","#51463b",5));
 ops.push(poly([[x+w,y+9],[x+w+100,y-18],[x+w+87,y+320],[x+w,y+350]],"#b79e80","#574b40",4));
 const ridgeX=x+285,ridgeY=y-176,leftEave=x-108,rightEave=x+w+118,eaveY=y+28;
 // The light gable wall sits behind the roof planes; it must not expose the sky through the roof.
 ops.push(poly([[leftEave+18,eaveY+45],[ridgeX+8,ridgeY+31],[rightEave-18,eaveY+55]],"url(#zero-anime-plaster)","#665643",3));
 ops.push(poly([[leftEave+38,eaveY+38],[ridgeX+8,ridgeY+55],[rightEave-40,eaveY+50],[rightEave-28,eaveY+64],[ridgeX+8,ridgeY+69],[leftEave+28,eaveY+61]],"url(#zero-anime-timber)","none",1,.4));
 ops.push(line("M "+pt(ridgeX+8,ridgeY+34)+" L "+pt(ridgeX+8,eaveY+50),"#785b42",5,.72));
 ops.push(line("M "+pt(leftEave+45,eaveY+42)+" Q "+pt(ridgeX+8,ridgeY+65)+" "+pt(rightEave-44,eaveY+52),"#f0dfc0",3,.62));
 ops.push(poly([[leftEave,eaveY],[ridgeX,ridgeY],[ridgeX+18,ridgeY+30],[leftEave+16,eaveY+53]],"url(#zero-anime-tile)","#3a4140",5));
 ops.push(poly([[ridgeX,ridgeY],[rightEave,eaveY],[rightEave-15,eaveY+48],[ridgeX+18,ridgeY+30]],"#454d4d","#343c3c",5));
 ops.push(poly([[leftEave+5,eaveY+38],[ridgeX+18,ridgeY+30],[rightEave-15,eaveY+48],[rightEave-8,eaveY+69],[ridgeX+10,ridgeY+50],[leftEave+12,eaveY+60]],"#574f46","#3f413c",3));
 for(let row=1;row<=9;row++){
  const t=row/10,ly=eaveY+(ridgeY-eaveY)*t,rx=leftEave+(ridgeX-leftEave)*t;
  const ry=eaveY+(ridgeY-eaveY)*t;
  ops.push(line("M "+pt(leftEave+8+(ridgeX-leftEave)*t,ry+4)+" Q "+pt((leftEave+ridgeX)/2,ry+8)+" "+pt(ridgeX-4,ry+4),"#c0b297",2,.7));
  const rrx=ridgeX+(rightEave-ridgeX)*t,rry=ridgeY+(eaveY-ridgeY)*t;
  ops.push(line("M "+pt(ridgeX+4,rry+5)+" Q "+pt((ridgeX+rightEave)/2,rry+9)+" "+pt(rightEave-5,rry+4),"#b8ad97",2,.66));
 }
 for(let col=1;col<12;col++){
  const t=col/12,lx=leftEave+(ridgeX-leftEave)*t,ly=eaveY+(ridgeY-eaveY)*t;
  ops.push(line("M "+pt(lx-7,ly+3)+" L "+pt(lx+5,ly+23),"#303d3d",1.7,.72));
  const rx=ridgeX+(rightEave-ridgeX)*t,ry=ridgeY+(eaveY-ridgeY)*t;
  ops.push(line("M "+pt(rx+5,ry+3)+" L "+pt(rx-7,ry+24),"#303d3d",1.7,.72));
 }
 ops.push(line("M "+pt(leftEave,eaveY+38)+" Q "+pt(ridgeX+6,ridgeY+31)+" "+pt(rightEave,eaveY+48),"#e0c9a0",8,.94));
 ops.push(line("M "+pt(ridgeX-18,ridgeY-5)+" Q "+pt(ridgeX,ridgeY-18)+" "+pt(ridgeX+22,ridgeY+1),"#d4bd9e",7,.94));
 ops.push(line("M "+pt(leftEave+12,eaveY+46)+" Q "+pt(ridgeX+8,ridgeY+36)+" "+pt(rightEave-12,eaveY+54),"#d1bc98",5,.88));
 ops.push(line("M "+pt(leftEave+22,eaveY+51)+" Q "+pt(ridgeX+10,ridgeY+43)+" "+pt(rightEave-22,eaveY+59),"#3b4140",3,.7));
 ops.push(poly([[x+20,y+42],[x+w-20,y+48],[x+w-20,y+74],[x+20,y+67]],"url(#zero-anime-shadow)","none",1,.28));
 // Directional shadow under the deep eave and warm plaster tonal planes.
 ops.push(poly([[x+10,y+72],[x+w-12,y+80],[x+w-12,y+112],[x+10,y+105]],"url(#zero-anime-shadow)","none",1,.68));
 ops.push(poly([[x+8,y+114],[x+w-8,y+114],[x+w-8,y+148],[x+8,y+148]],"#bda889","none",1,.42));
 ops.push(line("M "+pt(x+14,y+112)+" L "+pt(x+w-14,y+118),"#7f674f",5,.8));
 // Timber posts and recessed wall bays.
 for(let i=0;i<7;i++){
  const xx=x+22+i*88;
  ops.push(rect(xx,y+112,7,235,"url(#zero-anime-timber)","none"));
  ops.push(line("M "+pt(xx+10,y+130)+" L "+pt(xx+10,y+330),"#f0dfbe",1.4,.34));
 }
 for(let row=0;row<4;row++){
  const yy=y+122+row*52;
  ops.push(line("M "+pt(x+12,yy)+" L "+pt(x+w-12,yy+2),"#967b5b",1.8,.32));
 }
 // Sill and lintel depth around each window, with shutters and wood grain.
 for(let i=0;i<4;i++){
  const wx=x+45+i*132;
  drawWindow(ops,wx,y+168,104,115,500+i);
 }
 ops.push(rect(x+477,y+155,82,202,"url(#zero-anime-timber)","#514238",5));
 ops.push(rect(x+488,y+167,59,178,"url(#zero-anime-glass)","#e8ddc4",2));
 ops.push(rect(x+467,y+146,102,12,"#8d7354","#574739",2));
 ops.push(line("M "+pt(x+482,y+161)+" L "+pt(x+482,y+350),"#d8c4a4",2,.6));
 ops.push(poly([[x+492,y+170],[x+540,y+170],[x+540,y+250],[x+492,y+250]],"#d0e0d2","none",1,.28));
 ops.push(ellipse(x+546,y+265,4,4,C.gold));
 ops.push(poly([[x+92,y+133],[x+434,y+133],[x+434,y+143],[x+92,y+143]],"#4c4840","none",1,.62));
 ops.push(rect(x+100,y+145,315,55,"#384747","#2f3b3a",4));
 drawSign(ops,x+112,y+150,290,43,false);
 ops.push(line("M "+pt(x+112,y+198)+" Q "+pt(x+255,y+212)+" "+pt(x+404,y+198),"#e7d7b8",2,.6));
 ops.push(line("M "+pt(x+130,y+205)+" L "+pt(x+385,y+205),"#392f2c",3,.55));
 ops.push(poly([[x+70,y+286],[x+425,y+286],[x+425,y+302],[x+70,y+302]],"#6f5541","#4c4238",2));
 for(let i=0;i<6;i++){
  const xx=x+74+i*58;
  ops.push(makePath("M "+pt(xx,y+301)+" L "+pt(xx+56,y+301)+" L "+pt(xx+54,y+337)+" Q "+pt(xx+28,y+365)+" "+pt(xx+2,y+337)+" Z",i%2?"#ad5749":"#c26a58","#6a463c",2));
 }
 ops.push(line("M "+pt(x+70,y+286)+" L "+pt(x+425,y+286),"#d7bf9a",5,.82));
 for(let i=0;i<9;i++)ops.push(line("M "+pt(x+75+i*42,y+302)+" L "+pt(x+75+i*42,y+333),"#f0c7a8",1.4,.38));
 ops.push(poly([[x+67,y+284],[x+428,y+284],[x+424,y+295],[x+72,y+295]],"#3e4542","none",1,.82));
 drawSign(ops,x-125,y+20,72,250,true);
 for(let i=0;i<4;i++)drawPlanter(ops,x+35+i*118,y+371,1.0,71+i);
}
function drawForestHouse(ops){
 const x=515,y=345,w=865,h=445;
 ops.push(poly([[x-80,y+310],[x+50,y-12],[x+460,y-115],[x+w+100,y+90],[x+w+52,y+370],[x+825,y+410]],"#5c5348","#3e423e",4));
 ops.push(poly([[x,y],[x+610,y+14],[x+700,y+370],[x-36,y+365]],"url(#zero-anime-plaster)","#5c5145",5));
 ops.push(poly([[x+610,y+14],[x+w,y+92],[x+w-5,y+378],[x+700,y+370]],"#c0ad8f","#54493e",4));
 ops.push(poly([[x-88,y+30],[x+345,y-208],[x+585,y-122],[x+860,y+38],[x+820,y+88],[x+570,y-75],[x+343,y-142],[x-35,y+86]],"url(#zero-anime-tile)","#39413f",5));
 ops.push(poly([[x-60,y+64],[x+345,y-175],[x+585,y-105],[x+860,y+60],[x+844,y+86],[x+578,y-76],[x+344,y-128],[x-32,y+91]],"#74685b","#403e38",2));
 ops.push(line("M "+pt(x-82,y+30)+" L "+pt(x+345,y-208)+" L "+pt(x+860,y+38),"#dbc49c",8,.92));
 ops.push(line("M "+pt(x-70,y+41)+" L "+pt(x+345,y-194)+" L "+pt(x+848,y+51),"#3d4240",3,.72));
 // Horizontal tile courses recede toward the apex while staying inside the two roof edges.
 for(let row=1;row<11;row++){
  const t=row/11,yCourse=leftBase[1]+(ridge[1]-leftBase[1])*t;
  const lx=leftBase[0]+(ridge[0]-leftBase[0])*t;
  const rx=rightBase[0]+(ridge[0]-rightBase[0])*t;
  ops.push(line("M "+pt(lx,yCourse)+" Q "+pt((lx+rx)/2,yCourse+4)+" "+pt(rx,yCourse+5),"#c2b296",2.2,.72));
  for(let col=1;col<19;col++){
   const q=col/19,xx=lx+(rx-lx)*q,yy=yCourse+2+Math.sin(q*Math.PI)*2;
   if(col%2===row%2)ops.push(line("M "+pt(xx-4,yy-3)+" Q "+pt(xx,yy-5)+" "+pt(xx+5,yy-2),"#e2d0ae",1.2,.52));
  }
 }
 // Short staggered tile seams follow the pitch without escaping the roof silhouette.
 for(let col=1;col<13;col++){
  const t=col/13,xx=leftBase[0]+(ridge[0]-leftBase[0])*t,yy=leftBase[1]+(ridge[1]-leftBase[1])*t;
  ops.push(line("M "+pt(xx-4,yy+6)+" L "+pt(xx+11,yy+18),"#343f3c",1.45,.62));
  const xr=ridge[0]+(rightBase[0]-ridge[0])*t,yr=ridge[1]+(rightBase[1]-ridge[1])*t;
  ops.push(line("M "+pt(xr+4,yr+6)+" L "+pt(xr-11,yr+18),"#343f3c",1.45,.58));
 }
 ops.push(line("M "+pt(leftBase[0]-4,leftBase[1]+16)+" Q "+pt(ridge[0],ridge[1]+20)+" "+pt(rightBase[0]+5,rightBase[1]+18),"#d8c29d",10,.95));
 for(let i=0;i<6;i++){
  const wx=x+36+i*128;
  drawWindow(ops,wx,y+210,86,120,95+i);
 }
 ops.push(rect(x+20,y+167,595,22,"url(#zero-anime-timber)","#493b31",2));
 for(let i=0;i<8;i++){
  const xx=x+28+i*79;
  ops.push(rect(xx,y+188,5,130,"url(#zero-anime-timber)","none"));
 }
 ops.push(poly([[x+5,y+318],[x+695,y+318],[x+726,y+354],[x-20,y+354]],"#6d5845","#453a32",3));
 for(let i=0;i<14;i++){
  const xx=x-70+i*67;
  ops.push(line("M "+pt(xx,y+355)+" L "+pt(xx+4,y+426),"#5b4939",5,.85));
 }
 // Stone path joints, moss and broken highlights.
 for(let i=0;i<20;i++){
  const xx=x-135+i*49,yy=y+390+Math.sin(i*.55)*12;
  ops.push(line("M "+pt(xx,yy)+" L "+pt(xx+27,yy-4),"#e0d3b5",2,.48));
  if(i%3===0)ops.push(ellipse(xx+18,yy+7,8,3,C.leaf2,"none",1,.6));
 }
 for(let i=0;i<9;i++){
  const xx=x+18+i*76;
  ops.push(line("M "+pt(xx,y+175)+" L "+pt(xx+2,y+320),"#433c35",1.5,.54));
 }
}
function addRoadsidePole(ops,x,y,height,seed=5){
 ops.push(makePath("M "+pt(x-7,y)+" L "+pt(x+3,y-height)+" Q "+pt(x+12,y-height-8)+" "+pt(x+18,y-height)+" L "+pt(x+15,y)+" Z","#6a604e","#46463e",2));
 ops.push(line("M "+pt(x-55,y-height+22)+" L "+pt(x+95,y-height+22),"#4b4e48",5));
 for(let i=0;i<3;i++)ops.push(line("M "+pt(x-28+i*54,y-height+8)+" L "+pt(x-28+i*54,y-height+37),"#5a5b4e",2));
 ops.push(line("M "+pt(x+38,y-height+22)+" Q "+pt(x+170,y-height-10)+" "+pt(x+305,y-height+55),"#444e4a",2,.8));
}
function sceneUrban(){
 const L=[];
 const sky=[rect(0,0,1920,1080,"url(#zero-anime-sky)")];
 sky.push(ellipse(1550,140,230,230,"url(#zero-anime-sun)","none",1,.64,"url(#zero-anime-glow)"));
 for(let i=0;i<4;i++)addCloud(sky,280+i*365,150+(i%2)*48,100+(i%3)*22,.18);
 L.push(layer("01 — السماء وضوء العصر",sky));
 const far=[];
 drawHill(far,"M 0 410 C 250 225 470 310 700 398 C 950 180 1190 280 1410 400 C 1600 250 1790 250 1920 325 L 1920 700 L 0 700 Z","#668b6f");
 drawHill(far,"M 0 470 C 270 333 480 405 690 466 C 900 335 1100 338 1290 470 C 1530 354 1730 375 1920 460 L 1920 740 L 0 740 Z","#86a77c");
 drawTree(far,80,595,1.1,4,"far");drawTree(far,520,535,.88,17,"far");drawTree(far,1690,570,1.04,51,"far");
 L.push(layer("02 — الأشجار والتلال البعيدة",far));
 const ground=[];drawRoad(ground,"front");
 ground.push(poly([[0,650],[1920,628],[1920,740],[0,760]],"#d0c2a4","none"));
 ground.push(line("M 0 686 Q 960 666 1920 650","#eee4cf",4,.92));
 L.push(layer("03 — الرصيف والطريق",ground));
 const facade=[];drawFacadeUrban(facade);
 facade.push(poly([[220,684],[1480,684],[1490,704],[208,704]],"#4e5c53","none"));
 L.push(layer("04 — واجهة المتجر والمواد",facade));
 const plants=[];
 drawTree(plants,125,720,.74,24,"near");drawTree(plants,1510,710,.78,88,"near");
 drawShrub(plants,90,870,1.1,12);drawShrub(plants,1765,832,1.25,19);
 drawPlanter(plants,1188,690,.78,41);drawPlanter(plants,1320,694,.8,42);
 drawPerson(plants,780,690,.8,"walking");drawPerson(plants,890,690,.8,"walking");
 drawBicycle(plants,1000,690,.62);drawPerson(plants,1050,665,.7,"rider");
 L.push(layer("05 — الشخصيات والدراجات والنباتات القريبة",plants));
 const light=[];
 light.push(makePath("M 1330 0 L 1460 0 L 980 700 L 900 700 Z","url(#zero-anime-sun)","none",1,.07));
 light.push(makePath("M 1510 50 L 1570 0 L 1270 690 L 1200 690 Z","url(#zero-anime-sun)","none",1,.045));
 light.push(makePath("M 0 0 L 1920 0 L 1920 1080 L 0 1080 Z","url(#zero-anime-paper-grain)","none",1,.18));
 L.push(layer("06 — الوهج والهواء والملمس",light));
 return{version:1,layers:L.map(l=>({name:l.name,operations:l.operations})),kind:"urban-store"};
}
function sceneRamen(){
 const L=[],sky=[rect(0,0,1920,1080,"url(#zero-anime-sky)")];
 sky.push(ellipse(365,205,300,270,"url(#zero-anime-sun)","none",1,.7,"url(#zero-anime-glow)"));
 addCloud(sky,650,145,120,.23);addCloud(sky,1100,110,96,.18);
 L.push(layer("01 — السماء والشمس الذهبية",sky));
 const hills=[];
 drawHill(hills,"M 0 470 C 190 255 360 280 535 400 C 730 220 980 292 1140 420 C 1350 255 1580 260 1920 420 L 1920 740 L 0 740 Z","#829f7d");
 drawHill(hills,"M 0 530 C 250 355 430 380 620 500 C 850 375 1050 360 1230 500 C 1500 352 1700 402 1920 510 L 1920 790 L 0 790 Z","#65866f");
 for(let i=0;i<5;i++)drawTree(hills,110+i*395,620-(i%2)*35,.9+(i%3)*.12,61+i,"far");
 L.push(layer("02 — التلال والغابات البعيدة",hills));
 const road=[];
 road.push(poly([[0,380],[500,470],[910,595],[1920,565],[1920,1080],[0,1080]],"url(#zero-anime-asphalt)","#444f4d",3));
 road.push(poly([[0,349],[500,440],[910,560],[1920,530],[1920,610],[910,645],[500,518],[0,425]],C.curb,"none"));
 road.push(line("M 0 395 Q 440 475 910 600 Q 1430 600 1920 574","#eee3cf",5,.92));
 for(let i=0;i<7;i++){
  const x=120+i*275,y=715-i*34,w=172-i*16;
  road.push(line("M "+pt(x,y)+" L "+pt(x+w,y-4),"#f0e9d9",6-i*.45,.82));
 }
 road.push(makePath("M 0 0 L 1920 0 L 1920 1080 L 0 1080 Z","url(#zero-anime-asphalt-grain)","none",1,.16));
 L.push(layer("03 — الطريق المتجه نحو الأفق",road));
 const env=[];drawTree(env,1660,700,1.2,7,"mid");drawTree(env,1790,720,.9,8,"mid");
 addRoadsidePole(env,460,620,420,5);addRoadsidePole(env,710,626,340,6);
 L.push(layer("04 — الأشجار والأعمدة والأسلاك",env));
 const shop=[];drawRamenBuilding(shop);
 shop.push(makePath("M 850 685 Q 1130 720 1580 677 L 1600 715 Q 1180 755 820 720 Z","url(#zero-anime-shadow)","none",1,.44,"url(#zero-anime-soft-shadow)"));
 L.push(layer("05 — المطعم الريفي والواجهة",shop));
 const plants=[];
 drawPlanter(plants,920,732,1.0,22);drawPlanter(plants,1510,730,.95,23);
 drawShrub(plants,815,788,1.2,24);drawShrub(plants,1575,777,1.3,25);
 plants.push(poly([[350,655],[490,644],[535,738],[330,755]],"#e5e1d4","#575b55",4));
 plants.push(poly([[385,666],[480,656],[505,716],[368,727]],"url(#zero-anime-glass)","#53625e",3));
 plants.push(ellipse(382,745,21,18,"#273437","#414947",3));plants.push(ellipse(488,729,20,18,"#273437","#414947",3));
 L.push(layer("06 — المركبة والأحواض والمقدمة",plants));
 const light=[];
 light.push(makePath("M 0 0 L 1920 0 L 1920 1080 L 0 1080 Z","url(#zero-anime-paper-grain)","none",1,.17));
 light.push(makePath("M 0 0 L 500 0 L 900 650 L 680 650 Z","url(#zero-anime-sun)","none",1,.055));
 L.push(layer("07 — النور والملمس الجوي",light));
 return{version:1,layers:L,kind:"rural-ramen"};
}
function sceneForest(){
 const L=[],sky=[rect(0,0,1920,1080,"url(#zero-anime-sky)")];
 sky.push(ellipse(1490,185,265,250,"url(#zero-anime-sun)","none",1,.66,"url(#zero-anime-glow)"));
 addCloud(sky,460,116,145,.14);
 L.push(layer("01 — السماء وضوء الشمس",sky));
 const distant=[];
 drawHill(distant,"M 0 380 C 280 205 490 286 720 390 C 940 195 1160 210 1390 370 C 1610 200 1800 245 1920 340 L 1920 800 L 0 800 Z","#63866d");
 for(let i=0;i<5;i++)drawTree(distant,80+i*430,650-(i%3)*40,.8+(i%3)*.12,102+i,"far");
 L.push(layer("02 — الغابة الخلفية والعمق",distant));
 const mid=[];
 for(let i=0;i<5;i++)drawTree(mid,20+i*480,865-(i%2)*40,1.05+(i%3)*.12,220+i,"mid");
 drawShrub(mid,300,840,1.2,10);drawShrub(mid,1570,885,1.4,20);
 L.push(layer("03 — الأشجار حول المنزل",mid));
 const ground=[];
 ground.push(poly([[0,760],[1920,716],[1920,1080],[0,1080]],"#7f936f","none"));
 ground.push(line("M 0 870 Q 960 826 1920 810","#a9b18b",22,.3));
 L.push(layer("04 — الأرض والحديقة",ground));
 const house=[];drawForestHouse(house);
 house.push(poly([[380,773],[1345,737],[1495,810],[340,860]],"#998b71","#5e5b4f",4));
 for(let i=0;i<24;i++){
  const xx=360+i*46,yy=781+Math.sin(i*.35)*17;
  house.push(poly([[xx,yy],[xx+38,yy-4],[xx+50,yy+28],[xx+6,yy+37]],i%3?"#a49b82":"#bdb39a","#706d5c",1.5));
 }
 for(let i=0;i<13;i++){
  const xx=440+i*70,yy=836+(i%3)*12;
  house.push(line("M "+pt(xx,yy)+" L "+pt(xx+24,yy-5),"#d2c5a3",2,.7));
 }
 L.push(layer("05 — المنزل والحجارة والخشب",house));
 const front=[];
 drawTree(front,60,1070,1.22,501,"near");drawTree(front,1840,1070,1.25,502,"near");
 for(let i=0;i<5;i++)drawPlanter(front,475+i*215,815+(i%2)*18,.72,550+i);
 drawShrub(front,1550,1000,1.5,577);
 L.push(layer("06 — أوراق المقدمة وأحواض الزرع",front));
 const finish=[];
 finish.push(makePath("M 0 0 L 1920 0 L 1920 1080 L 0 1080 Z","url(#zero-anime-paper-grain)","none",1,.16));
 finish.push(makePath("M 1200 0 L 1470 0 L 1000 780 L 810 780 Z","url(#zero-anime-sun)","none",1,.05));
 finish.push(makePath("M 1510 0 L 1620 0 L 1280 750 L 1160 750 Z","url(#zero-anime-sun)","none",1,.035));
 L.push(layer("07 — ضوء بين الأشجار والجو",finish));
 return{version:1,layers:L,kind:"forest-house"};
}
const SCENE_RENDERERS={"urban-store":sceneUrban,"rural-ramen":sceneRamen,"forest-house":sceneForest};
export function validateAnimeBackgroundPlan(plan){
 if(!plan||plan.version!==1||!SCENE_RENDERERS[plan.kind])throw Error("نوع مشهد الأنمي غير مدعوم.");
 return{version:1,kind:plan.kind};
}
export function renderAnimeBackground(plan){
 validateAnimeBackgroundPlan(plan);
 const result=SCENE_RENDERERS[plan.kind]();
 let total=0;const names=new Set();
 for(const l of result.layers){
  if(!l.name||names.has(l.name))throw Error("أسماء طبقات الخلفية يجب أن تكون فريدة.");names.add(l.name);
  l.operations=l.operations.map(p=>validatePath(p));total+=l.operations.length;
  if(l.operations.length<1||l.operations.length>1000)throw Error("حجم إحدى طبقات الخلفية غير صالح.");
 }
 if(total>2800)throw Error("تجاوزت الخلفية حد 2800 مسار متجهي.");
 return{version:1,kind:result.kind,layers:result.layers,totalOperations:total,style:"cinematic-2d-anime-with-selective-depth"};
}
export function createAnimeBackgroundTestPlans(){return[
 {version:1,kind:"urban-store"},{version:1,kind:"rural-ramen"},{version:1,kind:"forest-house"}
]}
