// Headless screenshot harness for the Sextant landing.
// Run: node scripts/screenshot.mjs [route] [outfile] [size]
// Sizes: desktop (default 1440x900), wide (1920x1080), mobile (390x844)
import { chromium } from "playwright";

const ROUTE = process.argv[2] ?? "/";
const OUT = process.argv[3] ?? "/tmp/sx-shots/home.png";
const SIZE = process.argv[4] ?? "desktop";
const SIZES = {
  desktop: { width: 1440, height: 900 },
  wide: { width: 1920, height: 1080 },
  mobile: { width: 390, height: 844 },
};
const VIEWPORT = SIZES[SIZE] ?? SIZES.desktop;
const URL = `http://localhost:3000${ROUTE}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: VIEWPORT,
  reducedMotion: "no-preference",
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

const consoleMsgs = [];
page.on("console", (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));
page.on("pageerror", (err) => consoleMsgs.push(`[pageerror] ${err.message}`));

await page.goto(URL, { waitUntil: "networkidle", timeout: 30_000 });
await page.waitForTimeout(2200);

await page.screenshot({ path: OUT, fullPage: false });
console.log(`screenshot saved: ${OUT}`);
console.log(`viewport: ${VIEWPORT.width}x${VIEWPORT.height} @ 2x (${SIZE})`);
const errs = consoleMsgs.filter((m) => /pageerror|\[error\]|hydration/i.test(m));
if (errs.length) {
  console.log("\nERRORS:");
  for (const m of errs) console.log(`  ${m}`);
} else {
  console.log("(no errors)");
}

await browser.close();
