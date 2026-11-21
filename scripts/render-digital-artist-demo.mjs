import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { createCanvas } from "@napi-rs/canvas";
import { drawRasterBrushStroke, fillRasterRegion, mapPointsToRaster } from "../app/raster-brushes.mjs";
import { compileDigitalArtistBrushPlan } from "../app/digital-artist-brush-engine.mjs";
import { executeDigitalArtistBrushStream } from "../app/digital-artist-brush-executor.mjs";
import { createDigitalArtistDemoPlan } from "../app/digital-artist-demo-plan.mjs";
import { analyzeRasterPixels, analyzeStrokeGeometry } from "../app/digital-artist-eyes.mjs";

const width = 1920, height = 1080;
const plan = createDigitalArtistDemoPlan();
const stream = compileDigitalArtistBrushPlan(plan);
const composite = createCanvas(width, height);
const compositeContext = composite.getContext("2d");
const artistComposite = createCanvas(width, height);
const artistCompositeContext = artistComposite.getContext("2d");
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
    return { descriptor, canvas, context, strokeCount: 0, regionFillCount: 0, paintedPixels: 0 };
  },
  paintStroke: async (target, command) => {
    const mapped = mapPointsToRaster(command.points, width, height, width, height, command.options.size ?? 1);
    const strokeResult = command.kind === "raster-region-fill"
      ? fillRasterRegion(target.context, mapped.points, command.options)
      : drawRasterBrushStroke(target.context, mapped.points, { ...command.options, size: mapped.size });
    target.strokeCount++;
    if (command.kind === "raster-region-fill") target.regionFillCount++;
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
      artistCompositeContext.globalAlpha = 1;
      artistCompositeContext.globalCompositeOperation = "source-over";
      artistCompositeContext.drawImage(target.canvas, 0, 0);
    }

    layerIndex++;
    const name = String(layerIndex).padStart(2, "0") + "-" + target.descriptor.id.replace(/[^a-z0-9._-]/gi, "-");
    await writeFile(layerDirectory + "/" + name + ".png", target.canvas.toBuffer("image/png"));
    layerReports.push({
      id: target.descriptor.id,
      name: target.descriptor.name,
      role: target.descriptor.role,
      strokeCount: target.strokeCount,
      regionFillCount: target.regionFillCount,
      paintedPixels,
      visible: target.descriptor.visible !== false,
      rasterEye: analyzeRasterPixels({ width, height, data: pixels })
    });
  }
});

const pixelAt = (x, y) => {
  const offset = (y * width + x) * 4;
  const data = compositeContext.getImageData(x, y, 1, 1).data;
  return [data[0], data[1], data[2], data[3]];
};
const expectColorNear = (label, actual, expected, tolerance = 12) => {
  if (actual.some((value, index) => Math.abs(value - expected[index]) > tolerance)) {
    throw new Error(label + " pixel mismatch: got " + actual.join(",") + ", expected near " + expected.join(","));
  }
};
// Regression probes: representative pixels are inside the artist-authored
// face, hair and clothing polygons, while the control point stays outside them.
expectColorNear("Face region", pixelAt(960, 580), [239, 196, 177, 255]);
expectColorNear("Eye white region", pixelAt(850, 472), [255, 249, 242, 255]);
expectColorNear("Hair region", pixelAt(960, 205), [52, 56, 76, 255]);
expectColorNear("Clothing region", pixelAt(960, 970), [113, 153, 156, 255]);
expectColorNear("Outside silhouette", pixelAt(1320, 700), [245, 241, 233, 255]);

const artistRasterEye = analyzeRasterPixels({ width, height, data: artistCompositeContext.getImageData(0, 0, width, height).data });
if (!artistRasterEye.bounds || artistRasterEye.bounds.x === 0 || artistRasterEye.bounds.y === 0 ||
    artistRasterEye.bounds.width >= width || artistRasterEye.bounds.height >= height ||
    artistRasterEye.alphaCoverage <= 0 || artistRasterEye.alphaCoverage >= 1) {
  throw new Error("Artist silhouette eye did not isolate a bounded transparent character composite.");
}

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
  regionFillCount: layerReports.reduce((sum, layer) => sum + layer.regionFillCount, 0),
  artistEyes: {
    raster: artistRasterEye,
    lines: stream.commands.map(analyzeStrokeGeometry),
    layerSummaries: layerReports.map(layer => ({
      id: layer.id, role: layer.role, visible: layer.visible,
      alphaCoverage: layer.rasterEye.alphaCoverage,
      bounds: layer.rasterEye.bounds,
      dominantPalette: layer.rasterEye.dominantPalette.slice(0, 5)
    }))
  },
  note: "This is an execution/rendering proof for a deterministic brush plan. It is not a vision-model output, an approved character, or an artistic-quality acceptance result."
};
await writeFile(outputDirectory + "/report.json", JSON.stringify(report, null, 2));
await writeFile(outputDirectory + "/digital-artist-eyes-report.json", JSON.stringify(report.artistEyes, null, 2));

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
    "Total: " + result.strokeCount + " drawing operations (including " + layerReports.reduce((sum, layer) => sum + layer.regionFillCount, 0) + " closed region fills) in " + result.layerCount + " native raster layers.",
    "",
    "### Artist eyes v1 — deterministic inspection",
    "",
    "- Visible composite pixel coverage: " + (report.artistEyes.raster.alphaCoverage * 100).toFixed(1) + "%.",
    "- Measured stroke geometries: " + report.artistEyes.lines.length + ".",
    "- Layer silhouette bounds and dominant colors are recorded in digital-artist-eyes-report.json.",
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
