import test from "node:test";
import assert from "node:assert/strict";
import { floodSelectConnectedRegion } from "../app/character-mask-tools.mjs";

test("selects a connected flat-color region without crossing a dark ink boundary",()=>{
  const width=7,height=5,rgba=new Uint8Array(width*height*4);
  const put=(x,y,c)=>rgba.set([...c,255],(y*width+x)*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)put(x,y,[100,110,120]);
  for(let y=0;y<height;y++)put(3,y,[12,14,20]);
  const result=floodSelectConnectedRegion({width,height,rgba,seedX:1,seedY:2,tolerance:10});
  assert.equal(result.pixelCount,15);
  assert.deepEqual(result.bounds,{x:0,y:0,width:3,height:5});
  assert.equal(result.mask[2*width+1],255);
  assert.equal(result.mask[2*width+5],0);
});

test("color tolerance includes local tone variation but rejects pixels outside the chosen range",()=>{
  const width=5,height=3,rgba=new Uint8Array(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const color=x<3?[100+x*5,110+x*3,120]:[150,160,170];
    rgba.set([...color,255],(y*width+x)*4);
  }
  const result=floodSelectConnectedRegion({width,height,rgba,seedX:0,seedY:1,tolerance:12});
  assert.equal(result.pixelCount,9);
  assert.equal(result.mask[1*width+2],255);
  assert.equal(result.mask[1*width+4],0);
});

test("transparent and ineligible pixels act as hard selection barriers",()=>{
  const width=5,height=3,rgba=new Uint8Array(width*height*4),eligible=new Uint8Array(width*height).fill(255);
  for(let i=0;i<width*height;i++)rgba.set([90,100,110,255],i*4);
  rgba[1*4+3]=0;
  eligible[2]=0;
  const result=floodSelectConnectedRegion({width,height,rgba,seedX:0,seedY:0,tolerance:0,eligibleMask:eligible});
  assert.equal(result.mask[1],0);
  assert.equal(result.mask[2],0);
  assert.equal(result.pixelCount,13);
  const empty=floodSelectConnectedRegion({width,height,rgba,seedX:1,seedY:0,tolerance:0});
  assert.equal(empty.pixelCount,0);
  assert.equal(empty.bounds,null);
});

test("rejects unsafe dimensions, missing source pixels, invalid seed and tolerance",()=>{
  const rgba=new Uint8Array(16);
  assert.throws(()=>floodSelectConnectedRegion({width:0,height:1,rgba,seedX:0,seedY:0}),/dimensions/);
  assert.throws(()=>floodSelectConnectedRegion({width:2,height:2,rgba:new Uint8Array(3),seedX:0,seedY:0}),/RGBA pixels/);
  assert.throws(()=>floodSelectConnectedRegion({width:2,height:2,rgba,seedX:2,seedY:0}),/outside/);
  assert.throws(()=>floodSelectConnectedRegion({width:2,height:2,rgba,seedX:0,seedY:0,tolerance:221}),/tolerance/);
});

test("eligible ownership mask prevents a selection from stealing another authored part",()=>{
  const width=7,height=3,rgba=new Uint8Array(width*height*4),eligible=new Uint8Array(width*height);
  for(let i=0;i<width*height;i++)rgba.set([120,80,60,255],i*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(x<=2||x>=5)eligible[y*width+x]=255;
  const result=floodSelectConnectedRegion({width,height,rgba,seedX:1,seedY:1,tolerance:0,eligibleMask:eligible});
  assert.equal(result.pixelCount,9);
  assert.equal(result.mask[1*width+3],0);
  assert.equal(result.mask[1*width+5],0);
});
test("connected selection grows its queue with the selected region rather than preallocating image-sized queue memory",()=>{
  const width=100,height=100,rgba=new Uint8Array(width*height*4);
  for(let i=0;i<width*height;i++)rgba.set([40,50,60,255],i*4);
  const result=floodSelectConnectedRegion({width,height,rgba,seedX:50,seedY:50,tolerance:0});
  assert.equal(result.pixelCount,width*height);
});
