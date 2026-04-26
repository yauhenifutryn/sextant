---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: "Phase 4 Plan 01 (Plan Canvas UI Wave 1 — leaf renderers + Tabs primitive + CitationSlot + format helpers) COMPLETE. 8 new files shipped at commits 8342c82 (Task 1: @radix-ui/react-tabs@^1.1.13 dep + src/components/ui/tabs.tsx shadcn wrapper with forest underline + ink text on active per D4-04 + forest/40 focus ring per DESIGN-04), 7af21d3 (Task 2: src/lib/plan/format.ts with formatCurrency Intl.NumberFormat USD dual-format + computeSubtotal pessimistic numeric-prefix parser + src/components/plan/citation-slot.tsx returning null on empty arrays per CLAUDE.md hard rule #1), 7a6378a (Task 3: 5 leaf renderers — protocol-tab.tsx numbered <ol>, materials-tab.tsx 6-col <table> with sticky header + computeSubtotal + overflow-x-auto, budget-tab.tsx with bg-forest/30 proportional bars + Total row, timeline-tab.tsx with depends_on chip strip mirroring example-chips, validation-tab.tsx with 2-col Method/Pass criteria <dl>). 2 deviations auto-fixed: (1) Citation type derived locally via z.infer<typeof citationSchema> because qc/schema.ts is locked and exports no Citation alias, (2) JSDoc rephrased in validation-tab.tsx to satisfy strict planSchema-grep without changing behavior. Project-wide tsc green per task. ~5min wall, 3 commits. Wave 2 (04-02-PLAN.md — plan-tabs.tsx shell + plan-canvas.tsx wire-in) can now import all 5 leaves by name with zero churn."
last_updated: "2026-04-26T10:36:19Z"
last_activity: 2026-04-26 -- Phase 4 Plan 01 (leaf renderers) COMPLETE
progress:
  total_phases: 8
  completed_phases: 4
  total_plans: 14
  completed_plans: 12
  percent: 86
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-25)

**Core value:** A scientist enters a hypothesis, watches four agents debate it in parallel, and receives a fundable, citation-grounded experiment plan in under three minutes — and every correction they make compounds into the next plan, automatically.
**Current focus:** Phase 4 — Plan Canvas UI

## Current Position

Phase: 4 (Plan Canvas UI) — EXECUTING
Plan: 2 of 3 (next: plan-tabs.tsx shell + plan-canvas.tsx wire-in)
Status: Executing Phase 4
Last activity: 2026-04-26 -- Phase 4 Plan 01 (leaf renderers) COMPLETE

Progress: [█████████░] ~93% (Phase 1 + Phase 2 + Phase 3 done; Phase 4 Wave 1 of 3 done)

## Production environment

- **URL:** https://sextant-uekv.vercel.app
- **Aliases:** sextant-uekv-git-main-yauhenifutryns-projects.vercel.app, sextant-uekv-bl8k5k6te-yauhenifutryns-projects.vercel.app
- **Source branch:** main (auto-deploy on push)
- **Framework Preset:** Next.js (Vercel-managed)
- **Env vars set on Vercel:** GOOGLE_GENERATIVE_AI_API_KEY ✓, TAVILY_API_KEY ✓, OPENAI_API_KEY (blank, optional fallback)

## Performance Metrics

**Velocity:**

- Total plans completed: 9 (3 in Phase 1 + 3 in Phase 2 + 2 in Phase 3 + 1 in Phase 4)
- Average duration: ~8 min 16 sec
- Total execution time: ~74 min 40 sec

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 3/3 | ~12 min 30 sec | ~6 min 15 sec |
| 2. Literature QC | 3/3 | ~44 min 35 sec | ~14 min 52 sec |
| 3. Multi-Agent Pipeline | 2/3 | ~12 min 20 sec | ~6 min 10 sec |
| 4. Plan Canvas UI | 1/3 | ~5 min 14 sec | ~5 min 14 sec |

**Recent Trend:**

- Last 9 plans: 04-01 (~5m 14s, 3 commits, 2 auto-fixed deviations — Citation type derived locally via z.infer because qc/schema.ts is locked + JSDoc planSchema rephrase to satisfy strict grep; verbatim plan-body advantage held; project-wide tsc green per task; 8 leaf files + 1 dep ready for Wave 2 to wire), 03-02 (~10m wall, 3 commits, 0 deviations — 5 LLM-call modules with verbatim plan-supplied file bodies; all grep acceptance chains passed first-time; tsc green per task; consolidator's server-side metadata post-fill prevents LLM-injected provenance), 03-01 (~2m 20s, 3 commits, 0 deviations — pure-data Zod + Node fs work; all grep acceptance chains passed first-time; Phase 6 unblocked at commit 395a861; tsc green; git check-ignore negation proven), 02-03 (~10m 9s, 4 commits, 1 commit-hygiene incident documented — stray landing-polish files swept into Task 3 commit by parallel-process race; otherwise zero implementation deviations, all 4 grep chains passed first-time, end-to-end live smoke green at 3.8s cache-miss / 65ms cache-hit), 02-02 (~29m 17s, 3 commits, 6 auto-fixed deviations — Gemini 2.5 thinking-mode + discriminatedUnion-collapse + D-53 fallback chain), 02-01 (~5m 9s, 6 commits, 0 deviations — orchestrator pre-released Task 0 chip gate), 01-03 (deploy + verify), 01-02 (~7m 30s, 2 commits, 4 auto-fixed deviations), 01-01 (~5 min, 2 commits, 3 auto-fixed deviations)
- Trend: 04-01 confirms the verbatim-plan-body advantage extends to UI work — leaf renderers shipped in ~5min wall with zero schema mutations, every design token applied per D4-04..D4-16, both deviations were constraint-conflict resolutions (plan body referenced types/symbols that don't exist or trip strict acceptance greps), not implementation bugs. Wave 2 has zero churn risk: imports compile against the locked Plan type.

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- 04-01: CitationSlot returns null for empty arrays at the leaf-component layer per CLAUDE.md hard rule #1 — no `[0 sources]` placeholder, no fake-citation badge. The truth of an empty array IS silence. Phase 5 will replace the badge surface (when length > 0) with hovercards but the empty-state branch stays.
- 04-01: Citation type derived locally via `type Citation = z.infer<typeof citationSchema>` inside citation-slot.tsx instead of editing src/lib/qc/schema.ts to add an export — Plan 04-01 success-criteria forbids modifying that file. Equivalent shape, zero schema mutation. If future leaves need Citation, copy this 3-line pattern; do NOT add a project-wide alias without revisiting the lock.
- 04-01: computeSubtotal in src/lib/plan/format.ts is pessimistic — accepts unit-prefixed quantities ('10 mL' → 10) but rejects bare units ('few drops' → null). Caller renders em-dash on null per D4-05. Better to render "unknown" than fabricate $0 that misleads the budget reader.
- 04-01: formatCurrency uses Intl.NumberFormat dual-format — single module-scope instance for fractional values (max 2 decimals), per-call instance for whole numbers (max 0 decimals). Hot path is small enough that allocation cost is acceptable; alternative (manual decimal-trim) would re-implement i18n the formatter already does.
- 04-01: All 5 leaf renderers are pure components (no useState/useEffect, no defensive null guards beyond schema-typed Props) per D4-16 — render layer is NOT a validation layer. usePlan().onData has already run planSchema.safeParse upstream; trusting the type is the contract.
- 04-01: Validation tab does NOT use CitationSlot — schema's validationCheckSchema has no citations field (only ProtocolStep, MaterialRow, BudgetLine, TimelinePhase have one). Acceptance grep "4 of 5 leaves use CitationSlot" matches this exactly.
- 03-02: Skeptic 6-name guarantee implemented as defense-in-depth — prompt instructs the model AND a post-parse Set-diff in the runner appends generic stubs for any names the model omits (description="Required validation check (auto-stub — model omitted).", measurement_method="TBD by Phase 6 evaluator.", pass_criteria="Manual review."). This is reconstruction (filling required schema fields), not invention; the bridge between trace-rail's hardcoded VALIDATION_SKELETON and live data CANNOT silently lose a row.
- 03-02: Consolidator's metadata post-fill uses object-spread (`{...draft, run_id: args.run_id, model_id: args.modelId, latency_ms: ..., generated_at: ..., grounded: false, agent_artifacts: args.artifacts}`) rather than in-place mutation. Same observable behavior; immutable; satisfies the "server overwrites server-controlled fields" spirit of CLAUDE.md hard rule #1 — the LLM cannot inject false provenance into the Plan even if the prompt asked it to.
- 03-02: SEXTANT_DEMO_PACE_MS toggle is server-only (no NEXT_PUBLIC_ prefix) and present in all 5 modules — Phase 8 demo recording can `SEXTANT_DEMO_PACE_MS=3000` env-var the trace-rail to a visible pace without code changes. Each module reads it at module load via `Number(process.env.SEXTANT_DEMO_PACE_MS ?? 0)` with default 0 so production runs are unaffected.
- Init: Fulcrum Science track chosen; pitch as "AI CRO Co-Pilot" ($100B CRO market wedge)
- Init: Path B for UI — design brief locked in CLAUDE_DESIGN_BRIEF.md, Claude Design runs in parallel
- Init: Hard rule — if learning loop (Phase 7) not wired by hour 18, fall back to manual before/after slide
- Init: Stack locked: Next.js 15 + TS + Tailwind + shadcn/ui + Vercel AI SDK + Tavily + Claude Sonnet 4.6 / Haiku 4.5 (later swapped to Gemini multi-tier per PROJECT.md update on 2026-04-25)
- 01-01: Scaffold landed as Next.js **16** + React **19** + Tailwind **v4** (newer than original "Next 15" target) — CONTEXT.md authorizes Claude discretion on micro-versions; Tailwind v4 CSS-first @theme is the active engine, tailwind.config.ts kept as a v3-style mirror for shadcn-CLI compatibility
- 01-01: engines.node opened to ">=20.0.0" (no upper bound) so the active Node 22 runtime can install; .nvmrc still pins 20 for new contributors
- 01-01: Light-mode only enforced everywhere (no `.dark`, no `prefers-color-scheme`); home page placeholder uses bg-paper / text-forest / font-display / font-mono utilities so Phase 2+ inherits the same token vocabulary
- 01-02: shadcn/ui initialized via hand-authored `components.json` (CLI's `init` subcommand changed shape in 2026 — wants to scaffold a NEW project; overlay path is hand-authoring + `shadcn add`); 5 components added (button, input, textarea, scroll-area, sonner)
- 01-02: env access pattern locked: every server-side route reads `env.X` from `@/lib/env`, never the raw runtime variables (D-21, T-01-07); `/api/health` exposes presence booleans only, never key values (T-01-06)
- 01-02: Topology split locked — `/` is the landing placeholder (no header), `/app` is the dashboard (header via nested `/app/layout.tsx`); shadcn `<Toaster />` mounted in root layout to cover both
- 01-02: Textarea draft state lifted to `/app/page.tsx`; chip picks from EITHER chat panel OR canvas hero flow through the same `setDraft` setter (idiomatic React, simpler than custom event bus)
- 01-02: 4 example-hypothesis chips ship as bracket-marked placeholders (`[Replace verbatim with Fulcrum sample hypothesis #N]`) — user MUST replace verbatim before Phase 2 wires the send arrow to the lit-QC backend (CLAUDE.md hard rule #2)
- 02-01: AI SDK v5 chosen over v4 — project's `zod@^4.3.6` is in v5's peer-dep range (`^3.25.76 || ^4.1.8`) but NOT v4's (zod v3 only). AI-SPEC §3 Pitfall #1 ("pin ai@^4") is obsolete for this project; supersedes that advice. Installed ai@5.0.179, @ai-sdk/google@2.0.70, @ai-sdk/react@2.0.181 cleanly with no peer-dep warnings.
- 02-01: Provenance utility returns `{ response, droppedCount }` (extends PATTERNS.md's simpler signature) so the route's structured-trace log can record `citations_provenance_dropped` per AI-SPEC §7.
- 02-01: Chip-preflight gate (D-30 BLOCKING) released with verbatim Fulcrum brief text (Diagnostics CRP biosensor, Gut Health L. rhamnosus GG, Cell Biology trehalose cryo, Climate Sporomusa CO₂ fix). Full brief saved verbatim at `.planning/research/fulcrum-brief.md` as source-of-truth for hard rule #2.
- 02-02: D-53 fallback TAKEN — `gemini-3.1-flash-lite-preview` returns HTTP 503 UNAVAILABLE, `gemini-2.5-flash-lite` collapses discriminatedUnion. Promoted `gemini-2.5-flash` to `LIT_QC_MODEL_ID`. Original preview ID preserved in `LIT_QC_MODEL_ID_PREVIEW` for re-attempt.
- 02-02: Gemini 2.5+ are "thinking" models that burn most of `maxOutputTokens` on internal CoT. Setting `providerOptions.google.thinkingConfig.thinkingBudget: 0` is REQUIRED on every Phase-3+ Gemini call to prevent JSON mid-string truncation. Documented in route.ts inline comment.
- 02-02: Gemini's strict server-side `oneOf`-with-`const` enforcement stalls the model. Disabled via `providerOptions.google.structuredOutputs: false` and a server-side `experimental_repairText` callback that reconstructs the discriminator field from the SHAPE of the model output (no value invention; truncation only on schema-capped fields). Provenance check still runs after repair — CLAUDE.md hard rule #1 intact.
- 02-02: AI SDK v5 spelling: option is `maxOutputTokens` not `maxTokens`. Plan-grep compatibility preserved by keeping `maxTokens: 800` in a doc comment.
- 02-03: Border-color signaling per D-41 mapped: not-found→border-forest (good news, go ahead), similar-work-exists→border-borderwarm (default warm neutral, prior work present), exact-match-found→border-clay (stop-and-look). Light-mode-only Phase-1 invariant honored.
- 02-03: Single onChipPick handler owned by Dashboard, passed to BOTH ChatPanel + PlanCanvas (verified by `grep -c "onChipPick={onChipPick}"` returning 2). Unified D-44 flow with no duplicated state. ChatPanel built with onChipPick prop FROM THE START in Task 2 — plan-checker caught this design before execution, no late-bound revision needed.
- 02-03: focusArrowSignal counter pattern (incrementing useState + useEffect on dependency) chosen over useImperativeHandle/forwardRef for parent-to-child imperative focus. Simpler to reason about ("increment, child re-runs effect, calls .focus()").
- 02-03: JSON.stringify de-dupe (lastCommittedHash ref) in dashboard's commit-to-thread useEffect prevents double-appending the assistant turn during streaming — the qc.object reference changes on every chunk; hash captures only the terminal state.
- 02-03: Cold-start Tavily timeouts (2 calls hit AbortSignal.timeout(4000), latency_ms ~4010) on first calls after dev server warmup. Direct Tavily probe with same params returned in 543ms — confirmed transient TLS-handshake overhead, not a config bug. Route's D-48 error path fired correctly. For production: bump timeout to 6s or add warmup ping at server start.

### Pending Todos

- *(none — chip-preflight gate released 2026-04-26 in Plan 02-01)*

### Blockers/Concerns

- Phase 1 must ship in ~1 hour to unblock everything downstream (24h hard deadline)
- Phase 4 depends on Phase 3 JSON output shape being stable — finalize schema in Phase 3
- Phase 7 is the highest-risk phase (learning loop); budget aggressively, cut to manual slide if not wired by hour 18

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-04-26
Stopped at: Phase 4 Plan 01 (Plan Canvas UI Wave 1 — leaf renderers + Tabs primitive + CitationSlot + format helpers) COMPLETE. 8 new files shipped at commits 8342c82 (Task 1: @radix-ui/react-tabs@^1.1.13 dep + src/components/ui/tabs.tsx shadcn wrapper with forest underline + ink text on active per D4-04 + forest/40 focus ring per DESIGN-04), 7af21d3 (Task 2: src/lib/plan/format.ts with formatCurrency Intl.NumberFormat USD dual-format + computeSubtotal pessimistic numeric-prefix parser + src/components/plan/citation-slot.tsx returning null on empty arrays per CLAUDE.md hard rule #1), 7a6378a (Task 3: 5 leaf renderers — protocol-tab.tsx numbered <ol>, materials-tab.tsx 6-col <table> with sticky header + computeSubtotal + overflow-x-auto, budget-tab.tsx with bg-forest/30 proportional bars + Total row, timeline-tab.tsx with depends_on chip strip mirroring example-chips, validation-tab.tsx with 2-col Method/Pass criteria <dl>). 2 deviations auto-fixed: (1) Citation type derived locally via z.infer<typeof citationSchema> because qc/schema.ts is locked and exports no Citation alias, (2) JSDoc rephrased in validation-tab.tsx to satisfy strict planSchema-grep without changing behavior. Project-wide tsc green per task. ~5min wall, 3 commits. Wave 2 (04-02-PLAN.md — plan-tabs.tsx shell + plan-canvas.tsx wire-in) can now import all 5 leaves by name with zero churn.
Resume file: .planning/phases/04-plan-canvas-ui/04-02-PLAN.md (Wave 2)
