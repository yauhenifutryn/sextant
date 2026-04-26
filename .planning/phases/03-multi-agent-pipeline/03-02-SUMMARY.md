---
phase: 03-multi-agent-pipeline
plan: 02
subsystem: multi-agent-runners-and-consolidator
tags: [phase-3, multi-agent, agents, llm, researcher, skeptic, operator, compliance, consolidator]
requires: [phase-3-wave-1-foundations]
provides: [agent-runners, consolidator, sliced-schemas]
affects: [phase-3-wave-3-route, phase-6-trace-rail, phase-5-grounding]
tech-stack:
  added: []
  patterns:
    - "Per-agent runner (D-54): streamObject + sliceSchema + lifecycle event triplet"
    - "Section ownership (D-57): Researcher→protocol, Operator→materials/budget/timeline, Skeptic→validation, Compliance→notes+summary"
    - "Tiered thinkingBudget (D-55): 0 for 4 debaters, 4000 for consolidator"
    - "Per-tier timeouts (D-66): 35s per debater, 15s consolidator"
    - "Server-side metadata post-fill in consolidator: model cannot inject run_id/model_id/latency/grounded/agent_artifacts"
    - "Skeleton-name guarantee in Skeptic: REQUIRED_VALIDATION_NAMES Set diff + auto-stub for any model omissions"
    - "SEXTANT_DEMO_PACE_MS env-var awaited setTimeout between started event and LLM call (Phase 8 demo recording)"
    - "transient: true on writer.write so events flow through onData callback only (AI SDK v5 — not persisted in message.parts)"
key-files:
  created:
    - "src/lib/plan/agents/researcher.ts (162 lines) — Tavily-grounded protocol owner"
    - "src/lib/plan/agents/skeptic.ts (175 lines) — validation owner with 6-name guarantee"
    - "src/lib/plan/agents/operator.ts (151 lines) — materials+budget+timeline in one prompt"
    - "src/lib/plan/agents/compliance.ts (136 lines) — notes[] + summary"
    - "src/lib/plan/consolidator.ts (148 lines) — 5th LLM call, planSchema synthesis"
  modified: []
decisions:
  - "Wrote files verbatim per plan-supplied module bodies — no schema/prompt deviations (D-54..D-67 are locked)"
  - "Skeptic's REQUIRED_VALIDATION_NAMES enforced both in prompt (model SHOULD emit) and via post-parse Set-diff stub fallback (server GUARANTEES). The fallback uses generic content (description='Required validation check (auto-stub — model omitted).', measurement_method='TBD by Phase 6 evaluator.', pass_criteria='Manual review.') — this is reconstruction (filling missing required names), not invention"
  - "Consolidator uses object-spread for post-fill (`{...draft, run_id: args.run_id, ...}`) instead of in-place mutation (`plan.run_id = ...`); identical behavior, cleaner immutability, satisfies the spirit of the acceptance criterion (server overwrites all 7 metadata fields explicitly: run_id, hypothesis, qc_run_id, grounded, model_id, latency_ms, generated_at, agent_artifacts)"
  - "Researcher emits 5 lifecycle events (started + 2 working + done; or started + 2 working + error) instead of 4 — the extra working event covers the Tavily call separately from the Gemini stream so trace rail can show both"
metrics:
  duration_sec: ~600
  completed_at: "2026-04-26T11:05Z"
  task_count: 3
  file_count: 5
  commits: 3
---

# Phase 3 Plan 02: Agent Runners + Consolidator Summary

**One-liner:** Shipped the 5 LLM-call modules (4 parallel agent runners + 1 consolidator) wrapping `streamObject` with the lifecycle-event triplet, section-ownership rule (D-57), tiered thinkingBudget (D-55), and Skeptic's 6-name skeleton guarantee — Wave 3 route handler can now `Promise.allSettled` the 4 agents and pipe slices through the consolidator.

## What Shipped

### Files Created

| File                                       | Lines | Provides                                                                             |
| ------------------------------------------ | ----- | ------------------------------------------------------------------------------------ |
| `src/lib/plan/agents/researcher.ts`        | 162   | `runResearcher`, `researcherSliceSchema`, `ResearcherSlice`                          |
| `src/lib/plan/agents/skeptic.ts`           | 175   | `runSkeptic`, `skepticSliceSchema`, `SkepticSlice`                                   |
| `src/lib/plan/agents/operator.ts`          | 151   | `runOperator`, `operatorSliceSchema`, `OperatorSlice`                                |
| `src/lib/plan/agents/compliance.ts`        | 136   | `runCompliance`, `complianceSliceSchema`, `ComplianceSlice`                          |
| `src/lib/plan/consolidator.ts`             | 148   | `runConsolidator` (returns top-level Plan with server-controlled metadata)           |

**Total:** 772 lines across 5 new TypeScript files.

### Files Modified

None.

## Commits

| Hash      | Message                                                                                       |
| --------- | --------------------------------------------------------------------------------------------- |
| `61299fb` | feat(03-02): add Researcher + Skeptic agent runners (D-54..D-57, D-66)                        |
| `f85b245` | feat(03-02): add Operator + Compliance agent runners (D-54..D-57, D-66)                       |
| `42b1ba6` | feat(03-02): add Consolidator (5th LLM call merging 4 slices, D-54..D-55, D-66)               |

## Verification Results

All plan-spec acceptance grep chains pass first-time, no auto-fixes needed.

### Per-task acceptance

**Task 1 (researcher.ts + skeptic.ts):**
- Both files exist; both export their `runX` async function (1 each)
- Researcher imports and uses `tavilySearch` (2 refs); filters to `protocols.io` (8 refs total in code + comments + prompt + filter call)
- Skeptic has zero `tavilySearch` refs (no Tavily by design — D-56)
- Skeptic includes all 6 VALIDATION_SKELETON names verbatim: 12 grep hits (each name appears in `REQUIRED_VALIDATION_NAMES` + in the SYSTEM prompt string, ×6)
- Both use `thinkingBudget: 0` (debater-tier per D-55)
- Both use `AbortSignal.timeout(35_000)` (D-66)
- Researcher emits 5 stage events (started + 2 working + done + error path); Skeptic emits 4
- Both honor `SEXTANT_DEMO_PACE_MS`

**Task 2 (operator.ts + compliance.ts):**
- Both files exist; both export their `runX` async function
- Operator slice schema has all 3 sections: `materials:`, `budget:`, `timeline:` (3 grep hits)
- Operator nullables: 4 grep hits matching `(supplier|catalog_number|unit_price_usd).*null` (in both schema constraint comment and the prompt's `ALWAYS null in this phase` rule)
- Compliance has both `compliance_notes:` and `compliance_summary:` (2 grep hits)
- Both use `thinkingBudget: 0`, `AbortSignal.timeout(35_000)`, `SEXTANT_DEMO_PACE_MS`
- Operator and Compliance each have 4 `agent_id` references (started + working + done + error)

**Task 3 (consolidator.ts):**
- File exists; exports `runConsolidator`
- Uses top-level `schema: planSchema` (2 hits — type signature + streamObject call)
- Uses `thinkingBudget: 4000` (NOT 0 — synthesis tier per D-55)
- Uses `AbortSignal.timeout(15_000)` (NOT 35s — bounded synthesis per D-66)
- Sets `grounded: false` once (D-59)
- 7 metadata fields explicitly overwritten in post-fill: run_id, hypothesis, qc_run_id, grounded, model_id, latency_ms, generated_at, agent_artifacts (object-spread style)
- `agent_id: "consolidator"` appears in 2 events (started + done; no separate `working` since consolidator is one bounded call)
- Honors `SEXTANT_DEMO_PACE_MS`

### End-to-end gates

- `npx tsc --noEmit` exits 0 (project-wide green) after each commit
- All 5 new files present (`ls` ✓)
- Tavily isolation verified: only `researcher.ts` references `tavilySearch` — `skeptic.ts`, `operator.ts`, `compliance.ts`, `consolidator.ts` all return 0 refs (D-56 holds)
- Each agent's `agent_id` matches its filename: researcher=5, skeptic=4, operator=4, compliance=4 (researcher's extra count is the second `working` event for the Tavily call — intentional)
- Skeptic 6-name guarantee verified at both layers: prompt (instructs the model) + post-parse Set-diff (server enforces if model drops any)

## Deviations from Plan

**None.** Plan executed exactly as written. The plan supplied verbatim file bodies for all 5 TypeScript modules with full system prompts, slice schemas, and runner shapes. No Rule-1/2/3 auto-fixes triggered, no architectural questions surfaced.

The only judgment call surfaced in the consolidator: I used object-spread (`{...draft, run_id: args.run_id, model_id: args.modelId, ...}`) instead of in-place mutation (`plan.run_id = args.run_id; plan.model_id = args.modelId;`) for the server-side metadata post-fill. Identical observable behavior; cleaner immutability; the acceptance criterion's grep pattern looks for `plan.X =|run_id: args.run_id` and matches the spread style on `run_id: args.run_id` (3 hits). All 7 server-controlled metadata fields are explicitly overwritten in the spread.

## SEXTANT_DEMO_PACE_MS injection

Confirmed clean across all 5 modules. Each module:

1. Reads `process.env.SEXTANT_DEMO_PACE_MS` at module load with a `Number(... ?? 0)` coercion (default 0 — production runs unaffected).
2. After emitting the `stage: "started"` event but before the LLM call (and before the Tavily call in researcher's case), conditionally awaits `new Promise(r => setTimeout(r, DEMO_PACE_MS))` only when `DEMO_PACE_MS > 0`.

Phase 8 demo recording can set `SEXTANT_DEMO_PACE_MS=3000` (or 5000) in the local env to slow the trace rail to a visible pace without code changes. Server-only env (no `NEXT_PUBLIC_` prefix) so no client-bundle leakage. Verified: `grep -c SEXTANT_DEMO_PACE_MS src/lib/plan/agents/*.ts src/lib/plan/consolidator.ts` returns 2 per file (constant declaration + conditional await), 5 files = 10 total — every module honors the toggle.

## Auth Gates

None — Phase 3 Wave 2 ships pure module code (no live LLM calls executed during the build itself, no third-party API calls). The agent runners depend on `GOOGLE_GENERATIVE_AI_API_KEY` (already configured in `.env.local`) and `TAVILY_API_KEY` (already configured) at runtime — both already verified working in Phase 2's QC route.

## Threat Flags

None. The 5 modules introduce no new network endpoints, no new auth paths, no new file-access patterns. They are pure-function wrappers around the existing `streamObject` (network surface already audited in Phase 2) and the existing `tavilySearch` (network surface already audited in Phase 2). The server-side metadata post-fill in the consolidator (`{...draft, run_id: args.run_id, ...}`) is a defense-in-depth pattern that PREVENTS the model from injecting false provenance into the Plan object.

## Known Stubs

One intentional stub, documented:

| Location | Stub | Why intentional |
|----------|------|-----------------|
| `src/lib/plan/agents/skeptic.ts:140-148` | When the model omits any of the 6 REQUIRED_VALIDATION_NAMES, the post-parse fallback appends a generic stub: `{ name, description: "Required validation check (auto-stub — model omitted).", measurement_method: "TBD by Phase 6 evaluator.", pass_criteria: "Manual review." }` | This is the server-side guarantee that backstops Phase 6's placeholder grid. Without it, a model omission would break the bridge between the rail's hardcoded 6 names and the live data. The stub is named verbatim per the rail's `VALIDATION_SKELETON`; Phase 6's evaluator will replace `measurement_method`/`pass_criteria` with real check logic when wiring the green-tick. Not invention — reconstruction of a required schema field that the prompt explicitly demanded. |

No other stubs. All 5 modules are complete runners with full lifecycle event coverage and proper error paths.

## Downstream Impact

**Phase 3 Wave 3 (route handler at `src/app/api/plan/route.ts`)** can now import:

```typescript
import { runResearcher, type ResearcherSlice } from "@/lib/plan/agents/researcher";
import { runSkeptic, type SkepticSlice } from "@/lib/plan/agents/skeptic";
import { runOperator, type OperatorSlice } from "@/lib/plan/agents/operator";
import { runCompliance, type ComplianceSlice } from "@/lib/plan/agents/compliance";
import { runConsolidator } from "@/lib/plan/consolidator";
```

The route handler will:
1. Pick model ONCE via `pickAvailableLitQcModel()` (single 60s probe cache shared across all 5 calls — D-55).
2. `Promise.allSettled([runResearcher(...), runSkeptic(...), runOperator(...), runCompliance(...)])` to fan out the 4 debaters in parallel.
3. Build `artifacts: { researcher: AgentArtifact, skeptic: AgentArtifact, operator: AgentArtifact, compliance: AgentArtifact }` map from each agent's `{ elapsed_ms, error? }` return value (set `raw_draft` to the slice or `{}` on null, `model_id` to the picked id, `error` from the runner's return).
4. Pass `artifacts` PLUS the 4 slices to `runConsolidator`. The consolidator's server-side post-fill writes the artifacts into `plan.agent_artifacts` so the LLM can't touch that map.
5. Wrap the whole flow in `createUIMessageStream` so the SSE channel carries both `data-trace` events AND a final `data-plan` part with the assembled Plan.

**Phase 6 (live trace rail)** can now type-narrow on AgentEvents emitted by these runners:
- 4 unique `agent_id` strings: `"researcher"`, `"skeptic"`, `"operator"`, `"compliance"` (+ `"consolidator"` from Wave 3 = 5 rows total).
- Lifecycle: `started → working* → done|error`.
- Skeptic's slice contains the 6 named validation checks Phase 6's grid will tick green from.

**Phase 5 (grounding pass)** has the contract it needs:
- Every row across all sections has `citations: []` empty (verified at the prompt layer + the schema's `.default([])` defaults).
- `grounded: false` is set by the consolidator's server-side post-fill — Phase 5 will read every Plan with `grounded === false`, fill citations, and flip the flag.

## Self-Check: PASSED

Files verified to exist on disk:
- `FOUND: src/lib/plan/agents/researcher.ts`
- `FOUND: src/lib/plan/agents/skeptic.ts`
- `FOUND: src/lib/plan/agents/operator.ts`
- `FOUND: src/lib/plan/agents/compliance.ts`
- `FOUND: src/lib/plan/consolidator.ts`

Commits verified in git log:
- `FOUND: 61299fb` (Task 1 — researcher + skeptic)
- `FOUND: f85b245` (Task 2 — operator + compliance)
- `FOUND: 42b1ba6` (Task 3 — consolidator)

`npx tsc --noEmit` exits 0 (project-wide green).
