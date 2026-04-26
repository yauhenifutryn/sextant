---
phase: 07-closed-loop-corrections
plan: 02
subsystem: agent-prompt-injection
tags: [closed-loop, cache-key, agent-prompts, propagation, prop-01, prop-02]
status: complete
wave: 2
depends_on: [07-01]
unblocks: [07-04 (Wave 4 — diff modal + previousPlan snapshot)]
requirements_addressed:
  - PROP-01
  - PROP-02
files_created: []
files_modified:
  - src/lib/plan/cache.ts
  - src/app/api/plan/route.ts
  - src/lib/plan/agents/researcher.ts
  - src/lib/plan/agents/skeptic.ts
  - src/lib/plan/agents/operator.ts
  - src/lib/plan/agents/compliance.ts
decisions_applied:
  - D7-08: getLabRules() called once per request, threaded to all 4 runners
  - D7-09: LAB RULES block appended to USER prompt only; system prompts byte-identical
  - D7-10: compliance agent gets extra HOUSE COMPLIANCE CONSTRAINTS block for validation_check / global rules
  - D7-11: hashRunInput(hypothesis, labRules) replaces hashHypothesis as the cache-key hasher; legacy alias preserved
metrics:
  duration_seconds: 600
  task_count: 3
  file_count: 6
  completed_at: 2026-04-26T11:56:00Z
---

# Phase 7 Plan 02: Agent prompt injection + cache-key invalidation — Summary

**One-liner:** Plan generation is now lab-rule aware — `hashRunInput(hypothesis, labRules)` gives Plan A and Plan B distinct cache keys; all 4 agents receive a `LAB RULES (apply these to your output):` block in their user prompt when rules exist; compliance additionally emits a `compliance_notes` entry per `validation_check` / `global` rule (D7-10) so the propagation lands VISIBLY in the UI.

## What shipped

### Task 1 — Cache-key rename (commit `882cf26`)

- `src/lib/plan/cache.ts`
  - New `hashRunInput(hypothesis: string, labRules: LabRule[] = []): Promise<string>` — SHA-256 over `${trimmed_lowered}|${JSON.stringify(sorted_ids)}`. Sorted-by-locale-compare to make rule-order irrelevant.
  - Legacy `hashHypothesis(input)` preserved as a thin wrapper → `hashRunInput(input, [])`. Any forgotten caller still compiles.
  - **Intentional one-time cache invalidation:** the new hashing scheme uses `${normalized}|[]` (with a trailing pipe + empty-array marker) for empty rule sets, which does NOT collide with the pre-Phase-7 hash (`${normalized}` alone). Pre-Phase-7 cached `Plan A` entries become stale on the first request after deploy. Documented in code comment.
  - `setCachedRun`, `getCachedRun`, `getRunById` signatures and bodies UNCHANGED.

### Task 2 — Plan route loads + threads rules (commit `9d04a02`)

- `src/app/api/plan/route.ts`
  - `getLabRules()` called ONCE at request start, BEFORE the cache short-circuit (so Plan B can use the rule set as part of its key).
  - `hypothesis_hash` now produced by `hashRunInput(hypothesis, labRules)`.
  - `labRules: LabRule[]` threaded to all 4 runners (`runResearcher / runSkeptic / runOperator / runCompliance`).
  - `plan.run.started` log event now includes `lab_rules_count`.
  - `enrichMaterialsCitations`, the consolidator try/catch, the trace-error fallback, and the cache-hit branch are **untouched**.

### Task 3 — All 4 agents accept labRules + append user-prompt block (commit `ac4253b`)

- `src/lib/plan/agents/researcher.ts`
  - Imports `LabRule` from `@/lib/lab-rules/schema`.
  - `runResearcher` args type extended with optional `labRules?: LabRule[]`; default `[]` on destructure.
  - `researcherUserPrompt` accepts `labRules: LabRule[]` and appends a `LAB RULES (apply these to your output):` block AFTER the existing HYPOTHESIS / LIT-QC CONTEXT / PROTOCOL EVIDENCE blocks.
- `src/lib/plan/agents/skeptic.ts`
  - Same shape change. `skepticUserPrompt` extended.
- `src/lib/plan/agents/operator.ts`
  - Same shape change. `operatorUserPrompt` extended.
- `src/lib/plan/agents/compliance.ts`
  - Same shape change. `complianceUserPrompt` extended with TWO blocks:
    1. The standard `LAB RULES (apply these to your output):` block (D7-09).
    2. The D7-10 `HOUSE COMPLIANCE CONSTRAINTS` block — for any rule with `scope === "validation_check"` or `scope === "global"`, the compliance agent is instructed to emit ONE `compliance_notes` entry per rule, with `severity: "caution"` and a note that explicitly quotes the rule's source phrase. Makes propagation VISIBLE in the UI.
- `RESEARCHER_SYSTEM`, `SKEPTIC_SYSTEM`, `OPERATOR_SYSTEM`, `COMPLIANCE_SYSTEM` constants are **byte-identical** pre/post change. `git diff HEAD -- src/lib/plan/agents/*.ts | grep '_SYSTEM'` returns no lines that touch the constants. Preserves the Google implicit prefix-cache benefit.

## Verification (all green)

- `npx tsc --noEmit` — exit 0 after every task.
- `npm run build` — exit 0 after Task 3. All routes (`/`, `/app`, `/api/health`, `/api/lab-rules`, `/api/plan`, `/api/qc`) compile.
- All plan-level grep acceptance checks pass:
  - `grep -c 'export async function hashRunInput' src/lib/plan/cache.ts` → 1
  - `grep -c 'export async function hashHypothesis' src/lib/plan/cache.ts` → 1 (legacy alias preserved)
  - `grep -c 'hashRunInput' src/app/api/plan/route.ts` → 2 (import + call site)
  - `grep -c 'hashHypothesis' src/app/api/plan/route.ts` → 0
  - `grep -c 'getLabRules' src/app/api/plan/route.ts` → 2 (import + await call)
  - `grep -c 'labRules })' src/app/api/plan/route.ts` → 4 (one per runner)
  - `grep -c 'lab_rules_count' src/app/api/plan/route.ts` → 1
  - `grep -c 'labRules' src/lib/plan/agents/{researcher,skeptic,operator,compliance}.ts` → 8 / 8 / 8 / 9 (≥4 each)
  - `grep -c 'LAB RULES (apply these to your output)' src/lib/plan/agents/*.ts` → 1 each
  - `grep -c 'HOUSE COMPLIANCE CONSTRAINTS' src/lib/plan/agents/*.ts` → only `compliance.ts` is 1; researcher / skeptic / operator are 0.

## Deviations from Plan

### [Rule 3 — Concurrent worktree side-effect] Wave 3 tab files swept into Task 3 commit

- **Found during:** Task 3 commit (`git add src/lib/plan/agents/*.ts && git commit`).
- **Issue:** The Wave 3 executor was running in parallel and had already staged 5 of its UI files (`src/components/plan/{budget,materials,protocol,timeline,validation}-tab.tsx`) in the shared git index by the time my Task 3 commit ran. Because git's `commit` step commits whatever is in the index — not just the paths I named in `git add` — those 5 tab files landed in commit `ac4253b` alongside my 4 Wave 2 agent files.
- **Fix:** None applied. The Wave 3 changes are correct content and need to be on `main` for Wave 3 to complete; surgically rebasing them out at T-3h to deadline is destructive and risky. The commit message describes only the Wave 2 work, but the diff also contains Wave 3 tab edits. Wave 3's executor will see a clean working tree on those 5 files — they will adapt by either committing remaining edits or noting the pre-commit in their own SUMMARY.
- **Net effect on PROP-01 / PROP-02:** zero. The Wave 2 propagation pathway is fully wired (cache key + agent prompts) and `npm run build` is green.
- **Files modified by deviation:** `src/components/plan/budget-tab.tsx`, `src/components/plan/materials-tab.tsx`, `src/components/plan/protocol-tab.tsx`, `src/components/plan/timeline-tab.tsx`, `src/components/plan/validation-tab.tsx` (all Wave 3-owned, not Wave 2).
- **Commit affected:** `ac4253b`.

No other deviations. No CLAUDE.md hard rules broken. No new dependencies. No schema changes (`src/lib/plan/schema.ts`, `src/lib/qc/schema.ts` untouched per D7-02). No system-prompt edits to any agent.

## Wave handoff

- **Wave 4 (diff modal + previousPlan snapshot)** is now unblocked from the Wave 2 side. It needs Plan B to actually re-run when rules change — that is now true (cache key changes + agent prompts change). Wave 4 still needs Wave 3's UI surface (correction popover + tab clickable surfaces) to land for the full demo loop.
- **Smoke-test recipe (for Phase 8 demo dry-run):**
  1. `npm run dev`. `data/lab_rules.json` is `{ "rules": [] }`.
  2. Submit chip h1 (CRP biosensor). Server log shows `plan.run.started` with `lab_rules_count: 0`. Plan A renders.
  3. Add a rule manually to `data/lab_rules.json` with `scope: "validation_check"` and a quotable source_correction (the demo script in CONTEXT.md D7-18 has the canonical text).
  4. Re-submit h1 (or submit h2). Server log shows `lab_rules_count: 1`, distinct `hypothesis_hash`. Agents re-run; Plan B's compliance section includes a `compliance_notes` entry quoting the rule's source phrase.

## Self-Check: PASSED

- FOUND: `src/lib/plan/cache.ts` (modified — `hashRunInput` exported)
- FOUND: `src/app/api/plan/route.ts` (modified — `getLabRules` + `hashRunInput` both called)
- FOUND: `src/lib/plan/agents/researcher.ts` (modified — `LabRule` import + `labRules` arg + LAB RULES block)
- FOUND: `src/lib/plan/agents/skeptic.ts` (modified — same shape)
- FOUND: `src/lib/plan/agents/operator.ts` (modified — same shape)
- FOUND: `src/lib/plan/agents/compliance.ts` (modified — same shape + HOUSE COMPLIANCE CONSTRAINTS block)
- FOUND commit: `882cf26` (Task 1 — cache key rename)
- FOUND commit: `9d04a02` (Task 2 — route threads labRules + new cache key)
- FOUND commit: `ac4253b` (Task 3 — 4 agents accept labRules + append user-prompt block)
- tsc + build green: yes
