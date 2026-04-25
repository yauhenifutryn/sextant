# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 01-foundation
**Areas discussed:** Design token wiring, shadcn/ui install scope, Vercel deploy pipeline, Env validation discipline

---

## Design Token Wiring

| Option | Description | Selected |
|--------|-------------|----------|
| (a) Tailwind v4 `@theme` | CSS vars in `globals.css` via `@theme {...}` — modern but newer syntax with fewer references | |
| (b) `tailwind.config.ts` extend | Classic JS object with explicit hex/spacing/font; well-documented, type-safe | |
| (c) shadcn HSL CSS-vars + Tailwind aliases | Map brief colors to shadcn's `--background`, `--foreground`, `--primary` etc. + add friendly aliases | ✓ |

**User's choice:** (c)
**Notes:** "3b 4 whatever is the best" — user accepted recommendations after plain-language explanation. shadcn-default convention chosen so every imported shadcn component auto-themes without per-component overrides.

---

## shadcn/ui Install Scope

| Option | Description | Selected |
|--------|-------------|----------|
| (a) shadcn init only, zero components | Build all primitives by hand with raw Tailwind | |
| (b) Phase 1 minimum: button, input, textarea, scroll-area, sonner | Just what empty-state shell renders | ✓ |
| (c) Phase 1 broader: above + tabs, card, tooltip, dialog, drawer | Pre-load components Phase 2-7 will need | |

**User's choice:** (b)
**Notes:** Per-phase commits stay focused; later components added on demand via `npx shadcn add <name>`.

---

## Vercel Deploy Pipeline

| Option | Description | Selected |
|--------|-------------|----------|
| (a) Vercel CLI + token | Scripted deploys via `vercel-cli-with-tokens` skill, no dashboard | |
| (b) GitHub integration | Push to `main` → Vercel dashboard auto-deploys via webhook | ✓ |
| (c) Hybrid: GitHub for prod, CLI for previews | Mixed approach | |

**User's choice:** (b) — explicit "3b"
**Notes:** Matches DEPLOY-02 success criterion (push → reachable in <60s) natively. One-time dashboard setup, then fire-and-forget.

---

## Env Validation Discipline

| Option | Description | Selected |
|--------|-------------|----------|
| (a) Raw `process.env.X!` | No validation, fail at runtime if missing | |
| (b) Zod-typed `lib/env.ts` | Fail-fast validation at module import | |
| (c) Zod + `/api/health` route | Validation + dedicated health endpoint returning `{ tavily, anthropic, ok }` | ✓ |

**User's choice:** (c) — explicit "4 whatever is the best"
**Notes:** Health route is required by ROADMAP success criterion #4 regardless. Zod adds 30 seconds of typing and saves an hour of mystery 500s on stage.

---

## Out-of-Scope / Side Discussions

- User confirmed Path B for UI: will create the first draft in Claude Design from `CLAUDE_DESIGN_BRIEF.md`, paste output back, then we adapt component-by-component into Next.js + shadcn/ui primitives.
- Skills installed during this discussion at user request (had been removed previously to save context):
  - `gsd-discuss-phase`
  - `gsd-resume-work`
  - `gsd-pause-work`

## Claude's Discretion

Captured inline in CONTEXT.md `<decisions>` section under "Claude's Discretion". Summary:
- Specific font fallback chains
- Tailwind v3 vs v4 micro-version (use whatever `create-next-app` ships)
- Component file naming and split (single page.tsx vs broken-out files)
- Optional health-route extras like `version` field

## Deferred Ideas

Captured in CONTEXT.md `<deferred>` section. Highlights:
- Magic MCP component search — defer to later phases
- `web-interface-guidelines` audit — run as Phase 1 sign-off gate
- Husky / lint-staged — out of scope (hackathon)
- Dark mode — out of scope (light-only per brief)
