"use client";

import { Check, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AgentRow (Phase 6, Plan 06-01).
 *
 * Pure-presentational single-agent row. Consumes a derived status (one of
 * idle | working | done | error) plus an optional 1-line current-task string
 * and elapsed_ms meta (only shown on `done`). Caller (Plan 06-02 inside
 * `<TraceRail>`) reduces the AgentEvent stream into these props.
 *
 * Visual states (06-CONTEXT.md lines 53-72):
 *   idle    — muted dot, faint text, no icon
 *   working — `animate-pulse` shimmer on the row, Loader2 spinner accent
 *   done    — Check icon (forest), elapsed_ms in mono numeric meta line
 *   error   — AlertTriangle (clay), errorMessage as native `title=` tooltip
 *
 * Token vocabulary only; no new dependencies; no hooks.
 */
export type AgentRowStatus = "idle" | "working" | "done" | "error";

export type AgentRowProps = {
  label: string;
  status: AgentRowStatus;
  currentTask?: string;
  elapsedMs?: number;
  errorMessage?: string;
};

const STATUS_PILL_TINT: Record<AgentRowStatus, string> = {
  idle: "bg-muted/10 text-muted-foreground",
  working: "bg-ink/10 text-ink",
  done: "bg-forest/10 text-forest",
  error: "bg-clay/10 text-clay",
};

const STATUS_PILL_LABEL: Record<AgentRowStatus, string> = {
  idle: "idle",
  working: "working",
  done: "done",
  error: "error",
};

export function AgentRow({
  label,
  status,
  currentTask,
  elapsedMs,
  errorMessage,
}: AgentRowProps) {
  return (
    <li
      className={cn(
        "rounded-md border border-borderwarm bg-paper p-3 transition-opacity",
        status === "idle" && "opacity-70",
        status === "working" && "animate-pulse",
      )}
      aria-label={`${label} agent: ${STATUS_PILL_LABEL[status]}${
        currentTask ? ` — ${currentTask}` : ""
      }`}
      title={status === "error" ? errorMessage : undefined}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display text-sm font-medium text-ink truncate">
              {label}
            </span>
            <span
              className={cn(
                "rounded-full font-mono text-[11px] px-2 py-0.5",
                STATUS_PILL_TINT[status],
              )}
            >
              {STATUS_PILL_LABEL[status]}
            </span>
          </div>
          {currentTask && (
            <div className="font-sans text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {currentTask}
            </div>
          )}
          {status === "done" && typeof elapsedMs === "number" && (
            <div className="font-mono text-[10px] text-muted-foreground tabular-nums mt-1">
              {elapsedMs}ms
            </div>
          )}
        </div>
        {status === "done" && (
          <Check
            size={14}
            strokeWidth={1.5}
            className="text-forest shrink-0 mt-0.5"
            aria-hidden
          />
        )}
        {status === "error" && (
          <AlertTriangle
            size={14}
            strokeWidth={1.5}
            className="text-clay shrink-0 mt-0.5"
            aria-hidden
          />
        )}
        {status === "working" && (
          <Loader2
            size={14}
            strokeWidth={1.5}
            className="text-ink shrink-0 mt-0.5 animate-spin"
            aria-hidden
          />
        )}
      </div>
    </li>
  );
}
