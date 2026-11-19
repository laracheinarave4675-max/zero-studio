import json, re, time, pathlib
from gradio_client import Client
import cairosvg

OUT=pathlib.Path("artifacts/omnisvg-background-tests")
OUT.mkdir(parents=True,exist_ok=True)
scenes=[
 ("01-urban-store","A richly detailed cinematic Japanese anime background painting, wide street-level three-quarter view of a Japanese convenience store on a summer afternoon. Detailed glass facade with reflections, metal frames, fascia signage, vending machine, benches, curb, asphalt road, road markings, foreground plants and mature trees behind the roof. Natural perspective, believable real-world proportions, warm sunlight, soft shadows, nuanced color, painterly anime film background, not a logo, not an icon, not flat clip art."),
 ("02-rural-ramen","A highly detailed cinematic Japanese anime background painting of a rural ramen shop beside a road receding into distant green hills, wide three-quarter camera view. Traditional timber and plaster restaurant, complex tiled roof, deep eaves, lattice windows, reflective glass, entrance noren curtains, vertical signboards, pots and shrubs, utility poles and wires, small parked kei van, warm golden-hour sunlight, long soft shadows, atmospheric depth, richly layered vegetation, painterly anime film background."),
 ("03-forest-house","A premium cinematic Japanese anime background painting of a traditional timber house in a dense forest garden. Wide three-quarter camera view, complex overlapping tiled roofs with deep eaves, timber beams, wooden balcony, lattice windows, glass reflections, plaster walls, stone retaining wall, irregular garden path, foreground and background trees with visible branching and varied leaf clusters, dappled golden sunlight, cool green bounce light, atmospheric perspective, intricate painterly detail.")
]
client=Client("OmniSVG/OmniSVG-3B",verbose=True)
summary=[]
for slug,prompt in scenes:
 print("OmniSVG generation:",slug,flush=True)
 start=time.time()
 result=client.predict(prompt,"3B",1,0.6,0.9,60,1.03,512,api_name="/gradio_text_to_svg")
 elapsed=round(time.time()-start,2)
 if not isinstance(result,(list,tuple)) or len(result)<2:
  raise RuntimeError("Unexpected OmniSVG response structure: "+repr(type(result)))
 svg_text=str(result[1] or "")
 match=re.search(r"<svg\b.*?</svg>",svg_text,re.S|re.I)
 if not match:
  raise RuntimeError("OmniSVG returned no complete SVG. Response preview: "+svg_text[:400])
 svg=match.group(0)
 folder=OUT/slug
 folder.mkdir(parents=True,exist_ok=True)
 (folder/"scene.svg").write_text(svg,encoding="utf-8")
 cairosvg.svg2png(bytestring=svg.encode("utf-8"),write_to=str(folder/"preview.png"),output_width=1280,output_height=720)
 paths=len(re.findall(r"<path\b",svg,re.I))
 report={"slug":slug,"model":"OmniSVG-3B hosted Hugging Face Space","task":"text-to-svg","generation_seconds":elapsed,"path_elements":paths,"editable_svg":True,"candidate_count":1,"max_length":512,"provider_quota_note":"Space UI states free users receive 300 GPU seconds/day and a generation takes about 20–60 seconds; actual usage/quota is provider-controlled.","prompt":prompt,"response_status":str(result[2]) if len(result)>2 else None,"quality_status":"awaiting visual review"}
 (folder/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
 summary.append(report)
 print(json.dumps({"slug":slug,"seconds":elapsed,"paths":paths},ensure_ascii=False),flush=True)
 (OUT/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
print("OmniSVG test completed:",len(summary),flush=True)
