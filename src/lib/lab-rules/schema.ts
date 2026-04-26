/**
 * LabRule — typed correction artifact (D7-01).
 *
 * Captured when a scientist clicks any line in the plan canvas, types a
 * correction, and submits it. Phase 7 extracts a generalized rule from the
 * verbatim correction (Gemini call) and persists it to data/lab_rules.json.
 *
 * Fields are minimal by design — confidence / last_used_at / superseded_by
 * are explicitly deferred (see .planning/DEFERRED.md). The hackathon demo
 * shows 1-2 rules captured live; richer lifecycle is post-MVP.
 *
 * IMPORTANT: id and created_at are SERVER-controlled. The extractor never
 * emits them (D7-05). The route post-fills both before persisting.
 */
import { z } from "zod";

export const labRuleScopeEnum = z.enum([
  "protocol_step",
  "material_row",
  "budget_line",
  "timeline_phase",
  "validation_check",
  "global",
]);

export type LabRuleScope = z.infer<typeof labRuleScopeEnum>;

export const labRuleSchema = z.object({
  id: z.string().min(1),
  rule: z.string().min(1).max(600),
  scope: labRuleScopeEnum,
  reasoning: z.string().min(1).max(600),
  source_correction: z.string().min(1).max(2000),
  created_at: z.string().min(1),
});

export type LabRule = z.infer<typeof labRuleSchema>;

/**
 * Extractor output schema — what the Gemini model is allowed to emit.
 * Strips id + created_at (server post-fills both per D7-05).
 */
export const labRuleDraftSchema = labRuleSchema.omit({
  id: true,
  created_at: true,
});

export type LabRuleDraft = z.infer<typeof labRuleDraftSchema>;

/** Shape on disk: data/lab_rules.json. */
export const labRulesFileSchema = z.object({
  rules: z.array(labRuleSchema).default([]),
});

export type LabRulesFile = z.infer<typeof labRulesFileSchema>;
