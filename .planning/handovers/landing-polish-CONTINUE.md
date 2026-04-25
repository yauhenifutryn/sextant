---
context: landing-polish
phase: 1.5 (parallel work-stream, separate from main GSD Phase 2 chat)
task: paused awaiting user direction
total_tasks: 23 (14 done, 9 open + 1 deferred)
status: paused — visuals iterated through several drafts, locked on cinematic-on-/ + video-ASCII-on-/v1
last_updated: 2026-04-26T00:00:00Z
---

# BLOCKING CONSTRAINTS — Read Before Anything Else

> These are not suggestions. Each was discovered through actual failure during this session.

- [ ] CONSTRAINT: **Inline `<svg>` filter defs cause Safari hydration errors** — when an SSR'd component renders `<svg width="0" height="0">` containing only `<defs>`, Safari sanitizes the empty SVG node and hydration mismatches. Mitigation: serve filter defs as a static asset under `public/` and reference from CSS via `filter: url('/path.svg#id')`. Already applied to `public/cine-filter.svg`.
- [ ] CONSTRAINT: **Hotlinking videos from Pexels / Pixabay / Mixkit returns 403** — their CDNs block cross-origin `<video>` requests. Mitigation: download the chosen clip into `public/` and reference as a relative path. The current `public/hero.mp4` is a user-uploaded file.
- [ ] CONSTRAINT: **Vertical-character ASCII renders as letter-scatter** — rendering paper-fragment text one character per vertical line at low opacity reads as broken/random characters, not "papers flowing". Mitigation: render text horizontally (rows = papers), or render a literal scene (lab notebook page, video-ASCII frames). Multiple iterations were burned learning this.
- [ ] CONSTRAINT: **CSS `scroll-behavior: smooth` is unreliable** — it respects `prefers-reduced-motion` and gets disabled on most macOS users by default. Mitigation: JS click handler in `LandingObservers` that catches `<a href="#section">` clicks and runs `window.scrollTo({ behavior: "smooth", top: rect - 80 })` regardless of OS preference.
- [ ] CONSTRAINT: **No new npm dependencies without explicit user approval** — project CLAUDE.md hard rule #5. Locked stack only: Next.js 15, TypeScript, Tailwind, shadcn/ui, Vercel AI SDK, Tavily SDK, Anthropic SDK, Framer Motion, Lucide icons. Lottie / GSAP / etc. are NOT pre-approved.
- [ ] CONSTRAINT: **Do not touch files owned by the main GSD chat** — `.planning/phases/02-literature-qc/02-*-PLAN.md`, `src/lib/example-hypotheses.ts` (currently has temp stand-ins, will be replaced verbatim from Fulcrum brief by main chat), `src/lib/litqc.ts`, `/api/qc/**`. The handover doc at `.planning/handovers/landing-polish-HANDOVER.md` lists the file boundaries.

**Do not proceed until all boxes are checked.**

## Critical Anti-Patterns

| Pattern | Description | Severity | Prevention Mechanism |
|---------|-------------|----------|---------------------|
| Iterate on ASCII concept without user direction | Built three different ASCII concepts (vertical streams, terminal feed, lab notebook) before user said "use the video as ASCII source" — the right answer was the user's first instinct from the handover doc | blocking | Before proposing more than one creative variant in a creative iteration loop, use AskUserQuestion to lock direction. The user prefers concrete pivots over speculative variants. |
| Inline SVG filter defs in React | SSR/CSR mismatch on Safari for empty `<svg width="0">` nodes | blocking | Serve filter defs as static `public/*.svg` assets; reference via CSS `filter: url(...)` |
| Hotlink videos from free-stock CDNs | Pexels/Pixabay/Mixkit return 403 on cross-origin video requests | advisory | Download to `public/` or use a CDN that allows hotlinking (Cloudinary, Vercel Blob) |
| Render multiline text in <pre> via innerHTML for animation | Triggers security hooks; XSS surface even if content is internally generated | blocking | Use `textContent` and lose per-char span styling, OR build DOM via `createElement` |

## Required Reading (in order)

1. `CLAUDE.md` (project-level, repo root) — hardcoded constraints (hard rule #5 = no new deps, hard rule #2 = no invented hypotheses)
2. `CLAUDE_DESIGN_BRIEF.md` — locked design tokens and visual language (forest green + warm off-white)
3. `.planning/handovers/landing-polish-HANDOVER.md` — original scope of this parallel work-stream
4. `.planning/handovers/landing-polish-HANDOFF.json` — machine-readable state for /gsd-resume-work
5. `.planning/STATE.md` — overall project state (Phase 1 closed, Phase 2 in progress in main chat)
6. `src/components/landing/landing.css` — single source of truth for landing styles (and now /v1 video-ASCII, dashboard validation skeleton, magnetic, custom cursor)
7. `src/components/landing/cinematic-hero.tsx` + `.css` — current hero on / and /v2

<current_state>
Sunday is final pitch day. Landing has been iterated through several visual drafts.
Final-ish state right now:
- `/` ships the cinematic hero (Velorah-style fullscreen video bg with posterize SVG filter, glassmorphic dark nav, magnetic primary CTA, custom dot+ring cursor, scroll-driven hero fade + ken-burns video drift)
- `/v1` ships the live video-ASCII hero (the same MP4 sampled to a 96×54 canvas, mapped to a density character ramp, written into a `<pre>` at ~24 FPS — frame-by-frame ASCII rendering of the lab footage)
- `/v2` mirrors `/`
- `/app` shows a polished placeholder shell: clean empty-state hero (chips deduplicated to center only, short pill labels), `<SextantLoader />` 4-bar agent loader + 6-row validation skeleton on the right rail

User has expressed:
1. The /v1 ASCII look IS what they want
2. They want to swap to a better video clip (clean BG, scientist + book/research)
3. They asked whether ASCII should stay on the SIDE (current /v1) or become the BACKGROUND on the main page /
4. They asked me to LIST remaining items so they can decide what to take to a fresh chat

14 commits ahead of origin/main. Nothing pushed. Production URL is https://sextant-uekv.vercel.app — push at any time triggers Vercel auto-deploy (~30s).
</current_state>

<completed_work>

Completed (14 commits, in chronological order):
1. `42777ea` — Port Claude Design output as initial scaffold (paper-flow ASCII attempt #1, minimal sextant mark, 9 section components)
2. `afd4eb1` — Drop chaotic dotted ring on method radial, tighten closed-loop layout, surface validation grid as proper card
3. `a421c40` — Hero centering bug fix (flex-direction column) + smooth-scroll on `html` (the actual scroll container)
4. `3e49efa` — ASCII attempt #2: three-column agent terminal feed (CSS marquee, seamless loop)
5. `5fdff13` — Choreographed scroll-into-view section reveals (agent dot pulse, closed-loop content slide-in)
6. `2a18dce` — Pure-white CTAs (was rendering grey on dark) + JS smooth-scroll (CSS version unreliable due to prefers-reduced-motion) + ASCII attempt #3: animated lab notebook
7. `b6ace33` — Replace `[Fulcrum sample hypothesis #N]` placeholders with realistic stand-ins
8. `1e429bc` — Build /v2 cinematic video hero (Velorah-style spec, full-bleed video bg, glass nav)
9. `7df35cf` — Promote cinematic to /, build `<Magnetic />` + `<CustomCursor />` + `<SextantLoader />` + upgrade trace rail
10. `f186cb6` — Scroll parallax: hero text fade + ken-burns video drift via `--hero-progress` CSS var
11. `8d5cb5d` — Cinematic hero graceful fallback (gradient + grid pattern when video missing/403s)
12. `3ddf82f` — Posterize SVG filter on cinematic video (illustrated/cel-shaded look) + dashboard cleanup (chip dedup, tightened typography, helper hint)
13. `bdbec11` — ASCII attempt #4 (the keeper): live video-ASCII rendering of `public/hero.mp4` on /v1
14. `e5f8423` — Fix Safari hydration error: move SVG filter defs to static `public/cine-filter.svg`
</completed_work>

<remaining_work>

Open items in priority order (effort estimates assume one focused pass each):

1. **[BLOCKED on user] Better hero video clip** (~5 min once received) — clean BG, scientist flipping book / research, single subject
2. **[BLOCKED on user decision] ASCII placement** (~30-45 min) — keep `<VideoAscii />` on /v1 right column, OR replace cinematic on / with `<VideoAscii />` as full-bleed backdrop
3. **Real brand wordmarks on tech strip** (~20 min) — Anthropic/Gemini/Tavily/Vercel actual logos
4. **Mouse parallax on method radial** (~15 min) — agents drift slightly with mouse position
5. **Closed-loop arrows draw with scroll-progress** (~20 min) — arrows stroke-dash bound to per-section scroll
6. **[BLOCKED on dep approval] Lottie 'researcher at desk'** (~30 min) — animated person typing in problem section
7. **web-interface-guidelines + web-design-guidelines audit** (~20 min) — final pre-demo pass
8. **[BLOCKED on Fulcrum brief] Replace stand-in hypotheses with verbatim 4** (~5 min) — CLAUDE.md hard rule #2
9. **[DEFERRED to Phase 2] Dashboard polish** — chat panel UX, plan canvas tabs, header bar refinement (2-4 hrs)
10. **[OUT OF SCOPE for landing-polish chat] Phase 2-7 actual implementation** (days)
</remaining_work>

<decisions_made>

- Chose `<CinematicHero />` for / and `<VideoAscii />` for /v1 over `<LabNotebook />` because the video-rendering approach is more visually distinctive and reuses the same hero MP4
- Chose JS smooth-scroll over CSS `scroll-behavior: smooth` because CSS version is disabled by macOS prefers-reduced-motion default
- Chose static `public/cine-filter.svg` over inline JSX `<svg>` because Safari hydration mismatch on empty SVG nodes
- Chose Canvas API + custom luminance mapping over a third-party ASCII library (no new deps)
- Chose CSS marquee duplication over RAF-driven scroll for the deleted agent feed (zero JS, GPU-composed); when we ditched it, `<VideoAscii />` does need RAF because it samples the video frame
- Chose to defer Lottie until user explicitly approves the new dep
- Chose to defer dashboard polish (Phase 2 territory) — only addressed the immediate visual mess (chip dedup, hero typography, loader sizing)
</decisions_made>

<blockers>
- **Better video clip** — user hasn't yet provided a cleaner-subject hero video. Workaround: current public/hero.mp4 plays through the posterize filter + the live ASCII renderer; both look intentional even with generic lab footage.
- **ASCII placement decision** — user asked "side or background?" Both work. Resuming agent should ask via AskUserQuestion before building either path.
- **Lottie dep approval** — needed for #6. User can decline (build SVG-only manually) or approve.
- **Fulcrum brief verbatim 4** — needed before LIVE demo per CLAUDE.md hard rule #2. Current `src/lib/example-hypotheses.ts` has realistic stand-ins.
- **Uncommitted file `.planning/phases/02-literature-qc/02-02-PLAN.md`** — owned by main GSD chat. DO NOT commit from this work-stream.
</blockers>

## Infrastructure State

- Dev server: running in tmux session `dev` at localhost:3000 (`tmux attach -t dev` to view; `tmux kill-session -t dev` to stop)
- Routes: `/`, `/v1`, `/v2`, `/app`, `/api/health` all return 200
- Production: https://sextant-uekv.vercel.app (Vercel auto-deploy on push to main, ~30s)
- Git: 14 commits ahead of `origin/main`, none pushed (per user instruction "commit but don't push")
- Public assets:
  - `public/hero.mp4` (6MB, user-uploaded) — primary video for / and /v1
  - `public/cine-filter.svg` — posterize filter for cinematic look
  - `public/sextant-logomark.svg`, `public/sextant-wordmark.svg` — design assets

## Pre-Execution Critique Required

Not applicable — this is a polish work-stream, not a design-then-execute split.

<context>
The user has been iterative and direct. Patterns:
- Quick visual feedback ("this is mess", "still boring", "can we make it fancier")
- Asks for specific things ("use Ascii-Motion repo", "comment on all sources I provided", "use GSD to break it into parts")
- Cuts off mid-sentence sometimes — pause and ask rather than guessing the rest
- Doesn't want long preamble — show options, take action, summarize at the end
- Open to multiple iterations but values when I say "let's lock direction first" via AskUserQuestion
- Sunday is the deadline; demo is tonight/today

Locked design language (CLAUDE_DESIGN_BRIEF.md):
- Warm off-white #FAFAF7 background
- Forest green #0F4C3A primary
- Clay rust #B85C38 secondary (sparingly, for "novel finding" / corrections)
- Inter / Inter Tight / Geist Mono
- 6px card radius, 1px doc shadow only (no glassmorphism / neumorphism / neon / SaaS gradients)
- Tokens are CLOSED — do not propose palette changes

The cinematic hero on / breaks the warm palette deliberately (it's dark + glassmorphic) but the rest of the page below the fold returns to warm forest. This works visually but is worth noting if a future audit flags inconsistency.
</context>

## Available Skills (no Playwright / browser-rendering tool installed)

The user asked whether Claude has a "persistent browser skill to check everything by itself". Honest answer: NO in this session. What's available:
- `WebFetch` — fetch HTML / LLM-extracted page summary, but no JS rendering or screenshots
- `Bash` — curl, type-check, scan dev-server logs, count rendered DOM elements
- `Agent` (general-purpose, Explore) — can dispatch a sub-agent for parallel research
- `Magic MCP` (loaded in session) — search/build components from 21st.dev directory

No headless browser. To get one, install a Playwright-style skill via `find-skills` or add a Chrome MCP server. User can do this in a fresh chat if they want visual verification automation.

<next_action>
Resuming agent should:

1. **Read this file end-to-end + landing-polish-HANDOFF.json + CLAUDE_DESIGN_BRIEF.md** before touching any code.

2. **Check git status** (`git status -s` and `git log -3 --oneline`) to confirm no surprises since pause. Verify `.planning/phases/02-literature-qc/02-02-PLAN.md` is still uncommitted (owned by main chat, do NOT commit).

3. **Confirm dev server is up**: `tmux ls` should show `dev` session. If not, start with `tmux new-session -d -s dev "npm run dev"`.

4. **Verify all routes still 200**: `curl -sI http://localhost:3000/` for /, /v1, /v2, /app.

5. **Use AskUserQuestion to lock the two open decisions BEFORE building** (avoid the multi-iteration trap that burned tokens this session):
   - Q1: "Drop a video file path / URL for the hero, or stick with current public/hero.mp4?"
   - Q2: "ASCII placement: keep on /v1 right column, or replace / cinematic with full-bleed video-ASCII backdrop?"

6. **Once locked, build 2-3 of items 17-21 from the priority list** (real brand wordmarks → mouse parallax on method → closed-loop scroll-progress arrows are the highest-impact non-blocked items).

7. **Run `web-interface-guidelines` + `web-design-guidelines` audit as the final step** before declaring landing demo-ready.

8. **DO NOT push** unless user explicitly says to. Commits stay local per their earlier instruction.

9. **Update `.planning/STATE.md`** with landing-polish progress only after the final audit; do not mix with main GSD chat's Phase 2 entries.
</next_action>
