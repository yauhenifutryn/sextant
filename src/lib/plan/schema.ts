/**
 * Plan response Zod schema (D-58).
 *
 * Single source of truth for both the server route AND the client hook.
 * Imports `citationSchema` from QC's schema (D-58 reuse — do NOT redefine).
 *
 * Phase 3 emits citations: [] for every row and grounded: false at the top.
 * Phase 5 fills citations and flips the flag. Phase 4 reads this schema to
 * render the 5 tabs (Protocol/Materials/Budget/Timeline/Validation).
 */
import { z } from "zod";
import { citationSchema } from "@/lib/qc/schema";

export const protocolStepSchema = z.object({
  step_number: z.number().int().positive(),
  description: z.string().min(1).max(800),
  duration_estimate: z.string().min(1).max(120),
  citations: z.array(citationSchema).default([]),
});

export const materialRowSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.string().min(1).max(80),
  supplier: z.string().nullable(),
  catalog_number: z.string().nullable(),
  unit_price_usd: z.number().nullable(),
  citations: z.array(citationSchema).default([]),
});

export const budgetLineSchema = z.object({
  category: z.string().min(1).max(120),
  amount_usd: z.number().nonnegative(),
  notes: z.string().max(280).optional(),
  citations: z.array(citationSchema).default([]),
});

export const timelinePhaseSchema = z.object({
  phase: z.string().min(1).max(120),
  duration_days: z.number().int().positive(),
  depends_on: z.array(z.string()).default([]),
  citations: z.array(citationSchema).default([]),
});

export const validationCheckSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(400),
  measurement_method: z.string().min(1).max(280),
  pass_criteria: z.string().min(1).max(280),
});

export const complianceNoteSchema = z.object({
  target_kind: z.enum(["protocol_step", "material_row", "global"]),
  target_index: z.number().int().nonnegative().nullable(),
  note: z.string().min(1).max(600),
  severity: z.enum(["info", "caution", "blocking"]),
});

export const agentArtifactSchema = z.object({
  raw_draft: z.unknown(),
  model_id: z.string(),
  elapsed_ms: z.number().nonnegative(),
  token_count: z.number().int().nonnegative().optional(),
  error: z.string().optional(),
});

export const planSchema = z.object({
  run_id: z.string(),
  hypothesis: z.string(),
  qc_run_id: z.string().nullable(),
  grounded: z.boolean(),
  plan: z.object({
    protocol: z.array(protocolStepSchema),
    materials: z.array(materialRowSchema),
    budget: z.array(budgetLineSchema),
    timeline: z.array(timelinePhaseSchema),
    validation: z.array(validationCheckSchema).min(5),
  }),
  agent_artifacts: z.object({
    researcher: agentArtifactSchema,
    skeptic: agentArtifactSchema,
    operator: agentArtifactSchema,
    compliance: agentArtifactSchema,
  }),
  compliance_notes: z.array(complianceNoteSchema).default([]),
  compliance_summary: z.string(),
  model_id: z.string(),
  latency_ms: z.number().nonnegative(),
  generated_at: z.string(),
});

export type Plan = z.infer<typeof planSchema>;
export type ProtocolStep = z.infer<typeof protocolStepSchema>;
export type MaterialRow = z.infer<typeof materialRowSchema>;
export type BudgetLine = z.infer<typeof budgetLineSchema>;
export type TimelinePhase = z.infer<typeof timelinePhaseSchema>;
export type ValidationCheck = z.infer<typeof validationCheckSchema>;
export type ComplianceNote = z.infer<typeof complianceNoteSchema>;
export type AgentArtifact = z.infer<typeof agentArtifactSchema>;
