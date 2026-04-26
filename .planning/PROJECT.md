# Sextant — AI CRO Co-Pilot

## What This Is

A web app that turns a scientific hypothesis (in plain language) into a fully-grounded, operationally realistic experiment plan a real lab could pick up and execute. Built for the Fulcrum Science "AI Scientist" challenge at the Hack-Nation 5th Global AI Hackathon (24 hours, solo team, 2026-04-25/26). The product is a working MVP — chat-driven input, multi-agent plan generation with cited sources, and a closed-loop learning layer that compounds value across plans by capturing scientist corrections as typed, reusable lab rules.

## Core Value

A scientist enters a hypothesis, watches four agents debate it in parallel, and receives a fundable, citation-grounded experiment plan in under three minutes — and every correction they make compounds into the next plan, automatically. The closed loop is the win condition.

## Requirements

### Validated

(None yet — ship to validate at the hackathon demo)

### Active

#### v1 — Must ship (hours 0-14)
- [ ] User can submit a scientific hypothesis through a chat-style input
- [ ] System runs literature QC against public sources (Tavily over arXiv / Semantic Scholar / protocols.io) and returns a novelty verdict with at least 2 cited sources
- [ ] System generates a structured experiment plan via 4 cooperating agents (Researcher, Skeptic, CRO Operator, Compliance) with visible parallel orchestration
- [ ] Plan canvas displays Protocol, Materials (with real catalog numbers/suppliers), Budget (line-itemized), Timeline (phased), Validation criteria
- [ ] Every line in the plan carries a clickable citation to a real source URL
- [ ] Live test grid shows ≥5 validation checks ticking green as the plan stabilizes
- [ ] Application is deployed to a public URL (Vercel) and reachable by judges

#### v2 — Differentiator (hours 14-18)
- [ ] User can click any line in the plan and submit a correction with three actions (Challenge / Correct / Annotate)
- [ ] Each correction extracts a typed "lab rule" artifact (not freeform text) into a JSON store
- [ ] A second hypothesis demo visibly applies stored lab rules in the new plan without explicit re-prompting
- [ ] Side-by-side propagation diff modal highlights which lines changed and which rule was applied
- [ ] Lab profile drawer lists accumulated rules with usage counts

### Out of Scope

- Real ELN/LIMS/ordering integrations — out of scope for 24h MVP, public protocols + simulated checkout are sufficient for the brief
- Authentication / multi-tenant — single-session demo is enough for the pitch
- Persisted database (Postgres/SQLite) — JSON files in repo carry the load for 24h
- Mobile / responsive beyond desktop — judges demo on laptop; mobile would dilute polish budget
- Real lab partner integrations or live ordering — beyond MVP, no real money flows
- Wet-lab simulation — we don't simulate experiment outcomes, only generate plans
- Audio / voice — chat is text-only

## Context

- **Hackathon constraints**: solo team, 24h hard deadline, judges score on technical depth + innovation + creativity + communication. Final pitches Sunday 2026-04-26 to public + jury (~200 industry experts and AI builders).
- **Track choice rationale**: 4 other tracks evaluated and rejected — Spiral Lightning (over-subscribed, brief warns "Lightning tacked on" loses), DSV City Wallet (mobile-native UX kills solo viability), Databricks Healthcare (platform lock-in + heavy ETL), World Bank UNMAPPED (policy-dashboard demo doesn't pop). Fulcrum chosen for clean solo viability + strongest startup pitch wedge.
- **Codex second-opinion**: confirmed Fulcrum, recommended pitching as "AI CRO Co-Pilot" rather than "AI Scientist" ($100B contract research market is a clearer B2B SaaS wedge for judges). Codex flagged the visible-learning-loop demo as the under-weighted risk — budget aggressively, cut to manual before/after slide if not wired by hour 18.
- **Past-winner pattern**: Spine, MedDesert, Meridian, KnowledgeDrift all leaned on visible multi-agent orchestration + cited provenance + closed-loop self-improvement. Our design intentionally mirrors this winning template.
- **Diana/YC AI-native principles applied**: closed loops > open loops, queryable typed artifacts > free text, software-factory pattern (spec → tests → multi-agent iteration), no human middleware in the UI. These guide product design, not just feature stack.
- **Domain gap**: solo dev is not a domain scientist. Mitigated by using brief's 4 sample hypotheses verbatim, citing every source, and framing as "operationally complete and grounded" rather than "scientifically novel".

## Constraints

- **Timeline**: 24 hours total. ~18h build, ~4h polish, ~2h demo recording + pitch prep. Hard deadline at hour 24.
- **Tech stack**: Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui + Vercel AI SDK. Single language, single repo, single deploy. Hosted on Vercel free tier. Storage = JSON files in repo (no database).
- **Models** (revised 2026-04-25): Multi-tier Gemini family via Vercel AI SDK `@ai-sdk/google`. Brain-tier mapping locked in `.planning/phases/01-foundation/01-CONTEXT.md` D-22a..D-22e:
  - `gemini-3.1-pro-preview` — final plan synthesis (Phase 3 consolidator)
  - `gemini-3-flash-preview` — 4 parallel agent debaters (Researcher, Skeptic, CRO Operator, Compliance) + lab-rule extraction
  - `gemini-3.1-flash-lite-preview` — lit-QC novelty scoring + validation grid checks + diff comparison
  - GA fallback ladder if previews hit rate limits: 2.5 Pro / 2.5 Flash / 2.5 Flash-Lite (same env key)
  - Provider fallback: OpenAI via `@ai-sdk/openai` (only if Google has provider-level outage, wired on demand)
  - Why the swap from Claude: out of Anthropic credits at hackathon start; Gemini 2.5/3.x family is competitive on structured-JSON + tool-use loops in early 2026 and has the credit budget. Claude was the original spec; Vercel AI SDK abstracts the swap to a model-ID change, not a rewrite.
- **Grounding**: Tavily API for literature QC and supplier scraping (free credit token TVLY-HF9ETJRW). Hard rule: no claim in any plan without a clickable, verifiable source URL. No hallucinated catalog numbers or prices.
- **UI flow**: Path B chosen — design system locked in `CLAUDE_DESIGN_BRIEF.md`, user generates first draft in Claude Design, Claude Code adapts to Next.js. Inspiration: Future House, Lila Sciences, Linear, Anthropic.com. Avoid: Silicon Valley SaaS gradients, glassmorphism, neon.
- **Budget**: zero monetary. Free tiers only.
- **Quality bar**: from brief — "Would a real scientist trust this plan enough to order materials and start running it?" Verdict from judges' perspective is the win condition.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Choose Fulcrum over Spiral / Databricks / DSV / UNMAPPED | Solo viability + startup pitch strength; less crowded than Spiral; demo single-input → big-output is the cleanest 3-min pitch | — Pending |
| Pitch as "AI CRO Co-Pilot" not "AI Scientist" | Codex recommendation: $100B contract research market is a sharper B2B SaaS wedge for judges; learning loop reframes as retention feature | — Pending |
| Next.js + TypeScript single-language stack | Solo speed; KnowledgeDrift won 1st pure-TS; Vercel AI SDK gives multi-step agent loops natively; single deploy | — Pending |
| Tavily for grounding, no vector DB | Tavily search-as-a-service is sufficient for novelty + supplier scraping; eliminates ETL bottleneck of vector store | — Pending |
| Multi-tier Gemini (3.1 Pro Preview + 3 Flash Preview + 3.1 Flash-Lite Preview), GA 2.5 fallback ladder, OpenAI provider fallback | Out of Anthropic credits at start of hackathon; Gemini family is credit-positive and competitive on structured JSON + tool-use loops in early 2026; Vercel AI SDK abstracts the provider so swap is a model-ID change | — Pending |
| Project name: Sextant | Precision navigation instrument; matches Future House / Lila Sciences / Linear aesthetic; short, distinctive, no clash with biotech-AI competitors | Locked 2026-04-25 |
| Skip per-phase research agent | We already locked tech stack from chat; per-phase research adds tokens/time we cannot spend in 24h | — Pending |
| Skip post-phase verifier agent | Same reason; we will lean on the live test grid + manual UAT instead | — Pending |
| Path B for UI (Claude Design first, port to Next.js) | User wants aesthetic ownership; brief written and committed at `CLAUDE_DESIGN_BRIEF.md` | — Pending |
| Hard cut-off rule: if learning loop not wired by hour 18, cut to manual before/after slide | Codex-flagged risk; do not leave half-built | — Pending |

## Defensibility & Pitch Framing

**Honest read (added 2026-04-26):** the *current build* is structurally a wrapper (5 Gemini calls + Tavily + a typed JSON schema). Code is not the moat. The *thesis* is defensible in three places, and the demo's job is to prove the thesis can close — not to claim the moat already exists.

### Where defensibility actually lives

1. **Typed lab-rule artifact + closed loop (the only real moat).** Each scientist correction extracts a typed, queryable rule into that lab's private store. Over months of real CRO usage, the rule store becomes a private asset competitors can't replicate. Data network effects at the lab-tenant level (weaker than platform-level network effects, but real). **Caveat:** the hackathon ships the seed (3-5 demo rules); real defensibility needs months of usage. The Phase 7 propagation demo is the moat-validation evidence — without it, the pitch reduces to "another GPT wrapper".
2. **Grounded-typed-artifact contract.** ChatGPT writes prose; Sextant produces a queryable Plan with `citations: Citation[]` per line, a `grounded` flag, and a 5-section schema a CRO operator can dispatch. The schema + the provenance discipline (CLAUDE.md hard rule #1, repair callbacks, post-stream provenance check) is product judgment that compounds across the codebase. Replicable but not trivially.
3. **Domain-calibrated multi-agent roles.** Researcher / Skeptic / CRO Operator / Compliance encode workflow assumptions a generic chat doesn't. Replaceable in isolation; valuable when calibrated against real CRO feedback over time.

### Where it is NOT defensible

- Against Anthropic / OpenAI / Google building it themselves. **Counter-argument:** model labs don't want to own a regulated B2B workflow with IRB, SOP, and procurement integrations — that's the actual gap.
- Against another well-resourced solo dev cloning the orchestration in a weekend.
- Against a competitor with a CRO design partner from day 1 (they outpace us on rule-store growth).

### What must be true for the moat thesis to hold (demo + roadmap)

**For the hackathon demo to validate the thesis:**
- [ ] Phase 7 propagation demo MUST land — rule captured from Plan A visibly applies in Plan B without re-prompting (LOOP-03, PROP-02, PROP-03, PROP-04). This single moment IS the moat evidence. CLAUDE.md hard rule #3 (cut Phase 7 by hour 18 to a manual slide) is the safety valve, but the *real* outcome we want is the live closed loop.
- [ ] Lab rules are stored as TYPED artifacts (not freeform text) with structured fields: `rule, scope, reasoning, source_correction`. Free-text rules don't compound.
- [ ] At least one rule must apply across hypothesis types (not just within one chip) to prove the rule abstraction is meaningful. Pre-stage two demo hypotheses where the same rule applies to both.

**For the post-hackathon product to be defensible:**
- [ ] Pivot positioning from "AI Scientist" → "AI CRO Operations Platform". Own the *workflow*, not the AI.
- [ ] One real CRO design partner feeding rules from day 1 (the rule store needs real friction, not synthetic data).
- [ ] Build the rule lifecycle: typed schema with conflict resolution, time decay, review queue, provenance per rule.
- [ ] Structural lock-ins via integrations: ELN, LIMS, procurement (Sigma-Aldrich punch-out), regulatory audit log. The brief explicitly punts these to out-of-scope for 24h — they ARE the actual moat for v2 of the product.
- [ ] Audit log for regulatory sign-off (FDA / IRB) — turns the typed-rule store into a compliance asset, not just a productivity asset.

### Judge-facing framing (Phase 8 pitch)

**One-liner:** "Sextant turns a hypothesis into a fully-grounded experiment plan in 3 minutes — and every correction a scientist makes compounds into the next plan, automatically. We're an AI Operations Platform for the $100B Contract Research market."

**Moat slide content (1 slide, 4 bullets):**
- *Lab-tenant data network effect* — typed lab-rule artifacts compound per-customer over months. Not transferable; not commoditizable.
- *Workflow lock-in via integrations* — ELN, LIMS, procurement, audit log. CROs don't switch tools they've wired into their procurement system.
- *Regulated-domain trust infrastructure* — provenance-per-claim, audit log, no hallucinated catalog numbers. Built-in compliance posture model labs won't replicate.
- *6-month head start in CRO-calibrated agent roles* — Researcher/Skeptic/Operator/Compliance encode workflow assumptions generic chat doesn't.

**Anti-framing (do not say at the demo):**
- Do NOT claim "data network effects" without evidence.
- Do NOT pitch this as a defensible business at hour 24 — frame it as "the prototype that proves the loop closes; investment thesis is scaling the closure."
- Do NOT compete on model quality. Always reframe to workflow + knowledge accumulation.

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-25 after initialization*
