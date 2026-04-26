/**
 * Lab-rule extractor (D7-05, D7-06).
 *
 * One Gemini call per submitted correction. Takes the user's verbatim
 * correction + the line being corrected + a serialized slice of the
 * surrounding plan, and emits a generalized typed LabRuleDraft.
 *
 * - Model: pickAvailableLitQcModel() (shared ladder per src/lib/models.ts)
 * - generateObject with labRuleDraftSchema
 * - thinkingBudget: 0 (matches Phase 2/3 convention; structured output stable)
 * - structuredOutputs: false (matches Phase 2/3 — Gemini's strict oneOf-with-const stalls otherwise)
 * - 12s timeout (rule extraction is short)
 * - experimental_repairText: fall back to a stub rule using verbatim correction (D7-06)
 *
 * NOTE: id + created_at are SERVER-controlled. This function returns a
 * LabRuleDraft (no id, no created_at). The route post-fills both per D7-05.
 */
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { pickAvailableLitQcModel } from "@/lib/models";
import {
  labRuleDraftSchema,
  type LabRuleDraft,
  type LabRuleScope,
} from "./schema";

export type ExtractArgs = {
  correction: string;
  planContext: { hypothesis: string; sliceJson: string };
  targetLine: { kind: LabRuleScope; label: string };
};

const EXTRACTOR_SYSTEM = `You are a lab-rule extractor for a scientific experiment-plan tool.

Your job: take a scientist's verbatim correction on a specific plan line, and emit a GENERALIZED, REUSABLE typed lab rule that future plan generations should obey.

Output JSON shape: { "rule": string, "scope": "<enum>", "reasoning": string, "source_correction": string }

scope enum (pick the one matching the line that was corrected):
- "protocol_step"     — corrections on a numbered methodology step
- "material_row"      — corrections on a reagent / supplier / catalog # / qty
- "budget_line"       — corrections on a budget category or amount
- "timeline_phase"    — corrections on a phase name / duration / dependency
- "validation_check"  — corrections on a validation check / measurement / pass criteria
- "global"            — applies across the whole plan, not a single section

Rules:
- "rule" is the IMPERATIVE form of the user's correction, generalized so it applies to ANY future hypothesis (not just this one). Examples: "Always specify storage temperature for biological reagents.", "Every validation check must include both positive and negative controls.", "Never use sucrose-only cryoprotectant for human cell lines."
- "reasoning" is a 1-2 sentence explanation of WHY this rule matters, drawn from the correction context.
- "source_correction" is the user's correction text VERBATIM (do not rewrite — this is the audit trail).
- Do NOT invent additional rules beyond the one the correction implies.
- Do NOT include id or created_at — those are server-controlled.

Emit ONLY the JSON object. No prose, no markdown fencing.`;

function extractorUserPrompt(args: ExtractArgs): string {
  return `HYPOTHESIS:\n${args.planContext.hypothesis}\n\nLINE BEING CORRECTED:\n[${args.targetLine.kind}] ${args.targetLine.label}\n\nUSER CORRECTION (verbatim):\n${args.correction}\n\nSURROUNDING PLAN SLICE (JSON):\n${args.planContext.sliceJson}`;
}

export async function extractLabRule(args: ExtractArgs): Promise<LabRuleDraft> {
  const modelId = await pickAvailableLitQcModel();
  try {
    const result = await generateObject({
      model: google(modelId),
      schema: labRuleDraftSchema,
      system: EXTRACTOR_SYSTEM,
      prompt: extractorUserPrompt(args),
      temperature: 0.1,
      maxOutputTokens: 600,
      providerOptions: {
        google: {
          structuredOutputs: false,
          thinkingConfig: { thinkingBudget: 0 },
        },
      },
      experimental_repairText: async ({ text: _text }) => {
        // D7-06: if the model returns malformed JSON, return a structured stub
        // that obeys the schema. Better to capture the rule (verbatim user text)
        // than to lose it. The route still post-fills id + created_at.
        const fallback: LabRuleDraft = {
          rule: args.correction,
          scope: args.targetLine.kind,
          reasoning:
            "Model failed to extract structured rule — using user text verbatim.",
          source_correction: args.correction,
        };
        return JSON.stringify(fallback);
      },
      abortSignal: AbortSignal.timeout(12_000),
    });
    return result.object;
  } catch {
    // Hard fallback if Gemini is fully unavailable (D7-06 spirit).
    return {
      rule: args.correction,
      scope: args.targetLine.kind,
      reasoning:
        "Model failed to extract structured rule — using user text verbatim.",
      source_correction: args.correction,
    };
  }
}
