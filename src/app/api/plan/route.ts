/**
 * POST /api/plan — Multi-agent experiment-plan route (D-54..D-67).
 *
 * Pipeline:
 *   1. Parse {hypothesis: string, qc_run_id?: string | null, qcContext?: QCResponse}.
 *   2. Cache short-circuit by SHA-256(hypothesis.trim().toLowerCase()) — D-65.
 *      Cache hit returns the cached Plan as a single data-plan part on a stream
 *      (so the client's useChat onData fires the same way).
 *   3. Pick the available Gemini model ONCE (D-55) and pass to all 5 agents.
 *   4. createUIMessageStream → execute(writer): fan out 4 agents via Promise.allSettled
 *      (each writes its own started/working/done events to the writer), then run
 *      the consolidator (5th call), then write the final data-plan part.
 *   5. setCachedRun + fire-and-forget disk write to data/runs/<run_id>.json (D-64).
 *
 * Failure isolation: a single agent failure does NOT abort the run; consolidator
 * receives the null slice for that agent + a placeholder artifact (D-54, D-66).
 *
 * Runtime: "nodejs" (crypto.subtle + AbortSignal.timeout).
 * maxDuration: 60 — D-66 worst-case 50s; pad to Vercel cap.
 */
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { pickAvailableLitQcModel } from "@/lib/models";
import {
  hashRunInput,
  getCachedRun,
  setCachedRun,
} from "@/lib/plan/cache";
import { getLabRules } from "@/lib/lab-rules/store";
import type { LabRule } from "@/lib/lab-rules/schema";
import type { Plan, AgentArtifact } from "@/lib/plan/schema";
import { runResearcher } from "@/lib/plan/agents/researcher";
import { runSkeptic } from "@/lib/plan/agents/skeptic";
import { runOperator } from "@/lib/plan/agents/operator";
import { runCompliance } from "@/lib/plan/agents/compliance";
import { runConsolidator } from "@/lib/plan/consolidator";
import { enrichMaterialsCitations } from "@/lib/plan/citations";
import type { QCResponse } from "@/lib/qc/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

type PlanRequest = {
  hypothesis: string;
  qc_run_id?: string | null;
  qcContext?: QCResponse;
};

/**
 * Hand-rolled monotonic URL-safe ID — replaces the `ulid` dep ask in D-68.
 * Per CONTEXT.md "Claude's Discretion" the picker is Claude's call provided
 * the ID is monotonic and URL-safe. Date.now() in base36 is monotonic;
 * randomUUID().slice(0,8) gives 8 hex chars of collision resistance.
 * Honors CLAUDE.md hard rule #5 (no new deps without justification).
 */
function newRunId(): string {
  return `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
}

function logEvent(line: Record<string, unknown>): void {
  console.log(JSON.stringify(line));
}

export async function POST(req: Request) {
  const t0 = Date.now();
  const body = (await req.json()) as PlanRequest;
  const hypothesis = body.hypothesis;
  const qc_run_id = body.qc_run_id ?? null;
  // qcContext is optional — when the dashboard auto-fires after a QC verdict
  // it passes the verdict object so the agents can ground in real evidence.
  // If absent, agents fall back to a synthetic "no-evidence" stub so the
  // pipeline still produces something demoable for direct API tests.
  const qcContext: QCResponse =
    body.qcContext ?? {
      ok: "no-evidence",
      message: "No prior lit-QC context supplied.",
    };

  // D7-08: load the in-effect lab rules ONCE per request. Read-through from
  // disk; ~10 rules max in demo. We pass the list to all 4 agent runners and
  // also include it in the cache key so Plan A (no rules) and Plan B (rules
  // captured) get DIFFERENT cache entries (D7-11, PROP-02 prerequisite).
  const labRules: LabRule[] = await getLabRules();

  const hypothesis_hash = await hashRunInput(hypothesis, labRules);
  const run_id = newRunId();

  // ---- Cache short-circuit (D-65). Same-stream shape so client decodes
  // the cached Plan via the same useChat onData path.
  const cached = await getCachedRun(hypothesis_hash);
  if (cached) {
    logEvent({
      event: "plan.cache.hit",
      run_id: cached.run_id,
      hypothesis_hash,
      latency_ms: Date.now() - t0,
    });
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({
          type: "data-plan",
          data: cached as unknown as Record<string, unknown>,
        });
      },
    });
    return createUIMessageStreamResponse({ stream });
  }

  logEvent({
    event: "plan.run.started",
    run_id,
    hypothesis_hash,
    qc_run_id,
    hypothesis_len: hypothesis.length,
    lab_rules_count: labRules.length,
  });

  // ---- Pick the available Gemini model ONCE; share across all 5 calls (D-55).
  const modelId = await pickAvailableLitQcModel();

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // ---- Fan out 4 agents in parallel (D-54). Promise.allSettled so
      // a single agent failure does NOT abort the run (D-66).
      const [resR, resS, resO, resC] = await Promise.allSettled([
        runResearcher({ hypothesis, qcContext, modelId, writer, run_id, labRules }),
        runSkeptic({ hypothesis, qcContext, modelId, writer, run_id, labRules }),
        runOperator({ hypothesis, qcContext, modelId, writer, run_id, labRules }),
        runCompliance({ hypothesis, qcContext, modelId, writer, run_id, labRules }),
      ]);

      // Unwrap to {slice, elapsed_ms, error?} or build a null-slice artifact.
      const unwrap = <T,>(
        res: PromiseSettledResult<{
          slice: T | null;
          elapsed_ms: number;
          error?: string;
        }>,
      ): { slice: T | null; elapsed_ms: number; error?: string } => {
        if (res.status === "fulfilled") return res.value;
        return { slice: null, elapsed_ms: 0, error: String(res.reason) };
      };
      const r = unwrap(resR);
      const s = unwrap(resS);
      const o = unwrap(resO);
      const c = unwrap(resC);

      const artifact = (
        v: { slice: unknown; elapsed_ms: number; error?: string },
      ): AgentArtifact => ({
        raw_draft: (v.slice ?? {}) as Record<string, unknown>,
        model_id: modelId,
        elapsed_ms: v.elapsed_ms,
        error: v.error,
      });
      const artifacts = {
        researcher: artifact(r),
        skeptic: artifact(s),
        operator: artifact(o),
        compliance: artifact(c),
      };

      logEvent({
        event: "plan.agents.completed",
        run_id,
        researcher_ok: r.slice !== null,
        skeptic_ok: s.slice !== null,
        operator_ok: o.slice !== null,
        compliance_ok: c.slice !== null,
        agents_elapsed_max_ms: Math.max(
          r.elapsed_ms,
          s.elapsed_ms,
          o.elapsed_ms,
          c.elapsed_ms,
        ),
      });

      // ---- Consolidator (5th call) — D-54.
      let plan: Plan;
      try {
        plan = await runConsolidator({
          hypothesis,
          qc_run_id,
          run_id,
          modelId,
          slices: {
            researcher: r.slice,
            skeptic: s.slice,
            operator: o.slice,
            compliance: c.slice,
          },
          artifacts,
          writer,
        });
      } catch (err) {
        // Consolidator failure: emit error event + write a structurally-valid
        // empty-shell event so the client can still narrow + render an error
        // state. D-67: no retry inside Phase 3.
        writer.write({
          type: "data-trace",
          data: {
            stage: "error",
            run_id,
            agent_id: "consolidator",
            error_message: String(err).slice(0, 400),
            retryable: false,
            ts: new Date().toISOString(),
          },
          transient: true,
        });
        logEvent({
          event: "plan.consolidator.failed",
          run_id,
          error: String(err),
          latency_ms: Date.now() - t0,
        });
        // Do NOT setCachedRun — the shell is not a real Plan.
        return;
      }

      // ---- Phase 5 LITE: enrich Materials with one Tavily call.
      // Failures return [] and we leave plan as-is (CLAUDE.md hard rule #1
      // — no fake citations). See .planning/DEFERRED.md for per-row + URL
      // verify scope cuts.
      const materialsCitations = await enrichMaterialsCitations(plan);
      if (materialsCitations.length > 0) {
        plan.plan.materials = plan.plan.materials.map((m) => ({
          ...m,
          citations: materialsCitations,
        }));
        plan.grounded = true;
      }

      // ---- Persist (D-64) — both in-memory and disk.
      setCachedRun(hypothesis_hash, plan);

      // ---- Final data-plan part. transient defaults to false so the client
      // receives it via onData AND it persists in message.parts (Phase 7 may inspect).
      writer.write({
        type: "data-plan",
        data: plan as unknown as Record<string, unknown>,
      });

      logEvent({
        event: "plan.run.completed",
        run_id,
        latency_ms: Date.now() - t0,
        model_id: modelId,
        agents_succeeded: [r, s, o, c].filter((x) => x.slice !== null).length,
        validation_count: plan.plan.validation.length,
      });
    },
  });

  return createUIMessageStreamResponse({ stream });
}
