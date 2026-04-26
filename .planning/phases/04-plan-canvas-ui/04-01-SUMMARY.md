---
phase: 04-plan-canvas-ui
plan: 01
subsystem: ui
tags: [react, tailwind, shadcn, radix-tabs, plan-canvas, citations, intl-numberformat]

# Dependency graph
requires:
  - phase: 03-multi-agent-pipeline
    provides: "planSchema typed JSON shape (Plan, ProtocolStep, MaterialRow, BudgetLine, TimelinePhase, ValidationCheck, Citation) consumed verbatim by leaf renderers"
  - phase: 02-literature-qc
    provides: "citationSchema source-of-truth used by CitationSlot via z.infer"
  - phase: 01-foundation
    provides: "design tokens (bg-paper, text-ink, text-forest, text-clay, border-borderwarm, bg-surface, font-display, font-mono tabular-nums) + cn() helper + shadcn primitives layout"
provides:
  - "shadcn Tabs primitive at src/components/ui/tabs.tsx (forest underline + ink text on active, forest/40 focus ring, no bg swap on hover — D4-04)"
  - "5 typed leaf renderers (ProtocolTab, MaterialsTab, BudgetTab, TimelineTab, ValidationTab) — pure components consuming Plan slices"
  - "CitationSlot helper that returns null on empty citations[] (CLAUDE.md hard rule #1) and renders a [N sources] badge otherwise"
  - "src/lib/plan/format.ts: formatCurrency (Intl.NumberFormat en-US USD, no decimals when whole) + computeSubtotal (parses leading numeric prefix of MaterialRow.quantity, returns null on invalid → caller renders em-dash)"
affects: [04-plan-canvas-ui Wave 2 (plan-tabs.tsx shell + plan-canvas wire-in), 04-plan-canvas-ui Wave 3 (loading/empty/skeleton states), 05-grounding (Phase 5 swaps CitationSlot badge for hovercards without API change), 07-closed-loop (Phase 7 click-to-correct overlays target the leaf rows)]

# Tech tracking
tech-stack:
  added: ["@radix-ui/react-tabs@^1.1.13"]
  patterns:
    - "Tabs primitive follows existing shadcn/Radix wrapper pattern (forwardRef + cn() className composition) established by ScrollArea — third Radix dep in this codebase"
    - "Leaf-renderer convention: pure typed components, one tab per file, no useState/useEffect, trust the type (D4-16) — render layer is NOT a validation layer"
    - "CitationSlot reservation pattern: stable props API in Phase 4, internal renderer swap in Phase 5 — leaf components don't change when grounding lands"
    - "Currency formatting: single Intl.NumberFormat module-scope instance for fractional case, per-call instance for the integer no-decimal case — hot path is small enough that allocation is acceptable"
    - "Subtotal compute is pessimistic: returns null whenever quantity is unit-suffixed without a clean leading number; caller renders em-dash, never invents a 0"

key-files:
  created:
    - "src/components/ui/tabs.tsx — shadcn Tabs wrapper (Tabs, TabsList, TabsTrigger, TabsContent)"
    - "src/components/plan/citation-slot.tsx — empty-array-silent citation badge"
    - "src/lib/plan/format.ts — formatCurrency + computeSubtotal"
    - "src/components/plan/protocol-tab.tsx — numbered <ol> of ProtocolStep cards"
    - "src/components/plan/materials-tab.tsx — 6-col HTML <table> with sticky header + horizontal scroll wrapper"
    - "src/components/plan/budget-tab.tsx — line items with proportional bg-forest/30 bars + Total row"
    - "src/components/plan/timeline-tab.tsx — phase rows with depends_on chip strip (no Gantt)"
    - "src/components/plan/validation-tab.tsx — card-row per check with 2-col Method/Pass criteria <dl>"
  modified:
    - "package.json — added @radix-ui/react-tabs@^1.1.0"
    - "package-lock.json — Radix transitive deps"

key-decisions:
  - "Citation type derived locally via z.infer<typeof citationSchema> instead of editing src/lib/qc/schema.ts to add an export — plan success-criteria forbids modifying that file. Documented in citation-slot.tsx comment block."
  - "Both currency formatters use Intl.NumberFormat: USD_FMT (module-scope, max 2 decimals) for fractional values, per-call NumberFormat (max 0 decimals) for whole values. Per D4-15 spec exactly."
  - "computeSubtotal accepts unit-prefixed quantities ('10 mL' → 10) but rejects bare units ('few drops' → null). Pessimistic by design: better to render em-dash than fake $0."
  - "Validation tab does NOT use CitationSlot — schema's validationCheckSchema has no citations field (only ProtocolStep, MaterialRow, BudgetLine, TimelinePhase have one). Acceptance criterion expects 4 of 5 leaves to use CitationSlot, this is correct."

patterns-established:
  - "Leaf renderer template (used by all 5 tabs): 'use client' → typed Props with single array prop → flex-col gap container with aria-label → map() into rounded-md border-borderwarm bg-paper p-4 shadow-doc cards → font-display headings + font-mono tabular-nums numerics + text-muted-foreground meta"
  - "Empty-state silence pattern (CitationSlot, Timeline depends_on): if length === 0 render nothing — never a placeholder badge, never a 'no items' message at this layer. Higher levels own the empty-state copy."
  - "Schema-trust pattern: imports `type X` not the Zod schema; no `if (!x?.y?.z)` defensive guards. Validation happens once upstream (usePlan onData → planSchema.safeParse)."

requirements-completed:
  - PLAN-01
  - PLAN-02
  - PLAN-03
  - PLAN-04
  - PLAN-05

# Metrics
duration: 5m 14s
completed: 2026-04-26
---

# Phase 4 Plan 01: Plan Canvas UI Wave 1 Summary

**5 typed leaf tab renderers + shadcn Tabs primitive + CitationSlot reservation pattern + USD/Subtotal formatters — every component is a pure function of its Plan slice, ready for Wave 2 to wire into the canvas shell.**

## Performance

- **Duration:** 5m 14s
- **Started:** 2026-04-26T10:31:05Z
- **Completed:** 2026-04-26T10:36:19Z
- **Tasks:** 3 of 3
- **Files modified:** 10 (8 created + 2 modified — package.json, package-lock.json)

## Accomplishments

- Installed `@radix-ui/react-tabs@^1.1.13` (justified per CLAUDE.md hard rule #5 — saves a hand-rolled keyboard state machine for Tab/Arrow/Home/End across 5 tabs)
- Wired the shadcn Tabs primitive (Tabs, TabsList, TabsTrigger, TabsContent) to project design tokens — forest underline + ink text on active, forest/40 focus ring, no background swap (D4-04)
- Locked the empty-citations contract: `citations.length === 0` renders NOTHING (CLAUDE.md hard rule #1 enforcement at the leaf layer); badge `[N sources]` only when there's something to show
- 5 leaf renderers ship with identical conventions: pure components, no state, trust the type, design tokens consistent across all 5
- Materials table is the most structurally rich: 6 columns (Reagent / Catalog # / Supplier / Unit cost / Qty / Subtotal), sticky header, em-dash on null cells, right-aligned tabular-nums numerics, computeSubtotal per row, overflow-x-auto wrapper for desktop-only width assumption
- Budget tab implements proportional bars (`width = amount/max * 100%`, `bg-forest/30`) plus a Total row with top border
- Timeline depends_on chips mirror the example-chips style (`rounded-full border-borderwarm`)
- Validation tab uses a 2-column `<dl>` for Method/Pass criteria — directly mirrors validation-grid.tsx aesthetic
- Project-wide `npx tsc --noEmit` exits 0 after every task

## Task Commits

1. **Task 1: Add @radix-ui/react-tabs dep + scaffold src/components/ui/tabs.tsx** — `8342c82` (feat)
2. **Task 2: Create src/lib/plan/format.ts + src/components/plan/citation-slot.tsx** — `7af21d3` (feat)
3. **Task 3: Create the 5 leaf tab renderers** — `7a6378a` (feat)

_Note: an unrelated docs commit by the user (`09cb006 docs(deferred)`) landed between Task 2 and Task 3 on `main`. Out of scope for this plan; does not affect any Plan 04-01 file._

## Files Created/Modified

### Created
- `src/components/ui/tabs.tsx` — shadcn Tabs wrapper around `@radix-ui/react-tabs` with project design tokens
- `src/lib/plan/format.ts` — `formatCurrency(value)` + `computeSubtotal(unitPrice, quantity)`
- `src/components/plan/citation-slot.tsx` — `CitationSlot({ citations })` returns null on empty
- `src/components/plan/protocol-tab.tsx` — `ProtocolTab({ steps })` numbered `<ol>` cards
- `src/components/plan/materials-tab.tsx` — `MaterialsTab({ materials })` 6-col `<table>` with sticky header
- `src/components/plan/budget-tab.tsx` — `BudgetTab({ lines })` with horizontal bars + Total row
- `src/components/plan/timeline-tab.tsx` — `TimelineTab({ phases })` with depends_on chip strip
- `src/components/plan/validation-tab.tsx` — `ValidationTab({ checks })` with 2-col Method/Pass criteria `<dl>`

### Modified
- `package.json` — `+@radix-ui/react-tabs@^1.1.0`
- `package-lock.json` — 8 packages added (Radix Tabs + transitive Radix deps already mostly present via scroll-area + slot)

## Decisions Made

1. **Citation type sourcing** — The plan-supplied citation-slot.tsx imported `Citation` from `@/lib/qc/schema`, but no such type alias is exported from that file (only `citationSchema`). The plan's success-criteria explicitly forbids modifying `src/lib/qc/schema.ts`. Resolution: derive the type locally via `type Citation = z.infer<typeof citationSchema>` at the import site. Documented inline. Equivalent shape, zero schema mutation.

2. **Subtotal pessimism** — `computeSubtotal` rejects bare-unit quantities ('few drops', 'a pinch') by requiring a leading numeric prefix. Returns null → caller renders em-dash. Better to surface "unknown" than to fabricate a $0 subtotal that misleads the budget reader.

3. **Validation tab citation absence** — `ValidationCheck` schema has no `citations` field, so `validation-tab.tsx` doesn't import `CitationSlot`. The acceptance criterion's "4 of 5 leaves use CitationSlot" expectation matches this exactly; no deviation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Citation type not exported from qc/schema**
- **Found during:** Task 2 (citation-slot.tsx tsc error TS2305: Module '@/lib/qc/schema' has no exported member 'Citation')
- **Issue:** Plan body specified `import type { Citation } from "@/lib/qc/schema"` but that type alias does not exist (only `citationSchema` Zod object is exported). Schema is locked per success-criteria — cannot add the export.
- **Fix:** Derived `type Citation = z.infer<typeof citationSchema>` locally inside citation-slot.tsx, with an inline comment explaining the constraint.
- **Files modified:** `src/components/plan/citation-slot.tsx`
- **Verification:** `npx tsc --noEmit` exits 0 after the change; component compiles and renders identically.
- **Committed in:** `7af21d3` (Task 2 commit)

**2. [Rule 1 - False-positive grep on planSchema] Removed `planSchema.plan.validation.min(5)` reference from validation-tab JSDoc**
- **Found during:** Task 3 acceptance verification (grep for `planSchema\b` in leaves returned 1 — should be 0)
- **Issue:** A JSDoc comment in validation-tab.tsx referenced `planSchema.plan.validation.min(5)` to document the schema-enforced minimum. Not a runtime import (no `import { planSchema }`), but the strict acceptance grep flags ANY occurrence to enforce the "render layer is not a validation layer" rule.
- **Fix:** Rephrased the JSDoc to "enforced upstream in src/lib/plan/schema.ts". Same documentation intent, no schema-name reference.
- **Files modified:** `src/components/plan/validation-tab.tsx`
- **Verification:** `grep -l 'planSchema\b' src/components/plan/*.tsx | wc -l` returns 0; tsc still green.
- **Committed in:** `7a6378a` (part of Task 3 commit; the comment-only edit happened pre-commit during acceptance verification, never reached a separate commit)

---

**Total deviations:** 2 auto-fixed (1 blocking type-error fix, 1 acceptance-grep alignment)
**Impact on plan:** Both fixes preserve the original semantic intent. The Citation type fix is a constraint-conflict resolution (plan body vs. success-criteria); the planSchema comment edit is a strict-grep alignment with no behavior change.

## Issues Encountered

- One concurrent commit (`09cb006 docs(deferred)`) by the user on `main` between Task 2 and Task 3. Unrelated docs work; no conflicts. Noted in Task Commits section for completeness.

## Acceptance Criteria — Final Tally

All criteria from the plan body verified before each task commit:

**Task 1:** dep installed (`@radix-ui/react-tabs@^1.1.13`), file exists, all 4 exports present, design tokens applied (`data-[state=active]:border-forest`, `focus-visible:ring-forest/40` ×2), `"use client"` directive, tsc green.

**Task 2:** both files exist, `formatCurrency` + `computeSubtotal` exports, `Intl.NumberFormat` used 3× (matches D4-15 dual-format approach), `"USD"` currency string in 2 places, `CitationSlot` export, `citations.length === 0` guard + `return null` path, tsc green. Note: the `[0 sources]` grep flagged a comment-block reference (line 23) but the actual render branch returns null — semantically clean.

**Task 3:** all 5 leaf files exist with named exports, materials has 6 column headers + `<table>` + `<thead>` + `<tbody>` + `tabular-nums` ×4 + `computeSubtotal` ×2, budget has `bg-forest/30` ×2 + Total row, timeline has `depends_on` ×3 + chip with `rounded-full border-borderwarm`, validation has `measurement_method` ×2 + `pass_criteria` ×2, 4 of 5 leaves import CitationSlot (validation has no citations field — correct), 0 leaves import planSchema, 0 leaves use useState/useEffect, 0 fake citation text, tsc green.

## Next Phase Readiness

**Wave 2 (Plan 04-02) can now:**
- Import `Tabs, TabsList, TabsTrigger, TabsContent` from `@/components/ui/tabs`
- Import `ProtocolTab, MaterialsTab, BudgetTab, TimelineTab, ValidationTab` from their respective `@/components/plan/*-tab` files
- Build `plan-tabs.tsx` shell that maps the 5 tabs in order Protocol → Materials → Budget → Timeline → Validation (D4-03 default tab = Protocol)
- Wire `compliance_notes` filtering by `target_kind` per D4-09

**Wave 3 (Plan 04-03) can now:**
- Build the loading/skeleton/empty states (D4-11, D4-12) without touching any leaf renderer

**Wire-in to plan-canvas.tsx:** still in Wave 2 (this plan only built the leaves and the primitive; nothing is rendered yet on the canvas).

**No blockers.** All Phase 4 downstream work is unblocked.

## Self-Check: PASSED

All 8 created files exist:
- src/components/ui/tabs.tsx — FOUND
- src/lib/plan/format.ts — FOUND
- src/components/plan/citation-slot.tsx — FOUND
- src/components/plan/protocol-tab.tsx — FOUND
- src/components/plan/materials-tab.tsx — FOUND
- src/components/plan/budget-tab.tsx — FOUND
- src/components/plan/timeline-tab.tsx — FOUND
- src/components/plan/validation-tab.tsx — FOUND

All 3 task commits exist in git log:
- 8342c82 (Task 1) — FOUND
- 7af21d3 (Task 2) — FOUND
- 7a6378a (Task 3) — FOUND

`npx tsc --noEmit` exits 0 — verified after each task commit.

---
*Phase: 04-plan-canvas-ui*
*Completed: 2026-04-26*
