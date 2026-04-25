# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-25)

**Core value:** A scientist enters a hypothesis, watches four agents debate it in parallel, and receives a fundable, citation-grounded experiment plan in under three minutes — and every correction they make compounds into the next plan, automatically.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 8 (Foundation)
Plan: 1 of 3 plans complete in current phase
Status: Plan 01-01 done — Next.js 16 + React 19 + Tailwind v4 scaffold layered into the repo with brief HSL tokens, three Google fonts, cn helper, and `npm run build`/`npm run lint` both green. Ready to execute Plan 01-02 (shadcn + three-column layout shell + lib/env.ts + /api/health).
Last activity: 2026-04-25 — Plan 01-01 executed in ~5 min over 2 commits (9ec3d3a scaffold, ecc2333 tokens+fonts+cn). 3 deviations auto-fixed: adapted to Tailwind v4 CSS-first config (kept v3-style tailwind.config.ts as parallel mirror loaded via @config), opened upper bound on engines.node (active runtime is Node 22), replaced create-next-app default home page to remove `dark:` variants per D-10. See .planning/phases/01-foundation/01-01-SUMMARY.md for full deviation log.

Progress: [█░░░░░░░░░] ~4%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: ~5 min
- Total execution time: ~5 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 1/3 | ~5 min | ~5 min |

**Recent Trend:**
- Last 5 plans: 01-01 (~5 min, 2 commits, 3 auto-fixed deviations)
- Trend: on-pace for hackathon timeline

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

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 1 must ship in ~1 hour to unblock everything downstream (24h hard deadline)
- Phase 4 depends on Phase 3 JSON output shape being stable — finalize schema in Phase 3
- Phase 7 is the highest-risk phase (learning loop); budget aggressively, cut to manual slide if not wired by hour 18

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-04-25T20:57Z
Stopped at: Plan 01-01 complete (Next.js 16 / React 19 / Tailwind v4 scaffold + brief tokens + 3 fonts + cn helper). Ready for Plan 01-02.
Resume file: .planning/phases/01-foundation/01-02-PLAN.md
