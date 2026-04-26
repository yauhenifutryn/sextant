# Demo recording playbook — pre-flight test plan

**Use:** Run this end-to-end at least once on `localhost:3000/app` BEFORE recording the 60s demo video. Catches regressions before the camera rolls. Total run time: ~10 minutes.

**Environment:**
- Local dev server, not production. (Vercel filesystem is read-only — Phase 7 corrections will fail there.)
- Browser at 100% zoom, 1920×1080 window, Incognito or a clean profile (no extensions, no devtools open during the recording take).
- `SEXTANT_DEMO_PACE_MS=3500` env var set before `npm run dev`. Without it, cache hits flash agents done in <100ms — the trace rail looks fake on camera.

```bash
# In a fresh terminal, from the repo root:
SEXTANT_DEMO_PACE_MS=3500 npm run dev
```

Open http://localhost:3000.

---

## Test 1 — Landing page renders correctly

- [ ] Hero loads, ASCII animation plays, "Open Sextant" CTA visible
- [ ] Scroll the page top-to-bottom — no broken sections, no layout jumps
- [ ] All three "Open Sextant" buttons (header, hero, footer) are uniform black with white text
- [ ] Click "Open Sextant" in the header — lands on `/app` cleanly
- [ ] Hit browser back, click "Open Sextant" in the hero — same destination
- [ ] Hit browser back, click "Open Sextant" in the footer — same destination

If any landing button is misstyled or doesn't navigate, **stop** and fix before recording.

---

## Test 2 — Empty dashboard renders

On `/app`:
- [ ] Header shows "Sextant" wordmark (left) + "Awaiting hypothesis…" (center) + "0 lab rules" pill (right)
- [ ] No avatar button or settings cog visible (we removed dead controls pre-demo)
- [ ] Three-column layout: chat panel (left), plan canvas (middle), trace rail (right)
- [ ] Empty-state hero in the canvas shows the four hypothesis chips (CRP biosensor, L. rhamnosus GG, trehalose cryo, Sporomusa CO₂)
- [ ] All four chips are keyboard-focusable (Tab through them, focus ring visible)
- [ ] Chat panel textarea is empty and focusable
- [ ] Trace rail shows four agent rows in idle state (no shimmer, no checkmark)

---

## Test 3 — Pre-defined chip (CRP biosensor) — full 5-tab walkthrough

Click chip H1 (CRP biosensor).

**During QC + plan generation:**
- [ ] Verdict streams in above the canvas within ~4 seconds, shows "similar work exists" (or equivalent) with 3 cited links
- [ ] Trace rail starts animating: Researcher, Skeptic, Operator, Compliance light up in sequence, each takes ~3.5s (because `SEXTANT_DEMO_PACE_MS=3500`)
- [ ] No console errors in browser devtools during streaming
- [ ] Plan paints into canvas around 30-45s mark

**Tab 1 — Protocol:**
- [ ] At least 3 numbered steps render
- [ ] Each step has body text (no empty step bodies)
- [ ] Each step shows a `[N sources]` badge IF citations are populated; shows nothing if empty (no "[0 sources]" placeholder)
- [ ] Click a `[N sources]` badge — opens the source URL in a new tab
- [ ] Hover the badge — native browser tooltip shows the source title

**Tab 2 — Materials:**
- [ ] Materials table has columns: Reagent, Catalog #, Supplier, Unit cost, Qty, Subtotal
- [ ] At least 4 rows render
- [ ] Every row shows a `[N sources]` link beneath the reagent name (Phase 5 LITE enrichment)
- [ ] Click any `[N sources]` — opens a real supplier or paper URL
- [ ] No row has a fake/invented catalog number (catalog numbers come from Tavily search, never invented)
- [ ] Subtotal column shows USD or em-dash (—) for unparseable quantities

**Tab 3 — Budget:**
- [ ] Total cost rendered prominently
- [ ] Category breakdown lines visible (reagents, equipment, labor, overhead, etc.)
- [ ] Numbers are consistent with the per-row Subtotals in Materials (rough sanity check; not bit-exact)

**Tab 4 — Timeline:**
- [ ] At least 3 phases render
- [ ] Each phase has a name, duration, and depends_on chips (if dependencies exist)
- [ ] No phase shows "TBD" or empty fields

**Tab 5 — Validation:**
- [ ] At least 5 named validation checks render (Skeptic must guarantee 6, with stub fallback)
- [ ] Each check has a description, measurement_method, and pass_criteria
- [ ] No empty fields

**Compliance routing:**
- [ ] If the agents emitted any compliance notes, the appropriate ones show above the tablist (global), top of Protocol panel (protocol_step), or top of Materials panel (material_row)
- [ ] Severity colors: info=warm border, caution=clay, blocking=red

**Keyboard nav:**
- [ ] Press Tab from the chat panel — focus reaches the tab list
- [ ] Use arrow keys to switch tabs — active tab visually distinct
- [ ] Active tab has the underline indicator

If any of the above fail, **stop** and fix.

---

## Test 4 — Custom hypothesis (NOT a chip) — quality smoke test

In the chat panel, paste this hypothesis:

> Combining low-dose rapamycin with intermittent fasting in C57BL/6 mice will extend median lifespan by at least 15% compared to ad-libitum-fed controls, due to synergistic upregulation of autophagy markers LC3-II and beclin-1.

Hit Enter (or click the send arrow).

- [ ] QC verdict returns within ~10 seconds (uncached hypothesis, no `SEXTANT_DEMO_PACE_MS` impact on QC since QC isn't paced)
- [ ] Verdict has 2-3 cited references
- [ ] Plan generates within ~60 seconds (no timeout)
- [ ] All 5 tabs populate. Quality may vary on materials (Tavily may not find clean supplier pages for rapamycin), but **no row should be missing required fields**
- [ ] No console errors

**Acceptance:** the system handles a non-chip hypothesis without crashing. We don't expect demo-grade output for arbitrary input — that's the point of the cache-warmed chips. But the system must not error out.

---

## Test 5 — Phase 7: closed-loop corrections (run after Phase 7 ships)

Reset state by clearing `data/lab_rules.json` to `{ "rules": [] }`.

Refresh `/app`. Verify header pill says "0 lab rules".

**Capture a rule:**
- [ ] Submit chip H1 (CRP biosensor). Wait for plan to fully render.
- [ ] Click on a row in the **Validation** tab. Correction popover opens.
- [ ] Type: "Every validation check must include both positive and negative controls — this is non-negotiable for any biological assay."
- [ ] Click Save. Toast: "Lab rule captured."
- [ ] Header pill text updates from "0 lab rules" → "1 lab rule" (live, no page reload)
- [ ] `cat data/lab_rules.json` shows the new rule with `{ rule, scope, reasoning, source_correction, id, created_at }` fields populated

**Verify propagation on a second hypothesis:**
- [ ] Submit chip H2 (L. rhamnosus GG mice).
- [ ] Wait for Plan B to generate (~45s).
- [ ] In the Validation tab of Plan B, look for explicit positive AND negative control language. The lab rule should be visibly applied.
- [ ] A "Compare with previous plan" button is visible above the tabs (because `previousPlan` is now non-null).
- [ ] Click "Compare with previous plan" — diff modal opens.
- [ ] Plan A on left, Plan B on right.
- [ ] At least one row in Plan B's Validation tab is highlighted in `clay/rust` accent vs. the corresponding row in Plan A.
- [ ] Modal can be closed via X button or Escape key.

**If propagation fails (no visible change in Plan B between the two runs):**
- Check `data/lab_rules.json` is non-empty
- Check the `/api/plan` route logs include the LAB RULES block in the agent prompts (server console)
- Check the cache key is actually different between the two requests (request 1 had no rules; request 2 has 1 rule → hashes must differ)

If propagation does not land on the second attempt: **invoke CLAUDE.md hard rule #3 — cut Phase 7 to manual before/after slide.** Do not record a half-working loop.

---

## Test 6 — Cache state ready for recording

After Tests 3, 4, 5 above, the in-memory cache should be warm for:
- QC: chip h1, chip h2, custom rapamycin hypothesis
- Plan: chip h1 (with rules applied), chip h2 (with rules applied), custom rapamycin (no rules required)
- Lab rules: 1+ rule in `data/lab_rules.json`

**Verify cache:**
- [ ] Refresh `/app`. (Refreshing does NOT clear the in-memory cache — it lives in the route handler module scope.)
- [ ] Click chip H1 again. Verdict should return within 100ms (cache hit). Plan should also return within ~few hundred ms.
- [ ] Click chip H2. Same — cache hit on both QC and plan.
- [ ] Header pill still shows the captured rules (loaded from disk via useLabRules hook).

If cache is warm and Phase 7 propagation visibly works: **you are ready to record.**

---

## Test 7 — Recording-pace check

With `SEXTANT_DEMO_PACE_MS=3500` set, run chip H1 once on a clean cache (restart `npm run dev` to clear the in-memory map). Time the trace rail:
- [ ] Researcher row: lights up, shimmers ~3.5s, then checkmark
- [ ] Skeptic, Operator, Compliance: same staircase pattern
- [ ] Total perceived time from chip click to plan painted: ~25-30s

If the trace rail flashes through too fast (<10s total), the env var didn't take. Restart with the var in front of `npm run dev` again, or use `?demoPace=slow` URL param as a fallback.

---

## Things that will surprise you (known quirks)

- **Vercel deploy can't run Phase 7.** The deployed app's filesystem is read-only — `addLabRule()` will throw. The deployed app is for landing/dashboard navigation showcase only. Phase 7 demo MUST be on local dev. Don't switch tabs to the deployed URL during the recording.
- **First QC after `npm run dev` may be slow.** Tavily TLS handshake adds 2-4s on the very first call. Test 3's chip H1 is the warmup — re-run if it errors with timeout.
- **Cache keys include lab rules.** Submitting chip H1 a second time AFTER capturing a rule will *re-generate* the plan, not return cached. This is intentional (so propagation works on the same hypothesis the user just corrected). Time it: a fresh post-rule generation takes ~45s. Don't mistake this for a hang.
- **The "0 lab rules" → "1 lab rule" pill change is live (no page reload required).** If you see "0 lab rules" persist after a successful capture, the `useLabRules()` hook didn't refresh. Reproduce on dev, file a bug, but **do not record** — the live count update is one of the 60s narrative beats.
- **Diff modal highlight is naive.** It compares string equality per top-level field. If Plan B has the same Validation entries in a different *order*, you'll see false positives in the highlight. Acceptable for the demo; documented as future work in DEFERRED.md.

---

## After recording

- [ ] Save the take immediately. Two takes minimum, pick the better.
- [ ] H.264 MP4, target <30MB, no longer than 60s.
- [ ] Tech video: render the Mermaid diagram from `.planning/SUBMISSION.md` (Tech Video section), record voiceover separately if narration timing is off on the first try.
- [ ] Reset `data/lab_rules.json` to `{ "rules": [] }` after recording, so the committed state is clean for the public repo. (Or, commit ONE seeded rule that matches the demo narrative — the call is yours; either is honest.)
- [ ] Push final state to `main` so the deployed app reflects it.
