/**
 * In-memory Plan cache + run store + disk read-through (D-64, D-65).
 *
 * Three structures:
 *   - cacheIndex: Map<hypothesis_hash, run_id>  (D-65 — dedupe by hypothesis)
 *   - runStore:   Map<run_id, Plan>             (D-64 — in-memory live cache)
 *   - data/runs/<run_id>.json                   (D-64 — disk read-through; gitignored)
 *
 * Cold-start re-runs: in-memory clears, but disk JSONs survive — getCachedRun
 * checks memory first, then disk. Phase 7's diff modal reads two JSON files
 * for side-by-side compare.
 *
 * NO DB (CLAUDE.md hard rule #6). Module is server-only — depends on
 * Node `crypto.subtle` and `fs/promises`. Importing from a client component
 * will throw at build time.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Plan } from "./schema";
import type { LabRule } from "@/lib/lab-rules/schema";

const cacheIndex = new Map<string, string>(); // hypothesis_hash → run_id
export const runStore = new Map<string, Plan>(); // run_id → Plan

const RUNS_DIR = path.join(process.cwd(), "data", "runs");

/**
 * D7-11: hash the run input — hypothesis text + the stable content of any
 * lab rules in effect. This guarantees that Plan A (no rules) and Plan B
 * (one or more rules captured) produce DIFFERENT cache keys, so Plan B
 * actually re-runs the agents instead of short-circuiting to the cached
 * Plan A.
 *
 * Do NOT use rule IDs here. The 60s demo pre-warms the post-correction plan,
 * resets the local file to zero rules, then captures the same correction live.
 * That creates a fresh rule ID, but the effective rule is identical. Keying by
 * normalized source correction keeps that live capture on the warmed cache path.
 *
 * Note: hashRunInput(input, []) does NOT collide with the legacy
 * hashHypothesis(input) — the legacy hash was over the bare normalized
 * string, this one is over `${normalized}|[]`. This is an intentional
 * one-time cache invalidation on Phase 7 deploy: any pre-Phase-7 cached
 * Plan A entries become stale on the first request after deploy. The
 * legacy hashHypothesis is preserved as a thin wrapper so any forgotten
 * caller still compiles, and it now also produces the new keyspace.
 */
export async function hashRunInput(
  hypothesis: string,
  labRules: LabRule[] = [],
): Promise<string> {
  const normalized = hypothesis.trim().toLowerCase();
  const ruleKey = JSON.stringify(
    labRules
      .map((r) => `${r.scope}:${r.source_correction.trim().toLowerCase()}`)
      .sort((a, b) => a.localeCompare(b)),
  );
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${normalized}|${ruleKey}`),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Legacy alias. Kept so any forgotten caller compiles. Same hash as
 * hashRunInput(input, []) — see hashRunInput for the cache-invalidation note.
 */
export async function hashHypothesis(input: string): Promise<string> {
  return hashRunInput(input, []);
}

/**
 * D-64: in-memory write + fire-and-forget disk write. Errors logged, never thrown.
 */
export function setCachedRun(hypothesis_hash: string, plan: Plan): void {
  cacheIndex.set(hypothesis_hash, plan.run_id);
  runStore.set(plan.run_id, plan);
  void fs
    .mkdir(RUNS_DIR, { recursive: true })
    .then(() =>
      fs.writeFile(
        path.join(RUNS_DIR, `${plan.run_id}.json`),
        JSON.stringify(plan, null, 2),
      ),
    )
    .catch((err) =>
      console.error(
        JSON.stringify({
          event: "plan.disk.write_failed",
          run_id: plan.run_id,
          error: String(err),
        }),
      ),
    );
}

/**
 * D-64: cold-start fall-through. Memory hit → return; miss → check disk;
 * disk hit → re-hydrate memory + return; both miss → undefined.
 */
export async function getCachedRun(
  hypothesis_hash: string,
): Promise<Plan | undefined> {
  const run_id = cacheIndex.get(hypothesis_hash);
  if (!run_id) return undefined;
  const inMem = runStore.get(run_id);
  if (inMem) return inMem;
  try {
    const text = await fs.readFile(
      path.join(RUNS_DIR, `${run_id}.json`),
      "utf8",
    );
    const plan = JSON.parse(text) as Plan;
    runStore.set(run_id, plan);
    return plan;
  } catch {
    return undefined;
  }
}

export function getRunById(run_id: string): Plan | undefined {
  return runStore.get(run_id);
}
