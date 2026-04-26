"use client";

import type { QCResponse } from "@/lib/qc/schema";
import type { Plan } from "@/lib/plan/schema";
import { VerdictCard } from "@/components/qc/verdict-card";
import { ExampleChips } from "@/components/example-chips";
import { PlanTabs } from "@/components/plan/plan-tabs";
import { PlanSkeleton } from "@/components/plan/plan-skeleton";

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

type Props = {
  onChipPick: (text: string) => void;
  qcObject: DeepPartial<QCResponse> | undefined;
  qcIsLoading: boolean;
  plan: Plan | null;
  planIsLoading: boolean;
};

/**
 * Plan canvas — Phase 4 wires PlanTabs into the canvas column.
 *
 * Three display states (D4-12), all below the pinned <VerdictCard /> slot:
 *   (a) Empty hero        — no QC active AND no plan: original chip prompt.
 *   (b) PlanTabs          — plan is non-null: render the 5-tab Plan view.
 *   (c) PlanSkeleton      — plan is null but QC is in flight or plan is
 *                            loading: animated 5-tab scaffold.
 *
 * The pinned <VerdictCard /> always shows when QC has fired (D-41 from Phase 2,
 * preserved by D4-12). Phase 4 sits BELOW it inside the canvas column.
 *
 * D4-13: this section owns the only `overflow-y-auto`; PlanTabs MUST NOT
 * introduce a second scroll container.
 */
export function PlanCanvas({
  onChipPick,
  qcObject,
  qcIsLoading,
  plan,
  planIsLoading,
}: Props) {
  const verdictActive = !!qcObject?.ok || qcIsLoading;
  const showPlan = plan !== null;
  const showSkeleton = !showPlan && (verdictActive || planIsLoading);
  const showHero = !verdictActive && !showPlan && !planIsLoading;

  return (
    <section
      className="flex flex-col p-8 bg-paper overflow-y-auto"
      aria-label="Plan canvas"
    >
      {/* D-41: pinned verdict slot at the top of the column */}
      <div className="mb-6">
        <VerdictCard object={qcObject} isLoading={qcIsLoading} />
      </div>

      {/* D4-12 state (b): rendered Plan tabs */}
      {showPlan && plan && <PlanTabs plan={plan} />}

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
