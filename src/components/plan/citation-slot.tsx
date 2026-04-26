"use client";

import type { z } from "zod";
import { citationSchema } from "@/lib/qc/schema";
import { cn } from "@/lib/utils";

// Local type alias — derived from the locked schema source-of-truth in
// src/lib/qc/schema.ts. We do NOT modify that file (per Plan 04-01
// success criteria); we just infer the type at the import site so
// downstream renderers have a name to reference.
type Citation = z.infer<typeof citationSchema>;

type Props = {
  citations: Citation[];
  className?: string;
};

/**
 * CitationSlot — reserved inline-citation slot (D4-10, CLAUDE.md hard rule #1).
 *
 * Phase 4 contract:
 *   citations.length === 0  →  render NOTHING (return null). Do NOT show
 *                              "[0 sources]" or any placeholder. Hard rule #1
 *                              forbids fabricated citations; an empty array
 *                              is the truth and the truth is silent here.
 *   citations.length  >  0  →  render a thin trailing badge `[N sources]`.
 *
 * Phase 5 (GROUND-03) will replace the badge with per-citation hovercards
 * carrying title + 1-line excerpt. Phase 4 keeps the API stable so Phase 5
 * is a leaf-component swap, not a structural change.
 */
export function CitationSlot({ citations, className }: Props) {
  if (!citations || citations.length === 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-borderwarm bg-surface px-2 py-0.5 font-mono text-[10px] text-muted-foreground tabular-nums ml-2 align-middle",
        className,
      )}
      title={citations.map((c) => c.title).join(" · ")}
    >
      [{citations.length} source{citations.length === 1 ? "" : "s"}]
    </span>
  );
}
