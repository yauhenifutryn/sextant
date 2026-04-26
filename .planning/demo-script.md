# Demo video — beat-by-beat script (60s)

**Use:** the page you have on your phone or second monitor while recording. Each beat: timestamp, what's on screen, where to click, what to say. Rehearse twice without recording, then record.

**Setup before hitting record:**
- Local dev server running with `SEXTANT_DEMO_PACE_MS=3500`
- Caches warm per `.planning/demo-playbook.md` Test 6
- `data/lab_rules.json` reset to `{ "rules": [] }` so we can capture the rule live on camera
- Browser at 100% zoom, 1920×1080, Incognito, no extensions, devtools closed
- Phone notifications silenced
- One practice take first, then the keeper

---

## Script

### 0:00 — 0:04 · Landing page · "Open Sextant"
- **On screen:** the landing page hero. ASCII animation playing.
- **Click:** "Open Sextant" CTA in the hero.
- **Say:** *"Sextant turns a scientific hypothesis into a fully-grounded experiment plan in three minutes."*

### 0:04 — 0:07 · Empty dashboard · click chip
- **On screen:** dashboard at `/app`, three columns, empty plan canvas with four hypothesis chips.
- **Click:** chip H1 — "Diagnostics · CRP biosensor".
- **Say:** *"A scientist enters their hypothesis."*

### 0:07 — 0:11 · Verdict streams in
- **On screen:** verdict card paints above the canvas — "similar work exists" with three citation chips.
- **Click:** nothing. Just let it stream.
- **Say:** *"First, we ground it. Tavily searches arXiv, Semantic Scholar, and protocols.io. Verdict in under four seconds, with three cited references."*

### 0:11 — 0:25 · Trace rail · 4 agents work in parallel
- **On screen:** the right-side trace rail. Researcher, Skeptic, Operator, Compliance light up in sequence (because of the demo-pace toggle), each one running for ~3.5 seconds, then a checkmark. Then a fifth row: Consolidator.
- **Click:** nothing. Let the trace rail tell the story.
- **Say:** *"Then four AI agents debate in parallel — Researcher, Skeptic, CRO Operator, Compliance. A fifth call merges them into a single typed JSON plan."*

### 0:25 — 0:32 · 5-tab plan canvas
- **On screen:** the plan canvas paints, then the user clicks across tabs.
- **Click:** Protocol tab (already active) → Materials tab → Budget tab → Timeline tab → Validation tab. ~1 second per tab.
- **Say:** *"Five sections — Protocol, Materials with real catalog numbers, Budget, Timeline with dependencies, and Validation. Every claim is cited to a real source."*

### 0:32 — 0:42 · Capture a lab rule
- **On screen:** still on the Validation tab. User clicks one validation row. Correction popover opens. User types the rule text.
- **Click:** any validation row. The popover opens. Type into the textarea: *"Always include both positive and negative controls in every validation check."*
- **Click:** Save. Toast appears: "Lab rule captured." Header pill animates from "0 lab rules" to "1 lab rule".
- **Say:** *"Now watch the closed loop. The scientist clicks any line, submits a correction, and Sextant turns it into a typed lab rule."*

### 0:42 — 0:55 · Submit second hypothesis · diff modal
- **On screen:** the dashboard. User clicks chip H2.
- **Click:** chip H2 — "Gut Health · L. rhamnosus GG".
- **Wait:** verdict + plan generate. (Cache-warmed, so this is fast.)
- **Click:** "Compare with previous plan" button (above the tabs). Diff modal opens.
- **Say:** *"Submit a different hypothesis. The new plan automatically applies the rule — no re-prompting. The diff modal shows exactly which lines changed."*
- **On screen:** the modal shows Plan A on the left, Plan B on the right. The Validation tab in Plan B has rows highlighted in clay/rust where positive and negative controls were added.

### 0:55 — 1:00 · Tagline · land the moat line
- **On screen:** close the modal, zoom or pan to the header showing "1 lab rule" pill. Or pan to the tagline section of the landing page if you cut back.
- **Say:** *"Every correction compounds. Months of real lab usage become that lab's private operating intelligence — the moat."*

---

## What to absolutely nail

1. **The chip click → verdict streaming.** This proves grounded generation in 4 seconds.
2. **The trace rail filling up.** This proves multi-agent orchestration. If the rail flashes through, the demo-pace toggle isn't on — stop and fix.
3. **The popover save → pill update.** This is the closed-loop CAPTURE moment. The pill animation MUST be visible. If the pill doesn't update, stop and fix.
4. **The diff modal opening with highlights.** This is the closed-loop PROPAGATION moment. The clay/rust highlight is the visible proof.

If any of those four beats fail on the keeper take, do another take. They are non-negotiable.

---

## What to avoid saying

- **Don't say "ChatGPT" or "wrapper".** You're not selling against another product on camera; you're selling Sextant. The differentiation lives in the typed rule + closed loop, which the visual demo already proves.
- **Don't list the stack.** The stack is in the Tech Video and the README. The demo video is for the *experience*.
- **Don't apologize.** No "in this 24-hour hackathon prototype…" qualifiers. The prototype is what's being judged. Speak as if it's the product.
- **Don't read the screen.** Don't say "you can see the verdict here." The viewer can see it. Tell them what it *means*.

---

## What to say if you stumble

If you fluff a line, finish the sentence, then stop the recording, then start the take over from the beat. Don't try to splice. The 60s window is small enough that one clean take beats four bad takes glued together.

---

## After the keeper take

- Save immediately as `demo/sextant-demo-v1.mp4`. Don't trust "I'll save it after one more take" — back it up.
- If the take is 58s, you're golden. 62s, see if you can speak faster on the trace-rail beat (0:11–0:25). If 65s+, cut the second-hypothesis narration sentence by half.
- File size target: under 30MB. H.264 + AAC + 1920×1080 + 30fps + medium quality is plenty.
