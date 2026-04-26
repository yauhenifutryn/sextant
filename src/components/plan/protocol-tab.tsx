"use client";

import type { ProtocolStep } from "@/lib/plan/schema";
import { CitationSlot } from "@/components/plan/citation-slot";

type Props = {
  steps: ProtocolStep[];
};

/**
 * Protocol tab (PLAN-01) — numbered methodology steps.
 *
 * D4-13: NO internal scroll container. Lives inside parent's overflow-y-auto.
 * D4-16: trust the type — no defensive guards beyond what the schema enforced.
 * D4-10 via CitationSlot: empty citations[] renders nothing.
 */
export function ProtocolTab({ steps }: Props) {
  return (
    <ol className="flex flex-col gap-4" aria-label="Protocol steps">
      {steps.map((step) => (
        <li
          key={step.step_number}
          className="rounded-md border border-borderwarm bg-paper p-4 shadow-doc"
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
      ))}
    </ol>
  );
}
