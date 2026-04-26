---
phase: 06-live-trace-validation
plan: 01
subsystem: trace-rail
tags: [trace, validation, presentational, leaf-components, ui]
requires: []
provides:
  - "src/components/trace/agent-row.tsx (AgentRow + AgentRowStatus exports)"
  - "src/components/trace/validation-grid.tsx (ValidationGrid + VALIDATION_SKELETON exports + duck-typed PlanLike + ValidationCheckLike + ValidationStatus types)"
affects:
  - "Plan 06-02 imports both leaves to compose <TraceRail>"
tech-stack:
  added: []
  patterns:
    - "Record<DiscriminatorLiteral, ClassNameString> tint-table (mirrors src/components/qc/citation-card.tsx:29-34 SOURCE_TINT shape)"
    - "Pure deriveBaselineStatus(name, plan, isLoading) switch with defensive nullish chains"
    - "Duck-typed PlanLike — local export, NO imports from @/lib/plan/*"
    - "Native title= tooltip for error_message + Skeptic pass_criteria (no shadcn Tooltip dep)"
key-files:
  created:
    - src/components/trace/agent-row.tsx
    - src/components/trace/validation-grid.tsx
  modified: []
decisions:
  - "Used duck-typed PlanLike instead of importing from @/lib/plan/schema. Even though Phase 3 has shipped src/lib/plan/{trace,schema}.ts at execute time, keeping Plan 06-01 self-contained means it can ship independently and lets Plan 06-02 own the AgentEvent + Plan import boundary (matches plan frontmatter coordination_concerns line 17)."
  - "Defensive budget read: amount_usd ?? line_total ?? 0 (covers both 06-CONTEXT.md naming and Phase 3 D-58 naming). budget_total optional — if absent, pass when sum > 0."
  - "Skeptic-emitted extras render as 'pending' with title={pass_criteria} tooltip — Phase 3 D-58 validationCheckSchema has no live status field. Per-check pass/fail is a Phase 7 concern."
  - "Working state shimmer = Tailwind animate-pulse on row + animate-spin on Loader2 icon (per 06-PATTERNS.md option 1, no inline <style>, no trace.css)."
  - "Error tooltip = native browser title= attribute (no new tooltip dependency)."
metrics:
  duration_minutes: ~15
  completed: 2026-04-26
---

# Phase 6 Plan 01: Trace Leaf Components Summary

Built two pure-presentational client components — `<AgentRow>` and `<ValidationGrid>` — under `src/components/trace/`, both self-contained with token-vocabulary classNames only and no imports from forbidden zones.

## What was built

### `src/components/trace/agent-row.tsx` (118 lines, commit `adfa70d`)

Single-agent row component. Props: `{ label, status, currentTask?, elapsedMs?, errorMessage? }` where `status: "idle" | "working" | "done" | "error"`. Visual states:

- **idle** — `opacity-70` row, muted pill (`bg-muted/10 text-muted-foreground`), no icon
- **working** — `animate-pulse` on the row, `bg-ink/10 text-ink` pill, Loader2 icon with `animate-spin`
- **done** — `bg-forest/10 text-forest` pill, Lucide `Check` icon (forest), elapsed_ms in mono numeric meta line
- **error** — `bg-clay/10 text-clay` pill, Lucide `AlertTriangle` icon (clay), `errorMessage` rendered as native `title=` tooltip

Rendered as `<li>` (parent will be a `<ul>`). `aria-label` includes both agent label and status. Token vocabulary only.

### `src/components/trace/validation-grid.tsx` (218 lines, commit `259b425`)

List-of-rows component. Exports `ValidationGrid`, `VALIDATION_SKELETON`, `ValidationStatus`, `ValidationCheckLike`, `PlanLike`, `ValidationGridProps`. Renders the 6 baseline checks verbatim followed by any Skeptic-emitted extras.

`deriveBaselineStatus(name, plan, isLoading)` is a pure switch over the 6 check names:

| Check name | Pass condition |
|---|---|
| Every reagent has a catalog URL | `materials.every(m => m.citations.length > 0)`; else "fail" if `grounded`; else "pending" |
| Budget sums correctly | `sum(amount_usd ?? line_total) === budget_total` (when present); else "pass" if `sum > 0` |
| No orphan protocol step | every step has citations OR is referenced by a validation check description |
| Citations resolve to real sources | `plan.grounded === true` (Phase 5 flips this) |
| Timeline dependencies valid | every `timeline[].depends_on` entry resolves to a known phase id |
| Compliance pipeline passes | `compliance_summary` non-empty AND no `agent_artifacts.compliance.error` |

Skeptic extras (after dedup against baseline names) render as "pending" with `title={pass_criteria}` tooltip. Skeptic's `validationCheckSchema` from Phase 3 D-58 carries no live status field — per-check pass/fail is a Phase 7 concern.

Pending = hollow ring + faint text. Running = `border-2 border-ink animate-pulse`. Pass = filled forest + Check icon. Fail = filled clay + X icon. List shape (`grid gap-2 font-mono text-[11.5px]`) preserved verbatim from current `trace-rail.tsx:42`.

## Type-stub strategy

**Duck-typed PlanLike inside `validation-grid.tsx`** — no imports from `@/lib/plan/*`. Even though Phase 3 has shipped `src/lib/plan/trace.ts` and `src/lib/plan/schema.ts` at execute time (verified: both files present, latest mtime 2026-04-26 ~10:52), the plan deliberately keeps these leaves self-contained. The eventual import boundary lives in Plan 06-02's `<TraceRail>` shell, which composes both leaves and converts the typed `Plan` from Phase 3 into the `PlanLike` shape used here (structural compatibility — TypeScript width-typing handles it without an explicit cast).

This matches the frontmatter coordination concern: "validation-grid MUST be defensive: read both names, fall back to summing amount_usd."

## Phase 3 / Plan 06-01 cross-state at execute time

- `src/lib/plan/trace.ts` ✅ shipped (commit `395a861`, Phase 3 Wave 1)
- `src/lib/plan/schema.ts` ✅ shipped (commit `c875bcf`, Phase 3 Wave 1)
- `src/lib/plan/cache.ts` ✅ shipped (commit `3a01168`, Phase 3 Wave 1)
- `src/lib/plan/agents/{researcher,skeptic,operator,compliance}.ts` ✅ shipped (commits `61299fb`, `f85b245`, Phase 3 Wave 2)
- `src/lib/plan/consolidator.ts` (untracked, Phase 3 Wave 2 in flight in parallel chat — NOT touched by this plan)

Plan 06-01 builds independently of all of these. The interface contract is fully duck-typed.

## Deviations

None. Plan executed exactly as written. The only minor note:

- **`validation-grid.tsx` length:** 218 lines vs. plan's "~140 lines" soft target. Extra lines come from multi-line JSX formatting (one prop per line in deeply nested `<li>` rows for readability). All hard requirements met (no hooks beyond what plan specified, no useEffect, no useMemo, no new deps, all 4 status states present, all 6 baseline strings verbatim, defensive budget reads).

## Verification

| Check | Result |
|---|---|
| `test -f src/components/trace/agent-row.tsx` | ✅ |
| `test -f src/components/trace/validation-grid.tsx` | ✅ |
| `npx tsc --noEmit` (entire project) | ✅ zero errors |
| `npm run build` | ✅ build succeeds, 5 routes generated |
| `git diff package.json` | ✅ empty (no new deps) |
| Forbidden-zone audit (`src/app/api/**`, `src/lib/plan/**`, `src/lib/qc/**`, `src/components/qc/**`, `src/components/plan/**`, `src/app/app/page.tsx`) | ✅ none touched |
| 6 baseline strings verbatim in validation-grid.tsx | ✅ all 6 present |
| 4 agent-row status states tinted | ✅ idle, working, done, error |
| Token vocabulary only (no raw hex, no `dark:`, no `md:|lg:|xl:`) | ✅ |

## Phase requirements covered (partial)

- **TRACE-01** (agents have status indicators) — `<AgentRow>` provides 4-state status pill (idle, working, done, error) ✅
- **TRACE-02** (shimmer + checkmark) — `animate-pulse` on working row + `<Check>` Lucide on done ✅
- **TRACE-03** (≥5 named tests with status pills) — `<ValidationGrid>` renders 6 baseline checks with 4 states ✅
- **TRACE-04** (deterministic green tick) — `deriveBaselineStatus` flips checks to "pass" against Plan content ✅

Plan 06-02 wires both into `<TraceRail>` to satisfy these end-to-end.

## Self-Check: PASSED

- Files exist:
  - `src/components/trace/agent-row.tsx` ✅
  - `src/components/trace/validation-grid.tsx` ✅
- Commits exist:
  - `adfa70d` ✅ feat(06-01): add AgentRow leaf component (TRACE-01, TRACE-02)
  - `259b425` ✅ feat(06-01): add ValidationGrid leaf component (TRACE-03, TRACE-04)

## Commits

| Task | Commit | Title |
|---|---|---|
| 1 | `adfa70d` | `feat(06-01): add AgentRow leaf component (TRACE-01, TRACE-02)` |
| 2 | `259b425` | `feat(06-01): add ValidationGrid leaf component (TRACE-03, TRACE-04)` |
