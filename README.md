# Sextant

**AI Operations Platform for Contract Research.** A scientist enters a hypothesis; Sextant returns a fully-grounded experiment plan in about three minutes — protocol, materials, budget, timeline, and validation, every claim backed by a real source. Every correction the scientist makes becomes a typed lab rule that compounds into the next plan, automatically.

Built solo in 24 hours for the Hack-Nation 5 hackathon (Fulcrum Science "AI Scientist" track).

- **Live:** https://sextant-uekv.vercel.app
- **Demo video:** see `.planning/SUBMISSION.md`
- **Architecture diagram:** see `.planning/SUBMISSION.md` (Mermaid source)

---

## What it does

1. The user types or picks a hypothesis (four pre-loaded chips from the Fulcrum brief: a CRP biosensor, gut microbiome, cell cryopreservation, CO₂ fixation).
2. Sextant runs a literature check via Tavily across arXiv, Semantic Scholar, and protocols.io. ~4 seconds. Returns a verdict — *not found / similar work / exact match* — with three cited URLs.
3. Four AI agents fan out in parallel — Researcher, Skeptic, CRO Operator, Compliance — each one owning a slice of the plan. A fifth consolidator merges them into a single typed JSON document.
4. The plan paints into a five-tab canvas: Protocol, Materials, Budget, Timeline, Validation. Every reagent shows its catalog number, supplier, unit cost, and source links.
5. The user clicks any line to correct it. Sextant extracts the correction as a typed `LabRule { rule, scope, reasoning, source_correction }` and persists it to `data/lab_rules.json`.
6. On the next hypothesis, all four agent prompts are rewritten to include the stored rules. The new plan visibly reflects them. A "Compare with previous plan" diff modal proves the change side-by-side.

That last loop — typed rule capture, prompt-time injection, visible propagation — is the core technical claim.

---

## Why it matters

A CRO (Contract Research Organization) operator spends two to three weeks scoping a single experiment: literature review, protocol design, materials sourcing with real catalog numbers and prices, budget, timeline, and compliance posture. The output is usually a static document. Institutional knowledge dies when a scientist leaves.

Sextant collapses the scoping cycle to about three minutes, *and* — uniquely — captures every scientist correction as a structured artifact that improves the next plan. The rule store, accumulated over months of real lab usage, becomes that lab's private operating intelligence. That asset is the moat.

---

## Stack

| Layer | Choice |
|---|---|
| Runtime | Next.js 16 App Router on Node 20 |
| Language | TypeScript only |
| Styling | Tailwind v4 (`@theme`-first), shadcn/ui, Framer Motion, Lucide icons |
| AI orchestration | Vercel AI SDK v5 (`ai`, `@ai-sdk/google`, `@ai-sdk/react`) |
| Models | Gemini 2.5 Flash for all five agent calls + the rule extractor; runtime fallback ladder (preview → 2.5-flash → 2.0-flash) with a 60-second probe cache |
| Search / grounding | Tavily API |
| Storage | JSON files in repo (`data/runs/<id>.json` for plans, `data/lab_rules.json` for the rule store). No database. |
| Hosting | Vercel free tier; auto-deploy on push to `main`; ~30s deploys |

No new dependencies were added beyond the locked stack during the hackathon.

---

## Architecture

A single SSE stream carries both the structured Plan JSON *and* per-agent lifecycle events (`started → working → done` per agent), via the AI SDK's `createUIMessageStream` custom data parts. Per-agent failure isolation: a single agent error does not abort the run; the consolidator gets a null slice and a placeholder artifact.

```
Browser
  │  hypothesis
  ▼
/api/qc ── Tavily ──► arXiv / SemScholar / protocols.io
  │                    │
  └─► Gemini 2.5 Flash (lit-QC scorer) ─► verdict + 3 cited URLs (~4s)
                                            │
                                            ▼ auto-chain
/api/plan
  ├─► Researcher    (Tavily protocols.io + Gemini 2.5 Flash)
  ├─► Skeptic       (Gemini 2.5 Flash)
  ├─► Operator      (Gemini 2.5 Flash)
  └─► Compliance    (Gemini 2.5 Flash)
        │
        ▼ Promise.allSettled
  Consolidator (Gemini 2.5 Flash + thinking budget)
        │
        ▼ over single SSE stream + fire-and-forget disk write
  data/runs/<id>.json
        │
  Browser paints 5 tabs

/api/lab-rule  ◄── line correction
   └─► Gemini 2.5 Flash (typed rule extractor)
         │
         ▼
   data/lab_rules.json ─► injected into the next plan's agent prompts
```

Highlights worth flagging for engineering reviewers:

- **Provenance discipline.** A `grounded` flag on every Plan; a server-side `experimental_repairText` callback that rebuilds discriminator fields from response shape (no value invention) when Gemini's strict `oneOf`/`const` enforcement stalls; a post-stream provenance check that drops fabricated citations before they reach the client.
- **Structured Output with Zod.** The Plan, Citation, and LabRule shapes are Zod schemas. Agents stream into these schemas via the AI SDK's `streamObject`. The client reads only the typed object, never raw text.
- **Demo-pace toggle.** `SEXTANT_DEMO_PACE_MS=3500` adds visible per-agent latency on cache hits so the trace rail looks alive in screen recordings without faking results.
- **Cache invalidation.** The plan cache key is `SHA-256(hypothesis + sorted lab-rule IDs)` — capturing a new rule automatically invalidates prior plans for the same hypothesis. No stale propagation.

---

## Local development

```bash
git clone git@github.com:yauhenifutryn/sextant.git
cd sextant
npm install
cp .env.example .env.local   # fill in ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, TAVILY_API_KEY
npm run dev
```

The app boots at http://localhost:3000. Click "Open Sextant" to enter the dashboard at `/app`.

Required env vars:
- `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini API key
- `TAVILY_API_KEY` — Tavily search API key
- `ANTHROPIC_API_KEY` — currently unused at runtime, wired for future model swap
- `SEXTANT_DEMO_PACE_MS` — optional. Server-only. Adds a per-agent delay during the trace rail so cache hits don't flash done in milliseconds during screen recording.

---

## Roadmap

The hackathon ships the prototype that proves the loop closes. The investment thesis is *scaling the closure*: a working AI scientist that turns into a daily-use CRO operating system once it plugs into the customer's existing tooling.

Near-term (post-hackathon, weeks):
- Lab profile drawer — list/edit/delete captured rules, usage counts per rule.
- Per-line rule labels in the diff modal — show *which* rule applied to *which* changed line.
- Persistent multi-tenant store — Postgres with per-lab isolation.
- Audit log for regulatory sign-off — append-only Merkle-chained history of every rule change and every plan generation.
- Cross-hypothesis rule generalization via embedding match (rules apply when the new hypothesis is *semantically* close, not just string-matched).

Mid-term (months) — the actual moat lives here:
- **Warehouse stock integration.** Read-only connector into the customer's inventory system (LIMS, ELN, or a dedicated lab inventory app). When the Operator agent assembles the materials table, it cross-references reagents the lab already has on hand vs. what needs to be ordered. Plans become budget-aware and ordering-aware in one pass.
- **Auto-order from industry-standard procurement platforms.** Where the customer uses standard punch-out catalogs (Sigma-Aldrich SciQuest, Thermo Fisher OneSource, VWR, Coupa, Jaggaer), Sextant generates a draft purchase order pre-filled with catalog numbers, quantities, and the requesting scientist's account info. One-click submit from the Materials tab.
- **Auto-emailed orders to private suppliers.** Where the customer has a private supplier list (sole-source vendors, custom oligos, antibody producers), Sextant drafts an order email per vendor, attaches a structured quote-request PDF, and queues it for one-click send. Same materials table, two delivery channels.
- **ELN/LIMS write-back.** Push the finalized plan into Benchling, LabArchives, sapio, or whichever ELN the lab uses, as a pre-populated experiment shell.

Long-term:
- Workflow automation across the full CRO operating cycle: scoping, scheduling, sample tracking, sign-off, billing.
- Embedded compliance (FDA 21 CFR Part 11, GxP, IRB workflow integration) with the audit log as the regulatory artifact.
- Private model fine-tuning on the customer's accumulated rule store — turning institutional knowledge into a private model layer that competitors cannot replicate.

The defensibility argument runs through three layers: (1) the typed lab-rule artifact and closed-loop correction proven in the hackathon prototype; (2) workflow lock-in via the warehouse / procurement / ELN integrations above; (3) a private knowledge graph per lab tenant that compounds with use. Today's prototype is layer 1. Layers 2 and 3 are roadmap, not shipped.

---

## Honest limits

- Built solo in 24 hours.
- The lab rule store is seeded with a small number of demo rules. Real defensibility requires months of real-lab usage.
- The deployed Vercel runtime has a read-only filesystem, so live rule capture happens on the local dev server during recording. The deployed version shows a snapshot of the post-correction state.
- ELN/LIMS/procurement integrations are roadmap items, not shipped features.
- Multi-tenancy and audit log are roadmap items, not shipped features.
- The four pre-loaded hypothesis chips are verbatim from the Fulcrum brief. Arbitrary user-supplied hypotheses also work, but quality varies depending on whether Tavily returns useful supplier pages for less-common reagents.

---

## License

MIT.

---

## Acknowledgements

Built for Hack-Nation 5 (Fulcrum Science track). Sample hypotheses from the Fulcrum brief; literature search via Tavily; structured generation via Vercel AI SDK + Gemini.
