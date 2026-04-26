/**
 * In-memory QC response cache (D-50, D-51).
 *
 * Module-level Map keyed by SHA-256 of the trimmed-lowercased hypothesis.
 * Cleared on Vercel cold-start — acceptable per D-50; the demo will not
 * exhaust this. NO JSON-file cache (D-51) — would pollute git. NO DB
 * (CLAUDE.md hard rule #6).
 *
 * Module is server-only (depends on Node `crypto.subtle` and the route
 * runtime). Importing from a client component will throw at build time.
 */
import type { QCResponse } from "./schema";

const cache = new Map<string, QCResponse>();

export async function hashHypothesis(input: string): Promise<string> {
  const normalized = input.trim().toLowerCase();
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalized),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getCached(key: string): QCResponse | undefined {
  return cache.get(key);
}

export function setCached(key: string, value: QCResponse): void {
  cache.set(key, value);
}
