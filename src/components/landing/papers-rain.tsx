"use client";

import { useEffect, useRef } from "react";

/**
 * PapersRain — three-phase paper lifecycle around an ASCII typewriter
 * at the bottom-left of the hero.
 *
 *   1. typing       a sheet sits in the carriage, characters appear on
 *                   it one by one as it slowly rises out the back of
 *                   the platen (the platen really does feed paper
 *                   upward as you type — same physical metaphor).
 *   2. ascending    typing completes, the sheet accelerates straight
 *                   up out of the typewriter (~1s of fast flight).
 *   3. drifting     once the page passes its apex it falls back down
 *                   like a leaf — gentle gravity, strong rightward
 *                   wind drift, lateral wobble. The page traverses the
 *                   hero from left to right while slowly settling.
 *
 * Multiple sheets share the canvas: only one types at a time (the
 * typewriter is single-purpose), but ascending + drifting sheets keep
 * accumulating. Off-screen sheets recycle back into the queue and
 * re-emerge from the typewriter after a beat.
 *
 * The typewriter itself is rendered as a separate static <pre> at
 * higher opacity than the dynamic-papers <pre>, so the scene reads as
 * "object on a desk with sheets caught by a draft" rather than
 * "monospace texture noise". Both pres are bottom-left anchored with
 * the same font-size, so character coordinates line up cell-for-cell.
 */

// Flying-paper glyphs — small 5×4 sheets. Multiple variants so the
// flutter loop can swap mid-row glyphs and the eye reads "tumbling
// in air".
const PAPERS_SHAPES: string[][] = [
  ["┌───┐", "│─ ─│", "│ ──│", "└───┘"],
  ["╭───╮", "│ ◦ │", "│── │", "╰───╯"],
  ["┌───┐", "│── │", "│ ──│", "└───┘"],
  ["╭───╮", "│  ─│", "│─ ─│", "╰───╯"],
];

// Typewriter base art. The paper-area rows (rows 1-5 below) carry
// `_______` placeholders that the renderer replaces every frame with
// the currently-typed message, a fully-blank sheet (idle), or empty
// space (no sheet — just after ejection). Each row is exactly 36
// chars wide so columns line up.
const TYPEWRITER_BASE: string[] = [
  "     ╭────────────────────────╮     ",
  "     │________________________│     ",
  "     │________________________│     ",
  "     │________________________│     ",
  "     │________________________│     ",
  "     │________________________│     ",
  "  ┌──┴────────────────────────┴──┐  ",
  "  │ ████████████████████████████ │  ",
  "  │ ┌──────────────────────────┐ │  ",
  "  │ │ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣  │ │  ",
  "  │ │ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣  │ │  ",
  "  │ │ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣  │ │  ",
  "  │ │   ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔   │ │  ",
  "  │ └──────────────────────────┘ │  ",
  "  └──────────────────────────────┘  ",
];

// Where the typed-chars overlay lands inside TYPEWRITER_BASE. The
// paper-area is now 24 chars wide × 5 rows tall — wide enough for a
// real-looking document with multiple lines of meaningful content.
const PAPER_AREA_X = 6;
const PAPER_AREA_Y = 1;
const PAPER_AREA_W = 24;
const PAPER_AREA_H = 5;

// Short agent-log snippets the typewriter cycles through. Each
// message is up-to-five ≤24-char rows; total chars per message ×
// effective CPS determine typing duration along with TYPING_MS.
const TYPED_LINES: string[][] = [
  [
    "[ researcher · 03:14:22 ]",
    "claim: anti-Ki67 marks",
    "  proliferation activity",
    "src: Sigma SAB4500153",
    "  -> citation OK",
  ],
  [
    "[ skeptic · 03:14:31 ]",
    "missing sham control arm",
    "  power 0.78 < 0.8",
    "  rule LR-12 applied",
    "  -> n=8 → n=12",
  ],
  [
    "[ operator · 03:14:42 ]",
    "PBS pH 7.4 1mL × n=12",
    "  catalog Thermo 10010",
    "  unit $14.20 / 500mL",
    "  -> total $2,840",
  ],
  [
    "[ compliance · 03:14:55 ]",
    "IACUC #4421 active",
    "  biosafety BSL-2 OK",
    "  ethics gate green",
    "  -> proceed",
  ],
  [
    "[ researcher · 03:15:09 ]",
    "PubMed 29435693",
    "  Nature Cell Bio 2018",
    "  doi 10.1038/s41556-",
    "  -> linked, OK",
  ],
  [
    "[ operator · 03:15:21 ]",
    "primary ab dilution",
    "  1:200 in PBS-T",
    "  Thermo PA5-19884",
    "  -> reagent OK",
  ],
];

const COLS = 80;
const ROWS = 52;
const PAPER_W = 5;
const PAPER_H = 4;
// Lifecycle pool — papers that cycle through the typewriter (queued
// → typing → ejecting → fly-drift right → recycle to queued). Small
// pool so the typewriter cycle stays tight visually.
const N_LIFECYCLE = 6;
// Rain pool — papers that just fall top→bottom across the full
// canvas. These never touch the typewriter; off-screen → respawn at
// top. They're the dominant ambient texture.
const N_RAIN = 22;
const FRAME_GATE_MS = 38; // ~26 fps

// Typewriter is anchored bottom-left in the canvas grid.
const TYPE_X = 0;
const TYPE_Y = ROWS - TYPEWRITER_BASE.length;

// Phase durations. Typing is intentionally fast (~60 cps over a
// ~95-char message) so the typewriter visibly chews through pages
// instead of one slow page every five seconds. The gap between two
// pages is short — enough to show the carriage emptying between
// pages but not so long that the cadence feels languid.
const TYPING_MS = 1700;
const TYPING_GAP_MS = 160;

// Ejecting + fold sequence. After typing finishes, the just-typed
// big page rises out of the carriage with strong upward velocity;
// during the rise it visibly folds in two steps (full → folded →
// small flying sheet) before handing off to leaf-drift physics.
const EJECT_MS = 720;          // total ejecting-phase duration
const EJECT_FOLD1_AT = 360;    // big page collapses to a folded card
const EJECT_FOLD2_AT = 500;    // folded card collapses to small sheet
const EJECT_VY = -1.0;         // strong upward initial velocity
const EJECT_GRAVITY = 0.058;   // decelerates so most of the fold
                               // completes near the apex of the rise

// Phase-3 (post-eject leaf drift) physics. Used by the lifecycle pool
// once a paper finishes ejecting from the typewriter. Strong rightward
// wind, gentle gravity — paper traverses left→right while slowly
// settling, then exits and recycles back to "queued" for the next
// type cycle.
const LEAF_GRAVITY = 0.011;
const LEAF_VX_DRAG = 0.992;
const LEAF_VY_DRAG = 0.945;
const LEAF_WIND_FREQ = 0.0006;
const LEAF_WIND_AMP = 0.14;
const LEAF_BASE_WIND = 0.0028; // gentle rightward drift, equilibrium ~0.35
const LEAF_WOBBLE_FREQ = 0.0024;
const LEAF_WOBBLE_AMP = 0.18;
const LEAF_GUST_PROB = 0.013;
const LEAF_GUST_KICK = 0.18;

// Rain physics — top→bottom fall with lateral wobble. No base wind
// (papers fall straight, with sin-wobble for the leaf-feel). Stronger
// gravity than leaf-drift so the rain reads as falling, not floating.
const RAIN_GRAVITY = 0.022;
const RAIN_VX_DRAG = 0.965;
const RAIN_VY_DRAG = 0.985;
const RAIN_WOBBLE_FREQ = 0.0019;
const RAIN_WOBBLE_AMP = 0.22;
const RAIN_WIND_FREQ = 0.00045;
const RAIN_WIND_AMP = 0.10;
const RAIN_GUST_PROB = 0.008;
const RAIN_GUST_KICK = 0.12;

type Phase = "queued" | "typing" | "ejecting" | "drifting";
type Mode = "fly" | "rain";

// "Folded card" frame — the intermediate render between the big
// typed page and the small flying sheet. Texture suggests a creased
// half-fold, with a horizontal fold-line and a softer body. 12×4.
const MEDIUM_PAPER: string[] = [
  "╭──────────╮",
  "│ ░░ ▒▒ ░░ │",
  "│┄┄┄┄┄┄┄┄┄┄│",
  "╰──────────╯",
];
const MEDIUM_W = MEDIUM_PAPER[0].length;
const MEDIUM_H = MEDIUM_PAPER.length;
const BIG_W = PAPER_AREA_W + 2; // +2 for left/right borders
const BIG_H = PAPER_AREA_H + 2; // +2 for top/bottom borders

type Paper = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  shape: number;
  flutter: number;
  phase: Phase;
  phaseStart: number; // ms timestamp
  emerge: number; // 0..1 — typing progress (drives row reveal AND y rise)
  textIdx: number; // which TYPED_LINES message
  wobblePhase: number; // per-paper wobble offset
  mode: Mode; // fly = lifecycle/typewriter; rain = ambient top→bottom
};

// Where the small flying-paper appears just after ejection — at the
// top of the typewriter's paper outlet, horizontally centered on the
// new wider paper-area (PAPER_AREA_X..+PAPER_AREA_W).
const EJECT_X = TYPE_X + PAPER_AREA_X + Math.floor((PAPER_AREA_W - PAPER_W) / 2);

function spawnQueued(p: Paper) {
  p.x = EJECT_X;
  p.y = ROWS + 100; // off-screen sleep
  p.vx = 0;
  p.vy = 0;
  p.shape = Math.floor(Math.random() * PAPERS_SHAPES.length);
  p.flutter = Math.random() * 1000;
  p.phase = "queued";
  p.phaseStart = 0;
  p.emerge = 0;
  p.textIdx = 0;
  p.wobblePhase = Math.random() * Math.PI * 2;
  p.mode = "fly";
}

// Re-seed a rain paper at the top of the canvas. Random x across the
// full width (with some bleed past the edges so papers slide in
// naturally rather than popping at the visible margin), random
// downward initial velocity, fresh shape + wobble.
function spawnRainTop(p: Paper) {
  p.x = -PAPER_W + Math.random() * (COLS + PAPER_W * 2);
  p.y = -3 - Math.random() * 8;
  p.vx = (Math.random() - 0.5) * 0.18;
  p.vy = 0.10 + Math.random() * 0.22;
  p.shape = Math.floor(Math.random() * PAPERS_SHAPES.length);
  p.flutter = Math.random() * 1000;
  p.phase = "drifting";
  p.phaseStart = performance.now();
  p.emerge = 0;
  p.textIdx = 0;
  p.wobblePhase = Math.random() * Math.PI * 2;
  p.mode = "rain";
}

function startTyping(p: Paper, now: number, textIdx: number) {
  p.phase = "typing";
  p.phaseStart = now;
  p.emerge = 0;
  p.textIdx = textIdx;
}

/**
 * Transition from typing to ejecting. The big-paper renderer uses
 * `p.x`/`p.y` as the LEFT-TOP of the 26×7 paper bounding box (the
 * border + 5 content rows). When ejecting hands off to drifting we
 * shift `p.x`/`p.y` so leaf physics treats the same coordinate as
 * the small flying paper's left-top instead.
 */
function startEjecting(p: Paper, now: number) {
  p.phase = "ejecting";
  p.phaseStart = now;
  p.x = TYPE_X + PAPER_AREA_X - 1; // -1 so the big paper's ╭ border
                                   // aligns with the column 1 left of
                                   // the typewriter's underscore run
  p.y = TYPE_Y + PAPER_AREA_Y - 1; // -1 so the big paper's top border
                                   // sits 1 row above the typewriter's
                                   // paper-area top — the page reads
                                   // as "lifting off the carriage"
  p.vx = (Math.random() - 0.5) * 0.4;
  p.vy = EJECT_VY;
}

type Props = { className?: string };

export function PapersRain({ className }: Props) {
  const dynamicRef = useRef<HTMLPreElement | null>(null);
  const typewriterRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    const dynamicPre = dynamicRef.current;
    const typewriterPre = typewriterRef.current;
    if (!dynamicPre || !typewriterPre) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Pad so the typewriter pre's grid aligns with the dynamic-paper
    // pre's grid (both bottom-left, same font-size).
    const padTop = "\n".repeat(TYPE_Y);
    const UNDERSCORE_RUN = "_".repeat(PAPER_AREA_W);

    /**
     * Render the typewriter with `typedChars` characters of `message`
     * already typed. Untyped portions of the paper area read as soft
     * dots/blanks. When `message` is null, the paper area renders as a
     * fully-blank sheet (paper still in carriage but no active typing
     * — used as a quick frame between ejection and the next page).
     * When `noPaper` is true, the paper area is wholly empty (no sheet
     * in the carriage — just after ejection).
     */
    const buildTypewriter = (
      typedChars: number,
      message: string[] | null,
      noPaper: boolean,
    ) => {
      const rows: string[] = [];
      for (let r = 0; r < TYPEWRITER_BASE.length; r++) {
        let row = TYPEWRITER_BASE[r];
        if (r >= PAPER_AREA_Y && r < PAPER_AREA_Y + PAPER_AREA_H) {
          if (noPaper) {
            // Replace _______ AND the surrounding │ with blanks so the
            // paper "is gone".
            row = TYPEWRITER_BASE[r]
              .replace(UNDERSCORE_RUN, " ".repeat(PAPER_AREA_W))
              .replace(/│/g, " ");
          } else if (message) {
            // Compute how many chars of THIS row are typed.
            const lineIdx = r - PAPER_AREA_Y;
            const fullLine = message[lineIdx] ?? "";
            let charsBefore = 0;
            for (let i = 0; i < lineIdx; i++)
              charsBefore += (message[i] ?? "").length;
            const charsForThisLine = Math.max(
              0,
              Math.min(fullLine.length, typedChars - charsBefore),
            );
            const visible = fullLine.slice(0, charsForThisLine);
            // Pad to PAPER_AREA_W with a faint dot/space pattern
            // suggesting the rest of the paper is still blank.
            const padded =
              visible +
              (charsForThisLine < fullLine.length ? "▏" : "") +
              " ".repeat(Math.max(0, PAPER_AREA_W - visible.length - 1));
            row = row.replace(UNDERSCORE_RUN, padded.slice(0, PAPER_AREA_W));
          } else {
            // Blank paper between typings — just soft dots.
            row = row.replace(UNDERSCORE_RUN, " ".repeat(PAPER_AREA_W));
          }
        }
        rows.push(row);
      }
      return padTop + rows.join("\n");
    };

    // Two pools, kept in one array for unified rendering.
    //   indices 0..N_LIFECYCLE-1   → typewriter lifecycle (mode='fly')
    //   indices N_LIFECYCLE..end   → ambient rain (mode='rain')
    const papers: Paper[] = Array.from(
      { length: N_LIFECYCLE + N_RAIN },
      () => {
        const p = {} as Paper;
        spawnQueued(p);
        return p;
      },
    );

    // Typewriter slot state.
    let typingPaper: Paper | null = null;
    let typingTextIdx = 0;
    let lastTypingFinishedAt = 0;

    // Pre-flight: lifecycle pool seeds a couple of mid-air fly papers
    // so the typewriter side doesn't open empty. Rain pool fills the
    // canvas with falling papers distributed top-to-bottom.
    const now0 = performance.now();
    const lifecycleSeed = Math.min(3, N_LIFECYCLE - 1);
    for (let i = 0; i < lifecycleSeed; i++) {
      const p = papers[i];
      p.phase = "drifting";
      p.mode = "fly";
      p.phaseStart = now0;
      // Bias positions toward the LEFT third — papers drift rightward,
      // so seeding from the left gives them maximum flight time before
      // they exit the right edge.
      p.x = 4 + Math.random() * (COLS * 0.4);
      p.y = -2 + Math.random() * (TYPE_Y - 6);
      p.vx = 0.18 + Math.random() * 0.28;
      p.vy = -0.04 + Math.random() * 0.22;
      p.shape = Math.floor(Math.random() * PAPERS_SHAPES.length);
      p.flutter = Math.random() * 1000;
      p.wobblePhase = Math.random() * Math.PI * 2;
    }
    // Rain pool: distribute across full canvas height + width so the
    // hero opens with rain in motion already, not blank-then-fill.
    for (let i = 0; i < N_RAIN; i++) {
      const p = papers[N_LIFECYCLE + i];
      p.phase = "drifting";
      p.mode = "rain";
      p.phaseStart = now0;
      p.x = -PAPER_W + Math.random() * (COLS + PAPER_W * 2);
      p.y = -4 + Math.random() * (ROWS + 4);
      p.vx = (Math.random() - 0.5) * 0.18;
      p.vy = 0.10 + Math.random() * 0.22;
      p.shape = Math.floor(Math.random() * PAPERS_SHAPES.length);
      p.flutter = Math.random() * 1000;
      p.wobblePhase = Math.random() * Math.PI * 2;
    }

    // Dynamic-papers grid.
    const grid: string[] = new Array(COLS * ROWS).fill(" ");

    const stamp = (paper: Paper) => {
      const ix = Math.floor(paper.x);
      const iy = Math.floor(paper.y);
      const variant =
        (paper.shape + Math.floor(paper.flutter / 12)) % PAPERS_SHAPES.length;
      const flutterShape = PAPERS_SHAPES[variant];
      const shape = PAPERS_SHAPES[paper.shape];
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

    // Generic stamper for arbitrary-shape ASCII rectangles. Used for
    // the big and medium "fold" frames during the eject phase. Spaces
    // in the source rows are skipped (treated as transparent) so the
    // shape's silhouette doesn't paint over neighbors.
    const stampShape = (rows: string[], ix: number, iy: number) => {
      for (let dy = 0; dy < rows.length; dy++) {
        const row = rows[dy];
        const py = iy + dy;
        if (py < 0 || py >= ROWS) continue;
        for (let dx = 0; dx < row.length; dx++) {
          const px = ix + dx;
          if (px < 0 || px >= COLS) continue;
          const ch = row[dx];
          if (ch === " ") continue;
          grid[py * COLS + px] = ch;
        }
      }
    };

    // Build the big-paper frame for a given typed message. Border +
    // five content rows = BIG_H rows tall, BIG_W wide. The content
    // is the FULL typed message (the paper reads as "freshly typed,
    // about to fly out").
    const buildBigPaper = (textIdx: number): string[] => {
      const message = TYPED_LINES[textIdx];
      const inner = BIG_W - 2;
      const out: string[] = [];
      out.push("╭" + "─".repeat(inner) + "╮");
      for (let i = 0; i < PAPER_AREA_H; i++) {
        const line = (message[i] ?? "").slice(0, inner);
        out.push("│" + line + " ".repeat(inner - line.length) + "│");
      }
      out.push("╰" + "─".repeat(inner) + "╯");
      return out;
    };

    const renderDynamic = (now: number) => {
      grid.fill(" ");
      for (const p of papers) {
        if (p.phase === "queued" || p.phase === "typing") continue;
        if (p.phase === "ejecting") {
          // Three-stage fold during ejecting: full typed page →
          // creased fold-card → small flying sheet. p.x/p.y track
          // the BIG paper's left-top throughout; medium and small
          // frames offset to stay centered within that footprint.
          const elapsed = now - p.phaseStart;
          const ix = Math.floor(p.x);
          const iy = Math.floor(p.y);
          if (elapsed < EJECT_FOLD1_AT) {
            stampShape(buildBigPaper(p.textIdx), ix, iy);
          } else if (elapsed < EJECT_FOLD2_AT) {
            const dx = Math.floor((BIG_W - MEDIUM_W) / 2);
            const dy = Math.floor((BIG_H - MEDIUM_H) / 2);
            stampShape(MEDIUM_PAPER, ix + dx, iy + dy);
          } else {
            const dx = Math.floor((BIG_W - PAPER_W) / 2);
            const dy = Math.floor((BIG_H - PAPER_H) / 2);
            stamp({ ...p, x: p.x + dx, y: p.y + dy });
          }
        } else {
          stamp(p);
        }
      }
      let out = "";
      for (let y = 0; y < ROWS; y++) {
        out += grid.slice(y * COLS, (y + 1) * COLS).join("") + "\n";
      }
      dynamicPre.textContent = out;
    };

    if (reduced) {
      // Static frame — no animation. Render typewriter empty + the
      // pre-seeded drifting papers at their initial positions.
      typewriterPre.textContent = buildTypewriter(0, null, false);
      renderDynamic(performance.now());
      return;
    }

    let raf = 0;
    let stopped = false;
    let last = 0;

    // Only the lifecycle pool feeds the typewriter — rain papers are
    // never queued. This keeps the typewriter rhythm independent of
    // however many rain papers are airborne.
    const findQueuedPaper = () => {
      for (let i = 0; i < N_LIFECYCLE; i++) {
        if (papers[i].phase === "queued") return papers[i];
      }
      return null;
    };

    const tick = (now: number) => {
      // ── Typewriter slot ──
      if (!typingPaper) {
        if (now - lastTypingFinishedAt >= TYPING_GAP_MS) {
          const p = findQueuedPaper();
          if (p) {
            typingTextIdx = (typingTextIdx + 1) % TYPED_LINES.length;
            startTyping(p, now, typingTextIdx);
            typingPaper = p;
          }
        }
      } else {
        const elapsed = now - typingPaper.phaseStart;
        if (elapsed >= TYPING_MS) {
          startEjecting(typingPaper, now);
          lastTypingFinishedAt = now;
          typingPaper = null;
        } else {
          typingPaper.emerge = Math.min(1, elapsed / TYPING_MS);
        }
      }

      // ── Per-paper physics ──
      const wind = Math.sin(now * LEAF_WIND_FREQ) * LEAF_WIND_AMP;
      const rainWind = Math.sin(now * RAIN_WIND_FREQ) * RAIN_WIND_AMP;
      for (const p of papers) {
        if (p.phase === "queued" || p.phase === "typing") continue;
        p.flutter += 1;
        if (p.phase === "ejecting") {
          p.vy += EJECT_GRAVITY;
          p.vx *= 0.99;
          p.x += p.vx;
          p.y += p.vy;
          if (now - p.phaseStart >= EJECT_MS) {
            // Hand off to leaf drift. Re-anchor p.x/p.y so they track
            // the small flying paper's left-top — the renderer was
            // offsetting from the big-paper origin during eject; once
            // we leave the eject phase, p.x/p.y need to be the small
            // paper's coords directly so leaf physics + off-screen
            // checks line up.
            p.x += Math.floor((BIG_W - PAPER_W) / 2);
            p.y += Math.floor((BIG_H - PAPER_H) / 2);
            p.phase = "drifting";
            p.phaseStart = now;
          }
        } else if (p.phase === "drifting") {
          if (p.mode === "fly") {
            const wobble =
              Math.sin(now * LEAF_WOBBLE_FREQ + p.wobblePhase) * LEAF_WOBBLE_AMP;
            p.vx += LEAF_BASE_WIND + (wind + wobble) * 0.04;
            if (Math.random() < LEAF_GUST_PROB)
              p.vx += (Math.random() - 0.3) * LEAF_GUST_KICK;
            p.vy += LEAF_GRAVITY;
            p.vx *= LEAF_VX_DRAG;
            p.vy *= LEAF_VY_DRAG;
            p.x += p.vx;
            p.y += p.vy;
            // Off-screen → recycle back into the typewriter queue.
            if (p.x > COLS + 6 || p.x < -PAPER_W - 4 || p.y > ROWS + 6) {
              spawnQueued(p);
            }
          } else {
            // Rain mode — top-down fall with lateral wobble. No base
            // wind; gravity is the dominant force, wobble + gusts
            // give the leaf-feel without ever pushing the paper off
            // the side faster than it falls.
            const wobble =
              Math.sin(now * RAIN_WOBBLE_FREQ + p.wobblePhase) * RAIN_WOBBLE_AMP;
            p.vx += (rainWind + wobble) * 0.05;
            if (Math.random() < RAIN_GUST_PROB)
              p.vx += (Math.random() - 0.5) * RAIN_GUST_KICK;
            p.vy += RAIN_GRAVITY;
            p.vx *= RAIN_VX_DRAG;
            p.vy *= RAIN_VY_DRAG;
            p.x += p.vx;
            p.y += p.vy;
            // Off-screen → respawn at the top edge.
            if (p.y > ROWS + 4 || p.x > COLS + 8 || p.x < -PAPER_W - 8) {
              spawnRainTop(p);
            }
          }
        }
      }

      // ── Render ──
      if (typingPaper) {
        const message = TYPED_LINES[typingTextIdx];
        const totalChars = message.reduce((s, l) => s + l.length, 0);
        // Slight ease-in on typing progress so the first few chars
        // appear briskly, then it settles to a steady cadence.
        const e = typingPaper.emerge;
        const eased = e < 0.15 ? e * 2.5 : 0.375 + (e - 0.15) * 0.735;
        const typed = Math.floor(totalChars * Math.min(1, eased));
        typewriterPre.textContent = buildTypewriter(typed, message, false);
      } else {
        // Brief no-paper state right after ejection so the carriage
        // visibly empties before the next page slides in.
        const sinceEject = now - lastTypingFinishedAt;
        if (sinceEject < TYPING_GAP_MS * 0.6) {
          typewriterPre.textContent = buildTypewriter(0, null, true);
        } else {
          typewriterPre.textContent = buildTypewriter(0, null, false);
        }
      }
      renderDynamic(now);
    };

    const loop = (now: number) => {
      if (stopped) return;
      if (document.visibilityState !== "hidden" && now - last > FRAME_GATE_MS) {
        tick(now);
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
      <pre ref={dynamicRef} className="l-papers-out" />
    </div>
  );
}
