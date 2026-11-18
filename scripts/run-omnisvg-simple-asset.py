import json, pathlib, re
from gradio_client import Client

out=pathlib.Path("artifacts/omnisvg-simple")
out.mkdir(parents=True,exist_ok=True)
prompt=("A detailed 2D Japanese anime background asset, straight-on three-quarter view of a small traditional ramen shop facade. "
"One compact two-storey timber and warm plaster building, one dark sloping Japanese ceramic tile roof with visible eaves, three wood lattice windows, "
"one entrance door with a red fabric noren curtain, a small wooden signboard and two potted shrubs. "
"Hand-painted cinematic anime background illustration, subtle warm late-afternoon sunlight, delicate material details, clean refined vector contours, "
"rich but natural muted colors. Centered standalone architecture asset on a quiet pale warm background. "
"No people, no road, no cars, no trees behind the building, no 3D render, no low-poly forms, no thick black outlines.")
client=Client("OmniSVG/OmniSVG-3B",verbose=True)
report={"model":"OmniSVG 4B","space":"OmniSVG/OmniSVG-3B","task":"single Japanese ramen-shop facade asset","prompt":prompt,"max_length":1024,"referenceImagesSent":False,"rasterGenerationUsed":False}
result=client.predict(prompt,"4B",1,0.6,0.90,60,1.03,1024,api_name="/gradio_text_to_svg")
if not isinstance(result,(tuple,list)) or len(result)<2:
    raise RuntimeError("Unexpected OmniSVG response: "+repr(result)[:800])
gallery,svg_code=result[0],result[1]
if not isinstance(svg_code,str) or "<svg" not in svg_code:
    report["status"]="no-valid-svg"
    report["providerResponse"]=str(svg_code)[:1200]
    (out/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    raise RuntimeError("OmniSVG did not return a valid SVG: "+str(svg_code)[:800])
matches=re.findall(r"<svg\b[\s\S]*?</svg>",svg_code)
if not matches: raise RuntimeError("Could not isolate returned SVG.")
svg=matches[0]
if re.search(r"<image\b|data:image/",svg,re.I): raise RuntimeError("Unexpected raster content embedded in SVG.")
(out/"ramen-facade.svg").write_text(svg,encoding="utf-8")
(out/"gallery.html").write_text(str(gallery),encoding="utf-8")
report.update({"status":"svg-returned","svgBytes":len(svg.encode()),"pathCount":len(re.findall(r"<path\b",svg,re.I)),"circleCount":len(re.findall(r"<circle\b",svg,re.I)),"rectCount":len(re.findall(r"<rect\b",svg,re.I)),"visualQualityStatus":"awaiting visual inspection"})
(out/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps(report,ensure_ascii=False,indent=2))
