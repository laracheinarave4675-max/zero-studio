import{createHokusaiPainter,HOKUSAI_BRUSHES}from"./hokusai-painter.mjs";
const byId=id=>document.getElementById(id);
async function start(){
 const status=byId("hokusaiStatus"),canvas=byId("hokusaiCanvas");
 try{
  const wasm=await import("./vendor/hokusai/pkg/hokusai_wasm.js");
  const painter=await createHokusaiPainter({canvasElement:canvas,init:wasm.default,HokusaiBrush:wasm.HokusaiBrush,HokusaiCanvas:wasm.HokusaiCanvas});
  painter.setColor(byId("hokusaiColor").value);painter.setSize(Number(byId("hokusaiSize").value));
  const select=byId("hokusaiBrush");
  for(const item of HOKUSAI_BRUSHES){const option=document.createElement("option");option.value=item.id;option.textContent=item.label;select.append(option)}
  select.addEventListener("change",()=>painter.loadBrush(select.value).then(()=>{painter.setColor(byId("hokusaiColor").value);painter.setSize(Number(byId("hokusaiSize").value));status.textContent="الفرشاة جاهزة"}).catch(e=>status.textContent=e.message));
  byId("hokusaiColor").addEventListener("input",e=>painter.setColor(e.target.value));
  byId("hokusaiSize").addEventListener("input",e=>painter.setSize(Number(e.target.value)));
  byId("hokusaiClear").addEventListener("click",()=>painter.clear());
  byId("hokusaiExport").addEventListener("click",async()=>{const blob=await painter.exportPng(),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="zero-studio-hokusai-paint.png";a.click();URL.revokeObjectURL(url)});
  status.textContent="محرك Hokusai جاهز — ارسم على اللوحة أدناه";
 }catch(error){status.textContent="محرك Hokusai غير جاهز بعد: "+(error?.message||String(error));status.dataset.state="error"}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
