import { SextantLoader } from "@/components/sextant-loader";

/**
 * Trace + Tests rail (D-18, skeleton).
 *
 * Phase 1 placeholder shell: header + Sextant agent loader (4-bar flowing)
 * + a faint validation skeleton. Phase 6 wires the real per-agent rows
 * (Researcher / Skeptic / Operator / Compliance) + validation tests that
 * tick green as the plan stabilizes.
 *
 * The visualization primitives here MUST stay aligned with landing-page
 * demo blocks (loader bars in `<SextantLoader />`, validation rows in
 * `.l-cta-side` styling) so the marketing surface and the live product
 * show the same thing.
 */
const VALIDATION_SKELETON = [
  "Every reagent has a catalog URL",
  "Budget sums correctly",
  "No orphan protocol step",
  "Citations resolve to real sources",
  "Timeline dependencies valid",
  "Compliance pipeline passes",
];

export function TraceRail() {
  return (
    <aside
      className="border-l border-borderwarm bg-paper flex flex-col gap-6 p-6"
      aria-label="Agent activity"
    >
      <div>
        <div className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-muted-foreground mb-3">
          Activity
        </div>
        <SextantLoader status="awaiting hypothesis…" size="sm" />
      </div>

      <div>
        <div className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-muted-foreground mb-3">
          Validation grid
        </div>
        <ul className="grid gap-2 font-mono text-[11.5px]">
          {VALIDATION_SKELETON.map((line) => (
            <li key={line} className="flex items-center gap-2 text-muted-foreground/70">
              <span className="inline-flex w-3 h-3 rounded-full border border-borderwarm" aria-hidden="true" />
              <span className="truncate">{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
