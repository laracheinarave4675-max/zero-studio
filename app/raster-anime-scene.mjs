import{paintNaturalFoliageCluster,paintBarkTexture,paintStoneGrain}from"./raster-environment-media.mjs";
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const hash=(seed,i,s=0)=>{const x=Math.sin(seed*12.9898+i*78.233+s*37.719)*43758.5453;return x-Math.floor(x)};
const shade=(hex,a)=>{const n=parseInt(hex.slice(1),16),c=[n>>16&255,n>>8&255,n&255];return"#"+c.map(v=>Math.round(clamp(v/255+(a>=0?(1-v/255)*a:(v/255)*a))*255).toString(16).padStart(2,"0")).join("")};
function path(ctx,commands,fill,stroke="none",lineWidth=1){ctx.beginPath();for(const [op,...v]of commands)ctx[op](...v);if(fill!=="none"){ctx.fillStyle=fill;ctx.fill()}if(stroke!=="none"){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke()}}
function polygon(ctx,pts,fill,stroke="none",width=1){path(ctx,[["moveTo",...pts[0]],...pts.slice(1).map(p=>["lineTo",...p]),["closePath"]],fill,stroke,width)}
function gradient(ctx,x0,y0,x1,y1,stops){const g=ctx.createLinearGradient(x0,y0,x1,y1);for(const [p,c]of stops)g.addColorStop(p,c);return g}
function beam(ctx,points,color,alpha){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.closePath();ctx.fill();ctx.restore()}
function tree(ctx,{x,y,s=1,seed=1,far=false,species="broadleaf"}){ctx.save();ctx.translate(x,y);ctx.scale(s,s);
 const trunk=species==="pine"?"#67513b":"#594633";
 path(ctx,[["moveTo",-12,0],["bezierCurveTo",-22,-95,4,-170,18,-260],["bezierCurveTo",36,-180,12,-72,19,0],["closePath"]],gradient(ctx,0,0,24,-220,[[0,"#382f29"],[.5,trunk],[1,"#9a7650"]]));
 paintBarkTexture(ctx,{x:3,y:-115,length:220,width:24,color:trunk,seed,opacity:.5});
 for(let i=0;i<9;i++){const a=-2.9+i*.39,len=75+hash(seed,i)*100;path(ctx,[["moveTo",5,-35-i*19],["quadraticCurveTo",Math.cos(a)*len*.5,-75-i*13,Math.cos(a)*len,-120-i*13]],"none",trunk,4+hash(seed,i,3)*3)}
 const colors=far?["#526f61","#69836b","#849875"]:["#173f36","#245a43","#38764b","#649452","#9bb66a"];
 const blobs=species==="pine"?14:21;
 for(let i=0;i<blobs;i++){const a=hash(seed,i,5)*Math.PI*2,r=Math.sqrt(hash(seed,i,6))*145,cx=Math.cos(a)*r,cy=-205+Math.sin(a)*r*.62,sz=far?30:42;
  ctx.fillStyle=colors[i%colors.length];ctx.globalAlpha=far?.62:.84;ctx.beginPath();ctx.ellipse(cx,cy,sz*(.8+hash(seed,i,7)*.7),sz*.55,hash(seed,i,8)*.5,0,Math.PI*2);ctx.fill();
  if(!far&&i%2===0)paintNaturalFoliageCluster(ctx,{x:cx,y:cy,size:sz*.9,angle:-1.3+hash(seed,i,9)*.8,color:colors[(i+2)%colors.length],seed:seed*31+i,opacity:.82,texture:.8});
 }
 ctx.restore()}
function roof(ctx,pts,seed){
 polygon(ctx,pts,"#39423e","#26332f",7);
 const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 // Clip every tile course to the actual roof silhouette so no tile marks escape the eaves.
 ctx.save();ctx.beginPath();ctx.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)ctx.lineTo(...pts[i]);ctx.closePath();ctx.clip();
 for(let i=1;i<18;i++){
  const t=i/18,y=minY+(maxY-minY)*t,x0=minX+(maxX-minX)*t*.12,x1=maxX-(maxX-minX)*t*.12;
  path(ctx,[["moveTo",x0,y],["quadraticCurveTo",(x0+x1)/2,y+3,x1,y]],"none",i%3?"#59645b":"#a3a18a",1.35);
 }
 for(let i=0;i<52;i++){const x=minX+hash(seed,i,2)*(maxX-minX),y=minY+hash(seed,i,3)*(maxY-minY);ctx.fillStyle=i%3?"#667269":"#b0a17c";ctx.globalAlpha=.22;ctx.beginPath();ctx.ellipse(x,y,2+hash(seed,i,4)*3,1.2,0,0,Math.PI*2);ctx.fill()}
 ctx.restore();ctx.globalAlpha=1;
 path(ctx,[["moveTo",...pts[0]],["lineTo",...pts[1]],["lineTo",...pts[2]]],"none","#a2a18a",6);
}
function house(ctx){ // Multi-plane Japanese timber house with readable perspective.
 polygon(ctx,[[350,370],[790,205],[1135,340],[1130,730],[350,730]],"#d9c6a3","#4c463d",7);
 polygon(ctx,[[790,205],[1135,340],[1130,730],[790,650]],"#b69e7d","#51483c",6);
 polygon(ctx,[[390,395],[790,250],[1090,370],[1090,410],[390,440]],"#65513e");
 for(let i=0;i<8;i++){const x=415+i*85;path(ctx,[["moveTo",x,405-i*7],["lineTo",x,710-i*2]],"none","#604633",12);path(ctx,[["moveTo",x+12,420-i*6],["lineTo",x+12,700]],"none","#ead6ae",3)}
 for(let i=0;i<4;i++){const x=475+i*145;polygon(ctx,[[x,480],[x+92,455-i*4],[x+92,620],[x,635]],"#315d60","#493d32",6);polygon(ctx,[[x+8,490],[x+84,470-i*4],[x+84,610],[x+8,623]],gradient(ctx,x,500,x+90,500,[[0,"#8db4ad"],[.5,"#d9dfc5"],[1,"#638f8a"]]))}
 // upper facade and balcony
 polygon(ctx,[[545,290],[790,205],[1000,288],[1000,435],[545,430]],"#d8c6a4","#514637",6);
 for(let i=0;i<5;i++){const x=585+i*82;polygon(ctx,[[x,310-i*5],[x+48,294-i*5],[x+48,410],[x,414]],"#5c8987","#604936",4);path(ctx,[["moveTo",x+24,305-i*5],["lineTo",x+24,412]],"none","#e4d3b4",3)}
 // balcony rail with converging posts
 path(ctx,[["moveTo",585,405],["lineTo",1000,400],["lineTo",1000,438],["lineTo",585,445]],"none","#64442e",8);
 for(let i=0;i<=12;i++){const t=i/12,x=585+t*415,y=405-t*5;path(ctx,[["moveTo",x,y],["lineTo",x,y+36]],"none","#775239",4)}
 for(let i=0;i<12;i++){const t=i/12;path(ctx,[["moveTo",585+t*415,408-t*5],["lineTo",585+(t+1/12)*415,440-(t+1/12)*5]],"none","#775239",2)}
 // layered tiled roofs, deep eaves
 roof(ctx,[[310,385],[785,175],[1168,335],[1115,382],[785,245],[355,435]],21);
 roof(ctx,[[500,275],[785,55],[1018,235],[978,265],[785,130],[540,310]],42);
 roof(ctx,[[285,470],[500,345],[760,455],[730,490],[500,405],[300,510]],63);
 path(ctx,[["moveTo",310,385],["quadraticCurveTo",290,430,260,438]],"none","#242e2c",12);
 // timber fascia and posts
 for(const [x,y,h]of [[365,420,310],[1110,380,350],[790,245,400],[1000,310,120]]){path(ctx,[["moveTo",x,y],["lineTo",x,y+h]],"none","#49392d",17);path(ctx,[["moveTo",x-3,y+5],["lineTo",x-3,y+h]],"none","#c09a66",3)}
 path(ctx,[["moveTo",350,730],["lineTo",1130,730]],"none","#493b2d",18);
 // warm lit shoji panels
 for(let i=0;i<5;i++){const x=425+i*125;polygon(ctx,[[x,515],[x+90,505],[x+90,685],[x,692]],gradient(ctx,x,515,x+90,515,[[0,"#e7d7b6"],[.45,"#fff0c8"],[1,"#a9c6b7"]]),"#5b4936",5);for(let j=1;j<4;j++)path(ctx,[["moveTo",x+j*22,510],["lineTo",x+j*22,690]],"none","#71563d",3);for(let j=1;j<4;j++)path(ctx,[["moveTo",x,515+j*43],["lineTo",x+90,515+j*43]],"none","#71563d",2)}
}
function stoneWall(ctx){const top=835;
 polygon(ctx,[[0,875],[250,825],[550,838],[900,812],[1280,840],[1580,820],[1920,850],[1920,1080],[0,1080]],"#77796d","#424c43",5);
 const rows=5;
 for(let r=0;r<rows;r++){let x=-30;while(x<1940){const w=95+hash(r,Math.round(x),1)*85,h=43+hash(r,Math.round(x),2)*13,y=top+r*48+(hash(r,Math.round(x),3)-.5)*8;
  const pts=[[x,y],[x+w*.2,y-9],[x+w,y-4],[x+w*.92,y+h],[x+8,y+h+5]];
  polygon(ctx,pts,gradient(ctx,x,y,x+w,y+h,[[0,"#bcb7a5"],[.55,"#8d9185"],[1,"#626d68"]]),"#4b5149",3);
  paintStoneGrain(ctx,{x:x+5,y:y+5,width:w-10,height:h-8,color:"#c5c0ad",seed:r*991+Math.round(x),opacity:.55});x+=w-4}}
 // moss and creeping plants along the cap stones
 for(let i=0;i<55;i++){const x=i*37,y=835+hash(12,i)*34;paintNaturalFoliageCluster(ctx,{x,y,size:15+hash(14,i)*18,angle:-1.4,color:i%2?"#4d8248":"#83a75b",seed:i+500,opacity:.72,texture:.75})}
}
export function renderJapaneseForestHouseRaster(ctx,{width=1920,height=1080,seed=2026}={}){
 if(!ctx||typeof ctx.save!=="function"||typeof ctx.createLinearGradient!=="function")throw Error("Canvas2D rendering context required");
 ctx.save();ctx.clearRect(0,0,width,height);ctx.fillStyle=gradient(ctx,0,0,0,height,[[0,"#9fc6bc"],[.46,"#d7d4a6"],[1,"#788d72"]]);ctx.fillRect(0,0,width,height);
 // distant wooded mountain silhouettes
 polygon(ctx,[[0,360],[160,230],[350,315],[560,170],[760,320],[1020,190],[1270,350],[1540,170],[1920,300],[1920,750],[0,750]],"#7f9b82");
 for(let i=0;i<10;i++)tree(ctx,{x:i*225-70,y:760+hash(seed,i)*35,s:.65+hash(seed,i,3)*.65,seed:seed+i*7,far:true});
 // strong sunlit clearing and atmospheric rays
 ctx.save();ctx.globalAlpha=.2;ctx.fillStyle=gradient(ctx,1450,0,800,780,[[0,"#fff8cb"],[.5,"#fff2b1"],[1,"rgba(255,245,190,0)"]]);ctx.fillRect(600,0,1320,850);ctx.restore();
 for(let i=0;i<9;i++){const x=1170+i*78;beam(ctx,[[x,0],[x+25,0],[x-300,820],[x-390,820]],"#fff5bd",.035+hash(seed,i,4)*.045)}
 // dark canopy framing left and bright grove right
 tree(ctx,{x:65,y:820,s:1.45,seed:seed+40});tree(ctx,{x:1830,y:845,s:1.28,seed:seed+80});
 tree(ctx,{x:1480,y:840,s:1.05,seed:seed+90});tree(ctx,{x:220,y:820,s:1.05,seed:seed+100});
 house(ctx);
 // foreground pine and sculpted garden shrubs
 for(let i=0;i<8;i++){const x=280+i*190;paintNaturalFoliageCluster(ctx,{x,y:760+hash(seed,i)*75,size:55+hash(seed,i,2)*45,angle:-1.45,color:["#28523b","#39784a","#6d9d50"][i%3],seed:seed+i*101,opacity:.88,texture:.95})}
 // retaining wall and light catching plants
 stoneWall(ctx);
 // foreground glints and atmospheric dust
 for(let i=0;i<180;i++){const x=900+hash(seed,i,7)*950,y=150+hash(seed,i,8)*700,r=.6+hash(seed,i,9)*2;ctx.globalAlpha=.08+hash(seed,i,10)*.22;ctx.fillStyle=i%3?"#fff0a8":"#e5f4c0";ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
 ctx.restore();return{width,height,seed,layers:["atmosphere","distant forest","architecture","foliage","stonework","light"],renderer:"Canvas2D"};
}
