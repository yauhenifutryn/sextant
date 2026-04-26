# Fulcrum Hackathon Brief — verbatim

Source: pasted by user 2026-04-26. Track 04: AI Scientist (powered by Fulcrum Science).
Pitch focus: hypothesis → runnable experiment plan, with literature QC step + scientist
review (stretch).

---

## Three stages

1. **Input** — natural-language scientific question
2. **Literature QC** — has this exact protocol been done before?
3. **Experiment Plan** — full operational plan (the core deliverable)

## Primary deliverable: full experiment planning

A plan a real PI would order materials from on Monday and start running Friday. Includes:

- **Protocol** — step-by-step methodology grounded in real published protocols
- **Materials & supply chain** — specific reagents, catalog numbers, suppliers
- **Budget** — realistic cost estimate with line items
- **Timeline** — phased breakdown with dependencies
- **Validation approach** — how success/failure will be measured

**Quality bar:** would a real scientist trust this plan enough to order materials?

## Literature QC step

A "plagiarism check, but for science." Fast novelty signal:

- `not found` | `similar work exists` | `exact match found`
- 1–3 relevant references where applicable

Source-of-truth choice is open — arXiv, Semantic Scholar, protocols.io, or others.

## UI requirements

- Plain-language scientific question input
- Literature QC verdict clearly visible BEFORE the plan is generated
- Full experiment plan readable and navigable
- Budget / timeline / materials understood at a glance

## Stretch: scientist review (closing the learning loop)

The hardest, highest-ceiling part. Pattern:

- Structured review interface (rate, correct, annotate sections — protocol steps,
  reagents, budget, timeline)
- Feedback store keyed by experiment type / domain
- Generation layer incorporates prior corrections (few-shot at minimum, lightweight
  fine-tune at best)

**Demo win condition:** judge watches a plan generated → scientist makes corrections →
the NEXT plan for a similar experiment visibly reflects those corrections without
being explicitly re-prompted.

## Sample inputs (verbatim — wired into `src/lib/example-hypotheses.ts`)

1. **Diagnostics — CRP biosensor**
   "A paper-based electrochemical biosensor functionalized with anti-CRP antibodies
   will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L
   within 10 minutes, matching laboratory ELISA sensitivity without requiring sample
   preprocessing."

2. **Gut Health — L. rhamnosus GG**
   "Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce
   intestinal permeability by at least 30% compared to controls, measured by
   FITC-dextran assay, due to upregulation of tight junction proteins claudin-1 and
   occludin."

3. **Cell Biology — trehalose cryoprotection**
   "Replacing sucrose with trehalose as a cryoprotectant in the freezing medium will
   increase post-thaw viability of HeLa cells by at least 15 percentage points
   compared to the standard DMSO protocol, due to trehalose's superior membrane
   stabilization at low temperatures."

4. **Climate — Sporomusa ovata CO₂ fixation**
   "Introducing Sporomusa ovata into a bioelectrochemical system at a cathode
   potential of −400mV vs SHE will fix CO₂ into acetate at a rate of at least
   150 mmol/L/day, outperforming current biocatalytic carbon capture benchmarks by
   at least 20%."

What makes these strong inputs (per the brief):
- specific intervention named
- measurable outcome with a threshold
- mechanistic reason
- implies a clear control condition

## Hint resources (relevant to Phases 2–5)

### Protocol repositories (Phase 2 Tavily targets + Phase 3 plan grounding)
- `protocols.io` — largest active repository, structured format
- `bio-protocol.org` — peer-reviewed, linked to papers
- `nature.com/nprot` — Nature Protocols, premium detail
- `jove.com` — JOVE video protocols with written transcripts
- `openwetware.org` — community protocols

### Supplier references (Phase 5 catalog/citation grounding)
- `thermofisher.com/us/en/home/technical-resources/application-notes.html`
- `sigmaaldrich.com/US/en/technical-documents`
- `promega.com/resources/protocols`
- `qiagen.com/us/resources/resourcedetail?id=protocols`
- `idtdna.com/pages/tools` — primer design + qPCR

### Reagent / cell-line references
- `atcc.org` — ATCC cell line protocols
- `addgene.org/protocols` — cloning + transfection

### Scientific standards
- MIQE guidelines for qPCR: `ncbi.nlm.nih.gov/pmc/articles/PMC2737408`

## What good looks like (judging anchor)

> "Can we improve solar cell efficiency by testing alternative materials?" →
> tool checks novelty, surfaces 2 prior papers, flags as `similar work exists`,
> generates a 6-step synthesis protocol grounded in protocols.io, materials list
> with catalog numbers and a £12,000 budget, 10-week timeline.

## Contacts

`arun@fulcrum.science` / `jonas@fulcrum.science`

---

**Note on link fetching:** the URLs above are domain anchors for Tavily search
(Phase 2) and supplier-citation grounding (Phase 5). Fetching each homepage now
returns marketing-page content with no operational value. The system will hit
these domains via Tavily during plan generation — that's where they pay off.
