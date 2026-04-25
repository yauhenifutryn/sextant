# Phase 1: Foundation - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the **deployable, themed app shell** — nothing more.

What ships in Phase 1:
- Next.js 15 App Router + TypeScript scaffold via `create-next-app`
- Tailwind + shadcn/ui initialized with design tokens from `CLAUDE_DESIGN_BRIEF.md`
- Three-column layout shell (Chat 32% / Plan canvas 50% / Trace rail 18%) — empty containers, no real content
- Empty-state hero on the canvas with the four Fulcrum-brief example hypothesis chips, keyboard reachable
- `lib/env.ts` Zod-validated env loader for `ANTHROPIC_API_KEY` and `TAVILY_API_KEY`
- `/api/health` route returning `{ tavily: bool, anthropic: bool, ok: bool }`
- GitHub repo connected to Vercel project; push to `main` deploys in <60s
- Public Vercel URL reachable

What does NOT ship in Phase 1 (deferred to later phases):
- Plan canvas tab content (Phase 4)
- Agent trace rail rows / shimmer animations (Phase 6)
- Chat input wiring to any LLM (Phase 2)
- Citation chips / tooltips (Phase 5)
- Lab profile drawer / correction popover (Phase 7)

</domain>

<decisions>
## Implementation Decisions

### Repo Scaffold

- **D-01:** Use `npx create-next-app@latest hack_nation_5 --ts --tailwind --eslint --app --src-dir --import-alias "@/*"` and overwrite into the current repo (preserve `.git`, `.planning/`, `CLAUDE.md`, `CLAUDE_DESIGN_BRIEF.md`, `.gitignore`).
- **D-02:** Single language: TypeScript only. No Python services, no co-runtimes.
- **D-03:** Node 20 pinned via `.nvmrc` and `engines` in `package.json`.
- **D-04:** Package manager: npm (default from `create-next-app`). No pnpm/yarn switch — saves zero time, costs us troubleshooting risk.

### Design Token Wiring (Decision 1 — option c)

- **D-05:** Use shadcn/ui's standard CSS-variable convention. After `npx shadcn@latest init`, the generated `app/globals.css` exposes `--background`, `--foreground`, `--primary`, `--muted`, etc. We override these in `:root` to match the brief.
- **D-06:** Translate brief hex values to HSL once and place under `:root` in `app/globals.css`:
  - `--background: 60 14% 97%;` /* #FAFAF7 warm off-white */
  - `--foreground: 0 0% 10%;`    /* #1A1A1A ink */
  - `--primary: 158 67% 18%;`    /* #0F4C3A forest green */
  - `--secondary: 18 53% 47%;`   /* #B85C38 clay/rust — used sparingly */
  - `--muted: 60 5% 35%;`        /* #5A5A52 muted text */
  - `--border: 49 14% 87%;`      /* #E2E0D8 */
  - `--accent-citation: 222 71% 42%;` /* #1F4FB6 link blue */
  - `--success: 142 76% 30%;`    /* #15803D pass */
  - `--destructive: 0 75% 42%;`  /* #B91C1C fail */
  - `--warning: 41 88% 38%;`     /* #A16207 caution */
- **D-07:** In `tailwind.config.ts`, alias semantic tokens to friendly names so our own JSX reads cleanly: `forest`, `clay`, `ink`, `paper`, `surface`, `borderwarm`. Both shadcn-default names AND the friendly aliases work.
- **D-08:** Border radius: `--radius: 6px` for cards (overrides shadcn default of 8px); inputs and buttons use 4px; pills/badges use 999px (full).
- **D-09:** Shadow: single layered shadow defined as one Tailwind utility (`shadow-doc`): `0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)`. No glassmorphism, no neumorphism, no neon.
- **D-10:** Dark mode: NOT scoped in v1. Brief is light-mode only. Skip dark variants entirely; reduce surface area.

### Typography

- **D-11:** Use `next/font/google` to self-host Inter, Inter Tight, and Geist Mono. Configure with CSS-variable strategy (`variable: '--font-inter'` etc.) in `app/layout.tsx`, attach to `<body>` via `className`.
- **D-12:** Tailwind font families:
  - `font-sans` → Inter (body, default)
  - `font-display` → Inter Tight (headings, weights 500/600)
  - `font-mono` → Geist Mono (catalog numbers, citations, IDs, prices, code)

### shadcn/ui Install Scope (Decision 2 — option b)

- **D-13:** Run `npx shadcn@latest init` with style="default", base color="zinc" (we override the palette anyway), CSS variables=yes.
- **D-14:** Phase 1 components (install via `npx shadcn add ...`):
  - `button` — example chips, send arrow
  - `input` — fallback text fields
  - `textarea` — chat input
  - `scroll-area` — chat history container
  - `sonner` — toast notifications (used by health check failure)
- **D-15:** Phase 2-7 components added on demand: `tabs`, `card`, `tooltip`, `dialog`, `drawer`, `popover`, `separator`, `badge`. Do NOT pre-install them.

### Layout Shell

- **D-16:** Three-column layout via CSS Grid in `app/app/page.tsx` (the dashboard route, Server Component shell with Client Component children). Grid template: `[chat 32%] [canvas 50%] [trace 18%]` (using `grid-template-columns: 32fr 50fr 18fr` for responsiveness). Horizontal scroll prevented by `overflow-x-hidden` on root. Note: dashboard moved to `/app` route — landing lives at `/`.
- **D-17:** Header bar: 56px tall, full width. Wordmark left ("Sextant" in `font-display` weight 500 — placeholder until Claude Design logo lands), placeholder breadcrumb center (truncated mono), placeholder avatar + corrections-counter pill + cog icon (Lucide `Settings`) on right. Functional behavior is stubbed in Phase 1. Header bar appears on `/app` only — landing has its own minimal nav.
- **D-18:** Empty-state behavior on `/app` (the only "real" dashboard UX of Phase 1):
  - Chat panel renders only an empty textarea + 4 example-hypothesis chips above it
  - Plan canvas shows centered hero: heading "Frame a scientific question. Get a fundable plan in 3 minutes." + the same 4 chips repeated as primary CTA
  - Trace rail shows skeleton state ("Awaiting hypothesis…")
- **D-18a:** Landing-page `/` Phase 1 placeholder behavior (replaced in Phase 8 with Claude Design output):
  - Single full-viewport hero on `app/page.tsx`
  - Centered wordmark "Sextant" (font-display, weight 600, larger size)
  - Tagline: "From hypothesis to fundable, citation-grounded experiment plan in three minutes."
  - One primary CTA button "Open Sextant" → links to `/app`
  - Same warm off-white background, forest-green accent on the CTA — token-correct, animation-free placeholder
- **D-19:** Example hypothesis chips: take 4 verbatim from the Fulcrum brief and store as a const array in `src/lib/example-hypotheses.ts`. Clicking a chip in Phase 1 just populates the textarea with that text — no submission yet (Phase 2 wires it to the LLM).

### Env Validation (Decision 4 — option c)

- **D-20:** Create `src/lib/env.ts` exporting a Zod-validated singleton:
  ```ts
  import { z } from "zod";
  export const env = z.object({
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
    TAVILY_API_KEY: z.string().min(1),
    OPENAI_API_KEY: z.string().optional(),  // fallback only
  }).parse(process.env);
  ```
  Failure throws at module import = fail fast at boot, never at runtime.
- **D-21:** All API code reads `env.X`, never `process.env.X`. Lint rule (later phase if time): forbid `process.env` outside `lib/env.ts`.
- **D-22:** Health-check route at `app/api/health/route.ts`:
  ```ts
  import { env } from "@/lib/env";
  export async function GET() {
    const tavily = !!env.TAVILY_API_KEY;
    const gemini = !!env.GOOGLE_GENERATIVE_AI_API_KEY;
    return Response.json({ tavily, gemini, ok: tavily && gemini });
  }
  ```
  Returns 200 always (the boolean is the signal). This is what ROADMAP success-criterion #4 verifies.

### Brain Model Strategy (multi-tier Gemini, locked here for downstream phases)

- **D-22a:** **Provider:** Google Gemini via Vercel AI SDK `@ai-sdk/google` package (added in Phase 2 when first model call ships). Single env key: `GOOGLE_GENERATIVE_AI_API_KEY`.
- **D-22b:** **Model tier per task** (referenced by later phases):
  - Plan synthesis (Phase 3 final consolidator): `gemini-3.1-pro-preview` — top reasoning, structured JSON
  - 4 agent debaters (Phase 3 Researcher/Skeptic/CRO Operator/Compliance): `gemini-3-flash-preview` — frontier+grounding, parallel-safe
  - Lit-QC novelty scoring (Phase 2): `gemini-3.1-flash-lite-preview` — cheap, high-volume
  - Lab rule extraction (Phase 7): `gemini-3-flash-preview` — structured JSON, low volume
  - Validation grid checks (Phase 6): `gemini-3.1-flash-lite-preview` — many parallel boolean evals
  - Plan-B diff (Phase 7): `gemini-3.1-flash-lite-preview` — comparison logic
- **D-22c:** **Fallback ladder** if any preview hits rate limits during demo:
  - `gemini-3.1-pro-preview` → `gemini-2.5-pro`
  - `gemini-3-flash-preview` → `gemini-2.5-flash`
  - `gemini-3.1-flash-lite-preview` → `gemini-2.5-flash-lite`
  All GA, same env key.
- **D-22d:** **Fallback provider** if Google has provider-level outage: OpenAI (`OPENAI_API_KEY`) via `@ai-sdk/openai`. Wired only on demand, not in Phase 1.
- **D-22e:** Phase 1 makes ZERO model calls. Brain-model decision is locked here so `lib/env.ts` validates the right key from the start; first actual model invocation is Phase 2.

### Deploy Pipeline (Decision 3 — option b)

- **D-23:** GitHub remote: `git@github.com:yauhenifutryn/sextant.git` (private repo, already created and pushed-to in this chat). Project name: **Sextant**.
- **D-24:** Connect the GitHub repo to a new Vercel project via the Vercel dashboard (one-time, ~2 minutes). Framework auto-detects as Next.js once Phase 1 scaffold is pushed. Build command and output dir use defaults.
- **D-25:** Set `GOOGLE_GENERATIVE_AI_API_KEY` and `TAVILY_API_KEY` (and optionally `OPENAI_API_KEY`) as encrypted Vercel project environment variables (Production + Preview + Development scopes). Never commit `.env.local`.
- **D-26:** Verify DEPLOY-02 by pushing a no-op commit and confirming reachable URL in <60s. The deploy URL gets pinned to STATE.md once known.

### Routes & Page Topology (NEW — landing + dashboard split)

- **D-26a:** **`/` (landing page):** marketing-style hero with project name "Sextant", short value prop, single primary CTA "Open Sextant" → `/app`. Phase 1 ships a token-correct placeholder; Phase 8 (Polish) replaces with the Claude Design output (animated, scroll-driven landing). No login, no gates.
- **D-26b:** **`/app` (product dashboard):** the three-column shell (Chat / Plan canvas / Trace rail) described in `CLAUDE_DESIGN_BRIEF.md`. Empty-state hero with 4 example chips lives here. This is what later phases populate.
- **D-26c:** **No auth route** in v1 (per PROJECT.md out-of-scope). The `/app` route is publicly reachable without sign-in.

### UI Source-of-Truth Flow (Path B, REVISED — split landing vs dashboard)

- **D-27:** **Landing page (`/`)** is generated in Claude Design with **high-fidelity prototype + Animation timeline-based motion design** enabled. Output is a single polished animated landing page with hero, value prop, "Open Sextant" CTA. User pastes back, Claude Code ports to `app/page.tsx` using Framer Motion for the animation primitives (Phase 8 polish work).
- **D-28:** **Dashboard (`/app`)** is built directly in Claude Code from `CLAUDE_DESIGN_BRIEF.md` tokens, NOT through Claude Design. The dashboard is data-dense and structural; iterating against `localhost:3000/app` with shadcn/ui + Framer Motion is faster than round-tripping through Claude Design. Per-component micro-animations (shimmer, checkmark transitions, panel slide-ins) are implemented per the brief's §"Motion" notes.
- **D-28a:** **Logo:** Claude Design generates the Sextant wordmark/logomark concept as part of the landing page render. Logo asset is exported and lives at `public/logo.svg` (referenced from header bar across both routes). Phase 1 ships a text-only wordmark placeholder; Phase 8 replaces with the SVG logo.
- **D-29:** Visual fidelity review uses `web-design-guidelines` and `web-interface-guidelines` skills as the audit harness — run before signing Phase 1 off as complete (covers `/` placeholder + `/app` shell).

### Dev Tooling Discipline

- **D-30:** ESLint + Prettier defaults from `create-next-app` only. No Husky, no lint-staged, no commit hooks. Hackathon = fewer moving parts.
- **D-31:** TypeScript strict mode ON (`"strict": true` in `tsconfig.json`). `noUncheckedIndexedAccess`: false (default) — too noisy for 24h.
- **D-32:** `.gitignore` adds: `node_modules/`, `.next/`, `.env*.local`, `out/`, `*.tsbuildinfo`, `.vercel/`. Already partially scaffolded — extend, don't replace.

### Claude's Discretion

- Specific font fallback chains beyond `next/font` defaults
- Exact Tailwind v3 vs v4 micro-version (use whatever `create-next-app` ships with as of 2026-04-25)
- Naming of placeholder components (e.g., `<HeaderBar />`, `<ChatPanel />`, `<PlanCanvas />`, `<TraceRail />`) — pick what reads well
- Whether to put each panel in its own file or inline in `page.tsx` for Phase 1 — pick whichever is more readable, refactor later if Phase 2+ demands it
- Health-route response shape minor extras (e.g., add `version: process.env.VERCEL_GIT_COMMIT_SHA`) — optional

### Folded Todos

None — STATE.md "Pending Todos" was empty.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-level
- `.planning/PROJECT.md` — vision, core value, locked stack, hard cut-off rules
- `.planning/REQUIREMENTS.md` — full v1/v2 requirement IDs, traceability table
- `.planning/ROADMAP.md` §"Phase 1: Foundation" — goal + 5 success criteria + UI hint=yes
- `.planning/STATE.md` — current position, blockers
- `.planning/config.json` — workflow flags (yolo mode, plan-checker on, verifier off, parallel exec on)

### Design source of truth
- `CLAUDE_DESIGN_BRIEF.md` — the locked design system: tokens, layout, key screens, microcopy, accessibility. Every Phase 1 visual decision MUST defer to this file unless explicit user override.
- `CLAUDE_DESIGN_BRIEF.md` §"Design system tokens" — colors, typography, spacing, radius, shadow values referenced throughout decisions D-05 through D-10.
- `CLAUDE_DESIGN_BRIEF.md` §"Layout — desktop primary, 1440px target" — three-column proportions referenced in D-16.
- `CLAUDE_DESIGN_BRIEF.md` §"Required key screens" §1 (Empty state) — the only screen Phase 1 fully renders.

### User instructions
- `CLAUDE.md` (project) — hard rules: no claim without URL citation, use brief's 4 sample hypotheses verbatim, hard cut-off for Phase 7, single TS stack, no DB, no new deps without justification.
- `~/.claude/CLAUDE.md` (global) — Section 4.7 Verify before recommending, 4.10 Branch and scope discipline, 4.11 Configuration file safety.

### External (read on demand, not pre-fetched)
- shadcn/ui docs — https://ui.shadcn.com/docs/installation/next (the only authoritative source for `init` flags and component install commands as of late 2025/early 2026)
- Next.js 15 App Router — https://nextjs.org/docs/app (route handlers, `next/font`, layout patterns)
- Vercel deploy via GitHub integration — https://vercel.com/docs/deployments/git
- Tavily API — https://docs.tavily.com (env var name, auth header)
- Anthropic SDK — https://docs.anthropic.com/en/docs/build-with-claude (Sonnet 4.6 model ID, env var name)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

None. This is greenfield — only `.planning/`, `CLAUDE.md`, `CLAUDE_DESIGN_BRIEF.md`, `.gitignore` exist. No `package.json`, no `src/`, no `app/`, no `node_modules/`.

### Established Patterns

None yet. Phase 1 establishes the patterns every later phase will follow:
- App Router file conventions (`app/`, `app/api/`)
- Component conventions (`components/ui/` for shadcn, `components/` for app-level)
- Server vs Client component split (default Server, opt-in Client with `"use client"`)
- Env access pattern (`env.X` from `lib/env.ts`, never `process.env`)
- Token usage pattern (`bg-paper text-ink`, never inline hex)

### Integration Points

- The empty-state textarea + chips will become the entry point Phase 2 wires to the literature-QC backend
- `/api/health` is the first API route; Phase 2 adds `/api/litqc`, Phase 3 adds `/api/plan`, etc.
- `lib/env.ts` is the foundation that every later API route imports

</code_context>

<specifics>
## Specific Ideas

- The aesthetic is non-negotiable per CLAUDE.md hard rule #7 — don't deviate from `CLAUDE_DESIGN_BRIEF.md` tokens without explicit user sign-off. The judge feedback channel for "AI startup clichés" is the loss condition.
- Visual fidelity reference points are Future House, Lila Sciences, Linear, Anthropic.com — not generic SaaS. Test: would a working scientist take this seriously?
- The four example hypothesis chips MUST be taken verbatim from the Fulcrum brief — solo-dev-not-domain-scientist mitigation per PROJECT.md.

</specifics>

<deferred>
## Deferred Ideas

| Idea | Defer to | Reason |
|------|----------|--------|
| Magic MCP component search for shadcn parts | Phase 2-7 as needed | Phase 1 needs only 5 small components; MCP overhead not worth it |
| `frontend-design` skill for custom components | Phase 2-7 as needed | Phase 1 ports from Claude Design output; skill is for from-scratch generation |
| `web-interface-guidelines` audit | End of Phase 1 (before sign-off) | Run as gate before declaring Phase 1 done |
| Husky / lint-staged / Prettier CI hooks | Out of scope | Hackathon = no extra moving parts |
| Monorepo / workspaces | Out of scope | Single Next.js app, no shared packages needed |
| Storybook | Out of scope | 24h budget — not worth it |
| Dark mode | Out of scope (v1) | Brief is light-mode only |
| Mobile / responsive beyond desktop | Out of scope per PROJECT.md | Judges demo on laptop |

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-04-25*
