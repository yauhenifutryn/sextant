"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

// STUB until Phase 3 ships @/lib/plan/trace.ts
// Mirrors D-62 (AgentEvent discriminated union). When `src/lib/plan/trace.ts`
// exists, replace this block with:
//   import type { AgentEvent } from "@/lib/plan/trace";
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

/**
 * Demo-pace queue: when ?demoPace=slow is in the URL, drip-feed
 * agentEvents with a delay so the trace rail staircases visibly during
 * the 60s demo recording. Without this, cache-hit runs flash all
 * events in <100ms.
 *
 * Belt-and-braces partner to the server-side SEXTANT_DEMO_PACE_MS env var
 * shipped by Phase 3. Both mechanisms can run; user activates one or both
 * for the recording.
 */
export function useDemoPacedEvents(events: AgentEvent[]): AgentEvent[] {
  const params = useSearchParams();
  const paceMs = (() => {
    const p = params?.get("demoPace");
    if (p === "slow") return 3500;
    if (p === "ultraslow") return 6000;
    return 0;
  })();

  const [paced, setPaced] = useState<AgentEvent[]>([]);
  const knownRef = useRef<Set<AgentEvent>>(new Set());

  useEffect(() => {
    if (paceMs === 0) {
      setPaced(events);
      return;
    }
    const newOnes = events.filter((e) => !knownRef.current.has(e));
    if (newOnes.length === 0) return;
    newOnes.forEach((e) => knownRef.current.add(e));

    let cancelled = false;
    let i = 0;
    const tick = () => {
      if (cancelled || i >= newOnes.length) return;
      setPaced((prev) => [...prev, newOnes[i]!]);
      i += 1;
      setTimeout(tick, paceMs);
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [events, paceMs]);

  return paceMs === 0 ? events : paced;
}
