"use client";

import { cloneElement } from "react";
import type { ProtocolStep } from "@/lib/plan/schema";
import { CitationSlot } from "@/components/plan/citation-slot";
import { CorrectionPopover } from "@/components/correction-popover";

type Props = {
  steps: ProtocolStep[];
  planContext?: { hypothesis: string; sliceJson: string };
  onRuleCaptured?: () => void | Promise<void>;
};

/**
 * Protocol tab (PLAN-01) — numbered methodology steps.
 *
 * D4-13: NO internal scroll container. Lives inside parent's overflow-y-auto.
 * D4-16: trust the type — no defensive guards beyond what the schema enforced.
 * D4-10 via CitationSlot: empty citations[] renders nothing.
 *
 * D7-13 (Phase 7): each step wraps its body in <CorrectionPopover> when
 * planContext is supplied (Wave 4 wires that). Without planContext we fall
 * back to the Phase 4 layout exactly — no a11y role/tabIndex changes.
 */
export function ProtocolTab({ steps, planContext, onRuleCaptured }: Props) {
  return (
    <ol className="flex flex-col gap-4" aria-label="Protocol steps">
      {steps.map((step) => {
        const body = (
          <li
            className={`rounded-md border border-borderwarm bg-paper p-4 shadow-doc${
              planContext
                ? " text-left w-full cursor-pointer hover:border-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 transition-colors"
                : ""
            }`}
            tabIndex={planContext ? 0 : -1}
            role={planContext ? "button" : undefined}
            aria-label={
              planContext ? `Correct step ${step.step_number}` : undefined
            }
          >
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground tabular-nums">
                Step {step.step_number}
              </span>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                · {step.duration_estimate}
              </span>
              <CitationSlot citations={step.citations} />
            </div>
            <p className="font-sans text-sm text-ink leading-relaxed">
              {step.description}
            </p>
          </li>
        );
        if (!planContext) {
          return cloneElement(body, { key: step.step_number });
        }
        return (
          <CorrectionPopover
            key={step.step_number}
            target={{
              kind: "protocol_step",
              label: `Step ${step.step_number}: ${step.description.slice(0, 80)}`,
            }}
            planContext={planContext}
            onSuccess={onRuleCaptured}
          >
            {body}
          </CorrectionPopover>
        );
      })}
    </ol>
  );
}
