import test from "node:test";
import assert from "node:assert/strict";
import {createStoredZip,crc32} from "../app/character-layer-zip.mjs";
test("CRC-32 matches the standard check value",()=>assert.equal(crc32(new TextEncoder().encode("123456789")),0xcbf43926));
test("creates a valid ZIP local header, central directory and end record",()=>{
 const zip=createStoredZip([{name:"layers/front.png",data:new Uint8Array([1,2,3])},{name:"manifest.json",data:new TextEncoder().encode("{}")}]);
 const view=new DataView(zip.buffer,zip.byteOffset,zip.byteLength);
 assert.equal(view.getUint32(0,true),0x04034b50);
 assert.equal(view.getUint32(zip.length-22,true),0x06054b50);
 assert.equal(view.getUint16(zip.length-14,true),2);
 assert.ok(zip.length>100);
});
test("rejects duplicate names and unsafe or excessive archives",()=>{
 assert.throws(()=>createStoredZip([{name:"same",data:[]},{name:"same",data:[]}]),/unique/);
 assert.throws(()=>createStoredZip([{name:"../escape",data:[] }]),/invalid/);
 assert.throws(()=>createStoredZip([]),/requires/);
});
