# Requirements: AI CRO Co-Pilot

**Defined:** 2026-04-25
**Core Value:** A scientist enters a hypothesis, watches four agents debate it in parallel, and receives a fundable, citation-grounded experiment plan in under three minutes — and every correction they make compounds into the next plan, automatically.

## v1 Requirements

Requirements for the must-ship hackathon MVP (hours 0-14). Each maps to roadmap phases.

### Input

- [ ] **INPUT-01**: User can submit a scientific hypothesis through a chat-style text input
- [ ] **INPUT-02**: System detects ambiguity and asks at most one clarifying question before proceeding
- [ ] **INPUT-03**: Empty state surfaces 4 example hypotheses (taken verbatim from the Fulcrum brief) as one-click chips

### Literature QC

- [ ] **LITQC-01**: System queries Tavily across arXiv, Semantic Scholar, and protocols.io with the user's hypothesis
- [ ] **LITQC-02**: System returns a novelty verdict ("not found", "similar work exists", "exact match found")
- [ ] **LITQC-03**: System surfaces at least 2 cited references with title, source URL, and 1-line excerpt
- [ ] **LITQC-04**: Lit-QC verdict is rendered prominently above the plan canvas

### Multi-Agent Plan Generation

- [ ] **AGENT-01**: Plan generation runs 4 cooperating agents in parallel: Researcher, Skeptic, CRO Operator, Compliance
- [ ] **AGENT-02**: Each agent's role and current task is visible in a live trace rail
- [ ] **AGENT-03**: Agent debate produces a single consolidated plan as typed JSON
- [ ] **AGENT-04**: Generation completes in under 60 seconds for the rehearsed sample input

### Plan Canvas

- [ ] **PLAN-01**: Plan canvas displays Protocol section as numbered methodology steps grounded in real published protocols
- [ ] **PLAN-02**: Plan canvas displays Materials section as a structured table with Reagent, Catalog #, Supplier, Unit cost, Qty, Subtotal columns
- [ ] **PLAN-03**: Plan canvas displays Budget section with line-itemized total and category breakdown
- [ ] **PLAN-04**: Plan canvas displays Timeline section as a phased breakdown with dependencies
- [ ] **PLAN-05**: Plan canvas displays Validation section listing success criteria and measurement methods
- [ ] **PLAN-06**: Plan canvas tabs are navigable via keyboard and clearly indicate active tab

### Grounding & Citations

- [ ] **GROUND-01**: Every claim, reagent, and number in the plan carries an inline citation
- [ ] **GROUND-02**: Each citation is a clickable link that opens the source URL in a new tab
- [ ] **GROUND-03**: Hovering a citation shows a tooltip with the source title and a 1-line excerpt
- [ ] **GROUND-04**: Material catalog numbers and prices are scraped from real supplier pages (Sigma-Aldrich, Thermo Fisher, etc.) via Tavily, never invented
- [ ] **GROUND-05**: A "verify all sources" check confirms every URL resolves before plan is shown to user

### Live Trace & Validation

- [ ] **TRACE-01**: Trace rail shows each of the 4 agents with a status indicator (idle, working, done) and current task line
- [ ] **TRACE-02**: Active agents animate with a shimmer; completed agents show a checkmark
- [ ] **TRACE-03**: Validation test grid lists at least 5 named tests with status indicators (pending, running, pass, fail)
- [ ] **TRACE-04**: Tests visibly tick green as the plan stabilizes (e.g., "every reagent has a catalog URL", "budget sums correctly", "no orphan protocol step", "compliance pipeline passes", "citations resolve")

### Deployment

- [ ] **DEPLOY-01**: Application is deployed to a public URL on Vercel that judges can reach without authentication
- [ ] **DEPLOY-02**: Deployment completes within 60 seconds of a push to main
- [ ] **DEPLOY-03**: Tavily and Anthropic API keys are stored as Vercel environment variables (never in repo)

### Design System

- [x] **DESIGN-01**: UI implements the design tokens specified in CLAUDE_DESIGN_BRIEF.md (typography, color palette, spacing, radius, shadow) — completed Plan 01-01
- [ ] **DESIGN-02**: Layout follows the three-column scheme: Chat panel (~32%), Plan canvas (~50%), Trace rail (~18%)
- [ ] **DESIGN-03**: Visual style passes a smoke check against the four reference points (Future House, Lila Sciences, Linear, Anthropic.com) — no SaaS gradients, no glassmorphism, no neon (palette and font wiring landed in Plan 01-01; full smoke check at Plan 01-02 sign-off)
- [ ] **DESIGN-04**: All interactive elements meet WCAG AA contrast and are keyboard reachable

## v2 Requirements

The differentiator (hours 14-18). Stretch goal that wins the demo if completed.

### Closed-Loop Corrections

- [ ] **LOOP-01**: User can click any line in the plan canvas and open a correction popover with three actions (Challenge, Correct, Annotate)
- [ ] **LOOP-02**: Selecting "Correct" opens a focused editor with a structured "lab rule" capture field
- [ ] **LOOP-03**: Each submitted correction is extracted into a typed lab rule artifact (not freeform text) with fields: rule, scope, reasoning, source correction
- [ ] **LOOP-04**: Lab rules are persisted to a JSON store on the server
- [ ] **LOOP-05**: Lab profile drawer slides in from the right and lists all stored rules with usage counts and edit/delete controls

### Propagation Demo

- [ ] **PROP-01**: A second pre-staged hypothesis can be submitted after corrections are captured
- [ ] **PROP-02**: The second plan visibly applies stored lab rules without explicit re-prompting from the user
- [ ] **PROP-03**: A side-by-side diff modal opens showing plan A and plan B with changed lines highlighted in clay/rust accent
- [ ] **PROP-04**: Each highlighted line is labeled with the lab rule that was applied

## Out of Scope

| Feature | Reason |
|---------|--------|
| Authentication / multi-tenant | Single-session demo is enough for hackathon pitch; auth would steal hours from differentiator |
| Persistent database (Postgres / SQLite) | JSON files in repo carry the load for 24h; database adds zero pitch value |
| Real ELN / LIMS / ordering integrations | Beyond MVP scope; brief explicitly accepts simulated outputs grounded in public protocols |
| Wet-lab simulation or experiment outcome prediction | We generate plans, not simulated results — that is a different challenge |
| Mobile / responsive design beyond desktop | Judges demo on laptop; mobile would dilute polish budget |
| Audio / voice input | Brief is text-first; voice adds complexity for zero pitch lift |
| User accounts and saved-plan history | Out of scope for MVP; lab profile drawer covers the demo need |
| Real payment or e-commerce integration | No money flows in v1 |
| Internationalization | Demo is English-only |
| Real-time collaboration / multi-user editing | Solo-user flow only |
| OAuth / SSO | No auth at all in v1 |
| Custom domain (non vercel.app) | Subdomain is fine for hackathon judges |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INPUT-01 | Phase 2 | Pending |
| INPUT-02 | Phase 2 | Backend wired (02-02), UI pending (02-03) |
| INPUT-03 | Phase 1 | Pending |
| LITQC-01 | Phase 2 | Backend wired (02-02), UI pending (02-03) |
| LITQC-02 | Phase 2 | Backend wired (02-02), UI pending (02-03) |
| LITQC-03 | Phase 2 | Backend wired (02-02), UI pending (02-03) |
| LITQC-04 | Phase 2 | Pending |
| AGENT-01 | Phase 3 | Pending |
| AGENT-02 | Phase 3 | Pending |
| AGENT-03 | Phase 3 | Pending |
| AGENT-04 | Phase 3 | Pending |
| PLAN-01 | Phase 4 | Pending |
| PLAN-02 | Phase 4 | Pending |
| PLAN-03 | Phase 4 | Pending |
| PLAN-04 | Phase 4 | Pending |
| PLAN-05 | Phase 4 | Pending |
| PLAN-06 | Phase 4 | Pending |
| GROUND-01 | Phase 5 | Pending |
| GROUND-02 | Phase 5 | Pending |
| GROUND-03 | Phase 5 | Pending |
| GROUND-04 | Phase 5 | Pending |
| GROUND-05 | Phase 5 | Pending |
| TRACE-01 | Phase 6 | Pending |
| TRACE-02 | Phase 6 | Pending |
| TRACE-03 | Phase 6 | Pending |
| TRACE-04 | Phase 6 | Pending |
| DEPLOY-01 | Phase 1 | Pending |
| DEPLOY-02 | Phase 1 | Pending |
| DEPLOY-03 | Phase 1 | Pending |
| DESIGN-01 | Phase 1 | Done (Plan 01-01) |
| DESIGN-02 | Phase 1 | Pending |
| DESIGN-03 | Phase 1 | In progress (palette+fonts done in Plan 01-01) |
| DESIGN-04 | Phase 1 | Pending |
| LOOP-01 | Phase 7 | Pending |
| LOOP-02 | Phase 7 | Pending |
| LOOP-03 | Phase 7 | Pending |
| LOOP-04 | Phase 7 | Pending |
| LOOP-05 | Phase 7 | Pending |
| PROP-01 | Phase 7 | Pending |
| PROP-02 | Phase 7 | Pending |
| PROP-03 | Phase 7 | Pending |
| PROP-04 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 33 total
- v2 requirements: 9 total
- Total: 42
- Mapped to phases: 42/42 (100%)

---
*Requirements defined: 2026-04-25*
*Last updated: 2026-04-25 after roadmap generation — all requirements mapped*
