/**
 * usePlan — client hook over POST /api/plan (D-60, D-63, D-67).
 *
 * Subscribes to the AI SDK v5 UI message stream and demultiplexes:
 *   - data-trace parts  → AgentEvent[] state (drives Phase 6 trace rail)
 *   - data-plan parts   → Plan state (drives Phase 4 plan canvas)
 *
 * Phase 2 used `experimental_useObject` (single-object stream). Phase 3
 * MUST use `useChat` because `useObject` does NOT decode data-* parts.
 * The SDK doc (https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data) confirms
 * that `onData` is the only callback that fires for transient data parts.
 *
 * AI SDK v5 surfaces the `api` option through DefaultChatTransport, NOT as
 * a top-level useChat field — the bare `useChat({api:...})` pattern from
 * older docs no longer compiles against `@ai-sdk/react@^2.0.181`. The
 * transport instance is constructed once per render via `useMemo` so the
 * underlying Chat is not torn down on each re-render.
 *
 * D-67: NEVER fabricate a fallback Plan on stream error. The Phase 3
 * consolidator-failure branch surfaces a data-trace error event; the
 * dashboard renders it as a typed error state (Phase 6 polishes).
 */
"use client";

import { useState, useCallback, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { agentEventSchema, type AgentEvent } from "@/lib/plan/trace";
import { planSchema, type Plan } from "@/lib/plan/schema";
import type { QCResponse } from "@/lib/qc/schema";

export type UsePlanReturn = {
  plan: Plan | null;
  agentEvents: AgentEvent[];
  isLoading: boolean;
  error: Error | undefined;
  submit: (input: {
    hypothesis: string;
    qc_run_id?: string | null;
    qcContext?: QCResponse;
  }) => void;
  clear: () => void;
};

export function usePlan(): UsePlanReturn {
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);

  // Stable transport instance — re-creating it per render would tear down the
  // underlying Chat and lose in-flight stream state.
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/plan" }),
    [],
  );

  const chat = useChat({
    transport,
    onError: (err) => {
      // D-67: do NOT fabricate a fallback verdict / Plan here.
      // eslint-disable-next-line no-console
      console.error("[plan] fetch error", err);
    },
    onData: (part) => {
      if (part.type === "data-trace") {
        const parsed = agentEventSchema.safeParse(part.data);
        if (parsed.success) {
          setAgentEvents((prev) => [...prev, parsed.data]);
        }
      } else if (part.type === "data-plan") {
        const parsed = planSchema.safeParse(part.data);
        if (parsed.success) {
          setPlan(parsed.data);
        }
      }
    },
  });

  const submit = useCallback(
    (input: {
      hypothesis: string;
      qc_run_id?: string | null;
      qcContext?: QCResponse;
    }) => {
      // useChat in v5 sends the message body as JSON via the configured api.
      // We pass our payload as the `body` of sendMessage so the route's
      // req.json() returns it directly (merged in HttpChatTransport.sendMessages).
      chat.sendMessage(
        { text: "submit-plan" },
        { body: input },
      );
    },
    [chat],
  );

  const clear = useCallback(() => {
    setAgentEvents([]);
    setPlan(null);
    chat.setMessages([]);
  }, [chat]);

  return {
    plan,
    agentEvents,
    isLoading:
      chat.status === "streaming" || chat.status === "submitted",
    error: chat.error,
    submit,
    clear,
  };
}
