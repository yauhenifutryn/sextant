# Phase 02: Literature QC — Pattern Map

**Mapped:** 2026-04-26
**Files analyzed:** 10 (8 new, 2 modified)
**Analogs found:** 8 / 10 (2 files have no in-repo analog yet — flagged below)

## Directory Convention (read first)

The project uses `src/app/...`, not top-level `app/`. The `app/` directory does not exist.

- API routes: `src/app/api/<name>/route.ts` (analog: `src/app/api/health/route.ts`)
- Pages: `src/app/<route>/page.tsx`
- Root layout: `src/app/layout.tsx` (already mounts `<Toaster />`)
- Components: `src/components/<feature>/...` (e.g. `src/components/qc/...`)
- Server libraries: `src/lib/...`

The AI-SPEC §3 sketch ("`app/api/qc/route.ts`") is shorthand. Materialize at `src/app/api/qc/route.ts` to match the existing health route. Do NOT create a new top-level `app/` directory — it would split the App Router and break the build.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/lib/tavily.ts` | library client | request-response (REST) | `src/lib/env.ts` (server-only typed module) | role-match (no existing fetch client) |
| `src/lib/qc/schema.ts` | Zod schema | transform | `src/lib/env.ts` (Zod schema authoring) | role-match |
| `src/lib/qc/prompt.ts` | prompt template | transform | `src/lib/example-hypotheses.ts` (typed library module) | role-match |
| `src/lib/qc/cache.ts` | utility (in-memory store) | CRUD | none in repo (first stateful module) | NO ANALOG — see §No Analog Found |
| `src/lib/qc/provenance.ts` | utility (validator) | transform | `src/lib/utils.ts` (pure helper export) | role-match |
| `src/app/api/qc/route.ts` | route handler | streaming (SSE via AI SDK text-stream) | `src/app/api/health/route.ts` (App Router route) | role-match (handler shape only — no streaming analog) |
| `src/components/qc/use-qc.ts` | client hook | streaming consumer | none in repo (first hook) | NO ANALOG — see §No Analog Found |
| `src/components/qc/verdict-card.tsx` | React client component | event-driven render | `src/components/plan-canvas.tsx` (canvas-column client component) | role-match |
| `src/components/qc/citation-card.tsx` | React client component | render-only | `src/components/example-chips.tsx` (list-of-cards client component) | role-match |
| `src/components/qc/chat-thread.tsx` | React client component | event-driven render | `src/components/chat-panel.tsx` (chat-column client component) | exact (same column, replaces empty `<ScrollArea />`) |
| `src/components/chat-panel.tsx` (MODIFY) | React client component | event-driven | self (Phase 1 baseline) | self — extend, do not rewrite |
| `src/app/app/page.tsx` (MODIFY) | client page shell | composition | self (Phase 1 baseline) | self — slot new components |
| `package.json` (MODIFY) | config | n/a | self | self — Edit, never replace |

## Pattern Assignments

### `src/lib/tavily.ts` (NEW — library client, request-response)

**Closest analog:** `src/lib/env.ts` (server-only typed module that reads env). No existing fetch client in the repo, so the env-access pattern is the load-bearing borrow.

**Env access pattern** (from `src/lib/env.ts:13-20`):

```ts
const Env = z.object({
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
  TAVILY_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
});

export const env = Env.parse(process.env);
export type Env = z.infer<typeof Env>;
```

**Apply to `tavily.ts`:**

- Import via `import { env } from "@/lib/env"` — never `process.env.TAVILY_API_KEY`. This rule is repeated in CLAUDE.md project hard rules and CONTEXT.md D-33 / "Established Patterns".
- Export a single typed function `tavilySearch(query: string): Promise<TavilyResult[]>` (D-33).
- Body verbatim from AI-SPEC §4 "Tool Use" (lines 411-444): `POST https://api.tavily.com/search` with `Authorization: Bearer ${env.TAVILY_API_KEY}`, `search_depth: "advanced"`, `max_results: 10`, `include_answer: false`, `include_raw_content: false`, `topic: "general"`, `signal: AbortSignal.timeout(4000)`.
- Throw on non-OK; the caller (route) catches and converts to the `error` discriminant (D-48).
- No retry logic in v1 (D-33).

**Type export pattern** (from `src/lib/example-hypotheses.ts:15`):

```ts
export type ExampleHypothesis = Readonly<Record<"id" | "text", string>>;
```

→ Export `TavilyResult` as a plain `type` so it can be imported by the prompt module without dragging in the fetch implementation.

---

### `src/lib/qc/schema.ts` (NEW — Zod schema, transform)

**Closest analog:** `src/lib/env.ts` (only existing Zod schema in the repo).

**Pattern to copy** (from `src/lib/env.ts:13-20`): single-file Zod schema, top-level `const`, type inferred via `z.infer`, no runtime side effects beyond `parse()`.

**Apply to `schema.ts`:** the discriminated union from AI-SPEC §4 lines 369-403 (matches CONTEXT.md D-40 verbatim). Two exports:

```ts
export const qcResponseSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal("verdict"), verdict: z.enum(["not-found","similar-work-exists","exact-match-found"]), reasoning: z.string().min(1).max(600), citations: z.array(citationSchema).min(2).max(3) }),
  z.object({ ok: z.literal("clarify"), clarify_question: z.string().min(1).max(280) }),
  z.object({ ok: z.literal("no-evidence"), message: z.string().min(1) }),
  z.object({ ok: z.literal("error"), message: z.string().min(1), retryable: z.boolean() }),
]);

export type QCResponse = z.infer<typeof qcResponseSchema>;
```

`zod ^4.3.6` is already in `package.json:26`. Do NOT import from `zod/v3` or pin a different version — the env loader already consumes the project's pinned zod.

**Key constraint from D-36:** `citations.min(2).max(3)`. Floor=2 (LITQC-03), ceiling=3 (rendering ceiling).

**Verdict literal naming:** the spec uses kebab-case `not-found` / `similar-work-exists` / `exact-match-found`. Keep kebab-case literals exact — they are the wire contract between server and client.

---

### `src/lib/qc/prompt.ts` (NEW — prompt template, transform)

**Closest analog:** `src/lib/example-hypotheses.ts` (a typed library module that exports stable string constants and a builder-friendly shape).

**Pattern to copy** (from `src/lib/example-hypotheses.ts:15-34`): file-level JSDoc that documents the constraints, `export const` for the static prompt, named function for the dynamic prompt, no runtime initialization beyond const declarations.

**Apply to `prompt.ts`:** verbatim from AI-SPEC §4b lines 604-633. Two exports:

```ts
import type { TavilyResult } from "@/lib/tavily";

export const qcSystemPrompt = `You are a literature QC scorer ...`;

export function qcUserPrompt(hypothesis: string, results: TavilyResult[]): string {
  const evidence = results
    .map((r, i) => `[${i + 1}] ${r.title}\n    URL: ${r.url}\n    Excerpt: ${r.content}`)
    .join("\n\n");
  return `HYPOTHESIS:\n${hypothesis}\n\nEVIDENCE BLOCK (${results.length} results):\n${evidence}`;
}
```

**Lock-in language (from CONTEXT.md D-34, D-35, D-37, D-46, D-47):** the system prompt must encode (a) "bias toward similar-work-exists when uncertain", (b) "citations[].url MUST be one of the URLs in the evidence block", (c) "one clarification only", (d) `citations` count is exactly 2 or 3. Wording is Claude's discretion within those constraints.

**Hypothesis goes in `prompt`, NEVER `system`** (AI-SPEC §4 "Context Window Strategy" line 496). System prompt stays stable for Google's implicit prefix-caching.

---

### `src/lib/qc/cache.ts` (NEW — in-memory store, CRUD)

**No close analog in the codebase.** This is the first module-level stateful module in the repo. Use AI-SPEC §4 "State Management" (lines 453-475) as the source of truth.

**Pattern (verbatim from AI-SPEC):**

```ts
import type { QCResponse } from "./schema";

const cache = new Map<string, QCResponse>();

export async function hashHypothesis(input: string): Promise<string> {
  const normalized = input.trim().toLowerCase();
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function getCached(key: string): QCResponse | undefined { return cache.get(key); }
export function setCached(key: string, value: QCResponse): void { cache.set(key, value); }
```

**Constraints from D-50/D-51 + CLAUDE.md hard rule #6:**

- Per-process Map, no DB, no `.cache/` JSON files (they would pollute git).
- Cleared on Vercel cold-start — acceptable.
- Module is server-only (depends on `crypto.subtle` via Node 20). Do not import from a client component.
- Key = SHA-256 over `input.trim().toLowerCase()`. Do not normalize further (case-folding is enough for the demo).

---

### `src/lib/qc/provenance.ts` (NEW — utility validator, transform)

**Closest analog:** `src/lib/utils.ts` (pure helper export, no runtime state).

**Pattern to copy** (from `src/lib/utils.ts:8-10`): file-level JSDoc explaining purpose, single named export, pure function (no I/O, no globals).

**Apply to `provenance.ts`:** implements D-37 (anti-confabulation guard).

```ts
import type { QCResponse } from "./schema";
import type { TavilyResult } from "@/lib/tavily";

export function validateCitationProvenance(
  response: QCResponse,
  tavilyResults: TavilyResult[],
): QCResponse {
  if (response.ok !== "verdict") return response;
  const allowedUrls = new Set(tavilyResults.map((r) => r.url));
  const valid = response.citations.filter((c) => allowedUrls.has(c.url));
  if (valid.length < 2) {
    return { ok: "no-evidence", message: "No verifiable sources after provenance check." };
  }
  return { ...response, citations: valid as typeof response.citations };
}
```

**Honors CLAUDE.md hard rule #1** (no claim without verifiable URL citation): the schema cannot enforce URL provenance — only this post-stream check can. AI-SPEC §3 "Common Pitfalls" #6 is explicit about this.

---

### `src/app/api/qc/route.ts` (NEW — route handler, streaming)

**Closest analog:** `src/app/api/health/route.ts` (the only existing App Router route).

**Imports + env pattern** (from `src/app/api/health/route.ts:1-3`):

```ts
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
```

**Apply to `route.ts`:** same `import { env } from "@/lib/env"` line for any direct env need (the `google()` provider auto-reads `GOOGLE_GENERATIVE_AI_API_KEY` so the route itself only needs env if it touches Tavily directly — it doesn't, `tavilySearch` does). Add the AI SDK imports per AI-SPEC §3 lines 158-171:

```ts
import { streamObject } from "ai";
import { google } from "@ai-sdk/google";
import { qcResponseSchema, type QCResponse } from "@/lib/qc/schema";
import { qcSystemPrompt, qcUserPrompt } from "@/lib/qc/prompt";
import { tavilySearch } from "@/lib/tavily";
import { hashHypothesis, getCached, setCached } from "@/lib/qc/cache";
import { validateCitationProvenance } from "@/lib/qc/provenance";
```

**Handler signature pattern** (from `src/app/api/health/route.ts:11-15`):

```ts
export async function GET() {
  const tavily = !!env.TAVILY_API_KEY;
  const gemini = !!env.GOOGLE_GENERATIVE_AI_API_KEY;
  return NextResponse.json({ tavily, gemini, ok: tavily && gemini });
}
```

→ The QC route is `POST` instead of `GET`, parses `req.json()`, and returns `result.toTextStreamResponse()` instead of `NextResponse.json(...)`. The cache hit path returns plain JSON via `Response.json(cached)` (matches the health route's JSON shape).

**Core pattern:** copy the full body verbatim from AI-SPEC §4 "Core Pattern" (lines 311-365). Key elements:

- `export const runtime = "nodejs"` (required for `crypto.subtle` in `cache.ts` and for full `AbortSignal.timeout` per AI-SPEC §3 Pitfall #7).
- `export const maxDuration = 30`.
- Cache short-circuit via `getCached(key)` BEFORE the Tavily call (D-50).
- Tavily wrapped in `try/catch` → returns `{ ok: "error", retryable: false }` (D-48).
- `streamObject` with the schema + system + user prompts + `temperature: 0.2`, `maxTokens: 800`.
- `onFinish` runs `validateCitationProvenance` and stores in cache; never silently substitutes a verdict (D-49).
- `result.toTextStreamResponse()` — NOT `toUIMessageStreamResponse()` (AI-SPEC §3 Pitfall #5: `useObject` only decodes the text-stream variant; using the wrong helper hangs the client on `isLoading: true`).

**Health-check secrecy rule (T-01-06):** never log the env values themselves; only booleans. Same rule applies to any debug output added during development.

---

### `src/components/qc/use-qc.ts` (NEW — client hook, streaming consumer)

**No close analog in the codebase.** Pattern source is AI-SPEC §3 lines 213-230.

**Pattern (verbatim):**

```tsx
"use client";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { qcResponseSchema } from "@/lib/qc/schema";

export function useQc() {
  return useObject({
    api: "/api/qc",
    schema: qcResponseSchema,
    onError: (err) => console.error("[qc] fetch error", err),
    onFinish: ({ object, error }) => {
      if (error) console.error("[qc] schema validation error", error);
    },
  });
}
```

**Critical constraint (AI-SPEC §3 Pitfall #3):** the export is `experimental_useObject`. Aliasing to `useObject` is required — importing `useObject` directly compiles but resolves to `undefined` at runtime, and the chat panel will silently no-op on submit.

**Discriminated-union narrowing guard (AI-SPEC §3 Pitfall #4):** consumers must guard with `if (!object?.ok) return null` before narrowing on `object.ok`, because Gemini may emit early chunks before the `ok` field is set.

---

### `src/components/qc/verdict-card.tsx` (NEW — client component, event-driven render)

**Closest analog:** `src/components/plan-canvas.tsx` (the client component that currently owns the canvas column).

**Imports + shell pattern** (from `src/components/plan-canvas.tsx:1-19`):

```tsx
"use client";

import { ExampleChips } from "@/components/example-chips";

type Props = {
  onChipPick: (text: string) => void;
};

export function PlanCanvas({ onChipPick }: Props) {
  return (
    <section
      className="flex flex-col items-center justify-center p-12 bg-paper"
      aria-label="Plan canvas"
    >
      <div className="max-w-xl text-center flex flex-col items-center gap-8">
        <h2 className="font-display text-3xl font-medium tracking-tight text-ink leading-tight">
          ...
        </h2>
        ...
      </div>
    </section>
  );
}
```

**Apply to `verdict-card.tsx`:**

- `"use client"` directive on line 1.
- Typed `Props` (DeepPartial verdict from `useObject`, optional final settled value).
- `<section>` wrapper, `aria-label`, design-token-only classes.
- `font-display` for the verdict label, `font-sans` for reasoning (per CLAUDE_DESIGN_BRIEF + CONTEXT.md D-41).
- Border-color signaling per D-41:
  - `not-found` → forest accent (`border-forest`)
  - `similar-work-exists` → warm-neutral (`border-borderwarm`)
  - `exact-match-found` → clay/rust accent (use clay token from the design brief)
- Stack 3 `<CitationCard />` children below the verdict + reasoning.

**Narrowing guard (mandatory, AI-SPEC Pitfall #4):**

```tsx
if (!object?.ok) return <SkeletonVerdict />; // or null during the very first chunks
if (object.ok !== "verdict") return null; // clarify/no-evidence/error are rendered elsewhere
// now object is narrowed to the verdict branch
```

---

### `src/components/qc/citation-card.tsx` (NEW — client component, render-only)

**Closest analog:** `src/components/example-chips.tsx` (a list-item client component using shadcn/ui + Lucide + design tokens).

**Imports pattern** (from `src/components/example-chips.tsx:1-5`):

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { EXAMPLE_HYPOTHESES } from "@/lib/example-hypotheses";
import { cn } from "@/lib/utils";
```

**Style pattern** (from `src/components/example-chips.tsx:33-37`):

```tsx
className="rounded-full border-borderwarm bg-surface hover:bg-surface-hover font-sans text-sm text-ink h-auto px-3 py-1 whitespace-normal text-left focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
```

**Apply to `citation-card.tsx`:** per CONTEXT.md D-43:

- `font-display` truncate-1-line title (font-weight 500).
- Source-domain badge (rounded-full, tinted by domain): `arxiv` → forest-tinted, `semantic-scholar` → ink-tinted, `protocols-io` → clay-tinted.
- 1-line excerpt in `font-sans text-sm text-muted-foreground`.
- `Lucide ExternalLink` top-right (use the same import pattern as `chat-panel.tsx:3`: `import { ExternalLink } from "lucide-react"`).
- Whole card is a clickable `<a>` with `target="_blank"` and `rel="noopener noreferrer"`.
- Use the `cn(...)` helper for the domain-tint conditional.

---

### `src/components/qc/chat-thread.tsx` (NEW — client component, event-driven render)

**Closest analog:** `src/components/chat-panel.tsx` (this component will replace its empty `<ScrollArea />` body).

**Wrapper + scroll pattern** (from `src/components/chat-panel.tsx:24-32`):

```tsx
"use client";

import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

// ...
<section
  className="flex flex-col border-r border-borderwarm bg-paper"
  aria-label="Chat"
>
  <ScrollArea className="flex-1" />
  ...
```

**Apply to `chat-thread.tsx`:**

- `"use client"` directive.
- Render INSIDE the existing `<ScrollArea className="flex-1">` — do NOT introduce a second scroll container.
- `useState<{role: "user" | "assistant", content: string, verdictBadge?: VerdictLabel, sourcesAnchor?: boolean}[]>` lives here (AI-SPEC §4 "State Management" point 1, line 479).
- Each assistant turn renders: small verdict badge + first sentence of reasoning + "See sources →" anchor that focuses `<VerdictCard />` (D-42). For the anchor, scroll the parent canvas column, e.g. `document.getElementById("verdict-card")?.scrollIntoView({ behavior: "smooth" })`.
- Conversation history persists in component state for the session; never persisted to disk (D-50, hard rule #6).

---

### `src/components/chat-panel.tsx` (MODIFY — extend, don't rewrite)

**Self-analog:** the Phase 1 component at `src/components/chat-panel.tsx`. Extend it, do not Write a fresh version.

**Existing structure to preserve:**

- `"use client"` directive (line 1).
- `Props = { value: string; onChange: (text: string) => void }` (lines 10-13). Phase 2 adds an `onSubmit` (or hooks `useQc()` directly inside this component).
- The `<ScrollArea className="flex-1" />` (line 30) becomes the host for `<ChatThread />`.
- The `<Textarea />` block (lines 34-41) stays; add `onKeyDown` for Enter-without-Shift submit (D-44).
- The `<Button disabled />` (lines 42-51) loses `disabled`, gains the submit handler. Keep `variant="ghost" size="icon"` and the `<ArrowUp size={18} strokeWidth={1.5} />` child intact.

**Submission pattern (from CONTEXT.md D-44 + AI-SPEC §3 client section):**

```tsx
const { object, submit, isLoading, error } = useQc(); // from @/components/qc/use-qc

const handleSubmit = () => {
  if (!value.trim() || isLoading) return;
  submit({ hypothesis: value.trim() });
  // append user turn to chat-thread state
};
```

Enter-without-Shift submits (D-44 says chip clicks populate the textarea + auto-focus the send arrow but do NOT auto-submit — keep manual submission).

**Toaster pattern (already mounted at root, `src/app/layout.tsx:41`):** `import { toast } from "sonner"` then `toast.error("Service unavailable — check API keys.")` for `retryable: false` errors (D-48). The Toaster icons are already configured in `src/components/ui/sonner.tsx:22-28`.

---

### `src/app/app/page.tsx` (MODIFY — slot new components)

**Self-analog:** the Phase 1 page. Already a `"use client"` Dashboard owning a single `useState("")` draft.

**Existing structure to preserve** (from `src/app/app/page.tsx:20-32`): three-column grid `32fr / 50fr / 18fr`, `<ChatPanel value={draft} onChange={setDraft} />`, `<PlanCanvas onChipPick={setDraft} />`, `<TraceRail />`.

**Phase 2 changes:**

- Lift verdict state to this Dashboard so a second submission replaces the canvas verdict but appends to the chat thread (D-42).
- Pass the verdict (or the `useQc()` `object`) down to `<PlanCanvas>` so it renders `<VerdictCard />` at the top of the canvas column above the existing hero (which fades / disappears when a verdict is present, per D-41 "pinned at top").
- Pass the same to `<ChatPanel>` so `<ChatThread>` can render the assistant turn.
- Alternative: move `useQc()` into `<ChatPanel>` and lift the resulting `object` upward via a callback. Either is fine — Claude's discretion within CONTEXT.md.

**Do NOT** introduce a new top-level state management lib (Zustand, Jotai, etc.) — CLAUDE.md hard rule #5 (no new deps without justification). React `useState` is sufficient for the demo.

---

### `package.json` (MODIFY — Edit, never replace)

**Pattern from `~/.claude/CLAUDE.md` §4.11 (Configuration File Safety):** use the Edit tool to add specific entries to `dependencies`. Never call Write with a reconstructed full file — that would destroy the existing 27 dependency lines.

**Add (per AI-SPEC §3 Installation, line 151):**

```json
"@ai-sdk/google": "^1",
"@ai-sdk/react": "^1",
"ai": "^4"
```

Pin major version 4 of `ai` deliberately — AI-SPEC §3 Pitfall #1 explains v6 deprecates `streamObject`. Do NOT run `pnpm up ai` blindly.

**Existing deps to leave alone:** `zod ^4.3.6` (line 26) is reused by both env loader and QC schema. `lucide-react ^1.11.0` (line 19) provides `ExternalLink` for citation cards.

## Shared Patterns

### Env Access (mandatory across every server file)

**Source:** `src/lib/env.ts:13-20`
**Apply to:** `src/lib/tavily.ts`, `src/app/api/qc/route.ts`, and any future server module touching API keys.

```ts
import { env } from "@/lib/env";
// ...
Authorization: `Bearer ${env.TAVILY_API_KEY}`
```

Never `process.env.X`. CLAUDE.md project hard rules + CONTEXT.md "Established Patterns" + D-20.

### Server Component / Client Component Boundary

**Source:** existing project convention (root layout server, dashboard page client, ui components per their own directives).

| File | Directive | Rationale |
|---|---|---|
| `src/app/layout.tsx` | server (no directive) | Mounts fonts + Toaster. |
| `src/app/app/layout.tsx` | server | Mounts HeaderBar. |
| `src/app/app/page.tsx` | `"use client"` | Owns draft + verdict state. |
| `src/app/api/qc/route.ts` | server only | App Router route handler — no directive. |
| `src/lib/**/*.ts` | server only | Reads env, runs `crypto.subtle`. Never import from a client component without checking. |
| `src/components/qc/*.tsx` | `"use client"` | Render dynamic verdict + chat state, call `useQc`. |
| `src/components/qc/use-qc.ts` | `"use client"` | Wraps `experimental_useObject`. |

CONTEXT.md "Established Patterns": "Server-component shells, client-component leaves."

### Design Tokens (light-mode only)

**Source:** `CLAUDE_DESIGN_BRIEF.md` + existing usage in `src/components/example-chips.tsx`, `src/components/header-bar.tsx`, `src/components/chat-panel.tsx`.

| Token | Existing usage | Phase 2 application |
|---|---|---|
| `bg-paper` | `chat-panel.tsx:27`, `header-bar.tsx:16` | Verdict card background. |
| `border-borderwarm` | `chat-panel.tsx:27,31,33`, `header-bar.tsx:16` | Default verdict + citation card borders. |
| `text-ink` | `chat-panel.tsx:40`, `header-bar.tsx:17` | Verdict label, citation title. |
| `text-muted-foreground` | `chat-panel.tsx:48`, `header-bar.tsx:18` | Reasoning, citation excerpt. |
| `font-display` | `header-bar.tsx:17`, `plan-canvas.tsx:26` | Verdict label, citation title (D-41, D-43). |
| `font-sans` | `chat-panel.tsx:40` | Reasoning, excerpt body. |
| `font-mono` | `header-bar.tsx:18,22`, `trace-rail.tsx:14` | Domain-badge text (optional — D-43 doesn't lock it). |
| `focus-visible:ring-forest` | `example-chips.tsx:34`, `header-bar.tsx:28,33` | Focus ring on send arrow + citation cards. |

NO new colors. NO `.dark` selectors. NO `prefers-color-scheme`. CONTEXT.md "Established Patterns" + project guardrails.

### Error Handling (discriminated-union flow)

**Source:** AI-SPEC §4 "Core Pattern" (route) + CONTEXT.md D-48.
**Apply to:** the route, `useQc`, `<ChatThread>`, `<VerdictCard>`.

| State | Where rendered | Copy |
|---|---|---|
| `verdict` | `<VerdictCard>` on canvas + assistant message in chat | model output |
| `clarify` | assistant message in chat; canvas stays empty | model's `clarify_question` verbatim |
| `no-evidence` | info card on canvas (warm-neutral border, no verdict label) + chat message | "No relevant sources found across arXiv, Semantic Scholar, or protocols.io. Refine your hypothesis or try a different framing." |
| `error` (`retryable: true`) | chat message with retry button | "Lit-QC service hit a hiccup — retry?" |
| `error` (`retryable: false`) | toast + chat message, no retry button | "Service unavailable — check API keys." |

`retryable: false` cases use Sonner's `toast.error(...)`; the Toaster is already mounted (`src/app/layout.tsx:41`) and configured with the `OctagonX` icon for `error` (`src/components/ui/sonner.tsx:26`).

CLAUDE.md project hard rule #1 reinforced by D-49: never silently fall back to a verdict label on validation failure.

### Lucide Icon Imports

**Source:** `src/components/chat-panel.tsx:3` (`import { ArrowUp } from "lucide-react"`), `src/components/header-bar.tsx:1` (`import { Settings } from "lucide-react"`).

**Apply to `citation-card.tsx`:** `import { ExternalLink } from "lucide-react"` for the top-right link icon. Use `size={...} strokeWidth={1.5}` to match the project's existing icon style (chat-panel uses `size={18} strokeWidth={1.5}`).

### shadcn/ui Component Imports

**Source:** `src/components/chat-panel.tsx:5-7`.

```tsx
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
```

**Apply to** any QC component needing a button (retry, send) — reuse `Button` with `variant="ghost" | "outline"` and `size="icon" | "sm"`. Do NOT install new shadcn primitives unless a real need surfaces; if so, add via the existing pattern (subdir at `src/components/ui/`).

## No Analog Found

| File | Role | Reason | Source for pattern |
|---|---|---|---|
| `src/lib/qc/cache.ts` | in-memory store | First stateful module-level store in the repo. No prior `Map`-backed cache exists. | AI-SPEC §4 "State Management" lines 453-475 (verbatim). |
| `src/components/qc/use-qc.ts` | client hook wrapping `experimental_useObject` | First custom React hook in the repo. No `useFoo` pattern exists yet. | AI-SPEC §3 lines 213-230 (verbatim). |

The route file (`src/app/api/qc/route.ts`) has a partial analog (`src/app/api/health/route.ts`) for the App Router shape and env import, but the `streamObject` / `toTextStreamResponse()` streaming body has no in-repo precedent — borrow from AI-SPEC §4 "Core Pattern" lines 311-365.

## Metadata

**Analog search scope:** `src/lib/`, `src/components/`, `src/app/`, `src/components/ui/`.
**Files scanned (read in full):** 12 (env.ts, route.ts (health), page.tsx (app), example-hypotheses.ts, layout.tsx (root + app), chat-panel.tsx, plan-canvas.tsx, example-chips.tsx, button.tsx, textarea.tsx, scroll-area.tsx, sonner.tsx, header-bar.tsx, trace-rail.tsx, utils.ts, package.json).
**AI-SPEC sections cited:** §3 "Framework Quick Reference" (entry point, key abstractions, pitfalls, project structure), §4 "Implementation Guidance" (model config, core pattern, tool use, state management, context window), §4b "Prompt Engineering Discipline".
**Pattern extraction date:** 2026-04-26.
