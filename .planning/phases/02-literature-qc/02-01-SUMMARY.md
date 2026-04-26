---
phase: 02-literature-qc
plan: 01
subsystem: literature-qc
tags: [ai-sdk, gemini, tavily, zod, schema, prompt, cache, provenance]
dependency_graph:
  requires:
    - 01-01 (Next.js scaffold + env loader)
    - 01-02 (dashboard shell + example-hypotheses module + chat panel)
  provides:
    - tavilySearch + TavilyResult (consumed by 02-02 route)
    - qcResponseSchema + citationSchema + QCResponse (consumed by 02-02 route + 02-03 useObject hook)
    - qcSystemPrompt + qcUserPrompt (consumed by 02-02 route)
    - hashHypothesis + getCached + setCached (consumed by 02-02 route)
    - validateCitationProvenance + ProvenanceOutcome (consumed by 02-02 route onFinish)
    - LIT_QC_MODEL_ID + LIT_QC_MODEL_ID_FALLBACK (consumed by 02-02 route)
  affects:
    - .gitignore (sentinel rule added)
    - src/lib/example-hypotheses.ts (chip text replaced with verbatim Fulcrum brief)
tech_stack:
  added:
    - ai@5.0.179 (Vercel AI SDK — streamObject + tool calling)
    - "@ai-sdk/google@2.0.70 (Gemini provider)"
    - "@ai-sdk/react@2.0.181 (experimental_useObject hook)"
  patterns:
    - "Discriminated-union response type via z.discriminatedUnion (single source of truth across server route + client hook)"
    - "Module-level Map<K, V> in-memory cache (first stateful module in the repo; SHA-256 keying; cold-start clearing)"
    - "Post-stream guard pure function returning {response, droppedCount} for structured-trace logging"
key_files:
  created:
    - src/lib/tavily.ts
    - src/lib/models.ts
    - src/lib/qc/schema.ts
    - src/lib/qc/prompt.ts
    - src/lib/qc/cache.ts
    - src/lib/qc/provenance.ts
    - .planning/research/fulcrum-brief.md
  modified:
    - package.json (3 deps added)
    - package-lock.json (lockfile updated)
    - .gitignore (sentinel rule)
    - src/lib/example-hypotheses.ts (chip text replaced verbatim)
decisions:
  - "Used ai@^5 (NOT ai@^4 as AI-SPEC §3 Pitfall #1 advised) because the project pins zod@^4.3.6 and ai@^5 declares peer-dep zod ^3.25.76 || ^4.1.8 — fully compatible. ai@^4 only supports zod v3 and would force a downgrade."
  - "Provenance utility returns ProvenanceOutcome { response, droppedCount } (extends PATTERNS.md's simpler signature) so the route's structured-trace log can record citations_provenance_dropped per AI-SPEC §7."
  - "tsx invokable via npx (v4.21.0) without devDep — no need to add to devDependencies for Plan 02-02 smoke."
metrics:
  duration: "5m 9s"
  task_count: 7
  file_count: 7  # 6 created + 1 (example-hypotheses.ts) modified content
  completed_date: "2026-04-26"
---

# Phase 2 Plan 1: Literature-QC Library Foundation Summary

**One-liner:** Six pure server-side library modules (Tavily client, Zod schema, scorer prompt, in-memory cache, anti-confabulation provenance guard, model-id constants) plus AI SDK v5 stack — every type and helper the streaming `/api/qc` route needs, with the chip-preflight gate released by verbatim Fulcrum brief text.

## Outcome

All 7 tasks (1 BLOCKING checkpoint + 6 implementation tasks) completed. Build is green. The 4 example chips on `/app` now render the verbatim Fulcrum brief sample hypotheses (CRP biosensor, L. rhamnosus GG, trehalose cryo, Sporomusa CO₂ fix) — CLAUDE.md hard rule #2 satisfied. The 6 new lib modules expose every named export the route plan (02-02) and UI plan (02-03) need; no further design choices remain.

## What Shipped

| File | Lines | Purpose |
|------|-------|---------|
| src/lib/tavily.ts | 47 | tavilySearch(query) + TavilyResult — locked D-32 params, AbortSignal.timeout(4000) (D-52), Authorization Bearer ${env.TAVILY_API_KEY} |
| src/lib/models.ts | 16 | LIT_QC_MODEL_ID = "gemini-3.1-flash-lite-preview" + LIT_QC_MODEL_ID_FALLBACK = "gemini-2.5-flash-lite" (D-22a, D-53) |
| src/lib/qc/schema.ts | 61 | qcResponseSchema (z.discriminatedUnion on "ok" with verdict/clarify/no-evidence/error branches), citationSchema (4 fields), QCResponse type |
| src/lib/qc/prompt.ts | 56 | qcSystemPrompt (4 policy blocks) + qcUserPrompt(hypothesis, results) |
| src/lib/qc/cache.ts | 33 | hashHypothesis (SHA-256 over trim().toLowerCase()), getCached, setCached over module-level Map |
| src/lib/qc/provenance.ts | 50 | validateCitationProvenance returning ProvenanceOutcome { response, droppedCount } — D-37 anti-confabulation |

Plus:
- `.planning/research/fulcrum-brief.md` (full Fulcrum brief verbatim — source-of-truth for hard rule #2)
- `.gitignore` sentinel rule (`.planning/phases/02-literature-qc/.chip-approval`)
- `src/lib/example-hypotheses.ts` chip text replaced verbatim with brief text

## Tasks and Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 0 | BLOCKING — chip-preflight gate (verbatim Fulcrum brief) | 1988e41 | .gitignore, src/lib/example-hypotheses.ts, .planning/research/fulcrum-brief.md |
| 1 | Install AI SDK v5 stack + create models.ts | 6d107f8 | package.json, package-lock.json, src/lib/models.ts |
| 2 | Create Tavily client (D-31, D-32, D-33) | 1e9984c | src/lib/tavily.ts |
| 3 | Create QC response Zod schema (D-40, D-36, D-43) | 4ddf7fe | src/lib/qc/schema.ts |
| 4 | Create QC scorer prompt (D-34, D-35, D-37, D-46, D-47) | 00a6c05 | src/lib/qc/prompt.ts |
| 5 | Create cache.ts + provenance.ts (D-50, D-51, D-37) | fbc1d50 | src/lib/qc/cache.ts, src/lib/qc/provenance.ts |
| 6 | Final type-check + build sanity gate | (no file changes) | npm run build green |

## Key Decisions Made During Execution

- **AI SDK version: v5, not v4.** The plan instructed `ai@^5` and noted that AI-SPEC §3 Pitfall #1 ("pin ai@^4") is obsolete because the project's `zod@^4.3.6` is satisfied by v5's peer-dep range (`^3.25.76 || ^4.1.8`) but NOT by v4 (which only supports zod v3). Verified: `node -e "console.log(typeof require('ai').streamObject)"` prints `function`. No peer-dep warnings during `npm install`.
- **Provenance utility return shape: `{ response, droppedCount }`.** PATTERNS.md showed a simpler signature returning just `QCResponse`; the plan extended it to surface `droppedCount` for the route's structured-trace log. Plan 02-02 reads `outcome.response` for the response and `outcome.droppedCount` for the log line.
- **tsx via npx, no devDep added.** `npx --yes tsx --version` resolved to v4.21.0 via the npm cache; Task 1 did not need to add `tsx` to `devDependencies`. Plan 02-02 smoke-tests will work via npx.
- **Chip text approval: pre-released by orchestrator.** Task 0's BLOCKING gate was already released before this executor ran (sentinel file present, .gitignore updated, example-hypotheses.ts already had verbatim Fulcrum text). The executor bundled all three artifacts into Task 0's commit per the orchestrator's commit instructions.

## Verification Results

- `test -f .planning/phases/02-literature-qc/.chip-approval` → PASS (sentinel exists)
- `[ "$(grep -c '^    id:' src/lib/example-hypotheses.ts)" -eq 4 ]` → PASS (4 chip entries)
- `grep -q "^\.planning/phases/02-literature-qc/\.chip-approval$" .gitignore` → PASS (sentinel ignored)
- `npm install` → PASS (15 packages added, no peer-dep errors)
- `npx tsc --noEmit` → PASS (exit 0, no output)
- `npm run build` → PASS (compiled in 2.1s, TypeScript checked in 2.2s, 8 static pages generated, route table includes /, /app, /api/health, /v1, /v2)
- `! grep -q "Failed to compile" /tmp/02-01-build.log` → PASS
- `! grep -q "Type error" /tmp/02-01-build.log` → PASS
- `node -e "console.log(typeof require('ai').streamObject)"` → `function`
- `node -e "console.log(typeof require('@ai-sdk/google').google)"` → `function`
- 4-branch union round-trip via `tsx -e`: all 4 cases (verdict, clarify, no-evidence, error) parse OK against `qcResponseSchema.safeParse`.
- `! grep -rq "process.env" src/lib/tavily.ts src/lib/models.ts src/lib/qc/` → PASS (no raw env reads in any new file)
- `grep -q 'export const env' src/lib/env.ts` → PASS (Phase-1 env loader untouched)

## Deviations from Plan

None — plan executed exactly as written. The only "deviation" was anticipated and documented in the plan itself: superseding AI-SPEC §3 Pitfall #1 advice (`ai@^4`) with `ai@^5` because of the zod v4 pin. This is the documented behavior, not an unplanned deviation.

The orchestrator pre-released Task 0's gate (sentinel + verbatim chip text + brief saved) before this executor ran; this executor only had to fold those three artifacts into a single commit per the orchestrator's instructions. Per the plan's `<resume-signal>` rules, the user approval was acted on by the orchestrator (`"approved — chip text verbatim"`).

## Auth Gates

None. No external service was contacted during execution (no LLM calls, no Tavily calls — those are Plan 02-02 territory).

## Phase-1 Invariants Intact

- `src/lib/env.ts` untouched.
- `src/app/api/health/route.ts` untouched.
- No new dependency outside the three pre-approved by AI-SPEC §3 (`ai`, `@ai-sdk/google`, `@ai-sdk/react`).
- No `.dark` selector, no `prefers-color-scheme`, no UI changes (no UI files touched).
- All env access via `import { env } from "@/lib/env"`.

## Downstream Readiness (Plan 02-02 + 02-03)

Every named import that 02-02's route handler will issue resolves now:
```ts
import { streamObject } from "ai";                                       // ✓ ai@5.0.179
import { google } from "@ai-sdk/google";                                  // ✓ @ai-sdk/google@2.0.70
import { qcResponseSchema, type QCResponse } from "@/lib/qc/schema";       // ✓ created Task 3
import { qcSystemPrompt, qcUserPrompt } from "@/lib/qc/prompt";            // ✓ created Task 4
import { tavilySearch } from "@/lib/tavily";                              // ✓ created Task 2
import { hashHypothesis, getCached, setCached } from "@/lib/qc/cache";    // ✓ created Task 5
import { validateCitationProvenance } from "@/lib/qc/provenance";        // ✓ created Task 5
import { LIT_QC_MODEL_ID } from "@/lib/models";                           // ✓ created Task 1
```

For 02-03 client UI:
```ts
import { experimental_useObject as useObject } from "@ai-sdk/react";      // ✓ @ai-sdk/react@2.0.181
import { qcResponseSchema, type QCResponse } from "@/lib/qc/schema";       // ✓ same module, isomorphic
```

## Known Stubs

None. This plan delivers pure library modules with no UI surface or stub data paths. The example-hypotheses chip text is now real Fulcrum content (no longer Phase-1 stand-ins).

## Self-Check: PASSED

- All 6 created files exist on disk: src/lib/tavily.ts, src/lib/models.ts, src/lib/qc/schema.ts, src/lib/qc/prompt.ts, src/lib/qc/cache.ts, src/lib/qc/provenance.ts. Verified via `test -f`.
- All 6 task commits exist in git log: 1988e41, 6d107f8, 1e9984c, 4ddf7fe, 00a6c05, fbc1d50. Verified via `git log --oneline -8`.
- `npm run build` exits 0 (full route table rendered).
- 4-branch discriminated-union round-trips successfully via Zod safeParse.
