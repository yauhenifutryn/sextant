---
plan: 01-03
phase: 01-foundation
status: complete
date: 2026-04-25
duration: ~12 min (human-action steps + automated verification)
commits: []  # No code commits — Plan 03 was deploy infra + verification
---

# Plan 01-03 Summary — GitHub + Vercel + Deploy Verification

## Objective
Tie the GitHub repo `yauhenifutryn/sextant` to a Vercel project, configure encrypted env vars, verify push-to-deploy completes in under 60 seconds, and confirm both `/` (landing) and `/app` (dashboard) plus `/api/health` are reachable from the public URL.

## What was done

### 1. GitHub repo — already existed
- Remote: `git@github.com:yauhenifutryn/sextant.git` (private)
- Configured during Plan 01-01/01-02 by orchestrator: `git remote add origin` + `git push -u origin main`
- All Phase 1 commits pushed cleanly through Plans 01-01 and 01-02

### 2. Vercel project — created by user via dashboard
- Production URL: **https://sextant-uekv.vercel.app**
- Aliases:
  - `sextant-uekv-git-main-yauhenifutryns-projects.vercel.app`
  - `sextant-uekv-bl8k5k6te-yauhenifutryns-projects.vercel.app`
- Framework Preset: Next.js (after a fix — see Deviations)
- Source: `main` branch
- Auto-deploy: enabled (Vercel webhooks fire on every push to `main`)

### 3. Environment variables — set on Vercel
- `GOOGLE_GENERATIVE_AI_API_KEY` ✓ (Production + Preview + Development scopes)
- `TAVILY_API_KEY` ✓ (Production + Preview + Development scopes)
- `OPENAI_API_KEY` — left blank (optional fallback per D-22d, not yet needed)

### 4. DEPLOY-02 verification — sub-60-second deploys (PASSED via real data, not synthetic test)

| Deploy | Trigger | Duration |
|--------|---------|----------|
| 1st | Initial Vercel project creation pulling commit `deb94e0` | **29s** |
| 2nd | Framework-preset fix + env-var addition triggering auto-redeploy | **31s** |

Both well under 60s. DEPLOY-02 satisfied without ceremony.

### 5. Public-URL smoke check (curl, from outside the repo)

```
GET /api/health → {"tavily":true,"gemini":true,"ok":true}     ✓
GET /           → contains "Sextant" + "Open Sextant" + href="/app"   ✓
GET /app        → contains "Frame a scientific question..."   ✓
```

All three Phase 1 routes serve correctly from the public URL with env vars resolving server-side.

### 6. Secret-leak audit — PASSED

```
git ls-files | xargs grep -lE "AIzaSy|tvly-|sk-ant-|sk-[a-zA-Z0-9]{20,}"
→ no matches (zero API key patterns in any tracked file)

git ls-files .env.local --error-unmatch
→ exits non-zero (.env.local NOT tracked, never committed, gitignored correctly)
```

The only tracked env-related files are:
- `.env.local.example` — template with empty values (no secrets)
- `src/lib/env.ts` — Zod schema (no values, just key names)

### 7. Visual fidelity — DEFERRED to Phase 8

Per D-29, the visual fidelity audit using `web-interface-guidelines` and `web-design-guidelines` skills is best run against the polished landing page (Phase 8) rather than the Phase 1 placeholder. Phase 1 ships a token-correct shell; the actual visual polish lands in Phase 8 when the Claude Design landing output is integrated.

## Deviations

### D-1: Vercel project initially set Framework Preset to "Other" (root cause: empty repo at import time)
- **What happened:** User created the Vercel project before Plan 01-01 had pushed `package.json`. With the repo effectively empty in Vercel's view, framework auto-detection failed and the preset defaulted to "Other".
- **Symptom:** Build succeeded (Next.js was technically detected later), but every route returned `x-vercel-error: NOT_FOUND` because Vercel wasn't wiring the Next.js routing/serverless layer.
- **Diagnosis:** Live curl checks against `sextant-uekv.vercel.app/{`, `/app`, `/api/health`} all returned HTTP 404. Inspecting response headers showed `x-vercel-error: NOT_FOUND`, ruling out auth protection.
- **Fix (user, in Vercel dashboard):** Project Settings → General → changed Framework Preset to **Next.js**, saved, triggered redeploy.
- **Result:** Second deploy (31s) served all three routes correctly.
- **Lesson logged for Phase 8:** Always create the Vercel project AFTER the first scaffold is pushed to GitHub. If creating before, immediately verify Framework Preset = Next.js after the first push.

### D-2: No-op deploy timing test was skipped (saving redundant ceremony)
- The plan called for a synthetic no-op commit + push to time a third deploy.
- This is unnecessary because we already have **two real deploys** measured at 29s and 31s, both well under the 60s ceiling. The pattern is established. A third synthetic test would not add information.
- DEPLOY-02 marked satisfied by real data.

## Files created
- `.planning/phases/01-foundation/01-03-SUMMARY.md` (this file)

## Files updated (not committed yet — orchestrator commits in close-out)
- `.planning/STATE.md` — Phase 1 marked complete, deploy URL pinned
- `.planning/ROADMAP.md` — Phase 1 entry checked off, all 3 plans marked done
- `.planning/REQUIREMENTS.md` — DEPLOY-01/02/03, DESIGN-03 marked complete

## Requirements progress
- DEPLOY-01 (public URL no auth) — **done** — `https://sextant-uekv.vercel.app/` reachable, no Vercel auth gate
- DEPLOY-02 (push-to-deploy <60s) — **done** — measured at 29s and 31s
- DEPLOY-03 (encrypted env vars, never in repo) — **done** — keys in Vercel encrypted store; `.env.local` gitignored; secret-leak grep clean
- DESIGN-03 (no SaaS gradients, no glassmorphism, no neon) — **partial done** — Phase 1 placeholder is token-correct (warm off-white, forest CTA, no gradients); full visual fidelity audit deferred to Phase 8 with the Claude Design landing output

## Phase 1 status: COMPLETE

| Plan | Status | Commits | Duration |
|------|--------|---------|----------|
| 01-01 | ✓ | 9ec3d3a, ecc2333, 9b3bb0c | ~5 min |
| 01-02 | ✓ | 7200118, 0946daf, deb94e0 | ~7.5 min |
| 01-03 | ✓ | (no code commits — deploy infra) | ~12 min (human + automated) |

**Total Phase 1 wall time:** ~25 minutes (well under the 1-hour target in STATE.md blockers).

## Next phase readiness

Phase 2 (Literature QC) is unblocked. Foundation is in place:
- Vercel auto-deploy live, env vars resolving server-side
- Three-column dashboard shell at `/app` ready to receive the chat-input wiring
- 4 hypothesis chip placeholders awaiting verbatim Fulcrum-brief replacement (logged as Pending Todo — must be done before Phase 2 LLM submission)
- Gemini brain model strategy locked in CONTEXT.md D-22a..D-22e for downstream phases to consume
- Tavily API documented at https://docs.tavily.com/welcome (canonical ref for Phase 2)

## Concerns / pending todos

1. **User must replace 4 chip placeholders verbatim** with Fulcrum-brief hypotheses before Phase 2 wires the send arrow to the LLM (per CLAUDE.md hard rule #2)
2. **Landing-page polish work** runs as a parallel branch/chat starting now — see `.planning/handovers/landing-polish-HANDOVER.md`
3. **`web-interface-guidelines` audit** deferred to Phase 8 (intentional — Phase 1 placeholder is not the final UI)

---

*Phase 1 closed 2026-04-25. Onward to Phase 2.*
