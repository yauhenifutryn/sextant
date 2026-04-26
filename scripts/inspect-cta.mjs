import { chromium } from "playwright";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.waitForTimeout(800);
const data = await p.evaluate(() => {
  const cta = document.querySelector(".l-ascii-cta");
  const cs = getComputedStyle(cta);
  return {
    rect: cta.getBoundingClientRect(),
    classes: cta.className,
    inlineStyle: cta.getAttribute("style"),
    visibility: cs.visibility,
    display: cs.display,
    opacity: cs.opacity,
    background: cs.background,
    backgroundColor: cs.backgroundColor,
    backgroundImage: cs.backgroundImage,
    color: cs.color,
    cssText: cs.cssText.substring(0, 600),
    parents: (() => {
      const arr = [];
      let n = cta;
      while (n) { arr.push(n.tagName + (n.className ? "." + (typeof n.className === "string" ? n.className.split(" ").join(".") : "") : "")); n = n.parentElement; }
      return arr.slice(0, 8);
    })(),
    primaryVar: getComputedStyle(cta).getPropertyValue("--primary"),
  };
});
console.log(JSON.stringify(data, null, 2));
await b.close();
