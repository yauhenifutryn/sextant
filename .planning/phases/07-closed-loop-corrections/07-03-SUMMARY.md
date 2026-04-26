---
phase: 07-closed-loop-corrections
plan: 03
subsystem: correction-ui
tags: [closed-loop, correction-popover, header-pill, plan-tabs, wave-3]
status: complete
wave: 3
depends_on: [07-01]
unblocks: [07-04 (Wave 4 — diff modal + previousPlan snapshot, threads planContext through PlanTabs)]
requirements_addressed:
  - LOOP-01
files_created:
  - src/components/ui/popover.tsx
  - src/components/correction-popover.tsx
files_modified:
  - src/components/plan/protocol-tab.tsx
  - src/components/plan/materials-tab.tsx
  - src/components/plan/budget-tab.tsx
  - src/components/plan/timeline-tab.tsx
  - src/components/plan/validation-tab.tsx
  - src/components/header-bar.tsx
  - package.json
  - package-lock.json
decisions_applied:
  - D7-12: Radix-based CorrectionPopover with textarea + Cancel + Submit; toast on success/error
  - D7-13: each row in all 5 plan tabs wraps in CorrectionPopover with the right { kind, label }
  - D7-14: HeaderBar pill is live, fed by useLabRules(); singular/plural correct; aria-live polite
metrics:
  duration_seconds: 480
  task_count: 3
  file_count: 8
  completed_at: 2026-04-26T13:05:00Z
---

# Phase 7 Plan 03: Correction popover + clickable rows + live header pill — Summary

**One-liner:** Radix-based CorrectionPopover wraps every row in all 5 plan tabs, POSTs corrections to /api/lab-rules, and the header pill ("N lab rule(s)") updates live via useLabRules() — wiring LOOP-01's user-facing capture surface end to end.

## What shipped

### Task 1 — shadcn Popover primitive + CorrectionPopover (commit `1e96f3a`)

- `npx shadcn add popover` installed `@radix-ui/react-popover` (allowed: shadcn/ui IS the locked stack per CLAUDE.md hard rule #5) and generated `src/components/ui/popover.tsx`.
- `src/components/correction-popover.tsx`:
  - `"use client"` component with controlled `open` / `text` / `submitting` state.
  - Props: `{ children, target: { kind: LabRuleScope, label: string }, planContext?: { hypothesis, sliceJson }, onSuccess? }`. `LabRuleScope` is imported from `@/lib/lab-rules/schema` (Wave 1) — no string-literal redefinition.
  - Submit POSTs `{ correction, planContext, targetLine }` to `/api/lab-rules`. On 201: `toast.success("Lab rule captured.")` + `setText("")` + `setOpen(false)` + `await onSuccess?.()`. On error: `toast.error("Could not capture rule — try again.")` and the popover stays open with the user's text intact.
  - Submit disabled when text is empty/whitespace, when already submitting, OR when `planContext` is undefined.
  - **Pass-through fallback** for the parallel/no-context case: if `planContext` is undefined (Wave 4 hasn't wired the dashboard yet), the popover still renders for QA but the textarea is disabled with `placeholder="diff pre-flight pending"` and Submit is disabled. This is what lets Wave 3 ship before Wave 4 lands without breaking the build.

### Task 2 — wrap all 5 plan tabs in CorrectionPopover (commit `ac4253b` — co-merged with Wave 2)

- All 5 tab leaf components (`protocol-tab.tsx`, `materials-tab.tsx`, `budget-tab.tsx`, `timeline-tab.tsx`, `validation-tab.tsx`) now accept optional `planContext` + `onRuleCaptured` props.
- When `planContext` is supplied, each row body is rendered inside `<CorrectionPopover target={{ kind, label }} planContext={...} onSuccess={onRuleCaptured}>` with the right `kind` per tab:
  - `protocol_step` → `Step N: <description-first-80-chars>`
  - `material_row` → `<name> · <quantity>`
  - `budget_line` → `<category> · <formatCurrency(amount)>`
  - `timeline_phase` → `<phase> · <duration_days> days`
  - `validation_check` → `<check.name>`
- Each row gets a11y treatment when interactive: `role="button"`, `tabIndex={0}`, `aria-label="Correct ..."`, `cursor-pointer`, `hover:border-clay`, `focus-visible:ring-forest`.
- When `planContext` is undefined, rows render exactly as Phase 4 — no role/tabIndex changes, no hover affordance — preserving zero-regression behavior until Wave 4 threads the wiring.
- Materials uses `<tr>` directly as the trigger (Radix Slot preserves table semantics — no wrapper div that would break tbody children).
- Implementation note: the no-`planContext` branch returns `cloneElement(rowJsx, { key })` rather than a Fragment wrapper — keeps the `<li>` / `<tr>` as a direct child of `<ol>` / `<tbody>`.

### Task 3 — HeaderBar live pill via useLabRules() (commit `1f594e5`)

- `src/components/header-bar.tsx` is now `"use client"` and consumes `useLabRules()` (Wave 1 hook).
- Pill text: `"… lab rules"` while loading, then `"N lab rule"` (count === 1) or `"N lab rules"` (else).
- `aria-live="polite"` on the pill so screen readers announce updates after `refresh()` fires post-Submit.
- `tabular-nums` keeps the pill width stable as the count digits change.
- `aria-label` carries a descriptive form ("1 lab rule captured" / "Loading lab rules count") for non-visual users.
- Per execution rules, the pre-Wave-3 cleanup (avatar + settings stub buttons removed) was preserved — the plan body asked to add them back, but the execution rules explicitly said "Don't add the buttons back." Followed the execution rules.

## Verification (all green)

- `npx tsc --noEmit` exits 0 after all 3 tasks.
- `npm run build` exits 0 — turbopack production build succeeds; all 9 static pages generate; `/api/lab-rules` registered as dynamic.
- All plan-level acceptance grep checks pass:
  - `test -f src/components/correction-popover.tsx` ✓
  - `test -f src/components/ui/popover.tsx` ✓
  - `grep -q '@radix-ui/react-popover' package.json` ✓
  - `grep -c CorrectionPopover` per tab file ≥ 2 (actual: 4 each — import, comment, conditional, usage)
  - `grep -c 'kind: "<...>"'` per tab file = 1 (each tab has its correct scope literal)
  - `grep -c useLabRules src/components/header-bar.tsx` = 4 (≥ 2)
  - `grep -c 'lab rule' src/components/header-bar.tsx` = 5 (≥ 2)
  - `grep -c 'count === 1 ? "" : "s"' src/components/header-bar.tsx` = 2 (singular/plural, both pill text + aria-label)
  - `grep -c aria-live src/components/header-bar.tsx` = 1
  - `grep -c tabular-nums src/components/header-bar.tsx` = 1
  - `grep -c '0 lab rules' src/components/header-bar.tsx` = 0 (static text removed)

## Deviations from Plan

### [Rule 3 — Blocking issue / parallel-execution race] Task 2 commingled into Wave 2's commit

- **Found during:** Task 2 commit step.
- **Issue:** I staged the 5 tab files via `git add <files-by-name>` and was about to commit. Between my `git add` and my `git commit`, the parallel Wave 2 executor (running in the same git tree) committed its agent-prompt-injection batch and pulled my already-staged tab files into its commit (`ac4253b feat(07-02): all 4 agents accept labRules + append LAB RULES user-prompt block`). When I then tried `git commit -m "feat(07-03): wrap all 5 plan tabs ..."`, git replied "nothing to commit, working tree clean" — my work was already in main, just under Wave 2's commit message.
- **Fix:** Verified all 5 tab files contain my CorrectionPopover wiring (grep shows correct kind literals + import + usage in each), confirmed `ac4253b` includes both the agent files AND the tab files, and proceeded. Code is shipped, behavior is correct, tsc + build pass — only the commit-message attribution is messy. Did NOT attempt to redo the commit (would either be a no-op or risk reverting Wave 2's parallel work).
- **Files modified:** `src/components/plan/{protocol,materials,budget,timeline,validation}-tab.tsx` — diff visible in `git show ac4253b -- 'src/components/plan/*'`.
- **Commit:** `ac4253b` (co-shared with Wave 2).
- **Lesson for future runs:** when two executors share a working tree, `git add` + `git commit` should be a single atomic shell expression rather than two separate Bash calls; otherwise the interleave window allows another committer to absorb your staged files.

### [Rule 3 — Plan body conflict with execution rules] HeaderBar avatar/settings buttons NOT re-added

- **Found during:** Task 3.
- **Issue:** The plan body's Step 3 prescribes a header-bar.tsx replacement that includes avatar + Settings icon buttons (importing `Settings` from lucide-react). The execution rules explicitly state: "the pre-Wave-3 state has avatar+settings buttons removed (committed earlier this session). You'll only need to swap the static '0 lab rules' span with the live one. Don't add the buttons back."
- **Fix:** Followed the execution rules, kept only the live pill change. Did not import `Settings` (also avoided a potential lucide-react v1.11 compat risk).
- **Commit:** `1f594e5`.

No other deviations. No new dependencies beyond `@radix-ui/react-popover` (allowed via shadcn). No locked schemas touched (`src/lib/plan/schema.ts`, `src/lib/qc/schema.ts` untouched per D7-02). No Wave 2 files touched (`cache.ts`, `route.ts`, `agents/*.ts` are all owned by Wave 2).

## Wave handoff

- **Wave 4 (diff modal + previousPlan snapshot)** can now thread `planContext` and `onRuleCaptured` from `<PlanTabs />` and the dashboard down to each tab. Once that lands, clicking a row will pop the CorrectionPopover, Submit will hit `/api/lab-rules`, the pill will tick from "0 lab rules" to "1 lab rule", and the next plan generation (Wave 2's modified `/api/plan` route) will reflect the rule.
- The smoke-test path described in the plan's Verification section (steps 3-7) can be exercised end-to-end the moment Wave 4 wires the props.

## Self-Check: PASSED

- FOUND: `src/components/ui/popover.tsx`
- FOUND: `src/components/correction-popover.tsx`
- FOUND: `src/components/plan/protocol-tab.tsx` (with CorrectionPopover, kind: "protocol_step")
- FOUND: `src/components/plan/materials-tab.tsx` (with CorrectionPopover, kind: "material_row")
- FOUND: `src/components/plan/budget-tab.tsx` (with CorrectionPopover, kind: "budget_line")
- FOUND: `src/components/plan/timeline-tab.tsx` (with CorrectionPopover, kind: "timeline_phase")
- FOUND: `src/components/plan/validation-tab.tsx` (with CorrectionPopover, kind: "validation_check")
- FOUND: `src/components/header-bar.tsx` (with useLabRules + aria-live + singular/plural)
- FOUND commit: `1e96f3a` (Task 1)
- FOUND commit: `ac4253b` (Task 2 — commingled with Wave 2 per deviation above)
- FOUND commit: `1f594e5` (Task 3)
- tsc: 0 errors; npm run build: exit 0
