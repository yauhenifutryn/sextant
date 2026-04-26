/**
 * Skeptic agent (D-54, D-55, D-57 — owns Validation section).
 *
 * No fresh Tavily — works from shared QC context only (D-56).
 * MUST emit the 6 VALIDATION_SKELETON names from src/components/trace-rail.tsx
 * verbatim (D-58 footnote / "Specific Ideas" in CONTEXT.md). Phase 6 wires the
 * placeholder grid to tick green from these names.
 *
 * thinkingBudget: 0 for fast structured output (D-55).
 * 35s per-agent timeout (D-66).
 * Honors SEXTANT_DEMO_PACE_MS for demo recording.
 *
 * Server-side guarantee: if the model omits any of the 6 required names, we
 * append minimal stubs after parse. This is RECONSTRUCTION (filling required
 * names), not invention — the measurement_method content stays generic.
 */
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type { UIMessageStreamWriter } from "ai";
import { validationCheckSchema } from "@/lib/plan/schema";
import type { QCResponse } from "@/lib/qc/schema";
import type { LabRule } from "@/lib/lab-rules/schema";

export const skepticSliceSchema = z.object({
  validation: z.array(validationCheckSchema).min(5),
});
export type SkepticSlice = z.infer<typeof skepticSliceSchema>;

const REQUIRED_VALIDATION_NAMES = [
  "Every reagent has a catalog URL",
  "Budget sums correctly",
  "No orphan protocol step",
  "Citations resolve to real sources",
  "Timeline dependencies valid",
  "Compliance pipeline passes",
];

const SKEPTIC_SYSTEM = `You are the Skeptic agent in a 4-agent experiment-plan pipeline.

Your job: emit a list of validation checks that MUST pass before this experiment is run. The downstream Phase 6 trace UI will tick each check green/red as it runs.

Output a single JSON object: { "validation": [{ name, description, measurement_method, pass_criteria }, ...] }

HARD REQUIREMENT — these 6 check NAMES must appear VERBATIM (exact spelling, exact case) in your validation array, with appropriate description / measurement_method / pass_criteria you fill in for THIS hypothesis:
1. "Every reagent has a catalog URL"
2. "Budget sums correctly"
3. "No orphan protocol step"
4. "Citations resolve to real sources"
5. "Timeline dependencies valid"
6. "Compliance pipeline passes"

You MAY add more hypothesis-specific checks beyond these 6 (e.g., "Sample storage temperature within spec", "Calibration curve R² ≥ 0.99"). Total array length: 6-10 entries.

For each check:
- description: 1-2 sentences explaining what the check verifies.
- measurement_method: how to measure (e.g., "Cross-reference materials[].catalog_number against supplier API", "Sum budget[].amount_usd vs declared total").
- pass_criteria: the threshold (e.g., "100% of materials have non-null catalog_number", "Sum matches within ±$0.01").

Emit ONLY the JSON object. No prose, no markdown fencing.`;

function skepticUserPrompt(
  hypothesis: string,
  qcContext: QCResponse,
  labRules: LabRule[],
): string {
  const qcSummary =
    qcContext.ok === "verdict"
      ? `Lit-QC verdict: ${qcContext.verdict}\nReasoning: ${qcContext.reasoning}`
      : `Lit-QC verdict: ${qcContext.ok}`;
  // D7-09: append the LAB RULES block AFTER existing context.
  const labRulesBlock =
    labRules.length > 0
      ? `\n\nLAB RULES (apply these to your output):\n${labRules
          .map((r) => `- ${r.rule} (because: ${r.reasoning})`)
          .join("\n")}`
      : "";
  return `HYPOTHESIS:\n${hypothesis}\n\nLIT-QC CONTEXT:\n${qcSummary}${labRulesBlock}`;
}

const DEMO_PACE_MS = Number(process.env.SEXTANT_DEMO_PACE_MS ?? 0);

export async function runSkeptic(args: {
  hypothesis: string;
  qcContext: QCResponse;
  modelId: string;
  writer: UIMessageStreamWriter;
  run_id: string;
  labRules?: LabRule[];
}): Promise<{ slice: SkepticSlice | null; elapsed_ms: number; error?: string }> {
  const { hypothesis, qcContext, modelId, writer, run_id, labRules = [] } = args;
  const t0 = Date.now();

  writer.write({
    type: "data-trace",
    data: {
      stage: "started",
      run_id,
      agent_id: "skeptic",
      task: "Drafting validation checks (≥5)",
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
        agent_id: "skeptic",
        activity: "Streaming validation grid from Gemini",
        ts: new Date().toISOString(),
      },
      transient: true,
    });
    const result = await generateObject({
      model: google(modelId),
      schema: skepticSliceSchema,
      system: SKEPTIC_SYSTEM,
      prompt: skepticUserPrompt(hypothesis, qcContext, labRules),
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
    let slice = result.object;

    // Server-side guarantee: ensure all 6 REQUIRED_VALIDATION_NAMES appear.
    // The model SHOULD emit them per the prompt; if it drops one, append a
    // minimal stub so Phase 6's grid still ticks green from real data.
    // This is reconstruction (filling missing required names), not invention
    // (we never invent measurement_method content beyond a generic stub).
    const presentNames = new Set(slice.validation.map((v) => v.name));
    const missing = REQUIRED_VALIDATION_NAMES.filter((n) => !presentNames.has(n));
    if (missing.length > 0) {
      slice = {
        ...slice,
        validation: [
          ...slice.validation,
          ...missing.map((name) => ({
            name,
            description: "Required validation check (auto-stub — model omitted).",
            measurement_method: "TBD by Phase 6 evaluator.",
            pass_criteria: "Manual review.",
          })),
        ],
      };
    }

    const elapsed = Date.now() - t0;
    writer.write({
      type: "data-trace",
      data: {
        stage: "done",
        run_id,
        agent_id: "skeptic",
        elapsed_ms: elapsed,
        output_preview: `${slice.validation.length} checks`,
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
        agent_id: "skeptic",
        error_message: String(err).slice(0, 400),
        retryable: true,
        ts: new Date().toISOString(),
      },
      transient: true,
    });
    return { slice: null, elapsed_ms: elapsed, error: String(err) };
  }
}
