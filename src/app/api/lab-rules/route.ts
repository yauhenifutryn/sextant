/**
 * GET / POST /api/lab-rules — Phase 7 closed-loop endpoints (D7-07).
 *
 * GET: returns { rules: LabRule[] } from data/lab_rules.json (no streaming).
 * POST: { correction, planContext: { hypothesis, sliceJson }, targetLine: { kind, label } }
 *       → runs the extractor, post-fills id + created_at, appends to disk,
 *       returns the new LabRule as JSON.
 *
 * runtime: "nodejs" (fs/promises + crypto.randomUUID)
 * maxDuration: 15 (extractor 12s + IO 1-2s headroom)
 */
import { z } from "zod";
import { extractLabRule } from "@/lib/lab-rules/extractor";
import { addLabRule, getLabRules } from "@/lib/lab-rules/store";
import {
  labRuleScopeEnum,
  type LabRule,
} from "@/lib/lab-rules/schema";

export const runtime = "nodejs";
export const maxDuration = 15;

const postBodySchema = z.object({
  correction: z.string().min(1).max(2000),
  planContext: z.object({
    hypothesis: z.string().min(1).max(4000),
    sliceJson: z.string().max(20_000),
  }),
  targetLine: z.object({
    kind: labRuleScopeEnum,
    label: z.string().min(1).max(400),
  }),
});

function logEvent(line: Record<string, unknown>): void {
  console.log(JSON.stringify(line));
}

export async function GET(): Promise<Response> {
  const rules = await getLabRules();
  return Response.json({ rules });
}

export async function POST(req: Request): Promise<Response> {
  const t0 = Date.now();
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = postBodySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let draft;
  try {
    draft = await extractLabRule(parsed.data);
  } catch (err) {
    logEvent({
      event: "lab_rules.extract.failed",
      error: String(err).slice(0, 400),
    });
    return Response.json({ error: "extractor_failed" }, { status: 502 });
  }

  // D7-05: server post-fills id + created_at; the model never invents these.
  const rule: LabRule = {
    ...draft,
    id: crypto.randomUUID().slice(0, 8),
    created_at: new Date().toISOString(),
  };

  try {
    await addLabRule(rule);
  } catch (err) {
    logEvent({
      event: "lab_rules.persist.failed",
      error: String(err).slice(0, 400),
    });
    return Response.json(
      { error: "persist_failed", message: String(err).slice(0, 200) },
      { status: 500 },
    );
  }

  logEvent({
    event: "lab_rules.captured",
    rule_id: rule.id,
    scope: rule.scope,
    latency_ms: Date.now() - t0,
  });
  return Response.json(rule, { status: 201 });
}
