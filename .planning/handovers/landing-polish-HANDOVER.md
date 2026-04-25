# Handover: Landing-page Polish (parallel work-stream)

**For:** A new Claude Code chat dedicated to polishing `https://sextant-uekv.vercel.app/`
**Created:** 2026-04-25 after Phase 1 complete
**Estimated effort:** 2-4 hours
**Runs in parallel with:** Phase 2 (Literature QC) work in the main GSD chat — different files, no merge conflicts

---

## Why this is its own chat

The landing page is **independent UI work**:
- Touches only `src/app/page.tsx` and a new `src/components/landing/*` directory
- Does NOT touch `src/app/app/**` (that's the dashboard, where Phase 2-7 build)
- Does NOT touch `src/lib/litqc.ts`, `/api/qc`, agent pipeline, or any backend route
- Does NOT touch `src/lib/env.ts`, `src/app/layout.tsx`, or any shared infrastructure

Because file paths don't overlap, a separate chat working on landing in parallel cannot cause merge conflicts with the main GSD chat working on Phase 2. Both can push to `main` independently.

The main GSD chat (Phase 2+) should NOT touch `src/app/page.tsx` while this landing work is in flight.

---

## What's already in place (Phase 1 baseline)

Read these first to ground yourself:

- `https://sextant-uekv.vercel.app/` — current placeholder landing (deployed, working)
- `src/app/page.tsx` — current implementation (Server Component, no animations, just wordmark + tagline + CTA)
- `src/app/layout.tsx` — root layout with `<Toaster />` mounted; do NOT add per-route layouts here
- `src/app/globals.css` — tokens already wired (warm off-white #FAFAF7, forest green #0F4C3A, clay rust #B85C38, Inter / Inter Tight / Geist Mono)
- `tailwind.config.ts` (v3-mirror via `@config` directive) — exposes friendly aliases: `bg-paper`, `text-ink`, `text-forest`, `bg-clay`, `font-display`, `font-mono`, `shadow-doc`
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `src/components/ui/button.tsx` — shadcn Button (already installed)

The dashboard at `/app` is unrelated to your work. Don't touch it.

---

## Goal

Replace the Phase 1 landing placeholder at `src/app/page.tsx` with a polished, animated landing page that:
1. Integrates the **Claude Design output** the user generated in parallel (the user will paste the output in this new chat)
2. Adds a **calm ASCII-art animation in the background** (Firecrawl-style — see references below)
3. Honors the design brief tokens (no SaaS gradients, no glassmorphism, no neon)
4. Hits 90+ Lighthouse on Performance, Accessibility, Best Practices
5. Respects `prefers-reduced-motion` (ASCII bg pauses or stops for users who request reduced motion)
6. Stays under 200KB JS payload after gzip on the landing route

## Sections the landing must contain (final shape)

Drawing from `CLAUDE_DESIGN_BRIEF.md` "Inspiration boards" (Future House, Lila Sciences, Linear, Anthropic.com) and the design brief addendum the user fed to Claude Design:

1. **Hero (full-viewport):** Sextant logomark/wordmark, tagline "From hypothesis to fundable, citation-grounded experiment plan in three minutes.", primary CTA "Open Sextant" → `/app`
2. **Problem section:** one-liner about contract research being slow + expensive + ungrounded
3. **Solve section:** 4-agent visualization (Researcher / Skeptic / CRO Operator / Compliance) animating into formation as the user scrolls
4. **Closed-loop section:** visual showing correction → typed lab rule → applied to next plan
5. **Tech credibility strip:** Gemini, Tavily, Vercel wordmarks (small, monochrome)
6. **Footer:** secondary CTA + minimal links

Animations: scroll-triggered, 200ms ease-out / 400ms spring (per brief §"Motion"). Calm. No bounce.

---

## ASCII-art background — the unique design move

Firecrawl's site (`firecrawl.dev`) has a calm, slow-cycling ASCII pattern in the background that's both a visual signature and quietly reinforces the "computational" identity. We want the same vibe — but lab-flavored.

### Reference repos

1. **https://github.com/CameronFoxly/Ascii-Motion** — Full-fledged React-friendly ASCII animation editor with timeline-based motion. **Don't pull this as a dependency.** Use it to study:
   - How they sample characters from a density gradient
   - How they handle frame-by-frame transitions
   - Their character set choices for different visual textures
   - Their handling of `requestAnimationFrame` + visibility-based pause

2. **https://github.com/chenglou/pretext** — Minimalist text-art tool by Cheng Lou. **Don't pull as dep.** Useful as a reference for:
   - Lightweight, dependency-free ASCII rendering patterns
   - How to keep file size tiny

### Direction (the actual design call)

Build a **single self-contained `<AsciiBackdrop />` Client Component** at `src/components/landing/ascii-backdrop.tsx`. It should:

- Render a fixed-position `<canvas>` (or absolute-positioned `<pre>` of monospace chars) covering the viewport, behind everything else (`z-0` with hero content at `z-10+`)
- Use a sparse character density (low alpha / pale `text-ink/15` color so it doesn't compete with the hero text)
- Animate at ~12-15 FPS (slow, calm — NOT 60 FPS — saves CPU and matches the lab aesthetic)
- Cycle through patterns: drifting dots → faint connection lines → constellation → repeat. Cycle period ~30-60 seconds.
- Pause when:
  - `prefers-reduced-motion: reduce` is set (use `window.matchMedia`)
  - The page tab is hidden (use `document.visibilityState`)
  - The user is on the small-viewport breakpoint (mobile — just show a static last-frame snapshot)
- Be NO MORE than ~150 lines of TypeScript. If it's growing past that, simplify the pattern.
- Use a character set drawn from: `· : ⋅ ∘ ∙ ⊙ ◌ ◯` (light density) and `· − | / \ + ×` (medium density). Avoid heavy block chars (`█ ▓ ▒ ░`) — too "gamer terminal", wrong vibe.

### Aesthetic anchors for the ASCII pattern

- **Looks like:** scientific instrument noise, sparse lab-bench measurement dots, a constellation map
- **Does NOT look like:** gamer terminal, hacker matrix rain, glitch effect, retro CRT, brutalist
- Color: forest-green ink at 10-15% opacity over the warm off-white background. Single-tone. No gradients.
- Density: ~5-8% of the visible area is "lit" at any moment. Sparse > dense.

### Performance budget

- ASCII backdrop must NOT block first paint. Render the hero text first; the backdrop fades in after `requestIdleCallback` or after a 200ms `setTimeout`.
- Total landing JS payload (including the ASCII component) must stay under 200KB gzipped.
- Lighthouse Performance score ≥ 90 on a throttled mobile test.

---

## How to start (in the new Claude Code chat)

Paste this paragraph as your opening message:

> I'm working on the landing page for Sextant (an AI experiment-plan generator) at `/Users/jenyafutrin/workspace/claude_projects/hack_nation_5/`. Read `.planning/handovers/landing-polish-HANDOVER.md` first — it has the full brief, the ASCII-art ambition, the file boundaries (touch only `src/app/page.tsx` and `src/components/landing/**`), and what's already in place from Phase 1. Use the `frontend-design`, `vercel-react-best-practices`, and `web-interface-guidelines` skills. After you've read the handover, I'll paste the Claude Design output for the landing page and we'll port it section-by-section.

Then in that chat, you should:

1. Read this handover end-to-end
2. Read the files referenced under "What's already in place"
3. Ask the user to paste the Claude Design output
4. Plan the port section-by-section (use `superpowers:writing-plans` skill if the work fans out)
5. Build `<AsciiBackdrop />` first as a self-contained component you can iterate on at `localhost:3000/`
6. Port the Claude Design hero next, wiring it on top of the backdrop
7. Iterate locally with `npm run dev` against `localhost:3000/` until it matches the design
8. Commit each section as a separate atomic commit (e.g. `feat(landing): ascii backdrop`, `feat(landing): hero section`, `feat(landing): solve section`)
9. Push to `main` — Vercel auto-deploys (each push redeploys in ~30s based on Phase 1 timings)
10. Run `web-interface-guidelines` skill audit before declaring done
11. Verify Lighthouse score on the deployed URL

## What you should NOT touch from this chat

- `src/app/app/**` — that's the dashboard, the main GSD chat is working there
- `src/app/api/**` — backend routes
- `src/lib/env.ts`, `src/lib/utils.ts` — shared infrastructure
- `src/lib/example-hypotheses.ts` — owned by the main GSD chat (Phase 2 will replace placeholders)
- `src/app/globals.css` (more than minor additions for landing-specific keyframes — coordinate with main chat if you need to add tokens)
- `tailwind.config.ts` — coordinate with main chat if you need new aliases
- Any file under `.planning/phases/02*` or higher — that's Phase 2+ work in the main chat
- `package.json` — minimize new deps. If you absolutely need one (e.g., a deeply specific animation lib), ask the user before adding. Goal: keep total dep tree lean for the demo.

## Constraints inherited from project CLAUDE.md and CLAUDE_DESIGN_BRIEF.md

- TypeScript only
- No backend logic, no LLM calls, no Tavily calls on the landing page (it's marketing — don't even import `env.ts`)
- Aesthetic must NOT include: SaaS gradients, glassmorphism, neon, retro CRT, glitch effects, "AI startup" clichés
- WCAG AA contrast minimum
- Keyboard reachable (the "Open Sextant" CTA must be focusable; ASCII backdrop must NOT trap focus)
- `prefers-reduced-motion` respected

## Done definition

- [ ] Claude Design output ported to `src/app/page.tsx` + components in `src/components/landing/**`
- [ ] `<AsciiBackdrop />` deployed and visibly running on the landing page
- [ ] Reduced-motion preference respected (test by toggling OS setting)
- [ ] Mobile breakpoint shows static last-frame snapshot (no animation)
- [ ] Lighthouse Performance ≥ 90 on `https://sextant-uekv.vercel.app/`
- [ ] Lighthouse Accessibility ≥ 95
- [ ] `web-interface-guidelines` skill audit passes
- [ ] All animations use Framer Motion (already in stack), not custom hand-rolled motion
- [ ] No new shadcn components added unless absolutely necessary (we have button + we can ship without more)
- [ ] PR/branch merged to `main` (or pushed direct to main per current hackathon git flow)

## Coordination with the main GSD chat

When you're done, message the main chat (in your other Claude Code session): "Landing polish complete. Phase 8 visual fidelity audit can run against deployed `/`."

If the main chat shipped a Phase 2/3 update during your work, you may need to `git pull --rebase` before pushing your final landing commits. The pull should be clean since file paths don't overlap.

---

*Generated by main GSD chat after Phase 1 complete. The landing-polish chat owns this document — feel free to update it with progress notes as you go.*
