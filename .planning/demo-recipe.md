# Sextant Demo Recipe (Phase 8 recording reference)

> **Read this BEFORE recording the 60-second demo video.** Two non-negotiable steps: cache-warm the four hypothesis chips, and confirm the trace rail demo-pace toggle is set. Without both, the recording either takes too long or the agents flash done in 100ms and look fake.

## Why this exists

Phase 3 ships a 4-agent pipeline that completes in ~30-45 seconds on a fresh run. The demo budget is 60 seconds total — the system can't finish the full closed loop (lit-QC + plan + correction + propagation) in that window unless caches are pre-warmed AND the trace-rail animation is paced for human readability.

This isn't cheating. The cache-hit path IS real production behavior — users who re-submit a hypothesis genuinely see sub-second responses. We choose to demo that path because of the time budget. If a judge asks, the truthful answer is "the cache hit because we pre-warmed for the recording; on a fresh hypothesis the system streams in 30-45 seconds as designed."

## Pre-flight (5 minutes before hitting record)

### 1. Cache-warming protocol

Open https://sextant-uekv.vercel.app/app in the browser you'll record from (Chrome, clean profile, bookmarks bar hidden, 100% zoom).

```
Window 1 — H1 cache warm:
  a. Click chip H1 (CRP biosensor, the verbatim Fulcrum brief hypothesis #1)
  b. Wait for verdict to fully stream above the canvas (~4s)
  c. Wait for the 4 trace-rail agent rows to complete (idle → working → done) and
     the consolidated Plan to paint into all 5 canvas tabs (~30-45s)
  d. Click any Materials row → "Correct" → type a 1-line rule
     (suggested: "Always order Sigma-Aldrich for catalog-listed reagents,
     never Thermo Fisher when both are available")
  e. Click Save. Wait for "Lab rule saved" toast.
  f. LEAVE TAB OPEN.

Window 2 — H2 cache warm + propagation prep:
  a. Open a second tab on the same URL
  b. Click chip H2 (the second pre-staged hypothesis — pick one whose
     Materials section will plausibly include a Sigma-Aldrich reagent
     so the rule from step (d) above applies)
  c. Wait for full plan to stream in (~30-45s)
  d. Verify the diff modal opens automatically AND the rule from H1
     visibly applies to one Materials row (highlighted in clay/rust
     with the rule label)
  e. Close window 2.

Now warm:
  - lit-QC cache: H1, H2 (both verdicts cache-hit on re-submit)
  - plan cache: H1 (post-correction), H2 (post-rule-applied)
  - lab_rules.json: contains the rule from H1
  - data/runs/<id>.json: H1 + H2 plans persisted to disk
```

### 2. Confirm trace-rail demo-pace toggle is ON

The demo-pace toggle slows agent-row transitions so judges can SEE the parallel fan-out. Two implementations exist (use either, depending on what shipped):

**Option A — server-side env var (Phase 3's responsibility per the planner brief):**

Phase 3 plan instructed the executor to add `SEXTANT_DEMO_PACE_MS` env var that injects `setTimeout` between agent stage transitions before emitting the next AgentEvent. To activate for the recording:
- On Vercel: set `SEXTANT_DEMO_PACE_MS=3500` in production env vars, redeploy.
- For local recording: `SEXTANT_DEMO_PACE_MS=3500 npm run dev`.

**Option B — client-side URL param (Phase 6's safety net per the handover):**

Phase 6 plan adds a client-side `?demoPace=slow` URL param that drip-feeds events from a queue regardless of server timing. To activate:
- Record from `https://sextant-uekv.vercel.app/app?demoPace=slow` instead of `/app`.

**Verify before recording:** click chip H1 with toggle on. The 4 agent rows should staircase visibly (working → done in ~3-5s per row, not all-at-once in 100ms). If they all flash done instantly, the toggle isn't active — fix before recording.

### 3. Final pre-record checklist

- [ ] GitHub repo is PUBLIC (verified by user 2026-04-26 — done)
- [ ] https://sextant-uekv.vercel.app responds, /app shows dashboard
- [ ] Both chips (H1 + H2) cache-warm complete
- [ ] Lab rule from H1 correction is in `data/lab_rules.json` (or visible in lab profile drawer)
- [ ] Demo-pace toggle ON (verified visually with a test chip click)
- [ ] Browser: Chrome clean profile, 100% zoom, bookmarks hidden, dev tools closed
- [ ] Screen recorder: 1920×1080, 60fps if possible, H.264 MP4 output
- [ ] Mic check: clear voiceover, no room noise
- [ ] One dry pass with stopwatch before keeper take

## Recording: 60-second shot list

| Time | What's on screen | Narration |
|---|---|---|
| 0:00-0:03 | Landing page sextant-uekv.vercel.app, click "Open Sextant" | "Sextant turns a scientific hypothesis into a fundable experiment plan in 3 minutes." |
| 0:03-0:06 | Empty dashboard. Click chip H1. | "A scientist enters a hypothesis." |
| 0:06-0:10 | Verdict streams above canvas, 3 citation cards | "First, we ground it — Tavily searches arXiv, Semantic Scholar, and protocols.io. Verdict streams in under 4 seconds with cited references." |
| 0:10-0:25 | Trace rail: 4 agent rows light up in parallel — Researcher, Skeptic, Operator, Compliance — then the Consolidator. Plan paints into the canvas tabs. | "Then four agents debate in parallel — Researcher, Skeptic, CRO Operator, Compliance. A consolidator merges their work into a typed JSON plan with five sections: Protocol, Materials, Budget, Timeline, Validation." |
| 0:25-0:32 | Click Materials tab. Click a reagent row. Correction popover appears. Type rule. Click Save. Toast appears. | "Watch the closed loop. The scientist clicks any line, submits a correction. We extract it as a typed lab rule." |
| 0:32-0:50 | Click chip H2. Verdict streams. Plan generates. Diff modal opens automatically — left: original. Right: new plan with one line highlighted in clay/rust + label "Lab rule applied". | "Submit a second hypothesis. The new plan automatically applies the rule — no re-prompting. The diff modal shows exactly which line changed and which rule fired." |
| 0:50-0:58 | Quick zoom on the diff highlight. Pan to lab profile drawer. | "Every correction compounds. After months of real lab usage, this rule store becomes that lab's private operating intelligence." |
| 0:58-1:00 | Logo + tagline | (let the logo land) |

## Fallback recipes

### If Phase 7 didn't ship in time (no live propagation)

Cut 0:25-0:50 to a static before/after slide drawn in Figma:
- Left: H1 plan with the corrected reagent highlighted
- Right: H2 plan with the same rule applied, called out
- Center: arrow + "lab rule applied automatically"

Total demo shrinks to ~35s. Use remaining 25s to narrate the closed-loop concept over the still slide.

### If demo-pace toggle didn't ship in either Phase 3 or Phase 6

Slow the screen recording playback to 0.5× over the 0:10-0:25 segment in your video editor (DaVinci Resolve free tier or Final Cut). Adjust narration timing accordingly.

### If lit-QC cache misses on the recording take

Skip the verdict-streams shot (0:06-0:10), narrate over a still of the verdict already painted, then continue with plan generation.

### If Vercel hiccups mid-recording

Have a local `npm run dev` instance warm in another terminal. Fall back to `localhost:3000/app` for the take.

## Two takes minimum

Record two full takes. Pick the cleaner one. Don't try to record-once-perfect under deadline pressure — the second take is always tighter than the first.

## Post-record

- Trim head and tail to fit exactly 60s.
- Export H.264 MP4, target <30MB file size.
- Save as `demo/sextant-demo-v1.mp4` (gitignored per CLAUDE.md).
- Submit as the "Demo Video" file in the Hack-Nation form.

---

## Demo-pace mechanism — confirmed shipped 2026-04-26 (Phase 6)

- **Client-side (Phase 6, this plan):** `useDemoPacedEvents` hook at `src/components/trace/use-demo-paced-events.ts`. Activate with URL param `?demoPace=slow` (3500ms between rows, ~14s staircase for 4 agents) or `?demoPace=ultraslow` (6000ms). Default (no param) = pass-through, no delay.
- **Server-side (Phase 3, separate chat):** env var `SEXTANT_DEMO_PACE_MS` paces event emission at the route. Confirm presence with `grep "SEXTANT_DEMO_PACE_MS" src/app/api/plan/route.ts` after Phase 3 ships.
- **Belt-and-braces:** Both can run. For the recording, set ONE OR BOTH; demo URL is `https://sextant-uekv.vercel.app/app?demoPace=slow` — works whether or not the server env var is set.

---

*Last updated: 2026-04-26 — Phase 6 client-side toggle confirmed shipped (commit `ee36cc2`). Phase 3 env-var status to be confirmed in parallel chat once `src/app/api/plan/route.ts` lands.*
