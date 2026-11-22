// ZERO STUDIO — deterministic extraction of separate views from a white-background model sheet.
// It removes only border-connected near-white background and preserves every retained source pixel.
const MAX_PIXELS = 16_000_000;
const fail = message => { throw new Error(message); };

export function extractCharacterViews(source, options = {}) {
  const width = Number(source?.width), height = Number(source?.height);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > MAX_PIXELS) {
    fail("Model-sheet dimensions must be positive and at most 16 megapixels.");
  }
  const input = source?.data;
  if (!(input instanceof Uint8Array || input instanceof Uint8ClampedArray || Array.isArray(input)) || input.length !== width * height * 4) {
    fail("Model-sheet RGBA pixels are missing or have invalid dimensions.");
  }
  const expectedViews = Number(options.expectedViews ?? 3);
  const minArea = Number(options.minArea ?? Math.max(1000, Math.floor(width * height * 0.0005)));
  const whiteThreshold = Number(options.whiteThreshold ?? 248);
  const chromaTolerance = Number(options.chromaTolerance ?? 18);
  if (!Number.isInteger(expectedViews) || expectedViews < 1 || expectedViews > 8 || !Number.isInteger(minArea) || minArea < 1 ||
      !Number.isInteger(whiteThreshold) || whiteThreshold < 200 || whiteThreshold > 255 ||
      !Number.isInteger(chromaTolerance) || chromaTolerance < 0 || chromaTolerance > 80) {
    fail("Model-sheet segmentation options are invalid.");
  }

  const count = width * height;
  const backgroundCandidate = new Uint8Array(count);
  for (let i = 0, p = 0; i < count; i++, p += 4) {
    const r = input[p], g = input[p + 1], b = input[p + 2];
    const min = Math.min(r, g, b), max = Math.max(r, g, b);
    backgroundCandidate[i] = min >= whiteThreshold && max - min <= chromaTolerance && input[p + 3] > 0 ? 1 : 0;
  }

  // Flood only from the outer image border. Enclosed white cloth/skin highlights remain intact.
  const exterior = new Uint8Array(count);
  const queue = new Int32Array(count);
  let head = 0, tail = 0;
  const enqueue = index => {
    if (backgroundCandidate[index] && !exterior[index]) {
      exterior[index] = 1;
      queue[tail++] = index;
    }
  };
  for (let x = 0; x < width; x++) { enqueue(x); enqueue((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { enqueue(y * width); enqueue(y * width + width - 1); }
  while (head < tail) {
    const i = queue[head++], x = i % width;
    if (x > 0) enqueue(i - 1);
    if (x + 1 < width) enqueue(i + 1);
    if (i >= width) enqueue(i - width);
    if (i + width < count) enqueue(i + width);
  }

  // Eight-connectivity keeps diagonal antialias joins intact.
  const visited = new Uint8Array(count);
  const componentQueue = new Int32Array(count);
  const components = [];
  for (let start = 0; start < count; start++) {
    const offset = start * 4;
    if (exterior[start] || visited[start] || input[offset + 3] === 0) continue;
    let qHead = 0, qTail = 0;
    componentQueue[qTail++] = start; visited[start] = 1;
    let minX = width, minY = height, maxX = -1, maxY = -1;
    while (qHead < qTail) {
      const i = componentQueue[qHead++], x = i % width, y = Math.floor(i / width);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      const y0 = Math.max(0, y - 1), y1 = Math.min(height - 1, y + 1);
      const x0 = Math.max(0, x - 1), x1 = Math.min(width - 1, x + 1);
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
        const j = yy * width + xx;
        if (!exterior[j] && !visited[j] && input[j * 4 + 3] > 0) {
          visited[j] = 1; componentQueue[qTail++] = j;
        }
      }
    }
    if (qTail >= minArea) components.push({ pixels: qTail, x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1, indices: componentQueue.slice(0, qTail) });
  }

  components.sort((a, b) => a.x - b.x || b.pixels - a.pixels);
  if (components.length !== expectedViews) {
    fail(`Expected ${expectedViews} separate character views, but found ${components.length} foreground components above ${minArea} pixels. Adjust the background settings or use a cleaner model sheet.`);
  }

  const ids = ["front", "side", "back", "view-4", "view-5", "view-6", "view-7", "view-8"];
  const labels = ["Front view", "Side view", "Back view"];
  const views = components.map((component, index) => {
    const data = new Uint8ClampedArray(component.width * component.height * 4);
    for (const global of component.indices) {
      const x = global % width - component.x, y = Math.floor(global / width) - component.y;
      const from = global * 4, to = (y * component.width + x) * 4;
      data.set(input.subarray ? input.subarray(from, from + 4) : input.slice(from, from + 4), to);
    }
    return {
      id: ids[index],
      label: labels[index] || `View ${index + 1}`,
      bounds: { x: component.x, y: component.y, width: component.width, height: component.height },
      width: component.width,
      height: component.height,
      pixelCount: component.pixels,
      data
    };
  });

  return {
    format: "zero-studio-character-sheet-views",
    version: 1,
    width,
    height,
    expectedViews,
    exteriorBackgroundPixels: tail,
    views
  };
}
