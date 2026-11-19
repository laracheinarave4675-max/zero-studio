const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export const HOKUSAI_BRUSHES=Object.freeze([
 {id:"charcoal",label:"فحم",url:"./vendor/hokusai/brushes/charcoal.myb"},
 {id:"calligraphy",label:"خط",url:"./vendor/hokusai/brushes/calligraphy.myb"},
 {id:"brush",label:"فرشاة",url:"./vendor/hokusai/brushes/brush.myb"},
 {id:"marker",label:"ماركر",url:"./vendor/hokusai/brushes/marker_fat.myb"}
]);
export async function createHokusaiPainter({canvasElement,init,HokusaiBrush,HokusaiCanvas,fetchImpl=globalThis.fetch}={}){
 if(!canvasElement||typeof canvasElement.getContext!=="function")throw new TypeError("A destination canvas is required.");
 if(typeof init!=="function"||typeof HokusaiBrush!=="function"||typeof HokusaiCanvas!=="function")throw new TypeError("Hokusai WebAssembly bindings are required.");
 await init();
 const width=960,height=540,ctx=canvasElement.getContext("2d",{alpha:false});
 if(!ctx)throw new Error("Canvas2D is unavailable.");
 const engine=new HokusaiCanvas(width,height);
 canvasElement.width=width;canvasElement.height=height;
 let brush=null,designedRadius=1,lastTime=0,drawing=false,disposed=false;
 async function loadBrush(id="charcoal"){
  const spec=HOKUSAI_BRUSHES.find(x=>x.id===id);if(!spec)throw new RangeError("Unknown Hokusai brush.");
  const response=await fetchImpl(spec.url);if(!response.ok)throw new Error("تعذر تحميل الفرشاة "+spec.label);
  brush=new HokusaiBrush(await response.text());designedRadius=brush.radiusLog();return spec;
 }
 function setColor(hex){
  if(!/^#[0-9a-f]{6}$/i.test(hex))throw new TypeError("Brush colour must be #RRGGBB.");
  const n=parseInt(hex.slice(1),16),r=n>>16&255,g=n>>8&255,b=n&255,max=Math.max(r,g,b)/255,min=Math.min(r,g,b)/255,d=max-min;
  let h=0;if(d){if(max===r/255)h=((g-b)/255/d)%6;else if(max===g/255)h=(b-r)/255/d+2;else h=(r-g)/255/d+4;h=(h/6+1)%1}
  const s=max===0?0:d/max;brush?.setColorHsv(h,s,max);
 }
 function setSize(px){if(!Number.isFinite(px))throw new TypeError("Brush size must be finite.");brush?.setRadiusLog(designedRadius+Math.log2(clamp(px,1,180)/Math.pow(2,designedRadius)));}
 function flush(){
  const bytes=engine.pixels();
  const data=typeof ImageData==="function"?new ImageData(new Uint8ClampedArray(bytes),width,height):ctx.createImageData(width,height);if(typeof ImageData!=="function")data.data.set(bytes);ctx.putImageData(data,0,0);
 }
 function feed(event,original=event){
  if(!brush||disposed)return;
  const rect=canvasElement.getBoundingClientRect(),x=(event.clientX-rect.left)*width/rect.width,y=(event.clientY-rect.top)*height/rect.height;
  const pen=(original.pointerType||event.pointerType)==="pen",pressure=pen?(event.pressure>0?event.pressure:1):1;
  const now=Number(event.timeStamp)||performance.now(),dt=lastTime?Math.max(.001,(now-lastTime)/1000):.01;lastTime=now;
  const xtilt=Math.sin((event.tiltX||0)*Math.PI/180),ytilt=Math.sin((event.tiltY||0)*Math.PI/180);
  engine.strokeTo(brush,x,y,pressure,xtilt,ytilt,dt);
 }
 function onDown(e){if(!brush)return;drawing=true;lastTime=0;engine.resetStroke();feed(e,e);flush();canvasElement.setPointerCapture?.(e.pointerId)}
 function onMove(e){if(!drawing)return;const coalesced=e.getCoalescedEvents?.()||[];for(const point of coalesced.length?coalesced:[e])feed(point,e);flush()}
 function onUp(e){if(!drawing)return;drawing=false;engine.finishStroke(brush);flush();if(canvasElement.hasPointerCapture?.(e.pointerId))canvasElement.releasePointerCapture(e.pointerId)}
 canvasElement.addEventListener("pointerdown",onDown);canvasElement.addEventListener("pointermove",onMove);canvasElement.addEventListener("pointerup",onUp);canvasElement.addEventListener("pointercancel",onUp);
 await loadBrush();flush();
 return{
  get engine(){return engine},loadBrush,setColor,setSize,clear(){engine.clear();flush()},
  exportPng(){return new Promise((resolve,reject)=>canvasElement.toBlob(blob=>blob?resolve(blob):reject(new Error("PNG export failed.")),"image/png"))},
  destroy(){disposed=true;drawing=false;canvasElement.removeEventListener("pointerdown",onDown);canvasElement.removeEventListener("pointermove",onMove);canvasElement.removeEventListener("pointerup",onUp);canvasElement.removeEventListener("pointercancel",onUp)}
 };
}
