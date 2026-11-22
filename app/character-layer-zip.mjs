// Minimal deterministic ZIP writer using STORE entries (no compression dependency).
const encoder=new TextEncoder();
const crcTable=(()=>{const table=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);table[n]=c>>>0}return table})();
export function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0}
function u16(view,offset,value){view.setUint16(offset,value,true)}
function u32(view,offset,value){view.setUint32(offset,value>>>0,true)}
function safeName(name){const raw=String(name||"").replace(/\\/g,"/");if(!raw||raw.startsWith("/")||raw.split("/").some(part=>part===".."||part===""))throw Error("ZIP entry name is invalid.");const value=raw.replace(/[^\p{L}\p{N}._/-]+/gu,"-");if(!value||value.length>180)throw Error("ZIP entry name is invalid.");return value}
export function createStoredZip(entries){
 if(!Array.isArray(entries)||!entries.length||entries.length>256)throw Error("ZIP requires 1–256 entries.");
 const local=[],central=[];let offset=0;const names=new Set();
 for(const entry of entries){
  const name=safeName(entry.name);if(names.has(name))throw Error("ZIP entry names must be unique.");names.add(name);
  const nameBytes=encoder.encode(name),data=entry.data instanceof Uint8Array?entry.data:new Uint8Array(entry.data||[]);
  if(data.length>64*1024*1024)throw Error("ZIP entry exceeds 64 MB.");
  const crc=crc32(data),header=new Uint8Array(30+nameBytes.length),v=new DataView(header.buffer);
  u32(v,0,0x04034b50);u16(v,4,20);u16(v,6,0x0800);u16(v,8,0);u16(v,10,0);u16(v,12,0);u32(v,14,crc);u32(v,18,data.length);u32(v,22,data.length);u16(v,26,nameBytes.length);u16(v,28,0);header.set(nameBytes,30);
  local.push(header,data);
  const dir=new Uint8Array(46+nameBytes.length),dv=new DataView(dir.buffer);
  u32(dv,0,0x02014b50);u16(dv,4,20);u16(dv,6,20);u16(dv,8,0x0800);u16(dv,10,0);u16(dv,12,0);u16(dv,14,0);u32(dv,16,crc);u32(dv,20,data.length);u32(dv,24,data.length);u16(dv,28,nameBytes.length);u16(dv,30,0);u16(dv,32,0);u16(dv,34,0);u16(dv,36,0);u32(dv,38,0);u32(dv,42,offset);dir.set(nameBytes,46);central.push(dir);
  offset+=header.length+data.length;
 }
 const centralSize=central.reduce((n,a)=>n+a.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);
 u32(ev,0,0x06054b50);u16(ev,4,0);u16(ev,6,0);u16(ev,8,entries.length);u16(ev,10,entries.length);u32(ev,12,centralSize);u32(ev,16,offset);u16(ev,20,0);
 const total=offset+centralSize+end.length;if(total>128*1024*1024)throw Error("ZIP archive exceeds 128 MB.");
 const output=new Uint8Array(total);let cursor=0;for(const item of [...local,...central,end]){output.set(item,cursor);cursor+=item.length}return output;
}
