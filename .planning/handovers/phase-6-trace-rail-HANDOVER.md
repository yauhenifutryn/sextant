# Phase 6 — Live Trace Rail + Validation Grid (PARALLEL CHAT BRIEF)

> **Read this brief, then run `/gsd-resume-work` to load full project context, then `/gsd-discuss-phase 6` (skip if you trust this brief) → `/gsd-plan-phase 6 --auto`.**
>
> This handover exists so you can run in a separate Claude Code chat alongside the main GSD chat. The main chat owns Phase 3 → 4 → 5 → 7 → 8 sequentially. You own Phase 6. File scopes do NOT overlap. Both chats push to `main`. Vercel auto-deploys each push.

## Status (as of 2026-04-26 ~03:25)

- **Phase 1** (Foundation) ✅ shipped 2026-04-25
- **Phase 2** (Literature QC) ✅ shipped 2026-04-26 — end-to-end smoke green at 3.8s
- **Phase 3** (Multi-Agent Pipeline) — IN FLIGHT in main chat. Plans being generated NOW. Execute will follow shortly. Phase 3 produces the data Phase 6 consumes (AgentEvent stream + per-Plan validation check definitions).
- **Phase 6** (Live Trace + Validation Grid) — YOUR job, this chat.
- **Hackathon submission deadline:** ~5 hours from this handover write (2026-04-26 ~08:25).

## Your hard scope contract

You touch ONLY these files. Anything outside is the main chat's territory.

**Owned by you (modify or create):**
- `src/components/trace-rail.tsx` (currently a 53-line placeholder with a 6-row validation skeleton — replace with live render)
- `src/components/trace/agent-row.tsx` (NEW — single-agent row component)
- `src/components/trace/validation-grid.tsx` (NEW — ≥5 named tests with status pills)
- `src/components/trace/trace.css` (NEW, OPTIONAL — only if Tailwind v4 utilities aren't enough; prefer `@theme` tokens + utility classes)

**Forbidden — main chat owns these (do NOT touch):**
- Anything under `src/app/api/**` (plan route, qc route)
- Anything under `src/lib/plan/**` (Phase 3 owns the AgentEvent type definition; you IMPORT from it, never modify)
- Anything under `src/lib/qc/**`
- `src/lib/models.ts`, `src/lib/tavily.ts`, `src/lib/env.ts`
- `src/components/qc/**`
- `src/components/plan/**` (Phase 4 will own this)
- The dashboard wire-in (`src/app/app/page.tsx` or wherever `usePlan()` is called) — main chat passes the props down to your component

**Coordination point (prop interface):**

The dashboard passes you these props from `usePlan()`:

```ts
import type { AgentEvent } from "@/lib/plan/trace";   // Phase 3 owns this type
import type { Plan } from "@/lib/plan/schema";          // Phase 3 owns this type

type TraceRailProps = {
  agentEvents: AgentEvent[];      // appended in order by use-plan.ts
  validationChecks?: Plan["plan"]["validation"]; // available once consolidator finishes
  isLoading: boolean;
};
```

**Do NOT modify `AgentEvent` or `Plan`.** Import them. If you need a field that doesn't exist, log it as a coordination concern in this file's "Coordination Concerns" section at the bottom and ping the main chat.

## What ships in Phase 6

**Trace rail (5 rows, top of the right column):**
- One row per agent: `Researcher`, `Skeptic`, `Operator`, `Compliance`, `Consolidator`
- Each row has: agent name (`font-display`, 12-13px, `tracking-tight`), status pill (idle/working/done/error), and a 1-line "current task" string
- **Idle:** muted dot, faint text
- **Working:** animated shimmer (CSS `@keyframes shimmer` on the row background; reuse `<SextantLoader>` micro-bar pattern if it fits inline)
- **Done:** small checkmark (Lucide `Check`, forest accent), elapsed_ms in `font-mono` 10px
- **Error:** Lucide `AlertTriangle` in clay accent, error_message tooltip on hover

**Validation grid (below trace rail, same right column):**
- Renders the existing 6 placeholder checks from the current `trace-rail.tsx:VALIDATION_SKELETON` PLUS any hypothesis-specific checks Skeptic produces (Skeptic's `validation[]` from the Plan)
- Status per row: `pending` (faint), `running` (shimmer ring on the dot), `pass` (forest dot + Check icon), `fail` (clay dot + X icon)
- The 6 baseline checks tick green deterministically based on Plan-level conditions:
  1. "Every reagent has a catalog URL" → `pass` if `plan.materials.every(m => m.citations.length > 0)`, else `fail` if `grounded === true`, else `pending`
  2. "Budget sums correctly" → `pass` if `sum(plan.budget.line_total) === plan.budget_total` (or whatever Phase 3's schema names this)
  3. "No orphan protocol step" → `pass` if every `protocol[].step_number` is referenced by at least one validation check OR has at least one citation slot
  4. "Citations resolve to real sources" → `pass` only if `grounded === true` (Phase 5 flips this; in Phase 6's own demo this stays `pending` unless Phase 5 has run)
  5. "Timeline dependencies valid" → `pass` if no `timeline[].depends_on` references a non-existent phase id
  6. "Compliance pipeline passes" → `pass` if `compliance_summary` is non-empty AND `compliance_notes` array is populated

These 6 are the demo's "watching the system check itself" moment. Don't reduce this list.

**Light-mode only.** Forest = green-good, clay = stop-and-look-bad, paper = bg, ink = text. Tokens defined in `tailwind.config.ts` and `src/app/globals.css` `@theme`.

## Required reading (do these before planning Phase 6)

1. `.planning/STATE.md` — current position
2. `.planning/PROJECT.md` — vision, defensibility (just-added "Defensibility & Pitch Framing" section)
3. `.planning/ROADMAP.md` §"Phase 6: Live Trace & Validation Grid" — goal + 4 success criteria
4. `.planning/REQUIREMENTS.md` — REQ IDs **TRACE-01**, TRACE-02, TRACE-03, TRACE-04
5. `.planning/phases/03-multi-agent-pipeline/03-CONTEXT.md` — **MANDATORY**, especially:
   - **D-60** — AI SDK v5 `createUIMessageStream` / `data-trace` parts (Phase 3 emits these; you consume via `usePlan()` upstream)
   - **D-61** — 3 lifecycle events per agent (`started`, `working`, `done`, `error`)
   - **D-62** — `AgentEvent` Zod discriminated-union schema (`stage` discriminator)
   - The `<code_context>` "Integration Points" subsection — confirms `<TraceRail agentEvents={...} validationChecks={...} />` prop signature
6. `.planning/phases/02-literature-qc/02-CONTEXT.md` — D-41/D-42/D-43 for color/border conventions; D-50 for cache pattern (you don't need it but understand the established style)
7. `CLAUDE.md` (project root) — hard rules. Most relevant for you: hard rule #5 (no new deps without justification — Lucide + Framer Motion are already in; you should not need anything else), hard rule #7 (don't deviate from design tokens).
8. `CLAUDE_DESIGN_BRIEF.md` — palette, typography, shadows. You'll need `font-display`, `font-mono`, `border-borderwarm`, `bg-paper`, `text-forest`, `text-clay`, `text-muted-foreground`.
9. Existing files to read once you begin:
   - `src/components/trace-rail.tsx` — the placeholder you're replacing. Note `VALIDATION_SKELETON` constant — keep these strings verbatim.
   - `src/components/sextant-loader.tsx` — the existing animated bar component. Reuse its keyframes/CSS if you need shimmer for the "working" state, OR add a sibling component.
   - `src/app/app/page.tsx` (or wherever the dashboard renders `<TraceRail />`) — read-only for you, just to confirm prop signature.

## Plan-mode flags for Phase 6

When you run plan-phase, use:
```
/gsd-plan-phase 6 --auto
```

Skip discuss-phase. This brief IS your CONTEXT.md substitute. The planner will read this file IF you save it as `.planning/phases/06-live-trace-validation/06-CONTEXT.md` first — recommended:

```bash
mkdir -p .planning/phases/06-live-trace-validation
cp .planning/handovers/phase-6-trace-rail-HANDOVER.md .planning/phases/06-live-trace-validation/06-CONTEXT.md
```

Then `/gsd-plan-phase 6 --auto` runs cleanly.

## Hard cuts (already approved by user — apply without re-asking)

- **NO** automated tests. Manual UAT only. We're 5h to deadline.
- **NO** Storybook stories.
- **NO** new dependencies. Lucide + Tailwind v4 + (optionally) Framer Motion is sufficient.
- **NO** mobile responsive — desktop demo only.
- **NO** keyboard navigation polish (TRACE-01..04 don't require it; if you add it, keep to 5 min max).

## Trigger condition (when to start)

You can plan Phase 6 right now (the prop interface is locked in 03-CONTEXT.md D-62; the AgentEvent type definition is fixed).

You can EXECUTE Phase 6 once the main chat ships:
- `src/lib/plan/trace.ts` (the AgentEvent type) — needed for your imports
- `src/lib/plan/schema.ts` (the Plan type with `validation[]` and `materials[]` shape) — needed for the validation grid

Watch the main repo's commit log:
```bash
git log --oneline -20 | grep -E "feat\(03"
```

Once you see commits creating `src/lib/plan/trace.ts` and `src/lib/plan/schema.ts`, you're unblocked to execute.

If the main chat hasn't shipped these by ~hour 1.5 of your work, you can stub the types locally with the shapes from D-62 and 03-CONTEXT.md D-58, then refactor the imports when the real types land. This is faster than blocking.

## Coordination Concerns (append here as they come up)

*(none yet — append as you discover them)*

## Success Criteria (from ROADMAP)

1. Trace rail shows each of the 4 agents with a status indicator (idle, working, done) and current task line
2. Active agents animate with a shimmer; completed agents show a checkmark
3. Validation test grid lists at least 5 named tests with status indicators (pending, running, pass, fail)
4. Tests visibly tick green as the plan stabilizes (the 6 baseline tests above do this deterministically based on Plan content)

## End-of-phase checklist (before declaring done)

- [ ] `npm run build` passes
- [ ] `npm run typecheck` (or `tsc --noEmit`) passes
- [ ] On `/app`, after a chip click that triggers Plan generation, you can SEE: 4 agent rows transition from idle → shimmering "working" → done with checkmark → consolidator row does the same after them
- [ ] Validation grid renders ≥5 rows with status pills, and at least 3 of them tick green deterministically against the produced Plan
- [ ] No console errors during a full chip-click → Plan-streamed flow
- [ ] Push to `main`. Vercel auto-deploys (~30s). Verify live at https://sextant-uekv.vercel.app/app
- [ ] Append a note to this HANDOVER's "Coordination Concerns" section if you found anything the main chat needs to fix

## Reference: AgentEvent shape (from 03-CONTEXT.md D-62)

```ts
// src/lib/plan/trace.ts (Phase 3 owns this; you import it)
import { z } from "zod";

export const agentIdSchema = z.enum([
  "researcher", "skeptic", "operator", "compliance", "consolidator"
]);

export const agentEventSchema = z.discriminatedUnion("stage", [
  z.object({
    stage: z.literal("started"),
    run_id: z.string(),
    agent_id: agentIdSchema,
    task: z.string(),
    ts: z.string(),
  }),
  z.object({
    stage: z.literal("working"),
    run_id: z.string(),
    agent_id: agentIdSchema,
    activity: z.string(),
    ts: z.string(),
  }),
  z.object({
    stage: z.literal("done"),
    run_id: z.string(),
    agent_id: agentIdSchema,
    elapsed_ms: z.number(),
    token_count: z.number().optional(),
    output_preview: z.string().optional(),
    ts: z.string(),
  }),
  z.object({
    stage: z.literal("error"),
    run_id: z.string(),
    agent_id: agentIdSchema,
    error_message: z.string(),
    retryable: z.boolean(),
    ts: z.string(),
  }),
]);
export type AgentEvent = z.infer<typeof agentEventSchema>;
export type AgentId = z.infer<typeof agentIdSchema>;
```

If the file lands at `src/lib/plan/trace.ts`, your import is:
```ts
import type { AgentEvent, AgentId } from "@/lib/plan/trace";
```

## Reference: Plan validation/materials shape (from 03-CONTEXT.md D-58)

You only need the shape of these two fields:
```ts
plan.validation: ValidationCheck[]
  // each: { name: string, description: string, measurement_method: string, pass_criteria: string }
plan.materials: MaterialRow[]
  // each: { reagent, catalog_no, supplier, unit_cost, qty, subtotal, citations: Citation[] }
```

Phase 5 fills `materials[].citations` (Phase 6 doesn't care about content — just `length > 0`).

---

*Created: 2026-04-26 ~03:25 by main GSD chat as part of Phase 3 plan launch. Append updates here as Phase 6 work progresses; the main chat will read this on a quick `cat` to learn what changed.*
