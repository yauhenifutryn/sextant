"use client";

import { cloneElement } from "react";
import type { ValidationCheck } from "@/lib/plan/schema";
import { CorrectionPopover } from "@/components/correction-popover";

type Props = {
  checks: ValidationCheck[];
  planContext?: { hypothesis: string; sliceJson: string };
  onRuleCaptured?: () => void | Promise<void>;
  /** D7-15: checks whose name+description differ at the same index are highlighted. */
  compareWith?: ValidationCheck[];
};

/**
 * Validation tab (PLAN-05) — list of success criteria with measurement methods.
 *
 * D4-08: card-row per check. font-display name (semibold), muted description,
 *        2-column key-value strip below for measurement_method + pass_criteria.
 *        Mirrors validation-grid.tsx aesthetic (border-borderwarm, mono labels).
 *
 * Schema guarantees min 5 checks (enforced upstream in src/lib/plan/schema.ts).
 *
 * D7-13 (Phase 7): each check wraps in <CorrectionPopover> when planContext
 * is supplied. This is the demo's primary correction surface — the pre-staged
 * rule lands here ("positive AND negative controls in validation").
 */
export function ValidationTab({
  checks,
  planContext,
  onRuleCaptured,
  compareWith,
}: Props) {
  return (
    <ul className="flex flex-col gap-3" aria-label="Validation checks">
      {checks.map((check, idx) => {
        const isChanged =
          !!compareWith &&
          (compareWith[idx]?.name !== check.name ||
            compareWith[idx]?.description !== check.description);
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
                ? `Correct validation check ${check.name}`
                : undefined
            }
          >
            <div className="font-display text-sm font-semibold text-ink mb-1">
              {check.name}
            </div>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed mb-3">
              {check.description}
            </p>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-xs">
              <dt className="font-mono uppercase tracking-wider text-muted-foreground text-[10px] self-start mt-0.5">
                Method
              </dt>
              <dd className="font-sans text-ink leading-relaxed">
                {check.measurement_method}
              </dd>
              <dt className="font-mono uppercase tracking-wider text-muted-foreground text-[10px] self-start mt-0.5">
                Pass criteria
              </dt>
              <dd className="font-sans text-ink leading-relaxed">
                {check.pass_criteria}
              </dd>
            </dl>
          </li>
        );
        const k = `${check.name}-${idx}`;
        if (!planContext || compareWith) {
          return cloneElement(li, { key: k });
        }
        return (
          <CorrectionPopover
            key={k}
            target={{
              kind: "validation_check",
              label: check.name,
            }}
            planContext={planContext}
            onSuccess={onRuleCaptured}
          >
            {li}
          </CorrectionPopover>
        );
      })}
    </ul>
  );
}
