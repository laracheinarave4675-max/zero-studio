export const WIDTH=1920,HEIGHT=1080,MAX_FRAMES=600,MAX_LAYERS=100,MAX_OPERATIONS=10000;
const NS="http://www.w3.org/2000/svg";
export const uid=(p="id")=>p+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8);
export const createLayer=(name="طبقة 1")=>({id:uid("layer"),name,visible:true,locked:false,operations:[]});
export const createFrame=()=>({id:uid("frame"),layers:[createLayer()]});
export const createProject=(name="مشروع جديد")=>({format:"zero-studio",version:2,name,width:WIDTH,height:HEIGHT,fps:24,frames:[createFrame()]});
export function safeColor(c,f="#172033"){return typeof c==="string"&&(/^#[0-9a-f]{3,8}$/i.test(c)||/^(black|white|red|blue|green|none)$/i.test(c))?c:f}

const PATH_ARITY={M:2,L:2,H:1,V:1,C:6,S:4,Q:4,T:2,A:7,Z:0};
export function pathGeometryBounds(d){
 if(typeof d!=="string"||!d.length||d.length>100000)throw Error("بيانات مسار SVG غير صالحة");
 const tokens=tokenizePathData(d);
 if(!tokens.length||!("command"in tokens[0])||!/[Mm]/.test(tokens[0].command))throw Error("يجب أن يبدأ مسار SVG بأمر M");
 let i=0,command=null,x=0,y=0,sx=0,sy=0,hasMove=false;
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 const include=(px,py)=>{if(!Number.isFinite(px)||!Number.isFinite(py)||Math.abs(px)>1000000||Math.abs(py)>1000000)throw Error("إحداثيات المسار التراكمية خارج الحدود");minX=Math.min(minX,px);minY=Math.min(minY,py);maxX=Math.max(maxX,px);maxY=Math.max(maxY,py)};
 while(i<tokens.length){
  if("command"in tokens[i])command=tokens[i++].command;
  else if(!command)throw Error("أمر SVG مفقود قبل الإحداثيات");
  const upper=command.toUpperCase(),relative=command!==upper,arity=PATH_ARITY[upper];
  if(arity===undefined)throw Error("أمر SVG غير مدعوم");
  if(upper==="Z"){if(!hasMove)throw Error("لا يمكن إغلاق مسار قبل نقطة البداية");x=sx;y=sy;include(x,y);command=null;continue}
  const values=[];
  while(i<tokens.length&&!("command"in tokens[i]))values.push(tokens[i++].number);
  if(!values.length||values.length%arity!==0)throw Error("عدد معاملات أمر SVG غير مكتمل");
  const groups=values.length/arity;
  for(let g=0;g<groups;g++){
   const v=values.slice(g*arity,(g+1)*arity);
   const effective=upper==="M"&&g>0?"L":upper;
   const rel=relative;
   const point=(px,py)=>({x:rel?x+px:px,y:rel?y+py:py});
   if(effective==="M"||effective==="L"||effective==="T"){
    const p=point(v[0],v[1]);x=p.x;y=p.y;include(x,y);
    if(effective==="M"){sx=x;sy=y;hasMove=true}
   }else if(effective==="H"){
    x=rel?x+v[0]:v[0];include(x,y);
   }else if(effective==="V"){
    y=rel?y+v[0]:v[0];include(x,y);
   }else if(effective==="C"){
    for(let k=0;k<6;k+=2){const p=point(v[k],v[k+1]);include(p.x,p.y);if(k===4){x=p.x;y=p.y}}
   }else if(effective==="S"||effective==="Q"){
    for(let k=0;k<4;k+=2){const p=point(v[k],v[k+1]);include(p.x,p.y);if(k===2){x=p.x;y=p.y}}
   }else if(effective==="A"){
    if(v[0]<0||v[1]<0||(v[3]!==0&&v[3]!==1)||(v[4]!==0&&v[4]!==1))throw Error("معاملات قوس SVG غير صالحة");
    include(x-v[0],y-v[1]);include(x+v[0],y+v[1]);
    const p=point(v[5],v[6]);x=p.x;y=p.y;include(x,y);
   }
  }
 }
 if(!hasMove)throw Error("مسار SVG لا يحتوي نقطة بداية");
 return{minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY};
}

export function validatePath(p){
 if(!p||typeof p.d!=="string"||!p.d.length||p.d.length>100000)throw Error("بيانات مسار SVG غير صالحة");
 const tokens=tokenizePathData(p.d);
 if(tokens.some(token=>"number"in token&&(!Number.isFinite(token.number)||Math.abs(token.number)>1000000)))throw Error("إحداثيات المسار خارج الحدود");
 pathGeometryBounds(p.d);
 return{d:p.d,stroke:safeColor(p.stroke),width:Math.max(.2,Math.min(100,+p.width||5)),fill:p.fill==="none"?"none":safeColor(p.fill,"none")};
}
export function pointsToPath(points){
 if(!Array.isArray(points)||!points.length)return"";
 const clean=points.map(p=>({x:Number(p?.x),y:Number(p?.y)}));
 if(clean.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw Error("نقاط الرسم غير صالحة");
 const fmt=n=>Number(n.toFixed(1)).toString();
 const point=p=>fmt(p.x)+" "+fmt(p.y);
 if(clean.length===1)return"M "+point(clean[0])+" l 0.1 0";
 if(clean.length===2)return"M "+point(clean[0])+" L "+point(clean[1]);
 let d="M "+point(clean[0]);
 for(let i=0;i<clean.length-1;i++){
  const p0=clean[Math.max(0,i-1)],p1=clean[i],p2=clean[i+1],p3=clean[Math.min(clean.length-1,i+2)];
  const c1={x:p1.x+(p2.x-p0.x)/6,y:p1.y+(p2.y-p0.y)/6};
  const c2={x:p2.x-(p3.x-p1.x)/6,y:p2.y-(p3.y-p1.y)/6};
  d+=" C "+point(c1)+" "+point(c2)+" "+point(p2);
 }
 return d;
}

export function shapePath(kind,start,end){
 const values=[start?.x,start?.y,end?.x,end?.y].map(Number);
 if(values.some(v=>!Number.isFinite(v)||Math.abs(v)>1000000))throw Error("إحداثيات الشكل غير صالحة");
 const [x1,y1,x2,y2]=values,fmt=n=>Number(n.toFixed(1)).toString(),p=(x,y)=>fmt(x)+" "+fmt(y);
 if(kind==="line")return "M "+p(x1,y1)+" L "+p(x2,y2);
 if(kind==="rect")return "M "+p(x1,y1)+" L "+p(x2,y1)+" L "+p(x2,y2)+" L "+p(x1,y2)+" Z";
 if(kind==="ellipse"){
  const cx=(x1+x2)/2,cy=(y1+y2)/2,rx=Math.abs(x2-x1)/2,ry=Math.abs(y2-y1)/2,k=.5522847498;
  return "M "+p(cx,cy-ry)+" C "+p(cx+k*rx,cy-ry)+" "+p(cx+rx,cy-k*ry)+" "+p(cx+rx,cy)+" C "+p(cx+rx,cy+k*ry)+" "+p(cx+k*rx,cy+ry)+" "+p(cx,cy+ry)+" C "+p(cx-k*rx,cy+ry)+" "+p(cx-rx,cy+k*ry)+" "+p(cx-rx,cy)+" C "+p(cx-rx,cy-k*ry)+" "+p(cx-k*rx,cy-ry)+" "+p(cx,cy-ry)+" Z";
 }
 throw Error("أداة الشكل غير مدعومة");
}


function tokenizePathData(d){
 const tokens=[],re=/[AaCcHhLlMmQqSsTtVvZz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/y;
 let i=0;
 while(i<d.length){
  if(/[\s,]/.test(d[i])){i++;continue}
  re.lastIndex=i;const m=re.exec(d);
  if(!m)throw Error("تعذر تحليل بنية مسار SVG");
  tokens.push(/[A-Za-z]/.test(m[0])?{command:m[0]}:{number:Number(m[0])});
  i=re.lastIndex;
 }
 return tokens;
}
export function interpolatePathData(from,to,t){
 if(!Number.isFinite(t)||t<0||t>1)throw Error("نسبة الاستيفاء يجب أن تكون بين صفر وواحد");
 const a=tokenizePathData(String(from)),b=tokenizePathData(String(to));
 if(a.length!==b.length||a.some((v,i)=>("command"in v)!==("command"in b[i])||("command"in v&&v.command!==b[i].command)))throw Error("بنية المسارين غير متطابقة؛ لا يمكن توليد إطار وسيط آمن");
 return a.map((v,i)=>"command"in v?v.command:String(+(v.number+(b[i].number-v.number)*t).toFixed(3))).join(" ");
}
export function createInbetweenFrames(startFrame,endFrame,count=1){
 if(!Number.isInteger(count)||count<1||count>24)throw Error("عدد الإطارات الوسيطة يجب أن يكون من 1 إلى 24");
 if(!startFrame||!endFrame||!Array.isArray(startFrame.layers)||!Array.isArray(endFrame.layers)||startFrame.layers.length!==endFrame.layers.length)throw Error("لا تتطابق طبقات الإطارين");
 const pairs=startFrame.layers.map((a,i)=>{
  const b=endFrame.layers[i];
  if(a.name!==b.name||a.visible!==b.visible||a.locked!==b.locked||a.operations.length!==b.operations.length)throw Error("اختلاف الطبقات أو عدد العمليات؛ وحّد الطبقات قبل الاستيفاء");
  return a.operations.map((op,j)=>{
   const other=b.operations[j];
   if(op.kind!==other.kind)throw Error("ترتيب أنواع العمليات مختلف بين الإطارين");
   if(op.path.stroke!==other.path.stroke||op.path.fill!==other.path.fill)throw Error("ألوان المسارات مختلفة؛ وحّد الألوان قبل الاستيفاء");
   return{kind:op.kind,from:op.path,to:other.path};
  });
 });
 return Array.from({length:count},(_,index)=>{
  const t=(index+1)/(count+1);
  const layers=startFrame.layers.map((source,i)=>({
   id:uid("layer"),name:source.name,visible:source.visible,locked:source.locked,
   operations:pairs[i].map(op=>({kind:op.kind,path:validatePath({...op.from,d:interpolatePathData(op.from.d,op.to.d,t),width:op.from.width+(op.to.width-op.from.width)*t})}))
  }));
  return{id:uid("frame"),layers};
 });
}


export function pressureOutlinePath(points,baseWidth=5){
 if(!Array.isArray(points)||!points.length)return"";
 if(!Number.isFinite(baseWidth)||baseWidth<=0||baseWidth>100)throw Error("عرض القلم غير صالح");
 const clean=points.map(p=>({x:Number(p?.x),y:Number(p?.y),pressure:Number(p?.pressure??.5)}));
 if(clean.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(p.pressure)||Math.abs(p.x)>1000000||Math.abs(p.y)>1000000))throw Error("عينات ضغط القلم غير صالحة");
 const fmt=n=>Number(n.toFixed(2)).toString(),pt=p=>fmt(p.x)+" "+fmt(p.y);
 const radius=p=>baseWidth*(.12+.88*Math.max(.05,Math.min(1,p.pressure)))/2;
 if(clean.length===1){
  const r=radius(clean[0]),k=.55228475*r,x=clean[0].x,y=clean[0].y;
  return "M "+pt({x:x+r,y})+" C "+pt({x:x+r,y:y+k})+" "+pt({x:x+k,y:y+r})+" "+pt({x,y:y+r})+" C "+pt({x:x-k,y:y+r})+" "+pt({x:x-r,y:y+k})+" "+pt({x:x-r,y})+" C "+pt({x:x-r,y:y-k})+" "+pt({x:x-k,y:y-r})+" "+pt({x,y:y-r})+" C "+pt({x:x+k,y:y-r})+" "+pt({x:x+r,y:y-k})+" "+pt({x:x+r,y})+" Z";
 }
 const left=[],right=[];
 for(let i=0;i<clean.length;i++){
  const prev=clean[Math.max(0,i-1)],next=clean[Math.min(clean.length-1,i+1)];
  let dx=next.x-prev.x,dy=next.y-prev.y,len=Math.hypot(dx,dy);
  if(len<.001){dx=1;dy=0;len=1}
  const nx=-dy/len,ny=dx/len,r=radius(clean[i]);
  left.push({x:clean[i].x+nx*r,y:clean[i].y+ny*r});
  right.push({x:clean[i].x-nx*r,y:clean[i].y-ny*r});
 }
 return "M "+pt(left[0])+" "+left.slice(1).map(p=>"L "+pt(p)).join(" ")+" "+right.slice().reverse().map(p=>"L "+pt(p)).join(" ")+" Z";
}

function normalizeLayer(l,i){
 if(!l||typeof l!=="object")throw Error("طبقة غير صالحة");
 const ids=new Set();
 const operations=(Array.isArray(l.operations)?l.operations:[]).map(o=>{
  if(o?.kind!=="erase"&&o?.kind!=="stroke"&&typeof o?.d!=="string")throw Error("عملية طبقة غير معروفة");
  const kind=o.kind==="erase"?"erase":"stroke",path=validatePath(o.path||o);
  let id=typeof o.id==="string"&&o.id.length>0&&o.id.length<=100?o.id:uid("op");
  if(ids.has(id))id=uid("op");
  ids.add(id);
  return{id,kind,path};
 });
 if(operations.length>MAX_OPERATIONS)throw Error("عدد عمليات الطبقة كبير");
 return{id:typeof l.id==="string"?l.id:uid("layer"),name:String(l.name||("طبقة "+(i+1))).slice(0,80),visible:l.visible!==false,locked:l.locked===true,operations};
}
export function normalizeProject(p){if(!p||p.format!=="zero-studio"||![1,2].includes(p.version)||!Array.isArray(p.frames)||!p.frames.length||p.frames.length>MAX_FRAMES)throw Error("ملف ZERO STUDIO غير صالح");const frames=p.frames.map(f=>{if(p.version===1||Array.isArray(f.paths)){const l=createLayer("الرسومات");l.operations=(f.paths||[]).map(x=>({kind:"stroke",path:validatePath(x)}));return{id:typeof f.id==="string"?f.id:uid("frame"),layers:[l]}}if(!Array.isArray(f.layers)||!f.layers.length||f.layers.length>MAX_LAYERS)throw Error("طبقات الإطار غير صالحة");return{id:typeof f.id==="string"?f.id:uid("frame"),layers:f.layers.map(normalizeLayer)}});return{format:"zero-studio",version:2,name:String(p.name||"مشروع مستورد").slice(0,80),width:WIDTH,height:HEIGHT,fps:[6,12,24].includes(+p.fps)?+p.fps:24,frames}}
export function addLayer(f,name){if(f.layers.length>=MAX_LAYERS)throw Error("بلغت الحد الأقصى للطبقات");const l=createLayer(name||("طبقة "+(f.layers.length+1)));f.layers.push(l);return l}
export function renameLayer(f,id,name){const l=f.layers.find(x=>x.id===id);if(!l)throw Error("الطبقة غير موجودة");const next=String(name??"").trim();if(!next)throw Error("اسم الطبقة لا يمكن أن يكون فارغاً");if(next.length>80)throw Error("اسم الطبقة يتجاوز 80 حرفاً");l.name=next;return l}
export function removeLayer(f,id){if(f.layers.length<=1)throw Error("يجب إبقاء طبقة واحدة على الأقل");const i=f.layers.findIndex(l=>l.id===id);if(i<0)throw Error("الطبقة غير موجودة");f.layers.splice(i,1)}
export function reorderLayer(f,id,delta){const i=f.layers.findIndex(l=>l.id===id),j=i+delta;if(i<0||j<0||j>=f.layers.length)return false;[f.layers[i],f.layers[j]]=[f.layers[j],f.layers[i]];return true}
export function appendOperation(l,kind,path){if(l.locked)throw Error("الطبقة مقفلة");if(!["stroke","erase"].includes(kind))throw Error("نوع العملية غير مدعوم");if(l.operations.length>=MAX_OPERATIONS)throw Error("بلغت حد العمليات");const id=uid("op");l.operations.push({id,kind,path:validatePath(path)});return id}
export function removeOperation(l,id){if(l.locked)throw Error("الطبقة مقفلة");const index=l.operations.findIndex(op=>op.id===id);if(index<0)throw Error("العنصر المحدد غير موجود");return l.operations.splice(index,1)[0]}
export function translatePathData(d,dx,dy){
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.abs(dx)>1000000||Math.abs(dy)>1000000)throw Error("إزاحة العنصر غير صالحة");
 const tokens=tokenizePathData(d),out=[];let i=0;
 while(i<tokens.length){
  if(!("command"in tokens[i]))throw Error("بنية مسار غير متوقعة");
  const command=tokens[i++].command,upper=command.toUpperCase(),relative=command!==upper,arity=PATH_ARITY[upper];
  out.push(command);
  if(arity===0)continue;
  const values=[];
  while(i<tokens.length&&!("command"in tokens[i]))values.push(tokens[i++].number);
  if(!values.length||values.length%arity!==0)throw Error("معاملات المسار غير مكتملة");
  for(let index=0;index<values.length;index++){
   let shift=0;
   if(!relative){
    if(["M","L","T"].includes(upper))shift=index%2===0?dx:dy;
    else if(upper==="H")shift=dx;
    else if(upper==="V")shift=dy;
    else if(upper==="C"||upper==="S"||upper==="Q")shift=index%2===0?dx:dy;
    else if(upper==="A")shift=index%7===5?dx:index%7===6?dy:0;
   }else if(upper==="M"&&index<2){shift=index===0?dx:dy}
   out.push(String(+(values[index]+shift).toFixed(3)));
  }
 }
 return out.join(" ");
}
export function translateOperation(l,id,dx,dy){if(l.locked)throw Error("الطبقة مقفلة");const op=l.operations.find(item=>item.id===id);if(!op)throw Error("العنصر المحدد غير موجود");op.path=validatePath({...op.path,d:translatePathData(op.path.d,dx,dy)});return op}
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
const markup=(p,color,id)=>'<path'+(id?' data-operation="'+esc(id)+'"':'')+' d="'+esc(p.d)+'" fill="'+esc(p.fill||"none")+'" stroke="'+esc(color||p.stroke||"#172033")+'" stroke-width="'+(+p.width||5)+'" stroke-linecap="round" stroke-linejoin="round"/>';
export function layerSvg(l,i=0,prefix="drawing"){if(!l.visible)return"";let pending=[],erasures=[],out="",k=0;const flush=()=>{if(!pending.length)return;if(erasures.length){const id="erase-mask-"+prefix+"-"+i+"-"+k++;out+='<defs><mask id="'+id+'" maskUnits="userSpaceOnUse" x="0" y="0" width="'+WIDTH+'" height="'+HEIGHT+'"><rect width="'+WIDTH+'" height="'+HEIGHT+'" fill="white"/>'+erasures.map(op=>markup(op.path,"black",op.id)).join("")+'</mask></defs><g mask="url(#'+id+')">'+pending.map(op=>markup(op.path,undefined,op.id)).join("")+"</g>"}else out+=pending.map(op=>markup(op.path,undefined,op.id)).join("");pending=[];erasures=[]};for(const op of l.operations){if(op.kind==="erase"){if(pending.length)erasures.push(op);continue}if(op.kind==="stroke"){if(erasures.length)flush();pending.push(op)}}flush();return'<g data-layer="'+esc(l.id)+'">'+out+"</g>"}
export function frameSvg(f,prefix="export"){return'<svg xmlns="'+NS+'" width="'+WIDTH+'" height="'+HEIGHT+'" viewBox="0 0 '+WIDTH+" "+HEIGHT+'">'+f.layers.map((l,i)=>layerSvg(l,i,prefix)).join("")+"</svg>"}
export function renderLayerInto(svg,l,i=0,prefix="live"){const markupSvg='<svg xmlns="'+NS+'" width="'+WIDTH+'" height="'+HEIGHT+'" viewBox="0 0 '+WIDTH+" "+HEIGHT+'">'+layerSvg(l,i,prefix)+'</svg>';const parsed=new DOMParser().parseFromString(markupSvg,"image/svg+xml");for(const node of parsed.documentElement.childNodes)if(node.nodeType===1)svg.appendChild(document.importNode(node,true))}
