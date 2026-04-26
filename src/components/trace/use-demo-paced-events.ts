"use client";

import { useEffect, useRef, useState } from "react";

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
 * Read the `demoPace` URL param without using next/navigation's
 * `useSearchParams()`. The hook deliberately avoids that import because
 * `useSearchParams()` triggers Next.js 15's CSR-bailout requirement on
 * statically-generated pages, forcing the entire page into a Suspense
 * boundary which is not the trace-rail's concern (and out of plan scope —
 * `src/app/app/page.tsx` is a forbidden zone for Plan 06-02). Reading
 * `window.location.search` from inside `useEffect` is post-mount and
 * client-only, so SSG completes cleanly. The default `paceMs=0` means
 * pre-mount renders behave identically to the no-param case (zero delay).
 */
function readPaceMs(): number {
  if (typeof window === "undefined") return 0;
  const params = new URLSearchParams(window.location.search);
  const p = params.get("demoPace");
  if (p === "slow") return 3500;
  if (p === "ultraslow") return 6000;
  return 0;
}

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
  // paceMs is read once on mount via useState initializer (client-only).
  // Default is 0 during SSG / pre-mount so the hook is a pure pass-through.
  const [paceMs, setPaceMs] = useState<number>(0);

  useEffect(() => {
    setPaceMs(readPaceMs());
  }, []);

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
