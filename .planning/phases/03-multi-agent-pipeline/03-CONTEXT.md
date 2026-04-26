# Phase 3: Multi-Agent Pipeline - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 delivers **the demo's spine — 4 cooperating agents that turn a hypothesis (+ Phase 2 verdict) into a single typed JSON experiment plan in ≤60s**, with each agent's role and current task surfacing as trace events the rail can render.

What ships in Phase 3:
- New server route `src/app/api/plan/route.ts` accepting `{hypothesis, qc_run_id}`, returning an AI SDK v5 UI message stream containing both the Plan object and per-agent trace events on the same SSE channel
- Four agent prompt+schema modules under `src/lib/plan/agents/`: `researcher.ts`, `skeptic.ts`, `operator.ts`, `compliance.ts`
- One consolidator module `src/lib/plan/consolidator.ts` that merges 4 agent outputs into a single Plan
- Top-level Plan Zod schema at `src/lib/plan/schema.ts` with the 5 sections (Protocol, Materials, Budget, Timeline, Validation), per-line `citations: Citation[]` slots, and `agent_artifacts` map
- `AgentEvent` discriminated-union Zod schema at `src/lib/plan/trace.ts` for trace events
- Per-session in-memory `Map<run_id, Plan>` + async write to `data/runs/<run_id>.json` (gitignored)
- Run cache (`src/lib/plan/cache.ts`) keyed by `SHA-256(hypothesis.trim().toLowerCase())`
- Client hook `src/components/plan/use-plan.ts` (new) consuming the message stream, exposing `{plan, agentEvents[], isLoading, error}` to the dashboard
- Dashboard wire-in: auto-chain `/api/plan` after a `not-found` or `similar-work-exists` QC verdict; show "Generate anyway" button for `exact-match-found`
- Reuse of `pickAvailableLitQcModel()` for all 5 LLM calls — single probe, single cached pick per run
- Reuse of `src/lib/tavily.ts` for the one Researcher protocols.io call

What does NOT ship in Phase 3 (deferred):
- Plan canvas tab UI rendering of the JSON sections — Phase 4
- Real catalog #s/prices and supplier-page citation enrichment — Phase 5 (Phase 3 emits empty `citations: []` and `grounded: false`)
- Live trace-rail UI animation per agent + validation grid ticking green — Phase 6 (Phase 3 emits the events; rail still placeholder until Phase 6)
- Lab-rule extraction, correction popover, propagation diff — Phase 7

</domain>

<decisions>
## Implementation Decisions

### Orchestration topology

- **D-54:** **Parallel-fan-out + consolidator.** All 4 agents fire in parallel via `Promise.all` (each is its own `streamObject` call producing its assigned slice). Once all 4 settle, a 5th LLM call (the Consolidator) merges their outputs into the unified Plan JSON. Per-agent budget ~25-35s; consolidator ~10s; serialization ~5s. Target end-to-end ≤45s, well under the 60s AGENT-04 ceiling. Failure isolation: a single agent failure does NOT abort the run; consolidator receives a `null` slice for that agent and emits a placeholder section flagged `agent_artifacts.<role>.error`.
- **D-55:** **Uniform model — `gemini-2.5-flash` via `pickAvailableLitQcModel()` for ALL 5 calls** (4 debaters + consolidator). One probe, one cached pick (60s TTL) shared across the run. Reasoning: the live ladder is currently 100% 503 on the preview tier (per `src/lib/models.ts` comments); 2.5-flash is the only stable surface. Tiering to `gemini-2.5-pro` for the consolidator was rejected because the +8-15s latency risks the 60s ceiling.
  - **Thinking budget per call:** `thinkingBudget: 0` for the 4 debaters (structured-output speed). Consolidator gets `thinkingBudget: 4000` so it actually reasons across the 4 inputs (synthesis quality matters here).
- **D-56:** **Hybrid evidence — shared lit-QC context for all + 1 fresh Tavily for Researcher.** All 4 agents see the Phase 2 lit-QC verdict + 3 citations as part of their input context. Researcher additionally fires ONE Tavily call (`tavilySearch(hypothesis + " protocol")` filtered/grouped client-side to `protocols.io` results) before its LLM call — gives the Protocol section grounding. Skeptic, Operator, Compliance use shared context only (no extra Tavily). Operator emits Materials/Budget rows with empty supplier slots; Phase 5 fills them.

### JSON schema + agent ownership

- **D-57:** **Section ownership.**
  - **Researcher** → `protocol: ProtocolStep[]` (numbered methodology steps; each step has `step_number`, `description`, `duration_estimate`, `citations: []`)
  - **Operator** → `materials: MaterialRow[]` + `budget: BudgetLine[]` + `timeline: TimelinePhase[]` (3 sections owned by one agent because they're operationally tightly coupled — same prompt produces all 3)
  - **Skeptic** → `validation: ValidationCheck[]` (≥5 named checks with `name`, `description`, `measurement_method`, `pass_criteria`; this is the live grid Phase 6 will tick green)
  - **Compliance** → `compliance_notes: ComplianceNote[]` (cross-cutting annotations targeting specific Protocol step numbers or Material rows by index) + `compliance_summary: string`
  - **Consolidator** → assembles the `plan.{protocol,materials,budget,timeline,validation}` from agent slices, attaches `agent_artifacts.{role}` raw drafts, sets top-level `grounded: false`, emits `run_id`, `model_id`, `latency_ms`, `generated_at`.
- **D-58:** **Top-level Plan shape (flat sections + per-line provenance):**
  ```ts
  z.object({
    run_id: z.string(),                    // ULID or hash-prefixed
    hypothesis: z.string(),
    qc_run_id: z.string().nullable(),      // links back to Phase 2 verdict
    grounded: z.boolean(),                 // false in Phase 3, true after Phase 5
    plan: z.object({
      protocol: z.array(protocolStepSchema),
      materials: z.array(materialRowSchema),
      budget: z.array(budgetLineSchema),
      timeline: z.array(timelinePhaseSchema),
      validation: z.array(validationCheckSchema).min(5), // TRACE-03 floor
    }),
    agent_artifacts: z.object({
      researcher: agentArtifactSchema,
      skeptic: agentArtifactSchema,
      operator: agentArtifactSchema,
      compliance: agentArtifactSchema,
    }),
    compliance_summary: z.string(),
    model_id: z.string(),
    latency_ms: z.number(),
    generated_at: z.string(),              // ISO timestamp
  })
  ```
  Each section's row type carries `citations: Citation[]` (reuses Phase 2 `citationSchema` from `src/lib/qc/schema.ts`). `agent_artifacts.<role>` shape: `{ raw_draft: object, model_id, elapsed_ms, token_count, error?: string }`.
- **D-59:** **Citation slots empty in Phase 3 + `grounded: false` flag.** Every line emits `citations: []` and the top-level `grounded` flag is `false`. The plan canvas (Phase 4) MUST surface a "Draft — citations pending verification" badge while `grounded === false`. Phase 5 fills citations and flips the flag. Provenance check (CLAUDE.md hard rule #1) runs in Phase 5, not Phase 3 — Phase 3's contract is shape-correct, not source-grounded.

### Trace event protocol

- **D-60:** **Transport — AI SDK v5 custom data parts on the same stream as the Plan.** Use `createUIMessageStream` + `writer.write({ type: 'data-trace', data: AgentEvent })` for trace events. The Plan object streams as `streamObject` parts on the same channel. One SSE connection, ordered events. Client `use-plan.ts` consumes via `useChat` (or the SDK's `readUIMessageStream`) and demultiplexes: Plan parts → `plan` state, `data-trace` parts → `agentEvents[]` state. Reference: AI SDK v5 `createUIMessageStream` docs and the Phase 2 `route.ts` streaming pattern (extends, doesn't replace, the established `streamObject` shape).
- **D-61:** **3 lifecycle events per agent — `started`, `working`, `done` (+ `error` on failure).**
  - `started`: emitted right before the agent's LLM call begins. Carries `task: string` (e.g., `"Drafting protocol from CRP biosensor lit-QC"`).
  - `working`: heartbeat emitted at meaningful activity boundaries (e.g., `"Calling protocols.io via Tavily"`, `"Streaming response chunks"`). Goal ~1-2 working events per agent — not token-level. Avoids re-render storms.
  - `done`: emitted after the agent's slice is validated. Carries `elapsed_ms`, `token_count`, optional `output_preview` (first 80 chars of summary).
  - `error`: emitted in place of `done` if the agent fails. Carries `error_message` and `retryable: boolean`.
  - Total per run: ~12-15 events (4 agents × 3 + consolidator events). Lightweight enough for the SSE channel without spamming.
- **D-62:** **`AgentEvent` Zod schema — discriminated union by `stage`.** Same pattern as Phase 2 `qcResponseSchema` (D-40):
  ```ts
  export const agentIdSchema = z.enum([
    "researcher", "skeptic", "operator", "compliance", "consolidator"
  ]);

  export const agentEventSchema = z.discriminatedUnion("stage", [
    z.object({
      stage: z.literal("started"),
      run_id: z.string(),
      agent_id: agentIdSchema,
      task: z.string(),
      ts: z.string(),
    }),
    z.object({
      stage: z.literal("working"),
      run_id: z.string(),
      agent_id: agentIdSchema,
      activity: z.string(),
      ts: z.string(),
    }),
    z.object({
      stage: z.literal("done"),
      run_id: z.string(),
      agent_id: agentIdSchema,
      elapsed_ms: z.number(),
      token_count: z.number().optional(),
      output_preview: z.string().optional(),
      ts: z.string(),
    }),
    z.object({
      stage: z.literal("error"),
      run_id: z.string(),
      agent_id: agentIdSchema,
      error_message: z.string(),
      retryable: z.boolean(),
      ts: z.string(),
    }),
  ]);
  export type AgentEvent = z.infer<typeof agentEventSchema>;
  ```
  Phase 6 imports this type and switch-renders by `stage`. Single source of truth across server emit + client render.

### Trigger + persistence

- **D-63:** **Auto-chain trigger for `not-found` and `similar-work-exists`; explicit button for `exact-match-found`.** Once Phase 2 QC stream resolves to `done`:
  - If `verdict === "not-found"` OR `verdict === "similar-work-exists"`: dashboard auto-fires `POST /api/plan { hypothesis, qc_run_id }` immediately. Total perceived latency from chip click ≈ 12-50s (verdict streams ~5s, plan starts streaming inside ~10-12s). Demo flow: chip → verdict streams above canvas → plan agents fan out in trace rail → consolidated plan paints into canvas.
  - If `verdict === "exact-match-found"`: NO auto-fire. The verdict card surfaces a "Generate anyway" button (`bg-clay text-paper`, the stop-and-look accent from D-41). Scientist click triggers the same `/api/plan` endpoint. Rationale: the system is telling the scientist "this exists already" — auto-generating a plan undercuts the verdict's signal.
- **D-64:** **In-memory `Map<run_id, Plan>` + async fire-and-forget write to `data/runs/<run_id>.json`.** Module-level `runStore` lives in `src/lib/plan/cache.ts`. After consolidator validates the Plan, the route both `runStore.set(run_id, plan)` AND fires `fs.promises.writeFile(...)` without awaiting (errors logged, not thrown). `data/runs/` is gitignored. Phase 7's diff modal reads two JSON files for side-by-side compare. Cold-start re-runs: in-memory cleared, but disk JSONs survive — the cache wrapper checks memory first, then disk, then re-runs.
- **D-65:** **Cache key = `SHA-256(hypothesis.trim().toLowerCase())`** (same pattern as Phase 2 D-50). Re-submitting the same hypothesis returns the cached Plan instantly (no agent re-runs). Phase 7 will extend the key to include `lab_rules_hash` so applying new rules invalidates the cache and triggers a re-run — that's a Phase 7 concern; Phase 3 does NOT pre-bake the lab-rules input. The `runStore` API uses `run_id` (a ULID assigned at run-start), but the cache key for "have I seen this hypothesis before?" is the hypothesis hash. Mapping: `cacheIndex: Map<hypothesis_hash, run_id>`.

### Failure modes & timeouts (operational)

- **D-66:** **Per-agent timeout = 35s** (`AbortSignal.timeout(35_000)`) wrapping each `streamObject` call. Consolidator timeout = 15s. If an agent times out: emit `error` AgentEvent with `retryable: true`, consolidator receives `null` slice for that agent and emits placeholder section with `flagged: true`. The Plan still ships — better partial than nothing for the demo. Total worst-case: 35s (parallel) + 15s = 50s, under the 60s ceiling.
- **D-67:** **No retry inside Phase 3.** If the picker can't find a working model, the route returns an `error` AgentEvent + an empty Plan with `error_message` set. Phase 8 polish may add a "Regenerate plan" button on the canvas. Phase 3's job is to fail loudly and structurally.

### Run identifiers

- **D-68:** **`run_id` = ULID generated server-side at route entry.** Lexicographically sortable, time-ordered, URL-safe. Use the `ulid` package if not already installed (one new dep — falls under CLAUDE.md hard rule #5; rationale: standard, 1.4kB gzipped, no transitive deps). Alternative if user vetoes: `Date.now() + "-" + crypto.randomUUID().slice(0,8)`.

### Claude's Discretion

- Exact prompt wording for each of the 5 agent prompts is Claude's call. Constraints: every prompt must enforce the schema strictly (no extra fields), must instruct the model to leave `citations: []` (Phase 5's job), and must produce content grounded in shared lit-QC context. Iterate prompts against the 4 Fulcrum sample chips during execution.
- File layout under `src/lib/plan/` is suggested but not locked — planner may consolidate `agents/researcher.ts` etc. into a single `agents.ts` if cleaner.
- The dashboard wire-in (where `use-plan.ts` is called from, how `agentEvents` flows to the placeholder trace rail) is Claude's call — Phase 6 will refactor anyway.
- Whether to use `ulid` package vs hand-rolled ID is Claude's call provided the chosen ID is monotonic and URL-safe (D-68).
- Validation check NAMES that the Skeptic agent must produce: at minimum the 6 from `src/components/trace-rail.tsx` (Every reagent has a catalog URL / Budget sums correctly / No orphan protocol step / Citations resolve to real sources / Timeline dependencies valid / Compliance pipeline passes). Skeptic may add domain-specific checks per hypothesis on top.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (planner, executor) MUST read these before planning or implementing.**

### Project guardrails
- `CLAUDE.md` §"Hard rules" — hard rule #1 (no claim without verifiable URL citation; deferred to Phase 5 in this phase but flag must be honest), hard rule #2 (4 chips verbatim — already shipped), hard rule #3 (Phase 7 cut-off at hour 18), hard rule #4 (TS only), hard rule #5 (no new deps without justification — `ulid` D-68 is the one ask), hard rule #6 (no DB; JSON files OK).
- `~/.claude/CLAUDE.md` §4.7 (verify before recommending), §4.10 (single-branch dev for hackathon).

### Roadmap & requirements
- `.planning/ROADMAP.md` §"Phase 3: Multi-Agent Pipeline" — goal + 4 success criteria (AGENT-01..04).
- `.planning/REQUIREMENTS.md` §"Multi-Agent Plan Generation" — REQ IDs AGENT-01, AGENT-02, AGENT-03, AGENT-04.
- `.planning/REQUIREMENTS.md` §"Live Trace & Validation" — TRACE-01..04 referenced for Skeptic's validation slot floor (Phase 6 wires the visible grid; Phase 3 produces the data).
- `.planning/PROJECT.md` "Constraints" section — model tier mapping (D-22a..D-22e), Tavily-only grounding, no DB.

### Prior phase decisions (carry-forward)
- `.planning/phases/01-foundation/01-CONTEXT.md` D-22a..D-22e — brain-tier mapping (D-55 supersedes the per-tier split with the uniform-2.5-flash decision based on live preview-tier 503 rate).
- `.planning/phases/01-foundation/01-CONTEXT.md` D-20 — Zod env loader pattern (`src/lib/env.ts`); never read `process.env` directly.
- `.planning/phases/02-literature-qc/02-CONTEXT.md` D-30..D-53 — full Phase 2 decisions; Phase 3 reuses D-37 (provenance pattern), D-38 (streamObject transport), D-40 (discriminated-union schema), D-50 (per-session in-memory cache), D-53 (model fallback ladder), D-49 (no silent fallback to fake verdict).
- `.planning/phases/02-literature-qc/02-AI-SPEC.md` §3 (Framework Quick Reference), §4 (Implementation Guidance), §4b (Async-First Design + Structured Outputs with Zod) — applies directly to Phase 3 too.
- `src/lib/models.ts` — `pickAvailableLitQcModel()`, `MODEL_LADDER`, 60s probe cache. Phase 3 reuses without modification.
- `src/lib/qc/schema.ts` — `citationSchema` and `qcResponseSchema`. Phase 3 imports `citationSchema` for the Plan's `citations: Citation[]` slots.
- `src/lib/qc/cache.ts` — Phase 2's per-session cache module (sibling pattern for `src/lib/plan/cache.ts`).
- `src/lib/qc/provenance.ts` — provenance check pattern (Phase 5 will reuse for the Plan).
- `src/lib/tavily.ts` — Tavily client; Researcher reuses unchanged.
- `src/app/api/qc/route.ts` — reference template for streaming routes (Tavily → streamObject → response shaping).
- `src/components/qc/use-qc.ts` — client hook pattern; `use-plan.ts` mirrors structure.
- `src/components/trace-rail.tsx` — placeholder rail with the 6-row validation skeleton; Skeptic's `validation[]` output must include these 6 checks (D-67 footnote in Claude's Discretion).

### Vendor docs (mandatory pre-implementation read)
- Vercel AI SDK v5 `createUIMessageStream` — https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat (data parts pattern). Phase 3's transport (D-60) lives here.
- Vercel AI SDK v5 `streamObject` (multi-call patterns) — https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data — for the 4 parallel agent calls + consolidator.
- Vercel AI SDK v5 `experimental_repairText` — https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-object#experimental-repair-text — keep using the Phase 2 shape-based repair if Gemini's structured-output mode flakes.
- Google Gemini `thinkingConfig` — https://ai.google.dev/gemini-api/docs/thinking — `thinkingBudget: 0` for debaters, `thinkingBudget: 4000` for consolidator (D-55).
- Tavily search API — https://docs.tavily.com/welcome — Researcher's protocols.io call (D-56).

### Design tokens
- `CLAUDE_DESIGN_BRIEF.md` — palette (forest, clay, paper, ink, muted, borderwarm), typography. The `clay` accent is the "stop and look" color used for the `exact-match-found` "Generate anyway" button (D-63).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/models.ts` — `pickAvailableLitQcModel()` + 60s probe cache. Reuse as-is for all 5 Phase 3 LLM calls (D-55).
- `src/lib/qc/schema.ts` — `citationSchema` import for Plan rows' `citations: Citation[]` slots (D-58).
- `src/lib/qc/cache.ts` — per-session cache pattern (clone for `src/lib/plan/cache.ts`).
- `src/lib/qc/provenance.ts` — provenance check function (Phase 5 reuses; Phase 3 imports the type).
- `src/lib/tavily.ts` — single-call Tavily client; Researcher's one fresh call uses it directly (D-56).
- `src/lib/env.ts` — Zod-validated env singleton; reads `GOOGLE_GENERATIVE_AI_API_KEY` and `TAVILY_API_KEY`. Use everywhere; never touch `process.env`.
- `src/components/qc/use-qc.ts` — client hook pattern; `src/components/plan/use-plan.ts` mirrors structure.
- `src/components/trace-rail.tsx` — placeholder rail; Phase 3 does NOT modify it (Phase 6 wires the live render). But its `VALIDATION_SKELETON` constant defines the 6 checks Skeptic must include in `validation[]` (D-67 footnote).
- `src/app/api/qc/route.ts` — streaming-route template (lines 1-312). Phase 3's `/api/plan/route.ts` extends the same shape: pickAvailableLitQcModel → streamObject → toTextStreamResponse, with the addition of multiple parallel streamObject calls + UI message stream writer for trace events.

### Established Patterns
- **Light-mode only.** No `.dark` selectors anywhere.
- **Server-component shells, client-component leaves.** `/app` route is a Server Component; only `use-plan.ts` and the dashboard wire-in needs `"use client"`.
- **Env access pattern:** `import { env } from "@/lib/env"`; never raw `process.env`.
- **Streaming responses:** AI SDK `streamObject` + `toTextStreamResponse()` (Phase 2 pattern).
- **Discriminated-union Zod schemas** for response shapes (Phase 2 D-40 → Phase 3 reuses for `Plan` and `AgentEvent`).
- **`thinkingConfig.thinkingBudget: 0`** for fast/structured Gemini calls; non-zero only when reasoning across inputs is required (consolidator).
- **`experimental_repairText`** shape-based repair (Phase 2 D-40 carry) when `structuredOutputs: false`.
- **Per-session in-memory `Map`** for caching (Phase 2 D-50).
- **Structured trace logs** (`{event: "qc.request", ...}`) — Phase 3 emits `{event: "plan.run.started"}`, `{event: "plan.agent.completed", agent_id, elapsed_ms}`, etc.

### Integration Points
- New `/app/api/plan/route.ts` is the single server entry. POST body: `{hypothesis: string, qc_run_id?: string}`.
- `src/components/dashboard/dashboard.tsx` (or wherever `useQc` is currently called) gets a sibling `usePlan({autoTrigger: verdict !== "exact-match-found"})` hook call. The trigger fires inside a `useEffect` that watches `qc.object?.verdict` settling to a terminal value.
- `agentEvents[]` from `usePlan()` flows down as a prop to `<TraceRail agentEvents={...} />` — Phase 3 passes the prop; Phase 6 wires the visible render. For Phase 3, the trace rail can either ignore the prop (Phase 1 placeholder behavior) or do a minimal "5 rows light up green when done" fallback so the demo isn't completely empty during Phase 3 sign-off.
- `data/runs/` directory must be created and added to `.gitignore` as part of Phase 3.

</code_context>

<specifics>
## Specific Ideas

- The demo magic moment: chip click → verdict streams above canvas (5s) → 4 agent rows in trace rail flip from idle → working → done in waves → consolidated Plan paints into canvas (~12-15s after verdict). Whole arc <50s. Judges should feel the parallelism.
- Skeptic's `validation[]` MUST include the 6 checks already named in `src/components/trace-rail.tsx:VALIDATION_SKELETON`. This is the bridge Phase 6 needs to make the placeholder grid actually tick green from real data. Skeptic may add hypothesis-specific checks beyond the 6.
- Compliance's `compliance_summary` should read like a 1-paragraph regulatory note, not a checklist — e.g. "This protocol involves human-derived plasma samples and IL-6 measurement; IRB approval is required before sample collection. Reagents include trichloroacetic acid (corrosive, requires fume hood). No DEA-scheduled substances detected." Tone: confident, terse, scientist-to-scientist.
- The "Generate anyway" button on `exact-match-found` is the moment that says "the system isn't trying to bullshit you" — keep the copy exactly: "Generate anyway →" in `clay/rust` accent.

</specifics>

<deferred>
## Deferred Ideas

- **Per-tier model selection (debaters Flash, consolidator Pro).** Could win 5-10% synthesis quality but the +8-15s consolidator latency risks the 60s ceiling on cold-Tavily runs. Re-evaluate in Phase 8 polish if time permits.
- **Parallel debate with critique round.** Richer demo signal but burns the budget. Consider if Phase 3 ships under-budget and there's room for a Phase 8 enhancement.
- **Token-level streaming per agent into the trace rail.** Looks impressive but causes re-render storms with 4 parallel streams. Stay with 3-event lifecycle (D-61); revisit if Phase 6 builds a streaming-text rail variant.
- **Side SSE channel for trace events.** Cleaner separation of concerns but two connections to coordinate. Stay with single AI SDK custom data parts (D-60).
- **Persistent `Plan` history with a list view.** Out of scope for v1; lab profile drawer (Phase 7) covers the demo need.
- **Fresh Tavily per agent (Operator, Skeptic, Compliance).** Operator's Tavily for supplier pages is explicitly Phase 5's job (GROUND-04). Skeptic and Compliance Tavily don't materially improve Phase 3 output for the demo hypotheses.
- **Retry-with-backoff inside Phase 3.** No silent retry (D-67). Phase 8 polish may add a user-facing "Regenerate" button.
- **Pre-baking `lab_rules_hash` into the cache key.** Phase 7 will extend the key (D-65). Pre-baking now adds dead code paths Phase 3 can't exercise.

</deferred>

---

*Phase: 03-multi-agent-pipeline*
*Context gathered: 2026-04-26*
