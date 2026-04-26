/**
 * Compliance agent (D-54, D-55, D-57 — owns compliance_notes[] + compliance_summary).
 *
 * compliance_summary tone: 1-paragraph regulatory note (not a checklist),
 * confident, terse, scientist-to-scientist. See CONTEXT.md "Specific Ideas".
 *
 * No fresh Tavily — uses shared lit-QC context only.
 * thinkingBudget: 0 for fast structured output (D-55).
 * 35s per-agent timeout (D-66).
 * Honors SEXTANT_DEMO_PACE_MS for demo recording.
 */
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type { UIMessageStreamWriter } from "ai";
import { complianceNoteSchema } from "@/lib/plan/schema";
import type { QCResponse } from "@/lib/qc/schema";

export const complianceSliceSchema = z.object({
  compliance_notes: z.array(complianceNoteSchema).default([]),
  compliance_summary: z.string().min(1).max(800),
});
export type ComplianceSlice = z.infer<typeof complianceSliceSchema>;

const COMPLIANCE_SYSTEM = `You are the Compliance agent in a 4-agent experiment-plan pipeline.

Your job: produce two outputs — (1) a list of pointed compliance notes that target specific protocol steps or material rows, and (2) a single-paragraph compliance summary written scientist-to-scientist.

Output: { "compliance_notes": [...], "compliance_summary": "..." }

COMPLIANCE_NOTES (0-8 entries):
- { target_kind: "protocol_step" | "material_row" | "global", target_index: number | null, note, severity: "info" | "caution" | "blocking" }
- target_kind=global means the note applies to the whole experiment; target_index is null in that case.
- target_index is a 0-based index into the (assumed) protocol[] or materials[] array. You don't see those arrays — emit your best-guess indices based on the hypothesis content.
- severity: "info" (FYI), "caution" (extra care needed), "blocking" (must resolve before running).
- Examples: { target_kind: "material_row", target_index: 2, note: "Trichloroacetic acid is corrosive; requires fume hood and PPE.", severity: "caution" }

COMPLIANCE_SUMMARY (1 paragraph, ≤600 chars):
- Tone: confident, terse, scientist-to-scientist. NOT a checklist.
- Cover: human-subjects considerations (IRB?), animal use, hazardous reagents, controlled substances (DEA), waste disposal class.
- Example: "This protocol involves human-derived plasma samples and IL-6 measurement; IRB approval is required before sample collection. Reagents include trichloroacetic acid (corrosive, requires fume hood). No DEA-scheduled substances detected."

Emit ONLY the JSON object. No prose, no markdown fencing.`;

function complianceUserPrompt(hypothesis: string, qcContext: QCResponse): string {
  const qcSummary =
    qcContext.ok === "verdict"
      ? `Lit-QC verdict: ${qcContext.verdict}\nReasoning: ${qcContext.reasoning}`
      : `Lit-QC verdict: ${qcContext.ok}`;
  return `HYPOTHESIS:\n${hypothesis}\n\nLIT-QC CONTEXT:\n${qcSummary}`;
}

const DEMO_PACE_MS = Number(process.env.SEXTANT_DEMO_PACE_MS ?? 0);

export async function runCompliance(args: {
  hypothesis: string;
  qcContext: QCResponse;
  modelId: string;
  writer: UIMessageStreamWriter;
  run_id: string;
}): Promise<{ slice: ComplianceSlice | null; elapsed_ms: number; error?: string }> {
  const { hypothesis, qcContext, modelId, writer, run_id } = args;
  const t0 = Date.now();

  writer.write({
    type: "data-trace",
    data: {
      stage: "started",
      run_id,
      agent_id: "compliance",
      task: "Drafting compliance notes + summary",
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
        agent_id: "compliance",
        activity: "Streaming compliance review from Gemini",
        ts: new Date().toISOString(),
      },
      transient: true,
    });
    const result = await generateObject({
      model: google(modelId),
      schema: complianceSliceSchema,
      system: COMPLIANCE_SYSTEM,
      prompt: complianceUserPrompt(hypothesis, qcContext),
      temperature: 0.2,
      maxOutputTokens: 1200,
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
        agent_id: "compliance",
        elapsed_ms: elapsed,
        output_preview: slice.compliance_summary.slice(0, 80),
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
        agent_id: "compliance",
        error_message: String(err).slice(0, 400),
        retryable: true,
        ts: new Date().toISOString(),
      },
      transient: true,
    });
    return { slice: null, elapsed_ms: elapsed, error: String(err) };
  }
}
