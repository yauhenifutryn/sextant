# Sextant landing — Playwright iteration handover

**For:** a Codex (or Claude Code) agent equipped with the Playwright interactive skill (browser automation + screenshots).
**By:** Claude Code session that built the current state but cannot render pages or take screenshots.
**Deadline:** Sunday is final pitch day for Hack-Nation 5. Sextant pitches under "AI CRO Co-Pilot."
**Why this exists:** the human user has iterated through several visual variants and is frustrated by blind iteration. They want an agent that can actually SEE the page, test it, propose a single locked direction, and ship it.

---

## 1. Mission

Pick the **single hero direction** that ships on `/`, polish it end-to-end, and verify the rest of the landing page reads as a coherent demo. Stop iterating on parallel variants. The user is done with multi-route A/B; they want one page that wins.

**Success looks like:** A 30-second scroll-through of `/` on a fresh browser, with the user nodding the whole way through. No hydration errors. No stale visuals. No "this part is mess" feedback.

---

## 2. Project context (read this fully before touching code)

- **Repo:** `/Users/jenyafutrin/workspace/claude_projects/hack_nation_5`
- **Branch:** `main` (single-branch hackathon discipline — do NOT create feature branches)
- **Stack (LOCKED, do not add deps without explicit user approval — CLAUDE.md hard rule #5):**
  - Next.js 15 App Router on Node 20
  - TypeScript only (no Python services)
  - Tailwind v4 with `@theme` + `tailwind.config.ts` for shadcn compatibility
  - shadcn/ui primitives + Lucide icons
  - Vercel AI SDK (`ai` package) — for Phase 2 backend, not landing
  - Tavily SDK — for Phase 2 backend
  - **lottie-react@2.4.1** — already installed, used by `<LottieAccent />` on /v2
- **Hosting:** Vercel free tier, auto-deploys on push to main, production at `https://sextant-uekv.vercel.app`
- **Dev server:** `tmux attach -t dev` to view (already running at localhost:3000); `npm run dev` to start fresh in a new tmux session named `dev`
- **Git status when handing off:** clean working tree, ~28 commits ahead of origin/main, none pushed (per user instruction)

### Locked design tokens (do NOT propose palette changes)

| Token | Hex | Use |
|---|---|---|
| Forest green | `#0F4C3A` | Primary brand, ink, agent dots, citations |
| Clay rust | `#B85C38` | Secondary, novel-finding highlights, corrections |
| Warm off-white | `#FAFAF7` | Page background |
| Ink | `#1A1A1A` | Body text |
| Border | `rgba(15, 76, 58, 0.12)` | Card edges |

Typography: Inter / Inter Tight (display) / Geist Mono. 6px card radius. Single 1px doc shadow. **No glassmorphism, no neumorphism, no neon, no SaaS gradients** — except the cinematic-hero variant on /v2 which is intentionally dark glass.

### Hard rules from project CLAUDE.md

1. **No claim without a verifiable URL citation** — every reagent, catalog #, protocol step in any generated plan must link to a real source. Surface "source not found" rather than confabulate.
2. **Use Fulcrum brief's verbatim 4 hypotheses** as demo inputs. ✅ Already done by main GSD chat (commit `1988e41`). DO NOT modify `src/lib/example-hypotheses.ts`.
3. **Phase 7 cut-off:** if learning loop not wired by hour 18, fall back to manual before/after slide. (Out of scope for landing.)
4. **TypeScript only.** No Python.
5. **No new deps without explicit user approval.** lottie-react is already approved. Anything else: ask.
6. **No DB.** JSON files in `public/` and `src/lib/` only.
7. **Don't deviate from `CLAUDE_DESIGN_BRIEF.md` design tokens** without explicit sign-off.

---

## 3. Current state of the four routes

Run `npm run dev` if dev server isn't up. All routes should return 200.

| Route | What's there now | User feedback |
|---|---|---|
| `/` | Cinematic video hero (real lab footage at `public/hero.mp4` with a posterize SVG filter for cel-shaded look) + below-fold sections | "Video is still video, not cartoon as in example. I don't like it." |
| `/v1` | Same below-fold sections, but hero is a live in-browser video→ASCII rendering of `public/hero.mp4` (Canvas API at ~24 FPS) | "/v1 ASCII look IS what I want." Standalone, keep as-is. |
| `/v2` | Hand-drawn SVG lab scene (researcher silhouette at desk, animated page-flip notebook, beaker, lamp, idea bubbles) + Lottie accent (orbiting clay dot, scaling forest ring, pulsing center dot from `public/researcher.json`) | Was just built; user has not yet evaluated. |
| `/app` | Dashboard placeholder shell (chat panel + 4-bar agent loader + 6-row validation skeleton). Phase 1 close artifact. | Deferred to Phase 2 — leave alone. |

### Known issues at handoff time

1. **Hydration mismatch on /** when the dev server's HMR cache is out of sync with the browser bundle. Fixed by `tmux kill-session -t dev && rm -rf .next/cache && tmux new-session -d -s dev 'npm run dev'` then a hard-refresh (Cmd+Shift+R). If you see a hydration error, do this before assuming a code bug.
2. **Browser cache often serves stale JS** during rapid iteration. After every code change, hard-refresh.

---

## 4. Decisions the user wants you to lock

The user is done picking between video-on-/ vs ASCII-on-/. They want ONE direction. The hint they keep giving: ASCII on /v1 is what they like. Pivot accordingly.

### Decision 1: Make ASCII the hero on /

**Recommended action:** copy the `<LandingHero />` + `<VideoAscii />` arrangement from `/v1` onto `/`, replacing `<CinematicHero />`. Park the cinematic variant at `/v2` (or delete it entirely if you can confirm with screenshots that nobody likes it). The current /v2 SVG-cartoon variant can also be parked as `/v3` if the user wants to keep an alternate, or deleted.

**Critical:** the existing `<LandingHero />` puts ASCII in the right column with a hero text panel on the left. The user has also asked whether ASCII could be a **full-bleed background**. Test BOTH visually:
- Variant A: current side-by-side (text left, ASCII right) — already implemented
- Variant B: ASCII as full-bleed background, text overlaid — needs a new arrangement

Take screenshots of both. Decide which reads better. If ambiguous, default to Variant A (lower risk, already polished).

### Decision 2: Pick a better video for the ASCII source

The current `public/hero.mp4` is generic lab footage. The user has repeatedly asked for **a clean-subject clip — scientist + book/research, single subject, minimal background distraction**.

**Sourcing options (in order of preference):**
1. Ask the user to drop a file at `public/hero.mp4` (replacing the current one). Cleanest path.
2. Search Pexels / Pixabay / Coverr for clips matching:
   - "scientist writing notebook"
   - "researcher reading paper"
   - "lab notebook flipping"
   - "scientist at desk"
   The constraint: **download the file to `public/hero.mp4`** (do NOT hotlink — Pexels/Pixabay/Mixkit return 403 on cross-origin video requests). Use `curl` to download.
3. If no good clip found, keep the current one — it's not blocking.

**File format:** MP4, H.264, ≤10MB ideally, 1080p or 720p, no audio (will be muted anyway).

### Decision 3: Choose final disposition of /v2

If you pick ASCII as the hero on /, the current /v2 (SVG cartoon + Lottie) becomes redundant. Options:
- Keep at /v2 as a backup variant
- Delete /v2 entirely + the components (cleanest)
- Move ASCII variant to /v2 as parking lot

User preference signal: they've been pushing for ONE direction. Default to deletion if not requested.

---

## 5. Specific Playwright tasks

Run these in order. Take a screenshot after each interactive step. Save screenshots to `.playwright-screenshots/<step-id>.png` (create the dir first).

### Phase A — Inventory the current state (no code changes yet)

1. **Navigate to localhost:3000** and screenshot the full hero of /. Look for: hydration errors in console, video playing, cartoon filter actually visible, headline reading "From hypothesis to fundable plan in three minutes."
2. **Scroll through / slowly** (`page.evaluate(() => window.scrollBy(0, 100))` repeated, screenshotting each section). Verify:
   - Hero fades + video does ken-burns drift on scroll
   - Problem section reveals on intersection
   - Method section: 4 agents in radial layout, central plan card
   - **Hover over `.l-solve-stage`** and move the mouse — confirm the 4 agent nodes drift relative to pointer (radial parallax)
   - Closed-loop section: 3 cards with arrows between them
   - **Slow-scroll past `.l-loop-canvas`** — confirm the arrows draw progressively as you scroll (stroke-dashoffset bound to scroll-progress)
   - Tech strip: 4 brand wordmarks (Anthropic stripe-A, Gemini sparkle, Tavily lens-with-dot, Vercel triangle). Hover each — confirm icon turns forest green, text shifts up 1px
   - Final CTA + footer
3. **Click each nav anchor** (Problem / Method / Lab rules / Open Sextant). Confirm smooth-scroll behavior, NOT instant teleport. The brand logo top-left should also smooth-scroll back to top.
4. **Repeat 1-3 on /v1** and /v2. /v1 should show live ASCII rendering of the video (look for the `<pre>` filling with `#@%*+=` characters animating).
5. **Repeat 1-3 on /v2** — confirm: no real video element, hand-drawn SVG scene with animated parts (page-flip, head-bob, lamp-flicker, idea-rise), Lottie accent in bottom-right showing orbiting dot.
6. **Open dev console on each route** — log any errors, warnings, hydration mismatches. Especially look for:
   - "Hydration failed because..." (cache issue, run the cache-clear sequence)
   - "Lottie" or "lottie-web" warnings (means the JSON might be malformed)
   - "404" on any asset

### Phase B — Lock the hero direction

7. **If user is reachable**, ask via AskUserQuestion (or equivalent): "Pick one: (a) ASCII side-by-side hero on /, (b) ASCII full-bleed background hero on /, (c) keep cinematic video on /."
8. **If user is unreachable**, default to (a): copy the /v1 hero arrangement onto /. Specifically:
   - Edit `src/app/page.tsx`:
     - Remove imports of `CinematicHero` and `CustomCursor`
     - Remove import of `cinematic-hero.css`
     - Add imports: `LandingNav`, `LandingHero`
     - Replace `<CinematicHero />` with `<LandingNav />` then `<LandingHero />` inside main
   - Test: navigate to /, confirm headline, ASCII renders in the right column
9. **If user picks (b) full-bleed**, build a new component `<AsciiBackgroundHero />`:
   - Stretches `<VideoAscii />` to absolute fill `inset:0` of a 100vh hero
   - Applies low-opacity scrim + headline text overlaid centered
   - See `src/components/landing/cinematic-hero.tsx` for the layering pattern (header > backdrop > scrim > stage)

### Phase C — Source a better video (only if user OKs)

10. **If user signs off on swapping the video**, search for a clean-subject clip:
    - Try `curl -sL --max-time 30 -o public/hero-candidate.mp4 "<URL>"` for various Pexels/Coverr URLs
    - If 403, fall back: ask the user to drop a file
11. **A/B test with the new clip** by swapping `public/hero.mp4` and reloading. Screenshot the ASCII rendering with each. Pick the one where the silhouettes read clearly in the dark→light density ramp ` .,:;-=+*#%@`.

### Phase D — Polish pass

12. **Visual diff** the locked variant against the rest of the landing. Look for:
    - Typography hierarchy holds (display vs body vs caption)
    - Spacing rhythm (sections at consistent vertical rhythm)
    - Color usage stays in the locked palette
    - Animations don't compete (only one thing should be doing the heavy lift at any scroll position)
13. **Mobile** — set viewport to 375×812 (iPhone) and 390×844 (iPhone Pro). Screenshot every section. Confirm:
    - Hero collapses to single column
    - Method radial reflows (the existing CSS at `@media (max-width: 720px)` handles this — verify it works)
    - Closed-loop arrows rotate 90° (vertical layout) — already in CSS, verify
    - Tech strip wraps cleanly
14. **Accessibility** — run an axe-core or Lighthouse a11y check. Flag any contrast failures, missing labels, or motion violations.
15. **Performance** — Lighthouse perf check on /. Target: LCP < 2.5s, no layout shifts, video doesn't block.

### Phase E — Final sign-off

16. **Commit** changes atomically (one per logical change). Use the commit message style from existing log: `feat(landing): ...` or `fix(landing): ...`. Do NOT push (user instruction).
17. **Run typecheck:** `npx tsc --noEmit`. Must be clean.
18. **Run linter** if configured: `npm run lint`. Must be clean.
19. **Update `.planning/STATE.md`** Last activity entry with what shipped.
20. **Report back to the user with:**
    - Which hero direction was locked + why
    - Which screenshots support that decision (paths + 1-line description each)
    - Any remaining issues you couldn't fix
    - Whether to push (user's call)

---

## 6. File map

```
src/
  app/
    page.tsx                      # / — currently CinematicHero. Pivot target.
    v1/page.tsx                   # /v1 — LandingHero with VideoAscii. KEEPER.
    v2/page.tsx                   # /v2 — SvgCartoonHero. May be deleted.
    app/                          # /app dashboard placeholder. Don't touch.
    api/
      health/route.ts             # /api/health — leave alone

  components/
    landing/
      landing.css                 # SINGLE SOURCE OF TRUTH for landing styles
      cinematic-hero.css          # cinematic + cartoon namespaces
      landing-observers.tsx       # client orchestrator for ALL scroll/anchor/parallax behaviors
      hero.tsx                    # /v1 hero (ASCII variant) — the keeper
      cinematic-hero.tsx          # / current hero — likely to retire
      svg-cartoon-hero.tsx        # /v2 hero — may retire
      lottie-accent.tsx           # /v2 Lottie wrapper with SVG fallback
      video-ascii.tsx             # the live video→ASCII renderer
      magnetic.tsx                # magnetic-hover wrapper (used on primary CTA)
      custom-cursor.tsx           # dot+ring cursor with mix-blend-mode: difference
      lab-notebook.tsx            # PARKED — earlier ASCII attempt, not used
      sextant-mark.tsx            # the logomark SVG
      problem.tsx                 # below-fold section 1
      method.tsx                  # below-fold section 2 (radial parallax target)
      closed-loop.tsx             # below-fold section 3 (scroll-arrow target)
      tech-strip.tsx              # brand wordmarks row
      final-cta.tsx               # below-fold section 5
      site-footer.tsx             # below-fold footer
      example-chips.tsx           # hypothesis quick-pick chips (DO NOT MODIFY)

  lib/
    example-hypotheses.ts         # DO NOT MODIFY — verbatim Fulcrum brief 4
    env.ts                        # env loader; read from `@/lib/env`
    litqc.ts                      # Phase 2 backend, owned by main GSD chat

public/
  hero.mp4                        # primary lab video (~6MB) — swap candidate
  cine-filter.svg                 # SVG posterize filter (used by /, /v2 if cinematic stays)
  researcher.json                 # hand-authored Lottie used by LottieAccent
  sextant-logomark.svg            # design asset
  sextant-wordmark.svg            # design asset

.planning/
  STATE.md                        # phase + execution status (cross-chat shared)
  ROADMAP.md                      # 8-phase plan
  PROJECT.md                      # vision, decisions
  config.json                     # GSD config
  handovers/
    landing-polish-HANDOVER.md    # original scope of this work-stream
    landing-polish-HANDOFF.json   # earlier machine-readable state
    landing-polish-CONTINUE.md    # earlier human-readable state
    playwright-iteration-HANDOVER.md  # ← THIS DOCUMENT
```

---

## 7. Constraints & gotchas

- **The dev server is in a tmux session named `dev`.** `tmux attach -t dev` to view, Ctrl+b then d to detach. Logs scroll there.
- **Turbopack HMR caches aggressively.** If you see "this didn't take effect", restart the server: `tmux kill-session -t dev && rm -rf .next/cache && tmux new-session -d -s dev 'npm run dev'`.
- **Hot-link blocked CDNs:** Pexels, Pixabay, Mixkit all return 403 on cross-origin `<video src=>`. Always download to `public/`.
- **Safari hydration mismatches** on inline `<svg width="0" height="0">` with only `<defs>`. The cinematic posterize filter sidesteps this by living at `public/cine-filter.svg` and being referenced from CSS via `filter: url(...)`. Don't undo that.
- **CSS `scroll-behavior: smooth`** respects `prefers-reduced-motion` which most macOS users have on. The smooth-scroll on nav clicks is implemented in JS in `landing-observers.tsx` to bypass this. Don't replace it with the CSS version.
- **Animation gating:** every keyframe animation in `landing.css` and `cinematic-hero.css` has a `@media (prefers-reduced-motion: reduce)` block. Preserve this when adding new animations.
- **Magic MCP and Playwright skills:** the previous Claude Code session DID NOT have Playwright installed. You do. Use it.

---

## 8. Reporting format

When done, write a single markdown file at `.planning/handovers/playwright-iteration-RESULT.md` with this structure:

```markdown
# Playwright iteration result

**Time spent:** <duration>
**Direction locked:** <one sentence>
**Verdict:** ship / polish more / blocked

## Screenshots
- [route] [phase] [path-to-png] — <1-line description>

## Decisions taken
1. ...

## Code changes
- `<file>` — <summary>
- ...

## Open issues
- <issue> — <severity>

## Recommended next steps
1. <action> — <owner> — <reason>
```

Then commit it. The user reads this when they come back.

---

## 9. Things explicitly OUT of scope

- Phase 2 backend work (literature QC streaming, Tavily wiring, Gemini calls). Owned by another chat. Do not touch `src/lib/litqc.ts`, `src/app/api/qc/**`, anything in `src/server/qc/**`.
- The dashboard at `/app`. Phase 2 territory. Polish later.
- Adding new npm dependencies beyond what's in `package.json`. Hard rule #5.
- Replacing the locked design tokens. Hard rule.
- Pushing to remote. User decides when to push.

---

## 10. If something blocks you

- **User is unreachable + decision needed:** default to the conservative path (smaller change, lower risk, already-validated direction).
- **Build breaks:** roll back the offending commit (`git reset --soft HEAD~1`), fix, re-commit.
- **Visual ambiguity:** screenshot both options side-by-side and post both. Don't pick blindly.
- **Doubt on hard rule:** read the project `CLAUDE.md` and the global `~/.claude/CLAUDE.md`. They're authoritative.

Good luck. The user is sharp and direct — write back terse, with screenshots, and commit your work atomically.
