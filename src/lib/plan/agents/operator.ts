/**
 * CRO Operator agent (D-54, D-55, D-57 — owns Materials + Budget + Timeline).
 *
 * Three sections in ONE prompt because they're operationally tightly coupled
 * (a budget line maps to a material row; timeline phases reference protocol
 * steps). No fresh Tavily — supplier scraping is Phase 5 (GROUND-04). Phase 3
 * emits empty supplier / catalog_number / unit_price_usd slots (nullable in
 * schema).
 *
 * thinkingBudget: 0 for fast structured output (D-55).
 * 35s per-agent timeout (D-66).
 * Honors SEXTANT_DEMO_PACE_MS for demo recording.
 */
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type { UIMessageStreamWriter } from "ai";
import {
  materialRowSchema,
  budgetLineSchema,
  timelinePhaseSchema,
} from "@/lib/plan/schema";
import type { QCResponse } from "@/lib/qc/schema";

export const operatorSliceSchema = z.object({
  materials: z.array(materialRowSchema).min(1),
  budget: z.array(budgetLineSchema).min(1),
  timeline: z.array(timelinePhaseSchema).min(1),
});
export type OperatorSlice = z.infer<typeof operatorSliceSchema>;

const OPERATOR_SYSTEM = `You are the CRO Operator agent in a 4-agent experiment-plan pipeline.

Your job: produce three operationally-coupled sections — Materials, Budget, Timeline — in a single JSON object.

Output: { "materials": [...], "budget": [...], "timeline": [...] }

MATERIALS (1-15 entries):
- { name, quantity, supplier: null, catalog_number: null, unit_price_usd: null, citations: [] }
- supplier / catalog_number / unit_price_usd are ALWAYS null in this phase. Phase 5 fills them from real Sigma-Aldrich / Thermo Fisher pages.
- quantity is free-form ("100 µL", "1 plate", "1 kit").

BUDGET (3-8 line items):
- { category, amount_usd, notes?: string, citations: [] }
- category examples: "Reagents", "Consumables", "Equipment time", "Personnel", "Sample shipping".
- amount_usd is a defensible estimate (not invented; ground in standard CRO rate cards).

TIMELINE (2-6 phases):
- { phase, duration_days, depends_on: [], citations: [] }
- phase examples: "Sample prep", "Assay run", "QC analysis", "Reporting".
- depends_on: array of phase names that must finish first.

Rules:
- "citations" is ALWAYS [] across all 3 sections (Phase 5 fills).
- Do NOT invent catalog numbers, supplier names, or prices. Leave the slots null.
- Numbers must be realistic for THIS hypothesis class.

Emit ONLY the JSON object. No prose, no markdown fencing.`;

function operatorUserPrompt(hypothesis: string, qcContext: QCResponse): string {
  const qcSummary =
    qcContext.ok === "verdict"
      ? `Lit-QC verdict: ${qcContext.verdict}\nReasoning: ${qcContext.reasoning}`
      : `Lit-QC verdict: ${qcContext.ok}`;
  return `HYPOTHESIS:\n${hypothesis}\n\nLIT-QC CONTEXT:\n${qcSummary}`;
}

const DEMO_PACE_MS = Number(process.env.SEXTANT_DEMO_PACE_MS ?? 0);

export async function runOperator(args: {
  hypothesis: string;
  qcContext: QCResponse;
  modelId: string;
  writer: UIMessageStreamWriter;
  run_id: string;
}): Promise<{ slice: OperatorSlice | null; elapsed_ms: number; error?: string }> {
  const { hypothesis, qcContext, modelId, writer, run_id } = args;
  const t0 = Date.now();

  writer.write({
    type: "data-trace",
    data: {
      stage: "started",
      run_id,
      agent_id: "operator",
      task: "Drafting materials + budget + timeline",
      ts: new Date().toISOString(),
    },
    transient: true,
  });
  if (DEMO_PACE_MS > 0) await new Promise((r) => setTimeout(r, DEMO_PACE_MS));

  try {
    writer.write({
      type: "data-trace",
      data: {
        stage: "working",
        run_id,
        agent_id: "operator",
        activity: "Streaming operations sections from Gemini",
        ts: new Date().toISOString(),
      },
      transient: true,
    });
    const result = await generateObject({
      model: google(modelId),
      schema: operatorSliceSchema,
      system: OPERATOR_SYSTEM,
      prompt: operatorUserPrompt(hypothesis, qcContext),
      temperature: 0.2,
      maxOutputTokens: 2000,
      providerOptions: {
        google: {
          structuredOutputs: false,
          thinkingConfig: { thinkingBudget: 0 },
        },
      },
      abortSignal: AbortSignal.timeout(35_000),
    });
    const slice = result.object;
    const elapsed = Date.now() - t0;
    writer.write({
      type: "data-trace",
      data: {
        stage: "done",
        run_id,
        agent_id: "operator",
        elapsed_ms: elapsed,
        output_preview: `${slice.materials.length} materials, ${slice.budget.length} lines`,
        ts: new Date().toISOString(),
      },
      transient: true,
    });
    return { slice, elapsed_ms: elapsed };
  } catch (err) {
    const elapsed = Date.now() - t0;
    writer.write({
      type: "data-trace",
      data: {
        stage: "error",
        run_id,
        agent_id: "operator",
        error_message: String(err).slice(0, 400),
        retryable: true,
        ts: new Date().toISOString(),
      },
      transient: true,
    });
    return { slice: null, elapsed_ms: elapsed, error: String(err) };
  }
}
