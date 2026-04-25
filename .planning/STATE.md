# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-25)

**Core value:** A scientist enters a hypothesis, watches four agents debate it in parallel, and receives a fundable, citation-grounded experiment plan in under three minutes — and every correction they make compounds into the next plan, automatically.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 8 (Foundation)
Plan: 2 of 3 plans complete in current phase
Status: Plan 01-02 done — shadcn/ui (button, input, textarea, scroll-area, sonner) installed, Zod env loader at src/lib/env.ts, /api/health route returning {tavily, gemini, ok} booleans, three-column dashboard shell at /app (32fr/50fr/18fr) with HeaderBar via nested layout, empty-state hero with brief heading + 4 keyboard-accessible placeholder chips, landing-page placeholder at / with Sextant wordmark + tagline + "Open Sextant" CTA -> /app. `npm run build`/`npm run lint` both green; live `curl /api/health` returns `{"tavily":true,"gemini":true,"ok":true}`. Ready to execute Plan 01-03 (GitHub remote + Vercel project + env vars + auto-deploy verify).
Last activity: 2026-04-25 — Plan 01-02 executed in ~7m 30s over 2 commits (7200118 shadcn+env+health, 0946daf landing+dashboard+chips). 4 deviations auto-fixed: shadcn CLI flags changed (hand-authored components.json), shadcn add did not pull cva/lucide (npm install added them), strict plan grep `! grep -q "process.env"` failed against a comment (reworded), strict plan grep `id: count = 4` failed because of object-type signature (switched to Readonly<Record<...>> form). See .planning/phases/01-foundation/01-02-SUMMARY.md for full deviation log.

Progress: [██░░░░░░░░] ~8%

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
