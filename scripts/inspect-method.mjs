import { chromium } from "playwright";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
const stage = await p.$(".l-solve-stage");
await stage.scrollIntoViewIfNeeded();
await p.waitForTimeout(1500);
// Dump computed style for each agent node
const data = await p.evaluate(() => {
  const stage = document.querySelector(".l-solve-stage");
  const stageRect = stage.getBoundingClientRect();
  const nodes = [...document.querySelectorAll(".l-agent-node")];
  return {
    stageVisible: stage.classList.contains("visible"),
    stageRect: { x: stageRect.x, y: stageRect.y, w: stageRect.width, h: stageRect.height },
    nodes: nodes.map(n => {
      const r = n.getBoundingClientRect();
      const cs = getComputedStyle(n);
      return {
        i: n.getAttribute("data-i"),
        text: n.querySelector(".l-agent-name")?.textContent,
        rect: { x: r.x, y: r.y, w: r.width, h: r.height },
        opacity: cs.opacity,
        transform: cs.transform,
        top: cs.top,
        left: cs.left,
      };
    }),
  };
});
console.log(JSON.stringify(data, null, 2));
await b.close();
