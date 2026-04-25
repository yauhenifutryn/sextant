"use client";

import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { ExampleChips } from "@/components/example-chips";

type Props = {
  value: string;
  onChange: (text: string) => void;
};

/**
 * Chat panel (D-18, INPUT-03). Controlled by `Dashboard` page so chip
 * picks from the centered canvas hero ALSO populate this textarea.
 *
 * Phase 1: empty scroll area on top (Phase 2 will render messages); chip
 * row + textarea + send-arrow at the bottom. Send button is disabled
 * (Phase 2 wires it to the LLM). Bottom 1px rule, no full border on the
 * input — matches brief §"Chat panel".
 */
export function ChatPanel({ value, onChange }: Props) {
  return (
    <section
      className="flex flex-col border-r border-borderwarm bg-paper"
      aria-label="Chat"
    >
      <ScrollArea className="flex-1" />
      <div className="border-t border-borderwarm p-4 flex flex-col gap-3">
        <ExampleChips onPick={onChange} />
        <div className="flex items-end gap-2 border-b border-borderwarm">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Frame a hypothesis…"
            rows={3}
            aria-label="Hypothesis input"
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none bg-transparent font-sans text-base text-ink p-2 min-h-[72px]"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Send hypothesis"
            disabled
            className="text-muted-foreground"
          >
            <ArrowUp size={18} strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </section>
  );
}
