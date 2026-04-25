# Phase 2: Literature QC - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers **the first end-to-end "scientist input → grounded answer" loop**: a hypothesis goes in via the chat panel, Tavily searches arXiv / Semantic Scholar / protocols.io, Gemini Flash-Lite scores novelty over the returned results, and a verdict card with three real citations renders above the (still empty) plan canvas in under 8 seconds.

What ships in Phase 2:
- `@ai-sdk/google` package added; Gemini wired through Vercel AI SDK
- `src/lib/tavily.ts` thin Tavily client (key from `lib/env.ts`)
- `src/lib/qc/schema.ts` Zod schema for the structured QC output (verdict, reasoning, citations, optional clarify_question)
- `src/lib/qc/prompt.ts` system prompt for the lit-QC scorer (conservative novelty thresholds, citation-only-from-input rule)
- `app/api/qc/route.ts` server route: Tavily call → Gemini `streamObject` → SSE stream of partial verdict
- Chat panel input wiring (textarea submit via Enter or arrow button) on `/app`
- Verdict card component pinned at top of canvas column (above the empty plan tabs)
- Compact assistant message in chat thread mirroring the verdict
- Per-session in-memory result cache keyed by hash(hypothesis)
- Typed error / no-evidence / clarify states with explicit user-facing copy

What does NOT ship in Phase 2 (deferred):
- Multi-agent plan generation (Phase 3)
- Plan canvas tab content (Phase 4)
- Citation tooltips with hover excerpts (Phase 5 polishes citations across the whole plan)
- Live trace rail population (Phase 6)
- Lab-rule capture / corrections (Phase 7)

</domain>

<decisions>
## Implementation Decisions

### Pre-flight (must happen before first LLM submission)

- **D-30:** Replace the 4 placeholder strings in `src/lib/example-hypotheses.ts` with verbatim Fulcrum-brief sample hypotheses BEFORE wiring the chat input to `/api/qc`. This is the user's responsibility and is enforced by CLAUDE.md hard rule #2. The planner should call this out as the very first task in the Phase 2 plan.

### Tavily Integration

- **D-31:** **Call shape:** one broad Tavily search per hypothesis. No `include_domains` filter on the request. Group results client-side by domain (arxiv.org, semanticscholar.org, protocols.io). Trade-off accepted: arXiv-heavy results may crowd protocols.io; mitigated by Gemini's relevance ranking when picking citations.
- **D-32:** **Tavily params (locked):**
  - `search_depth: "advanced"` (better excerpt extraction)
  - `max_results: 10`
  - `include_answer: false` (we score with Gemini, not Tavily's summary)
  - `include_raw_content: false` (excerpt field is enough; saves tokens and latency)
  - `topic: "general"` (no time filter)
- **D-33:** **Tavily client lives at `src/lib/tavily.ts`**, exports a single typed function `tavilySearch(query: string): Promise<TavilyResult[]>`. Reads `env.TAVILY_API_KEY`. No retry logic in v1 — surface failures to the route, route returns typed error to the client.

### Novelty Scoring

- **D-34:** **Approach: pure LLM-as-judge with structured output.** The route assembles top-N Tavily results into a context block, then calls `streamObject` with `model: google('gemini-3.1-flash-lite-preview')` and a Zod schema. Gemini cannot invent citations — its `citations` field MUST reference items from the supplied result set (enforced by the prompt and by post-stream validation that every cited URL appears in the Tavily input).
- **D-35:** **Verdict thresholds: conservative.** Default verdict bias toward `"similar work exists"` unless evidence is strong either direction.
  - `"exact match found"` requires a paper whose title or abstract directly tests the same hypothesis (not just adjacent mechanism).
  - `"not found"` requires zero relevant results across all 3 source domains AND Gemini cannot identify a related working area.
  - The prompt encodes these definitions verbatim and instructs the model to err toward "similar work exists" when uncertain.
- **D-36:** **Citation count: exactly 3.** Schema enforces `min(2)` (LITQC-03 floor) and `max(3)` (rendering ceiling). Gemini ranks them top-to-bottom by its own relevance assessment; we do not surface that score in the UI (avoids over-claiming).
- **D-37:** **Citation provenance check (anti-confabulation guard):** after `streamObject` resolves, the route validates every `citations[].url` in the response appears in the original Tavily result set. Any citation whose URL is not in the input is dropped. If <2 valid citations remain, the response upgrades to the `no-evidence` error state.

### Response shape & streaming

- **D-38:** **Transport: `streamObject` with Zod schema.** Vercel AI SDK streams the partial verdict object as Gemini emits tokens. The route emits one initial status event (`{stage: "tavily_started"}`) before the model stream begins, then proxies the SDK stream. Premium UX for ~zero extra code with the AI SDK.
- **D-39:** **Server route: `app/api/qc/route.ts`** (POST). Body: `{hypothesis: string}`. Response: SDK-formatted stream consumable by `useObject` on the client. No streaming of intermediate Tavily results — only the final tool result is fed to Gemini, then Gemini's stream is what reaches the user.
- **D-40:** **Discriminated-union response type** (Zod):
  ```ts
  z.discriminatedUnion("ok", [
    z.object({ ok: z.literal("verdict"), verdict: z.enum(["not-found", "similar-work-exists", "exact-match-found"]), reasoning: z.string(), citations: z.array(citationSchema).min(2).max(3) }),
    z.object({ ok: z.literal("clarify"), clarify_question: z.string() }),
    z.object({ ok: z.literal("no-evidence"), message: z.string() }),
    z.object({ ok: z.literal("error"), message: z.string(), retryable: z.boolean() }),
  ])
  ```
  This single type drives both the route response and the client's render switch.

### UI placement

- **D-41:** **Verdict card lives at top of canvas column** (the 50% middle column on `/app`), pinned above the (still empty in Phase 2) plan tabs. Large `font-display` verdict label (e.g., "Similar work exists") + 1-2 sentence reasoning in `font-sans` + 3 citation cards stacked vertically. Forest-green border accent for `not-found` (true novelty signal), warm-neutral border for `similar-work-exists`, clay/rust accent for `exact-match-found` (the "stop and look" verdict).
- **D-42:** **Chat thread (32% column) shows a compact assistant message** mirroring the verdict: small verdict badge + first sentence of reasoning + "See sources →" anchor that scrolls/focuses the verdict card on the canvas. Conversation history persists in the chat panel for the session; a second hypothesis submission appends to the chat thread but replaces the canvas verdict card.
- **D-43:** **Citation card (compact):** title (`font-display`, 1-line truncate, font-weight 500) + small source-domain badge (arXiv = forest-tinted, Semantic Scholar = ink-tinted, protocols.io = clay-tinted) + 1-line excerpt (`font-sans`, 14px, muted color) + `Lucide ExternalLink` icon top-right. Clicking anywhere on the card opens the URL in a new tab (`target="_blank"`, `rel="noopener noreferrer"`).
- **D-44:** **Chip click flow:** clicking one of the 4 example chips populates the textarea (existing Phase 1 behavior) AND auto-focuses the send arrow. User still has to press Enter or click the arrow to submit — keeps the demo deliberate. No auto-submit (one-step demos look like an accident).

### Ambiguity / clarifying question (INPUT-02)

- **D-45:** **Skip pre-search ambiguity check for the 4 example chips.** They are pre-vetted; the demo path goes straight to Tavily and Gemini.
- **D-46:** **For freeform input, the clarifying question is post-search.** Single Gemini call returns either a `verdict` payload OR a `clarify` payload. The Zod schema makes these mutually exclusive — Gemini emits one or the other, never both. Prompt instructs the model to emit `clarify` only when the hypothesis is ambiguous in a way that materially changes which experiments would test it (not just stylistically vague). At-most-one-clarification rule enforced client-side: after a clarify, the next submission is treated as final regardless of remaining ambiguity.
- **D-47:** **Detection signal in the prompt:** the model emits `clarify` if (a) Tavily returned <2 strongly relevant results AND (b) the hypothesis admits two or more substantively different operationalizations. The prompt gives 1-2 examples to anchor the bar.

### Error handling

- **D-48:** **Four discriminated-union response states:** `verdict`, `clarify`, `no-evidence`, `error`. Client renders each state with explicit user-facing copy:
  - `verdict` → verdict card on canvas + assistant message in chat
  - `clarify` → assistant message in chat showing the model's clarifying question; canvas stays empty (no verdict card render)
  - `no-evidence` → "No relevant sources found across arXiv, Semantic Scholar, or protocols.io. Refine your hypothesis or try a different framing." Rendered as an info card on canvas (warm-neutral border, no verdict label) + matching chat message.
  - `error` → "Lit-QC service hit a hiccup — retry?" with a retry button on the chat message. `retryable: false` errors (e.g., Tavily 401 / quota exceeded) hide the retry button and show "Service unavailable — check API keys."
- **D-49:** **No silent fallback to a verdict label on failure.** If Gemini returns malformed output that fails Zod validation, the route logs and returns `error` with `retryable: true`. Honors CLAUDE.md hard rule #1 (no claim without verifiable URL citation).

### Caching

- **D-50:** **Per-session in-memory cache only.** Module-level `Map<string, QCResponse>` in the route file (or a sibling `src/lib/qc/cache.ts`) keyed by `crypto.subtle.digest('SHA-256', hypothesis.trim().toLowerCase())`. TTL: process lifetime (Vercel serverless cold-start clears it — acceptable; judges won't re-submit at scale). Zero git pollution.
- **D-51:** **No JSON file cache.** Simpler and avoids polluting commits with `.cache/` artifacts. Re-runs of the same hypothesis hit memory; cold-start re-runs burn one Tavily call — fine.

### Latency budget

- **D-52:** **Internal budget: <8s end-to-end** (chat submit → verdict card painted), against a roadmap success criterion of <10s. Implied component budgets:
  - Tavily: ~1.5s (advanced search, max_results=10)
  - Gemini Flash-Lite (streamObject): ~2-3s for first verdict tokens
  - Serialization + render: ~1s
- **D-53:** **Fallback ladder if budget trips during build/test:** swap `gemini-3.1-flash-lite-preview` → `gemini-2.5-flash-lite` (same env key, faster GA model). Documented in `.planning/phases/01-foundation/01-CONTEXT.md` D-22 as the standing fallback. No code change needed — only the model ID string in `src/lib/qc/route.ts` (or a centralized `src/lib/models.ts`).

### Claude's Discretion

- File layout under `src/lib/qc/` is suggested but not locked — planner may consolidate `prompt.ts` and `schema.ts` into a single file if it reads cleaner.
- Exact prompt wording for the QC scorer is Claude's call. Constraints: enforce the conservative-thresholds language from D-35, the citation-only-from-input rule from D-34/D-37, and the at-most-one-clarification trigger from D-47. Iterate against the 4 sample hypotheses during execution.
- Card border colors and exact spacing are Claude's call within the design tokens. Stay token-correct.
- Zod schema field names may be tightened (e.g., `verdict_label` vs `verdict`) — keep TypeScript types exported for the client.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before planning or implementing.**

### Project guardrails
- `CLAUDE.md` §"Hard rules" — hard rule #1 (no claim without verifiable URL citation), hard rule #2 (4 chips verbatim), hard rule #4 (TS only), hard rule #5 (no new deps without justification), hard rule #6 (no DB).
- `~/.claude/CLAUDE.md` §4.7 (verify before recommending) and §4.10 (branch/scope discipline).

### Roadmap & requirements
- `.planning/ROADMAP.md` §"Phase 2: Literature QC" — goal + 4 success criteria.
- `.planning/REQUIREMENTS.md` §"Input" + §"Literature QC" — REQ IDs INPUT-01, INPUT-02, INPUT-03 (chips already shipped in Phase 1), LITQC-01, LITQC-02, LITQC-03, LITQC-04.

### Prior phase decisions
- `.planning/phases/01-foundation/01-CONTEXT.md` D-22a..D-22e — brain-model strategy (Google provider, model IDs, fallback ladder).
- `.planning/phases/01-foundation/01-CONTEXT.md` D-26a..D-26c — route topology (`/` landing, `/app` dashboard).
- `.planning/phases/01-foundation/01-CONTEXT.md` D-20 — Zod env loader pattern (`src/lib/env.ts`); never read `process.env` directly.
- `.planning/phases/01-foundation/01-02-SUMMARY.md` — what shipped (3-column shell, chat textarea inert, sonner Toaster mounted in root layout, ScrollArea on chat history).

### Vendor docs
- Tavily API: https://docs.tavily.com/welcome — search endpoint contract, auth header (`Authorization: Bearer <key>`), response shape (`results[].title`, `.url`, `.content`, `.score`), `search_depth` and `include_domains` semantics.
- Vercel AI SDK + Google provider: https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai — `@ai-sdk/google` package, `generateObject` / `streamObject` with Zod schemas, model ID strings (`google('gemini-3.1-flash-lite-preview')`).
- Vercel AI SDK `useObject` hook: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-object — client-side consumption of `streamObject` SSE responses.

### Design tokens
- `CLAUDE_DESIGN_BRIEF.md` — palette (forest, clay, paper, ink, muted, border), typography (`font-display` Inter Tight / `font-sans` Inter / `font-mono` Geist Mono), `shadow-doc`, radius (cards 6px, buttons 4px, badges 999px). Verdict card and citation cards must inherit these tokens — no new colors.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/env.ts` — Zod-validated env singleton; reads `GOOGLE_GENERATIVE_AI_API_KEY` and `TAVILY_API_KEY`. Use this everywhere; never touch `process.env` directly.
- `src/lib/example-hypotheses.ts` — 4 chip placeholders. Phase 2 must NOT change the file's shape (the dashboard imports it). User replaces values verbatim before first run.
- `src/components/ui/textarea.tsx`, `button.tsx`, `scroll-area.tsx`, `sonner.tsx` — shadcn/ui components from Phase 1. Reuse for the chat input, send arrow, chat history scroll, and error toasts.
- `src/app/app/page.tsx` — three-column dashboard shell. Phase 2 wires the chat panel's textarea to a submit handler that calls `/api/qc`, and adds a verdict card slot at the top of the canvas column.
- `app/layout.tsx` — Sonner `<Toaster />` already mounted at root; toast(...) works from any client component.

### Established Patterns
- **Light-mode only.** No `.dark` selectors, no `prefers-color-scheme`. All Phase 2 UI inherits forest / clay / paper tokens directly.
- **Server-component shells, client-component leaves.** The dashboard route is a Server Component; only the chat input + verdict card need `"use client"`.
- **Env access pattern:** `import { env } from "@/lib/env"` in any server-side code; never read raw env vars.
- **Health-check exposes booleans only**, never key values (T-01-06 rule from Phase 1). Apply the same rule to any debug/diagnostic output in Phase 2.

### Integration Points
- The chat textarea on `/app` (currently inert) gets a submit handler that POSTs to `/api/qc`. Submit triggers on Enter (without Shift) or arrow-button click. Chip click already populates the textarea (Phase 1); Phase 2 only needs to add the submit hook.
- A new `<VerdictCard />` slot at the top of the canvas column. Slot is empty when no QC has run; renders streaming verdict during a request; persists last verdict across re-renders (until next submission).
- `<ChatThread />` component (new) replaces the empty chat panel scroll area. Stores `{role: "user" | "assistant", content, verdictBadge?}[]` in component state for the session.
- Toaster (already mounted) handles `error.retryable: false` cases with a "Service unavailable" toast.

</code_context>

<specifics>
## Specific Ideas

- Verdict card border-color signaling: forest for `not-found`, warm-neutral for `similar-work-exists`, clay/rust for `exact-match-found`. Token-correct, immediately legible.
- Source-domain badges differ in tint (arXiv forest, Semantic Scholar ink, protocols.io clay) — not just text. Skimmable at a glance.
- Chat thread message reads as a real assistant turn (verdict badge + 1-sentence reasoning + "See sources →" link), not a generic "complete" status. The chat panel should feel like a conversation, not a status log.
- The first-run experience is: click a chip → textarea fills → press arrow → see "Searching literature…" status flash → verdict card streams field-by-field into the canvas → 3 citations populate. Whole thing in <8s. Judges should feel the streaming.

</specifics>

<deferred>
## Deferred Ideas

- **Tavily-Anthropic source-grounded model.** Out of scope; we're on Gemini per D-22.
- **Embedding-based novelty scoring.** Out of scope; Tavily + Gemini judge is sufficient and aligns with the Tavily-only stack.
- **Verdict result-set visualization (e.g., "found N papers, 3 most relevant shown").** Could be a Phase 8 polish. For now the 3 citations are enough.
- **Multi-turn chat refinement / follow-up questions on the same hypothesis.** Phase 2 supports the at-most-one clarification flow; richer multi-turn (`/refine`, threaded conversation) is a Phase 8+ idea, not v1 scope.
- **Persisting QC history across sessions.** Per-session memory is enough for the demo. Persistence into the lab profile would be a Phase 7 extension.
- **Tavily retry / exponential backoff.** Out of scope for 24h MVP. v1 surfaces the error and lets the user retry manually.

</deferred>

---

*Phase: 02-literature-qc*
*Context gathered: 2026-04-25*
