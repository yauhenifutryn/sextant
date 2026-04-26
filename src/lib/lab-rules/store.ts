/**
 * File-backed lab-rules store (D7-03, D7-04).
 *
 * Canonical location: data/lab_rules.json (committed to repo per D7-03 — NOT
 * gitignored). Read-through from disk on every call (no in-memory cache —
 * N <= 10 in demo, file IO is trivial).
 *
 * On Vercel: filesystem is read-only at runtime; deploy-time commit is the
 * way rules show up. Local dev writes to disk normally and the demo recording
 * happens on the local server.
 *
 * NO DB (CLAUDE.md hard rule #6).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { labRulesFileSchema, type LabRule } from "./schema";

const RULES_FILE = path.join(process.cwd(), "data", "lab_rules.json");

/**
 * Read all stored rules. Missing or malformed file → returns []. Never throws.
 */
export async function getLabRules(): Promise<LabRule[]> {
  try {
    const text = await fs.readFile(RULES_FILE, "utf8");
    const parsed = labRulesFileSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return [];
    return parsed.data.rules;
  } catch {
    return [];
  }
}

/**
 * Append a rule and write back to disk. On Vercel runtime this will throw
 * (read-only FS) — caller (route.ts) catches and returns a 500 with a clear
 * message. Local dev / hackathon demo writes succeed normally.
 */
export async function addLabRule(rule: LabRule): Promise<void> {
  const existing = await getLabRules();
  const next = { rules: [...existing, rule] };
  await fs.mkdir(path.dirname(RULES_FILE), { recursive: true });
  await fs.writeFile(RULES_FILE, JSON.stringify(next, null, 2));
}
