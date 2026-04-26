"use client";

import { cn } from "@/lib/utils";

/**
 * PlanSkeleton — loading-state scaffold (D4-11).
 *
 * Rendered when `plan.plan === null && plan.isLoading` (the "verdict only,
 * plan in flight" coexistence state, D4-12). Static markup: no Radix tabs
 * wiring needed; this is decorative scaffolding while the stream lands.
 *
 * Skeleton card matches the Protocol-tab shape (3 rows of step cards) since
 * Protocol is the default-open tab (D4-03).
 */
export function PlanSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-label="Generating plan…" aria-busy="true">
      {/* Fake tab strip — 5 gray labels under a border-b, no interactions */}
      <div
        className="inline-flex items-center justify-start gap-6 border-b border-borderwarm pb-2"
        aria-hidden="true"
      >
        {[
          "Protocol",
          "Materials",
          "Budget",
          "Timeline",
          "Validation",
        ].map(
          (label, i) => (
            <span
              key={label}
              className={cn(
                "font-display text-sm font-medium pb-2 -mb-px border-b-2",
                i === 0
                  ? "border-borderwarm text-muted-foreground/70"
                  : "border-transparent text-muted-foreground/40",
              )}
            >
              {label}
            </span>
          ),
        )}
      </div>

      {/* Skeleton card stack — 3 rows mirroring the Protocol tab shape */}
      <div className="flex flex-col gap-3 mt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-md border border-borderwarm bg-paper p-4 shadow-doc animate-pulse"
          >
            <div className="flex items-baseline gap-3 mb-3">
              <div className="h-3 w-16 rounded bg-surface" />
              <div className="h-3 w-20 rounded bg-surface/70" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-3 w-full rounded bg-surface" />
              <div className="h-3 w-11/12 rounded bg-surface" />
              <div className="h-3 w-3/4 rounded bg-surface/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
