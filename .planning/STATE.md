---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: "Phase 4 Plan 03 (Plan Canvas UI Wave 3 — PlanTabs+PlanSkeleton wire-in to PlanCanvas + dashboard prop threading) COMPLETE. Phase 4 fully shipped. 0 new files, 2 modified at commits 064e9cc (Task 1: src/components/plan-canvas.tsx +35/-8 — extended Props with plan: Plan | null + planIsLoading: boolean, added 3-state coexistence per D4-12 with mutually-exclusive showPlan/showSkeleton/showHero guards below pinned VerdictCard; state (b) renders <PlanTabs plan={plan} /> when plan != null, state (c) renders <PlanSkeleton /> when plan===null AND (verdictActive OR planIsLoading), state (a) preserves empty-state hero verbatim when nothing active; single overflow-y-auto on the section per D4-13; trust-the-type per D4-16 with only the type-narrowing guard at the JSX root), d3bc4f3 (Task 2: src/app/app/page.tsx +2 lines threading plan={plan.plan} + planIsLoading={plan.isLoading} on <PlanCanvas />; usePlan() call already present from Phase 3, TraceRail wiring untouched, D-63 auto-fire useEffect intact). 0 deviations. Project-wide tsc green per task and final. All 6 PLAN-XX acceptance grep checks PASS (PLAN-01 Protocol <ol>+step_number+duration_estimate; PLAN-02 Materials <table> + 6 column headers verbatim; PLAN-03 Budget bg-forest/30+Total+formatCurrency; PLAN-04 Timeline depends_on+duration_days; PLAN-05 Validation measurement_method+pass_criteria; PLAN-06 5 tabs + Radix primitive + active-tab forest underline). One acceptance-grep false positive documented: [0 sources] matched a JSDoc comment in citation-slot.tsx line 23 (Wave 1 locked file) that documents the rule — actual code at line 33 returns null for empty arrays per CLAUDE.md hard rule #1; not a violation. ~2m 38s wall, 2 commits. Phase 5 (grounding) unblocked at CitationSlot leaf level with zero shell churn."
last_updated: "2026-04-26T10:55:00Z"
last_activity: 2026-04-26 -- Phase 4 Plan 03 (PlanCanvas wire-in + dashboard threading) COMPLETE — Phase 4 SHIPPED
progress:
  total_phases: 8
  completed_phases: 4
  total_plans: 14
  completed_plans: 14
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-25)

**Core value:** A scientist enters a hypothesis, watches four agents debate it in parallel, and receives a fundable, citation-grounded experiment plan in under three minutes — and every correction they make compounds into the next plan, automatically.
**Current focus:** Phase 4 — Plan Canvas UI

## Current Position

Phase: 4 (Plan Canvas UI) — COMPLETE → next: Phase 5 (Grounding & Citations) UNBLOCKED
Plan: 3 of 3 done (04-01 + 04-02 + 04-03 all shipped)
Status: Phase 5 ready to plan
Last activity: 2026-04-26 -- Phase 4 Plan 03 (PlanCanvas wire-in + dashboard threading) COMPLETE — Phase 4 SHIPPED

Progress: [██████████] Phases 1-4 complete (4 of 8); Phase 5 (grounding) unblocked at CitationSlot leaf level with zero shell churn

## Production environment

- **URL:** https://sextant-uekv.vercel.app
- **Aliases:** sextant-uekv-git-main-yauhenifutryns-projects.vercel.app, sextant-uekv-bl8k5k6te-yauhenifutryns-projects.vercel.app
- **Source branch:** main (auto-deploy on push)
- **Framework Preset:** Next.js (Vercel-managed)
- **Env vars set on Vercel:** GOOGLE_GENERATIVE_AI_API_KEY ✓, TAVILY_API_KEY ✓, OPENAI_API_KEY (blank, optional fallback)

## Performance Metrics

**Velocity:**

- Total plans completed: 12 (3 in Phase 1 + 3 in Phase 2 + 3 in Phase 3 + 3 in Phase 4)
- Average duration: ~6 min 49 sec (estimate)
- Total execution time: ~82 min (estimate)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 3/3 | ~12 min 30 sec | ~6 min 15 sec |
| 2. Literature QC | 3/3 | ~44 min 35 sec | ~14 min 52 sec |
| 3. Multi-Agent Pipeline | 3/3 | ~12 min 20 sec + 03-03 | ~5 min |
| 4. Plan Canvas UI | 3/3 | ~10 min 28 sec | ~3 min 29 sec |

**Recent Trend:**

- Last 10 plans: 04-03 (~2m 38s, 2 commits, 0 deviations — pure wire-in: 35-line PlanCanvas extension with showPlan/showSkeleton/showHero mutually-exclusive guards per D4-12 + 2-line dashboard threading plan={plan.plan} + planIsLoading={plan.isLoading}; project-wide tsc green; all 6 PLAN-XX acceptance grep checks PASS; one [0 sources] grep false-positive on JSDoc rule-documentation in Wave 1 locked file documented as non-violation), 04-02 (~2m 36s, 2 commits, 1 auto-fixed deviation — PlanSkeleton tab-label array reformatted one-per-line for strict acceptance grep; zero behavior change; PlanTabs 5-tab shell composes Wave 1 leaves with compliance routing per D4-09 + compliance_summary footer; PlanSkeleton geometry mirrors real TabsList; pure-render commitment held with 0 useState/useEffect; project-wide tsc green per task), 04-01 (~5m 14s, 3 commits, 2 auto-fixed deviations — Citation type derived locally via z.infer because qc/schema.ts is locked + JSDoc planSchema rephrase to satisfy strict grep; verbatim plan-body advantage held; project-wide tsc green per task; 8 leaf files + 1 dep ready for Wave 2 to wire), 03-02 (~10m wall, 3 commits, 0 deviations — 5 LLM-call modules with verbatim plan-supplied file bodies; all grep acceptance chains passed first-time; tsc green per task; consolidator's server-side metadata post-fill prevents LLM-injected provenance), 03-01 (~2m 20s, 3 commits, 0 deviations — pure-data Zod + Node fs work; all grep acceptance chains passed first-time; Phase 6 unblocked at commit 395a861; tsc green; git check-ignore negation proven), 02-03 (~10m 9s, 4 commits, 1 commit-hygiene incident documented — stray landing-polish files swept into Task 3 commit by parallel-process race; otherwise zero implementation deviations, all 4 grep chains passed first-time, end-to-end live smoke green at 3.8s cache-miss / 65ms cache-hit), 02-02 (~29m 17s, 3 commits, 6 auto-fixed deviations — Gemini 2.5 thinking-mode + discriminatedUnion-collapse + D-53 fallback chain), 02-01 (~5m 9s, 6 commits, 0 deviations — orchestrator pre-released Task 0 chip gate), 01-03 (deploy + verify), 01-02 (~7m 30s, 2 commits, 4 auto-fixed deviations), 01-01 (~5 min, 2 commits, 3 auto-fixed deviations)
- Trend: 04-03 ties 04-02's velocity at ~2m 38s — the integration wave for a properly-decomposed phase is a 2-file edit (consumer extends Props + dashboard threads through). Phase 4 (3 waves: leaves → shell → wire-in) shipped in ~10m 28s total — exemplar of "Wave 1 ships typed primitives → Wave 2 ships pure-render shell → Wave 3 wires in with zero API churn". Phase 5 (grounding) is now unblocked at the CitationSlot leaf level — Phase 5 work drops into existing slots without restructuring PlanTabs or PlanCanvas.

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- 04-03: 3-state coexistence in PlanCanvas via mutually-exclusive boolean guards (showPlan / showSkeleton / showHero) — pure derivations of (qcObject, qcIsLoading, plan, planIsLoading); no useState, no useReducer, no race condition possible. Each guard is one line of derivation; transitions are implicit in React reconciliation. The right pattern when guards are O(N=3) and stateless. Single defensive narrowing kept (`{showPlan && plan && <PlanTabs plan={plan} />}`) — not a defensive guard against bad data; it's a TypeScript narrowing required by the prop type since `plan: Plan | null` and PlanTabs requires `Plan`. D4-16 still honored: zero `.protocol/.materials/etc` null checks beyond the root.
- 04-03: showSkeleton intentionally fires when `verdictActive` even before plan stream starts — matches Wave 3 must_haves; gives a visually stable target while QC is in flight. The plan-checker flagged this as a minor warning; D4-12 explicitly authorizes this UX (verdict-only state shows the skeleton silhouette as a stable loading→loaded swap target). Tightening the guard to require `planIsLoading` would create a brief flash of empty space between QC verdict and plan-stream onset.
- 04-03: Acceptance-grep `[0 sources]` matched a JSDoc comment in `src/components/plan/citation-slot.tsx` line 23 (Wave 1 locked file) that documents the rule itself. The actual code at line 33 reads `if (!citations || citations.length === 0) return null;` — CLAUDE.md hard rule #1 is enforced verbatim. The grep is a false positive on rule-documentation; not a violation. Wave 1 file is locked per execution constraints; not modified.
- 04-02: Compliance routing centralized in PlanTabs — notes filtered ONCE at the shell by `target_kind` (`globalNotes`, `protocolNotes`, `materialNotes`), then rendered via private `<ComplianceStrip />` helper at three precise locations (above tablist for global; top of Protocol panel for protocol_step; top of Materials panel for material_row). Severity → `border-l-4` accent map at module scope (info=borderwarm, caution=clay, blocking=destructive) with 1px neutral 3-sides enclosure mirroring verdict-card discriminated borders. The accent IS the signal; rest of geometry stays calm.
- 04-02: PlanTabs is a pure composition shell — no useState, no useEffect (Radix Tabs owns all tab state), no defensive guards beyond the `Plan`-typed prop contract per D4-16. The single composition point for the canvas: Wave 3 wires `<PlanTabs plan={plan} />` directly, no API churn.
- 04-02: PlanSkeleton tab-strip geometry intentionally mirrors Wave 1's real `<TabsList>` (`inline-flex items-center justify-start gap-6 border-b border-borderwarm pb-2` root + `font-display text-sm font-medium pb-2 -mb-px border-b-2` per label). Active-tab indicator is muted `border-borderwarm` (not `border-forest`) — placeholder, not real selected state. Visually stable loading→loaded swap when the real Tabs mounts.
- 04-02: `compliance_summary` rendered as a flex-column child of `<Tabs>` (between TabsList and the first TabsContent), inheriting the parent's `gap-3` automatically. Always visible across all 5 tabs per D4-09 footer rule. Placing outside Tabs would have required an extra wrapper or fragmented gap rules — visually identical, structurally simpler.
- 04-02: `<ComplianceStrip />` kept private (not exported) — render-time helper for PlanTabs, not part of the public API. YAGNI: when Wave 3's empty-state coexistence work needs to render compliance independently, refactor to its own file. For now, single-responsibility co-location.
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
Stopped at: Phase 4 Plan 03 (Plan Canvas UI Wave 3 — PlanTabs+PlanSkeleton wire-in to PlanCanvas + dashboard prop threading) COMPLETE. 0 new files, 2 modified at commits 064e9cc (Task 1: src/components/plan-canvas.tsx +35/-8 — extended Props with plan: Plan | null + planIsLoading: boolean, added 3-state coexistence per D4-12 with mutually-exclusive showPlan/showSkeleton/showHero guards below pinned VerdictCard), d3bc4f3 (Task 2: src/app/app/page.tsx +2 lines threading plan={plan.plan} + planIsLoading={plan.isLoading}). 0 deviations. Project-wide tsc green per task and final. All 6 PLAN-XX acceptance grep checks PASS. One acceptance-grep false positive documented: [0 sources] matched a JSDoc rule-documentation comment in citation-slot.tsx line 23 (Wave 1 locked file); actual code at line 33 returns null for empty arrays per CLAUDE.md hard rule #1 — not a violation. ~2m 38s wall, 2 commits. Phase 4 SHIPPED.
Resume file: Phase 5 (Grounding & Citations) — needs planning. Run /gsd-plan-phase 5 in a fresh chat.
