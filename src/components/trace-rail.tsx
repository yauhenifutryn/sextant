"use client";

/**
 * Trace + Tests rail (D-18 + Phase 6 live wire-in).
 *
 * Right-column <aside> rendering:
 *   - 5 agent rows (Researcher / Skeptic / Operator / Compliance / Consolidator)
 *     reduced last-write-wins from the streaming AgentEvent[] (Phase 3 D-62).
 *   - ValidationGrid below: 6 baseline checks (deterministic green-tick from
 *     Plan content per 06-CONTEXT.md lines 64-71) + any Skeptic-emitted extras.
 *
 * Visual continuity with the landing-page demo blocks (sextant-loader bars +
 * validation rows in `.l-cta-side` styling) is intentional.
 */

import { SextantLoader } from "@/components/sextant-loader";
import { AgentRow, type AgentRowStatus } from "@/components/trace/agent-row";
import {
  ValidationGrid,
  VALIDATION_SKELETON,
  type PlanLike,
  type ValidationCheckLike,
} from "@/components/trace/validation-grid";
import { useDemoPacedEvents } from "@/components/trace/use-demo-paced-events";

// STUB until Phase 3 ships @/lib/plan/{trace,schema}.ts
// Mirrors D-62 (AgentEvent discriminated union) verbatim + minimal D-58 slice.
// When `src/lib/plan/trace.ts` and `src/lib/plan/schema.ts` exist, replace this
// block with:
//   import type { AgentEvent, AgentId } from "@/lib/plan/trace";
//   import type { Plan } from "@/lib/plan/schema";
// and remove this comment + the type aliases below.
type AgentId =
  | "researcher"
  | "skeptic"
  | "operator"
  | "compliance"
  | "consolidator";

type AgentEvent =
  | { stage: "started"; run_id: string; agent_id: AgentId; task: string; ts: string }
  | { stage: "working"; run_id: string; agent_id: AgentId; activity: string; ts: string }
  | { stage: "done"; run_id: string; agent_id: AgentId; elapsed_ms: number; token_count?: number; output_preview?: string; ts: string }
  | { stage: "error"; run_id: string; agent_id: AgentId; error_message: string; retryable: boolean; ts: string };

const AGENT_ORDER: ReadonlyArray<{ id: AgentId; label: string }> = [
  { id: "researcher",   label: "Researcher" },
  { id: "skeptic",      label: "Skeptic" },
  { id: "operator",     label: "Operator" },
  { id: "compliance",   label: "Compliance" },
  { id: "consolidator", label: "Consolidator" },
];

/**
 * Reduce the agent event stream into the latest event per agent_id.
 * Last-write-wins. Skips malformed partial chunks (verdict-card.tsx:50 pattern
 * — Gemini may emit partial chunks before discriminator is set).
 */
function reduceAgentEvents(events: ReadonlyArray<AgentEvent>): Partial<Record<AgentId, AgentEvent>> {
  const out: Partial<Record<AgentId, AgentEvent>> = {};
  for (const ev of events) {
    if (!ev || typeof (ev as AgentEvent).stage !== "string") continue;
    if (!ev.agent_id) continue;
    out[ev.agent_id] = ev;
  }
  return out;
}

/**
 * Map an AgentEvent (or absence) to the AgentRow visual state.
 */
function eventToStatus(ev: AgentEvent | undefined): AgentRowStatus {
  if (!ev) return "idle";
  switch (ev.stage) {
    case "started":
    case "working":
      return "working";
    case "done":
      return "done";
    case "error":
      return "error";
    default:
      return "idle";
  }
}

/**
 * Pull the 1-line "current task" string from an event.
 */
function eventToTask(ev: AgentEvent | undefined): string | undefined {
  if (!ev) return undefined;
  switch (ev.stage) {
    case "started": return ev.task;
    case "working": return ev.activity;
    case "done":    return ev.output_preview;
    case "error":   return ev.error_message;
    default:        return undefined;
  }
}

export type TraceRailProps = {
  agentEvents?: AgentEvent[];
  validationChecks?: ValidationCheckLike[];
  plan?: PlanLike | null;
  isLoading?: boolean;
};

export function TraceRail({
  agentEvents = [],
  validationChecks,
  plan,
  isLoading = false,
}: TraceRailProps = {}) {
  // Pace at the source: when ?demoPace=slow|ultraslow is in the URL, drip-feed
  // the events; otherwise pass-through. All downstream state is derived from
  // pacedEvents, so the staircase is visible end-to-end.
  const pacedEvents = useDemoPacedEvents(agentEvents);
  const latestByAgent = reduceAgentEvents(pacedEvents);
  const hasAnyEvents = pacedEvents.length > 0;
  const showEmptyState = !hasAnyEvents && !isLoading;

  return (
    <aside
      className="border-l border-borderwarm bg-paper flex flex-col gap-6 p-6"
      aria-label="Agent activity"
    >
      {/* ACTIVITY SECTION */}
      <div>
        <div className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-muted-foreground mb-3">
          Activity
        </div>
        {showEmptyState ? (
          <SextantLoader status="awaiting hypothesis…" size="sm" />
        ) : (
          <ul className="grid gap-2" aria-live="polite">
            {AGENT_ORDER.map(({ id, label }) => {
              const ev = latestByAgent[id];
              const status = eventToStatus(ev);
              const currentTask = eventToTask(ev);
              const elapsedMs =
                ev && ev.stage === "done" ? ev.elapsed_ms : undefined;
              const errorMessage =
                ev && ev.stage === "error" ? ev.error_message : undefined;
              return (
                <AgentRow
                  key={id}
                  label={label}
                  status={status}
                  currentTask={currentTask}
                  elapsedMs={elapsedMs}
                  errorMessage={errorMessage}
                />
              );
            })}
          </ul>
        )}
      </div>

      {/* VALIDATION GRID SECTION */}
      <div>
        <div className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-muted-foreground mb-3">
          Validation grid
        </div>
        <ValidationGrid
          baseline={VALIDATION_SKELETON}
          skepticChecks={validationChecks}
          plan={plan ?? null}
          isLoading={isLoading}
        />
      </div>
    </aside>
  );
}
