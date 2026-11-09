// Usage: node scripts/stills.mjs 40 120 300 ...  → out/fNNNN.png (one bundle, one browser)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "node:path";
const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const puppeteerInstance = await openBrowser("chrome", { browserExecutable });
const composition = await selectComposition({ serveUrl, id: "Swissyphus", puppeteerInstance });
for (const frame of frames) {
  const t = Date.now();
  await renderStill({ composition, serveUrl, frame, output: `out/f${String(frame).padStart(4, "0")}.png`, puppeteerInstance, overwrite: true, scale: 0.5 });
  console.log(frame, Date.now() - t, "ms");
}
await puppeteerInstance.close({ silent: true });
