/**
 * useQc — thin wrapper over `experimental_useObject` (AI-SPEC §3 lines 213-230).
 *
 * The alias-on-import is MANDATORY. Importing `useObject` directly from
 * `@ai-sdk/react` compiles but resolves to `undefined` at runtime — the
 * chat-panel submit will silently no-op (AI-SPEC §3 Pitfall #3).
 *
 * Discriminated-union narrowing guard belongs to the CONSUMER (Plan 02-03's
 * VerdictCard / ChatThread). Gemini sometimes drops the `ok` discriminator
 * on the FIRST chunk; consumers MUST guard with `if (!object?.ok) return null`
 * before narrowing on `object.ok` (AI-SPEC §3 Pitfall #4).
 *
 * The same `qcResponseSchema` is passed to both server (`streamObject`)
 * and client (`useObject`) — single source of truth, type-safe partials
 * across the wire (AI-SPEC §4b "Structured Outputs with Zod").
 */
"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { qcResponseSchema } from "@/lib/qc/schema";

export function useQc() {
  return useObject({
    api: "/api/qc",
    schema: qcResponseSchema,
    onError: (err) => {
      console.error("[qc] fetch error", err);
    },
    onFinish: ({ object, error }) => {
      // Per D-49 the route never silently substitutes a verdict on validation
      // failure — the client renders the error state from D-48 by reading
      // `error` here. Do NOT fabricate a fallback verdict.
      if (error) {
        console.error("[qc] schema validation error", error);
      }
      // `object` is intentionally unread here; consumers receive it via the
      // hook's reactive return value. Reference it to keep TypeScript happy.
      void object;
    },
  });
}
