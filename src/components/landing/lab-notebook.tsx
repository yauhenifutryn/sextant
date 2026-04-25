"use client";

import { useEffect, useState } from "react";

/**
 * Lab Notebook — animated typewriter that drafts a research plan, page by
 * page. Three hypotheses cycle through. Each hypothesis types in line by
 * line: title, sections, citations, materials with prices, validation
 * checks, then a "PLAN READY" stamp. Holds briefly, fades out, next page
 * fades in. Loops forever.
 *
 * The visual is deliberately concrete — a paper page with handwritten-feel
 * structure — so it reads as "this product writes lab plans" not as
 * abstract texture. The typewriter cursor + the ✓ marks ticking green +
 * the page-flip transition tell the product story without copy.
 *
 * Inspirations:
 *  - Ascii-Motion (CameronFoxly): borrowed the per-frame stepping pattern.
 *    We don't need its full keyframe interpolation engine since our
 *    "frames" are line-based reveal stages, but the same cell-stepping
 *    discipline applies.
 *  - chenglou/pretext: cited as a stylistic ancestor — every line in the
 *    notebook is monospace + structured + fixed-width, exactly the niche
 *    pretext occupies.
 *
 * Accessibility:
 *  - Wrapper is `aria-hidden`; the notebook is a decorative animation, not
 *    real content. (The hero copy already states the same value prop in
 *    text the screen reader will announce.)
 *  - `prefers-reduced-motion: reduce` -> renders the FIRST hypothesis fully
 *    drafted with no typewriter, no cycling, no fade.
 */

const TYPE_MS = 26;
const HOLD_MS = 2400;
const FADE_MS = 700;

type LineKind = "title" | "rule" | "spacer" | "heading" | "body" | "cite" | "check" | "stamp";
type Line = { kind: LineKind; text: string };

const HYPOTHESES: Line[][] = [
  [
    { kind: "title", text: "HYPOTHESIS · Lab Notebook · pg 12" },
    { kind: "rule", text: "" },
    { kind: "spacer", text: "" },
    { kind: "heading", text: "◊ Cas13d in CD8+ T-cells" },
    { kind: "body", text: "  Survey · Nature 624, 581" },
    { kind: "cite", text: "  [Smith24] [Lee23] +12 papers" },
    { kind: "check", text: "  ✓ novelty: angle confirmed" },
    { kind: "spacer", text: "" },
    { kind: "heading", text: "◊ Materials" },
    { kind: "body", text: "  Addgene #4521 · AAV9 · $214" },
    { kind: "body", text: "  Addgene #109053 · Cas13d · $186" },
    { kind: "check", text: "  ✓ all reagents linked" },
    { kind: "spacer", text: "" },
    { kind: "heading", text: "◊ Validation" },
    { kind: "check", text: "  ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓   8/8 pass" },
    { kind: "spacer", text: "" },
    { kind: "stamp", text: "[ PLAN READY · 3m 18s ]" },
  ],
  [
    { kind: "title", text: "HYPOTHESIS · Lab Notebook · pg 13" },
    { kind: "rule", text: "" },
    { kind: "spacer", text: "" },
    { kind: "heading", text: "◊ mTOR inhibition · liver" },
    { kind: "body", text: "  Survey · Cell 187, 3421" },
    { kind: "cite", text: "  [Park24] [Kim23] +8 papers" },
    { kind: "check", text: "  ✓ novelty: angle confirmed" },
    { kind: "spacer", text: "" },
    { kind: "heading", text: "◊ Materials" },
    { kind: "body", text: "  Sigma S1039 · rapamycin · $186" },
    { kind: "body", text: "  Mouse 10wk WT · $42 / unit" },
    { kind: "check", text: "  ✓ all reagents linked" },
    { kind: "spacer", text: "" },
    { kind: "heading", text: "◊ Validation" },
    { kind: "check", text: "  ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓   8/8 pass" },
    { kind: "spacer", text: "" },
    { kind: "stamp", text: "[ PLAN READY · 2m 54s ]" },
  ],
  [
    { kind: "title", text: "HYPOTHESIS · Lab Notebook · pg 14" },
    { kind: "rule", text: "" },
    { kind: "spacer", text: "" },
    { kind: "heading", text: "◊ AAV9 retro-orbital dose" },
    { kind: "body", text: "  Survey · Mol Ther 32, 1098" },
    { kind: "cite", text: "  [Vela24] [Fox22] +6 papers" },
    { kind: "check", text: "  ✓ novelty: angle confirmed" },
    { kind: "spacer", text: "" },
    { kind: "heading", text: "◊ Materials" },
    { kind: "body", text: "  Addgene #105540 · AAV9 · $214" },
    { kind: "body", text: "  Sterile saline · $19" },
    { kind: "check", text: "  ✓ all reagents linked" },
    { kind: "spacer", text: "" },
    { kind: "heading", text: "◊ Validation" },
    { kind: "check", text: "  ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓   8/8 pass" },
    { kind: "spacer", text: "" },
    { kind: "stamp", text: "[ PLAN READY · 3m 02s ]" },
  ],
];

type Phase = "type" | "hold" | "fade";

export function LabNotebook() {
  const [hyp, setHyp] = useState(0);
  const [step, setStep] = useState(0);
  const [chars, setChars] = useState(0);
  const [phase, setPhase] = useState<Phase>("type");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const lines = HYPOTHESES[0];
      setStep(lines.length - 1);
      setChars(lines[lines.length - 1].text.length);
      // freeze in fully-drafted state, no cycling
      return;
    }

    if (phase === "type") {
      const lines = HYPOTHESES[hyp];
      const line = lines[step];
      const t = window.setTimeout(() => {
        if (chars < line.text.length) {
          setChars((c) => c + 1);
        } else if (step < lines.length - 1) {
          setStep((s) => s + 1);
          setChars(0);
        } else {
          setPhase("hold");
        }
      }, TYPE_MS);
      return () => window.clearTimeout(t);
    }

    if (phase === "hold") {
      const t = window.setTimeout(() => setPhase("fade"), HOLD_MS);
      return () => window.clearTimeout(t);
    }

    if (phase === "fade") {
      const t = window.setTimeout(() => {
        setHyp((h) => (h + 1) % HYPOTHESES.length);
        setStep(0);
        setChars(0);
        setPhase("type");
      }, FADE_MS);
      return () => window.clearTimeout(t);
    }
  }, [phase, hyp, step, chars]);

  const lines = HYPOTHESES[hyp];

  return (
    <div
      className={`l-notebook${phase === "fade" ? " is-fading" : ""}`}
      aria-hidden="true"
    >
      <div className="l-notebook-chrome">
        <span className="l-notebook-dot" />
        <span className="l-notebook-tab">Sextant · live</span>
        <span className="l-notebook-meta">page {12 + hyp}</span>
      </div>
      <div className="l-notebook-page">
        {lines.slice(0, step + 1).map((line, i) => {
          const isCurrent = i === step && phase === "type";
          const visibleText = isCurrent ? line.text.slice(0, chars) : line.text;
          if (line.kind === "rule") {
            return <div key={i} className="l-notebook-line kind-rule" />;
          }
          if (line.kind === "spacer") {
            return <div key={i} className="l-notebook-line kind-spacer">&nbsp;</div>;
          }
          return (
            <div key={i} className={`l-notebook-line kind-${line.kind}`}>
              {visibleText}
              {isCurrent && phase === "type" && <span className="l-notebook-cursor">▍</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
