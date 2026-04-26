"use client";

import type { z } from "zod";
import { ExternalLink } from "lucide-react";
import { citationSchema } from "@/lib/qc/schema";
import { cn } from "@/lib/utils";

// Local type alias — derived from the locked schema source-of-truth in
// src/lib/qc/schema.ts. We do NOT modify that file; we just infer the
// type at the import site so downstream renderers have a name to reference.
type Citation = z.infer<typeof citationSchema>;

type Props = {
  citations: Citation[];
  className?: string;
};

/**
 * CitationSlot — inline-citation badge (D4-10, CLAUDE.md hard rule #1).
 *
 *   citations.length === 0  →  render NOTHING (return null). Hard rule #1
 *                              forbids fabricated citations; empty arrays
 *                              stay silent.
 *   citations.length  >  0  →  render a clickable pill linking to the first
 *                              source URL, with a native title tooltip
 *                              carrying title + 1-line excerpt (GROUND-03).
 *
 * Phase 5 LITE keeps GROUND-03 satisfied via the native title attribute.
 * Polished HoverCard tooltip is deferred per .planning/DEFERRED.md.
 */
export function CitationSlot({ citations, className }: Props) {
  if (!citations || citations.length === 0) return null;
  const first = citations[0];
  const tooltip = first.excerpt
    ? `${first.title} — ${first.excerpt}`
    : first.title;
  return (
    <a
      href={first.url}
      target="_blank"
      rel="noopener noreferrer"
      title={tooltip}
      aria-label={`Open source: ${first.title}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-borderwarm bg-surface px-2 py-0.5 font-mono text-[10px] text-citation tabular-nums ml-2 align-middle transition-colors hover:border-citation hover:bg-surface-hover",
        className,
      )}
    >
      {citations.length} source{citations.length === 1 ? "" : "s"}
      <ExternalLink className="h-2.5 w-2.5" aria-hidden />
    </a>
  );
}
