import{validatePath}from"./engine.mjs";
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n)};
const hexRGB=h=>{const s=String(h||"#888888").replace("#","");const v=s.length===3?s.split("").map(c=>c+c).join(""):s;return[0,2,4].map(i=>parseInt(v.slice(i,i+2),16)||0)};
const shade=(color,k)=>"#"+hexRGB(color).map(v=>Math.max(0,Math.min(255,Math.round(v*k))).toString(16).padStart(2,"0")).join("");
const path=(points)=>"M "+points.map(p=>p.map(v=>Number(v.toFixed(2))).join(" ")).join(" L ")+" Z";
const circlePath=(cx,cy,r)=>{const k=.55228475;return`M ${cx} ${cy-r} C ${cx+k*r} ${cy-r} ${cx+r} ${cy-k*r} ${cx+r} ${cy} C ${cx+r} ${cy+k*r} ${cx+k*r} ${cy+r} ${cx} ${cy+r} C ${cx-k*r} ${cy+r} ${cx-r} ${cy+k*r} ${cx-r} ${cy} C ${cx-r} ${cy-k*r} ${cx-k*r} ${cy-r} ${cx} ${cy-r} Z`};
export function renderMeshEnvironment(plan){
 if(!plan||plan.version!==1||!plan.building||!Array.isArray(plan.trees)||plan.trees.length<2||plan.trees.length>8)throw Error("مخطط المشهد ثلاثي الأبعاد غير مكتمل.");
 const b=plan.building;
 for(const k of ["width","height","depth"])if(!Number.isFinite(b[k])||b[k]<=0||b[k]>20)throw Error("أبعاد المبنى ثلاثي الأبعاد غير صالحة.");
 const camera=plan.camera||{position:[9,8,19],target:[0,2.4,0]};
 const pos=camera.position,target=camera.target,forward=norm(sub(target,pos)),right=norm(cross(forward,[0,1,0])),up=norm(cross(right,forward)),focal=1050;
 const project=v=>{const q=sub(v,pos),z=dot(q,forward);if(z<=.1)return null;const s=focal/z;return[960+dot(q,right)*s,540-dot(q,up)*s,z]};
 const buckets=Array.from({length:5},()=>[]);
 const light=norm(plan.sunDirection||[-.55,.9,.35]);
 let count=0;
 const face=(bucket,vertices,color,outline="#34434a",stroke=1.1)=>{if(count>=900)return;const n=norm(cross(sub(vertices[1],vertices[0]),sub(vertices[2],vertices[0]))),lambert=Math.max(0,dot(n,light)),factor=.48+lambert*.62;const pts=vertices.map(project);if(pts.some(p=>!p))return;const d=path(pts.map(p=>[p[0],p[1]]));const depth=pts.reduce((s,p)=>s+p[2],0)/pts.length;buckets[bucket].push({depth,op:validatePath({d,fill:shade(color,factor),stroke:outline,width:stroke})});count++;};
 const line=(bucket,points,color="#514b43",width=1.5)=>{if(count>=285)return;const pts=points.map(project);if(pts.some(p=>!p))return;const d="M "+pts.map(p=>p[0].toFixed(2)+" "+p[1].toFixed(2)).join(" L ");const depth=pts.reduce((s,p)=>s+p[2],0)/pts.length;buckets[bucket].push({depth,op:validatePath({d,fill:"none",stroke:color,width})});count++;};
 const quad=(bucket,a,b,c,d,color,outline)=>face(bucket,[a,b,c,d],color,outline);
 const box=(bucket,x,y,z,w,h,d,color,outline)=>{const a=[x,y,z],A=[x+w,y,z],B=[x+w,y+h,z],C=[x,y+h,z],e=[x,y,z+d],f=[x+w,y,z+d],g=[x+w,y+h,z+d],q=[x,y+h,z+d];quad(bucket,a,A,B,C,color,outline);quad(bucket,e,q,g,f,shade(color,.8),outline);quad(bucket,a,e,f,A,shade(color,.72),outline);quad(bucket,A,f,g,B,shade(color,1.12),outline);quad(bucket,B,g,q,C,shade(color,.9),outline);quad(bucket,C,q,e,a,shade(color,.82),outline);};
 const cylinder=(bucket,x,y,z,r,h,color,segments=7)=>{const ring=[];for(let i=0;i<segments;i++){const a=i*Math.PI*2/segments;ring.push([x+Math.cos(a)*r,y,z+Math.sin(a)*r]);}const top=ring.map(p=>[p[0],y+h,p[2]]);for(let i=0;i<segments;i++)face(bucket,[ring[i],ring[(i+1)%segments],top[(i+1)%segments],top[i]],shade(color,.78+i*.045));};
 const sphere=(bucket,x,y,z,rx,ry,rz,color,segments=7)=>{const rings=[];for(let j=1;j<=3;j++){const phi=-Math.PI/2+j*Math.PI/4;const ring=[];for(let i=0;i<segments;i++){const t=i*Math.PI*2/segments;ring.push([x+Math.cos(phi)*Math.cos(t)*rx,y+Math.sin(phi)*ry,z+Math.cos(phi)*Math.sin(t)*rz]);}rings.push(ring);}const top=[x,y+ry,z],bottom=[x,y-ry,z];for(let i=0;i<segments;i++){face(bucket,[top,rings[0][i],rings[0][(i+1)%segments]],shade(color,1.05));for(let j=0;j<2;j++)face(bucket,[rings[j][i],rings[j+1][i],rings[j+1][(i+1)%segments],rings[j][(i+1)%segments]],shade(color,.78+j*.18));face(bucket,[bottom,rings[2][(i+1)%segments],rings[2][i]],shade(color,.72));}};
 const rectPlane=(bucket,x,y,z,w,h,color)=>quad(bucket,[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z],color);
 const sky=buckets[0];sky.push({depth:9999,op:validatePath({d:"M 0 0 L 1920 0 L 1920 1080 L 0 1080 Z",fill:plan.sky||"#c8dfe0",stroke:"none"})});sky.push({depth:9998,op:validatePath({d:circlePath(1530,170,105),fill:plan.sun||"#f4d59b",stroke:"none"})});
 // Distant hills are layered silhouettes behind the 3D set.
 const hill=(d,color)=>{buckets[0].push({depth:9000,op:validatePath({d,fill:color,stroke:"none"})})};
 hill("M 0 500 Q 260 300 530 460 T 1050 430 T 1530 450 T 1920 380 L 1920 1080 L 0 1080 Z","#a9bd9d");
 hill("M 0 590 Q 340 430 700 550 T 1400 520 T 1920 500 L 1920 1080 L 0 1080 Z","#819d7c");
 // Ground, sidewalk and road.
 quad(1,[-24,0,-16],[24,0,-16],[24,0,35],[-24,0,35],"#78876f","#596c5d");
 quad(1,[-24,.025,2],[24,.025,2],[24,.025,5],[-24,.025,5],"#d0c4aa","#a89b83");
 quad(3,[-24,.04,5],[24,.04,5],[24,.04,35],[-24,.04,35],"#626c68","#4c5752");
 for(let z=8;z<30;z+=5)quad(3,[-.25,.055,z],[.25,.055,z],[.25,.055,z+1.8],[-.25,.055,z+1.8],"#e9e0c8","none");
 // Building walls and shaded planes.
 const x=-b.width/2,z=-b.depth/2,w=b.width,h=b.height,d=b.depth,front=z+d;
 box(2,x,0,z,w,h,d,b.wall||"#d8c6a8","#594e43");
 // Front facade warm light plane, recessed shadow below roof and side trim.
 quad(2,[x+.08,h-.55,front+.025],[x+w-.08,h-.55,front+.025],[x+w-.08,h-.08,front+.025],[x+.08,h-.08,front+.025],"#b39d80","#6b594a");
 // Gabled roof: two real 3D sloped planes with thickness and tile seams.
 const ridgeY=h+2.25,ridgeX=0,over=.55,frontZ=front+.42,backZ=z-.42;
 quad(2,[x-over,h,frontZ],[ridgeX,ridgeY,frontZ],[ridgeX,ridgeY,backZ],[x-over,h,backZ],b.roof||"#514b48","#383b3a");
 quad(2,[ridgeX,ridgeY,frontZ],[x+w+over,h,frontZ],[x+w+over,h,backZ],[ridgeX,ridgeY,backZ],shade(b.roof||"#514b48",1.12),"#383b3a");
 line(2,[[x-over,h,frontZ+.02],[ridgeX,ridgeY,frontZ+.02],[x+w+over,h,frontZ+.02]],"#b39b7c",5);
 for(let i=1;i<13;i++){const t=i/13,xx=x-over+(w/2+over)*t,yy=h+(ridgeY-h)*t;line(2,[[xx,yy+.08,frontZ+.04],[xx,yy+.08,backZ-.04]],"#8b7969",1.4);const xr=w/2*t;line(2,[[ridgeX+xr,ridgeY-(ridgeY-h)*t,frontZ+.04],[ridgeX+xr,ridgeY-(ridgeY-h)*t,backZ-.04]],"#3b3b39",1);}
 for(let i=1;i<10;i++){const t=i/10,xx=x+(w*.5)*t,yy=h+(ridgeY-h)*(1-t);line(2,[[xx,yy,frontZ+.06],[xx,yy,backZ-.06]],"#a18c76",1);const xr=w*(1-t);line(2,[[xr,yy,frontZ+.06],[xr,yy,backZ-.06]],"#a18c76",1);}
 // Ridge cap and layered eaves.
 line(2,[[0,ridgeY+.06,frontZ],[0,ridgeY+.06,backZ]],"#c1a98a",6);
 line(2,[[x-over,h,frontZ+.05],[x+w+over,h,frontZ+.05]],"#d4bd9c",7);
 // Front windows with deep frames, glass, mullions and reflections.
 const windows=b.windows||[{x:-3.4,y:1.5,width:1.55,height:1.65},{x:-1.1,y:1.5,width:1.55,height:1.65},{x:1.2,y:1.5,width:1.55,height:1.65}];
 for(const win of windows.slice(0,6)){const wx=win.x,wy=win.y,ww=win.width,wh=win.height;box(2,wx-.08,wy-.08,front+.06,ww+.16,wh+.16,.12,"#665447","#3e4140");rectPlane(2,wx,wy,front+.19,ww,wh,"#79a6a3");rectPlane(2,wx+.08,wy+wh*.58,front+.205,ww*.36,wh*.33,"#b7d1c6");line(2,[[wx+ww*.5,wy,front+.23],[wx+ww*.5,wy+wh,front+.23]],"#574f45",.055);line(2,[[wx,wy+wh*.53,front+.23],[wx+ww,wy+wh*.53,front+.23]],"#574f45",.055);line(2,[[wx+.12,wy+wh*.88,front+.24],[wx+ww*.38,wy+wh*.88,front+.24]],"#edf0dd",.035);}
 if(b.door){const v=b.door;box(2,v.x,v.y,front+.07,v.width,v.height,.14,"#705442","#3e4140");rectPlane(2,v.x+.12,v.y+.1,front+.25,v.width-.24,v.height-.2,"#7da6a0");line(2,[[v.x+v.width*.5,v.y+.1,front+.27],[v.x+v.width*.5,v.y+v.height-.1,front+.27]],"#574d42",.06);}
 // Shop sign and red noren curtain.
 if(b.sign){const s=b.sign;box(2,s.x,s.y,front+.11,s.width,s.height,.18,"#303b3c","#343b3a");rectPlane(2,s.x+.08,s.y+.08,front+.32,s.width-.16,s.height-.16,"#9c6c59");}
 if(b.awning){const a=b.awning;quad(2,[a.x,a.y,front+.25],[a.x+a.width,a.y,front+.25],[a.x+a.width,a.y-.65,front+.95],[a.x,a.y-.65,front+.95],a.color||"#a64c43","#553e37");for(let i=1;i<9;i++){const xx=a.x+a.width*i/9;line(2,[[xx,a.y,front+.27],[xx,a.y-.62,front+.94]],"#e0b69a",.035);}}
 if(b.balcony){const v=b.balcony;box(2,v.x,v.y,front+.22,v.width,.12,.5,"#705744","#443c34");for(let i=0;i<9;i++)box(2,v.x+i*v.width/8,v.y+.12,front+.55,.045,v.height||.55,.05,"#705744","#443c34");line(2,[[v.x,v.y+(v.height||.55)+.12,front+.55],[v.x+v.width,v.y+(v.height||.55)+.12,front+.55]],"#473e36",.06);}
 // Roof tile rhythms and timber structure.
 for(let i=0;i<8;i++){const yy=.65+i*.48;line(2,[[x+.05,yy,front+.035],[x+w-.05,yy,front+.035]],"#a88f72",.025);}
 for(let i=0;i<9;i++){const xx=x+.2+i*(w-.4)/9;line(2,[[xx,.08,front+.04],[xx,h-.08,front+.04]],"#b09a7d",.035);}
 for(let i=0;i<4;i++){const yy=.55+i*.92;line(2,[[x+.08,yy,front+.055],[x+w-.08,yy,front+.055]],"#6d5948",.055);}
 for(const win of windows.slice(0,6)){const wx=win.x,wy=win.y,ww=win.width,wh=win.height;line(2,[[wx-.12,wy-.14,front+.28],[wx+ww+.12,wy-.14,front+.28]],"#e4d2b4",.05);line(2,[[wx-.12,wy+wh+.14,front+.28],[wx+ww+.12,wy+wh+.14,front+.28]],"#55483d",.06);}
 // Grounded trees: faceted trunks and multi-volume foliage.
 for(const t of plan.trees){const tx=t.x,tz=t.z,scale=t.scale||1,bucket=tz>2?4:1;cylinder(bucket,tx,0,tz,.17*scale,2.5*scale,"#665542",7);cylinder(bucket,tx,1.4*scale,tz,.07*scale,1.2*scale,"#6b5844",5);sphere(bucket,tx,3.15*scale,tz,.95*scale,1.05*scale,.85*scale,t.color||"#477255",7);sphere(bucket,tx-.62*scale,2.85*scale,tz+.08,.68*scale,.72*scale,.68*scale,"#8aa66f",7);sphere(bucket,tx+.66*scale,2.92*scale,tz-.1,.7*scale,.78*scale,.7*scale,"#62865d",7);}
 // Utility poles, cross-arms and overhead cables.
 for(const pole of (plan.poles||[]).slice(0,2)){cylinder(4,pole.x,0,pole.z,.11,pole.height||8,"#655b4a",7);box(4,pole.x-.85,(pole.height||8)-.35,pole.z-.08,1.7,.12,.16,"#655b4a");}
 if(plan.poles?.length>1){const a=plan.poles[0],b=plan.poles[1];line(4,[[a.x,a.height||8,a.z],[b.x,b.height||8,b.z]],"#414b48",.025);}
 // Small parked van.
 if(plan.van){const v=plan.van;box(4,v.x,.35,v.z,v.width,1.25,v.depth,"#e2dfd2","#464b48");box(4,v.x+.25,1.05,v.z+v.depth-.04,v.width*.55,.55,.08,"#83aaa6","#414846");box(4,v.x+v.width*.66,.55,v.z+v.depth-.04,v.width*.22,.65,.08,"#9bbab2","#414846");box(4,v.x+.05,.28,v.z+v.depth+.03,.22,.2,.1,"#d9c8a4","#414846");box(4,v.x+v.width-.28,.28,v.z+v.depth+.03,.22,.2,.1,"#d9c8a4","#414846");line(4,[[v.x+v.width*.62,.42,v.z+v.depth+.06],[v.x+v.width*.62,1.55,v.z+v.depth+.06]],"#51554f",.025);cylinder(4,v.x+.65,0,v.z+v.depth,.34,.18,"#263437",9);cylinder(4,v.x+v.width-.65,0,v.z+v.depth,.34,.18,"#263437",9);}
 // Soft stylized cast-shadow polygons on the ground plane.
 quad(1,[-5.8,.035,1],[2.8,.035,1],[4.8,.035,5],[-7,.035,5],"#59685d","none");
 const names=["01 — السماء والآفاق","02 — الأرض والأشجار الخلفية","03 — المبنى والعمارة","04 — الطريق والأرصفة","05 — أعمدة الشارع والعناصر الأمامية"];
 const layers=buckets.map((items,i)=>({name:names[i],operations:items.sort((a,b)=>b.depth-a.depth).map(x=>x.op)})).filter(x=>x.operations.length);
 const total=layers.reduce((s,l)=>s+l.operations.length,0);
 if(total>900)throw Error("تجاوز مشهد الشبكات ثلاثية الأبعاد حد 900 مسار متجهي.");
 return{version:1,layers,totalOperations:total,camera:{position:pos,target}};
}
