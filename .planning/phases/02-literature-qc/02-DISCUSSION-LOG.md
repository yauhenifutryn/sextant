# Phase 2: Literature QC - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-26
**Phase:** 02-literature-qc
**Areas discussed:** Tavily call shape, Novelty scoring, Streaming + UI placement, Ambiguity / clarifying question + error handling

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Tavily call shape | One broad search vs three parallel calls scoped per source | ✓ |
| Novelty scoring approach | LLM-as-judge vs heuristic vs hybrid | ✓ |
| Streaming + UI placement | streamObject vs one-shot JSON; verdict placement | ✓ |
| Ambiguity / clarifying question + error handling | When clarify fires + Tavily / Gemini failure modes | ✓ |

**User's choice:** All four areas selected (multi-select).

---

## Tavily Call Shape

| Option | Description | Selected |
|--------|-------------|----------|
| One broad call + post-filter | Single Tavily search with topic='general', advanced depth, max_results=10. Group results client-side by domain. Cheapest, simplest. | ✓ |
| Three parallel scoped calls | Promise.all of three Tavily searches with include_domains=['arxiv.org'], ['semanticscholar.org'], ['protocols.io']. 3x credit burn, guaranteed per-source coverage. | |
| One broad call + targeted second call if gaps | Run broad search; if a source has 0 results in top-10, fire one extra targeted call. Adaptive but adds branching latency. | |

**User's choice:** One broad call + post-filter (Recommended).
**Notes:** Accepts arXiv-heavy results may crowd protocols.io; mitigated by Gemini's relevance ranking.

---

## Tavily Search Parameters

| Option | Description | Selected |
|--------|-------------|----------|
| advanced + 10 results + include_raw=false | search_depth='advanced', max_results=10, include_answer=false, include_raw_content=false. | ✓ |
| basic + 5 results | Faster (~0.7s), shallower excerpts. | |
| advanced + 10 + include_raw=true | Full page content for top-N. Highest quality, but pushes Gemini context closer to limits. | |

**User's choice:** advanced + 10 results + include_raw=false (Recommended).

---

## Novelty Scoring Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Pure LLM-as-judge with structured output | Gemini Flash-Lite reads top-N Tavily results, returns Zod-typed verdict + citations from input set only. Single call, ~2s. | ✓ |
| Heuristic-first + LLM fallback | Hard rules on result count + title-similarity, LLM only for tie-breaks. More branches. | |
| LLM with chain-of-thought explain field | Same as option 1 + hidden 'thought' field. ~30% more tokens, marginal accuracy lift on Flash-Lite. | |

**User's choice:** Pure LLM-as-judge with structured output (Recommended).

---

## Verdict Threshold Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Conservative for novelty claims | Default to 'similar work exists' unless evidence strong either direction. 'Exact match found' requires direct hypothesis test. 'Not found' requires zero relevant results across all 3 domains. | ✓ |
| Aggressive 'exact match' detection | Lower bar for 'exact match' — any related mechanism. More dramatic for demo; higher false-positive risk. | |
| Let the LLM decide, no prompt-level thresholds | Just describe labels in prompt and let Gemini judge. Less predictable across hypotheses; demo replays differ. | |

**User's choice:** Conservative for novelty claims (Recommended).

---

## Citation Count

| Option | Description | Selected |
|--------|-------------|----------|
| Exactly 3, ranked by relevance | Schema enforces min=2 (LITQC-03 floor), target=3. Three feels substantive without overwhelming the verdict card. | ✓ |
| 2-5 (Gemini picks count) | More flexibility, but rendering layout becomes variable. 5 citations could push verdict card below the fold. | |
| Exactly 2 (LITQC-03 minimum) | Tightest demo footprint; risks looking thin if Tavily found 8 strong sources. | |

**User's choice:** Exactly 3, ranked by relevance (Recommended).

---

## Response Transport

| Option | Description | Selected |
|--------|-------------|----------|
| streamObject + Zod schema | Vercel AI SDK streams the partial verdict object as Gemini emits tokens. Premium feel for ~zero extra code. | ✓ |
| One-shot JSON POST | POST /api/qc returns full payload after Tavily + Gemini both finish. Simpler error handling; reads as slower. | |
| Progressive: status events + final JSON | SSE emits named stages, final 'done' event contains full verdict. Visible progress without partial-object complexity. | |

**User's choice:** streamObject + Zod schema (Recommended).

---

## Verdict UI Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Canvas (top of plan column) + chat thread message | Verdict card pinned at top of canvas; chat panel shows compact assistant message with badge + "See sources →" anchor. | ✓ |
| Canvas only, chat shows compact echo | Verdict lives only in canvas. Chat just echoes "Lit-QC complete — see canvas". | |
| Chat only, canvas shows generated plan later | Verdict appears as rich assistant message in chat. Violates LITQC-04 ("rendered prominently above the plan canvas"). | |

**User's choice:** Canvas + chat thread message (Recommended).

---

## Citation Card Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Title + source domain badge + 1-line excerpt + open-link icon | Compact card matching LITQC-03 spec. Source-tinted badges (arXiv / Semantic Scholar / protocols.io). | ✓ |
| Title + 2-line excerpt + relevance score | Adds Gemini's relevance score (0-100). Risks over-claiming via LLM self-report. | |
| Title + URL only, hover for excerpt | Densest layout; hides excerpt behind hover. Loses at-a-glance grounding signal. | |

**User's choice:** Title + source domain badge + 1-line excerpt + open-link icon (Recommended).

---

## Clarifying Question Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Skip for chips, post-search trigger for freeform | The 4 sample chips skip clarify check. Freeform input runs Tavily first; if low confidence OR <2 relevant results, response includes clarify_question instead of verdict. Single LLM call. | ✓ |
| Pre-search ambiguity check (always) | Separate Gemini call BEFORE Tavily to detect ambiguity. Adds ~1s every submission. | |
| Never clarify; always answer | Skip INPUT-02. Always return a verdict. Violates the requirement. | |

**User's choice:** Skip for chips, post-search trigger for freeform (Recommended).

---

## Error Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Typed error states with explicit user prompts | Discriminated union: verdict / clarify / no-evidence / error. Never confabulate, never silently default. | ✓ |
| Default to 'not found' on any failure | Simpler client logic, but conflates 'truly novel' with 'service down' — misleading and demo-fragile. | |
| Show raw Tavily results without verdict on Gemini failure | Useful fallback but ships partial output and degrades demo. | |

**User's choice:** Typed error states with explicit user prompts (Recommended).

---

## Caching

| Option | Description | Selected |
|--------|-------------|----------|
| Per-session in-memory only | Module-level Map keyed by hash(hypothesis). Re-running same hypothesis hits cache. Cleared on cold start. Zero git pollution. | ✓ |
| JSON cache file in repo (.cache/qc/) | Survives redeploys. Pollutes git. Premature infra for 24h hackathon. | |
| No cache — always fresh | Trustworthy and live, but every re-run burns Tavily credits. | |

**User's choice:** Per-session in-memory only (Recommended).

---

## Latency Budget

| Option | Description | Selected |
|--------|-------------|----------|
| Total budget: <8s | Roadmap criterion is <10s. Pin internal budget to <8s with ~5s headroom (Tavily ~1.5s + Gemini ~2-3s + render ~1s). Fallback to gemini-2.5-flash-lite if tripped. | ✓ |
| Total budget: <10s exactly | Less margin; demo at the edge of the success criterion. | |
| No budget pin — measure post-build | Plan first, optimize after. Risk: discovers latency issue too late. | |

**User's choice:** Total budget: <8s (Recommended).

---

## Claude's Discretion

- Exact prompt wording for the QC scorer (constraints listed in CONTEXT.md D-35, D-37, D-47).
- File layout under `src/lib/qc/` (consolidation allowed if it reads cleaner).
- Card border colors / spacing within design tokens.
- Zod schema field name tightening, as long as TypeScript types are exported.

## Deferred Ideas

- Tavily-Anthropic source-grounded model — out of scope, on Gemini per D-22.
- Embedding-based novelty scoring — out of scope.
- Verdict result-set visualization ("found N papers") — Phase 8 polish.
- Multi-turn chat refinement on the same hypothesis — Phase 8+ idea.
- Persisting QC history across sessions — Phase 7 lab profile extension.
- Tavily retry / exponential backoff — out of scope for 24h MVP.
