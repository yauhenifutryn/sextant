---
phase: 03-multi-agent-pipeline
plan: 01
subsystem: multi-agent-foundations
tags: [phase-3, multi-agent, foundation, schema, trace-events, cache, zod]
requires: [phase-2-complete]
provides: [agent-event-schema, plan-schema, plan-cache, run-artifact-dir]
affects: [phase-3-wave-2-agents, phase-3-wave-3-route, phase-4-canvas, phase-6-trace-rail, phase-7-diff-modal]
tech-stack:
  added: []
  patterns:
    - "Discriminated-union Zod schema (Phase 2 D-40 → Phase 3 D-62 for AgentEvent)"
    - "In-memory Map<id, Plan> cache + disk read-through (Phase 2 D-50 → Phase 3 D-64 with cold-start fall-through)"
    - "SHA-256(trim().toLowerCase()) hypothesis hash key (Phase 2 D-50 → Phase 3 D-65)"
    - "citationSchema reuse via @/lib/qc/schema import (D-58 — single source of truth, no redefinition)"
    - "Server-only modules (Node crypto.subtle + fs/promises) — leaf trace.ts pure z import only"
key-files:
  created:
    - "src/lib/plan/trace.ts (63 lines) — AgentEvent schema, Phase 6 unblocker"
    - "src/lib/plan/schema.ts (98 lines) — top-level Plan + 7 row schemas + 9 type exports"
    - "src/lib/plan/cache.ts (88 lines) — in-memory + disk read-through"
    - "data/runs/.gitkeep (1 line) — runtime artifact directory marker"
  modified:
    - ".gitignore (+4 lines) — `data/runs/*.json` + `!data/runs/.gitkeep` negation"
decisions:
  - "Wrote files verbatim per plan-supplied module bodies — no schema deviations (D-58/D-62 are locked)"
  - "complianceNoteSchema added to schema.ts even though plan body comment says it's `notes` array on planSchema — both are present (planSchema.compliance_notes uses it; complianceNoteSchema is exported for downstream agent runners to type-narrow)"
  - "Three sub-steps of Task 3 done in single commit (cache.ts + .gitkeep + .gitignore append) since they ship the directory atomically — preferable to splitting; prevents an intermediate state where cache.ts references a missing dir"
metrics:
  duration_sec: ~140
  completed_at: "2026-04-26T08:53Z"
  task_count: 3
  file_count: 4
  commits: 3
---

# Phase 3 Plan 01: Foundations Summary

**One-liner:** Shipped the 3 pure-data modules (`trace.ts`, `schema.ts`, `cache.ts`) plus `data/runs/` marker — `AgentEvent` is now importable so the parallel Phase 6 chat is unblocked.

## What Shipped

### Files Created

| File                       | Lines | Provides                                                     |
| -------------------------- | ----- | ------------------------------------------------------------ |
| `src/lib/plan/trace.ts`    | 63    | `agentEventSchema`, `agentIdSchema`, `AgentEvent`, `AgentId` |
| `src/lib/plan/schema.ts`   | 98    | `planSchema` + 7 row schemas + `Plan` + 7 nested types       |
| `src/lib/plan/cache.ts`    | 88    | `hashHypothesis`, `getCachedRun`, `setCachedRun`, `getRunById`, `runStore` |
| `data/runs/.gitkeep`       | 1     | Directory marker (survives `git clone`, ignored otherwise)   |

### Files Modified

| File         | Change                                                            |
| ------------ | ----------------------------------------------------------------- |
| `.gitignore` | Appended 4 lines (1 blank + comment + include + negation pattern) |

The `.gitignore` change (per CLAUDE.md global §4.11 — Edit, never replace):

```
# Phase 3 — multi-agent run artifacts (D-64). Disk read-through cache; never commit.
data/runs/*.json
!data/runs/.gitkeep
```

## Commits

| Hash      | Message                                                                                   |
| --------- | ----------------------------------------------------------------------------------------- |
| `395a861` | feat(03-01): add AgentEvent discriminated-union schema (D-62, Phase 6 unblocker)          |
| `c875bcf` | feat(03-01): add Plan zod schema with 5 sections + agent_artifacts (D-58)                |
| `3a01168` | feat(03-01): add Plan cache with disk read-through + data/runs/ marker (D-64, D-65)      |

## Verification Results

All plan-spec acceptance grep chains pass first-time, no auto-fixes needed.

**Task 1 (`trace.ts`):**
- `export const agentEventSchema` ×1, `export const agentIdSchema` ×1
- `export type (AgentEvent|AgentId)` ×2
- `z.discriminatedUnion("stage"` ×1
- 4 stages (`started|working|done|error`) ×4
- 5 agent IDs ×5
- Zero imports from `./schema` or `./cache` (leaf module — Phase 6 can import without dragging deps)

**Task 2 (`schema.ts`):**
- `import { citationSchema } from "@/lib/qc/schema"` ×1 (D-58 reuse)
- 7 row schemas exported (`protocolStep|materialRow|budgetLine|timelinePhase|validationCheck|complianceNote|agentArtifact`)
- `export const planSchema` ×1
- `z.array(validationCheckSchema).min(5)` ×1 (TRACE-03 floor enforced at schema layer)
- `export type Plan = z.infer` ×1
- All 5 sections present in nested `plan` object: `protocol|materials|budget|timeline|validation`
- `grounded: z.boolean()` ×1 (Phase 5 will flip)

**Task 3 (`cache.ts` + `.gitkeep` + `.gitignore`):**
- 5 cache exports present: `hashHypothesis`, `setCachedRun`, `getCachedRun`, `getRunById`, `runStore`
- `crypto.subtle.digest` ×1
- `"data", "runs"` path constant ×1
- `import type { Plan } from "./schema"` ×1
- `fs.readFile` (disk fallback) ×1
- Zero `process.env` references (only `process.cwd()` for the runs dir resolution)
- `.gitignore` line count: 57 (well over the ≥18 floor; means MERGED, not replaced)

**End-to-end gates:**
- All 4 new files present (`test -f` × 4 ✓)
- `npx tsc --noEmit` exits 0 (project-wide green)
- `git check-ignore data/runs/foo.json` → exit 0 (correctly ignored)
- `git check-ignore data/runs/.gitkeep` → exit 1 (correctly tracked)
- The negation pattern is the load-bearing line — proven working

## Deviations from Plan

**None.** Plan executed exactly as written. The plan supplied verbatim file bodies for all three TypeScript modules; no Rule-1/2/3 auto-fixes triggered, no architectural questions surfaced. All grep acceptance criteria passed first-attempt.

The only minor judgment call: Task 3's three sub-steps (cache.ts + .gitkeep + .gitignore append) shipped in a single atomic commit rather than three separate ones. This is preferable because the three artifacts ship the runtime directory together — no intermediate state where `cache.ts` references a directory that does not exist or is committed without its gitignore rule.

## Auth Gates

None — Phase 3 foundations are pure-data Zod + Node fs work. No LLM calls, no third-party API calls.

## Threat Flags

None. All three modules are leaf data definitions; they introduce no new network endpoints, no new auth paths, no new file-access patterns at trust boundaries. The disk read-through in `cache.ts` writes exclusively under `data/runs/` and only writes plan JSONs that were generated and validated server-side by Phase 3 Wave 2/3 routes (which do not exist yet).

## Known Stubs

None. All three modules are complete data definitions with no placeholder data, no stub renders, no "coming soon" copy. Phase 3 Wave 2 (agent runners) will import these modules and wire them to live LLM streams.

## Downstream Impact

**Phase 6 chat (parallel) is now UNBLOCKED.** The `AgentEvent` type is importable from `@/lib/plan/trace`:

```typescript
import { agentEventSchema, type AgentEvent, type AgentId } from "@/lib/plan/trace";
```

Phase 6's trace-rail render switch can now type-narrow on `event.stage`:

```typescript
if (!event?.stage) return null;
switch (event.stage) {
  case "started": return <StartedRow agent={event.agent_id} task={event.task} />;
  case "working": return <WorkingRow agent={event.agent_id} activity={event.activity} />;
  case "done":    return <DoneRow agent={event.agent_id} elapsed={event.elapsed_ms} />;
  case "error":   return <ErrorRow agent={event.agent_id} message={event.error_message} />;
}
```

**Phase 3 Wave 2 (agent runners + consolidator)** can now import:

```typescript
import {
  planSchema,
  type Plan,
  protocolStepSchema,
  materialRowSchema,
  budgetLineSchema,
  timelinePhaseSchema,
  validationCheckSchema,
  complianceNoteSchema,
  agentArtifactSchema,
} from "@/lib/plan/schema";

import {
  hashHypothesis,
  getCachedRun,
  setCachedRun,
  getRunById,
  runStore,
} from "@/lib/plan/cache";
```

**Phase 7 (diff modal)** has its disk-read primitive — `getCachedRun` falls through to `data/runs/<run_id>.json` so cold-start re-runs hit disk instead of re-running 5 LLM calls.

## Self-Check: PASSED

Files verified to exist on disk:
- `FOUND: src/lib/plan/trace.ts`
- `FOUND: src/lib/plan/schema.ts`
- `FOUND: src/lib/plan/cache.ts`
- `FOUND: data/runs/.gitkeep`

Commits verified in git log:
- `FOUND: 395a861` (Task 1 — trace.ts)
- `FOUND: c875bcf` (Task 2 — schema.ts)
- `FOUND: 3a01168` (Task 3 — cache.ts + .gitkeep + .gitignore)

`.gitignore` proof:
- `git check-ignore data/runs/foo.json` exits 0 (ignored ✓)
- `git check-ignore data/runs/.gitkeep` exits 1 (tracked ✓)

`npx tsc --noEmit` exits 0 (project-wide green).
