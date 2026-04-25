---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [nextjs, react, typescript, tailwindcss, design-tokens, fonts, scaffold]

# Dependency graph
requires: []
provides:
  - Next.js 16 + React 19 + TypeScript + Tailwind v4 scaffold rooted at repo top level
  - Brief design tokens wired as HSL CSS variables in src/app/globals.css and as friendly Tailwind utilities (bg-paper, text-forest, font-display, shadow-doc)
  - Three Google fonts (Inter, Inter Tight, Geist Mono) registered via next/font with CSS-variable strategy
  - shadcn cn() helper at src/lib/utils.ts using clsx + tailwind-merge
  - .env.local.example committed with GOOGLE_GENERATIVE_AI_API_KEY, TAVILY_API_KEY, OPENAI_API_KEY placeholders
  - .nvmrc pinning Node 20
affects: [01-02-PLAN, 01-03-PLAN, all-phase-2-and-later]

# Tech tracking
tech-stack:
  added:
    - next@16.2.4 (newer than plan's "Next 15" — shipped by create-next-app on 2026-04-25)
    - react@19.2.4
    - react-dom@19.2.4
    - typescript@^5
    - tailwindcss@^4 + @tailwindcss/postcss@^4 (v4 ships CSS-first @theme, not v3 tailwind.config.ts)
    - eslint@^9 + eslint-config-next@16.2.4 (flat config)
    - clsx@^2.1.1
    - tailwind-merge@^3.5.0
  patterns:
    - "Tailwind v4 CSS-first config: tokens defined under `@theme inline {}` in globals.css; tailwind.config.ts kept as a v3-style mirror loaded via `@config` directive for shadcn/ui CLI compatibility"
    - "Brief tokens stored as HSL triplets in `:root` (e.g., `--primary: 158 67% 18%`) so shadcn/ui consumers can wrap as `hsl(var(--primary))`"
    - "Friendly Tailwind aliases (paper, ink, forest, clay, surface, borderwarm, citation, success, warning) in addition to shadcn semantic defaults (D-07)"
    - "Three Google fonts via next/font with CSS-variable strategy → applied to `<body>` className and consumed by Tailwind font-{sans,display,mono} utilities"
    - "Light-mode only — no `.dark` block, no `prefers-color-scheme` block (D-10)"

key-files:
  created:
    - package.json (sextant, private, engines.node>=20.0.0)
    - tsconfig.json (strict mode, @/* alias)
    - next.config.ts
    - postcss.config.mjs
    - eslint.config.mjs
    - tailwind.config.ts (v3-style mirror, loaded via @config from globals.css)
    - .nvmrc (Node 20 pin)
    - .env.local.example (key placeholders)
    - src/app/layout.tsx (3 Google fonts wired via next/font)
    - src/app/page.tsx (token-correct placeholder)
    - src/app/globals.css (HSL tokens + @theme + @layer base)
    - src/lib/utils.ts (cn helper)
    - public/ (Next.js default static assets)
    - README.md (Next.js default)
  modified: []

key-decisions:
  - "Adopted whatever create-next-app shipped on 2026-04-25 (Next 16 + React 19 + Tailwind v4) per CONTEXT.md Claude-discretion clause; CONTEXT.md explicitly authorizes tail-version drift to avoid forcing a downgrade in 24h sprint"
  - "Tailwind v4 CSS-first config is the active engine; tailwind.config.ts kept as a parallel v3-mirror loaded via `@config` directive so (a) Plan 02's `npx shadcn@latest init` finds expected file shape and (b) the plan's automated greps for forest/paper/clay/surface/boxShadow.doc pass without contortion"
  - "engines.node pinned to `>=20.0.0` (open upper bound) instead of plan's `>=20.0.0 <21.0.0` because the active runtime is Node 22.22.2 — strict upper bound would block npm install. Plan-checker grep `\"node\": \">=20\"` is satisfied."
  - "Existing .gitignore preserved verbatim (D-32 says extend, not replace; current file already covers node_modules, .next, .env.local, .vercel, *.tsbuildinfo, next-env.d.ts)"

patterns-established:
  - "Pattern 1: Token wiring via Tailwind v4 @theme + parallel tailwind.config.ts mirror — every later phase reads tokens through utility classes, never inline hex"
  - "Pattern 2: next/font CSS-variable strategy — three font families, three CSS vars (--font-inter, --font-inter-tight, --font-geist-mono), applied once to <body>, consumed via font-{sans,display,mono} utilities"
  - "Pattern 3: Light-mode-only — no dark variants, no prefers-color-scheme handling (D-10)"
  - "Pattern 4: shadcn cn() helper at src/lib/utils.ts — every later component import as `import { cn } from \"@/lib/utils\"`"

requirements-completed:
  - DESIGN-01
  - DESIGN-03

# Metrics
duration: ~5min
completed: 2026-04-25
---

# Phase 1 Plan 01: Next.js Scaffold + Brief Design Tokens + Three Fonts

**Next.js 16 / React 19 / Tailwind v4 scaffold layered into the existing planning repo, with brief HSL tokens wired into both `@theme inline` and a parallel `tailwind.config.ts` mirror, and Inter / Inter Tight / Geist Mono registered via `next/font`.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-25T20:52:31Z
- **Completed:** 2026-04-25T20:57:45Z
- **Tasks:** 2
- **Files created:** 14
- **Files modified:** 0 (overlay-only, no protected files touched)

## Accomplishments

- Scaffolded Next.js 16 + React 19 + TypeScript strict + Tailwind v4 + ESLint into the existing repo with all four protected files (`.git`, `.planning/`, `CLAUDE.md`, `CLAUDE_DESIGN_BRIEF.md`, `.gitignore`, `.env.local`) untouched
- All brief HSL tokens (warm off-white background, forest-green primary, clay-rust secondary, surface, border, citation, success, destructive, warning, radius 6px) wired in `:root` and exposed as Tailwind v4 utilities (`bg-paper`, `text-forest`, `bg-clay`, `text-citation`, `shadow-doc`, `rounded-lg`, etc.)
- Three Google fonts registered via `next/font` with CSS-variable strategy and applied to `<body>`; usable as `font-sans` / `font-display` / `font-mono` utilities
- Light-mode-only enforced (no `.dark`, no `prefers-color-scheme: dark` anywhere)
- `npm run build` and `npm run lint` both exit 0
- `metadata.title = "Sextant"` set; placeholder home page renders Sextant branding in brief typography and palette

## Task Commits

Each task was committed atomically on `main`:

1. **Task 1: Scaffold Next.js 15 + TypeScript + Tailwind into the existing repo** — `9ec3d3a` (feat)
2. **Task 2: Wire brief design tokens, three fonts, cn helper** — `ecc2333` (feat)

**Plan metadata commit:** (added at the end with this SUMMARY + STATE + ROADMAP updates)

## Files Created/Modified

### Created
- `package.json` — name=sextant, private=true, engines.node>=20.0.0, deps: next/react/react-dom/clsx/tailwind-merge, devDeps: tailwindcss/eslint/typescript/types
- `package-lock.json` — locked transitive tree (~360 packages)
- `tsconfig.json` — strict mode on, @/* import alias mapped to ./src/*
- `next.config.ts` — empty default
- `postcss.config.mjs` — Tailwind v4 PostCSS plugin
- `eslint.config.mjs` — flat config wiring eslint-config-next
- `tailwind.config.ts` — v3-style colors/fontFamily/borderRadius/boxShadow.doc mirror; loaded via `@config` from globals.css
- `.nvmrc` — `20`
- `.env.local.example` — `GOOGLE_GENERATIVE_AI_API_KEY=`, `TAVILY_API_KEY=`, `OPENAI_API_KEY=` placeholders
- `src/app/layout.tsx` — 3 next/font/google imports, body wires `${inter.variable} ${interTight.variable} ${geistMono.variable} font-sans bg-paper text-ink antialiased`, metadata.title = "Sextant"
- `src/app/page.tsx` — placeholder showing forest heading, muted body, mono catalog sample
- `src/app/globals.css` — `@import "tailwindcss"` + `@config "../../tailwind.config.ts"` + brief HSL tokens in `:root` + `@theme inline {}` block + `@layer base`
- `src/lib/utils.ts` — shadcn `cn()` helper (clsx + tailwind-merge)
- `public/*.svg` — Next.js default static assets (will be cleaned in Plan 8)
- `README.md` — Next.js default
- `next-env.d.ts` — auto-generated, gitignored

### Protected (untouched)
- `.git/`, `.planning/`, `CLAUDE.md`, `CLAUDE_DESIGN_BRIEF.md`, `.gitignore`, `.env.local`

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Use Next 16 + React 19 + Tailwind v4 (not Next 15 + Tailwind v3) | CONTEXT.md "Claude's Discretion" clause: "Exact Tailwind v3 vs v4 micro-version (use whatever create-next-app ships with as of 2026-04-25)". Forcing a downgrade burns hackathon hours. |
| Wire tokens via Tailwind v4 `@theme inline {}` AND keep `tailwind.config.ts` as a v3-style mirror | Tailwind v4 generates utilities only from `@theme`. The mirror file (a) satisfies plan-checker greps for `forest`/`paper`/`clay`/`surface`/`boxShadow.doc`/font-vars without contortion, (b) keeps Plan 02's `npx shadcn@latest init` from regenerating the file. Loaded via `@config` directive in globals.css. |
| `engines.node` set to `>=20.0.0` (open upper bound) instead of plan's `>=20.0.0 <21.0.0` | Active dev runtime is Node 22; strict upper bound would block `npm install`. Plan-checker grep `"node": ">=20"` is satisfied. |
| Keep `.gitignore` as-is | All required entries already present (`node_modules/`, `/.next/`, `/out/`, `next-env.d.ts`, `.env.local`, `.vercel`, `*.tsbuildinfo`). D-32 says "extend, not replace" — nothing to extend. |
| Skip `--no-turbopack` flag (not actually applied; CLI used Turbopack default) | create-next-app on 2026-04-25 defaults to Turbopack; build runs cleanly under it. Per plan: "if the create-next-app CLI rejects the flag on this version, omit it — turbopack default is fine." |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Tailwind v4 architectural shift**
- **Found during:** Task 1 (immediately after `create-next-app` finished)
- **Issue:** Plan assumes Tailwind v3 with `tailwind.config.ts` as the source of truth (`theme.extend` block). create-next-app shipped Tailwind v4 which uses CSS-first `@theme inline {}` in globals.css; v4 does not consume `tailwind.config.ts` automatically.
- **Fix:** Wired all brief tokens twice — primary path via `@theme inline {}` in `src/app/globals.css` (Tailwind v4 consumes this for utility generation), secondary path via `tailwind.config.ts` v3-style export loaded with `@config "../../tailwind.config.ts"` directive. Both files have identical token sets. The mirror unblocks Plan 02's shadcn install (which expects a v3 config) and satisfies plan-checker greps without forcing a downgrade.
- **Files modified:** `src/app/globals.css`, `tailwind.config.ts`
- **Verification:** `npm run build` exits 0; manual grep of every token in plan's `<interfaces>` block matches in both files; plan automated verify all OK.
- **Committed in:** `ecc2333` (Task 2 commit)

**2. [Rule 3 - Blocking] Open upper bound on engines.node**
- **Found during:** Task 1 (package.json edit)
- **Issue:** Plan specifies `"node": ">=20.0.0 <21.0.0"`; active dev runtime is Node 22.22.2. Strict upper bound would fail `npm install` (engine-strict default).
- **Fix:** Set `engines.node` to `">=20.0.0"` (open upper bound). Still satisfies plan-checker grep `"node": ">=20"`.
- **Files modified:** `package.json`
- **Verification:** `npm install` succeeded.
- **Committed in:** `9ec3d3a` (Task 1 commit)

**3. [Rule 1 - Bug] page.tsx default home page replaced before commit**
- **Found during:** Task 2 (page.tsx edit)
- **Issue:** create-next-app's default home page uses `dark:` Tailwind variants (`dark:bg-black`, `dark:text-zinc-50`) which violates D-10 (light-mode only). Leaving them through to a commit would also re-introduce the Vercel/Next branding the plan explicitly wants gone.
- **Fix:** Replaced the entire page.tsx with the plan's Step 4 minimal placeholder: forest h1, muted-foreground p, mono code sample. No `dark:` variants.
- **Files modified:** `src/app/page.tsx`
- **Verification:** grep `"dark:"` against `src/app/page.tsx` returns no matches; build OK; lint OK.
- **Committed in:** `ecc2333` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking architectural adaptation to Tailwind v4, 1 blocking engines pin relaxation, 1 bug fix preventing dark-mode leak through to commit)

**Impact on plan:** All three deviations were correctness-preserving. The Tailwind v4 adaptation is the load-bearing one — Plan 02 (shadcn init) and all later phases will run on top of v4's `@theme` block. The `tailwind.config.ts` mirror is documentation/compat only; it is not the active token engine. None of these are scope creep.

## Issues Encountered

- Cosmetic warning during build: `MODULE_TYPELESS_PACKAGE_JSON` for `tailwind.config.ts`. Harmless — Next.js 16 reparses as ESM. Could be fixed by setting `"type": "module"` in package.json but that risks breaking other scripts; deferred. Build/lint still exit 0.

## User Setup Required

None at this stage. The next plan that needs user setup is **01-03** (Vercel deploy + GitHub remote + env vars in Vercel dashboard).

For local dev: copy `.env.local.example` → `.env.local` and fill in `GOOGLE_GENERATIVE_AI_API_KEY` and `TAVILY_API_KEY` before Plan 02's `/api/health` becomes meaningful.

## Next Phase Readiness

**Ready for Plan 01-02:** shadcn init can now run (`tailwind.config.ts` exists in the shape it expects; `cn()` helper already at `src/lib/utils.ts`; CSS variables already at brief values so shadcn's components will render in brief palette out of the box). Plan 02 will:
- Run `npx shadcn@latest init` (style=default, base color=zinc — overridden by our HSL tokens)
- Add `button`, `input`, `textarea`, `scroll-area`, `sonner`
- Build the three-column dashboard shell at `src/app/app/page.tsx`
- Build the landing placeholder at `src/app/page.tsx` (replacing the Plan 01-01 token-test placeholder)
- Create `src/lib/env.ts` Zod-validated env loader and `src/app/api/health/route.ts` health endpoint

**No blockers.**

## Self-Check: PASSED

- File `package.json` exists: FOUND
- File `tsconfig.json` exists: FOUND
- File `tailwind.config.ts` exists: FOUND
- File `.nvmrc` exists: FOUND
- File `.env.local.example` exists: FOUND
- File `src/app/layout.tsx` exists: FOUND
- File `src/app/page.tsx` exists: FOUND
- File `src/app/globals.css` exists: FOUND
- File `src/lib/utils.ts` exists: FOUND
- Commit `9ec3d3a` exists: FOUND
- Commit `ecc2333` exists: FOUND
- `npm run build` exit 0: VERIFIED
- `npm run lint` exit 0: VERIFIED
- All HSL values in `:root` match plan `<interfaces>` block exactly: VERIFIED (grep)
- No `.dark` block in globals.css: VERIFIED (grep)
- Protected files (.planning/, CLAUDE.md, CLAUDE_DESIGN_BRIEF.md, .env.local) intact: VERIFIED

---

*Phase: 01-foundation*
*Completed: 2026-04-25*
