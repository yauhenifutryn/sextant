"use client";

import type { TimelinePhase } from "@/lib/plan/schema";
import { CitationSlot } from "@/components/plan/citation-slot";

type Props = {
  phases: TimelinePhase[];
};

/**
 * Timeline tab (PLAN-04) — phased breakdown with dependencies.
 *
 * D4-07: one row per phase. font-display name + duration (`${days} days`) +
 *        depends_on chip strip. NO Gantt visualization in v1.
 * D4-10 via CitationSlot.
 */
export function TimelineTab({ phases }: Props) {
  return (
    <ol className="flex flex-col gap-3" aria-label="Timeline phases">
      {phases.map((phase, idx) => (
        <li
          key={`${phase.phase}-${idx}`}
          className="rounded-md border border-borderwarm bg-paper shadow-doc p-4"
        >
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <div className="flex items-center min-w-0">
              <span className="font-display text-sm font-medium text-ink">
                {phase.phase}
              </span>
              <CitationSlot citations={phase.citations} />
            </div>
            <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">
              {phase.duration_days} {phase.duration_days === 1 ? "day" : "days"}
            </span>
          </div>
          {phase.depends_on.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                depends on:
              </span>
              <ul className="flex flex-wrap gap-1.5" aria-label={`Dependencies for ${phase.phase}`}>
                {phase.depends_on.map((dep) => (
                  <li
                    key={dep}
                    className="inline-flex items-center rounded-full border border-borderwarm bg-surface px-2 py-0.5 font-mono text-[11px] text-ink"
                  >
                    {dep}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
