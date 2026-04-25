# AI CRO Co-Pilot

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
- **Models**: Claude Sonnet 4.6 (plan generation, agent debate), Claude Haiku 4.5 (lit-QC scoring, fast filters). OpenAI fallback only if Tavily/embeddings prove insufficient. Gemini skipped for build (3-provider integration tax not worth 24h).
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
| Claude (Sonnet 4.6 + Haiku 4.5) primary, OpenAI fallback only | Best at structured JSON output and tool-call reliability in agent loops; Anthropic prompt caching cuts cost on agent debate | — Pending |
| Skip per-phase research agent | We already locked tech stack from chat; per-phase research adds tokens/time we cannot spend in 24h | — Pending |
| Skip post-phase verifier agent | Same reason; we will lean on the live test grid + manual UAT instead | — Pending |
| Path B for UI (Claude Design first, port to Next.js) | User wants aesthetic ownership; brief written and committed at `CLAUDE_DESIGN_BRIEF.md` | — Pending |
| Hard cut-off rule: if learning loop not wired by hour 18, cut to manual before/after slide | Codex-flagged risk; do not leave half-built | — Pending |

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
