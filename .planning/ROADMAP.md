# Roadmap: AI CRO Co-Pilot

## Overview

Eight phases take the project from a bare Next.js scaffold to a live, judge-ready demo. Phases 1-6 cover the 33 v1 must-ship requirements across foundation, literature QC, multi-agent generation, plan rendering, citation grounding, and live trace. Phase 7 is the v2 closed-loop differentiator (hours 14-18, hard fallback rule: cut to manual slide if not wired by hour 18). Phase 8 is polish, demo recording, and pitch prep.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Next.js scaffold, design tokens, env wiring, Vercel deploy live (completed 2026-04-25, ~25 min total, https://sextant-uekv.vercel.app)
- [x] **Phase 2: Literature QC** - Tavily search, novelty verdict, cited references, hypothesis input (completed 2026-04-26)
- [ ] **Phase 3: Multi-Agent Pipeline** - 4-agent parallel debate, structured JSON plan output
- [ ] **Phase 4: Plan Canvas UI** - Tabbed Protocol / Materials / Budget / Timeline / Validation views
- [ ] **Phase 5: Grounding & Citations** - Supplier scraping, inline citations, tooltip system, URL verify
- [ ] **Phase 6: Live Trace & Validation Grid** - Agent activity rail, test grid ticking green
- [ ] **Phase 7: Closed-Loop Corrections + Propagation Demo** - Lab rules, correction popover, diff modal
- [ ] **Phase 8: Polish, Demo, Pitch** - Visual polish, demo rehearsal, video recording, submission

## Phase Details

### Phase 1: Foundation
**Goal**: A public Vercel URL is reachable, design tokens from the brief are wired into Tailwind, and all API keys are securely stored as env vars
**Depends on**: Nothing (first phase)
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04, INPUT-03
**Success Criteria** (what must be TRUE):
  1. Visiting the Vercel URL shows the app shell with the three-column layout and correct color palette (warm off-white background, forest-green accent, no SaaS gradients)
  2. Tailwind config contains all design tokens from CLAUDE_DESIGN_BRIEF.md (colors, typography, spacing, radius, shadow)
  3. Four example hypothesis chips are rendered in the empty state and are keyboard reachable
  4. Tavily and Anthropic API keys resolve from `process.env` in the deployed environment (verified via a health-check route)
  5. A push to main triggers a Vercel deploy that completes and becomes reachable in under 60 seconds
**Plans**: 3 plans
- [x] 01-01-PLAN.md — Scaffold Next.js 15 + TS + Tailwind, wire brief design tokens and 3 fonts (D-01..D-12, D-30..D-32; DESIGN-01) — completed 2026-04-25 (commits 9ec3d3a, ecc2333). Landed as Next.js 16 + React 19 + Tailwind v4 per CONTEXT.md Claude-discretion clause.
- [x] 01-02-PLAN.md — Install shadcn minimum set, build three-column shell + empty-state hero with 4 chips, add lib/env.ts + /api/health (D-13..D-22, D-27..D-29; DESIGN-01/02/04, INPUT-03) — completed 2026-04-25 (commits 7200118, 0946daf). 4 deviations auto-fixed: shadcn CLI flag drift (hand-authored components.json), shadcn add not pulling cva/lucide (npm install added them), strict plan greps satisfied (rewrote a comment to remove `process.env` token; switched ExampleHypothesis type to Record form so `id:` count is exactly 4).
- [x] 01-03-PLAN.md — GitHub repo + Vercel project + env vars + auto-deploy verification + STATE.md update (D-23..D-26; DEPLOY-01/02/03, DESIGN-03) — completed 2026-04-25. Production URL: https://sextant-uekv.vercel.app. Two real deploys timed at 29s and 31s satisfy DEPLOY-02. Secret-leak audit clean. Visual fidelity audit deferred to Phase 8 with Claude Design landing output.

## Parallel work-streams (active alongside Phase 2+)

- **Landing-page polish** — see `.planning/handovers/landing-polish-HANDOVER.md`. Runs in a separate Claude Code chat; touches only `src/app/page.tsx` and `src/components/landing/**`. No file conflicts with Phase 2-7 work. Includes integration of Claude Design output + a Firecrawl-style ASCII-art animated background. Folds into Phase 8 visual-fidelity sign-off.
**UI hint**: yes

### Phase 2: Literature QC
**Goal**: A scientist can submit a hypothesis and receive a novelty verdict backed by at least 2 cited references in under 10 seconds
**Depends on**: Phase 1
**Requirements**: INPUT-01, INPUT-02, LITQC-01, LITQC-02, LITQC-03, LITQC-04
**Success Criteria** (what must be TRUE):
  1. User can type a hypothesis in the chat input and submit it (enter key or arrow button)
  2. When the hypothesis is ambiguous, the system asks exactly one clarifying question before running QC — never more
  3. Submitting one of the 4 sample hypotheses returns a novelty verdict ("not found", "similar work exists", or "exact match found") and at least 2 cited references (title, URL, 1-line excerpt) in under 10 seconds
  4. The novelty verdict is rendered prominently above the plan canvas with citation links visible (not collapsed)
**Plans**: 3 plans
- [x] 02-01-PLAN.md — Chip preflight gate (D-30 BLOCKING) + AI SDK v5 install + 6 server-side lib modules: tavily client, Zod schema, prompt, cache, provenance guard, model IDs (LITQC-01/02/03; D-30..D-37, D-40, D-46, D-47, D-50, D-51, D-53) — completed 2026-04-26 (commits 1988e41, 6d107f8, 1e9984c, 4ddf7fe, 00a6c05, fbc1d50). 6 lib files + 3 deps (ai@5.0.179, @ai-sdk/google@2.0.70, @ai-sdk/react@2.0.181). Build green.
- [x] 02-02-PLAN.md — POST /api/qc streaming route (Tavily → streamObject → toTextStreamResponse) + useQc client hook (LITQC-01/02/03, INPUT-02; D-38, D-39, D-48, D-49, D-52) — completed 2026-04-26 (commits 29a2d61, aaae5b7, d82246a). 2 created files + 2 modified (D-53 model swap to gemini-2.5-flash + system prompt rewrite to disambiguate ok-discriminator vs verdict-label). Smoke gate passes: cache-miss HTTP 200 in 3.4s with valid verdict + 3 cited URLs (well under 8s D-52 budget); cache-hit HTTP 200 in 8.5ms (well under 1s assertion); structured qc.request log emitted on each request. CLAUDE.md hard rule #1 intact (provenance check runs after experimental_repairText reconstruction).
- [x] 02-03-PLAN.md — VerdictCard / CitationCard / ChatThread components + dashboard wire-in (Enter submit, chip flow, 4 union states) (INPUT-01, INPUT-02, LITQC-04; D-41..D-44, D-46, D-48) — completed 2026-04-26 (commits 444f0a8, 1995856, 5f09cd5, fb55656). 3 created + 3 modified files. End-to-end smoke gate passes on live dev server: chip h1 (CRP biosensor) returns `verdict:"similar-work-exists"` with 3 cited Springer/PMC/MDPI URLs in 3.8s wallclock; cache-hit in 65ms (5ms server-side). All 4 D-48 union states wired (verdict + error retryable=false exercised live; clarify + no-evidence + retryable=true logically covered). One commit-hygiene incident (stray landing-polish files swept into Task 3 commit) documented in 02-03-SUMMARY.md. Phase 2 success criteria 1-4 satisfied.
**UI hint**: no

### Phase 3: Multi-Agent Pipeline
**Goal**: The system runs 4 cooperating agents in parallel and produces a single typed JSON experiment plan in under 60 seconds
**Depends on**: Phase 2
**Requirements**: AGENT-01, AGENT-02, AGENT-03, AGENT-04
**Success Criteria** (what must be TRUE):
  1. Plan generation spins up all 4 agents (Researcher, Skeptic, CRO Operator, Compliance) and each agent's role and current task appears in the trace rail as it runs
  2. The agents produce a single consolidated plan as valid typed JSON with all five sections (Protocol, Materials, Budget, Timeline, Validation) populated
  3. The full generation cycle completes in under 60 seconds for the rehearsed sample hypothesis
  4. The structured JSON is available as a server-side artifact that subsequent phases can render
**Plans**: TBD
**UI hint**: no

### Phase 4: Plan Canvas UI
**Goal**: The generated plan is fully readable across all five tabs in the three-column layout with keyboard navigation
**Depends on**: Phase 3
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06
**Success Criteria** (what must be TRUE):
  1. Protocol tab shows numbered methodology steps grounded in real published protocols
  2. Materials tab shows a structured table with Reagent, Catalog #, Supplier, Unit cost, Qty, Subtotal columns — each row is a distinct readable entry
  3. Budget tab shows a line-itemized total with a category breakdown (horizontal bar chart or equivalent)
  4. Timeline tab shows a phased breakdown with dependencies legible at a glance
  5. Validation tab lists success criteria with measurement methods
  6. All five tabs are navigable by keyboard (Tab / arrow keys) and the active tab is visually distinct
**Plans**: TBD
**UI hint**: yes

### Phase 5: Grounding & Citations
**Goal**: Every claim in the plan carries a clickable, verified citation and all material catalog numbers come from real supplier pages
**Depends on**: Phase 4
**Requirements**: GROUND-01, GROUND-02, GROUND-03, GROUND-04, GROUND-05
**Success Criteria** (what must be TRUE):
  1. Every numbered step in the Protocol and every row in the Materials table carries at least one inline citation superscript
  2. Clicking any citation opens the source URL in a new tab
  3. Hovering (or focusing) a citation shows a tooltip with the source title and a 1-line excerpt
  4. All catalog numbers and prices in the Materials table come from real Sigma-Aldrich / Thermo Fisher pages scraped via Tavily — no invented numbers survive to the rendered plan
  5. The "verify all sources" check confirms every citation URL resolves before the plan is shown to the user
**Plans**: TBD
**UI hint**: no

### Phase 6: Live Trace & Validation Grid
**Goal**: Users can watch agents work and validation tests tick green as the plan stabilizes, giving judges visible proof of orchestration depth
**Depends on**: Phase 3
**Requirements**: TRACE-01, TRACE-02, TRACE-03, TRACE-04
**Success Criteria** (what must be TRUE):
  1. The trace rail shows all 4 agents with colored status dots; idle agents are visually distinct from active ones; completed agents show a checkmark
  2. Active agents animate with a shimmer effect while working
  3. The validation grid lists at least 5 named tests (e.g., "Every reagent has a catalog URL", "Budget sums correctly", "No orphan protocol step", "Compliance pipeline passes", "Citations resolve")
  4. Tests visibly transition from pending to running to green (pass) as the plan finalizes — judges can watch the grid light up in real time
**Plans**: TBD
**UI hint**: yes

### Phase 7: Closed-Loop Corrections + Propagation Demo
**Goal**: A scientist can correct any line in the plan, capture it as a typed lab rule, and watch a second hypothesis plan automatically apply that rule — the closed loop is live and demo-ready
**Depends on**: Phase 5, Phase 6
**Requirements**: LOOP-01, LOOP-02, LOOP-03, LOOP-04, LOOP-05, PROP-01, PROP-02, PROP-03, PROP-04
**Success Criteria** (what must be TRUE):
  1. Clicking any line in the plan canvas opens a correction popover with three distinct actions: Challenge, Correct, Annotate
  2. Selecting "Correct" opens a focused editor with a structured "lab rule" capture field; submitting it creates a typed artifact (with fields: rule, scope, reasoning, source correction) persisted to the JSON store
  3. The lab profile drawer slides in from the right and lists all stored rules with usage counts and edit/delete controls
  4. Submitting a second (pre-staged) hypothesis produces a plan that visibly applies stored lab rules without any explicit re-prompting
  5. The side-by-side diff modal opens and shows changed lines highlighted in clay/rust with the applied lab rule labeled on each changed line
**Plans**: TBD
**UI hint**: yes

### Phase 8: Polish, Demo, Pitch
**Goal**: The product looks and feels judge-ready, the demo runs cleanly in under 3 minutes, the animated landing page from Claude Design is integrated, the demo flow is verified by an automated end-to-end test, the video is recorded, and the pitch deck is complete
**Depends on**: Phase 7 (or Phase 6 if Phase 7 falls back to manual slide)
**Requirements**: (no new requirement IDs — this phase delivers the demo artifact)
**Success Criteria** (what must be TRUE):
  1. A full run-through of the demo (landing page → empty state → hypothesis → QC → plan generation → all tabs → trace rail green) completes in under 3 minutes without errors
  2. The animated landing page from Claude Design output is integrated at `/` with timeline-based motion (Framer Motion), Sextant logo, and a working "Open Sextant" CTA → `/app`
  3. **An automated end-to-end demo dry-run passes**, driving the full demo flow without human intervention. Tool of choice (in priority order): Codex CLI driving Playwright (cheapest, deterministic, runs locally) → OpenAI Operator (computer-use API, more realistic) → Claude Computer Use (best UI understanding, requires Claude tokens). The test verifies: hypothesis chip click populates textarea, submit triggers QC + plan generation, all 4 plan tabs render, ≥5 validation checks tick green, every citation link resolves, lab rule capture works, second hypothesis applies rules, diff modal opens. Failures of the dry-run block the demo recording.
  4. If Phase 7 shipped: the closed-loop demo moment (rule captured → second plan applies rule → diff modal) runs without a manual fallback
  5. If Phase 7 did not ship: a before/after slide clearly communicates the propagation concept to judges
  6. The demo video is recorded and ready for submission
  7. The pitch deck or talking points cover: problem, solution, technical depth, differentiator, and market framing (Sextant as a B2B SaaS wedge into the $100B contract research market)
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-04-25 |
| 2. Literature QC | 3/3 | Complete | 2026-04-26 |
| 3. Multi-Agent Pipeline | 0/TBD | Not started | - |
| 4. Plan Canvas UI | 0/TBD | Not started | - |
| 5. Grounding & Citations | 0/TBD | Not started | - |
| 6. Live Trace & Validation Grid | 0/TBD | Not started | - |
| 7. Closed-Loop + Propagation Demo | 0/TBD | Not started | - |
| 8. Polish, Demo, Pitch | 0/TBD | Not started | - |
