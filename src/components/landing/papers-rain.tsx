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

// Typewriter base art. The paper-area rows (rows 1-4 below) carry
// `_______` placeholders that the renderer replaces every frame with
// either:
//   - the currently-typed message (typing phase), or
//   - a single textured-blank line (no paper present), or
//   - empty spaces (paper has just ejected and is ascending)
// Each row is exactly 34 chars wide so columns line up.
const TYPEWRITER_BASE: string[] = [
  "         ╭─────────────────╮     ",
  "         │_________________│     ",
  "         │_________________│     ",
  "         │_________________│     ",
  "         │_________________│     ",
  "    ┌────┴─────────────────┴────┐",
  "    │ ████████████████████████ │ ",
  "    │ ┌──────────────────────┐ │ ",
  "    │ │ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ │ │ ",
  "    │ │ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ │ │ ",
  "    │ │ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ ▣ │ │ ",
  "    │ │   ▔▔▔▔▔▔▔▔▔▔▔▔▔▔   │ │ ",
  "    │ └──────────────────────┘ │ ",
  "    └──────────────────────────┘ ",
];

// Where the typed-chars overlay lands inside TYPEWRITER_BASE.
const PAPER_AREA_X = 10; // column where the `___` block starts
const PAPER_AREA_Y = 1; // first underscore row (0-indexed)
const PAPER_AREA_W = 17; // width of the `___` block
const PAPER_AREA_H = 4; // four rows of paper content

// Short scientific snippets the typewriter cycles through. Each
// message is an array of up-to-four ≤17-char rows. Total chars per
// message determine typing duration along with TYPE_CPS.
const TYPED_LINES: string[][] = [
  ["[ researcher ]", "Sigma SAB4500153", "  -> citation OK"],
  ["[ operator ]", "n=8 dose + sham", "  -> budget OK"],
  ["[ skeptic ]", "power 0.78 < 0.8", "  -> n→12 needed"],
  ["[ compliance ]", "IACUC #4421 BSL2", "  -> gate green"],
  ["[ researcher ]", "PubMed 29435693", "  -> linked OK"],
  ["[ operator ]", "PBS pH 7.4 1mL", "  -> price $14"],
  ["[ skeptic ]", "missing sham arm", "  -> rule LR-12"],
];

const COLS = 80;
const ROWS = 50;
const PAPER_W = 5;
const PAPER_H = 4;
const N_PAPERS = 22;
const FRAME_GATE_MS = 38; // ~26 fps

// Typewriter is anchored bottom-left in the canvas grid.
const TYPE_X = 0;
const TYPE_Y = ROWS - TYPEWRITER_BASE.length;

// Phase durations.
const TYPING_MS = 2200;
const ASCEND_MS = 950;
const TYPING_GAP_MS = 280; // small pause between consecutive pages

// Phase-2 (ascending) physics — quick lift out of the typewriter,
// only a few cells of vertical travel before gravity flips and the
// paper hands off to leaf-drift mode.
const ASCEND_VY = -0.85;
const ASCEND_GRAVITY = 0.062;

// Phase-3 (leaf drift) physics. The dominant force is rightward wind
// (slow, oscillating, with per-paper wobble + occasional gusts). Both
// drags are heavy so velocities stay bounded — without that, the
// constant +base-wind acceleration each frame would compound into a
// sheet flying across the canvas in under a second.
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

type Phase = "queued" | "typing" | "ascending" | "drifting";

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
};

// Where the small flying-paper appears just after ejection — just
// above the typewriter's paper outlet.
const EJECT_X = TYPE_X + 11;
const EJECT_Y = TYPE_Y - 3;

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
}

function startTyping(p: Paper, now: number, textIdx: number) {
  p.phase = "typing";
  p.phaseStart = now;
  p.emerge = 0;
  p.textIdx = textIdx;
}

function startAscending(p: Paper, now: number) {
  p.phase = "ascending";
  p.phaseStart = now;
  // Position the small flying paper at the carriage outlet.
  p.x = EJECT_X + (Math.random() - 0.5) * 0.5;
  p.y = EJECT_Y;
  p.vx = (Math.random() - 0.5) * 0.35;
  p.vy = ASCEND_VY;
}

function startDrifting(p: Paper, now: number) {
  p.phase = "drifting";
  p.phaseStart = now;
  // Hand-off velocity from ascend already in place; no reset.
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

    const papers: Paper[] = Array.from({ length: N_PAPERS }, () => {
      const p = {} as Paper;
      spawnQueued(p);
      return p;
    });

    // Typewriter slot state.
    let typingPaper: Paper | null = null;
    let typingTextIdx = 0;
    let lastTypingFinishedAt = 0;

    // Pre-flight: pre-populate the canvas with several papers already
    // mid-flight so the hero doesn't open empty. Roughly 60% of papers
    // are seeded into the drifting phase across the canvas.
    const now0 = performance.now();
    const seeded = Math.floor(N_PAPERS * 0.7);
    for (let i = 0; i < seeded; i++) {
      const p = papers[i];
      p.phase = "drifting";
      p.phaseStart = now0;
      // Bias positions toward the LEFT third of the canvas — papers
      // drift rightward, so seeding from the left gives them maximum
      // flight time before they exit the right edge.
      p.x = 4 + Math.random() * (COLS * 0.5);
      p.y = -2 + Math.random() * (TYPE_Y - 4);
      // Equilibrium drift velocity is ~0.35 cells/frame; seed near
      // that so papers don't all decelerate visibly on first paint.
      p.vx = 0.18 + Math.random() * 0.28;
      p.vy = -0.04 + Math.random() * 0.22;
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

    const renderDynamic = () => {
      grid.fill(" ");
      for (const p of papers) {
        if (p.phase === "queued" || p.phase === "typing") continue;
        stamp(p);
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
      renderDynamic();
      return;
    }

    let raf = 0;
    let stopped = false;
    let last = 0;

    const findQueuedPaper = () => papers.find((p) => p.phase === "queued");

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
          startAscending(typingPaper, now);
          lastTypingFinishedAt = now;
          typingPaper = null;
        } else {
          typingPaper.emerge = Math.min(1, elapsed / TYPING_MS);
        }
      }

      // ── Per-paper physics ──
      const wind = Math.sin(now * LEAF_WIND_FREQ) * LEAF_WIND_AMP;
      for (const p of papers) {
        if (p.phase === "queued" || p.phase === "typing") continue;
        p.flutter += 1;
        if (p.phase === "ascending") {
          p.vy += ASCEND_GRAVITY;
          p.vx *= 0.99;
          p.x += p.vx;
          p.y += p.vy;
          // Switch to leaf-drifting once vy turns positive (apex
          // passed) or the ascend window expires.
          if (p.vy >= 0 || now - p.phaseStart >= ASCEND_MS) {
            startDrifting(p, now);
          }
        } else if (p.phase === "drifting") {
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
          // Off-screen → recycle back into the queue.
          if (p.x > COLS + 6 || p.x < -PAPER_W - 4 || p.y > ROWS + 6) {
            spawnQueued(p);
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
      renderDynamic();
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
