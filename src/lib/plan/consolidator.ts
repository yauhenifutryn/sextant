/**
 * Consolidator (D-54 — 5th LLM call merging 4 agent slices into a Plan).
 *
 * Differences from the 4 debater agents:
 *   - thinkingBudget: 4000 (D-55) — synthesis quality matters across 4 inputs.
 *   - timeout: 15_000 (D-66) — synthesis is bounded; faster ceiling.
 *   - schema: planSchema (top-level), not a slice.
 *   - No Tavily — pure synthesis from in-memory inputs.
 *   - Server-side post-fill: run_id, model_id, latency_ms, generated_at,
 *     grounded:false, agent_artifacts are reconstructed by THIS function
 *     (not the LLM) so the model cannot inject false metadata.
 *
 * Honors SEXTANT_DEMO_PACE_MS for demo recording.
 */
import { streamObject } from "ai";
import { google } from "@ai-sdk/google";
import type { UIMessageStreamWriter } from "ai";
import { planSchema, type Plan, type AgentArtifact } from "@/lib/plan/schema";

const CONSOLIDATOR_SYSTEM = `You are the Consolidator agent. You receive 4 JSON drafts from Researcher / Skeptic / Operator / Compliance agents and merge them into a single Plan JSON matching the supplied schema.

Rules:
- Do NOT invent content. Use only what the 4 drafts provide.
- Where drafts conflict, prefer the agent that owns that section: Researcher owns protocol; Operator owns materials/budget/timeline; Skeptic owns validation; Compliance owns compliance_notes/compliance_summary.
- For any agent slice that is null (errored), emit a placeholder section with description "(agent failed — see agent_artifacts.<role>.error)" and a single placeholder entry so downstream renders do not crash.
- Set "grounded": false (Phase 5 will flip this).
- Set "citations": [] for every row (Phase 5 fills these).
- Do NOT touch agent_artifacts — it's reconstructed server-side; emit it as { researcher: {raw_draft:{},model_id:"",elapsed_ms:0}, skeptic: ..., operator: ..., compliance: ... } and the server overwrites.
- Echo run_id, hypothesis, qc_run_id, model_id, latency_ms, generated_at as supplied; the server overwrites those too.

Emit ONLY the JSON object. No prose, no markdown fencing.`;

function buildConsolidatorPrompt(args: {
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
}): string {
  return `RUN METADATA:
run_id: ${args.run_id}
qc_run_id: ${args.qc_run_id ?? "null"}
model_id: ${args.modelId}
hypothesis: ${args.hypothesis}

AGENT DRAFTS (JSON):

[RESEARCHER] (owns protocol):
${JSON.stringify(args.slices.researcher, null, 2)}

[SKEPTIC] (owns validation):
${JSON.stringify(args.slices.skeptic, null, 2)}

[OPERATOR] (owns materials + budget + timeline):
${JSON.stringify(args.slices.operator, null, 2)}

[COMPLIANCE] (owns compliance_notes + compliance_summary):
${JSON.stringify(args.slices.compliance, null, 2)}

Merge into a single Plan JSON matching the schema. Apply the section-ownership rule above when filling each field.`;
}

const DEMO_PACE_MS = Number(process.env.SEXTANT_DEMO_PACE_MS ?? 0);

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

  const result = streamObject({
    model: google(args.modelId),
    schema: planSchema,
    system: CONSOLIDATOR_SYSTEM,
    prompt: buildConsolidatorPrompt(args),
    temperature: 0.1,
    maxOutputTokens: 4000,
    providerOptions: {
      google: {
        structuredOutputs: false,
        thinkingConfig: { thinkingBudget: 4000 }, // D-55
      },
    },
    abortSignal: AbortSignal.timeout(15_000), // D-66
  });
  const draft = await result.object;

  // Server-side post-fill: overwrite metadata + artifacts so the LLM cannot
  // inject false provenance. CLAUDE.md hard rule #1 spirit: only the server
  // chooses the run_id, model_id, timestamps, and the artifact summaries.
  const plan: Plan = {
    ...draft,
    run_id: args.run_id,
    hypothesis: args.hypothesis,
    qc_run_id: args.qc_run_id,
    grounded: false, // D-59
    model_id: args.modelId,
    latency_ms: Date.now() - t0,
    generated_at: new Date().toISOString(),
    agent_artifacts: args.artifacts,
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
