# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-25)

**Core value:** A scientist enters a hypothesis, watches four agents debate it in parallel, and receives a fundable, citation-grounded experiment plan in under three minutes — and every correction they make compounds into the next plan, automatically.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 8 (Foundation) — **COMPLETE**
Plan: 3 of 3 plans complete
Status: Phase 1 closed. Live production URL: **https://sextant-uekv.vercel.app** (Vercel auto-deploy on push to main, both observed deploys at 29s and 31s — well under DEPLOY-02's 60s ceiling). `/api/health` returns `{"tavily":true,"gemini":true,"ok":true}` from the public URL with env vars resolving server-side. `/` shows the Sextant landing placeholder; `/app` shows the three-column dashboard shell with empty-state hero and 4 chip placeholders. Secret-leak audit clean — no API key patterns in any tracked file; `.env.local` gitignored and never committed. Ready for Phase 2 (Literature QC).
Last activity: 2026-04-25 — Plan 01-03 closed via real-data verification (skipped synthetic no-op deploy test since two genuine deploys already proved DEPLOY-02). Deviation: Vercel project initially set Framework Preset to "Other" because user created project before Plan 01-01 had pushed package.json; first deploy returned x-vercel-error: NOT_FOUND on every route. Fixed by user toggling Framework Preset to Next.js in dashboard, second deploy (31s) served all routes correctly. Full closeout in .planning/phases/01-foundation/01-03-SUMMARY.md.

Progress: [████░░░░░░] ~12% (Phase 1 of 8 done)

## Production environment

- **URL:** https://sextant-uekv.vercel.app
- **Aliases:** sextant-uekv-git-main-yauhenifutryns-projects.vercel.app, sextant-uekv-bl8k5k6te-yauhenifutryns-projects.vercel.app
- **Source branch:** main (auto-deploy on push)
- **Framework Preset:** Next.js (Vercel-managed)
- **Env vars set on Vercel:** GOOGLE_GENERATIVE_AI_API_KEY ✓, TAVILY_API_KEY ✓, OPENAI_API_KEY (blank, optional fallback)

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: ~6 min 15 sec
- Total execution time: ~12 min 30 sec

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 2/3 | ~12 min 30 sec | ~6 min 15 sec |

**Recent Trend:**
- Last 5 plans: 01-02 (~7m 30s, 2 commits, 4 auto-fixed deviations), 01-01 (~5 min, 2 commits, 3 auto-fixed deviations)
- Trend: on-pace for hackathon timeline; deviations are tooling drift (shadcn CLI shape, Tailwind v4 init), not design changes

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

### Pending Todos

- **User**: replace 4 placeholder strings in `src/lib/example-hypotheses.ts` with verbatim Fulcrum-brief sample hypotheses BEFORE Phase 2 demo (hard rule)

### Blockers/Concerns

- Phase 1 must ship in ~1 hour to unblock everything downstream (24h hard deadline)
- Phase 4 depends on Phase 3 JSON output shape being stable — finalize schema in Phase 3
- Phase 7 is the highest-risk phase (learning loop); budget aggressively, cut to manual slide if not wired by hour 18

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-04-25T21:10Z
Stopped at: Plan 01-02 complete (shadcn 5 components + lib/env.ts + /api/health + landing placeholder at / + three-column dashboard shell at /app + 4 keyboard-accessible chips + Toaster mounted). Ready for Plan 01-03.
Resume file: .planning/phases/01-foundation/01-03-PLAN.md
