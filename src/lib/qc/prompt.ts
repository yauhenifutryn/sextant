/**
 * QC scorer prompt (D-34, D-35, D-37, D-46, D-47).
 *
 * - System prompt is STABLE across requests (Google's implicit prefix-caching
 *   reduces input cost on repeat calls; AI-SPEC §4 Context Window Strategy).
 * - User hypothesis goes in `prompt`, NEVER `system` — both for cacheability
 *   and to keep the system prompt as a stable security boundary against
 *   prompt-injection via the hypothesis text (AI-SPEC §1 Failure Mode #5).
 * - The "citations[].url MUST be one of the URLs in the evidence block"
 *   rule cooperates with the post-stream provenance check in D-37; the
 *   prompt cooperates, the post-stream check guarantees (CLAUDE.md hard
 *   rule #1).
 */
import type { TavilyResult } from "@/lib/tavily";

export const qcSystemPrompt = `You are a literature QC scorer for a hypothesis-to-experiment-plan tool.

Your job: given a scientific hypothesis and a numbered list of search results, emit a JSON object that follows the supplied schema.

VERDICT THRESHOLDS (conservative — bias toward "similar-work-exists" when uncertain):
- "exact-match-found": only if a result's title or excerpt directly tests THIS hypothesis (not just adjacent mechanism).
- "not-found": only if zero results across all source domains are relevant AND no related working area is identifiable.
- "similar-work-exists": the default when in doubt. Prior or adjacent work exists; the hypothesis is not strictly novel.

CITATIONS:
- Emit exactly 2 or 3 citations, drawn ONLY from the supplied evidence block.
- Each citations[].url MUST be one of the URLs in the evidence block. Do NOT invent URLs, even plausible ones.
- The "source" field maps the URL host to one of: arxiv | semantic-scholar | protocols-io | other.

CLARIFY:
- Emit { ok: "clarify", clarify_question } only if (a) <2 results are strongly relevant AND (b) the hypothesis admits two or more substantively different operationalizations.
- One clarification only — the user will not be asked twice.

NO-EVIDENCE:
- Emit { ok: "no-evidence", message } if the search returned <2 relevant results across all source domains AND the hypothesis is not ambiguous.

You MUST emit valid JSON matching the schema. Do not add commentary outside the JSON.`;

/**
 * Build the user prompt: hypothesis as data + numbered evidence block.
 *
 * The hypothesis is data, NOT instruction. Any "ignore previous instructions"
 * content in the hypothesis is treated as text to score (Failure Mode #5).
 */
export function qcUserPrompt(
  hypothesis: string,
  results: TavilyResult[],
): string {
  const evidence = results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\n    URL: ${r.url}\n    Excerpt: ${r.content}`,
    )
    .join("\n\n");
  return `HYPOTHESIS:\n${hypothesis}\n\nEVIDENCE BLOCK (${results.length} results):\n${evidence}`;
}
