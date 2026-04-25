"use client";

/**
 * Agent terminal feed — full-bleed hero backdrop.
 *
 * Three slow-scrolling columns of structured agent activity (Researcher /
 * Skeptic / Operator) sit behind the hero copy. Each line is one of:
 *   - scan / catalog / lead / price : default muted body text
 *   - cite                          : italicized citation reference
 *   - act                           : action arrow, ink-dark
 *   - stat / num                    : numeric / statistical fact
 *   - ok                            : forest-green confirmation with ✓
 *   - flag                          : clay warning, "flag:" prefix
 *
 * Loop strategy: duplicate the content list per column and animate the
 * stream from `translateY(0)` to `translateY(-50%)` linearly forever. When
 * the animation cycles, the visible viewport sits exactly where the
 * duplicate copy starts — pixel-identical with the start of the first copy,
 * so the reset is invisible. Pure CSS. No RAF, no IntersectionObserver, no
 * JS scroll listener — the browser pauses GPU work on offscreen layers
 * automatically.
 *
 * Each column gets a slightly different animation duration so the three
 * streams don't sync into a metronome. Compliance is folded into the
 * Skeptic + Operator streams (gate / IACUC lines) since 4 columns are too
 * cramped at narrow widths and Compliance is the lowest-volume agent
 * narratively.
 *
 * Responsive: desktop shows 3 columns; below 760px only the Researcher
 * column is shown so the feed doesn't compete with mobile hero copy.
 *
 * Accessibility:
 *   - Wrapper is `aria-hidden`; nothing meaningful is communicated by the
 *     decorative scrolling text.
 *   - `pointer-events: none` so it never traps focus or steals clicks.
 *   - `prefers-reduced-motion: reduce` -> animation paused (handled in CSS).
 */

type LineKind = "scan" | "cite" | "act" | "ok" | "flag" | "stat" | "num" | "catalog" | "lead" | "price";
type Line = { kind: LineKind; text: string };

const RESEARCHER: Line[] = [
  { kind: "scan", text: "surveying Nature 624 · 1.2k results" },
  { kind: "cite", text: "[Smith24] cas13 in t-cells" },
  { kind: "act", text: "▸ pull primary source" },
  { kind: "ok", text: "Cell 187, 3421 ✓" },
  { kind: "scan", text: "Mol Cell 84, 729: prior art" },
  { kind: "num", text: "12 papers anchored" },
  { kind: "cite", text: "[Pellet24] expression atlas" },
  { kind: "ok", text: "DOI 10.1038/s41586 ✓" },
  { kind: "scan", text: "fetching Semantic Scholar" },
  { kind: "act", text: "▸ rank by recency" },
  { kind: "cite", text: "[Lee23] crispr screens" },
  { kind: "scan", text: "Pubmed: PMID 38291847" },
  { kind: "ok", text: "novelty angle confirmed" },
  { kind: "num", text: "23 papers anchored" },
  { kind: "act", text: "▸ extract methods refs" },
  { kind: "cite", text: "Science 383, 1098 (2024)" },
  { kind: "scan", text: "checking arXiv preprints" },
  { kind: "ok", text: "fig 3a · panel ii ✓" },
  { kind: "num", text: "31 citations anchored" },
  { kind: "scan", text: "downloading bioRxiv 2024.04" },
  { kind: "ok", text: "researcher gate · pass ✓" },
];

const SKEPTIC: Line[] = [
  { kind: "flag", text: "flag: missing power analysis" },
  { kind: "act", text: "▸ require sham control arm" },
  { kind: "stat", text: "FDR α=0.05 · n=32→48" },
  { kind: "flag", text: "orphan step: aliquot vol?" },
  { kind: "act", text: "▸ insert vehicle control" },
  { kind: "stat", text: "Bonferroni-corrected α" },
  { kind: "ok", text: "design power 0.80 ✓" },
  { kind: "flag", text: "duplicate of [Lee23]?" },
  { kind: "act", text: "▸ surface novel angle" },
  { kind: "stat", text: "n=8 sham + n=8 dosed" },
  { kind: "ok", text: "controls validated ✓" },
  { kind: "flag", text: "missing IACUC reference" },
  { kind: "act", text: "▸ append biosafety LR-04" },
  { kind: "stat", text: "Mann-Whitney U test" },
  { kind: "ok", text: "stats plan locked ✓" },
  { kind: "flag", text: "DMSO 0.1% — confound?" },
  { kind: "act", text: "▸ propose alt vehicle" },
  { kind: "stat", text: "blinded scoring required" },
  { kind: "ok", text: "compliance gate · pass ✓" },
  { kind: "stat", text: "95% CI [0.42, 0.78]" },
  { kind: "ok", text: "skeptic gate · pass ✓" },
];

const OPERATOR: Line[] = [
  { kind: "catalog", text: "Addgene #105540 ▸ AAV9 $214" },
  { kind: "lead", text: "lead time 7d, in stock" },
  { kind: "price", text: "Tris-HCl 50mM · $38" },
  { kind: "act", text: "▸ source EU supplier" },
  { kind: "catalog", text: "Addgene #109053 ▸ Cas13d $186" },
  { kind: "lead", text: "ships dry ice · 48h" },
  { kind: "price", text: "RPMI-1640 500mL · $42" },
  { kind: "ok", text: "all reagents linked ✓" },
  { kind: "catalog", text: "Miltenyi CD8 kit $412" },
  { kind: "act", text: "▸ price 3 replicates" },
  { kind: "price", text: "subtotal · $4,219" },
  { kind: "lead", text: "Gantt: phase 2 → phase 3" },
  { kind: "ok", text: "budget within $5k cap ✓" },
  { kind: "catalog", text: "Sigma T8787 · $94" },
  { kind: "lead", text: "lab notebook · page 12" },
  { kind: "price", text: "consumables · $612" },
  { kind: "act", text: "▸ optimize shelf life" },
  { kind: "catalog", text: "Thermo 11668 · $128" },
  { kind: "ok", text: "operator gate · pass ✓" },
];

function AgentLine({ kind, text }: Line) {
  return <div className={`l-agent-line kind-${kind}`}>{text}</div>;
}

function AgentColumn({
  index,
  name,
  tag,
  dotClass,
  lines,
}: {
  index: 0 | 1 | 2;
  name: string;
  tag: string;
  dotClass: string;
  lines: Line[];
}) {
  return (
    <div className="l-agent-col" data-i={index}>
      <div className="l-agent-col-head">
        <span className={`l-agent-dot ${dotClass}`} />
        <span className="name">{name}</span>
        <span className="meta">{tag}</span>
      </div>
      <div className="l-agent-col-mask">
        <div className="l-agent-stream">
          {lines.map((l, i) => (
            <AgentLine key={`a-${i}`} {...l} />
          ))}
          {/* Duplicate copy — animation translates by -50%, landing on the
           * start of this duplicate. Reset is pixel-identical so the loop
           * is seamless. */}
          {lines.map((l, i) => (
            <AgentLine key={`b-${i}`} {...l} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AgentFeed() {
  return (
    <div className="l-agent-feed" aria-hidden="true">
      <AgentColumn
        index={0}
        name="Researcher"
        tag="01 · live"
        dotClass="researcher"
        lines={RESEARCHER}
      />
      <AgentColumn
        index={1}
        name="Skeptic"
        tag="02 · live"
        dotClass="skeptic"
        lines={SKEPTIC}
      />
      <AgentColumn
        index={2}
        name="Operator"
        tag="03 · live"
        dotClass="operator"
        lines={OPERATOR}
      />
    </div>
  );
}
