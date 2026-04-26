/**
 * Tavily search client (D-31, D-32, D-33).
 *
 * One broad call per hypothesis; no include_domains filter (D-31). Results
 * are post-grouped by URL host in the route handler. Reads the API key
 * via the typed env singleton — never via raw runtime variables (D-20, D-21).
 *
 * Vendor: https://docs.tavily.com/welcome — POST /search returns
 * { results: TavilyResult[] }; auth via Authorization: Bearer header.
 */
import { env } from "@/lib/env";

export type TavilyResult = {
  title: string;
  url: string;
  content: string; // Tavily's `content` field — used as excerpt as-is, no re-summarisation (D-32)
  score: number;
  raw_content?: null; // include_raw_content: false saves tokens (D-32)
};

/**
 * Run a single broad Tavily search. Throws on non-2xx; the route catches
 * and returns a typed `error` discriminant per D-48. No retry in v1 (D-33).
 *
 * AbortSignal.timeout(8000) — cold-start TLS handshake to api.tavily.com
 * is ~5s on Vercel free tier; 4s was too tight (verified live, both prod
 * and local hit it on first call). Direct probe with same key returns in
 * ~500ms once warm, so this only adds ceiling, not normal-path latency.
 */
export async function tavilySearch(query: string): Promise<TavilyResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      search_depth: "advanced", // D-32
      max_results: 10, // D-32
      include_answer: false, // D-32
      include_raw_content: false, // D-32
      topic: "general", // D-32
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Tavily ${res.status}`);
  const json = (await res.json()) as { results: TavilyResult[] };
  return json.results;
}
