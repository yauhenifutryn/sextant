/**
 * POST /api/qc — Literature QC route (D-39).
 *
 * Pipeline:
 *   1. Parse {hypothesis: string}.
 *   2. Cache short-circuit (D-50). Hits return plain JSON instantly.
 *   3. Tavily search (D-31, D-32, D-33). Failure → typed {ok:"error", retryable:false}.
 *   4. streamObject (D-34, D-38) — Gemini emits a discriminated-union object.
 *   5. onFinish: validateCitationProvenance (D-37) → setCached. NEVER fabricates
 *      a verdict on schema-validation failure (D-49 + CLAUDE.md hard rule #1).
 *   6. result.toTextStreamResponse() — the only protocol useObject decodes
 *      (AI-SPEC §3 Pitfall #5).
 *
 * Runtime: "nodejs" (crypto.subtle + AbortSignal.timeout per AI-SPEC §3 Pitfall #7).
 * maxDuration: 30 (Vercel cap; <8s real budget per D-52).
 */
import { streamObject } from "ai";
import { google } from "@ai-sdk/google";
import { qcResponseSchema, type QCResponse } from "@/lib/qc/schema";
import { qcSystemPrompt, qcUserPrompt } from "@/lib/qc/prompt";
import { tavilySearch, type TavilyResult } from "@/lib/tavily";
import { hashHypothesis, getCached, setCached } from "@/lib/qc/cache";
import { validateCitationProvenance } from "@/lib/qc/provenance";
import { LIT_QC_MODEL_ID } from "@/lib/models";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const t0 = Date.now();
  const { hypothesis } = (await req.json()) as { hypothesis: string };
  const key = await hashHypothesis(hypothesis);

  // ---- Cache short-circuit (D-50). Plain JSON, not a stream.
  const cached = getCached(key);
  if (cached) {
    logRequest({
      ts: new Date().toISOString(),
      hypothesis_len: hypothesis.length,
      hypothesis_hash: key,
      cache_hit: true,
      tavily_results: 0,
      verdict_ok: cached.ok,
      verdict_label: cached.ok === "verdict" ? cached.verdict : null,
      citations_in: cached.ok === "verdict" ? cached.citations.length : 0,
      citations_provenance_dropped: 0,
      schema_valid: true,
      latency_ms: Date.now() - t0,
      model_id: LIT_QC_MODEL_ID,
    });
    return Response.json(cached);
  }

  // ---- Retrieve (D-31, D-32, D-33). Single broad Tavily call. No retry in v1.
  let tavilyResults: TavilyResult[];
  try {
    tavilyResults = await tavilySearch(hypothesis);
  } catch {
    const errorResponse: QCResponse = {
      ok: "error",
      message: "Literature search service is unavailable.",
      retryable: false,
    };
    logRequest({
      ts: new Date().toISOString(),
      hypothesis_len: hypothesis.length,
      hypothesis_hash: key,
      cache_hit: false,
      tavily_results: 0,
      verdict_ok: "error",
      verdict_label: null,
      citations_in: 0,
      citations_provenance_dropped: 0,
      schema_valid: true,
      latency_ms: Date.now() - t0,
      model_id: LIT_QC_MODEL_ID,
    });
    return Response.json(errorResponse);
  }

  // ---- Stream-judge (D-34, D-38).
  const result = streamObject({
    model: google(LIT_QC_MODEL_ID),
    schema: qcResponseSchema,
    system: qcSystemPrompt,
    prompt: qcUserPrompt(hypothesis, tavilyResults),
    temperature: 0.2,
    // Cap at maxTokens: 800 tokens of output (D-22a + AI-SPEC §4 model config).
    // AI SDK v5 spells the option as `maxOutputTokens`; same intent.
    maxOutputTokens: 800,
    onFinish: ({ object, error }) => {
      // D-49: NEVER silently substitute a verdict on validation failure.
      if (error || !object) {
        logRequest({
          ts: new Date().toISOString(),
          hypothesis_len: hypothesis.length,
          hypothesis_hash: key,
          cache_hit: false,
          tavily_results: tavilyResults.length,
          verdict_ok: "error",
          verdict_label: null,
          citations_in: 0,
          citations_provenance_dropped: 0,
          schema_valid: false,
          latency_ms: Date.now() - t0,
          model_id: LIT_QC_MODEL_ID,
        });
        return;
      }
      // D-37: post-stream URL provenance guard. Drop confabulated citations;
      // if <2 valid remain, upgrade to {ok:"no-evidence"}.
      const outcome = validateCitationProvenance(object, tavilyResults);
      setCached(key, outcome.response);
      logRequest({
        ts: new Date().toISOString(),
        hypothesis_len: hypothesis.length,
        hypothesis_hash: key,
        cache_hit: false,
        tavily_results: tavilyResults.length,
        verdict_ok: outcome.response.ok,
        verdict_label:
          outcome.response.ok === "verdict"
            ? outcome.response.verdict
            : null,
        citations_in:
          outcome.response.ok === "verdict"
            ? outcome.response.citations.length
            : 0,
        citations_provenance_dropped: outcome.droppedCount,
        schema_valid: true,
        latency_ms: Date.now() - t0,
        model_id: LIT_QC_MODEL_ID,
      });
    },
  });

  // ---- Stream the partial object back to the client (D-38).
  // toTextStreamResponse() is the only protocol useObject decodes; the
  // chat-message variant is the wrong helper here (AI-SPEC §3 Pitfall #5).
  return result.toTextStreamResponse();
}

/**
 * Structured single-line log for Vercel log viewer (AI-SPEC §7).
 * No PII, no full hypothesis text — hash correlates retries.
 */
type RequestLog = {
  ts: string;
  hypothesis_len: number;
  hypothesis_hash: string;
  cache_hit: boolean;
  tavily_results: number;
  verdict_ok: QCResponse["ok"] | "unknown";
  verdict_label: string | null;
  citations_in: number;
  citations_provenance_dropped: number;
  schema_valid: boolean;
  latency_ms: number;
  model_id: string;
};

function logRequest(line: RequestLog): void {
  console.log(JSON.stringify({ event: "qc.request", ...line }));
}
