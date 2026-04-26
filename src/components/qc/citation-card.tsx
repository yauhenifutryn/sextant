"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type Source = "arxiv" | "semantic-scholar" | "protocols-io" | "other";

type Props = {
  title: string;
  url: string;
  excerpt: string;
  source: Source;
};

/**
 * Citation card (D-43). Compact 1-row card.
 *
 * Whole card is a clickable <a target="_blank" rel="noopener noreferrer">
 * — clicking anywhere on the card opens the URL in a new tab. Domain badge
 * tinted per D-43: arxiv = forest, semantic-scholar = ink, protocols-io = clay.
 */
const SOURCE_LABEL: Record<Source, string> = {
  "arxiv": "arXiv",
  "semantic-scholar": "Semantic Scholar",
  "protocols-io": "protocols.io",
  "other": "Source",
};

const SOURCE_TINT: Record<Source, string> = {
  "arxiv": "bg-forest/10 text-forest",
  "semantic-scholar": "bg-ink/10 text-ink",
  "protocols-io": "bg-clay/10 text-clay",
  "other": "bg-muted/10 text-muted-foreground",
};

export function CitationCard({ title, url, excerpt, source }: Props) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        // Defensive fallback: some browsers + portal-based parents
        // (we now mount inside Radix Dialog from Phase 7) have been
        // reported to swallow the default <a> navigation. Force-open.
        if (!e.defaultPrevented) {
          e.preventDefault();
          window.open(url, "_blank", "noopener,noreferrer");
        }
      }}
      className="group block cursor-pointer rounded-md border border-borderwarm bg-paper p-3 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
      aria-label={`Open citation: ${title}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "rounded-full font-mono text-[11px] px-2 py-0.5",
                SOURCE_TINT[source],
              )}
            >
              {SOURCE_LABEL[source]}
            </span>
          </div>
          <div className="font-display text-sm font-medium text-ink truncate">
            {title}
          </div>
          <div className="font-sans text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {excerpt}
          </div>
        </div>
        <ExternalLink
          size={14}
          strokeWidth={1.5}
          className="text-muted-foreground group-hover:text-ink shrink-0 mt-0.5"
          aria-hidden
        />
      </div>
    </a>
  );
}
