/**
 * Phase 5 LITE — Materials citation enricher.
 *
 * One Tavily call per Plan. Query is built from the top 3 material names
 * (Tavily's `query` field is a single string; we comma-join the names).
 * Results are returned as Citation[] and broadcast to all material rows
 * by the caller (route.ts). Failures return [] — caller leaves
 * plan.grounded=false and citations=[] per CLAUDE.md hard rule #1.
 *
 * Deferred per .planning/DEFERRED.md:
 *   - per-row Tavily search (one call per protocol step / row)
 *   - GROUND-05 URL pre-flight verification
 *   - real supplier-page scraping (Sigma-Aldrich, Thermo Fisher punch-out)
 *   - HoverCard polish (uses native title attr in CitationSlot for now)
 */
import type { z } from "zod";
import { tavilySearch, type TavilyResult } from "@/lib/tavily";
import type { Plan } from "@/lib/plan/schema";
import { citationSchema } from "@/lib/qc/schema";

// Local type alias — same pattern as src/components/plan/citation-slot.tsx
// (qc/schema.ts is locked; we infer at the import site).
type Citation = z.infer<typeof citationSchema>;

/**
 * Build a single Tavily query string from the top 3 material names.
 * Returns null if there are no materials to query.
 */
function buildMaterialsQuery(plan: Plan): string | null {
  const names = plan.plan.materials
    .map((m) => m.name?.trim())
    .filter((n): n is string => !!n && n.length > 0)
    .slice(0, 3);
  if (names.length === 0) return null;
  return `${names.join(", ")} catalog supplier`;
}

/**
 * Map a Tavily result URL to the citationSchema source enum. Defaults to
 * "other" for anything that isn't one of the 3 explicit literature sources.
 * Sigma-Aldrich / Thermo Fisher etc. all bucket as "other" — the field is
 * a categorisation hint, not a content guarantee.
 */
function urlToSource(url: string): Citation["source"] {
  if (url.includes("arxiv.org")) return "arxiv";
  if (url.includes("semanticscholar.org")) return "semantic-scholar";
  if (url.includes("protocols.io")) return "protocols-io";
  return "other";
}

/**
 * Map Tavily results to Citation[]. Trims excerpts to 200 chars to match
 * citationSchema's "1-line excerpt" semantic. Filters out results whose
 * url is empty (defensive — Tavily occasionally returns blanks).
 */
function tavilyToCitations(results: TavilyResult[]): Citation[] {
  return results
    .filter((r) => r.url && r.title)
    .slice(0, 4)
    .map((r) => ({
      title: r.title.slice(0, 240),
      url: r.url,
      excerpt: (r.content ?? "").trim().slice(0, 200),
      source: urlToSource(r.url),
    }));
}

/**
 * Run ONE Tavily search and return the citation set for ALL material rows.
 * Caller (route.ts) is responsible for assigning these to each row's
 * `citations` field. On any failure, returns [] — caller leaves plan as-is
 * (no fake citations per hard rule #1).
 */
export async function enrichMaterialsCitations(
  plan: Plan,
): Promise<Citation[]> {
  const query = buildMaterialsQuery(plan);
  if (!query) return [];

  try {
    const results = await tavilySearch(query);
    return tavilyToCitations(results);
  } catch {
    return [];
  }
}
