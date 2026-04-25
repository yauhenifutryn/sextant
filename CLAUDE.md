# CLAUDE.md — AI CRO Co-Pilot (Hack-Nation 5 hackathon project)

This file provides guidance to Claude Code when working in this repository. **Read it on every new session before doing anything else.**

## What this is

24-hour solo hackathon project. Track: Fulcrum Science "AI Scientist". Working pitch: **AI CRO Co-Pilot** — chat-driven AI experiment plan generator with closed-loop learning from scientist corrections.

Hackathon kicked off 2026-04-25. Final pitches Sunday 2026-04-26. Hard deadline at hour 24 from kickoff.

## Where the truth lives

- `.planning/PROJECT.md` — vision, core value, key decisions
- `.planning/REQUIREMENTS.md` — v1 (must ship), v2 (stretch differentiator), out-of-scope
- `.planning/ROADMAP.md` — 8 phases mapped to requirements with success criteria
- `.planning/STATE.md` — current focus, blockers, recent activity
- `.planning/config.json` — workflow mode (YOLO), granularity (standard), parallel execution on
- `CLAUDE_DESIGN_BRIEF.md` — locked UI design system (paste into Claude Design)

Run `/gsd-progress` at the start of any new chat to orient.

## GSD workflow

Use the GSD command surface for all phase work. Per-phase pattern:
```
/gsd-resume-work          # at start of new chat
/gsd-plan-phase N         # create plan for phase N
/gsd-execute-phase N      # execute (auto-spawns parallel subagents per plan)
/gsd-pause-work           # at end of chat
/clear                    # then start a new chat for the next phase
```

The hackathon is not a place for the verifier or per-phase researcher agents — they are explicitly disabled in `.planning/config.json` to save tokens and time. Plan-checker IS on.

## Hard rules (do not break)

1. **No claim without a verifiable URL citation.** Every reagent, every catalog number, every protocol step in any generated plan must link to a real source page (Sigma-Aldrich, Thermo Fisher, protocols.io, arXiv, Semantic Scholar). No invented catalog numbers. No invented prices. No hallucinated DOIs. If grounding fails, surface "source not found" rather than confabulate.
2. **Use the brief's 4 sample hypotheses verbatim** as the rehearsed demo inputs. Do not invent new ones — the dev is not a domain scientist and quality of the demo input determines quality of output.
3. **Hard cut-off rule for Phase 7 (Closed-Loop + Propagation Demo):** if not wired by hour 18 of the build, cut to a manual before/after slide. Do NOT leave the learning loop half-built. This is the Codex-flagged risk.
4. **Single language stack:** TypeScript only. No Python services. No multi-runtime complexity in 24h.
5. **No new dependencies without justification.** Ask before adding a library that is not in the locked stack: Next.js 15, TypeScript, Tailwind, shadcn/ui, Vercel AI SDK (`ai` package), Tavily SDK, Anthropic SDK, Framer Motion, Lucide icons.
6. **No DB.** JSON files in repo for the lab-rule store and any feedback artifacts. Seven phases of v1 + v2 will not need anything more.
7. **Don't deviate from the design tokens** in `CLAUDE_DESIGN_BRIEF.md` without explicit user sign-off. The aesthetic is part of the win condition.

## Tech stack (locked)

| Layer | Choice |
|---|---|
| Runtime | Next.js 15 App Router on Node 20 |
| Language | TypeScript only |
| Styling | Tailwind + shadcn/ui + Framer Motion + Lucide icons |
| AI SDK | Vercel AI SDK (`ai` package) for streaming, tool calling, multi-step agent loops |
| Models | Claude Sonnet 4.6 (plan generation, agent debate) + Claude Haiku 4.5 (lit-QC scoring, fast filters) |
| Search / grounding | Tavily API |
| Storage | JSON files in repo (no database) |
| Hosting | Vercel free tier |
| Secrets | `.env.local` for dev; Vercel project env vars for prod (`ANTHROPIC_API_KEY`, `TAVILY_API_KEY`) |

## Engineering protocols

Inherit all rules from `~/.claude/CLAUDE.md` (the user's global instructions). The most relevant for this project:
- **Verify before recommending** (Section 4.7): grep the file before suggesting a change.
- **Address everything the user says** (Section 4.6): every point gets acknowledged.
- **Long session degradation** (Section 4.9): for sessions over ~40 turns, suggest `/gsd-pause-work` then `/clear`.
- **Branch and scope discipline** (Section 4.10): default branch is `main` for this hackathon project; do not create feature branches per phase, single-branch dev to maximize speed.
- **Configuration file safety** (Section 4.11): merge into existing config files via Edit, never replace.

## Do not commit

- `.env.local` (in `.gitignore`)
- `node_modules/`
- Any private API keys or tokens
- `.planning/` is committed (per `commit_docs: true` in config.json)
- Demo recording artifacts go to `demo/` and are gitignored

## When stuck

- For a second opinion on a non-trivial decision: dispatch `codex:rescue` subagent (per global CLAUDE.md Section 8).
- For UI polish review: invoke `web-interface-guidelines` and `web-design-guidelines` skills.
- For bugs: invoke `superpowers:systematic-debugging`.
- For "is this approach right?": invoke `superpowers:brainstorming` ONLY if the design is not already locked in `.planning/`.

## Related memory

User's project memory file: `~/.claude/projects/-Users-jenyafutrin/memory/project_hacknation_5.md` — contains track-choice rationale, Codex consultation summary, and demo-cut-off rules. Keep in sync with this file as decisions evolve.

---
*Last updated: 2026-04-25 after project initialization*
