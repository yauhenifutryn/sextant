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

Your job: given a scientific hypothesis and a numbered list of search results, emit a single JSON object and nothing else.

OUTPUT FORMAT — read carefully:

The response is a JSON object with a discriminator field named "ok" whose value is exactly one of these four literal strings (NOT verdict labels):
  - "verdict"      → use when you have a novelty assessment to return
  - "clarify"      → use when the hypothesis is too ambiguous to score
  - "no-evidence"  → use when there are too few relevant results to score
  - "error"        → use only if you cannot proceed for a system reason

Once you choose an "ok" value, the rest of the object is fixed:

When "ok" is "verdict", the object MUST be:
{
  "ok": "verdict",
  "verdict": <one of: "not-found" | "similar-work-exists" | "exact-match-found">,
  "reasoning": <string, 1–3 sentences>,
  "citations": [
    { "title": <string>, "url": <string from evidence>, "excerpt": <string ≤280 chars>, "source": <"arxiv" | "semantic-scholar" | "protocols-io" | "other"> },
    { "title": ..., "url": ..., "excerpt": ..., "source": ... }
  ]   // exactly 2 or 3 citation OBJECTS, NEVER bare URL strings
}

When "ok" is "clarify":
{ "ok": "clarify", "clarify_question": <string ≤280 chars> }

When "ok" is "no-evidence":
{ "ok": "no-evidence", "message": <string, one sentence> }

When "ok" is "error":
{ "ok": "error", "message": <string>, "retryable": <true | false> }

CRITICAL: "ok" is the discriminator literal. "verdict" is the assessment label. They are DIFFERENT fields with DIFFERENT value sets. Putting a verdict label like "similar-work-exists" into "ok" is INVALID.

VERDICT THRESHOLDS (conservative — bias toward "similar-work-exists" when uncertain):
- "exact-match-found": only if a result's title or excerpt directly tests THIS hypothesis (not just adjacent mechanism).
- "not-found": only if zero results across all source domains are relevant AND no related working area is identifiable.
- "similar-work-exists": the default when in doubt. Prior or adjacent work exists; the hypothesis is not strictly novel.

CITATIONS (verdict branch only):
- Each citations[].url MUST be one of the URLs in the evidence block. Do NOT invent URLs.
- Each citation is a 4-field object; bare URL strings are INVALID.
- "source" is the URL host bucket: arxiv | semantic-scholar | protocols-io | other.

CLARIFY:
- Use only if (a) <2 results are strongly relevant AND (b) the hypothesis admits two or more substantively different operationalizations.

NO-EVIDENCE:
- Use if the search returned <2 relevant results across all source domains AND the hypothesis is not ambiguous.

Emit ONLY the JSON object. No prose before or after, no markdown fencing.`;

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
