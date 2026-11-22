// ZERO STUDIO — conservative connected-region selection for hand-authored character masks.
// The tool selects pixels by sampled color and 4-neighbour connectivity; it does not infer semantics.
const MAX_PIXELS=16_000_000;
const fail=message=>{throw new Error(message)};

export function floodSelectConnectedRegion({width,height,rgba,seedX,seedY,tolerance=40,eligibleMask=null}={}){
  width=Number(width);height=Number(height);seedX=Number(seedX);seedY=Number(seedY);tolerance=Number(tolerance);
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>MAX_PIXELS)fail("Selection dimensions must be positive and at most 16 megapixels.");
  const count=width*height;
  if(!(rgba instanceof Uint8Array||rgba instanceof Uint8ClampedArray||Array.isArray(rgba))||rgba.length!==count*4)fail("Selection RGBA pixels are missing or invalid.");
  if(!Number.isInteger(seedX)||!Number.isInteger(seedY)||seedX<0||seedY<0||seedX>=width||seedY>=height)fail("Selection seed is outside the image.");
  if(!Number.isFinite(tolerance)||tolerance<0||tolerance>220)fail("Color tolerance must be between 0 and 220.");
  if(eligibleMask!==null&&(!(eligibleMask instanceof Uint8Array||eligibleMask instanceof Uint8ClampedArray||Array.isArray(eligibleMask))||eligibleMask.length!==count))fail("Eligible-pixel mask has invalid dimensions.");
  const seed=seedY*width+seedX,offset=seed*4;
  if(Number(rgba[offset+3])===0||(eligibleMask&&!eligibleMask[seed]))return{mask:new Uint8Array(count),pixelCount:0,bounds:null,seedColor:null};
  const target=[Number(rgba[offset]),Number(rgba[offset+1]),Number(rgba[offset+2])];
  const selected=new Uint8Array(count);
  let queue=new Int32Array(Math.min(count,4096)),head=0,tail=0,minX=width,minY=height,maxX=-1,maxY=-1;
  const enqueue=index=>{if(tail===queue.length){const grown=new Int32Array(Math.min(count,queue.length*2));grown.set(queue);queue=grown;}queue[tail++]=index;};
  const matches=index=>{
    const p=index*4;if(Number(rgba[p+3])===0||(eligibleMask&&!eligibleMask[index]))return false;
    return Math.abs(Number(rgba[p])-target[0])<=tolerance&&
      Math.abs(Number(rgba[p+1])-target[1])<=tolerance&&
      Math.abs(Number(rgba[p+2])-target[2])<=tolerance;
  };
  selected[seed]=255;enqueue(seed);
  while(head<tail){
    const index=queue[head++],x=index%width,y=Math.floor(index/width);
    minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
    const neighbours=[];
    if(x>0)neighbours.push(index-1);
    if(x+1<width)neighbours.push(index+1);
    if(y>0)neighbours.push(index-width);
    if(y+1<height)neighbours.push(index+width);
    for(const next of neighbours)if(!selected[next]&&matches(next)){selected[next]=255;enqueue(next);}
  }
  return{mask:selected,pixelCount:tail,bounds:tail?{x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1}:null,seedColor:target};
}
