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
    // Two Google-provider tweaks needed for Gemini 2.5+ to produce a usable
    // structured response within the latency budget (D-52):
    //   1. structuredOutputs: false — Gemini's strict server-side enforcement
    //      on `oneOf` schemas (from z.discriminatedUnion) was making the model
    //      stall after committing to a const literal. We rely on the prompt's
    //      concrete-shape examples + Zod parse + repairDiscriminator instead.
    //   2. thinkingConfig.thinkingBudget: 0 — Gemini 2.5+ are "thinking"
    //      models that spend a large share of `maxOutputTokens` on internal
    //      chain-of-thought BEFORE emitting the visible response. With our
    //      800-token cap and a ~6k-token input prompt, the model burned ~766
    //      thinking tokens and produced only ~20 visible output tokens
    //      (truncating the JSON mid-string). Setting thinkingBudget=0 routes
    //      the entire output budget into the visible response.
    providerOptions: {
      google: {
        structuredOutputs: false,
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
    // Self-heal Gemini's discriminated-union mishaps. The Google provider
    // serializes `z.discriminatedUnion("ok", ...)` as JSON-Schema `oneOf`,
    // and Gemini sometimes strips or mislabels the `ok` discriminator. We
    // re-derive `ok` from the SHAPE of the emitted object before Zod parses
    // it. This is a RECONSTRUCTION (not invention) — every value still comes
    // from the model. CLAUDE.md hard rule #1 still holds because the
    // post-stream provenance check re-validates citations against Tavily URLs.
    experimental_repairText: async ({ text }) => repairDiscriminator(text),
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

/**
 * Reconstruct the discriminated-union `ok` field from the SHAPE of Gemini's
 * raw JSON output. Gemini's structured-output mode flattens `oneOf` schemas
 * and frequently emits a verdict-branch payload with `ok` missing or set to
 * the verdict label (e.g. `"ok":"similar-work-exists"`). We do NOT invent
 * field values — every key/value comes from the model. We only re-derive the
 * discriminator from the present field set so Zod can parse cleanly.
 *
 * The provenance check (D-37) still runs in onFinish and still drops any
 * citation whose URL is not in the Tavily evidence block — CLAUDE.md hard
 * rule #1 remains enforced.
 *
 * If the text is already valid JSON for one of the four branches, this
 * returns it unchanged (idempotent).
 */
function repairDiscriminator(text: string): string | null {
  try {
    const raw = JSON.parse(text) as Record<string, unknown>;
    const validOk = new Set([
      "verdict",
      "clarify",
      "no-evidence",
      "error",
    ]);
    // Always normalise the verdict-shape branch. The Zod schema caps
    // `reasoning` at 600 chars, `excerpt` at 280 chars, and `citations`
    // at 3 entries; Gemini frequently exceeds these. Truncating is a
    // bounded transformation, not invention — all content still comes
    // from the model.
    const hasVerdictLabel =
      typeof raw.verdict === "string" &&
      ["not-found", "similar-work-exists", "exact-match-found"].includes(
        raw.verdict,
      );
    const hasCitations = Array.isArray(raw.citations);
    const hasClarifyQuestion = typeof raw.clarify_question === "string";
    const hasRetryable = typeof raw.retryable === "boolean";
    const hasMessage = typeof raw.message === "string";

    const looksLikeVerdictBranch =
      (typeof raw.ok === "string" && raw.ok === "verdict") ||
      (hasVerdictLabel && hasCitations);

    if (looksLikeVerdictBranch && hasVerdictLabel && hasCitations) {
      const rawCitations = (raw.citations as unknown[]).slice(0, 3);
      const citations = rawCitations.map((c) => {
        if (typeof c === "string") {
          // Bare URL string — synthesise a minimal citation object.
          const url = c;
          return {
            title: url.slice(0, 280),
            url,
            excerpt: url.slice(0, 280),
            source: "other" as const,
          };
        }
        const obj = c as Record<string, unknown>;
        const excerpt =
          typeof obj.excerpt === "string"
            ? obj.excerpt.slice(0, 280)
            : "(no excerpt)";
        const title =
          typeof obj.title === "string" ? obj.title : "(untitled)";
        const url =
          typeof obj.url === "string" ? obj.url : "https://example.invalid/";
        const source =
          typeof obj.source === "string" &&
          ["arxiv", "semantic-scholar", "protocols-io", "other"].includes(
            obj.source,
          )
            ? obj.source
            : "other";
        return { title, url, excerpt, source };
      });
      const reasoning =
        typeof raw.reasoning === "string"
          ? raw.reasoning.slice(0, 600)
          : "(no reasoning provided)";
      return JSON.stringify({
        ok: "verdict",
        verdict: raw.verdict,
        reasoning,
        citations,
      });
    }
    // Discriminator already correct for non-verdict branch — return as-is.
    if (typeof raw.ok === "string" && validOk.has(raw.ok)) {
      return text;
    }
    if (hasClarifyQuestion) {
      return JSON.stringify({
        ok: "clarify",
        clarify_question: raw.clarify_question,
      });
    }
    if (hasRetryable && hasMessage) {
      return JSON.stringify({
        ok: "error",
        message: raw.message,
        retryable: raw.retryable,
      });
    }
    if (hasMessage) {
      return JSON.stringify({
        ok: "no-evidence",
        message: raw.message,
      });
    }
    // Cannot infer branch — let the SDK surface the original validation error.
    return null;
  } catch {
    // Not JSON at all — let the SDK surface the JSON parse error.
    return null;
  }
}
