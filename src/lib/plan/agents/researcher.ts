/**
 * Researcher agent (D-54, D-55, D-56, D-57 — owns Protocol section).
 *
 * - One fresh Tavily call filtered client-side to protocols.io results (D-56).
 * - System prompt is STABLE (Google implicit prefix-cache).
 * - Hypothesis + lit-QC context + protocols.io evidence are user data.
 * - Emits citations: [] for every step (Phase 5 fills, D-59).
 * - Emits started + ≥1 working + (done|error) AgentEvents per D-61.
 * - thinkingBudget: 0 for fast structured output (D-55).
 * - 35s per-agent timeout (D-66).
 * - Honors SEXTANT_DEMO_PACE_MS (server-only env) so Phase 8 demo recording can
 *   slow the trace rail to a visible pace without code changes.
 */
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type { UIMessageStreamWriter } from "ai";
import { protocolStepSchema } from "@/lib/plan/schema";
import type { QCResponse } from "@/lib/qc/schema";
import { tavilySearch, type TavilyResult } from "@/lib/tavily";

export const researcherSliceSchema = z.object({
  protocol: z.array(protocolStepSchema).min(3),
});
export type ResearcherSlice = z.infer<typeof researcherSliceSchema>;

const RESEARCHER_SYSTEM = `You are the Researcher agent in a 4-agent experiment-plan pipeline.

Your job: turn the supplied hypothesis + lit-QC context + protocols.io evidence into a numbered methodology — 3 to 8 protocol steps an experimenter could follow.

Output a single JSON object: { "protocol": [{ step_number, description, duration_estimate, citations: [] }, ...] }

Rules:
- Each step has a clear ACTION (verb-first), an estimated duration ("30 min", "2 h", "overnight"), and a 1-2 sentence description.
- Steps are numbered starting at 1, contiguous.
- "citations" is ALWAYS [] — Phase 5 fills citations from supplier/protocol pages. Do NOT invent URLs (CLAUDE.md hard rule #1).
- Ground your method in the supplied protocols.io evidence when present; otherwise produce a defensible standard protocol for this hypothesis class.

Emit ONLY the JSON object. No prose, no markdown fencing.`;

function researcherUserPrompt(
  hypothesis: string,
  qcContext: QCResponse,
  protocolsResults: TavilyResult[],
): string {
  const evidence = protocolsResults
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\n    URL: ${r.url}\n    Excerpt: ${r.content}`,
    )
    .join("\n\n");
  const qcSummary =
    qcContext.ok === "verdict"
      ? `Lit-QC verdict: ${qcContext.verdict}\nReasoning: ${qcContext.reasoning}\nCitations: ${qcContext.citations.map((c) => c.url).join(", ")}`
      : `Lit-QC verdict: ${qcContext.ok}`;
  return `HYPOTHESIS:\n${hypothesis}\n\nLIT-QC CONTEXT:\n${qcSummary}\n\nPROTOCOL EVIDENCE BLOCK (${protocolsResults.length} results from protocols.io):\n${evidence || "(none — proceed with standard protocol)"}`;
}

const DEMO_PACE_MS = Number(process.env.SEXTANT_DEMO_PACE_MS ?? 0);

export async function runResearcher(args: {
  hypothesis: string;
  qcContext: QCResponse;
  modelId: string;
  writer: UIMessageStreamWriter;
  run_id: string;
}): Promise<{ slice: ResearcherSlice | null; elapsed_ms: number; error?: string }> {
  const { hypothesis, qcContext, modelId, writer, run_id } = args;
  const t0 = Date.now();

  writer.write({
    type: "data-trace",
    data: {
      stage: "started",
      run_id,
      agent_id: "researcher",
      task: `Drafting protocol from ${qcContext.ok === "verdict" ? qcContext.verdict : "lit-QC context"}`,
      ts: new Date().toISOString(),
    },
    transient: true,
  });
  if (DEMO_PACE_MS > 0) await new Promise((r) => setTimeout(r, DEMO_PACE_MS));

  // D-56: ONE Tavily call for protocols.io grounding. Non-fatal on failure.
  let protocolsResults: TavilyResult[] = [];
  try {
    writer.write({
      type: "data-trace",
      data: {
        stage: "working",
        run_id,
        agent_id: "researcher",
        activity: "Calling protocols.io via Tavily",
        ts: new Date().toISOString(),
      },
      transient: true,
    });
    const all = await tavilySearch(`${hypothesis} protocol`);
    protocolsResults = all.filter((r) => r.url.includes("protocols.io")).slice(0, 5);
  } catch {
    // non-fatal — researcher proceeds with shared QC context only
  }

  try {
    writer.write({
      type: "data-trace",
      data: {
        stage: "working",
        run_id,
        agent_id: "researcher",
        activity: "Streaming protocol from Gemini",
        ts: new Date().toISOString(),
      },
      transient: true,
    });
    const result = await generateObject({
      model: google(modelId),
      schema: researcherSliceSchema,
      system: RESEARCHER_SYSTEM,
      prompt: researcherUserPrompt(hypothesis, qcContext, protocolsResults),
      temperature: 0.2,
      maxOutputTokens: 1500,
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
        agent_id: "researcher",
        elapsed_ms: elapsed,
        output_preview: slice.protocol[0]?.description.slice(0, 80),
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
        agent_id: "researcher",
        error_message: String(err).slice(0, 400),
        retryable: true,
        ts: new Date().toISOString(),
      },
      transient: true,
    });
    return { slice: null, elapsed_ms: elapsed, error: String(err) };
  }
}
