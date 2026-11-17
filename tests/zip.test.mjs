import test from "node:test";
import assert from "node:assert/strict";
import {createZip,crc32} from "../app/zip.mjs";
const read32=(view,offset)=>view.getUint32(offset,true);
test("CRC32 matches the standard check vector",()=>assert.equal(crc32(new TextEncoder().encode("123456789")),0xcbf43926));
test("creates a valid stored ZIP with UTF-8 names and a central directory",()=>{const zip=createZip([{name:"project.zero",data:"{}"},{name:"frames/إطار-0001.svg",data:"<svg/>"}]);const view=new DataView(zip.buffer,zip.byteOffset,zip.byteLength);assert.equal(read32(view,0),0x04034b50);let offset=0,files=0;while(read32(view,offset)===0x04034b50){const nameLength=view.getUint16(offset+26,true),extraLength=view.getUint16(offset+28,true),size=read32(view,offset+18);offset+=30+nameLength+extraLength+size;files++}assert.equal(files,2);assert.equal(read32(view,offset),0x02014b50);const eocd=zip.length-22;assert.equal(read32(view,eocd),0x06054b50);assert.equal(view.getUint16(eocd+10,true),2)});
test("rejects duplicate and unsafe archive paths",()=>{assert.throws(()=>createZip([{name:"a",data:"1"},{name:"a",data:"2"}]),/Duplicate/);assert.throws(()=>createZip([{name:"../secret",data:"x"}]),/Invalid/);assert.throws(()=>createZip([{name:"/absolute",data:"x"}]),/Invalid/)});
