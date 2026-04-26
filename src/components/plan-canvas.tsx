"use client";

import type { QCResponse } from "@/lib/qc/schema";
import { VerdictCard } from "@/components/qc/verdict-card";
import { ExampleChips } from "@/components/example-chips";

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

type Props = {
  onChipPick: (text: string) => void;
  qcObject: DeepPartial<QCResponse> | undefined;
  qcIsLoading: boolean;
};

/**
 * Plan canvas — Phase 2 lifts the empty-state hero (D-18) below a pinned
 * <VerdictCard /> slot at the top of the column (D-41, LITQC-04).
 *
 * When a hypothesis is in flight or has produced a verdict / no-evidence
 * card, the hero hides so the verdict reads as the primary signal. When
 * the QC is idle (no object, not loading), the hero is the empty-state.
 */
export function PlanCanvas({ onChipPick, qcObject, qcIsLoading }: Props) {
  const verdictActive = !!qcObject?.ok || qcIsLoading;

  return (
    <section
      className="flex flex-col p-8 bg-paper overflow-y-auto"
      aria-label="Plan canvas"
    >
      {/* D-41: pinned verdict slot at the top of the column */}
      <div className="mb-6">
        <VerdictCard object={qcObject} isLoading={qcIsLoading} />
      </div>

      {/* Phase-1 empty-state hero — hides while QC is active */}
      {!verdictActive && (
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
