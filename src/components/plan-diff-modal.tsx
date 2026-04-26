"use client";

/**
 * PlanDiffModal (D7-15).
 *
 * Side-by-side compare of two Plans. Renders both via the existing PlanTabs
 * component with `compareWith` set, so highlighting is applied per-leaf.
 *
 * Naive diff: PlanTabs computes equality per row by comparing the diff-relevant
 * primary fields (description / name+quantity / category+amount / phase+days /
 * name+description). When the row in `current` is not byte-equal to any row at
 * the same index in `compareWith`, the row gets the clay/rust accent.
 *
 * No LCS, no structural diff, no per-line rule labels (PROP-04 deferred).
 *
 * Diff view is intentionally read-only: PlanTabs is invoked WITHOUT a
 * `hypothesis` prop, so its derived `planContext` is undefined and each leaf
 * suppresses the CorrectionPopover wrap. Users correct lines on the live
 * canvas, not from inside the diff modal.
 */
import type { Plan } from "@/lib/plan/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlanTabs } from "@/components/plan/plan-tabs";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "Plan A" — the previous plan (older). Renders on the left. */
  previousPlan: Plan;
  /** "Plan B" — the current plan (newer). Renders on the right. */
  currentPlan: Plan;
};

export function PlanDiffModal({
  open,
  onOpenChange,
  previousPlan,
  currentPlan,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[1400px] w-[95vw] max-h-[90vh] overflow-hidden bg-paper border-borderwarm p-0 flex flex-col"
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 py-4 border-b border-borderwarm">
          <DialogTitle className="font-display text-base font-medium text-ink">
            Compare with previous plan
          </DialogTitle>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Lines highlighted in <span className="text-rust">rust</span> changed
            between Plan A (left) and Plan B (right).
          </p>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-px bg-borderwarm overflow-hidden flex-1 min-h-0">
          <section
            className="flex flex-col bg-paper overflow-y-auto p-6"
            aria-label="Plan A (previous)"
          >
            <h3 className="font-display text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Plan A · previous
            </h3>
            <PlanTabs plan={previousPlan} compareWith={currentPlan} />
          </section>
          <section
            className="flex flex-col bg-paper overflow-y-auto p-6"
            aria-label="Plan B (current)"
          >
            <h3 className="font-display text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Plan B · current
            </h3>
            <PlanTabs plan={currentPlan} compareWith={previousPlan} />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
