/**
 * Consolidator (D-54 — was a 5th LLM call, now a deterministic merge).
 *
 * The previous design had Gemini synthesize a Plan envelope around the 4
 * agent slices, but in practice (verified live 2026-04-26) the strict
 * planSchema validation failed AI_NoObjectGeneratedError ~100% of the
 * time. The LLM call was redundant anyway — the route always overwrote
 * metadata server-side via post-fill, so the LLM only contributed an
 * envelope shape we could build deterministically.
 *
 * This deterministic merge:
 *   - never fails (placeholder slices for any null agent output)
 *   - is faster (~1ms vs ~10s LLM call)
 *   - removes the AI_NoObjectGeneratedError class of failures
 *   - still emits started/done trace events so the rail UI shows the row
 *   - still honors SEXTANT_DEMO_PACE_MS for demo recording
 */
import type { UIMessageStreamWriter } from "ai";
import type {
  Plan,
  AgentArtifact,
  ProtocolStep,
  MaterialRow,
  BudgetLine,
  TimelinePhase,
  ValidationCheck,
  ComplianceNote,
} from "@/lib/plan/schema";

const DEMO_PACE_MS = Number(process.env.SEXTANT_DEMO_PACE_MS ?? 0);

// 6 baseline validation checks used as floor + fallback (matches
// VALIDATION_SKELETON in src/components/trace-rail.tsx so Phase 6 grid
// always has the named anchors to tick green deterministically).
const VALIDATION_FALLBACK: ValidationCheck[] = [
  {
    name: "Every reagent has a catalog URL",
    description: "Each materials row carries at least one citation pointing to the supplier listing.",
    measurement_method: "Count of materials[].citations.length > 0",
    pass_criteria: "100% of rows have ≥1 citation",
  },
  {
    name: "Budget sums correctly",
    description: "Sum of budget line amounts equals the declared total.",
    measurement_method: "Numerical sum of budget[].amount_usd",
    pass_criteria: "Sum within ±$1 of expected total",
  },
  {
    name: "No orphan protocol step",
    description: "Every protocol step is referenced by at least one validation check or material.",
    measurement_method: "Cross-ref protocol[].step_number against validation/materials text",
    pass_criteria: "0 orphan steps",
  },
  {
    name: "Citations resolve to real sources",
    description: "Every cited URL returns HTTP 200.",
    measurement_method: "HEAD request per citation URL",
    pass_criteria: "100% URLs return 200",
  },
  {
    name: "Timeline dependencies valid",
    description: "Every depends_on phase id refers to an existing phase.",
    measurement_method: "Set membership check on timeline[].depends_on",
    pass_criteria: "0 dangling references",
  },
  {
    name: "Compliance pipeline passes",
    description: "Compliance summary is non-empty and notes are populated.",
    measurement_method: "Length checks on compliance_summary + compliance_notes[]",
    pass_criteria: "summary length > 0 AND notes length > 0",
  },
];

const PROTOCOL_FALLBACK: ProtocolStep[] = [
  {
    step_number: 1,
    description: "(Researcher agent failed — see agent_artifacts.researcher.error)",
    duration_estimate: "n/a",
    citations: [],
  },
];

const MATERIALS_FALLBACK: MaterialRow[] = [
  {
    name: "(Operator agent failed — materials placeholder)",
    quantity: "n/a",
    supplier: null,
    catalog_number: null,
    unit_price_usd: null,
    citations: [],
  },
];

const BUDGET_FALLBACK: BudgetLine[] = [
  {
    category: "(Operator agent failed — budget placeholder)",
    amount_usd: 0,
    notes: "Re-run plan generation to populate.",
    citations: [],
  },
];

const TIMELINE_FALLBACK: TimelinePhase[] = [
  {
    phase: "(Operator agent failed — timeline placeholder)",
    duration_days: 1,
    depends_on: [],
    citations: [],
  },
];

type ResearcherSlice = { protocol: ProtocolStep[] } | null;
type SkepticSlice = { validation: ValidationCheck[] } | null;
type OperatorSlice = {
  materials: MaterialRow[];
  budget: BudgetLine[];
  timeline: TimelinePhase[];
} | null;
type ComplianceSlice = {
  compliance_notes: ComplianceNote[];
  compliance_summary: string;
} | null;

export async function runConsolidator(args: {
  hypothesis: string;
  qc_run_id: string | null;
  run_id: string;
  modelId: string;
  slices: {
    researcher: unknown;
    skeptic: unknown;
    operator: unknown;
    compliance: unknown;
  };
  artifacts: {
    researcher: AgentArtifact;
    skeptic: AgentArtifact;
    operator: AgentArtifact;
    compliance: AgentArtifact;
  };
  writer: UIMessageStreamWriter;
}): Promise<Plan> {
  const t0 = Date.now();

  args.writer.write({
    type: "data-trace",
    data: {
      stage: "started",
      run_id: args.run_id,
      agent_id: "consolidator",
      task: "Merging 4 agent drafts into Plan",
      ts: new Date().toISOString(),
    },
    transient: true,
  });
  if (DEMO_PACE_MS > 0) await new Promise((r) => setTimeout(r, DEMO_PACE_MS));

  // Deterministic merge from agent slices. Each slice already validated
  // against its own Zod schema in the agent runner, so unwrapping is safe.
  const r = args.slices.researcher as ResearcherSlice;
  const s = args.slices.skeptic as SkepticSlice;
  const o = args.slices.operator as OperatorSlice;
  const c = args.slices.compliance as ComplianceSlice;

  const validation = (s?.validation ?? []).slice();
  if (validation.length < 5) {
    // Top up to schema floor of 5 with VALIDATION_FALLBACK entries that
    // aren't already named.
    const existing = new Set(validation.map((v) => v.name));
    for (const v of VALIDATION_FALLBACK) {
      if (validation.length >= 5) break;
      if (!existing.has(v.name)) validation.push(v);
    }
  }

  const plan: Plan = {
    run_id: args.run_id,
    hypothesis: args.hypothesis,
    qc_run_id: args.qc_run_id,
    grounded: false, // D-59 — Phase 5 flips
    plan: {
      protocol: r?.protocol ?? PROTOCOL_FALLBACK,
      materials: o?.materials ?? MATERIALS_FALLBACK,
      budget: o?.budget ?? BUDGET_FALLBACK,
      timeline: o?.timeline ?? TIMELINE_FALLBACK,
      validation,
    },
    agent_artifacts: args.artifacts,
    compliance_notes: c?.compliance_notes ?? [],
    compliance_summary:
      c?.compliance_summary ??
      "(Compliance agent failed — see agent_artifacts.compliance.error)",
    model_id: args.modelId,
    latency_ms: Date.now() - t0,
    generated_at: new Date().toISOString(),
  };

  args.writer.write({
    type: "data-trace",
    data: {
      stage: "done",
      run_id: args.run_id,
      agent_id: "consolidator",
      elapsed_ms: Date.now() - t0,
      ts: new Date().toISOString(),
    },
    transient: true,
  });
  return plan;
}
