# Phase 3: Multi-Agent Pipeline — Pattern Map

**Mapped:** 2026-04-26
**Files analyzed:** 12 (11 NEW + 1 MODIFY) + 1 .gitignore append
**Analogs found:** 12 / 12 (every Phase 3 file has a Phase 2 sibling pattern)

---

## File Classification

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/api/plan/route.ts` (NEW) | route handler (server) | streaming (multi-stream + custom data parts) | `src/app/api/qc/route.ts` | role-match (single→multi streamObject is the new wrinkle) |
| `src/lib/plan/schema.ts` (NEW) | zod schema (shared server↔client) | request-response | `src/lib/qc/schema.ts` | exact (citation reuse + nested object schema) |
| `src/lib/plan/trace.ts` (NEW) | zod schema (`AgentEvent` discriminated union) | event-driven (server emits, client renders) | `src/lib/qc/schema.ts` (qcResponseSchema discriminated union) | exact (same `z.discriminatedUnion` pattern) |
| `src/lib/plan/cache.ts` (NEW) | utility (in-memory store + hash) | CRUD-on-Map | `src/lib/qc/cache.ts` | exact (clone + extend with `runStore` + disk read-through) |
| `src/lib/plan/agents/researcher.ts` (NEW) | prompt module + (optional) per-agent runner | request-response (LLM call w/ Tavily) | `src/lib/qc/prompt.ts` + body of `src/app/api/qc/route.ts` lines 87-115 | role-match (same prompt-pair shape; adds Tavily orchestration) |
| `src/lib/plan/agents/skeptic.ts` (NEW) | prompt module + per-agent runner | request-response (LLM call only) | `src/lib/qc/prompt.ts` | role-match (no Tavily — simpler) |
| `src/lib/plan/agents/operator.ts` (NEW) | prompt module + per-agent runner | request-response | `src/lib/qc/prompt.ts` | role-match |
| `src/lib/plan/agents/compliance.ts` (NEW) | prompt module + per-agent runner | request-response | `src/lib/qc/prompt.ts` | role-match |
| `src/lib/plan/consolidator.ts` (NEW) | service (merges 4 agent slices) | transform (4 inputs → 1 Plan via streamObject) | `src/app/api/qc/route.ts` lines 87-167 (streamObject + onFinish + repair) | partial (pure synthesis call; no Tavily; longer thinking budget) |
| `src/components/plan/use-plan.ts` (NEW) | client hook | streaming (consume UI message stream) | `src/components/qc/use-qc.ts` | role-match (`useObject` → `useChat`/`readUIMessageStream` for data parts) |
| `data/runs/.gitkeep` (NEW) + `.gitignore` append | config | filesystem | (none — new runtime asset directory) | none |
| `src/app/app/page.tsx` (MODIFY — `Dashboard`) | client component (orchestrator shell) | wire-in | self (existing `useQc()` lines 27-122) | exact (sibling hook call + auto-trigger `useEffect`) |

**Notes on classification:**
- The dashboard file is at `src/app/app/page.tsx` (NOT `src/components/dashboard/dashboard.tsx`). Plans must point to the actual file.
- `src/lib/plan/agents/*.ts` are 4 prompt+runner modules; CONTEXT.md `## Claude's Discretion` allows consolidating to a single `agents.ts`, but the per-file split is recommended for diff readability and parallel-edit safety during execution.
- `src/lib/qc/provenance.ts` is the analog for Phase 5's grounding pass; Phase 3 does NOT add a Plan-level provenance module yet (citations stay `[]`, `grounded: false`).

---

## Pattern Assignments

### `src/app/api/plan/route.ts` (NEW)

**Analog:** `src/app/api/qc/route.ts`

**Imports pattern** (lines 17-24, 26-27):

```typescript
import { streamObject } from "ai";
import { google } from "@ai-sdk/google";
import { qcResponseSchema, type QCResponse } from "@/lib/qc/schema";
import { qcSystemPrompt, qcUserPrompt } from "@/lib/qc/prompt";
import { tavilySearch, type TavilyResult } from "@/lib/tavily";
import { hashHypothesis, getCached, setCached } from "@/lib/qc/cache";
import { validateCitationProvenance } from "@/lib/qc/provenance";
import { pickAvailableLitQcModel } from "@/lib/models";

export const runtime = "nodejs";
export const maxDuration = 30;
```

**Adapted for Phase 3 (D-66 timeout 50s; D-68 ULID):**

```typescript
import { streamObject, createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { google } from "@ai-sdk/google";
import { ulid } from "ulid"; // D-68 — single new dep, justified per CLAUDE.md hard rule #5
import { planSchema, type Plan } from "@/lib/plan/schema";
import { agentEventSchema, type AgentEvent } from "@/lib/plan/trace";
import { runResearcher, runSkeptic, runOperator, runCompliance } from "@/lib/plan/agents/...";
import { runConsolidator } from "@/lib/plan/consolidator";
import { hashHypothesis, getCachedRun, setCachedRun, runStore } from "@/lib/plan/cache";
import { pickAvailableLitQcModel } from "@/lib/models";

export const runtime = "nodejs";
export const maxDuration = 60; // D-66 worst-case 50s; pad to Vercel cap of 60.
```

**Cache short-circuit pattern** (lines 32-52) — adapt to read both in-memory `Map` and `data/runs/<run_id>.json` per D-64:

```typescript
const key = await hashHypothesis(hypothesis);
const cached = getCached(key);
if (cached) {
  logRequest({ ...metadata, cache_hit: true });
  return Response.json(cached);
}
```

**Model picker reuse** (line 57):

```typescript
const modelId = await pickAvailableLitQcModel();
```

**streamObject configuration template** (lines 87-114) — apply to each of the 4 agents and the consolidator:

```typescript
const result = streamObject({
  model: google(modelId),
  schema: <agentSliceSchema>,
  system: <agentSystemPrompt>,
  prompt: <agentUserPrompt(hypothesis, qcContext, /* tavily for researcher only */)>,
  temperature: 0.2,
  maxOutputTokens: <agent-specific budget>,
  providerOptions: {
    google: {
      structuredOutputs: false,
      thinkingConfig: { thinkingBudget: 0 }, // 0 for debaters; 4000 for consolidator (D-55)
    },
  },
  experimental_repairText: async ({ text }) => repairDiscriminator(text),
  abortSignal: AbortSignal.timeout(35_000), // D-66
  onFinish: ({ object, error }) => { /* per-agent log + writer.write({ type:'data-trace', ... }) */ },
});
```

**onFinish + structured logging pattern** (lines 123-166) — Phase 3 emits trace events to the SSE writer instead of just logging:

```typescript
onFinish: ({ object, error }) => {
  if (error || !object) {
    writer.write({
      type: "data-trace",
      data: { stage: "error", run_id, agent_id: "researcher", error_message: String(error), retryable: false, ts: new Date().toISOString() },
    });
    return;
  }
  // success path: validate slice, attach to runStore, emit `done` event
}
```

**Structured trace log line shape** (lines 179-196) — Phase 3 mirrors with `event: "plan.run.started" | "plan.agent.completed" | "plan.run.completed"`:

```typescript
function logRequest(line: RequestLog): void {
  console.log(JSON.stringify({ event: "qc.request", ...line }));
}
```

**Repair-text pattern** (lines 213-312) — copy `repairDiscriminator` shape verbatim, but parameterize per-agent (each agent's slice has a different schema; the discriminator hack is QC-specific). For Phase 3, prefer per-agent narrow `repairText` that fixes only common Gemini quirks for that slice (truncate over-long strings, coerce numeric strings to numbers in budget rows). Keep the spirit: **reconstruction from model output, never invention**.

**New transport — `createUIMessageStream` (D-60):**

The Phase 2 route returns `result.toTextStreamResponse()` (line 172). Phase 3 must instead build a UI message stream that carries BOTH plan parts AND `data-trace` parts:

```typescript
const stream = createUIMessageStream({
  execute: async ({ writer }) => {
    const run_id = ulid();
    writer.write({ type: "data-trace", data: { stage: "started", run_id, agent_id: "researcher", task: "Drafting protocol from CRP biosensor lit-QC", ts: new Date().toISOString() } });

    const [researcherSlice, skepticSlice, operatorSlice, complianceSlice] = await Promise.allSettled([
      runResearcher({ hypothesis, qcContext, modelId, writer, run_id }),
      runSkeptic({ hypothesis, qcContext, modelId, writer, run_id }),
      runOperator({ hypothesis, qcContext, modelId, writer, run_id }),
      runCompliance({ hypothesis, qcContext, modelId, writer, run_id }),
    ]);

    const plan = await runConsolidator({ /* ...slices, writer, run_id */ });
    runStore.set(run_id, plan);
    void fs.promises.writeFile(`data/runs/${run_id}.json`, JSON.stringify(plan)); // fire-and-forget per D-64
    writer.write({ type: "data-plan", data: plan }); // final assembled plan as a custom data part
  },
});
return createUIMessageStreamResponse({ stream });
```

Reference: AI SDK v5 `createUIMessageStream` docs (canonical_refs §"Vendor docs"). The pattern is read-this-first; Phase 2's `toTextStreamResponse` is a different helper (see lines 169-172 + comments).

---

### `src/lib/plan/schema.ts` (NEW)

**Analog:** `src/lib/qc/schema.ts`

**File header pattern** (lines 1-13):

```typescript
/**
 * Plan response Zod schema.
 *
 * Single source of truth for both the server route AND the client hook.
 * Imports `citationSchema` from QC's schema (do NOT redefine — D-58).
 */
import { z } from "zod";
import { citationSchema } from "@/lib/qc/schema"; // D-58 reuse
```

**Citation reuse** — import `citationSchema` directly from `src/lib/qc/schema.ts:14-33`. Do NOT redefine it.

**Per-row schema pattern** — mirror lines 35-59 (`qcResponseSchema`'s discriminated union) but for nested object schemas:

```typescript
export const protocolStepSchema = z.object({
  step_number: z.number().int().positive(),
  description: z.string().min(1).max(800),
  duration_estimate: z.string().min(1).max(120), // free-form: "30 min", "2 h"
  citations: z.array(citationSchema).default([]), // empty in Phase 3 (D-59)
});

export const materialRowSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.string().min(1).max(80),
  supplier: z.string().nullable(), // empty until Phase 5 (D-56)
  catalog_number: z.string().nullable(),
  unit_price_usd: z.number().nullable(),
  citations: z.array(citationSchema).default([]),
});

export const budgetLineSchema = z.object({
  category: z.string().min(1).max(120),
  amount_usd: z.number().nonnegative(),
  notes: z.string().max(280).optional(),
  citations: z.array(citationSchema).default([]),
});

export const timelinePhaseSchema = z.object({
  phase: z.string().min(1).max(120),
  duration_days: z.number().int().positive(),
  depends_on: z.array(z.string()).default([]),
  citations: z.array(citationSchema).default([]),
});

export const validationCheckSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(400),
  measurement_method: z.string().min(1).max(280),
  pass_criteria: z.string().min(1).max(280),
});

export const complianceNoteSchema = z.object({
  target_kind: z.enum(["protocol_step", "material_row", "global"]),
  target_index: z.number().int().nonnegative().nullable(),
  note: z.string().min(1).max(600),
  severity: z.enum(["info", "caution", "blocking"]),
});

export const agentArtifactSchema = z.object({
  raw_draft: z.unknown(), // server attaches the agent's pre-consolidator output for debugging
  model_id: z.string(),
  elapsed_ms: z.number().nonnegative(),
  token_count: z.number().int().nonnegative().optional(),
  error: z.string().optional(),
});

export const planSchema = z.object({
  run_id: z.string(),
  hypothesis: z.string(),
  qc_run_id: z.string().nullable(),
  grounded: z.boolean(), // false in Phase 3 (D-59)
  plan: z.object({
    protocol: z.array(protocolStepSchema),
    materials: z.array(materialRowSchema),
    budget: z.array(budgetLineSchema),
    timeline: z.array(timelinePhaseSchema),
    validation: z.array(validationCheckSchema).min(5), // TRACE-03 floor (D-58)
  }),
  agent_artifacts: z.object({
    researcher: agentArtifactSchema,
    skeptic: agentArtifactSchema,
    operator: agentArtifactSchema,
    compliance: agentArtifactSchema,
  }),
  compliance_summary: z.string(),
  model_id: z.string(),
  latency_ms: z.number().nonnegative(),
  generated_at: z.string(), // ISO timestamp
});

export type Plan = z.infer<typeof planSchema>;
```

**Type export pattern** (line 61): `export type Plan = z.infer<typeof planSchema>;` — same shape as Phase 2.

---

### `src/lib/plan/trace.ts` (NEW — `AgentEvent` schema)

**Analog:** `src/lib/qc/schema.ts` lines 35-59 (`qcResponseSchema` discriminated union)

**Pattern to copy** — discriminated union by literal string field:

```typescript
import { z } from "zod";

export const agentIdSchema = z.enum([
  "researcher", "skeptic", "operator", "compliance", "consolidator",
]);

export const agentEventSchema = z.discriminatedUnion("stage", [
  z.object({
    stage: z.literal("started"),
    run_id: z.string(),
    agent_id: agentIdSchema,
    task: z.string().min(1).max(280),
    ts: z.string(),
  }),
  z.object({
    stage: z.literal("working"),
    run_id: z.string(),
    agent_id: agentIdSchema,
    activity: z.string().min(1).max(280),
    ts: z.string(),
  }),
  z.object({
    stage: z.literal("done"),
    run_id: z.string(),
    agent_id: agentIdSchema,
    elapsed_ms: z.number().nonnegative(),
    token_count: z.number().int().nonnegative().optional(),
    output_preview: z.string().max(120).optional(),
    ts: z.string(),
  }),
  z.object({
    stage: z.literal("error"),
    run_id: z.string(),
    agent_id: agentIdSchema,
    error_message: z.string().min(1).max(400),
    retryable: z.boolean(),
    ts: z.string(),
  }),
]);

export type AgentEvent = z.infer<typeof agentEventSchema>;
export type AgentId = z.infer<typeof agentIdSchema>;
```

**Why this analog:** Phase 2 D-40's `qcResponseSchema` proved the discriminated-union pattern works end-to-end (server emit → SDK serialize → wire → client narrow). Same shape, different discriminator field name (`stage` vs `ok`). Both client (`use-plan.ts`) and Phase 6 trace-rail will narrow on `event.stage` exactly the way `verdict-card.tsx` narrows on `obj.ok`.

---

### `src/lib/plan/cache.ts` (NEW)

**Analog:** `src/lib/qc/cache.ts`

**File header pattern** (lines 1-12):

```typescript
/**
 * In-memory Plan cache + run store (D-64, D-65).
 *
 * Two structures:
 *   - cacheIndex: Map<hypothesis_hash, run_id>  — D-65 dedupe
 *   - runStore:   Map<run_id, Plan>             — D-64 in-memory live cache
 *   - data/runs/<run_id>.json                   — D-64 disk read-through
 *
 * Module is server-only (depends on Node `crypto.subtle` + `fs/promises`).
 */
```

**Hash function** (lines 16-25) — copy verbatim with a renamed export (or re-export from QC's cache):

```typescript
export async function hashHypothesis(input: string): Promise<string> {
  const normalized = input.trim().toLowerCase();
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
```

**Map cache pattern** (lines 14, 27-33) — mirror but extend with read-through to disk:

```typescript
import type { Plan } from "./schema";
import { promises as fs } from "node:fs";
import path from "node:path";

const cacheIndex = new Map<string, string>(); // hypothesis_hash → run_id
const runStore = new Map<string, Plan>();     // run_id → Plan

const RUNS_DIR = path.join(process.cwd(), "data", "runs");

export function setCachedRun(hypothesis_hash: string, plan: Plan): void {
  cacheIndex.set(hypothesis_hash, plan.run_id);
  runStore.set(plan.run_id, plan);
  // D-64: fire-and-forget disk write
  void fs.mkdir(RUNS_DIR, { recursive: true }).then(() =>
    fs.writeFile(path.join(RUNS_DIR, `${plan.run_id}.json`), JSON.stringify(plan, null, 2))
  ).catch((err) => console.error(JSON.stringify({ event: "plan.disk.write_failed", run_id: plan.run_id, error: String(err) })));
}

export async function getCachedRun(hypothesis_hash: string): Promise<Plan | undefined> {
  const run_id = cacheIndex.get(hypothesis_hash);
  if (!run_id) return undefined;
  const inMem = runStore.get(run_id);
  if (inMem) return inMem;
  // D-64: cold-start fall-through to disk
  try {
    const text = await fs.readFile(path.join(RUNS_DIR, `${run_id}.json`), "utf8");
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
```

**Cold-start fall-through** is the Phase 3 extension over Phase 2. Phase 2 cleared on cold start (D-50 acceptable for QC); Phase 3 needs disk persistence so Phase 7's diff modal can find prior runs.

---

### `src/lib/plan/agents/researcher.ts` (NEW) — and siblings `skeptic.ts`, `operator.ts`, `compliance.ts`

**Analog:** `src/lib/qc/prompt.ts` (prompt module shape) + `src/app/api/qc/route.ts` lines 87-114 (streamObject runner shape)

**Prompt module pattern** (`src/lib/qc/prompt.ts` full file):

```typescript
/**
 * <Agent> prompt module.
 *
 * - System prompt is STABLE across requests (Google's implicit prefix-caching).
 * - User content is data, NEVER instruction (prompt-injection boundary).
 * - Hypothesis text is treated as data; "ignore previous instructions" inside
 *   the hypothesis is text to score, not an instruction to obey.
 */
import type { TavilyResult } from "@/lib/tavily"; // researcher only
import type { QCResponse } from "@/lib/qc/schema"; // shared lit-QC context

export const researcherSystemPrompt = `You are the Researcher agent in a 4-agent experiment-plan pipeline.
... (Claude's discretion per CONTEXT.md ## Claude's Discretion)
CRITICAL: emit `citations: []` for every protocol step. Phase 5 fills citations; do NOT invent URLs (CLAUDE.md hard rule #1).
Emit ONLY the JSON object matching the schema. No prose, no markdown fencing.`;

export function researcherUserPrompt(
  hypothesis: string,
  qcContext: QCResponse,
  protocolsResults: TavilyResult[], // researcher-only — empty for skeptic/operator/compliance
): string {
  const evidence = protocolsResults
    .map((r, i) => `[${i + 1}] ${r.title}\n    URL: ${r.url}\n    Excerpt: ${r.content}`)
    .join("\n\n");
  const qcSummary = qcContext.ok === "verdict"
    ? `Lit-QC verdict: ${qcContext.verdict}\nReasoning: ${qcContext.reasoning}\nCitations: ${qcContext.citations.map((c) => c.url).join(", ")}`
    : `Lit-QC verdict: ${qcContext.ok}`;
  return `HYPOTHESIS:\n${hypothesis}\n\nLIT-QC CONTEXT:\n${qcSummary}\n\nPROTOCOL EVIDENCE BLOCK (${protocolsResults.length} results):\n${evidence}`;
}
```

**Per-agent runner pattern** — wrap `streamObject` (Phase 2 route lines 87-114) with `started`/`working`/`done` event emission and a slice schema (subset of `planSchema`):

```typescript
import { streamObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { protocolStepSchema } from "@/lib/plan/schema";
import { tavilySearch } from "@/lib/tavily";
import type { UIMessageStreamWriter } from "ai";
import type { QCResponse } from "@/lib/qc/schema";

export const researcherSliceSchema = z.object({
  protocol: z.array(protocolStepSchema).min(3),
});
export type ResearcherSlice = z.infer<typeof researcherSliceSchema>;

export async function runResearcher(args: {
  hypothesis: string;
  qcContext: QCResponse;
  modelId: string;
  writer: UIMessageStreamWriter;
  run_id: string;
}): Promise<{ slice: ResearcherSlice | null; elapsed_ms: number; error?: string }> {
  const { hypothesis, qcContext, modelId, writer, run_id } = args;
  const t0 = Date.now();

  writer.write({
    type: "data-trace",
    data: { stage: "started", run_id, agent_id: "researcher", task: `Drafting protocol from ${qcContext.ok === "verdict" ? qcContext.verdict : "lit-QC context"}`, ts: new Date().toISOString() },
  });

  // D-56: ONE Tavily call for protocols.io grounding
  let protocolsResults = [];
  try {
    writer.write({ type: "data-trace", data: { stage: "working", run_id, agent_id: "researcher", activity: "Calling protocols.io via Tavily", ts: new Date().toISOString() } });
    protocolsResults = await tavilySearch(`${hypothesis} protocol`);
    protocolsResults = protocolsResults.filter((r) => r.url.includes("protocols.io")).slice(0, 5);
  } catch {
    // non-fatal — researcher proceeds with shared QC context only
  }

  try {
    const { object } = await streamObject({
      model: google(modelId),
      schema: researcherSliceSchema,
      system: researcherSystemPrompt,
      prompt: researcherUserPrompt(hypothesis, qcContext, protocolsResults),
      temperature: 0.2,
      maxOutputTokens: 1500,
      providerOptions: { google: { structuredOutputs: false, thinkingConfig: { thinkingBudget: 0 } } }, // D-55
      experimental_repairText: async ({ text }) => repairResearcherSlice(text),
      abortSignal: AbortSignal.timeout(35_000), // D-66
    });
    const slice = await object;
    const elapsed = Date.now() - t0;
    writer.write({
      type: "data-trace",
      data: { stage: "done", run_id, agent_id: "researcher", elapsed_ms: elapsed, output_preview: slice.protocol[0]?.description.slice(0, 80), ts: new Date().toISOString() },
    });
    return { slice, elapsed_ms: elapsed };
  } catch (err) {
    const elapsed = Date.now() - t0;
    writer.write({
      type: "data-trace",
      data: { stage: "error", run_id, agent_id: "researcher", error_message: String(err), retryable: true, ts: new Date().toISOString() },
    });
    return { slice: null, elapsed_ms: elapsed, error: String(err) }; // D-66 — partial > nothing
  }
}
```

**Skeptic / Operator / Compliance** — same runner shape, no Tavily, different slice schemas:
- `skeptic.ts` → emits `validation: validationCheckSchema[]` (must include the 6 names from `src/components/trace-rail.tsx:VALIDATION_SKELETON` per `## Specific Ideas` in CONTEXT.md).
- `operator.ts` → emits `{ materials, budget, timeline }` (3 sections owned by one agent per D-57).
- `compliance.ts` → emits `{ compliance_notes, compliance_summary }`.

**Validation skeleton names that Skeptic MUST emit verbatim** (from `src/components/trace-rail.tsx:16-23`):

```typescript
const VALIDATION_SKELETON = [
  "Every reagent has a catalog URL",
  "Budget sums correctly",
  "No orphan protocol step",
  "Citations resolve to real sources",
  "Timeline dependencies valid",
  "Compliance pipeline passes",
];
```

This is the bridge Phase 6 will use to tick the placeholder grid green from real data.

---

### `src/lib/plan/consolidator.ts` (NEW)

**Analog:** `src/app/api/qc/route.ts` lines 87-167 (streamObject + onFinish + repair)

**Pattern adaptation:**

```typescript
import { streamObject } from "ai";
import { google } from "@ai-sdk/google";
import { planSchema, type Plan } from "@/lib/plan/schema";
import type { UIMessageStreamWriter } from "ai";

const CONSOLIDATOR_SYSTEM = `You are the Consolidator agent. You receive 4 JSON drafts from Researcher / Skeptic / Operator / Compliance agents and merge them into a single Plan JSON matching the supplied schema.

Rules:
- Do NOT invent content. Use only what the 4 drafts provide.
- Where drafts conflict, prefer the agent that owns that section (Researcher owns protocol; Operator owns materials/budget/timeline; Skeptic owns validation; Compliance owns compliance_notes/compliance_summary).
- For any agent slice that is null (errored), emit a placeholder section with description "(agent failed — see agent_artifacts.<role>.error)" and flag.
- Set `grounded: false` (Phase 5 will flip this).
- Set `citations: []` for every row (Phase 5 fills these).
- Do NOT touch the agent_artifacts shape — it's reconstructed server-side.

Emit ONLY the JSON object. No prose, no markdown fencing.`;

export async function runConsolidator(args: {
  hypothesis: string;
  qc_run_id: string | null;
  run_id: string;
  modelId: string;
  slices: { researcher: any; skeptic: any; operator: any; compliance: any };
  artifacts: { researcher: any; skeptic: any; operator: any; compliance: any };
  writer: UIMessageStreamWriter;
}): Promise<Plan> {
  const t0 = Date.now();
  args.writer.write({
    type: "data-trace",
    data: { stage: "started", run_id: args.run_id, agent_id: "consolidator", task: "Merging 4 agent drafts into Plan", ts: new Date().toISOString() },
  });

  const { object } = await streamObject({
    model: google(args.modelId),
    schema: planSchema, // top-level plan
    system: CONSOLIDATOR_SYSTEM,
    prompt: buildConsolidatorPrompt(args),
    temperature: 0.1,
    maxOutputTokens: 4000,
    providerOptions: {
      google: {
        structuredOutputs: false,
        thinkingConfig: { thinkingBudget: 4000 }, // D-55 — synthesis quality matters here
      },
    },
    experimental_repairText: async ({ text }) => repairPlanText(text), // shape-based repair
    abortSignal: AbortSignal.timeout(15_000), // D-66
    onFinish: ({ object, error }) => {
      // D-49: never silently substitute on validation failure
      if (error || !object) { /* emit error event, surface to caller */ }
    },
  });

  const plan = await object;
  // server-side post-fill: ensure run_id, model_id, latency_ms, generated_at, agent_artifacts are correct
  plan.run_id = args.run_id;
  plan.model_id = args.modelId;
  plan.latency_ms = Date.now() - t0;
  plan.generated_at = new Date().toISOString();
  plan.grounded = false; // D-59
  plan.qc_run_id = args.qc_run_id;
  plan.agent_artifacts = args.artifacts; // server reconstructs, not the LLM

  args.writer.write({
    type: "data-trace",
    data: { stage: "done", run_id: args.run_id, agent_id: "consolidator", elapsed_ms: plan.latency_ms, ts: new Date().toISOString() },
  });
  return plan;
}
```

**Why partial analog:** the consolidator IS a `streamObject` call (same shape as Phase 2 route lines 87-114), but with three differences: (1) `thinkingBudget: 4000` not 0 (D-55), (2) shorter timeout 15s (D-66), (3) **no Tavily** — pure synthesis from in-memory inputs. The shape-based repair is per-Plan, not the QC-specific discriminator hack.

---

### `src/components/plan/use-plan.ts` (NEW)

**Analog:** `src/components/qc/use-qc.ts`

**File header + `"use client"` pattern** (lines 17-21):

```typescript
"use client";

import { ... } from "@ai-sdk/react";
import { planSchema } from "@/lib/plan/schema";
import { agentEventSchema, type AgentEvent } from "@/lib/plan/trace";
```

**Critical pitfall to inherit** (Phase 2 lines 4-6 + 19): the alias-on-import is mandatory for `experimental_useObject`. For Phase 3, the parallel pitfall is that **`useObject` does NOT decode `data-*` parts** — Phase 3 must use `useChat` (also from `@ai-sdk/react`) or call `readUIMessageStream` manually. The plan canvas needs the typed Plan, but the trace rail needs the event log; both come from one stream.

**Hook return shape** — mirror `use-qc.ts:22-41` but with two state slots:

```typescript
import { useChat } from "@ai-sdk/react";
import { useState, useEffect } from "react";

export function usePlan() {
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);

  const chat = useChat({
    api: "/api/plan",
    onError: (err) => console.error("[plan] fetch error", err),
    onData: (part) => {
      if (part.type === "data-trace") {
        const parsed = agentEventSchema.safeParse(part.data);
        if (parsed.success) setAgentEvents((prev) => [...prev, parsed.data]);
      } else if (part.type === "data-plan") {
        const parsed = planSchema.safeParse(part.data);
        if (parsed.success) setPlan(parsed.data);
      }
    },
  });

  return {
    plan,
    agentEvents,
    isLoading: chat.status === "streaming" || chat.status === "submitted",
    error: chat.error,
    submit: (input: { hypothesis: string; qc_run_id: string | null }) =>
      chat.sendMessage({ text: JSON.stringify(input) }), // pass body via the route's POST handler reading req.json()
    clear: () => { setAgentEvents([]); setPlan(null); chat.setMessages([]); },
  };
}
```

**Note on AI SDK v5 API surface:** verify the `onData` / `data-*` part API against the canonical_refs vendor doc (https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) before locking the plan. The shape above is the documented pattern but the field names may vary slightly between v5 minor versions.

**`onError` + `onFinish` pattern** (use-qc.ts:26-39): preserve "do NOT fabricate a fallback" comment for `error` branch — D-67 still holds (no silent retry).

---

### `src/app/app/page.tsx` (MODIFY — `Dashboard`)

**Self-analog:** existing `useQc()` wiring at lines 27-122.

**Pattern to extend:**

1. **Add `usePlan()` call** alongside `useQc()` at line 34:

```typescript
const qc = useQc();
const plan = usePlan();
```

2. **Auto-trigger `useEffect`** after the QC verdict commits (D-63) — slot in next to the existing commit `useEffect` at lines 64-122:

```typescript
// D-63: auto-chain plan generation on `not-found` or `similar-work-exists`.
useEffect(() => {
  const obj = qc.object;
  if (!obj?.ok || qc.isLoading) return;
  if (obj.ok !== "verdict") return;
  if (obj.verdict === "not-found" || obj.verdict === "similar-work-exists") {
    plan.clear();
    plan.submit({ hypothesis: lastSubmittedHypothesis.current, qc_run_id: null });
  }
  // exact-match-found: NO auto-fire. Verdict card surfaces "Generate anyway →" button.
}, [qc.object, qc.isLoading]);
```

3. **Pass `agentEvents` and `plan.plan` down** as props to existing children:

```typescript
<TraceRail agentEvents={plan.agentEvents} /> // Phase 6 wires the visible render
<PlanCanvas planObject={plan.plan} planIsLoading={plan.isLoading} ... />
```

4. **Track `lastSubmittedHypothesis`** (new ref) so the auto-trigger can re-submit the actual hypothesis text rather than rely on stale state.

5. **"Generate anyway" button hook**: pass an `onGenerateAnyway` callback to the verdict-card path that calls `plan.submit({ hypothesis, qc_run_id: null })` — copy must read exactly `"Generate anyway →"` in `clay/rust` accent (per `## Specific Ideas` in CONTEXT.md).

**File path correction:** CONTEXT.md `## Integration Points` says `src/components/dashboard/dashboard.tsx (or wherever useQc is currently called)`. The actual file is `src/app/app/page.tsx`. Plans must point there.

---

### `data/runs/.gitkeep` (NEW) + `.gitignore` append

**No code analog.** Two operations:

1. Create empty file `data/runs/.gitkeep`. It is a marker that lets the directory be tracked even when empty so the route's `fs.writeFile` does not need to `mkdir -p` on every write (the cache module also calls `fs.mkdir({recursive:true})` defensively).

2. Append to `.gitignore` (Edit tool, do NOT replace per CLAUDE.md global §4.11):

```
# Phase 3 — multi-agent run artifacts (D-64). Disk read-through cache; never commit.
data/runs/*.json
!data/runs/.gitkeep
```

The negation pattern (`!.gitkeep`) preserves the directory marker.

---

## Shared Patterns

### 1. Env access (CLAUDE.md hard rule + Phase 1 D-20/D-21)

**Source:** `src/lib/env.ts`

**Apply to:** All server-side files in Phase 3 (route, agents, consolidator, cache).

```typescript
import { env } from "@/lib/env";
// then use env.GOOGLE_GENERATIVE_AI_API_KEY, env.TAVILY_API_KEY
// NEVER use process.env directly anywhere in the runtime code.
```

### 2. Model picker (D-55, all 5 LLM calls share one pick)

**Source:** `src/lib/models.ts:116-142` (`pickAvailableLitQcModel`)

**Apply to:** Once per route invocation in `src/app/api/plan/route.ts` BEFORE `Promise.all` of the 4 agents. Pass the picked `modelId` down to every agent runner + consolidator.

```typescript
const modelId = await pickAvailableLitQcModel();
// pass to runResearcher / runSkeptic / runOperator / runCompliance / runConsolidator
```

The 60s probe cache (line 76) means parallel agents do NOT each re-probe. One probe per minute, shared across all 5 calls in one run.

### 3. Gemini structured-output configuration

**Source:** `src/app/api/qc/route.ts:109-114` (provider options block)

**Apply to:** Every `streamObject` call in Phase 3 (4 agents + consolidator).

```typescript
providerOptions: {
  google: {
    structuredOutputs: false, // discriminated-union schemas stall under strict mode
    thinkingConfig: { thinkingBudget: 0 }, // 0 for debaters; 4000 for consolidator (D-55)
  },
},
```

**Variation:** consolidator uses `thinkingBudget: 4000`. Justification in D-55: synthesis across 4 inputs needs reasoning headroom; the +5-8s latency is in the 15s consolidator budget.

### 4. Shape-based repair text

**Source:** `src/app/api/qc/route.ts:213-312` (`repairDiscriminator`)

**Apply to:** Every `streamObject` call (4 agents + consolidator) — but each gets a per-slice `repair` function.

**Principle:** never invent values. Reconstruct fields from the SHAPE of model output (truncate over-long strings, coerce string-numbers to number, drop unknown keys). The provenance check that guarantees CLAUDE.md hard rule #1 is deferred to Phase 5; in Phase 3, repair is shape-only.

### 5. Structured trace logging (AI-SPEC §7)

**Source:** `src/app/api/qc/route.ts:179-196` (`RequestLog` + `logRequest`)

**Apply to:** Plan route entry, each agent runner, consolidator. Phase 3 adds events:

```typescript
console.log(JSON.stringify({ event: "plan.run.started", run_id, hypothesis_hash, qc_run_id }));
console.log(JSON.stringify({ event: "plan.agent.completed", run_id, agent_id, elapsed_ms, token_count }));
console.log(JSON.stringify({ event: "plan.run.completed", run_id, latency_ms, model_id, agents_succeeded: 4 }));
```

These are SEPARATE from the SSE `data-trace` events (which are user-facing). Server logs feed Vercel log viewer; SSE events drive the trace rail UI.

### 6. Discriminated-union narrowing on the client (Phase 2 D-40 carry)

**Source:** `src/components/qc/use-qc.ts:8-11` comment + the consumer pattern in `src/app/app/page.tsx:64-122`

**Apply to:** The Phase 6 consumer of `agentEvents[]` (and the Phase 3 dashboard wire-in if it does any rendering). Always guard:

```typescript
if (!event?.stage) return null;
switch (event.stage) {
  case "started": ...
  case "working": ...
  case "done": ...
  case "error": ...
}
```

Gemini can drop the discriminator on the first chunk; consumer narrowing protects against partial states.

### 7. Per-session in-memory cache (Phase 2 D-50 → Phase 3 D-64/D-65)

**Source:** `src/lib/qc/cache.ts:14-33` (Map + hash function)

**Apply to:** `src/lib/plan/cache.ts`. Phase 3 extends with disk read-through (`data/runs/<run_id>.json`) per D-64 — Phase 2 deliberately did NOT do disk; Phase 3 needs it for Phase 7's diff modal.

### 8. AbortSignal.timeout (D-66)

**Source:** `src/lib/tavily.ts:42` (`signal: AbortSignal.timeout(4000)`) + `src/lib/models.ts:100` (`abortSignal: AbortSignal.timeout(5_000)`)

**Apply to:** Every async I/O in Phase 3:
- Tavily call in researcher: 4s (existing default in `tavilySearch`)
- Each agent's `streamObject`: 35s (D-66)
- Consolidator's `streamObject`: 15s (D-66)
- Total worst-case: 35 + 15 = 50s under the 60s ceiling.

### 9. Light-mode + server-shell-client-leaf

**Source:** `src/app/app/page.tsx:1` (`"use client"` only on the dashboard leaf)

**Apply to:** All Phase 3 `src/components/plan/*` files need `"use client"`. The `/app` route shell stays a Server Component.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `data/runs/.gitkeep` | filesystem marker | n/a | New runtime asset directory; no precedent in this repo. |
| (transport: `createUIMessageStream`) | streaming helper | event-driven | Phase 2 used `streamObject().toTextStreamResponse()` (single object). Phase 3 needs `createUIMessageStream` to multiplex Plan + trace events. **Planner must reference the AI SDK v5 vendor doc** (canonical_refs §"Vendor docs") rather than a Phase 2 analog for the transport layer — the helper is genuinely new. The streamObject calls inside it follow Phase 2 patterns; only the outer envelope is new. |
| (dep: `ulid`) | runtime utility | n/a | Single new dep per D-68. Justified per CLAUDE.md hard rule #5: standard, ~1.4kB gzipped, zero transitive deps. Alternative if user vetoes: `Date.now() + "-" + crypto.randomUUID().slice(0,8)` (D-68 fallback). |

---

## Dependency Notes (CLAUDE.md hard rule #5)

- **`ulid` is the only new dep** (D-68). Standard, tiny, zero transitives. Justified.
- All other functionality reuses locked stack: `ai` (already pinned `^5.0.179` for `streamObject` + `createUIMessageStream`), `@ai-sdk/google` (Gemini), `@ai-sdk/react` (`useChat` for the new hook), `zod` (schemas), Node built-ins (`fs/promises`, `path`, `crypto.subtle`).
- The fallback `Date.now() + "-" + crypto.randomUUID().slice(0,8)` works without adding `ulid` if the user vetoes during planner review.

---

## Metadata

**Analog search scope:** `src/app/api/`, `src/lib/`, `src/components/qc/`, `src/components/`, `src/app/app/`, project root (`package.json`, `.gitignore`)
**Files scanned:** 12 read end-to-end (`src/app/api/qc/route.ts`, `src/lib/qc/{schema,cache,prompt,provenance}.ts`, `src/components/qc/use-qc.ts`, `src/lib/{env,tavily,models}.ts`, `src/app/app/page.tsx`, `src/components/trace-rail.tsx`, `package.json`, `.gitignore`).
**Pattern extraction date:** 2026-04-26
**Phase 3 file count:** 11 NEW + 1 MODIFY + 1 .gitignore append
