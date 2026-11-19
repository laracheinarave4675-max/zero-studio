import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const key = String(process.env.GEMINI_API_KEY || "").trim();
if (!key) throw new Error("GEMINI_API_KEY is not available to this workflow; no API request was sent.");
const base = process.env.ZERO_STUDIO_URL || "http://127.0.0.1:4173";
const out = "artifacts/gemini-visual-acceptance";
await fs.mkdir(out, { recursive: true });
const scenes = [
  {
    id: "woodland-japanese-house",
    title: "Traditional Japanese house in a sunlit forest",
    prompt: "Create an original premium cinematic 2D Japanese anime background: a large traditional two-storey Japanese wooden residence on a gentle stone terrace, layered dark ceramic tile roofs with accurate eaves and exposed timber joinery, veranda and sliding windows, mature irregular trees and dense varied foliage framing the house, moss, stone retaining wall and garden plants. Wide 16:9 establishing shot, coherent three-quarter architectural perspective, warm late-afternoon sun entering from upper right, cool deep forest shadows, delicate atmospheric depth, carefully observed painted materials. No people, no logos, no copied film frame."
  },
  {
    id: "rural-japanese-convenience-store",
    title: "Small Japanese convenience store at a quiet intersection",
    prompt: "Create an original premium cinematic 2D Japanese anime background: a small Japanese neighborhood convenience store on a quiet rural intersection, low wide storefront with glass windows, sliding entrance, colorful but fictional horizontal fascia bands, vending machine, benches, utility poles and overhead wires, road markings, curb and sidewalk, distant wooded hills and lush summer trees. Wide 16:9 street-level establishing shot with accurate one-point perspective, warm afternoon sunlight, believable glass reflections and asphalt texture, detailed painted foliage and architecture. No readable brand logos, no copied film frame."
  },
  {
    id: "rural-ramen-restaurant",
    title: "Roadside ramen restaurant in the Japanese countryside",
    prompt: "Create an original premium cinematic 2D Japanese anime background: a modest two-storey roadside ramen restaurant in rural Japan, traditional tiled sloping roof, wooden signboard with abstract non-readable lettering, noren entrance curtain, planters, parking shoulder and sidewalk, two-lane road receding toward green hills, utility poles and distant countryside. Wide 16:9 cinematic composition from the roadside, accurate perspective and scale, golden-hour sunlight from the left, long soft shadows, layered mountains, lush natural vegetation, finely observed wood, tile, concrete and asphalt. No people, no real logos, no copied film frame."
  }
];

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const report = { branch: "feature/fixed-background-visual-review", scenes: [], startedAt: new Date().toISOString() };
try {
  await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
  await page.locator("#geminiApiKey").fill(key);
  for (const scene of scenes) {
    await page.locator("#aiPrompt").fill(scene.prompt);
    await page.locator("#ai2dGenerateBtn").click();
    await page.waitForFunction(() => {
      const review = document.querySelector("#aiReview");
      const status = document.querySelector("#aiStatus")?.textContent || "";
      const button = document.querySelector("#ai2dGenerateBtn");
      return (!review?.hidden && button?.disabled === false) || (button?.disabled === false && /تعذر|لم يجتز الرسم/.test(status));
    }, { timeout: 900000 });
    const result = await page.evaluate(() => {
      const status = document.querySelector("#aiStatus")?.textContent || "";
      const review = document.querySelector("#aiReview");
      const approve = document.querySelector("#aiApproveBtn");
      const svg = document.querySelector("#proposalLayer");
      const pathCount = svg?.querySelectorAll("path").length || 0;
      const scores = [...status.matchAll(/(\\d+(?:\\.\\d+)?)\\s*\\/10/g)].map(m => Number(m[1]));
      return {
        status,
        score: scores.length ? scores[scores.length - 1] : null,
        reviewVisible: Boolean(review && !review.hidden),
        approvalEnabled: Boolean(approve && !approve.disabled),
        pathCount,
        svgPresent: Boolean(svg && pathCount > 0),
        modelOrError: status.slice(0, 1200)
      };
    });
    const screenshot = path.join(out, scene.id + ".png");
    const layer = page.locator("#proposalLayer");
    if (result.svgPresent) await layer.screenshot({ path: screenshot, timeout: 30000 });
    else await page.screenshot({ path: path.join(out, scene.id + "-failure.png"), fullPage: true });
    report.scenes.push({ ...scene, ...result, screenshot: result.svgPresent ? screenshot : null });
    await fs.writeFile(path.join(out, scene.id + ".json"), JSON.stringify(report.scenes.at(-1), null, 2));
    if (!result.reviewVisible || !result.svgPresent) throw new Error(scene.id + " did not produce a reviewable vector proposal: " + result.status);
  }
} finally {
  report.finishedAt = new Date().toISOString();
  await fs.writeFile(path.join(out, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
}
const summary = report.scenes.map(s => "| " + s.title + " | " + s.score + "/10 | " + (s.approvalEnabled ? "PASS" : "FAIL") + " | " + s.pathCount + " |").join("\n");
await fs.appendFile(process.env.GITHUB_STEP_SUMMARY || "/dev/null",
  "## ZERO STUDIO — Gemini visual acceptance\n\n" +
  "| Scene | Gemini score | Quality gate | SVG paths |\n|---|---:|---|---:|\n" + summary +
  "\n\nFull PNG previews and JSON critique reports are attached as the `gemini-visual-acceptance` workflow artifact.\n");
if (report.scenes.some(s => !s.approvalEnabled || s.score < 8)) process.exitCode = 1;
