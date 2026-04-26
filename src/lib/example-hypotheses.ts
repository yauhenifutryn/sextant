/**
 * 4 example hypotheses for the empty-state hero (D-19).
 *
 * Verbatim from the Fulcrum hackathon brief, "Sample Inputs" section
 * (Diagnostics / Gut Health / Cell Biology / Climate). CLAUDE.md hard
 * rule #2 forbids substituting these — judges will recognize the brief.
 *
 * Source: .planning/research/fulcrum-brief.md
 */
export type ExampleHypothesis = Readonly<{
  id: string;
  /** Short pill label shown on the chip (≤ 32 chars). */
  label: string;
  /** Full hypothesis text sent to the textarea on click. */
  text: string;
}>;

export const EXAMPLE_HYPOTHESES: readonly ExampleHypothesis[] = [
  {
    id: "h1",
    label: "Diagnostics · CRP biosensor",
    text: "A paper-based electrochemical biosensor functionalized with anti-CRP antibodies will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L within 10 minutes, matching laboratory ELISA sensitivity without requiring sample preprocessing.",
  },
  {
    id: "h2",
    label: "Gut Health · L. rhamnosus GG",
    text: "Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce intestinal permeability by at least 30% compared to controls, measured by FITC-dextran assay, due to upregulation of tight junction proteins claudin-1 and occludin.",
  },
  {
    id: "h3",
    label: "Cell Biology · trehalose cryo",
    text: "Replacing sucrose with trehalose as a cryoprotectant in the freezing medium will increase post-thaw viability of HeLa cells by at least 15 percentage points compared to the standard DMSO protocol, due to trehalose's superior membrane stabilization at low temperatures.",
  },
  {
    id: "h4",
    label: "Climate · Sporomusa CO₂ fix",
    text: "Introducing Sporomusa ovata into a bioelectrochemical system at a cathode potential of −400mV vs SHE will fix CO₂ into acetate at a rate of at least 150 mmol/L/day, outperforming current biocatalytic carbon capture benchmarks by at least 20%.",
  },
] as const;
