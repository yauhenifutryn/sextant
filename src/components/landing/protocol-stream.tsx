"use client";

import { useEffect, useRef } from "react";

/**
 * ProtocolStream — typed agent log as the hero backdrop.
 *
 * Replaces the live video → ASCII rendering. The video sampler produced
 * recognizable-but-noisy human shapes that read as artifact, not design.
 * This component is text-as-texture: a looping log of what the four
 * agents actually do (cite, challenge, source, gate), typed character by
 * character into a monospace column. ASCII as content instead of ASCII
 * as image.
 *
 * Visuals: forest-green monospace, low opacity, left-aligned column,
 * fades into paper on the right where the headline sits. Reduced motion
 * renders the full transcript instantly without typing.
 */

const LINES: string[] = [
  "$ sextant run --hypothesis brief.md",
  "",
  "[03:14:22] researcher  anchoring claim 'anti-Ki67 marks proliferation'",
  "                         -> Sigma-Aldrich SAB4500153            [cite]",
  "[03:14:25] researcher  citation chip attached    paper #41202   [ok]",
  "",
  "[03:14:31] skeptic     missing sham control on day 0",
  "                         -> propose vehicle-only PBS arm, n=8",
  "[03:14:33] skeptic     statistical power = 0.78 < 0.80         [flag]",
  "                         -> require n>=10 per group",
  "",
  "[03:14:38] operator    reagent ZK-101 lead time 11 days        [warn]",
  "                         -> alt UCB-ZK101 (3-day) catalog #7741",
  "[03:14:41] operator    timeline rebuilt    44 -> 31 days         [ok]",
  "",
  "[03:14:46] compliance  IACUC AUP-2024-0418                     [pass]",
  "[03:14:46] compliance  BSL-2 containment confirmed             [pass]",
  "",
  "[03:14:48] validation  6 / 6 checks green",
  "[03:14:48] PLAN_READY  draft.v3.md  (citations: 27, reagents: 14)",
];

// Total characters across all lines (for animation timing).
const FULL = LINES.join("\n");
const CPS = 90; // characters per second
const HOLD_MS = 2400; // pause when full transcript is rendered
const FADE_MS = 600; // fade-out before restart

type Props = { className?: string };

export function ProtocolStream({ className }: Props) {
  const preRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      pre.textContent = FULL;
      pre.style.opacity = "1";
      return;
    }

    let raf = 0;
    let stopped = false;
    let phaseStart = performance.now();
    let phase: "typing" | "hold" | "fading" = "typing";

    const tick = (now: number) => {
      if (stopped) return;
      const elapsed = now - phaseStart;
      if (phase === "typing") {
        const n = Math.min(FULL.length, Math.floor((elapsed / 1000) * CPS));
        pre.textContent = FULL.slice(0, n);
        // Append a blinking caret as last character.
        pre.dataset.caret = "1";
        if (n >= FULL.length) {
          phase = "hold";
          phaseStart = now;
        }
      } else if (phase === "hold") {
        if (elapsed > HOLD_MS) {
          phase = "fading";
          phaseStart = now;
        }
      } else if (phase === "fading") {
        const t = Math.min(1, elapsed / FADE_MS);
        pre.style.opacity = String(1 - t);
        if (t >= 1) {
          phase = "typing";
          phaseStart = now;
          pre.style.opacity = "1";
          pre.textContent = "";
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={`l-pstream ${className ?? ""}`} aria-hidden="true">
      <pre ref={preRef} className="l-pstream-out" />
    </div>
  );
}
