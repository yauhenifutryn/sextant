"use client";

import { useState } from "react";
import type { QCResponse } from "@/lib/qc/schema";
import type { Plan } from "@/lib/plan/schema";
import { VerdictCard } from "@/components/qc/verdict-card";
import { ExampleChips } from "@/components/example-chips";
import { PlanTabs } from "@/components/plan/plan-tabs";
import { PlanSkeleton } from "@/components/plan/plan-skeleton";
import { PlanDiffModal } from "@/components/plan-diff-modal";
import { Button } from "@/components/ui/button";
import { GitCompareArrows } from "lucide-react";

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

type Props = {
  onChipPick: (text: string) => void;
  qcObject: DeepPartial<QCResponse> | undefined;
  qcIsLoading: boolean;
  plan: Plan | null;
  planIsLoading: boolean;
  /** D7-16: snapshot of the prior plan (null until a second plan generation completes). */
  previousPlan: Plan | null;
  /** D7-13: threaded into PlanTabs to power the CorrectionPopover. */
  hypothesis: string | null;
  /** D7-14: called after a rule is captured — refreshes the header pill. */
  onRuleCaptured: () => void | Promise<void>;
};

/**
 * Plan canvas — Phase 7 adds:
 *   - Compare-with-prior-plan button above tabs (D7-16)
 *   - PlanDiffModal opened from that button (D7-15)
 *   - hypothesis + onRuleCaptured threaded into PlanTabs (D7-13/D7-14)
 *
 * Phase 4 invariants preserved (D4-12 3-state coexistence below VerdictCard).
 */
export function PlanCanvas({
  onChipPick,
  qcObject,
  qcIsLoading,
  plan,
  planIsLoading,
  previousPlan,
  hypothesis,
  onRuleCaptured,
}: Props) {
  const [diffOpen, setDiffOpen] = useState(false);

  const verdictActive = !!qcObject?.ok || qcIsLoading;
  const showPlan = plan !== null;
  const showSkeleton = !showPlan && (verdictActive || planIsLoading);
  const showHero = !verdictActive && !showPlan && !planIsLoading;
  const canCompare = showPlan && plan !== null && previousPlan !== null;

  return (
    <section
      className="flex flex-col p-8 bg-paper overflow-y-auto"
      aria-label="Plan canvas"
    >
      {/* D-41: pinned verdict slot at the top of the column */}
      <div className="mb-6">
        <VerdictCard object={qcObject} isLoading={qcIsLoading} />
      </div>

      {/* D7-16: Compare-with-previous-plan affordance, only when both plans exist */}
      {canCompare && plan && previousPlan && (
        <>
          <div className="mb-4 flex items-center justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDiffOpen(true)}
              className="gap-2"
            >
              <GitCompareArrows size={14} strokeWidth={1.5} />
              Compare with previous plan
            </Button>
          </div>
          <PlanDiffModal
            open={diffOpen}
            onOpenChange={setDiffOpen}
            previousPlan={previousPlan}
            currentPlan={plan}
          />
        </>
      )}

      {/* D4-12 state (b): rendered Plan tabs */}
      {showPlan && plan && (
        <PlanTabs
          plan={plan}
          hypothesis={hypothesis ?? undefined}
          onRuleCaptured={onRuleCaptured}
        />
      )}

      {/* D4-12 state (c): plan in flight, scaffold the tab shape */}
      {showSkeleton && <PlanSkeleton />}

      {/* D4-12 state (a): empty hero with example chips */}
      {showHero && (
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-xl text-center flex flex-col items-center gap-8">
            <h2 className="font-display text-3xl font-medium tracking-tight text-ink leading-tight">
              Frame a scientific question. Get a fundable plan in 3 minutes.
            </h2>
            <div className="h-px w-12 bg-borderwarm" aria-hidden />
            <ExampleChips onPick={onChipPick} className="justify-center" />
          </div>
        </div>
      )}
    </section>
  );
}
