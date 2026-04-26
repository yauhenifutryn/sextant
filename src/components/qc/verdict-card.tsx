"use client";

import type { QCResponse } from "@/lib/qc/schema";
import { cn } from "@/lib/utils";
import { CitationCard } from "@/components/qc/citation-card";

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

type Props = {
  object: DeepPartial<QCResponse> | undefined;
  isLoading: boolean;
};

const VERDICT_LABEL: Record<
  "not-found" | "similar-work-exists" | "exact-match-found",
  string
> = {
  "not-found": "Not found",
  "similar-work-exists": "Similar work exists",
  "exact-match-found": "Exact match found",
};

/**
 * Border-color signaling per D-41:
 *   not-found            → forest (true-novelty signal, "go ahead")
 *   similar-work-exists  → warm-neutral (default, prior work present)
 *   exact-match-found    → clay/rust (stop-and-look)
 */
const VERDICT_BORDER: Record<
  "not-found" | "similar-work-exists" | "exact-match-found",
  string
> = {
  "not-found": "border-forest",
  "similar-work-exists": "border-borderwarm",
  "exact-match-found": "border-clay",
};

/**
 * Verdict card — pinned at top of canvas column (D-41, LITQC-04).
 *
 * Discriminated-union narrowing guard MANDATORY (AI-SPEC §3 Pitfall #4):
 * Gemini may emit early chunks before `ok` is set. Guard before narrowing.
 *
 * This component renders ONLY the `verdict` and `no-evidence` branches on
 * the canvas. `clarify` lives in the chat thread (D-48). `error` is rendered
 * by the chat thread + a Sonner toast for retryable=false (D-48).
 */
export function VerdictCard({ object, isLoading }: Props) {
  // Guard: useObject's first chunks may have `object` undefined or `ok` unset.
  if (!object?.ok) {
    if (isLoading) {
      return (
        <section
          id="verdict-card"
          aria-label="Literature QC verdict (loading)"
          aria-live="polite"
          className="rounded-md border border-borderwarm bg-paper p-6 shadow-doc animate-pulse"
        >
          <div className="font-mono text-xs text-muted-foreground mb-2">
            Searching literature…
          </div>
          <div className="font-display text-lg text-muted-foreground">
            Querying arXiv, Semantic Scholar, and protocols.io
          </div>
        </section>
      );
    }
    return null;
  }

  // verdict branch
  if (object.ok === "verdict" && object.verdict) {
    const verdict = object.verdict;
    const reasoning = object.reasoning ?? "";
    const citations = (object.citations ?? []).filter(
      (c): c is { title: string; url: string; excerpt: string; source: "arxiv" | "semantic-scholar" | "protocols-io" | "other" } =>
        !!c?.title && !!c?.url && !!c?.excerpt && !!c?.source,
    );
    return (
      <section
        id="verdict-card"
        aria-label="Literature QC verdict"
        aria-live="polite"
        className={cn(
          "rounded-md border-2 bg-paper p-6 shadow-doc flex flex-col gap-4",
          VERDICT_BORDER[verdict],
        )}
      >
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Literature QC
          </div>
          <h2 className="font-display text-2xl font-medium text-ink leading-tight">
            {VERDICT_LABEL[verdict]}
          </h2>
          {reasoning && (
            <p className="font-sans text-sm text-muted-foreground mt-2 leading-relaxed">
              {reasoning}
            </p>
          )}
        </div>
        {citations.length > 0 && (
          <div className="flex flex-col gap-2">
            {citations.map((c, i) => (
              <CitationCard
                key={`${c.url}-${i}`}
                title={c.title}
                url={c.url}
                excerpt={c.excerpt}
                source={c.source}
              />
            ))}
          </div>
        )}
      </section>
    );
  }

  // no-evidence branch — info card on canvas with warm-neutral border (D-48)
  if (object.ok === "no-evidence") {
    return (
      <section
        id="verdict-card"
        aria-label="Literature QC: no evidence"
        className="rounded-md border border-borderwarm bg-paper p-6 shadow-doc"
      >
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1">
          Literature QC
        </div>
        <h2 className="font-display text-lg font-medium text-ink leading-tight mb-2">
          No relevant sources found
        </h2>
        <p className="font-sans text-sm text-muted-foreground leading-relaxed">
          No relevant sources found across arXiv, Semantic Scholar, or
          protocols.io. Refine your hypothesis or try a different framing.
        </p>
      </section>
    );
  }

  // clarify and error branches render in the chat thread, not on the canvas (D-48)
  return null;
}
