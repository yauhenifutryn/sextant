import { chromium } from "playwright";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
const data = await p.evaluate(() => {
  const out = document.querySelector(".l-pstream-out");
  const bg = document.querySelector(".l-ascii-hero-bg");
  const stage = document.querySelector(".l-ascii-stage");
  const hero = document.querySelector(".l-ascii-hero");
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    hero: { rect: hero.getBoundingClientRect(), display: getComputedStyle(hero).display, gridCols: getComputedStyle(hero).gridTemplateColumns },
    bg: { rect: bg.getBoundingClientRect(), position: getComputedStyle(bg).position },
    stage: { rect: stage.getBoundingClientRect() },
    out: { rect: out.getBoundingClientRect(), opacity: getComputedStyle(out).opacity, fontSize: getComputedStyle(out).fontSize },
  };
});
console.log(JSON.stringify(data, null, 2));
await b.close();
