const encoder=new TextEncoder();
const crcTable=(()=>{const table=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);table[n]=c>>>0}return table})();
export function crc32(bytes){let crc=0xffffffff;for(const byte of bytes)crc=crcTable[(crc^byte)&255]^(crc>>>8);return(crc^0xffffffff)>>>0}
function u16(view,offset,value){view.setUint16(offset,value,true)}
function u32(view,offset,value){view.setUint32(offset,value>>>0,true)}
function join(parts,total){const out=new Uint8Array(total);let offset=0;for(const part of parts){out.set(part,offset);offset+=part.length}return out}
export function createZip(entries){
 if(!Array.isArray(entries)||!entries.length||entries.length>65535)throw Error("ZIP requires between 1 and 65535 files");
 const names=new Set(),locals=[],centrals=[];let localOffset=0,centralSize=0;
 for(const entry of entries){
  if(!entry||typeof entry.name!=="string"||!entry.name||entry.name.startsWith("/")||entry.name.includes("\\")||entry.name.split("/").some(part=>part===".."||part===""))throw Error("Invalid ZIP entry name");
  if(names.has(entry.name))throw Error("Duplicate ZIP entry name");names.add(entry.name);
  const name=encoder.encode(entry.name),data=typeof entry.data==="string"?encoder.encode(entry.data):new Uint8Array(entry.data);
  if(name.length>65535||data.length>0xffffffff||localOffset>0xffffffff)throw Error("ZIP32 size limit exceeded");
  const crc=crc32(data),local=new Uint8Array(30+name.length+data.length),lv=new DataView(local.buffer);
  u32(lv,0,0x04034b50);u16(lv,4,20);u16(lv,6,0x0800);u16(lv,8,0);u16(lv,10,0);u16(lv,12,0);u32(lv,14,crc);u32(lv,18,data.length);u32(lv,22,data.length);u16(lv,26,name.length);u16(lv,28,0);local.set(name,30);local.set(data,30+name.length);locals.push(local);
  const central=new Uint8Array(46+name.length),cv=new DataView(central.buffer);
  u32(cv,0,0x02014b50);u16(cv,4,20);u16(cv,6,20);u16(cv,8,0x0800);u16(cv,10,0);u16(cv,12,0);u16(cv,14,0);u32(cv,16,crc);u32(cv,20,data.length);u32(cv,24,data.length);u16(cv,28,name.length);u16(cv,30,0);u16(cv,32,0);u16(cv,34,0);u16(cv,36,0);u32(cv,38,0);u32(cv,42,localOffset);central.set(name,46);centrals.push(central);
  localOffset+=local.length;centralSize+=central.length;
 }
 if(localOffset+centralSize+22>0xffffffff)throw Error("ZIP32 archive size limit exceeded");
 const end=new Uint8Array(22),ev=new DataView(end.buffer);u32(ev,0,0x06054b50);u16(ev,4,0);u16(ev,6,0);u16(ev,8,entries.length);u16(ev,10,entries.length);u32(ev,12,centralSize);u32(ev,16,localOffset);u16(ev,20,0);
 return join([...locals,...centrals,end],localOffset+centralSize+end.length);
}
