// Headless screenshot harness for the Sextant landing.
// Run: node scripts/screenshot.mjs [route] [outfile] [size] [mode]
// Sizes: desktop (default 1440x900), wide (1920x1080), mobile (390x844)
// Mode: viewport (default), full (full-page), sections (one shot per section)
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname, basename, extname, join } from "node:path";

const ROUTE = process.argv[2] ?? "/";
const OUT = process.argv[3] ?? "/tmp/sx-shots/home.png";
const SIZE = process.argv[4] ?? "desktop";
const MODE = process.argv[5] ?? "viewport"; // viewport | full | sections
const SIZES = {
  desktop: { width: 1440, height: 900 },
  wide: { width: 1920, height: 1080 },
  mobile: { width: 390, height: 844 },
};
const VIEWPORT = SIZES[SIZE] ?? SIZES.desktop;
const URL = `http://localhost:3000${ROUTE}`;

await mkdir(dirname(OUT), { recursive: true });

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
await page.waitForTimeout(2400);

if (MODE === "sections") {
  const dir = dirname(OUT);
  const stem = basename(OUT, extname(OUT));
  const ext = extname(OUT) || ".png";
  // (label, selector) in DOM order — id where present, class otherwise
  const sections = [
    ["top", "#top"],
    ["problem", "#problem"],
    ["method", "#method"],
    ["loop", "#loop"],
    ["tech", ".l-tech"],
    ["cta", ".l-cta"],
    ["footer", ".l-foot"],
  ];
  for (const [label, sel] of sections) {
    const handle = await page.$(sel);
    if (!handle) {
      console.log(`(no section ${sel})`);
      continue;
    }
    await handle.scrollIntoViewIfNeeded();
    // Force the page's scroll listener to fire — scrollIntoViewIfNeeded
    // is a no-op when the section is already in view, so vars driven by
    // scroll position (--method-progress, --loop-progress, etc.) wouldn't
    // get written. Dispatching a synthetic scroll event nudges the RAF.
    await page.evaluate(() => window.dispatchEvent(new Event("scroll")));
    // Reveal/parallax/scroll-progress animations stagger up to ~1300ms.
    // Wait long enough for the slowest agent reveal to settle.
    await page.waitForTimeout(1600);
    const path = join(dir, `${stem}-${label}${ext}`);
    await handle.screenshot({ path });
    console.log(`section ${label} (${sel}) → ${path}`);
  }
} else {
  await page.screenshot({ path: OUT, fullPage: MODE === "full" });
  console.log(`screenshot saved: ${OUT} (${MODE})`);
}
console.log(`viewport: ${VIEWPORT.width}x${VIEWPORT.height} @ 2x (${SIZE})`);
const errs = consoleMsgs.filter((m) => /pageerror|\[error\]|hydration/i.test(m));
if (errs.length) {
  console.log("\nERRORS:");
  for (const m of errs) console.log(`  ${m}`);
} else {
  console.log("(no errors)");
}

await browser.close();
