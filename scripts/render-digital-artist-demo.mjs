import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { createCanvas } from "@napi-rs/canvas";
import { drawRasterBrushStroke, mapPointsToRaster } from "../app/raster-brushes.mjs";
import { compileDigitalArtistBrushPlan } from "../app/digital-artist-brush-engine.mjs";
import { executeDigitalArtistBrushStream } from "../app/digital-artist-brush-executor.mjs";
import { createDigitalArtistDemoPlan } from "../app/digital-artist-demo-plan.mjs";

const width = 1920, height = 1080;
const plan = createDigitalArtistDemoPlan();
const stream = compileDigitalArtistBrushPlan(plan);
const composite = createCanvas(width, height);
const compositeContext = composite.getContext("2d");
compositeContext.fillStyle = "#f5f1e9";
compositeContext.fillRect(0, 0, width, height);

const outputDirectory = "artifacts/digital-artist-portrait-proof";
const layerDirectory = outputDirectory + "/layers";
await mkdir(layerDirectory, { recursive: true });

const layerReports = [];
let layerIndex = 0;
const result = await executeDigitalArtistBrushStream(stream, {
  createLayer: async descriptor => {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    return { descriptor, canvas, context, strokeCount: 0, paintedPixels: 0 };
  },
  paintStroke: async (target, command) => {
    const mapped = mapPointsToRaster(command.points, width, height, width, height, command.options.size);
    const strokeResult = drawRasterBrushStroke(target.context, mapped.points, {
      ...command.options,
      size: mapped.size
    });
    target.strokeCount++;
    return strokeResult;
  },
  finalizeLayer: async target => {
    const pixels = target.context.getImageData(0, 0, width, height).data;
    let paintedPixels = 0;
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] > 0) paintedPixels++;
    }
    if (paintedPixels < 50) {
      throw new Error("Layer " + target.descriptor.name + " rendered too few nontransparent pixels: " + paintedPixels);
    }

    if (target.descriptor.visible !== false) {
      compositeContext.globalAlpha = 1;
      compositeContext.globalCompositeOperation = "source-over";
      compositeContext.drawImage(target.canvas, 0, 0);
    }

    layerIndex++;
    const name = String(layerIndex).padStart(2, "0") + "-" + target.descriptor.id.replace(/[^a-z0-9._-]/gi, "-");
    await writeFile(layerDirectory + "/" + name + ".png", target.canvas.toBuffer("image/png"));
    layerReports.push({
      id: target.descriptor.id,
      name: target.descriptor.name,
      role: target.descriptor.role,
      strokeCount: target.strokeCount,
      paintedPixels,
      visible: target.descriptor.visible !== false
    });
  }
});

const png = composite.toBuffer("image/png");
await writeFile(outputDirectory + "/digital-artist-portrait.png", png);
const report = {
  renderer: "ZERO STUDIO native Canvas2D drawRasterBrushStroke",
  planFormat: stream.format,
  modelInferenceUsed: false,
  generatedImageUsed: false,
  externalImageGeneration: false,
  authoredSource: "deterministic hand-authored test fixture",
  canvas: { width, height },
  layers: layerReports,
  strokeCount: result.strokeCount,
  note: "This is an execution/rendering proof for a deterministic brush plan. It is not a vision-model output, an approved character, or an artistic-quality acceptance result."
};
await writeFile(outputDirectory + "/report.json", JSON.stringify(report, null, 2));

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  const rows = layerReports.map(layer =>
    "| " + layer.name + " | " + layer.role + " | " + layer.strokeCount + " | " + layer.paintedPixels.toLocaleString("en-US") + " |"
  ).join("\n");
  await appendFile(summaryPath, [
    "## ZERO STUDIO — deterministic Digital Artist render proof",
    "",
    "The editor's shared seven-layer fixture was compiled into native brush commands and rendered by the actual Canvas2D brush functions. Pixel counts are measured from each transparent layer.",
    "",
    "| Layer | Role | Strokes | Nontransparent pixels |",
    "|---|---|---:|---:|",
    rows,
    "",
    "Total: " + result.strokeCount + " strokes in " + result.layerCount + " native raster layers.",
    "",
    "This is a renderer integration proof only; it is not an AI-authored or visually approved anime character.",
    ""
  ].join("\n"));
}
console.log(JSON.stringify({
  output: outputDirectory + "/digital-artist-portrait.png",
  bytes: png.length,
  strokeCount: result.strokeCount,
  layerCount: result.layerCount,
  layers: layerReports
}));
