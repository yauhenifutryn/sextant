"use client";

import type { Plan, ComplianceNote } from "@/lib/plan/schema";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProtocolTab } from "@/components/plan/protocol-tab";
import { MaterialsTab } from "@/components/plan/materials-tab";
import { BudgetTab } from "@/components/plan/budget-tab";
import { TimelineTab } from "@/components/plan/timeline-tab";
import { ValidationTab } from "@/components/plan/validation-tab";
import { cn } from "@/lib/utils";

type Props = {
  plan: Plan;
  /** D7-15: when set, leaves apply clay/rust accent on rows that differ from this plan. */
  compareWith?: Plan;
  /** Hypothesis text for the correction popover (threaded into each leaf). */
  hypothesis?: string;
  /** Called after a successful rule capture (D7-14 — drives header pill refresh). */
  onRuleCaptured?: () => void | Promise<void>;
};

/**
 * PlanTabs — composes 5 leaves. Phase 7 adds:
 *   - compareWith?: Plan       (D7-15: enables diff highlighting in leaves)
 *   - hypothesis + onRuleCaptured (D7-14: threads CorrectionPopover wiring)
 *
 * Phase 4 invariants preserved:
 *   - Tab order: Protocol → Materials → Budget → Timeline → Validation
 *   - Compliance notes routing by target_kind (D4-09)
 *   - No internal scroll container (D4-13)
 *   - Pure render — no useState/useEffect (D4-16)
 *
 * Diff view is read-only: when no `hypothesis` is supplied (i.e. inside
 * PlanDiffModal), `planContext` resolves to undefined and each leaf
 * naturally falls back to the no-popover branch from Wave 3.
 */
export function PlanTabs({
  plan,
  compareWith,
  hypothesis,
  onRuleCaptured,
}: Props) {
  const { protocol, materials, budget, timeline, validation } = plan.plan;
  const notes = plan.compliance_notes ?? [];
  const summary = plan.compliance_summary ?? "";

  const globalNotes = notes.filter((n) => n.target_kind === "global");
  const protocolNotes = notes.filter((n) => n.target_kind === "protocol_step");
  const materialNotes = notes.filter((n) => n.target_kind === "material_row");

  // D7-13/D7-14: only enable the correction popover when hypothesis is supplied
  // (i.e. inside the live PlanCanvas, not the diff modal). The diff modal
  // intentionally suppresses the popover to keep the compare view read-only.
  const planContext = hypothesis
    ? {
        hypothesis,
        sliceJson: JSON.stringify(plan.plan),
      }
    : undefined;

  return (
    <div className="flex flex-col gap-3" aria-label="Plan canvas tabs">
      {globalNotes.length > 0 && (
        <ComplianceStrip notes={globalNotes} location="global" />
      )}

      <Tabs defaultValue="protocol" className="flex flex-col gap-3">
        <TabsList aria-label="Plan sections">
          <TabsTrigger value="protocol">Protocol</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        {summary && (
          <p className="font-sans italic text-xs text-muted-foreground leading-relaxed -mt-1">
            {summary}
          </p>
        )}

        <TabsContent value="protocol">
          {protocolNotes.length > 0 && (
            <div className="mb-3">
              <ComplianceStrip notes={protocolNotes} location="tab" />
            </div>
          )}
          <ProtocolTab
            steps={protocol}
            planContext={planContext}
            onRuleCaptured={onRuleCaptured}
            compareWith={compareWith?.plan.protocol}
          />
        </TabsContent>

        <TabsContent value="materials">
          {materialNotes.length > 0 && (
            <div className="mb-3">
              <ComplianceStrip notes={materialNotes} location="tab" />
            </div>
          )}
          <MaterialsTab
            materials={materials}
            planContext={planContext}
            onRuleCaptured={onRuleCaptured}
            compareWith={compareWith?.plan.materials}
          />
        </TabsContent>

        <TabsContent value="budget">
          <BudgetTab
            lines={budget}
            planContext={planContext}
            onRuleCaptured={onRuleCaptured}
            compareWith={compareWith?.plan.budget}
          />
        </TabsContent>

        <TabsContent value="timeline">
          <TimelineTab
            phases={timeline}
            planContext={planContext}
            onRuleCaptured={onRuleCaptured}
            compareWith={compareWith?.plan.timeline}
          />
        </TabsContent>

        <TabsContent value="validation">
          <ValidationTab
            checks={validation}
            planContext={planContext}
            onRuleCaptured={onRuleCaptured}
            compareWith={compareWith?.plan.validation}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const SEVERITY_BORDER: Record<ComplianceNote["severity"], string> = {
  info: "border-borderwarm",
  caution: "border-clay",
  blocking: "border-destructive",
};

const SEVERITY_LABEL: Record<ComplianceNote["severity"], string> = {
  info: "Info",
  caution: "Caution",
  blocking: "Blocking",
};

type StripProps = {
  notes: ComplianceNote[];
  location: "global" | "tab";
};

function ComplianceStrip({ notes, location }: StripProps) {
  return (
    <ul
      className="flex flex-col gap-2"
      aria-label={
        location === "global"
          ? "Compliance notes (all tabs)"
          : "Compliance notes (this section)"
      }
    >
      {notes.map((n, idx) => (
        <li
          key={`${n.target_kind}-${idx}`}
          className={cn(
            "rounded-md border-l-4 bg-paper p-3",
            SEVERITY_BORDER[n.severity],
            "border-y border-r border-borderwarm",
          )}
        >
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {SEVERITY_LABEL[n.severity]}
            </span>
            {typeof n.target_index === "number" && (
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                · #{n.target_index}
              </span>
            )}
          </div>
          <p className="font-sans text-xs text-ink leading-relaxed">
            {n.note}
          </p>
        </li>
      ))}
    </ul>
  );
}
