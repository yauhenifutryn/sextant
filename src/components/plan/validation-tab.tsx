"use client";

import type { ValidationCheck } from "@/lib/plan/schema";

type Props = {
  checks: ValidationCheck[];
};

/**
 * Validation tab (PLAN-05) — list of success criteria with measurement methods.
 *
 * D4-08: card-row per check. font-display name (semibold), muted description,
 *        2-column key-value strip below for measurement_method + pass_criteria.
 *        Mirrors validation-grid.tsx aesthetic (border-borderwarm, mono labels).
 *
 * Schema guarantees min 5 checks (enforced upstream in src/lib/plan/schema.ts).
 */
export function ValidationTab({ checks }: Props) {
  return (
    <ul className="flex flex-col gap-3" aria-label="Validation checks">
      {checks.map((check, idx) => (
        <li
          key={`${check.name}-${idx}`}
          className="rounded-md border border-borderwarm bg-paper shadow-doc p-4"
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
      ))}
    </ul>
  );
}
