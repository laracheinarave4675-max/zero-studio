export const WIDTH=1920,HEIGHT=1080,MAX_FRAMES=600,MAX_LAYERS=100,MAX_OPERATIONS=10000;
const NS="http://www.w3.org/2000/svg";
export const uid=(p="id")=>p+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8);
export const createLayer=(name="طبقة 1")=>({id:uid("layer"),name,visible:true,locked:false,operations:[]});
export const createFrame=()=>({id:uid("frame"),layers:[createLayer()]});
export const createProject=(name="مشروع جديد")=>({format:"zero-studio",version:2,name,width:WIDTH,height:HEIGHT,fps:24,frames:[createFrame()]});
export function safeColor(c,f="#172033"){return typeof c==="string"&&(/^#[0-9a-f]{3,8}$/i.test(c)||/^(black|white|red|blue|green|none)$/i.test(c))?c:f}
export function validatePath(p){if(!p||typeof p.d!=="string"||!p.d.length||p.d.length>100000||!/^[MmLlHhVvCcSsQqTtAaZz0-9eE+.,\-\s]+$/.test(p.d))throw Error("بيانات مسار SVG غير صالحة");const n=p.d.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)||[];if(n.some(x=>!Number.isFinite(+x)||Math.abs(+x)>1000000))throw Error("إحداثيات المسار خارج الحدود");return{d:p.d,stroke:safeColor(p.stroke),width:Math.max(.2,Math.min(100,+p.width||5)),fill:p.fill==="none"?"none":safeColor(p.fill,"none")}}
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
 const tokens=[],re=/[AaCcHhLlMmQqSsTtVvZz]|[-+]?(?:\\d*\\.\\d+|\\d+\\.?\\d*)(?:[eE][-+]?\\d+)?/y;
 let i=0;
 while(i<d.length){
  if(/[\\s,]/.test(d[i])){i++;continue}
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

function normalizeLayer(l,i){if(!l||typeof l!=="object")throw Error("طبقة غير صالحة");const operations=(Array.isArray(l.operations)?l.operations:[]).map(o=>{if(o?.kind==="erase"||o?.kind==="stroke")return{kind:o.kind,path:validatePath(o.path)};if(typeof o?.d==="string")return{kind:"stroke",path:validatePath(o)};throw Error("عملية طبقة غير معروفة")});if(operations.length>MAX_OPERATIONS)throw Error("عدد عمليات الطبقة كبير");return{id:typeof l.id==="string"?l.id:uid("layer"),name:String(l.name||("طبقة "+(i+1))).slice(0,80),visible:l.visible!==false,locked:l.locked===true,operations}}
export function normalizeProject(p){if(!p||p.format!=="zero-studio"||![1,2].includes(p.version)||!Array.isArray(p.frames)||!p.frames.length||p.frames.length>MAX_FRAMES)throw Error("ملف ZERO STUDIO غير صالح");const frames=p.frames.map(f=>{if(p.version===1||Array.isArray(f.paths)){const l=createLayer("الرسومات");l.operations=(f.paths||[]).map(x=>({kind:"stroke",path:validatePath(x)}));return{id:typeof f.id==="string"?f.id:uid("frame"),layers:[l]}}if(!Array.isArray(f.layers)||!f.layers.length||f.layers.length>MAX_LAYERS)throw Error("طبقات الإطار غير صالحة");return{id:typeof f.id==="string"?f.id:uid("frame"),layers:f.layers.map(normalizeLayer)}});return{format:"zero-studio",version:2,name:String(p.name||"مشروع مستورد").slice(0,80),width:WIDTH,height:HEIGHT,fps:[6,12,24].includes(+p.fps)?+p.fps:24,frames}}
export function addLayer(f,name){if(f.layers.length>=MAX_LAYERS)throw Error("بلغت الحد الأقصى للطبقات");const l=createLayer(name||("طبقة "+(f.layers.length+1)));f.layers.push(l);return l}
export function renameLayer(f,id,name){const l=f.layers.find(x=>x.id===id);if(!l)throw Error("الطبقة غير موجودة");const next=String(name??"").trim();if(!next)throw Error("اسم الطبقة لا يمكن أن يكون فارغاً");if(next.length>80)throw Error("اسم الطبقة يتجاوز 80 حرفاً");l.name=next;return l}
export function removeLayer(f,id){if(f.layers.length<=1)throw Error("يجب إبقاء طبقة واحدة على الأقل");const i=f.layers.findIndex(l=>l.id===id);if(i<0)throw Error("الطبقة غير موجودة");f.layers.splice(i,1)}
export function reorderLayer(f,id,delta){const i=f.layers.findIndex(l=>l.id===id),j=i+delta;if(i<0||j<0||j>=f.layers.length)return false;[f.layers[i],f.layers[j]]=[f.layers[j],f.layers[i]];return true}
export function appendOperation(l,kind,path){if(l.locked)throw Error("الطبقة مقفلة");if(!["stroke","erase"].includes(kind))throw Error("نوع العملية غير مدعوم");if(l.operations.length>=MAX_OPERATIONS)throw Error("بلغت حد العمليات");l.operations.push({kind,path:validatePath(path)})}
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
const markup=(p,color)=>'<path d="'+esc(p.d)+'" fill="'+esc(p.fill||"none")+'" stroke="'+esc(color||p.stroke||"#172033")+'" stroke-width="'+(+p.width||5)+'" stroke-linecap="round" stroke-linejoin="round"/>';
export function layerSvg(l,i=0,prefix="drawing"){if(!l.visible)return"";let pending=[],erasures=[],out="",k=0;const flush=()=>{if(!pending.length)return;if(erasures.length){const id="erase-mask-"+prefix+"-"+i+"-"+k++;out+='<defs><mask id="'+id+'" maskUnits="userSpaceOnUse" x="0" y="0" width="'+WIDTH+'" height="'+HEIGHT+'"><rect width="'+WIDTH+'" height="'+HEIGHT+'" fill="white"/>'+erasures.map(p=>markup(p,"black")).join("")+'</mask></defs><g mask="url(#'+id+')">'+pending.map(p=>markup(p)).join("")+"</g>"}else out+=pending.map(p=>markup(p)).join("");pending=[];erasures=[]};for(const op of l.operations){if(op.kind==="erase"){if(pending.length)erasures.push(op.path);continue}if(op.kind==="stroke"){if(erasures.length)flush();pending.push(op.path)}}flush();return'<g data-layer="'+esc(l.id)+'">'+out+"</g>"}
export function frameSvg(f,prefix="export"){return'<svg xmlns="'+NS+'" width="'+WIDTH+'" height="'+HEIGHT+'" viewBox="0 0 '+WIDTH+" "+HEIGHT+'">'+f.layers.map((l,i)=>layerSvg(l,i,prefix)).join("")+"</svg>"}
export function renderLayerInto(svg,l,i=0,prefix="live"){const markupSvg='<svg xmlns="'+NS+'" width="'+WIDTH+'" height="'+HEIGHT+'" viewBox="0 0 '+WIDTH+" "+HEIGHT+'">'+layerSvg(l,i,prefix)+'</svg>';const parsed=new DOMParser().parseFromString(markupSvg,"image/svg+xml");for(const node of parsed.documentElement.childNodes)if(node.nodeType===1)svg.appendChild(document.importNode(node,true))}
