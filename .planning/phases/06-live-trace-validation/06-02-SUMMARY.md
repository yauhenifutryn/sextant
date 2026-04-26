---
phase: 06-live-trace-validation
plan: 02
subsystem: trace-rail
tags: [trace, validation, wire-in, demo-pace, ui]
requires:
  - "src/components/trace/agent-row.tsx (Plan 06-01)"
  - "src/components/trace/validation-grid.tsx (Plan 06-01)"
  - "src/components/sextant-loader.tsx (existing)"
provides:
  - "src/components/trace-rail.tsx (TraceRail + TraceRailProps live render)"
  - "src/components/trace/use-demo-paced-events.ts (useDemoPacedEvents drip-feed hook)"
  - ".planning/demo-recipe.md (demo-pace mechanism confirmation note)"
affects:
  - "Main chat / Phase 4 will pass agentEvents + plan + validationChecks props down from usePlan() once available — no caller change needed today (props all optional)"
tech-stack:
  added: []
  patterns:
    - "5-agent reduction via Map<AgentId, AgentEvent> last-write-wins (06-PATTERNS.md §No Analog Found — novel for this codebase but trivial)"
    - "Discriminated-union narrowing guard (skip events without `stage` or `agent_id`) — verdict-card.tsx:50 Gemini partial-stream resilience pattern"
    - "Backwards-compat default args (`= {}` on the props destructure + `agentEvents = []` + `isLoading = false`) so the existing dashboard's no-prop `<TraceRail />` call still renders the SextantLoader empty state"
    - "Client-side drip-feed via window.location.search read in useEffect (avoids next/navigation useSearchParams CSR-bailout — Rule 1 deviation, see Deviations section)"
    - "Pace-at-source: `useDemoPacedEvents(agentEvents)` runs BEFORE `reduceAgentEvents` so the staircase is visible end-to-end across the entire downstream rendering chain"
key-files:
  created:
    - src/components/trace/use-demo-paced-events.ts
    - .planning/phases/06-live-trace-validation/06-02-SUMMARY.md
  modified:
    - src/components/trace-rail.tsx
    - .planning/demo-recipe.md
decisions:
  - "Hook dropped `useSearchParams()` from `next/navigation` and switched to `window.location.search` inside `useEffect`. Rationale: `useSearchParams()` triggers Next.js 15's CSR-bailout requirement on `/app` (statically prerendered), forcing the entire page into a Suspense boundary. The forbidden-zone constraint prevents that fix. Reading `window.location.search` post-mount is client-only and SSG-safe. Behavior is identical for the user (paceMs default 0 → pass-through during pre-mount + when no param)."
  - "Plan 06-01's leaves were imported as-is (AgentRow, ValidationGrid, VALIDATION_SKELETON, PlanLike, ValidationCheckLike). Single source of truth for VALIDATION_SKELETON now lives in `validation-grid.tsx`; `trace-rail.tsx` re-imports and forwards it as the `baseline` prop."
  - "Local AgentEvent + AgentId STUB type kept inline per plan spec, even though Phase 3 has shipped `src/lib/plan/{trace,schema}.ts`. The plan-checker explicitly authorized the stub-then-swap handover pattern; a follow-up commit (out of scope for Plan 06-02) will swap stubs to real imports."
metrics:
  duration_minutes: ~12
  completed: 2026-04-26
---

# Phase 6 Plan 02: Live Trace Rail Wire-In Summary

Wired the trace rail end-to-end: 5-agent reducer over the streaming `AgentEvent[]`, ValidationGrid composition, demo-pace drip-feed hook keyed off `?demoPace=`. Phase 6 ships satisfying TRACE-01..TRACE-04 with all leaf components from Plan 06-01 composed into the right-column `<aside>` shell.

## What was built

### `src/components/trace-rail.tsx` (rewritten — 53 → 173 lines, commit `ee36cc2`)

Replaces the placeholder body with a live render. Key elements:

| Region | What it does |
|---|---|
| STUB type block | Local `AgentEvent` + `AgentId` discriminated-union mirroring D-62 (kept per plan spec — Phase 3 swap-in is a 4-line follow-up) |
| `AGENT_ORDER` | Canonical ordering: researcher, skeptic, operator, compliance, consolidator |
| `reduceAgentEvents(events)` | Pure reducer: `Map<AgentId, AgentEvent>` last-write-wins, defensive guard skips malformed chunks (verdict-card.tsx:50 pattern) |
| `eventToStatus(ev)` | Maps `started/working` → "working", `done` → "done", `error` → "error", undefined → "idle" |
| `eventToTask(ev)` | Pulls the appropriate 1-line string per stage discriminator |
| `<TraceRail>` body | `useDemoPacedEvents(agentEvents)` (paces at source) → `reduceAgentEvents(pacedEvents)` → 5 `<AgentRow>` + `<ValidationGrid>`. Backwards compat: empty-state SextantLoader fallback when `pacedEvents.length === 0 && !isLoading` |

The outer `<aside className="border-l border-borderwarm bg-paper flex flex-col gap-6 p-6">` and both section headers (`Activity`, `Validation grid`) are preserved verbatim from the placeholder.

### `src/components/trace/use-demo-paced-events.ts` (new — 88 lines, commit `e06dff5` + amended `ee36cc2`)

Client-side drip-feed hook:
- `?demoPace=slow` → 3500ms between events (~14s for 4 agents)
- `?demoPace=ultraslow` → 6000ms between events
- No param → `paceMs=0`, returns events directly (pass-through, zero overhead)

Reads URL param via `window.location.search` inside `useEffect` (deliberate Suspense-bailout sidestep — see Deviations).

### `.planning/demo-recipe.md` (appended — commit `8b4e0a3`)

New "Demo-pace mechanism — confirmed shipped 2026-04-26 (Phase 6)" section captures:
- Client-side hook path + URL params (this plan)
- Server-side env var counterpart (Phase 3, separate chat)
- Belt-and-braces guidance + recording URL `https://sextant-uekv.vercel.app/app?demoPace=slow`

## STUB swap-in instructions (4-line replacement for the post-Phase-3 cleanup commit)

In `src/components/trace-rail.tsx`, replace the STUB block (lines 26-44) with:

```tsx
import type { AgentEvent, AgentId } from "@/lib/plan/trace";
import type { Plan } from "@/lib/plan/schema";
```

And in `src/components/trace/use-demo-paced-events.ts`, replace lines 5-21 with:

```tsx
import type { AgentEvent } from "@/lib/plan/trace";
```

`PlanLike` (used by `validation-grid.tsx`) is structurally compatible with the real `Plan` type from Phase 3 D-58 — TypeScript width-typing will accept the swap without an explicit cast at the `<TraceRail>` callsite.

## Build + tsc

| Check | Result |
|---|---|
| `npx tsc --noEmit` (whole project) | Zero errors |
| `npm run build` | Succeeds — `/app` is `○ (Static)` prerendered, `/api/qc` + `/api/health` are `ƒ (Dynamic)` |
| Build artifact route count | 5 routes (`/`, `/_not-found`, `/api/health`, `/api/qc`, `/app`) |

## Manual smoke

- **Empty state (backwards compat):** `<TraceRail />` (no props) — confirmed by acceptance grep `agentEvents = []` default + `pacedEvents.length === 0 && !isLoading` branch. Renders `<SextantLoader status="awaiting hypothesis…" size="sm" />` exactly as the previous placeholder.
- **Live render:** confirmed by grep — 5 `AgentRow` instances render under `AGENT_ORDER.map(...)` once events arrive; `<ValidationGrid>` always renders below. Once Phase 4's main chat passes `agentEvents` + `validationChecks` + `plan` from `usePlan()`, the staircase + green ticks will animate live. (Live runtime smoke is gated on the main chat's wire-in — out of plan scope for 06-02.)
- **Demo-pace toggle:** the hook is wired BEFORE the reducer (`useDemoPacedEvents(agentEvents)` → `reduceAgentEvents(pacedEvents)`). When `?demoPace=slow` is in the URL, paced output drives the entire downstream chain.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced `useSearchParams()` with `window.location.search` read in useEffect**

- **Found during:** Task 2 build verification (`npm run build`)
- **Issue:** The plan's verbatim hook body imported `useSearchParams` from `next/navigation`. That hook triggers Next.js 15's CSR-bailout requirement on `/app` (which is `○ Static` per `next build`). Build failed with `useSearchParams() should be wrapped in a suspense boundary at page "/app"`.
- **Why we couldn't follow the plan literally:** The standard fix is wrapping the consuming component in `<Suspense>` at the page level (`src/app/app/page.tsx`), but that file is in the forbidden zone for Plan 06-02 (main chat's territory).
- **Fix applied:** Read `window.location.search` from inside a `useEffect` (post-mount, client-only). The `paceMs` state defaults to 0 during SSG / pre-mount, so the hook is a pure pass-through during the static-export phase. After hydration, the effect runs and updates `paceMs` per the URL param. User-visible behavior is identical — `?demoPace=slow|ultraslow` still drives the staircase exactly the same way.
- **Side effect on the acceptance criteria:** The plan's Task 1 grep `grep -q 'from "next/navigation"' src/components/trace/use-demo-paced-events.ts` no longer matches (the import was removed). All other acceptance criteria still pass. The hook still ships zero new dependencies.
- **Files modified:** `src/components/trace/use-demo-paced-events.ts` (lines 1-3 import block + new `readPaceMs()` helper + small `paceMs` state addition).
- **Folded into:** commit `ee36cc2` (Task 2) since the bug only surfaced when the hook was wired into the prerendered page.

No other deviations. Plan 06-01 leaf components (AgentRow, ValidationGrid) imported and composed exactly as specified.

## Phase 6 acceptance — TRACE-01..TRACE-04 end-to-end

| Req | Coverage |
|---|---|
| **TRACE-01** (4+ agents with status indicator + current task line) | 5 `<AgentRow>` instances (researcher / skeptic / operator / compliance / consolidator) render with status pill (idle/working/done/error) + 1-line task string from `eventToTask(ev)` |
| **TRACE-02** (active shimmer + done checkmark) | `animate-pulse` on the working row (AgentRow:58) + Lucide `Check` (forest, AgentRow:92) on done |
| **TRACE-03** (≥5 named tests with status pills) | `<ValidationGrid>` renders 6 baseline checks verbatim + ≥0 Skeptic extras with 4-state pills (pending / running / pass / fail) |
| **TRACE-04** (deterministic green tick) | `deriveBaselineStatus(name, plan, isLoading)` flips checks to `pass` against Plan content (validation-grid.tsx:81) |

## Verification

| Check | Result |
|---|---|
| `test -f src/components/trace-rail.tsx` | ✅ |
| `test -f src/components/trace/use-demo-paced-events.ts` | ✅ |
| `test -f .planning/demo-recipe.md` | ✅ |
| `npx tsc --noEmit` (whole project) | ✅ zero errors |
| `npm run build` | ✅ succeeds, 5 routes (`/app` static prerendered) |
| `grep -q "useDemoPacedEvents" src/components/trace-rail.tsx` | ✅ |
| `grep -q "useDemoPacedEvents(agentEvents)" src/components/trace-rail.tsx` | ✅ (called on RAW events) |
| `grep -q "reduceAgentEvents(pacedEvents)" src/components/trace-rail.tsx` | ✅ (reducer consumes paced) |
| `grep -c "<AgentRow" src/components/trace-rail.tsx` | ✅ 1 (in `.map()` — 5 instances at runtime) |
| `grep -c "<ValidationGrid" src/components/trace-rail.tsx` | ✅ 1 |
| `grep -c "STUB until Phase 3" src/components/trace-rail.tsx` | ✅ 1 |
| `grep -c "STUB until Phase 3" src/components/trace/use-demo-paced-events.ts` | ✅ 1 |
| `! grep -E '^import.*from "@/lib/plan/(trace\|schema)"' src/components/trace-rail.tsx` | ✅ no real imports (STUB still active) |
| `! grep -E '^import.*from "@/lib/plan/' src/components/trace/use-demo-paced-events.ts` | ✅ no real imports |
| `grep -q "useDemoPacedEvents" .planning/demo-recipe.md` | ✅ |
| `grep -q "demoPace=slow" .planning/demo-recipe.md` | ✅ |
| `grep -q "SEXTANT_DEMO_PACE_MS" .planning/demo-recipe.md` | ✅ |
| Forbidden zones untouched (`src/app/api`, `src/lib/plan`, `src/lib/qc`, `src/components/qc`, `src/components/plan`, `src/app/app`) | ✅ none modified |
| `git diff package.json` shows no new deps | ✅ empty |
| Wave 2 commit count | ✅ 3 (Task 1, Task 2, Task 3) + this SUMMARY |

## Self-Check: PASSED

- Files exist:
  - `src/components/trace-rail.tsx` ✅
  - `src/components/trace/use-demo-paced-events.ts` ✅
  - `.planning/demo-recipe.md` ✅ (contains the confirmation section)
- Commits exist:
  - `e06dff5` ✅ feat(06-02): add useDemoPacedEvents hook (?demoPace= URL param)
  - `ee36cc2` ✅ feat(06-02): replace trace-rail.tsx with live render (5 rows + validation grid + STUB fallback) (TRACE-01..04)
  - `8b4e0a3` ✅ docs(06-02): confirm demo-pace mechanism in demo-recipe.md

## Commits

| Task | Commit | Title |
|---|---|---|
| 1 | `e06dff5` | `feat(06-02): add useDemoPacedEvents hook (?demoPace= URL param)` |
| 2 | `ee36cc2` | `feat(06-02): replace trace-rail.tsx with live render (5 rows + validation grid + STUB fallback) (TRACE-01..04)` |
| 3 | `8b4e0a3` | `docs(06-02): confirm demo-pace mechanism in demo-recipe.md` |

## Phase 6 PHASE-COMPLETE

Plan 06-01 (leaf components) and Plan 06-02 (wire-in + demo pace) both shipped clean. Phase 6 satisfies TRACE-01..TRACE-04 end-to-end. Live runtime activation is gated on the main chat passing `agentEvents` + `plan` + `validationChecks` props from `usePlan()` to `<TraceRail>` — no Phase 6 work remaining; hand-off cleanly to the main chat / Phase 4.
