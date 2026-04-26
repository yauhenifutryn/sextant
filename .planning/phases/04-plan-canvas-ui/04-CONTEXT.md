# Phase 4: Plan Canvas UI - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning
**Source:** Inline auto-context (hackathon time pressure, derived from REQUIREMENTS + locked Plan schema + Phase 3 SUMMARY)

<domain>
## Phase Boundary

Phase 4 replaces the empty-state hero in `src/components/plan-canvas.tsx` with a 5-tab Plan view (Protocol / Materials / Budget / Timeline / Validation) that renders from the typed `Plan` object exposed by `usePlan()`. The dashboard already streams `plan.plan: Plan | null` into `<PlanCanvas />`; Phase 4 wires that prop through and renders it.

**In scope:**
- Read `Plan` from `src/lib/plan/schema.ts` (LOCKED — do not modify the schema).
- Add a tabbed canvas: 5 tabs, keyboard navigable (Tab + Arrow keys), visually distinct active tab.
- Render Protocol as a numbered ordered list with `step_number`, `description`, `duration_estimate` (per `protocolStepSchema`).
- Render Materials as a structured table: Reagent / Catalog # / Supplier / Unit cost / Qty / Subtotal columns (per `materialRowSchema`). Compute Subtotal client-side as `unit_price_usd * Number(quantity)` when both are non-null; otherwise show em-dash.
- Render Budget as a line-itemized list with category bars (horizontal proportional bars) AND a total row.
- Render Timeline as a phased breakdown (1 row per phase, with `duration_days` and `depends_on` chips).
- Render Validation as a list with `name`, `description`, `measurement_method`, `pass_criteria` per row.
- Render `compliance_notes` and `compliance_summary` inline within their target tab (or as a top-of-tab strip — see decisions below).
- Citation slots: schema includes `citations: Citation[]` per row, but Phase 4 ships with `[]` (Phase 5 fills). Phase 4 reserves the inline-cite slot structure (e.g., a sup or trailing badge component) so Phase 5 just populates without restructuring. **Do NOT invent citations — render nothing for empty arrays.**
- Loading / error / empty states: while `plan.isLoading && !plan.plan` show a calm scaffold (skeleton tabs, no spinner clutter); when `plan.error || (qc verdict says skip)` keep the current hero visible. The 5 tabs only render once `plan.plan` is non-null.
- Pinned `<VerdictCard />` slot at the top stays — Phase 4 sits BELOW it inside the canvas column.

**Out of scope (deferred to other phases):**
- Inline citation tooltips and "verify all sources" check → Phase 5 (GROUND-01..05).
- Click-to-correct / labrule popover → Phase 7 (LOOP-01..05).
- Diff modal → Phase 7 (PROP-03).
- Trace rail / agent rows → Phase 6 (already shipped).
- Real catalog scraping / supplier resolution → Phase 5 (GROUND-04).

</domain>

<decisions>
## Implementation Decisions

### File layout (LOCKED)

- **Modify:** `src/components/plan-canvas.tsx` — accept new prop `plan: Plan | null` (in addition to existing `onChipPick`, `qcObject`, `qcIsLoading`); render 5-tab view when `plan` is non-null; keep empty-state hero when `plan` is null AND no QC active.
- **Create:** `src/components/plan/plan-tabs.tsx` — the 5-tab shell + keyboard wiring (uses shadcn `<Tabs>` if added, otherwise hand-rolled with `role="tablist"` semantics).
- **Create:** `src/components/plan/protocol-tab.tsx` — Protocol section renderer.
- **Create:** `src/components/plan/materials-tab.tsx` — Materials table renderer.
- **Create:** `src/components/plan/budget-tab.tsx` — Budget renderer with category bars.
- **Create:** `src/components/plan/timeline-tab.tsx` — Timeline phased renderer.
- **Create:** `src/components/plan/validation-tab.tsx` — Validation list renderer.
- **Create (optional):** `src/components/plan/citation-slot.tsx` — placeholder badge for empty `citations[]`; Phase 5 plugs in real citation data.
- **Modify:** `src/app/app/page.tsx` — pass `plan={plan.plan}` to `<PlanCanvas />`.
- **Modify:** `src/components/ui/tabs.tsx` (NEW) — shadcn Tabs primitive (added via `npx shadcn@latest add tabs` OR hand-authored if shadcn CLI fails like in 01-02).

### Decision log (locked for executor)

- **D4-01 (file fan-out):** Split the 5 tabs into separate files (one tab = one file). Why: each tab has distinct render shape; co-locating in plan-canvas.tsx would push it past 300 lines. Cost is 5 small files; benefit is reviewability and parallel polish later.
- **D4-02 (tabs primitive):** Use shadcn `<Tabs>` from `@radix-ui/react-tabs` (the shadcn wrapper). It gives keyboard handling (Arrow Left/Right + Home/End) and `role="tablist"` for free. If `npx shadcn@latest add tabs` works, use it. If it fails (as it did for `init` in 01-02), hand-author `src/components/ui/tabs.tsx` from the shadcn template (Radix Tabs is already a transitive dep via shadcn's other components — confirm with `npm ls @radix-ui/react-tabs`).
- **D4-03 (default tab):** Default open tab is `Protocol`. Tab order: Protocol → Materials → Budget → Timeline → Validation. Why: matches the cognitive flow a scientist would read in (what do I do → with what → for how much → in what timeframe → checked how).
- **D4-04 (active-tab visual):** Active tab uses `border-forest` (forest-green underline 2px) and `text-ink`; inactive tabs use `text-muted-foreground`. NO background-fill swap (keeps the surface calm). On hover, inactive tab gets `text-ink` only. On focus-visible, all tabs get a `ring-forest/40` ring (DESIGN-04 keyboard reachability).
- **D4-05 (Materials table layout):** 6-column HTML table with `<table>` + `<thead>` + `<tbody>`. Sticky header (`sticky top-0`) inside the tab's scroll area. Empty cells (no supplier, no catalog #, no price) render as em-dash `—` not blank. Right-align `Unit cost`, `Qty`, `Subtotal` columns. Use `tabular-nums font-mono` on numeric cells. NO Subtotal aggregate row in v1 (Phase 5 may add).
- **D4-06 (Budget bars):** For each `budgetLineSchema` row: render category name + amount + a horizontal bar whose width = `amount_usd / max_amount_in_phase * 100%`. Bar fill is `bg-forest/30`. Below all rows, render `Total: $${sum}` row with `font-mono tabular-nums` and a top border. `notes` shown as a muted line under the category if present.
- **D4-07 (Timeline rows):** Each `timelinePhaseSchema` is one row: phase name (font-display medium) + duration ("`${duration_days} days`") + a `depends_on` chip strip (one chip per dependency, `text-xs`, `border-borderwarm`, rounded-full). NO Gantt visualization in v1 (over-scope for time budget).
- **D4-08 (Validation list):** Each `validationCheckSchema` is a card-row with: `name` (font-display semibold), `description` (text-muted-foreground), and a 2-column key-value strip below for `measurement_method` and `pass_criteria`. Render in the order received from the schema — Phase 6 trace rail already enforces the 6-name skeleton, Phase 4 just renders.
- **D4-09 (Compliance notes placement):** Render `compliance_notes` as a top-of-tab strip ONLY in the tab they target via `target_kind`: `protocol_step` → top of Protocol tab; `material_row` → top of Materials tab; `global` → above the tab strip itself (so it shows on every tab). Severity badges: `info` → border-borderwarm gray; `caution` → border-clay (warm); `blocking` → border-destructive red. Render `compliance_summary` (the prose) as a small footer line under the tab strip, all-tabs visible.
- **D4-10 (citation slot reservation):** For every row that has a `citations: Citation[]` field, render a thin trailing badge if `citations.length > 0` showing `[N sources]`. If `citations.length === 0`, render NOTHING (do NOT show "[0 sources]" or fake citations — CLAUDE.md hard rule #1). Phase 5 replaces the badge with real per-citation popovers.
- **D4-11 (loading skeleton):** When `plan.plan === null && plan.isLoading`, show a 5-tab tab strip (gray) and a skeleton card matching the active-tab shape. Use 3-row skeleton for Protocol, 4-row for Materials/Budget/Timeline, 5-row for Validation. Pulse with Tailwind `animate-pulse`.
- **D4-12 (empty-state coexistence):** Plan canvas now has THREE display states: (a) empty hero (when `qcObject` is null AND `plan === null`); (b) verdict + plan (when both exist or in flight); (c) verdict only (when QC active but plan still null/loading). The pinned `<VerdictCard />` always shows when QC is active. Below it: hero (state a), skeleton (state c with isLoading), or PlanTabs (state b).
- **D4-13 (no internal scroll lock):** Each tab's content lives inside the existing `overflow-y-auto` from the parent `<section>` in plan-canvas.tsx. Tabs themselves do not introduce a second scroll container. Why: judges scroll naturally; double scroll-bars are jarring and tab content lengths differ.
- **D4-14 (no responsive at desktop-only):** Out-of-scope per REQUIREMENTS.md. Width assumption: 50% of viewport (~960px @ 1920px display). Use `max-w-full` and let columns flex naturally. Materials table can scroll horizontally if needed via `overflow-x-auto` on its wrapper.
- **D4-15 (currency format):** All `amount_usd`, `unit_price_usd` values render as `$1,234` (no decimals when whole, 2 decimals otherwise) using `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })`. Negative numbers don't appear (schema is `nonnegative`).
- **D4-16 (no client schema validation in render):** The data already passed `planSchema.safeParse` inside `usePlan().onData`. Components receive `Plan` typed values and render directly — no defensive `if (!plan?.plan?.protocol)` guards beyond a single `if (plan === null) return null` at the tabs root. Trust the type. This is a render layer, not a validation layer.

### Claude's Discretion

- Exact Tailwind class lists per cell / row — match existing aesthetic (verdict-card, validation-grid components for tone).
- Skeleton row counts (3-5 was suggested above; tweak if it looks bad).
- Specific test IDs (`data-testid`) — not required for hackathon.
- Animation timing on tab swap — keep snappy (<150ms) or zero per Linear-feel.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked Plan schema (DO NOT MODIFY)
- `src/lib/plan/schema.ts` — `planSchema`, `protocolStepSchema`, `materialRowSchema`, `budgetLineSchema`, `timelinePhaseSchema`, `validationCheckSchema`, `complianceNoteSchema`. All Phase 4 components consume the inferred TypeScript types (`Plan`, `ProtocolStep`, `MaterialRow`, `BudgetLine`, `TimelinePhase`, `ValidationCheck`, `ComplianceNote`).
- `src/lib/qc/schema.ts` — `citationSchema` (re-exported by plan schema, used by all `citations: Citation[]` fields).

### Existing analog files (closest patterns to copy from)
- `src/components/plan-canvas.tsx` — the file Phase 4 modifies. Currently renders empty-state hero + pinned VerdictCard.
- `src/components/qc/verdict-card.tsx` — color palette + typography patterns to mirror (border-forest / border-clay / border-borderwarm).
- `src/components/trace/validation-grid.tsx` — closest analog for "structured row list" rendering (Validation tab will share aesthetic).
- `src/components/trace/agent-row.tsx` — row-level pattern for status / typography hierarchy.
- `src/components/trace-rail.tsx` — example of consuming Plan-like data with `PlanLike` duck-type.
- `src/components/qc/citation-card.tsx` — citation badge styling (Phase 5 will plug into the slot Phase 4 reserves).
- `src/components/example-chips.tsx` — chip styling (the `depends_on` chips in Timeline tab will mirror this).

### Plan source (where the data comes from)
- `src/components/plan/use-plan.ts` — exposes `plan: Plan | null` via AI SDK v5 `useChat` + `onData` decoder. Phase 4 consumes this, doesn't modify.
- `src/app/app/page.tsx` — wires `plan.plan` into `<TraceRail>` ALREADY; Phase 4 adds the same wiring to `<PlanCanvas />`.
- `src/app/api/plan/route.ts` — server source of truth (read for grokking, do NOT modify).

### Design tokens
- `src/app/globals.css` — `--color-paper`, `--color-ink`, `--color-forest`, `--color-clay`, `--color-borderwarm`, `--color-surface`, `--color-citation`, `--radius` (6px). Use friendly aliases (`bg-paper`, `text-forest`, `border-borderwarm`, `text-ink`).
- `tailwind.config.ts` — v3-style mirror for shadcn-CLI compatibility (D-22 from Phase 1).
- `CLAUDE_DESIGN_BRIEF.md` — typography (font-display = serif headings, font-mono = numbers, sans for body), no glassmorphism / no neon / no SaaS gradients. Light mode only.

### shadcn primitives available
- `src/components/ui/button.tsx`, `input.tsx`, `textarea.tsx`, `scroll-area.tsx`, `sonner.tsx`. NO `tabs.tsx` yet — needs to be added.

### Project guardrails
- `CLAUDE.md` — hard rules. Most relevant for Phase 4: rule #1 (no fake citations — render nothing if `citations.length === 0`), rule #4 (single-language TypeScript), rule #5 (no new deps without justification — `@radix-ui/react-tabs` is the only new candidate, and only if shadcn `add tabs` doesn't pull it transitively).
- `.planning/phases/03-multi-agent-pipeline/03-03-SUMMARY.md` — confirms `usePlan` already wired, `<PlanCanvas />` accepts QC props from dashboard.

</canonical_refs>

<specifics>
## Specific Ideas

- **Demo cache hits:** Phase 4 should look great rendering against the 4 cached chip plans (cache-warmed in Phase 8). Visual polish should target THESE four plans first; other inputs are best-effort.
- **Reuse `font-mono tabular-nums` for all numeric cells** — consistent with `verdict-card.tsx` and gives the "lab notebook" feel from CLAUDE_DESIGN_BRIEF.md.
- **Tabs animation:** zero or <150ms — Linear-snappy. No fade-in long enough to be perceived as lag.
- **Subtotal column in Materials** — compute as `unit_price_usd * Number(quantity)` only when both are present; otherwise em-dash. Don't render `0` for missing data.
- **Compliance summary placement:** small italic line under the tab strip, ALWAYS visible, all tabs. The notes themselves are tab-targeted per D4-09.

</specifics>

<deferred>
## Deferred Ideas

- Click-to-correct popover on plan rows — Phase 7 (LOOP-01..05).
- "Generate anyway →" button on `exact-match-found` verdict (clay accent) — Phase 7 or polish in Phase 8.
- Diff modal / propagation visualization — Phase 7 (PROP-03).
- Hovercard tooltips on citations with title + 1-line excerpt — Phase 5 (GROUND-03).
- "Verify all sources" pre-flight URL resolver — Phase 5 (GROUND-05).
- Mobile / responsive breakpoints — Out of scope per REQUIREMENTS.md.
- Dark mode — Out of scope (light-mode only invariant from Phase 1).

</deferred>

---

*Phase: 04-plan-canvas-ui*
*Context gathered: 2026-04-26 via inline auto-context (hackathon time pressure)*
