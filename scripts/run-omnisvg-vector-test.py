import os, re, json, pathlib, traceback
from gradio_client import Client

OUT=pathlib.Path("artifacts/omnisvg")
OUT.mkdir(parents=True,exist_ok=True)
prompt=("A richly detailed cinematic 2D Japanese anime background painting, wide composition of a quiet countryside ramen shop at golden hour. "
"Three-quarter street view, a traditional two-storey timber-and-plaster ramen restaurant with a complex tiled Japanese roof, thick curved eaves, visible timber framing, "
"wood lattice windows with sky and tree reflections, fabric noren curtain, hand-painted signboards, vending machine, potted plants and a small parked kei van. "
"A road and sidewalk recede diagonally toward distant green hills, with utility poles and overhead cables. Dense varied broadleaf trees and irregular foliage frame the scene. "
"Warm low sun from the left, soft long cast shadows, reflected green light, atmospheric perspective, carefully painted material details, semi-realistic theatrical anime background art. "
"Not a low-poly 3D render, not flat icon art, avoid thick black outlines and simple geometric placeholders.")
space="OmniSVG/OmniSVG-3B"
client=Client(space,verbose=True)
report={"model":"OmniSVG hosted Space","space":space,"modelSize":"4B","freeQuotaNotice":"The Space UI currently states 300 GPU seconds/day for free users and approximately 20–60 seconds per generation.","prompt":prompt,"referenceImagesSent":False,"rasterGenerationUsed":False}
try:
    result=client.predict(prompt,"4B",1,0.6,0.90,60,1.03,1536,api_name="/gradio_text_to_svg")
except Exception as first:
    report["namedEndpointError"]=str(first)
    # Gradio may expose this callback only through its indexed API.
    result=client.predict(prompt,"4B",1,0.6,0.90,60,1.03,1536,fn_index=0)
if not isinstance(result,(tuple,list)) or len(result)<2:
    raise RuntimeError("Unexpected OmniSVG result: "+repr(result)[:1000])
gallery,svg_code=result[0],result[1]
if not isinstance(svg_code,str) or "<svg" not in svg_code:
    raise RuntimeError("OmniSVG did not return SVG source. "+str(svg_code)[:1000])
matches=re.findall(r"<svg\b[\s\S]*?</svg>",svg_code)
if not matches:
    raise RuntimeError("Could not isolate SVG document from model response.")
svg=matches[0]
if re.search(r"<image\b|data:image/",svg,re.I):
    raise RuntimeError("OmniSVG output unexpectedly embeds raster image content.")
(OUT/"omnisvg-original.svg").write_text(svg,encoding="utf-8")
(OUT/"gallery.html").write_text(str(gallery),encoding="utf-8")
path_count=len(re.findall(r"<path\b",svg,re.I))
report.update({"status":"svg-returned","pathCount":path_count,"svgBytes":len(svg.encode()),"svg":"omnisvg-original.svg","candidateCount":len(matches),"visualQualityStatus":"awaiting visual inspection"})
(OUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps(report,ensure_ascii=False,indent=2))
