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
};

/**
 * PlanTabs — the 5-tab shell composing Wave-1 leaves.
 *
 * Tab order (D4-03): Protocol → Materials → Budget → Timeline → Validation.
 *   Cognitive flow: what do I do → with what → for how much → in what
 *   timeframe → checked how. Default value is "protocol".
 *
 * Keyboard nav (PLAN-06): inherited from @radix-ui/react-tabs:
 *   - Tab focuses the active trigger
 *   - Arrow Left/Right cycles tabs (auto activation)
 *   - Home / End jumps to first / last
 *   - role="tablist" / role="tab" / role="tabpanel" wired automatically
 *
 * Compliance notes (D4-09): grouped by target_kind:
 *   - global         → strip ABOVE the tablist (visible on every tab)
 *   - protocol_step  → strip at top of Protocol TabsContent
 *   - material_row   → strip at top of Materials TabsContent
 *
 * Severity → border color (D4-09):
 *   - info     → border-borderwarm
 *   - caution  → border-clay
 *   - blocking → border-destructive
 *
 * compliance_summary (D4-09): small italic muted line under the tablist,
 * always visible across all tabs.
 *
 * D4-13: no internal scroll container — parent <PlanCanvas /> owns overflow.
 * D4-16: trust the type — no defensive guards beyond the prop contract.
 */
export function PlanTabs({ plan }: Props) {
  const { protocol, materials, budget, timeline, validation } = plan.plan;
  const notes = plan.compliance_notes ?? [];
  const summary = plan.compliance_summary ?? "";

  const globalNotes = notes.filter((n) => n.target_kind === "global");
  const protocolNotes = notes.filter((n) => n.target_kind === "protocol_step");
  const materialNotes = notes.filter((n) => n.target_kind === "material_row");

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
          <ProtocolTab steps={protocol} />
        </TabsContent>

        <TabsContent value="materials">
          {materialNotes.length > 0 && (
            <div className="mb-3">
              <ComplianceStrip notes={materialNotes} location="tab" />
            </div>
          )}
          <MaterialsTab materials={materials} />
        </TabsContent>

        <TabsContent value="budget">
          <BudgetTab lines={budget} />
        </TabsContent>

        <TabsContent value="timeline">
          <TimelineTab phases={timeline} />
        </TabsContent>

        <TabsContent value="validation">
          <ValidationTab checks={validation} />
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
