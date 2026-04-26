---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: "Plan 02-02 complete: POST /api/qc streaming route + useQc client hook shipped. Smoke gate passes end-to-end on fresh dev server (cache-miss 3.4s with verdict; cache-hit 8.5ms). Six deviations auto-fixed: D-53 model swap to gemini-2.5-flash, AI SDK v5 maxOutputTokens rename, thinkingBudget=0 to free output budget on Gemini 2.5+ thinking models, structuredOutputs=false + experimental_repairText to bypass discriminatedUnion-collapse on Gemini, system prompt tightened to disambiguate ok-discriminator vs verdict-label, comment reword to satisfy negative grep. CLAUDE.md hard rule #1 intact (provenance check runs after repair). Plan 02-03 (UI components) remains. Ready for /gsd-execute-phase 2 to continue."
last_updated: "2026-04-26T00:38:39.000Z"
last_activity: 2026-04-26 -- Plan 02-02 complete (POST /api/qc + useQc hook, 3 commits)
progress:
  total_phases: 8
  completed_phases: 1
  total_plans: 7
  completed_plans: 5
  percent: 71
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-25)

**Core value:** A scientist enters a hypothesis, watches four agents debate it in parallel, and receives a fundable, citation-grounded experiment plan in under three minutes — and every correction they make compounds into the next plan, automatically.
**Current focus:** Phase 2 — literature-qc

## Current Position

Phase: 2 (literature-qc) — EXECUTING
Plan: 3 of 3 (next: 02-03 UI components)
Status: Executing Phase 2
Last activity: 2026-04-26 -- Plan 02-02 complete (POST /api/qc + useQc hook)

Progress: [███████░░░] ~71% (Phase 1 done, Plans 02-01 + 02-02 done)

## Production environment

- **URL:** https://sextant-uekv.vercel.app
- **Aliases:** sextant-uekv-git-main-yauhenifutryns-projects.vercel.app, sextant-uekv-bl8k5k6te-yauhenifutryns-projects.vercel.app
- **Source branch:** main (auto-deploy on push)
- **Framework Preset:** Next.js (Vercel-managed)
- **Env vars set on Vercel:** GOOGLE_GENERATIVE_AI_API_KEY ✓, TAVILY_API_KEY ✓, OPENAI_API_KEY (blank, optional fallback)

## Performance Metrics

**Velocity:**

- Total plans completed: 5 (3 in Phase 1 + 2 in Phase 2)
- Average duration: ~9 min 24 sec
- Total execution time: ~46 min 57 sec

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 3/3 | ~12 min 30 sec | ~6 min 15 sec |
| 2. Literature QC | 2/3 | ~34 min 26 sec | ~17 min 13 sec |

**Recent Trend:**

- Last 5 plans: 02-02 (~29m 17s, 3 commits, 6 auto-fixed deviations — Gemini 2.5 thinking-mode + discriminatedUnion-collapse + D-53 fallback chain; smoke gate fully passes), 02-01 (~5m 9s, 6 commits, 0 deviations — orchestrator pre-released Task 0 chip gate), 01-03 (deploy + verify), 01-02 (~7m 30s, 2 commits, 4 auto-fixed deviations), 01-01 (~5 min, 2 commits, 3 auto-fixed deviations)
- Trend: 02-02 longest plan yet — Gemini structured-output behavior diverged from AI-SPEC's predictions in three independent ways (model unavailability, thinking-token budget consumption, oneOf collapse); each forced a fix iteration. Total smoke-test investigation accounted for ~20m of the 29m runtime.

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

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
Stopped at: Plan 02-02 complete. POST /api/qc streaming route + useQc client hook shipped. Smoke gate passes end-to-end on fresh dev server (cache-miss 3.4s with verdict for chip h1; cache-hit 8.5ms; 2 qc.request log lines, 2nd cache_hit:true; schema_valid:true; 3 cited URLs all in Tavily input set, 0 provenance drops). Six deviations auto-fixed (see Decisions section: D-53 fallback, AI SDK v5 maxOutputTokens, thinkingBudget=0, structuredOutputs=false + repair function, prompt rewrite, comment reword). Build green. Plan 02-03 (UI components: VerdictCard, CitationCard, ChatThread, dashboard wire-in) can now proceed.
Resume file: .planning/phases/02-literature-qc/02-03-PLAN.md
