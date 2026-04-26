"use client";

import { useEffect, useRef } from "react";

/**
 * PapersRain — typewriter at bottom-left of the hero feeds sheets of
 * paper that drift across the canvas on simulated wind. Two stacked
 * monospace canvases share the same character grid:
 *
 *   .l-papers-typewriter   static, brighter, never animates. The
 *                          narrative anchor — a tiny ASCII typewriter
 *                          with a half-typed page sticking out the top.
 *   .l-papers-out          dynamic. Per-frame physics steps a small
 *                          population of paper sheets, each spawning
 *                          from the typewriter's paper outlet with
 *                          upward velocity, then drifting on wind +
 *                          gusts + occasional thermal updrafts.
 *
 * Physics is "feather mode" — gravity is tiny, drag is heavy, and the
 * dominant force is horizontal wind (slow sin-wave + per-frame gust
 * RNG). A page that emerges from the typewriter rises a few rows,
 * tumbles laterally for several seconds, and eventually exits the
 * viewport, at which point it queues for re-emergence from the
 * typewriter after a delay. The result reads like sheets caught by a
 * draft from an open window — exactly what you'd want a Shining-style
 * typewriter to feel like.
 */

// Paper glyphs — 4-row × 5-col rectangles. Multiple variants so the
// eye reads "different sheets" as they pass. The flutter loop swaps
// the middle row through these per-frame, suggesting the sheet
// tumbling slightly in the air.
const PAPERS: string[][] = [
  ["┌───┐", "│─ ─│", "│ ──│", "└───┘"],
  ["╭───╮", "│ ◦ │", "│── │", "╰───╯"],
  ["┌───┐", "│── │", "│ ──│", "└───┘"],
  ["╭───╮", "│  ─│", "│─ ─│", "╰───╯"],
];

// Typewriter scene — 28 cols × 8 rows. Anchored bottom-left of canvas.
// The half-typed page (rows 0-2) is what the papers "emerge from"; the
// carriage + body + keys (rows 3-7) sit on the implied desk.
const TYPEWRITER: string[] = [
  "       ┌─────────────┐      ",
  "       │░░░ ░░ ░░ ░░░│      ",
  "       │░░░░ ░░░ ░░░░│      ",
  "  ┌────┴─────────────┴────┐ ",
  "  │  ████████████████████ │ ",
  "  │ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ │ ",
  "  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │ ",
  "  └───────────────────────┘ ",
];

const COLS = 80;
const ROWS = 44;
const PAPER_W = 5;
const PAPER_H = 4;
const N_PAPERS = 12;
const FRAME_GATE_MS = 42; // ~24 fps

// Where in the dynamic-paper grid the typewriter visually sits. Used
// only to compute spawn coordinates — the typewriter itself is rendered
// by the static pre, not into this grid.
const TYPE_X = 0;
const TYPE_Y = ROWS - TYPEWRITER.length; // = 36

// Spawn region: just above the typewriter's paper-outlet (rows 0-2 of
// TYPEWRITER, columns 7-21). We give the spawn a small Y range so a
// burst of papers don't all stack at the same pixel.
const SPAWN_X_MIN = TYPE_X + 7;
const SPAWN_X_MAX = TYPE_X + 17;
const SPAWN_Y_MIN = TYPE_Y - 3;
const SPAWN_Y_MAX = TYPE_Y - 1;

// Feather-mode physics. Gravity is barely noticeable; drag is heavy so
// gusts decay slowly; thermals occasionally lift sheets off the floor.
const GRAVITY = 0.004;
const DRAG = 0.992;
const VY_DAMP = 0.996;
const WIND_FREQ = 0.0006; // rad/ms — slow lateral oscillation
const WIND_AMP = 0.18;
const GUST_PROB = 0.018;
const GUST_KICK = 0.32;
const THERMAL_PROB = 0.006;
const THERMAL_KICK = -0.28; // upward (negative y)

type Paper = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  shape: number;
  flutter: number;
  // Timestamp when this paper should re-emerge from the typewriter. 0
  // means "currently active". > 0 means "queued — sleeping inside the
  // typewriter, do not render or step".
  respawnAt: number;
};

function spawnFromTypewriter(p: Paper) {
  p.x = SPAWN_X_MIN + Math.random() * (SPAWN_X_MAX - SPAWN_X_MIN);
  p.y = SPAWN_Y_MIN + Math.random() * (SPAWN_Y_MAX - SPAWN_Y_MIN);
  // Mostly upward velocity with a small lateral kick — the page is
  // "blown" out of the carriage by the same wind pushing the rest.
  p.vx = (Math.random() - 0.5) * 0.55;
  p.vy = -0.45 - Math.random() * 0.3;
  p.shape = Math.floor(Math.random() * PAPERS.length);
  p.flutter = Math.random() * 1000;
  p.respawnAt = 0;
}

type Props = { className?: string };

export function PapersRain({ className }: Props) {
  const papersRef = useRef<HTMLPreElement | null>(null);
  const typewriterRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    const papersPre = papersRef.current;
    const typewriterPre = typewriterRef.current;
    if (!papersPre || !typewriterPre) return;

    // Pad the typewriter with empty rows above so its grid coordinates
    // line up exactly with the dynamic-papers grid (both pres anchored
    // bottom-left, same font-size, so identical columns/rows).
    const pad = "\n".repeat(TYPE_Y);
    typewriterPre.textContent = pad + TYPEWRITER.join("\n");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const now0 = performance.now();
    const papers: Paper[] = Array.from({ length: N_PAPERS }, (_, i) => {
      const p = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        shape: 0,
        flutter: 0,
        respawnAt: 0,
      } as Paper;
      // Stagger initial state: first 3 papers are pre-flying (so the
      // hero doesn't open empty), rest queue up to emerge from the
      // typewriter every ~1.2s for the first ~12 seconds.
      if (i < 3) {
        spawnFromTypewriter(p);
        // Pre-advance their physics so they're already in the air at
        // varying heights/positions when the user arrives.
        for (let k = 0; k < 40 + i * 30; k++) {
          p.vx += Math.sin(k * 0.05) * 0.005;
          p.vy += GRAVITY;
          p.vx *= DRAG;
          p.vy *= VY_DAMP;
          p.x += p.vx;
          p.y += p.vy;
        }
      } else {
        p.respawnAt = now0 + (i - 2) * 1100 + Math.random() * 600;
        p.y = ROWS + 100;
      }
      return p;
    });

    // Pre-allocated grid for the dynamic layer. Same trick as before —
    // fill+stamp+join per frame, ~3500 cells so it's cheap.
    const grid: string[] = new Array(COLS * ROWS).fill(" ");

    const stamp = (paper: Paper) => {
      const ix = Math.floor(paper.x);
      const iy = Math.floor(paper.y);
      const variant = (paper.shape + Math.floor(paper.flutter / 12)) % PAPERS.length;
      const flutterShape = PAPERS[variant];
      const shape = PAPERS[paper.shape];
      for (let dy = 0; dy < PAPER_H; dy++) {
        const row = (dy === 1 ? flutterShape : shape)[dy];
        const py = iy + dy;
        if (py < 0 || py >= ROWS) continue;
        for (let dx = 0; dx < PAPER_W; dx++) {
          const px = ix + dx;
          if (px < 0 || px >= COLS) continue;
          const ch = row[dx];
          if (ch === " ") continue;
          grid[py * COLS + px] = ch;
        }
      }
    };

    const render = () => {
      grid.fill(" ");
      for (const p of papers) {
        if (p.respawnAt > 0) continue;
        stamp(p);
      }
      let out = "";
      for (let y = 0; y < ROWS; y++) {
        out += grid.slice(y * COLS, (y + 1) * COLS).join("") + "\n";
      }
      papersPre.textContent = out;
    };

    if (reduced) {
      // Static frame — render once at the staggered initial state and
      // skip the RAF loop entirely.
      render();
      return;
    }

    let raf = 0;
    let stopped = false;
    let last = 0;

    const step = (now: number) => {
      const wind = Math.sin(now * WIND_FREQ) * WIND_AMP;
      for (const p of papers) {
        if (p.respawnAt > 0) {
          if (p.respawnAt <= now) spawnFromTypewriter(p);
          continue;
        }
        p.flutter += 1;
        p.vx += wind * 0.04;
        if (Math.random() < GUST_PROB) p.vx += (Math.random() - 0.5) * GUST_KICK;
        if (Math.random() < THERMAL_PROB) p.vy += THERMAL_KICK;
        p.vy += GRAVITY;
        p.vx *= DRAG;
        p.vy *= VY_DAMP;
        p.x += p.vx;
        p.y += p.vy;
        // Off-screen — queue the page for re-emergence from the
        // typewriter after a beat (so the scene reads as "the typist
        // just finished another page" rather than constant snowfall).
        const offscreen =
          p.x < -PAPER_W - 4 ||
          p.x > COLS + 4 ||
          p.y < -PAPER_H - 4 ||
          p.y > ROWS + 6;
        // Don't let papers settle ON the typewriter footprint —
        // bump them upward if they drift into its bounding rows. Keeps
        // the typewriter visible through any low-wind moments.
        const overTypewriter =
          p.y > TYPE_Y - PAPER_H + 1 &&
          p.y < ROWS &&
          p.x > TYPE_X - 1 &&
          p.x < TYPE_X + TYPEWRITER[0].length - 4;
        if (offscreen) {
          p.respawnAt = now + 1500 + Math.random() * 2000;
          p.y = ROWS + 100;
        } else if (overTypewriter && Math.random() < 0.35) {
          p.vy += THERMAL_KICK * 1.4;
        }
      }
    };

    const loop = (now: number) => {
      if (stopped) return;
      if (document.visibilityState !== "hidden" && now - last > FRAME_GATE_MS) {
        step(now);
        render();
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={`l-papers ${className ?? ""}`} aria-hidden="true">
      <pre ref={typewriterRef} className="l-papers-typewriter" />
      <pre ref={papersRef} className="l-papers-out" />
    </div>
  );
}
