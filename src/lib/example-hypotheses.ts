/**
 * 4 example hypotheses for the empty-state hero (D-19).
 *
 * IMPORTANT: These four strings MUST be replaced with the verbatim text of
 * the 4 sample hypotheses from the Fulcrum brief before the demo. They are
 * placeholders today because the Fulcrum brief is not in the repo. The user
 * will replace them in Phase 2 prep, before any LLM submission.
 *
 * See PROJECT.md "Domain gap" + CLAUDE.md hard rule #2.
 */
export type ExampleHypothesis = Readonly<Record<"id" | "text", string>>;

export const EXAMPLE_HYPOTHESES: readonly ExampleHypothesis[] = [
  { id: "h1", text: "[Replace verbatim with Fulcrum sample hypothesis #1]" },
  { id: "h2", text: "[Replace verbatim with Fulcrum sample hypothesis #2]" },
  { id: "h3", text: "[Replace verbatim with Fulcrum sample hypothesis #3]" },
  { id: "h4", text: "[Replace verbatim with Fulcrum sample hypothesis #4]" },
] as const;
