# Deferred — "If This Becomes Real" Backlog

**Created:** 2026-04-26 (during hackathon, ~3h before deadline)
**Purpose:** Capture every scope cut taken to ship the 24h MVP, so the post-hackathon roadmap can re-introduce them with full context. Each entry includes WHY it was cut and WHAT it would take to add back.

---

## Phase 4 — Plan Canvas UI

### Cut: Inline citation tooltips, hovercards, source excerpts
- **Why cut:** Phase 5 (Grounding) is where citations get populated. Phase 4 ships with `citations: []` empty for every row and only renders a `[N sources]` badge when non-empty (CLAUDE.md hard rule #1 — no fake citations).
- **What it would take to add back:** Phase 5 implementation. CitationSlot already reserves the slot — wire `<HoverCard>` from shadcn around the badge, populate from real `citationSchema` objects (title, url, excerpt).
- **Estimated cost:** 1-2 days post-hackathon.

### Cut: Subtotal aggregate row in Materials table
- **Why cut:** Phase 4 displays per-row Subtotal; aggregate sum was deferred to keep the table simple. Budget tab already shows total.
- **What it would take:** Add a `<tfoot>` row to materials-tab.tsx that sums `unit_price_usd * qty` across all rows.
- **Estimated cost:** 1 hour.

### Cut: Gantt-chart visualization for Timeline
- **Why cut:** Time budget. Phase 4 ships text-based phased rows with depends_on chips. Visual Gantt would need a charting lib (chart.js or recharts) which violates CLAUDE.md hard rule #5.
- **What it would take:** Add `recharts` (~80KB) + a small `<TimelineGantt>` component reading `timelinePhaseSchema[]`.
- **Estimated cost:** 1 day.

### Cut: Sticky compliance summary footer
- **Why cut:** Phase 4 renders compliance_summary inline; sticky positioning across tabs was deferred to avoid overlap with the parent overflow.
- **What it would take:** Lift `compliance_summary` rendering out of PlanTabs into PlanCanvas footer with `sticky bottom-0`.
- **Estimated cost:** 30 min.

### Cut: Mobile / responsive breakpoints
- **Why cut:** Out of scope per REQUIREMENTS.md (judges demo on laptop). Plan canvas is fixed at desktop ~960px.
- **What it would take:** Tailwind responsive classes on the 3-column grid + tabs collapse to dropdown < 768px.
- **Estimated cost:** 2 days.

### Cut: Dark mode
- **Why cut:** Light-mode invariant locked in Phase 1 (D-10). All design tokens are HSL light-mode only.
- **What it would take:** Add `.dark` token mirror in globals.css + dark-aware design system. Significant.
- **Estimated cost:** 1 week.

---

## Phase 5 — Grounding & Citations (LITE scope)

### Cut: Per-row Tavily search for every plan line
- **Why cut:** Time pressure. Original spec had a Tavily call per protocol step + per material row + per budget line + per validation check. Too slow (60s function ceiling) and too expensive at hackathon scale.
- **MVP scope:** ONE Tavily call per Materials section, results applied to all material rows. Protocol/Budget/Timeline/Validation rows get no fresh citations beyond what the agents emitted.
- **What it would take to add back:** Parallel Tavily fan-out per row using Promise.allSettled with per-row timeouts. Need to upgrade Vercel function timeout (current 60s → 300s on paid tier) or move to background job.
- **Estimated cost:** 3-4 days.

### Cut: GROUND-05 "Verify all sources" pre-flight URL check
- **Why cut:** Time pressure + flaky-test risk. Verifying every URL resolves before showing the plan to the user adds 5-10s wallclock and many false-failures (sites with bot detection, rate limits).
- **What it would take:** Server-side HEAD request loop with 2s timeout per URL + a "stale citation" badge for unresolvable ones. Don't block the plan render — show a warning.
- **Estimated cost:** 2 days.

### Cut: Real supplier-page scraping (Sigma-Aldrich, Thermo Fisher punch-out)
- **Why cut:** Brief explicitly punts ELN/LIMS/ordering integrations to out-of-scope. Catalog numbers in the demo come from Tavily search results, not real e-commerce APIs.
- **What it would take:** Actual punch-out integrations with Sigma-Aldrich, Thermo Fisher, VWR REST APIs. Per-supplier auth, rate limits, contract negotiations.
- **Estimated cost:** 1-3 months per supplier.

### Cut: Inline citation footnote numbers (e.g. "...via [3]")
- **Why cut:** Phase 4 reserves a `[N sources]` badge slot, not inline footnote markers. Inline numbering needs a citation-numbering pass through the plan text.
- **What it would take:** A second pass over each rendered string that replaces `{cite:url}` placeholders with `[1]` superscripts and builds a footnote table.
- **Estimated cost:** 1 day.

---

## Phase 7 — Closed-Loop Corrections + Propagation

### Cut: "Challenge" and "Annotate" actions on the correction popover
- **Why cut:** CLAUDE.md hard rule #3 mandate. Hackathon cut to "Correct" only — the single most powerful action that demonstrates the closed loop. Challenge (push back on agent) and Annotate (free-text note) are valuable but redundant for the moat moment.
- **What it would take:** Two more popover branches + two more typed artifact extractors (challenge_artifact, annotation_artifact) + UI to surface them.
- **Estimated cost:** 1 week.

### Cut: Lab profile drawer (LOOP-05)
- **Why cut:** Demo-pace pressure. The drawer with all stored rules + usage counts + edit/delete is a "look at the rule store" feature, but the propagation demo (rule applied in Plan B without re-prompting) IS the moat moment, not the drawer.
- **What it would take:** Right-side `<Sheet>` from shadcn with a list of rules from `data/lab_rules.json`, edit modal, delete confirmation.
- **Estimated cost:** 2-3 days.

### Cut: Side-by-side diff modal with per-line rule labels (PROP-04)
- **Why cut:** Hackathon demo shows Plan A and Plan B side-by-side with changed lines highlighted, but per-line rule labels ("rule R-04 applied here") need a tracing system that maps each lab rule to the specific Plan B fields it affected.
- **What it would take:** Add a `applied_rules: LabRule[]` field per Plan slice. Diff renderer reads this and labels lines.
- **Estimated cost:** 3-4 days.

### Cut: Cross-hypothesis rule generalization (PROP-02 robustness)
- **Why cut:** Hackathon demo shows ONE rule applied across two pre-staged hypotheses. Real generalization (rule from "CRP biosensor" applies to "Gut Health L. rhamnosus" automatically) needs semantic matching, not string matching.
- **What it would take:** Embedding-based rule retrieval (rule embeddings + hypothesis embedding + cosine similarity threshold). Vector store. Re-ranker.
- **Estimated cost:** 2 weeks.

### Cut: Rule conflict resolution + time decay
- **Why cut:** Out of MVP scope. Demo has 3-5 rules, no conflicts.
- **What it would take:** Rule schema needs `confidence`, `last_used_at`, `superseded_by` fields. UI to surface conflicts. Background job to decay unused rules.
- **Estimated cost:** 1-2 weeks.

### Cut: Audit log for regulatory sign-off (FDA / IRB compliance)
- **Why cut:** Out of 24h scope. Brief explicitly punts compliance to out-of-scope.
- **What it would take:** Append-only audit log of every rule change, every plan generation, every correction, with cryptographic chain (Merkle tree). FDA / IRB requirements docs.
- **Estimated cost:** 2 months + legal review.

---

## Phase 8 — Polish, Demo, Pitch

### Cut: Visual fidelity audit against 4 reference points (Future House, Lila Sciences, Linear, Anthropic.com)
- **Why cut:** Phase 1 deferred this to Phase 8; Phase 8 is now a 60-min slot for cache-warm + record. Visual fidelity is "good enough" if the locked design tokens render correctly.
- **What it would take:** Side-by-side screenshot comparison + Tailwind class adjustments. Maybe 1 day with a designer's eye.
- **Estimated cost:** 1 day.

### Cut: User-facing "About" / "How it works" page
- **Why cut:** Demo is the explanation. No marketing surface in v1.
- **What it would take:** A second route at `/how-it-works` with a 4-section explainer.
- **Estimated cost:** 4 hours.

### Cut: Bug-report / feedback widget
- **Why cut:** Single-session demo, no real users.
- **What it would take:** Sentry or LogRocket integration + a `<FeedbackButton />` floating component.
- **Estimated cost:** 1 day.

---

## Cross-cutting deferrals

### Cut: Authentication / multi-tenant
- **Why cut:** REQUIREMENTS.md out-of-scope. Single-session demo is enough for the pitch.
- **What it would take:** NextAuth + per-tenant data isolation in lab_rules.json (or finally a real DB).
- **Estimated cost:** 1-2 weeks.

### Cut: Persistent database (Postgres / Supabase)
- **Why cut:** REQUIREMENTS.md out-of-scope. JSON files in repo carry 24h load.
- **What it would take:** Supabase or Neon Postgres + Drizzle ORM + migration of `data/runs/`, `data/lab_rules.json` to tables.
- **Estimated cost:** 1 week.

### Cut: Real ELN / LIMS / ordering integrations
- **Why cut:** REQUIREMENTS.md out-of-scope. The ACTUAL post-hackathon moat lives here per PROJECT.md "What must be true for the moat thesis to hold."
- **What it would take:** Per-system integration (Benchling, LabArchives, sapio, Genohub) + per-supplier punch-out (Sigma, Thermo, VWR) + procurement workflow.
- **Estimated cost:** 3-6 months per integration.

### Cut: Wet-lab simulation / experiment outcome prediction
- **Why cut:** Different challenge entirely. We generate plans, not simulate results.
- **What it would take:** A different product. Not on the roadmap.

---

## Token / time optimizations applied during hackathon

For future hackathon runs or tight deadlines:

1. **Skipped GSD per-phase researcher** (`workflow.research: false` in `.planning/config.json`).
2. **Skipped GSD verifier** (`workflow.verifier: false`).
3. **Skipped UI gate** (`workflow.ui_phase: false`, `ui_safety_gate: false`) — relied on locked CLAUDE_DESIGN_BRIEF.md.
4. **Skipped pattern-mapper for Phase 4** — wrote analog file references inline in CONTEXT.md instead.
5. **Inlined CONTEXT.md for Phase 4** instead of running `/gsd-discuss-phase` (saved ~80k tokens).
6. **Single-language stack (TypeScript only)** — no Python services, no multi-runtime complexity.
7. **No DB** — JSON files in repo for lab rules + cached runs.
8. **No new dependencies beyond locked stack** — `@radix-ui/react-tabs` was the only Phase 4 add.
9. **Skipping plan-checker for Phase 5 LITE** (small scope, low risk).
10. **Inlining PLAN.md for Phase 5 LITE** instead of `/gsd-plan-phase 5` (saves ~200k orchestration tokens).
11. **Keeping plan-checker for Phase 7** (high stakes — the moat moment, mistakes cost more than tokens).
12. **Auto-chain across phases** — `--auto` flag carries through plan → execute without `/gsd-resume-work` between.

---

*This doc is the canonical "what would we build next if Sextant becomes a real product" reference. Update it any time a feature is consciously cut or postponed.*
