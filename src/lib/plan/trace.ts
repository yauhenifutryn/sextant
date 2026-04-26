/**
 * AgentEvent discriminated-union schema (D-61, D-62).
 *
 * Single source of truth for trace events that flow:
 *   server route (writer.write({type:"data-trace", data: AgentEvent}))
 *   → SSE wire
 *   → useChat onData callback in src/components/plan/use-plan.ts
 *   → Phase 6 trace-rail render switch on `event.stage`.
 *
 * Discriminator field is `stage` (not `ok` like qcResponseSchema) so the same
 * Zod narrow pattern from Phase 2 D-40 transfers verbatim:
 *   if (!event?.stage) return null;
 *   switch (event.stage) { case "started": ...; case "done": ...; }
 *
 * Per-agent lifecycle: started → working* → (done | error). Total per run
 * ≈ 12-15 events (4 agents × 3 + consolidator events). Keep working events
 * to ~1-2 per agent — no token-level streaming (avoids re-render storms).
 */
import { z } from "zod";

export const agentIdSchema = z.enum([
  "researcher",
  "skeptic",
  "operator",
  "compliance",
  "consolidator",
]);
export type AgentId = z.infer<typeof agentIdSchema>;

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
