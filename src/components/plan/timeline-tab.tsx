"use client";

import { cloneElement } from "react";
import type { TimelinePhase } from "@/lib/plan/schema";
import { CitationSlot } from "@/components/plan/citation-slot";
import { CorrectionPopover } from "@/components/correction-popover";

type Props = {
  phases: TimelinePhase[];
  planContext?: { hypothesis: string; sliceJson: string };
  onRuleCaptured?: () => void | Promise<void>;
  /** D7-15: phases whose phase+duration_days differ at the same index are highlighted. */
  compareWith?: TimelinePhase[];
};

/**
 * Timeline tab (PLAN-04) — phased breakdown with dependencies.
 *
 * D4-07: one row per phase. font-display name + duration (`${days} days`) +
 *        depends_on chip strip. NO Gantt visualization in v1.
 * D4-10 via CitationSlot.
 *
 * D7-13 (Phase 7): each phase wraps in <CorrectionPopover> when planContext
 * is supplied; without it, behaves exactly as Phase 4.
 */
export function TimelineTab({
  phases,
  planContext,
  onRuleCaptured,
  compareWith,
}: Props) {
  return (
    <ol className="flex flex-col gap-3" aria-label="Timeline phases">
      {phases.map((phase, idx) => {
        const isChanged =
          !!compareWith &&
          (compareWith[idx]?.phase !== phase.phase ||
            compareWith[idx]?.duration_days !== phase.duration_days);
        const li = (
          <li
            className={`rounded-md border border-borderwarm bg-paper shadow-doc p-4${
              planContext && !compareWith
                ? " cursor-pointer hover:border-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 transition-colors"
                : ""
            }${isChanged ? " bg-clay/10 border-l-2 border-rust" : ""}`}
            tabIndex={planContext && !compareWith ? 0 : -1}
            role={planContext && !compareWith ? "button" : undefined}
            aria-label={
              planContext && !compareWith
                ? `Correct timeline phase ${phase.phase}`
                : undefined
            }
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
        );
        const k = `${phase.phase}-${idx}`;
        if (!planContext || compareWith) {
          return cloneElement(li, { key: k });
        }
        return (
          <CorrectionPopover
            key={k}
            target={{
              kind: "timeline_phase",
              label: `${phase.phase} · ${phase.duration_days} days`,
            }}
            planContext={planContext}
            onSuccess={onRuleCaptured}
          >
            {li}
          </CorrectionPopover>
        );
      })}
    </ol>
  );
}
