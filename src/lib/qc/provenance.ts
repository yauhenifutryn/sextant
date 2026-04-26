/**
 * Citation provenance guard (D-37 — anti-confabulation).
 *
 * After streamObject resolves, intersect every response.citations[].url
 * with the URL set Tavily returned. Drop any citation whose URL is not
 * in the input set; if fewer than 2 valid citations remain (D-36 floor),
 * upgrade the response to { ok: "no-evidence" } per D-37.
 *
 * Honors CLAUDE.md hard rule #1: the schema cannot enforce URL provenance —
 * only this post-stream check can.
 *
 * Pure function: no I/O, no globals, no logging. The route caller may log
 * the dropped-count for the structured-trace line per AI-SPEC §7.
 */
import type { QCResponse } from "./schema";
import type { TavilyResult } from "@/lib/tavily";

export type ProvenanceOutcome = {
  response: QCResponse;
  droppedCount: number; // # of citations that failed the URL-provenance check
};

export function validateCitationProvenance(
  response: QCResponse,
  tavilyResults: TavilyResult[],
): ProvenanceOutcome {
  if (response.ok !== "verdict") {
    return { response, droppedCount: 0 };
  }
  const allowedUrls = new Set(tavilyResults.map((r) => r.url));
  const original = response.citations;
  const valid = original.filter((c) => allowedUrls.has(c.url));
  const droppedCount = original.length - valid.length;
  if (valid.length < 2) {
    return {
      response: {
        ok: "no-evidence",
        message: "No verifiable sources after provenance check.",
      },
      droppedCount,
    };
  }
  return {
    response: {
      ...response,
      citations: valid as typeof response.citations,
    },
    droppedCount,
  };
}
