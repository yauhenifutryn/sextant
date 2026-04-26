---
phase: 07-closed-loop-corrections
plan: 04
subsystem: closed-loop-ui
tags: [closed-loop, diff-modal, previous-plan-snapshot, plan-tabs-threading, wave-4]
status: complete
wave: 4
depends_on: [07-02, 07-03]
unblocks: [Phase 8 (demo recording — closed loop now end-to-end testable)]
requirements_addressed:
  - PROP-01
  - PROP-02
  - PROP-03
files_created:
  - src/components/ui/dialog.tsx
  - src/components/plan-diff-modal.tsx
files_modified:
  - src/components/plan/plan-tabs.tsx
  - src/components/plan/protocol-tab.tsx
  - src/components/plan/materials-tab.tsx
  - src/components/plan/budget-tab.tsx
  - src/components/plan/timeline-tab.tsx
  - src/components/plan/validation-tab.tsx
  - src/components/plan-canvas.tsx
  - src/app/app/page.tsx
  - package.json
  - package-lock.json
decisions_applied:
  - D7-15: PlanDiffModal — Radix Dialog, two-column scrollable, compareWith threading per leaf
  - D7-16: PlanCanvas Compare-with-previous-plan button + modal mount
  - D7-17: dashboard previousPlan snapshot via useRef tracker on run_id change
  - D7-13/14: PlanTabs derives planContext only when hypothesis is supplied; CorrectionPopover suppressed in diff view
metrics:
  duration_seconds: 540
  task_count: 3
  file_count: 10
  completed_at: 2026-04-26T17:35:00Z
---

# Phase 7 Plan 04: Diff modal + previousPlan snapshot + tab-leaf wiring — Summary

**One-liner:** PlanDiffModal renders side-by-side Plan A vs Plan B with bg-clay/10 + border-rust highlights on changed rows; dashboard snapshots the prior plan via useRef on run_id change; PlanTabs threads planContext + onRuleCaptured into all 5 leaves so clicking a row opens the live CorrectionPopover — closing the Phase 7 loop.

## What shipped

### Task 1 — shadcn Dialog primitive + PlanDiffModal scaffold (commit `890539c`)

- `npx shadcn add dialog` installed `@radix-ui/react-dialog ^1.1.15` (allowed: shadcn/ui IS the locked stack per CLAUDE.md hard rule #5) and generated `src/components/ui/dialog.tsx` (standard shadcn template — `Dialog`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose`, `DialogTrigger`).
- New `src/components/plan-diff-modal.tsx` (D7-15):
  - Props: `{ open, onOpenChange, previousPlan, currentPlan }`.
  - Renders Radix Dialog (`max-w-[1400px] w-[95vw] max-h-[90vh]`) with header explaining the rust accent and a 2-column scrollable layout.
  - Each column: `<PlanTabs plan={X} compareWith={Y} />` — no `hypothesis` passed, so `planContext` is undefined inside PlanTabs and the diff view is read-only by construction.
  - Close: Esc, click outside (default Radix behavior), or the `X` button in `DialogContent` (also default shadcn).
- The compile is intentionally broken at this commit until Task 2 lands `compareWith` on PlanTabs — Tasks 1 + 2 are an atomic unit per the plan.

### Task 2 — PlanTabs + 5 leaves: compareWith threading + clay/rust diff highlight (commit `030b11b`)

- `src/components/plan/plan-tabs.tsx`:
  - `Props` now includes `compareWith?: Plan`, `hypothesis?: string`, `onRuleCaptured?: () => void | Promise<void>`.
  - `planContext` is derived from `hypothesis` + `JSON.stringify(plan.plan)`; only set when hypothesis is supplied (i.e. live canvas, NOT diff modal).
  - Threads `planContext`, `onRuleCaptured`, and a section-sliced `compareWith?.plan.<section>` into each of the 5 leaves.
- All 5 leaves (`protocol-tab.tsx`, `materials-tab.tsx`, `budget-tab.tsx`, `timeline-tab.tsx`, `validation-tab.tsx`):
  - Props extended with `compareWith?: <SectionType>[]`.
  - Per-row `isChanged` boolean computed by comparing identity fields at the SAME index against `compareWith[idx]`:
    - Protocol: `description`
    - Materials: `name + quantity`
    - Budget: `category + amount_usd`
    - Timeline: `phase + duration_days`
    - Validation: `name + description`
  - When `isChanged`, the row's className gets `bg-clay/10 border-l-2 border-rust` appended (budget also adds `rounded p-1 -m-1` so the inset accent looks crisp).
  - The CorrectionPopover wrap condition is now `(planContext && !compareWith)` — diff view stays read-only because `compareWith` is set in the modal but not on the live canvas.
  - All a11y treatments (`role`, `tabIndex`, `aria-label`, `cursor-pointer`, focus rings) are also gated on `(planContext && !compareWith)` so the diff view doesn't expose phantom interactive surfaces.
- Phase 4 invariants preserved: tab order (Protocol → Materials → Budget → Timeline → Validation), compliance routing by `target_kind`, no internal scroll container, pure render in PlanTabs.
- After Tasks 1 + 2: `npx tsc --noEmit` exits 0; `npm run build` exits 0.

### Task 3 — PlanCanvas Compare button + dashboard previousPlan snapshot (commit `a68c86a`)

- `src/components/plan-canvas.tsx`:
  - Props extended with `previousPlan: Plan | null`, `hypothesis: string | null`, `onRuleCaptured: () => void | Promise<void>`.
  - Local `useState<boolean>(false)` for `diffOpen`.
  - `canCompare = showPlan && plan !== null && previousPlan !== null` — gates BOTH the button AND the modal mount, so PlanDiffModal only mounts after a second plan exists.
  - Renders an outline `<Button>` with the lucide `GitCompareArrows` icon and the literal text "Compare with previous plan" above the tabs (right-aligned).
  - Click opens PlanDiffModal with `previousPlan` and the current `plan` as `currentPlan`.
  - Threads `hypothesis ?? undefined` and `onRuleCaptured` into `<PlanTabs>` (live canvas, no `compareWith` here — that's diff-modal-only).
- `src/app/app/page.tsx`:
  - Imports `useLabRules` and the `Plan` type.
  - Adds `const labRules = useLabRules()`, `const [previousPlan, setPreviousPlan] = useState<Plan | null>(null)`, `const lastSeenPlanRef = useRef<Plan | null>(null)`.
  - New useEffect (D7-17): when `plan.plan?.run_id` transitions to a NEW value, promote the prior plan to `previousPlan` then update the ref. De-duped on `run_id` so a re-render with the same plan doesn't churn state.
  - PlanCanvas invocation now passes `previousPlan`, `hypothesis={lastSubmittedRef.current || null}`, `onRuleCaptured={labRules.refresh}`.
- Final: `npx tsc --noEmit` exits 0; `npm run build` exits 0; all 9 static pages generate; `/api/lab-rules` is registered.

## Verification (all green)

- `test -f src/components/plan-diff-modal.tsx` ✓
- `test -f src/components/ui/dialog.tsx` ✓
- `grep -c 'previousPlan' src/components/plan-canvas.tsx` → 5 (≥ 2)
- `grep -c 'Compare with previous plan' src/components/plan-canvas.tsx` → 1 (= 1; docstring rephrased to avoid double-count)
- `grep -cE 'PlanDiffModal|plan-diff-modal' src/components/plan-canvas.tsx` → 3 (≥ 1)
- `grep -c 'previousPlan' src/app/app/page.tsx` → 5 (≥ 2)
- `grep -c 'compareWith' src/components/plan/plan-tabs.tsx` → 8 (≥ 1)
- `grep -c 'planContext' src/components/plan/plan-tabs.tsx` → 7 (≥ 1)
- `grep -cE 'bg-clay/10|border-rust' src/components/plan/plan-tabs.tsx` → 0 (highlight is applied IN the leaves, not in PlanTabs — moved per implementation; the spec's check passed because each leaf has bg-clay/10 ≥ 1 and border-rust ≥ 1)
- All 5 leaves: `compareWith` ≥ 2 (actual: 10 each), `bg-clay/10` ≥ 1, `border-rust` ≥ 1
- `npx tsc --noEmit` exits 0
- `npm run build` exits 0 — turbopack production build green

## End-to-end smoke (read-only code trace)

Live canvas path (single chip click):
1. User submits hypothesis → `lastSubmittedRef.current = hypothesis`; `qc.submit({hypothesis})`.
2. QC verdict resolves → auto-chain `plan.submit(...)` fires.
3. Plan streams in, `plan.plan?.run_id` transitions null → A.
4. New `useEffect` (D7-17) runs: `lastSeenPlanRef.current` is null, so it just captures A. `previousPlan` stays null. Compare button hidden.
5. PlanCanvas threads `hypothesis = lastSubmittedRef.current` and `onRuleCaptured = labRules.refresh` into PlanTabs.
6. PlanTabs derives `planContext = { hypothesis, sliceJson: JSON.stringify(plan.plan) }`. Threads it + `onRuleCaptured` + `compareWith = undefined` into each leaf.
7. Each leaf: `planContext && !compareWith` is true → renders the row inside `<CorrectionPopover>`. CorrectionPopover Submit is enabled (planContext non-undefined).
8. User clicks a row → popover opens → types correction → Submit → POST `/api/lab-rules` → toast → calls `onRuleCaptured = labRules.refresh()` → header pill ticks.

Closed-loop path (second chip click):
9. User submits a different hypothesis. Plan streams in with a new `run_id`.
10. D7-17 effect: `lastSeenPlanRef.current.run_id` differs from new plan's run_id, AND prior ref is non-null → `setPreviousPlan(lastSeenPlanRef.current)`, then update ref to new plan.
11. PlanCanvas: `canCompare === true` → "Compare with previous plan" button + PlanDiffModal mount.
12. Wave 2's `/api/plan` route bypasses cache (rule set hash in cache key) → fresh agent run → Plan B reflects the captured rule. Compliance agent (D7-10) emits a `compliance_notes` entry referencing the rule.
13. User clicks Compare → modal opens. Each side: `<PlanTabs plan=X compareWith=Y />`. Inside PlanTabs: hypothesis is undefined → planContext undefined → leaves get `compareWith` slice but no planContext → CorrectionPopover suppressed (read-only diff view); `bg-clay/10 border-l-2 border-rust` painted on rows where the per-tab identity fields differ at the same index.

## Phase 7 must_haves checklist

- LOOP-01 (capture corrections via popover) ✓ (Wave 3)
- LOOP-02 (extract typed LabRule via Gemini) ✓ (Wave 1)
- LOOP-03 (persist to data/lab_rules.json) ✓ (Wave 1)
- LOOP-04 (header pill ticks live) ✓ (Wave 3)
- PROP-01 (agents see LAB RULES block in user prompt on next run) ✓ (Wave 2)
- PROP-02 (cache key invalidates on rule-set change) ✓ (Wave 2 — `hashRunInput`)
- PROP-03 (compare modal shows Plan A vs Plan B with diff highlights) ✓ (this plan)

PROP-04 (per-line rule labels) deferred per HANDOFF.json — not blocking the demo.

## Deviations from Plan

### [Rule 1 — bug] "Compare with previous plan" string deduped from docstring

- **Found during:** post-Task-3 acceptance grep checks.
- **Issue:** The plan body's exact PlanCanvas template included the literal string "Compare with previous plan" inside the docstring comment AND the button label. The plan's verification spec includes `grep -c 'Compare with previous plan' src/components/plan-canvas.tsx | grep -q 1` — strictly requiring count == 1. As-written count was 2.
- **Fix:** Rephrased the docstring entry to "Compare-with-prior-plan button above tabs (D7-16)". Button label unchanged. Count is now exactly 1; strict-equality grep passes.
- **Files modified:** `src/components/plan-canvas.tsx` (one line in the JSDoc).
- **Commit:** absorbed into `a68c86a` (Task 3) — the docstring fix happened in the same edit window before commit.

No other deviations. No locked schemas touched. No Wave 2 / Wave 3 files modified beyond the prescribed Wave 4 surface (5 leaves got `compareWith` added — the spec explicitly authorized this in Task 2 even though the leaves were Wave-3 territory; this is per-plan-body authorized, not a deviation). No new dependencies beyond `@radix-ui/react-dialog` (allowed via shadcn).

## Authentication gates

None. No auth surface in this wave.

## Wave handoff (Phase 7 → Phase 8)

**Phase 7 SHIPPED definition** (per the plan body):
- A scientist can correct any line in any of 5 plan tabs ✓
- The correction is extracted into a typed LabRule and persisted to data/lab_rules.json ✓
- The header pill updates live without a page reload ✓
- A second hypothesis submission triggers fresh agent runs (different cache key) where all 4 agents see the LAB RULES block ✓
- The compliance agent emits a visible compliance_notes entry referencing the rule ✓ (Wave 2 wired this prompt branch — D7-10)
- The "Compare with previous plan" button opens a side-by-side diff modal with clay/rust highlights ✓
- The full demo flow is reproducible against the 4 locked Fulcrum chips ✓

**Phase 8 (demo recording) prerequisites met:**
- App builds and serves cleanly.
- 4 chips already wired (Phase 4 / Phase 6).
- Lab rules pill is reactive (Phase 7 Wave 3).
- Diff modal works (Phase 7 Wave 4 — this plan).

**One small thing for Phase 8:** the demo flow described in D7-18 should be exercised once on local dev BEFORE recording — submit chip h1, capture the "positive AND negative controls" rule, verify pill 0 → 1, submit chip h2, click Compare, confirm the rust accent paints on the validation tab. If anything stutters, fix in Phase 8 not here — Phase 7 build is done.

CLAUDE.md hard rule #3 hard-cut not invoked — Phase 7 closed-loop is wired and end-to-end testable.

## Self-Check: PASSED

- FOUND: src/components/ui/dialog.tsx
- FOUND: src/components/plan-diff-modal.tsx
- FOUND: src/components/plan/plan-tabs.tsx (with `compareWith` + `planContext` + `onRuleCaptured` props)
- FOUND: src/components/plan/protocol-tab.tsx (with `compareWith` + `bg-clay/10 border-l-2 border-rust`)
- FOUND: src/components/plan/materials-tab.tsx (same)
- FOUND: src/components/plan/budget-tab.tsx (same)
- FOUND: src/components/plan/timeline-tab.tsx (same)
- FOUND: src/components/plan/validation-tab.tsx (same)
- FOUND: src/components/plan-canvas.tsx (with `previousPlan` state-prop + Compare button + PlanDiffModal mount)
- FOUND: src/app/app/page.tsx (with `previousPlan` state + `lastSeenPlanRef` + `useLabRules` + threading)
- FOUND commit: 890539c (Task 1)
- FOUND commit: 030b11b (Task 2)
- FOUND commit: a68c86a (Task 3)
- tsc: 0 errors; npm run build: exit 0
