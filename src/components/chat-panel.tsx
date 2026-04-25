"use client";

import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  value: string;
  onChange: (text: string) => void;
};

/**
 * Chat panel (D-18, INPUT-03). Controlled by `Dashboard` page so chip
 * picks from the centered canvas hero populate this textarea.
 *
 * Empty-state shows ONLY the input (chips live in the centered plan-
 * canvas hero so they don't appear twice on the same screen). Phase 2
 * wires the send arrow to the LLM and renders streamed messages in the
 * scroll area above the input. Send button stays disabled until there's
 * actual textarea content.
 */
export function ChatPanel({ value, onChange }: Props) {
  const canSend = value.trim().length > 0;
  return (
    <section
      className="flex flex-col border-r border-borderwarm bg-paper"
      aria-label="Chat"
    >
      <ScrollArea className="flex-1" />
      <div className="border-t border-borderwarm p-4">
        <div className="flex items-end gap-2 border-b border-borderwarm">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Frame a hypothesis…"
            rows={3}
            aria-label="Hypothesis input"
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none bg-transparent font-sans text-sm text-ink p-2 min-h-[72px]"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Send hypothesis"
            disabled={!canSend}
            className={canSend ? "text-ink" : "text-muted-foreground"}
          >
            <ArrowUp size={18} strokeWidth={1.5} />
          </Button>
        </div>
        <p className="mt-2 text-[10.5px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
          ⌥ ↵ to stream a plan
        </p>
      </div>
    </section>
  );
}
