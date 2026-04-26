---
phase: 07-closed-loop-corrections
plan: 01
subsystem: lab-rules
tags: [closed-loop, schema, store, extractor, api, hook, foundation]
status: complete
wave: 1
depends_on: []
unblocks: [07-02 (Wave 2 — agent prompt injection + cache invalidation), 07-03 (Wave 3 — popover + header pill)]
requirements_addressed:
  - LOOP-02
  - LOOP-03
  - LOOP-04
files_created:
  - src/lib/lab-rules/schema.ts
  - src/lib/lab-rules/store.ts
  - src/lib/lab-rules/extractor.ts
  - src/app/api/lab-rules/route.ts
  - src/hooks/use-lab-rules.ts
  - data/lab_rules.json
files_modified: []
decisions_applied:
  - D7-01: minimal LabRule fields (no confidence / last_used_at / superseded_by)
  - D7-02: src/lib/plan/schema.ts and src/lib/qc/schema.ts NOT touched
  - D7-03: data/lab_rules.json committed, NOT gitignored
  - D7-04: read-through-from-disk store, no in-memory cache
  - D7-05: server-side post-fill of id + created_at; model never invents these
  - D7-06: experimental_repairText fallback + outer try/catch fallback for total Gemini outage
  - D7-07: GET + POST /api/lab-rules, runtime nodejs, maxDuration 15
  - D7-14: useLabRules hook with refresh() — minimal, no SWR
metrics:
  duration_seconds: 161
  task_count: 3
  file_count: 6
  completed_at: 2026-04-26T11:49:35Z
---

# Phase 7 Plan 01: Lab-rules backend foundation — Summary

**One-liner:** Typed `LabRule` schema + file-backed JSON store + Gemini extractor + `/api/lab-rules` GET/POST route + `useLabRules` client hook — every server-side and shared-client primitive Phase 7 needs before agents (Wave 2) or UI (Wave 3) can consume rules.

## What shipped

### Task 1 — Schema + store (commit `bf240ff`)

- `src/lib/lab-rules/schema.ts`
  - `labRuleScopeEnum` (6 members: `protocol_step`, `material_row`, `budget_line`, `timeline_phase`, `validation_check`, `global`).
  - `labRuleSchema` (Zod) with `id`, `rule`, `scope`, `reasoning`, `source_correction`, `created_at`. Bounded string lengths.
  - `labRuleDraftSchema = labRuleSchema.omit({ id: true, created_at: true })` for extractor output (D7-05 — server post-fills both).
  - `labRulesFileSchema` for `{ rules: LabRule[] }` on-disk shape.
- `src/lib/lab-rules/store.ts`
  - `getLabRules(): Promise<LabRule[]>` — read-through from disk; missing/malformed file returns `[]`, never throws.
  - `addLabRule(rule: LabRule): Promise<void>` — append + write back. Throws on Vercel read-only FS so the route can return a clear 500.
  - `path.join(process.cwd(), "data", "lab_rules.json")` — same pattern as `src/lib/plan/cache.ts`.

### Task 2 — Extractor + API route + seed JSON (commit `7a34c84`)

- `src/lib/lab-rules/extractor.ts`
  - One Gemini call via `pickAvailableLitQcModel()` (shared model ladder; reuses Phase 2/3 cache).
  - `generateObject` with `labRuleDraftSchema`, `temperature: 0.1`, `maxOutputTokens: 600`, `structuredOutputs: false`, `thinkingBudget: 0`, 12s `AbortSignal.timeout`.
  - `experimental_repairText` callback (D7-06) — malformed JSON falls back to a stub rule with verbatim user text.
  - Outer `try/catch` hard fallback — total Gemini outage still produces a stub rule so the demo never bricks on a 503.
- `src/app/api/lab-rules/route.ts`
  - `GET` returns `{ rules: LabRule[] }`.
  - `POST` validates body with Zod (`postBodySchema` mirrors `ExtractArgs`), runs `extractLabRule`, server-fills `id = crypto.randomUUID().slice(0,8)` + `created_at = new Date().toISOString()` (D7-05), persists via `addLabRule`, returns the new `LabRule` with status 201.
  - `runtime: "nodejs"`, `maxDuration: 15`.
  - Structured single-line JSON logs on capture / extractor failure / persist failure.
- `data/lab_rules.json` — committed with `{ "rules": [] }`. Verified NOT gitignored (`.gitignore` only excludes `data/runs/*.json`).

### Task 3 — Client hook (commit `db5b3e4`)

- `src/hooks/use-lab-rules.ts` (new dir created)
  - `"use client"` directive at top.
  - Returns `{ rules, count, isLoading, error, refresh }`. `refresh()` is a stable `useCallback` so consumers can pass it to effects.
  - `fetch("/api/lab-rules", { cache: "no-store" })` — count is always fresh after a `refresh()`.
  - No SWR, no react-query (CLAUDE.md hard rule #5).
  - Reuses `LabRule` type from `@/lib/lab-rules/schema` (no inline duplication).

## Verification (all green)

- `npx tsc --noEmit` — exit 0 after every task.
- `npm run build` — exit 0 after Task 2 (route compiles for production; `/api/lab-rules` registered as dynamic in the route table).
- All 17 plan-level acceptance grep checks pass (file existence, export names, exact constant strings, gitignore boundary).
- `data/lab_rules.json` parses as JSON with `rules: []` (length 0).
- Extractor file imports only from `@/lib/lab-rules/schema`, `@/lib/models`, and `ai`/`@ai-sdk/google` — no boundary violations.
- Store file does NOT import from `src/lib/plan/schema.ts` (boundary check passes per Task 1 acceptance).

## Deviations from Plan

**One micro-edit, no rule break:**

- In `extractor.ts`, the `experimental_repairText` callback signature was kept identical to the plan but the destructured `text` parameter was prefixed with an underscore (`{ text: _text }`) to signal the unused-param to the linter without breaking the AI SDK's expected signature. Functionally identical to the plan body — the fallback never reads `text`; it always emits the verbatim user correction per D7-06.

No deviations beyond this. No new dependencies added (none needed). No locked files touched (`src/lib/plan/schema.ts`, `src/lib/qc/schema.ts` untouched per D7-02). No agent runners or plan route touched (Wave 2's territory). No UI components touched (Wave 3's territory).

## Wave handoff

- **Wave 2 (agent prompt injection + cache invalidation)** can start immediately. It needs `getLabRules()` from the store and `LabRule` type from the schema — both ready.
- **Wave 3 (correction popover + header pill)** can start immediately in parallel. It needs `useLabRules()` (ready) and the `POST /api/lab-rules` endpoint shape (ready and matches the planned `{ correction, planContext, targetLine }` body).
- **Wave 4 (diff modal)** is gated on Wave 2 + Wave 3, not on this wave.

## Self-Check: PASSED

- FOUND: `src/lib/lab-rules/schema.ts`
- FOUND: `src/lib/lab-rules/store.ts`
- FOUND: `src/lib/lab-rules/extractor.ts`
- FOUND: `src/app/api/lab-rules/route.ts`
- FOUND: `src/hooks/use-lab-rules.ts`
- FOUND: `data/lab_rules.json`
- FOUND commit: `bf240ff` (Task 1)
- FOUND commit: `7a34c84` (Task 2)
- FOUND commit: `db5b3e4` (Task 3)
