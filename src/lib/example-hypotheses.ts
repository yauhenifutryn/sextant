/**
 * 4 example hypotheses for the empty-state hero (D-19).
 *
 * MUST BE REPLACED WITH THE FULCRUM BRIEF'S VERBATIM 4 BEFORE LIVE DEMO.
 * These are temporary realistic-sounding stand-ins so the dashboard shell
 * doesn't show "[Replace verbatim with Fulcrum sample hypothesis #N]" on
 * the deployed preview. They mirror the three hypotheses the landing-page
 * lab-notebook cycles through (Cas13d / mTOR / AAV9), plus one CRISPR-screen
 * variant. When the Fulcrum brief lands, replace ALL four with the verbatim
 * text — see project CLAUDE.md hard rule #2 (no invented hypotheses for
 * actual demo input).
 *
 * See PROJECT.md "Domain gap" + CLAUDE.md hard rule #2.
 */
export type ExampleHypothesis = Readonly<Record<"id" | "text", string>>;

export const EXAMPLE_HYPOTHESES: readonly ExampleHypothesis[] = [
  {
    id: "h1",
    text: "Test whether Cas13d knockdown of IFN-γ in primary CD8+ T-cells reduces exhaustion markers without compromising cytolytic function.",
  },
  {
    id: "h2",
    text: "Determine the minimum effective dose of rapamycin in a mouse liver fibrosis model that suppresses mTORC1 without triggering hyperglycemia.",
  },
  {
    id: "h3",
    text: "Assess whether retro-orbital AAV9-CMV-GFP delivery in C57BL/6 mice achieves comparable hippocampal transduction to intracerebroventricular injection at 1/10th the dose.",
  },
  {
    id: "h4",
    text: "Run a genome-wide CRISPR screen in K562 cells to identify regulators of c-MYC stability under glucose-limited conditions.",
  },
] as const;
