# Phase 7: Closed-Loop Corrections + Propagation Demo — Context

**Gathered:** 2026-04-26 (inline from HANDOFF.json + DEFERRED.md, skipping `/gsd-discuss-phase` per token budget)
**Status:** Ready for planning
**Source:** Inline from prior-session handoff + ROADMAP Phase 7 + REQUIREMENTS LOOP-01..05 + PROP-01..04

> **HARD-CUT REMINDER (CLAUDE.md hard rule #3):** if Phase 7 is not wired by hour 18 of build, cut to a manual before/after slide. Do NOT leave the learning loop half-built. **Submission deadline ≈ 2026-04-26 13:00 ET; ~3h headroom from this CONTEXT.md.**

<domain>
## Phase Boundary

Phase 7 closes the loop. Today the system generates Plan A; the user has no way to teach it. After Phase 7, the user clicks any line in Plan A → captures a typed lab rule → submits a second hypothesis → Plan B visibly applies that rule → diff modal shows the change side-by-side. **This IS the moat-validation moment for the entire pitch.**

**In scope (must ship for the demo to land):**
1. Click any plan-canvas line → "Correct" popover (text input, no Challenge/Annotate)
2. Submit → POST `/api/lab-rules` → Gemini extracts a typed `LabRule { rule, scope, reasoning, source_correction }`
3. Persist to `data/lab_rules.json` (file-based per CLAUDE.md hard rule #6, no DB)
4. Header pill text updates from "0 lab rules" → "1 lab rules" (live, no page reload)
5. On NEXT plan generation: read all stored rules, inject into all 4 agent system prompts (Researcher + Skeptic + Operator + Compliance) so Plan B reflects them
6. After Plan B renders, expose a "Compare with previous plan" button → modal with side-by-side Plan A vs Plan B + changed lines highlighted in `clay`/`rust` accent
7. Pre-stage demo flow on existing 4 chips (no new hypothesis needed) — pick a UNIVERSAL rule on chip h1 that obviously applies to chip h2

**Out of scope (cut, see Deferred):** Challenge/Annotate actions, lab profile drawer, per-line rule labels in diff, embedding-based rule retrieval, conflict resolution, audit log.
</domain>

<decisions>
## Implementation Decisions

### Lab Rule Schema (locked)
- **D7-01:** New file `src/lib/lab-rules/schema.ts` exports `labRuleSchema` (Zod) + `LabRule` (z.infer). Fields: `id` (cuid-ish — use `crypto.randomUUID().slice(0,8)`), `rule` (string, the imperative; e.g. "Always specify storage temperature for biological reagents"), `scope` (enum: `protocol_step | material_row | budget_line | timeline_phase | validation_check | global`), `reasoning` (string, why), `source_correction` (string, the user's verbatim text), `created_at` (ISO string). NO `confidence`, NO `last_used_at`, NO `superseded_by` (deferred).
- **D7-02:** `src/lib/plan/schema.ts` and `src/lib/qc/schema.ts` are LOCKED. Phase 7 reads them, never modifies. If Plan needs to know "which rule was applied," that lives on a sibling type, not on `Plan`.

### Storage (locked)
- **D7-03:** `data/lab_rules.json` is the canonical store. Shape: `{ rules: LabRule[] }`. New file, committed to repo (NOT gitignored — judges/recruiters need to see it works in the deployed app, and Vercel filesystem on the deployed runtime is read-only). For the demo, all rule writes during recording happen on the LOCAL dev server; the deployed app shows the post-corrections state we commit before recording. Document this trade-off explicitly.
- **D7-04:** `src/lib/lab-rules/store.ts` exports `getLabRules(): Promise<LabRule[]>` + `addLabRule(rule: LabRule): Promise<void>`. Read-through from disk on every call (no in-memory cache; load is trivial — N rules ≤ 10 in demo).

### Rule Extraction (locked)
- **D7-05:** `src/lib/lab-rules/extractor.ts` exports `extractLabRule({ correction, planContext, targetLine })`. ONE Gemini call (`gemini-2.5-flash`, `thinkingBudget: 0` per Phase 2 convention) using `generateObject` with `labRuleSchema`. System prompt instructs the model to take the user's correction + the line being corrected + the surrounding plan slice, and emit a generalized typed rule. Server-side post-fill of `id` + `created_at` (model never invents these).
- **D7-06:** `experimental_repairText` callback on the extractor: if the model returns malformed JSON, fall back to a stub rule with `rule = correction` (verbatim), `scope = "global"`, `reasoning = "Model failed to extract structured rule — using user text verbatim"`. Better to capture the rule than lose it.

### API Surface (locked)
- **D7-07:** New route `src/app/api/lab-rules/route.ts` — `GET` returns `{ rules: LabRule[] }` (no streaming, JSON), `POST` accepts `{ correction: string, planContext: { hypothesis: string, sliceJson: string }, targetLine: { kind: ScopeEnum, label: string } }`, runs extractor, appends to store, returns the new `LabRule`. `runtime: "nodejs"`. `maxDuration: 15`.
- **D7-08:** Existing `src/app/api/plan/route.ts` is MODIFIED to (a) call `getLabRules()` once at request start, (b) pass `labRules: LabRule[]` arg to all 4 agent runners, (c) bypass cache (`getCachedRun`) when `labRules.length > 0` AND request is the second hypothesis (cache key needs to change — append rule-set hash to `hypothesis_hash`). Without this, Plan B would return Plan A from cache and the propagation demo dies.

### Agent Prompt Injection (locked)
- **D7-09:** All 4 agent runners (`researcher.ts`, `skeptic.ts`, `operator.ts`, `compliance.ts`) get a new optional `labRules?: LabRule[]` arg. When non-empty, the user-prompt builder appends a `LAB RULES (apply these to your output):\n${rules.map(r => `- ${r.rule} (because: ${r.reasoning})`).join('\n')}` block AFTER the existing `HYPOTHESIS:` / `LIT-QC CONTEXT:` blocks. System prompt is unchanged (preserves Google implicit prefix-cache benefit per researcher.ts existing comment).
- **D7-10:** Compliance agent additionally treats lab rules as "house compliance constraints" — if a rule has `scope: "validation_check"` or `scope: "global"`, the compliance agent should emit a `compliance_notes` entry referencing the rule by its source text (so the propagation is VISIBLE in the UI, not just in agent reasoning).

### Cache Invalidation (locked)
- **D7-11:** `hashHypothesis(text)` in `src/lib/plan/cache.ts` becomes `hashRunInput(hypothesis, labRules)` — concatenates `hypothesis.trim().toLowerCase() + "|" + JSON.stringify(rules.map(r => r.id).sort())`. Existing callers updated. This guarantees Plan A (no rules) and Plan B (with rules) get different cache keys, and a re-submission of the same hypothesis after rule capture refreshes.

### UI Surface (locked)
- **D7-12:** New `src/components/correction-popover.tsx` — Radix Popover (already a transitive dep via shadcn) wrapping a `<button>` trigger + a focused popover with `<textarea>` + Cancel/Submit buttons. Submit calls `POST /api/lab-rules`, on 200 invalidates the lab-rules pill data (see D7-14), closes the popover, fires a sonner toast "Lab rule captured."
- **D7-13:** Each row inside the 5 plan tabs (`protocol-tab.tsx`, `materials-tab.tsx`, `budget-tab.tsx`, `timeline-tab.tsx`, `validation-tab.tsx`) wraps its primary line in a `<button>` (or div with role=button) that opens the `CorrectionPopover` with the `{ kind, label }` of that line. Keep keyboard accessibility: focus visible, Enter/Space opens popover.
- **D7-14:** `src/components/header-bar.tsx` — replace the static "0 lab rules" pill with a live count via a new `useLabRules()` hook (`src/hooks/use-lab-rules.ts`). Hook fetches `GET /api/lab-rules` on mount + exposes a `refresh()` callback. CorrectionPopover Submit handler calls `refresh()` after success.
- **D7-15:** New `src/components/plan-diff-modal.tsx` — Radix Dialog. Two-column scrollable layout. Renders Plan A on left, Plan B on right, both using the existing `PlanTabs` component but with a `compareWith?: Plan` prop that highlights any string field in B that differs from A in `bg-clay/10 border-l-2 border-rust` (HSL tokens already in design system). Naive diff is fine (string equality per field); no fancy LCS.
- **D7-16:** `src/components/plan-canvas.tsx` — extend with `previousPlan: Plan | null` prop (the snapshot of Plan A before Plan B was generated) + a "Compare with previous plan" button rendered ABOVE the tabs when `previousPlan` is non-null AND the current plan exists. Click opens `PlanDiffModal`.
- **D7-17:** `src/app/app/page.tsx` (dashboard) — add `previousPlan` state. When `usePlan().plan` transitions from `null → Plan` AND we already had a `lastSubmittedPlan` from an earlier hypothesis, snapshot the prior plan into `previousPlan`. Subtle: simplest implementation is a `useRef<Plan | null>(null)` that captures `plan` on each successful generation, exposing the PREVIOUS one as `previousPlan` to PlanCanvas.

### Demo Flow (locked)
- **D7-18:** No new hypothesis needed — use existing chips h1 (CRP biosensor) and h2 (L. rhamnosus GG). Both involve biological samples + validation. Pre-recorded demo script: (a) submit h1, wait for Plan A, (b) click on a Validation row, "Correct" popover, type "Every validation check must include both positive and negative controls (this is non-negotiable for any biological assay)" → submit, (c) verify pill goes 0 → 1, (d) submit h2, wait for Plan B, (e) click "Compare with previous plan", (f) the modal shows Plan A's validation tab without explicit positive/negative controls, Plan B with them, with the `clay/rust` highlight on the changed lines.
- **D7-19:** The rule chosen ("positive AND negative controls in validation") is INTENTIONALLY universal — applies to virtually any hypothesis with a wet-lab assay. Lower demo-failure risk than picking a domain-specific rule that may or may not apply. If exec-time picks a different rule, Claude has discretion to refine — but the propagation must visibly land.

### Claude's Discretion
- File names within `src/lib/lab-rules/*` and `src/components/correction-popover.tsx` exact paths (above are guidance).
- Exact Tailwind classes for popover/modal styling (use existing tokens: `bg-paper`, `border-borderwarm`, `text-ink`, `bg-clay/10`, `border-rust`).
- Sonner toast wording.
- Exact diff highlighting algorithm (string equality per top-level Plan field is fine; deeper diff can wait).
- Whether to add a `?promptOnSubmit=` URL param for demo pre-staging — not required, exec discretion.
- Whether to add a "clear all rules" dev-only button — not required, exec discretion.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project rules
- `CLAUDE.md` — project hard rules (no DB, no new deps, hard-cut rule #3 for Phase 7)
- `.planning/PROJECT.md` — defensibility thesis; Phase 7 IS the moat moment
- `.planning/REQUIREMENTS.md` — LOOP-01..05 + PROP-01..04 definitions
- `.planning/DEFERRED.md` — Phase 7 cuts (Challenge/Annotate, drawer, per-line labels, etc.)
- `.planning/HANDOFF.json` — prior session handoff, includes Phase 7 must-haves
- `CLAUDE_DESIGN_BRIEF.md` — design tokens (`clay`, `rust`, `paper`, `borderwarm`, `ink`)

### Schemas (LOCKED — read-only)
- `src/lib/plan/schema.ts` — Plan / ProtocolStep / MaterialRow / BudgetLine / TimelinePhase / ValidationCheck / ComplianceNote
- `src/lib/qc/schema.ts` — Citation, QCResponse

### Agent system (modify prompts only)
- `src/app/api/plan/route.ts` — fan-out pattern; lab-rule injection point at lines ~110-120
- `src/lib/plan/agents/researcher.ts` — system + user prompt structure
- `src/lib/plan/agents/skeptic.ts` — same pattern
- `src/lib/plan/agents/operator.ts` — same pattern (3 sections in one call)
- `src/lib/plan/agents/compliance.ts` — same pattern; D7-10 gives this agent extra rule-awareness
- `src/lib/plan/consolidator.ts` — already does post-fill, no changes expected
- `src/lib/plan/cache.ts` — `hashHypothesis` → `hashRunInput` rename (D7-11)

### UI surface (modify)
- `src/components/plan-canvas.tsx` — extend Props with `previousPlan`, render Compare button
- `src/components/plan-tabs.tsx` — pass `compareWith` to leaf renderers (or compute diff inside)
- `src/components/plan/protocol-tab.tsx` — wrap each step in clickable surface
- `src/components/plan/materials-tab.tsx` — wrap each row in clickable surface
- `src/components/plan/budget-tab.tsx` — wrap each line in clickable surface
- `src/components/plan/timeline-tab.tsx` — wrap each phase in clickable surface
- `src/components/plan/validation-tab.tsx` — wrap each check in clickable surface
- `src/components/header-bar.tsx` — replace static pill with `useLabRules()`
- `src/app/app/page.tsx` (dashboard) — add `previousPlan` snapshot state

### Models / Infra
- `src/lib/models.ts` — `pickAvailableLitQcModel()` returns the Gemini model ID; reuse for the rule extractor
- `src/lib/env.ts` — `GOOGLE_GENERATIVE_AI_API_KEY` env var

### Locked stack (CLAUDE.md hard rule #5 — no new deps)
Already in package.json: `ai`, `@ai-sdk/google`, `@radix-ui/react-popover` (transitive via shadcn), `@radix-ui/react-dialog` (need to verify; if absent, add via `shadcn add dialog`), `zod`, `framer-motion`, `lucide-react`, `sonner`, `tailwindcss`. NO new package allowed.

### Past patterns to mirror
- `src/lib/plan/citations.ts` (Phase 5 LITE) — pattern for "1 server-side enrichment call, post-consolidator, broadcast to multiple rows"
- `src/components/plan/citation-slot.tsx` (Phase 4) — pattern for "leaf component with empty-state silence per CLAUDE.md hard rule #1"
- `.planning/phases/05-grounding-citations/05-01-PLAN.md` — pattern for inline LITE plan if budget forces
</canonical_refs>

<specifics>
## Specific Ideas

### Wave layout (planner guidance)
- **Wave 1 — Backend foundation (1 plan, ~6 files, parallel-safe):**
  - `src/lib/lab-rules/schema.ts` (Zod + types)
  - `src/lib/lab-rules/store.ts` (file IO)
  - `src/lib/lab-rules/extractor.ts` (Gemini call)
  - `src/app/api/lab-rules/route.ts` (GET/POST)
  - `data/lab_rules.json` (initial empty state: `{ "rules": [] }`)
  - `src/hooks/use-lab-rules.ts` (client hook with refresh)
- **Wave 2 — Agent prompt injection + cache invalidation (1 plan, depends on Wave 1, modifies 6 files):**
  - `src/lib/plan/cache.ts` — rename `hashHypothesis` → `hashRunInput`, add `labRules` arg, JSON-serialize sorted IDs
  - `src/app/api/plan/route.ts` — `getLabRules()` at request start, pass to runners, use new cache key
  - `src/lib/plan/agents/{researcher,skeptic,operator,compliance}.ts` — accept optional `labRules` arg, append LAB RULES block to user prompt
- **Wave 3 — Frontend correction popover + header pill (1 plan, depends on Wave 1 only — can run parallel with Wave 2):**
  - `src/components/correction-popover.tsx` (new, Radix Popover)
  - `src/components/plan/protocol-tab.tsx`, `materials-tab.tsx`, `budget-tab.tsx`, `timeline-tab.tsx`, `validation-tab.tsx` — wrap each row in clickable surface that opens popover
  - `src/components/header-bar.tsx` — wire `useLabRules()` for live pill count
- **Wave 4 — Diff modal + previousPlan snapshot (1 plan, depends on Wave 2 + Wave 3):**
  - `src/components/plan-diff-modal.tsx` (new, Radix Dialog)
  - `src/components/plan-canvas.tsx` — accept `previousPlan` prop, render "Compare with previous plan" button
  - `src/components/plan-tabs.tsx` — accept optional `compareWith?: Plan` prop, propagate diff highlighting
  - `src/app/app/page.tsx` — add `previousPlan` snapshot state via `useRef`

If wave 2 and wave 3 are run in parallel by separate executors, ensure NO file overlap — confirmed: wave 2 touches `cache.ts`, `route.ts`, `agents/*.ts`; wave 3 touches `popover.tsx` (new), `tab.tsx` files, `header-bar.tsx`. No overlap.

### Risk reductions during execution
- After Wave 1 lands: smoke-test `curl -X GET http://localhost:3000/api/lab-rules` returns `{rules:[]}`, `curl -X POST` with a sample correction returns a `LabRule`.
- After Wave 2 lands: smoke-test by adding ONE rule manually to `data/lab_rules.json` and re-submitting h1 — verify the agents' system traces (in dev console) show the LAB RULES block.
- After Wave 3 lands: click a row in any tab, verify popover opens.
- After Wave 4 lands: full demo flow end-to-end.

### Demo pre-staging (Phase 8 territory but planner should be aware)
- Final pre-recording state has 1-2 universal rules already in `data/lab_rules.json` (committed to repo) so the deployed Vercel app shows the "after" state for the propagation half. Demo recording happens on local dev server where rules can be added live.

### Acceptance grep checks (for plan-checker if not skipped — listing for the planner anyway)
- Wave 1: `grep -l "labRuleSchema" src/lib/lab-rules/schema.ts` returns the file
- Wave 1: `grep -l "extractLabRule" src/lib/lab-rules/extractor.ts` returns the file
- Wave 1: `cat data/lab_rules.json` parses as JSON with `rules: []`
- Wave 2: `grep -c "labRules" src/lib/plan/agents/*.ts` ≥ 4 (one per agent)
- Wave 2: `grep "hashRunInput" src/app/api/plan/route.ts` returns the call site
- Wave 3: `grep -c "CorrectionPopover\|correction-popover" src/components/plan/*.tsx` ≥ 5 (one per tab)
- Wave 3: `grep "useLabRules" src/components/header-bar.tsx` returns the hook call
- Wave 4: `grep -l "PlanDiffModal\|plan-diff-modal" src/components/plan-canvas.tsx` returns the file
- Wave 4: `grep "previousPlan" src/app/app/page.tsx` returns the state reference
</specifics>

<deferred>
## Deferred Ideas

### Inside Phase 7 scope but cut for hackathon
- **Challenge action** (push back on agent — popover branch B). Cut per CLAUDE.md hard rule #3.
- **Annotate action** (free-text note — popover branch C). Cut per CLAUDE.md hard rule #3.
- **Lab profile drawer (LOOP-05)** — slide-in `<Sheet>` listing all rules + edit/delete. Cut per HANDOFF.json.
- **Per-line rule labels in diff modal (PROP-04)** — would require `applied_rules: LabRule[]` on each Plan slice, traced through agent output. Cut per HANDOFF.json. The diff itself + clay/rust highlight is enough to land the demo.

### Future-only (do NOT implement in Phase 7, surfaced for completeness)
- Cross-hypothesis rule generalization with embeddings (vector store + cosine similarity). Cut per DEFERRED.md.
- Rule conflict resolution + time decay (`confidence`, `last_used_at`, `superseded_by` fields). Cut per DEFERRED.md.
- Audit log for FDA/IRB compliance (Merkle-chained append-only log). Cut per DEFERRED.md.
- Edit/delete rules UI. Cut (part of LOOP-05 drawer).
- Authentication / multi-tenant rule storage (per-lab segregation). Cut per DEFERRED.md cross-cutting.
</deferred>

---

*Phase: 07-closed-loop-corrections*
*Context gathered: 2026-04-26 inline (no `/gsd-discuss-phase` — handoff data substituted to save ~80k tokens)*
