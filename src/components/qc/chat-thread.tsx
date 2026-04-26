"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type ChatMessage =
  | { id: string; role: "user"; content: string }
  | {
      id: string;
      role: "assistant";
      variant: "verdict";
      verdict: "not-found" | "similar-work-exists" | "exact-match-found";
      reasoning: string;
    }
  | { id: string; role: "assistant"; variant: "clarify"; question: string }
  | { id: string; role: "assistant"; variant: "no-evidence"; message: string }
  | {
      id: string;
      role: "assistant";
      variant: "error";
      message: string;
      retryable: boolean;
      onRetry?: () => void;
    };

type Props = {
  messages: ChatMessage[];
};

const VERDICT_BADGE_LABEL: Record<
  "not-found" | "similar-work-exists" | "exact-match-found",
  string
> = {
  "not-found": "Not found",
  "similar-work-exists": "Similar work",
  "exact-match-found": "Exact match",
};

const VERDICT_BADGE_TINT: Record<
  "not-found" | "similar-work-exists" | "exact-match-found",
  string
> = {
  "not-found": "bg-forest/10 text-forest",
  "similar-work-exists": "bg-ink/10 text-ink",
  "exact-match-found": "bg-clay/10 text-clay",
};

/**
 * Chat thread (D-42). Renders inside the existing <ScrollArea> from
 * <ChatPanel> — replaces the empty Phase-1 scroll area body.
 *
 * Each assistant turn renders compact: small verdict badge + first
 * sentence of reasoning + "See sources →" anchor that scrolls the
 * canvas verdict card into view.
 */
export function ChatThread({ messages }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message.
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const focusVerdictCard = () => {
    document
      .getElementById("verdict-card")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-3 p-4" aria-label="Conversation">
        {messages.map((m) => {
          if (m.role === "user") {
            return (
              <div
                key={m.id}
                className="rounded-md bg-surface border border-borderwarm p-3"
              >
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  You
                </div>
                <div className="font-sans text-sm text-ink whitespace-pre-wrap">
                  {m.content}
                </div>
              </div>
            );
          }
          // assistant turns
          if (m.variant === "verdict") {
            const firstSentence = m.reasoning.split(/(?<=[.!?])\s+/)[0] ?? m.reasoning;
            return (
              <div
                key={m.id}
                className="rounded-md bg-paper border border-borderwarm p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "rounded-full font-mono text-[10px] uppercase tracking-wider px-2 py-0.5",
                      VERDICT_BADGE_TINT[m.verdict],
                    )}
                  >
                    {VERDICT_BADGE_LABEL[m.verdict]}
                  </span>
                </div>
                <p className="font-sans text-sm text-ink leading-snug">
                  {firstSentence}
                </p>
                <button
                  type="button"
                  onClick={focusVerdictCard}
                  className="mt-2 font-sans text-xs text-forest hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 rounded-sm"
                >
                  See sources →
                </button>
              </div>
            );
          }
          if (m.variant === "clarify") {
            return (
              <div
                key={m.id}
                className="rounded-md bg-paper border border-borderwarm p-3"
              >
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Clarify
                </div>
                <p className="font-sans text-sm text-ink leading-snug">
                  {m.question}
                </p>
              </div>
            );
          }
          if (m.variant === "no-evidence") {
            return (
              <div
                key={m.id}
                className="rounded-md bg-paper border border-borderwarm p-3"
              >
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  No evidence
                </div>
                <p className="font-sans text-sm text-ink leading-snug">
                  {m.message}
                </p>
              </div>
            );
          }
          // error branch
          return (
            <div
              key={m.id}
              className="rounded-md bg-paper border border-clay p-3"
            >
              <div className="font-mono text-[10px] uppercase tracking-wider text-clay mb-1">
                Error
              </div>
              <p className="font-sans text-sm text-ink leading-snug">
                {m.message}
              </p>
              {m.retryable && m.onRetry && (
                <button
                  type="button"
                  onClick={m.onRetry}
                  className="mt-2 font-sans text-xs text-forest hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 rounded-sm"
                >
                  Retry
                </button>
              )}
            </div>
          );
        })}
        <div ref={scrollRef} aria-hidden />
      </div>
    </ScrollArea>
  );
}
