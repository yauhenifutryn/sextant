"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ValidationGrid (Phase 6, Plan 06-01).
 *
 * Renders the 6 baseline validation checks (verbatim strings) plus any
 * Skeptic-emitted extras. Status per row is derived deterministically
 * from Plan content via `deriveBaselineStatus`. Skeptic extras render
 * as `pending` with `pass_criteria` as a native title= tooltip (Phase 3
 * D-58 `validationCheckSchema` carries no live status field; per-check
 * runtime status is a Phase 7 concern).
 *
 * NO imports from `@/lib/plan/*`. Plan shape is duck-typed via PlanLike
 * with defensive field-name reads (06-CONTEXT.md mentions `line_total`
 * + `budget_total`; Phase 3 D-58 emits `amount_usd` per row with no
 * top-level total — read both names defensively).
 */

export const VALIDATION_SKELETON = [
  "Every reagent has a catalog URL",
  "Budget sums correctly",
  "No orphan protocol step",
  "Citations resolve to real sources",
  "Timeline dependencies valid",
  "Compliance pipeline passes",
] as const;

export type ValidationStatus = "pending" | "running" | "pass" | "fail";

export type ValidationCheckLike = {
  name: string;
  description?: string;
  measurement_method?: string;
  pass_criteria?: string;
};

export type PlanLike = {
  grounded?: boolean;
  // Budget shape — see header note. Read both `amount_usd` and `line_total`.
  budget?: Array<{ amount_usd?: number; line_total?: number }>;
  budget_total?: number;
  materials?: Array<{ citations?: unknown[] }>;
  compliance_summary?: string;
  agent_artifacts?: { compliance?: { error?: string } | null };
  plan?: {
    protocol?: Array<{ step_number?: number; citations?: unknown[] }>;
    timeline?: Array<{ phase?: string; depends_on?: string[] }>;
    validation?: ValidationCheckLike[];
  };
};

export type ValidationGridProps = {
  baseline?: readonly string[];
  skepticChecks?: ValidationCheckLike[];
  plan?: PlanLike | null;
  isLoading?: boolean;
};

const STATUS_DOT_CLASS: Record<ValidationStatus, string> = {
  pending: "border border-borderwarm",
  running: "border-2 border-ink animate-pulse",
  pass: "bg-forest border border-forest",
  fail: "bg-clay border border-clay",
};

const STATUS_TEXT_CLASS: Record<ValidationStatus, string> = {
  pending: "text-muted-foreground/70",
  running: "text-ink",
  pass: "text-forest",
  fail: "text-clay",
};

/**
 * Pure derivation. Returns a 4-state status given the baseline check name +
 * the current Plan snapshot (or null while loading). Defensive on every
 * field — Plan may be partial during streaming.
 */
function deriveBaselineStatus(
  name: string,
  plan: PlanLike | null | undefined,
  isLoading: boolean,
): ValidationStatus {
  if (!plan) return isLoading ? "running" : "pending";

  switch (name) {
    case "Every reagent has a catalog URL": {
      const mats = plan.materials ?? [];
      if (mats.length === 0) return "pending";
      if (mats.every((m) => (m.citations?.length ?? 0) > 0)) return "pass";
      return plan.grounded ? "fail" : "pending";
    }
    case "Budget sums correctly": {
      const lines = plan.budget ?? [];
      if (lines.length === 0) return "pending";
      const sum = lines.reduce(
        (acc, l) => acc + (l.amount_usd ?? l.line_total ?? 0),
        0,
      );
      if (typeof plan.budget_total === "number") {
        return Math.abs(sum - plan.budget_total) < 0.01 ? "pass" : "fail";
      }
      // No top-level total in D-58 → "pass" if every line had a non-zero number.
      return sum > 0 ? "pass" : "pending";
    }
    case "No orphan protocol step": {
      const proto = plan.plan?.protocol ?? [];
      const validations = plan.plan?.validation ?? [];
      if (proto.length === 0) return "pending";
      const ok = proto.every((s) => {
        const hasCit = (s.citations?.length ?? 0) > 0;
        const refed = validations.some(
          (v) =>
            typeof s.step_number === "number" &&
            (v.description?.includes(String(s.step_number)) ?? false),
        );
        return hasCit || refed;
      });
      return ok ? "pass" : "fail";
    }
    case "Citations resolve to real sources":
      // Phase 5 flips plan.grounded. Stays "pending" until Phase 5 has run.
      return plan.grounded ? "pass" : "pending";
    case "Timeline dependencies valid": {
      const tl = plan.plan?.timeline ?? [];
      if (tl.length === 0) return "pending";
      const phases = new Set(
        tl.map((t) => t.phase).filter(Boolean) as string[],
      );
      const ok = tl.every((t) =>
        (t.depends_on ?? []).every((d) => phases.has(d)),
      );
      return ok ? "pass" : "fail";
    }
    case "Compliance pipeline passes": {
      const summary = plan.compliance_summary ?? "";
      const compArtifact = plan.agent_artifacts?.compliance;
      if (!summary) return "pending";
      if (compArtifact && compArtifact.error) return "fail";
      return "pass";
    }
    default:
      return "pending";
  }
}

export function ValidationGrid({
  baseline = VALIDATION_SKELETON,
  skepticChecks,
  plan,
  isLoading = false,
}: ValidationGridProps) {
  const baselineNames = new Set(baseline);
  const extras = (skepticChecks ?? []).filter((c) => !baselineNames.has(c.name));

  return (
    <ul className="grid gap-2 font-mono text-[11.5px]">
      {baseline.map((name) => {
        const status = deriveBaselineStatus(name, plan, isLoading);
        return (
          <li
            key={`baseline-${name}`}
            className={cn(
              "flex items-center gap-2",
              STATUS_TEXT_CLASS[status],
            )}
          >
            <span
              className={cn(
                "inline-flex w-3 h-3 rounded-full shrink-0",
                STATUS_DOT_CLASS[status],
              )}
              aria-hidden="true"
            />
            <span className="truncate flex-1">{name}</span>
            {status === "pass" && (
              <Check
                size={12}
                strokeWidth={1.75}
                className="text-forest shrink-0"
                aria-hidden
              />
            )}
            {status === "fail" && (
              <X
                size={12}
                strokeWidth={1.75}
                className="text-clay shrink-0"
                aria-hidden
              />
            )}
          </li>
        );
      })}
      {extras.map((c) => (
        <li
          key={`extra-${c.name}`}
          className={cn(
            "flex items-center gap-2",
            STATUS_TEXT_CLASS.pending,
          )}
          title={c.pass_criteria}
        >
          <span
            className={cn(
              "inline-flex w-3 h-3 rounded-full shrink-0",
              STATUS_DOT_CLASS.pending,
            )}
            aria-hidden="true"
          />
          <span className="truncate flex-1">{c.name}</span>
        </li>
      ))}
    </ul>
  );
}
