/**
 * useLabRules — client hook over GET /api/lab-rules (D7-14).
 *
 * Fetches the current lab-rules count on mount and exposes refresh() for
 * components that mutate the store (CorrectionPopover after a successful
 * POST). Used by HeaderBar to drive the live "N lab rules" pill.
 *
 * Intentionally minimal — no SWR, no react-query (CLAUDE.md hard rule #5).
 * Single useState + a fetch in useEffect + a stable refresh callback.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import type { LabRule } from "@/lib/lab-rules/schema";

export type UseLabRulesReturn = {
  rules: LabRule[];
  count: number;
  isLoading: boolean;
  error: Error | undefined;
  refresh: () => Promise<void>;
};

export function useLabRules(): UseLabRulesReturn {
  const [rules, setRules] = useState<LabRule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const res = await fetch("/api/lab-rules", { cache: "no-store" });
      if (!res.ok) throw new Error(`GET /api/lab-rules ${res.status}`);
      const body = (await res.json()) as { rules: LabRule[] };
      setRules(Array.isArray(body.rules) ? body.rules : []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    rules,
    count: rules.length,
    isLoading,
    error,
    refresh,
  };
}
