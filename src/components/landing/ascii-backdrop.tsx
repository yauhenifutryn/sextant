"use client";

import { useEffect, useRef } from "react";

/**
 * Full-bleed paper-flow backdrop.
 *
 * Sparse vertical streams of monospace research-paper fragments drift slowly
 * downward behind the hero. ~36 active streams, each picking a random column,
 * speed, and content snippet from a paper-flavored pool (DOIs, journals,
 * statistical phrases, gene symbols, methods snippets). At rest the page reads
 * as warm off-white; the streams add a subtle "the agents are reading the
 * literature" texture without competing with the headline.
 *
 * Architecture notes:
 *  - Canvas-rendered (single drawText per stream per frame; no DOM thrash).
 *  - Throttled to ~12 FPS via 80ms RAF gate. Higher FPS would make the drift
 *    feel jittery anyway — this is a calm backdrop, not a Matrix shower.
 *  - Honors `prefers-reduced-motion: reduce` (renders one static frame).
 *  - Pauses while the page tab is hidden (visibilityState).
 *  - Pauses once the user has scrolled past the hero (cheap CPU win — the
 *    backdrop isn't visible behind the solid-background sections below it).
 *  - DPR-aware: backing canvas is sized at `width * dpr`, scaled in CSS, so
 *    text stays sharp on retina without doubling the workload.
 *  - ResizeObserver re-syncs canvas dimensions when the viewport changes
 *    (e.g. devtools opens, mobile orientation flip).
 *
 * Inspirations (no deps):
 *  - Ascii-Motion (CameronFoxly): sparse cell-based frame grid + RAF batch
 *    pattern. We use a fixed pool of streams instead of a per-cell map since
 *    the foreground content is sparse text not dense art.
 *  - Pretext (chenglou): cache-then-compute split for text layout. We follow
 *    the same idea — measure once via `ctx.measureText` to find a column
 *    width, then run pure arithmetic per frame to position streams.
 */

const STREAM_COUNT = 36;
const FRAME_GATE_MS = 80; // ~12 FPS
const COL_CHAR_WIDTH_PX = 9; // approximate width of a Geist Mono char at 13px
const LINE_HEIGHT_PX = 18;
const FONT_SIZE_PX = 13;
const BASE_ALPHA = 0.13;
const FOREST_RGB = "15, 76, 58";

const POOL: ReadonlyArray<string> = [
  "doi:10.1038/s41586-024",
  "Nature 624, 581 (2024)",
  "Cell 187, 3421",
  "Science 383, 1098",
  "Mol Cell 84, 729",
  "p < 0.001, n = 32",
  "fig 3a, panel ii",
  "95% CI [0.42, 0.78]",
  "CRISPR-Cas9 K562",
  "AAV9-CMV-GFP",
  "WB anti-pAKT (S473)",
  "qPCR ΔΔCt",
  "4°C overnight",
  "PBS 1× pH 7.4",
  "FACS gated CD4+",
  "i.p. 5 mg/kg",
  "siRNA scrambled",
  "40× confocal",
  "OD600 = 0.6",
  "BL21(DE3) competent",
  "Tris-HCl 50 mM",
  "GAPDH housekeeping",
  "hPSC line H9",
  "vehicle DMSO 0.1%",
  "WT vs. KO littermate",
  "linear regression β=0.34",
  "Bonferroni-corrected α",
  "Mann-Whitney U test",
  "power = 0.80",
  "IACUC #2024-1147",
  "BSL-2 containment",
  "replicates n = 3",
  "PMID 38291847",
  "RRID:AB_2535809",
  "anti-Tubulin α 1:5000",
  "elution buffer 250 mM",
  "Cas13d guide library",
  "shRNA pLKO.1",
  "10× single-cell v3.1",
  "scRNA-seq UMAP",
  "ATAC-seq peaks ENCODE",
  "rotarod latency 180s",
  "Morris water maze",
  "RNAseq DESeq2",
  "GO:0006915 apoptosis",
  "KEGG hsa04210",
  "fold-change > 2.0",
  "FDR q < 0.05",
];

type Stream = {
  col: number;
  y: number;
  speed: number;
  text: string;
  alpha: number;
  hue: 0 | 1; // 0 = forest, 1 = clay (rare highlight stream)
};

function pick<T>(arr: ReadonlyArray<T>): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function spawn(viewportH: number, cols: number, fromTop: boolean): Stream {
  return {
    col: Math.floor(Math.random() * cols),
    y: fromTop ? -Math.random() * 200 : Math.random() * viewportH,
    speed: 0.18 + Math.random() * 0.55, // px per frame at 12 FPS
    text: pick(POOL),
    alpha: 0.5 + Math.random() * 0.5,
    hue: Math.random() < 0.06 ? 1 : 0, // ~6% clay highlights
  };
}

export function AsciiBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let cols = 0;
    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let streams: Stream[] = [];
    let raf = 0;
    let last = 0;
    let stopped = false;
    let scrolledPastHero = false;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${FONT_SIZE_PX}px ui-monospace, "Geist Mono", "JetBrains Mono", monospace`;
      ctx.textBaseline = "top";
      cols = Math.max(8, Math.floor(width / COL_CHAR_WIDTH_PX / 16)); // ~16-char gutter between streams
      // re-init streams with the new dimensions
      streams = Array.from({ length: STREAM_COUNT }, () => spawn(height, cols, false));
    };

    const drawStream = (s: Stream) => {
      const x = ((s.col + 0.5) / cols) * width - (s.text.length * COL_CHAR_WIDTH_PX) / 2;
      const rgb = s.hue === 1 ? "184, 92, 56" : FOREST_RGB;
      const a = BASE_ALPHA * s.alpha;
      ctx.fillStyle = `rgba(${rgb}, ${a})`;
      // Draw text vertically by stacking each character
      for (let i = 0; i < s.text.length; i++) {
        const ch = s.text[i];
        if (ch === " ") continue;
        const yy = s.y + i * LINE_HEIGHT_PX;
        if (yy < -LINE_HEIGHT_PX || yy > height + LINE_HEIGHT_PX) continue;
        // Head character is brighter — gives the stream a sense of "lead"
        if (i === 0) {
          ctx.fillStyle = `rgba(${rgb}, ${Math.min(1, a * 3)})`;
          ctx.fillText(ch, x, yy);
          ctx.fillStyle = `rgba(${rgb}, ${a})`;
        } else {
          ctx.fillText(ch, x, yy);
        }
      }
    };

    const frame = () => {
      ctx.clearRect(0, 0, width, height);
      for (const s of streams) {
        s.y += s.speed;
        // recycle when fully past the bottom
        if (s.y > height + s.text.length * LINE_HEIGHT_PX) {
          Object.assign(s, spawn(height, cols, true));
        }
        drawStream(s);
      }
    };

    const loop = (now: number) => {
      if (stopped) return;
      if (
        document.visibilityState !== "hidden" &&
        !scrolledPastHero &&
        now - last > FRAME_GATE_MS
      ) {
        frame();
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };

    const onScroll = () => {
      // pause once user has scrolled past the hero — cheap CPU win, the
      // backdrop is masked behind solid-bg sections below anyway.
      const limit = Math.max(window.innerHeight * 0.9, 600);
      const past = window.scrollY > limit;
      if (past !== scrolledPastHero) {
        scrolledPastHero = past;
        // smoothly fade by adjusting canvas opacity instead of teleporting state
        canvas.style.opacity = past ? "0" : "1";
      }
    };

    resize();
    frame(); // paint one frame immediately so SSR-> hydrate is not a blank flash

    if (!reduced) {
      raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="l-ascii-backdrop" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
