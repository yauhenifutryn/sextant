"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExampleChips } from "@/components/example-chips";
import { ChatThread, type ChatMessage } from "@/components/qc/chat-thread";

type Props = {
  value: string;
  onChange: (text: string) => void;        // textarea typing
  onChipPick: (text: string) => void;      // chip click — populates textarea AND focuses arrow (D-44)
  onSubmit: (hypothesis: string) => void;
  isSubmitting: boolean;
  messages: ChatMessage[];
  /** Increment to programmatically focus the send arrow (chip-click flow, D-44). */
  focusArrowSignal: number;
};

/**
 * Chat panel (D-18, INPUT-01, INPUT-03, D-44).
 *
 * Phase 2 wires:
 *  - Enter (no Shift) submits via onSubmit(value).
 *  - Arrow button enables when value.trim() && !isSubmitting; click submits.
 *  - Chip click (from EITHER chat panel OR canvas hero) populates the
 *    textarea via setDraft AND auto-focuses the arrow (D-44). User must
 *    still press Enter or click the arrow — chips do NOT auto-submit.
 *  - Empty ScrollArea body is replaced by <ChatThread> showing the
 *    user/assistant turns for this session (D-42).
 *
 * The unified chip handler (onChipPick) is owned by the Dashboard so both
 * chip mount points (chat panel chips here AND canvas-hero chips in
 * <PlanCanvas>) share identical behaviour: populate + focus, no auto-submit.
 */
export function ChatPanel({
  value,
  onChange,
  onChipPick,
  onSubmit,
  isSubmitting,
  messages,
  focusArrowSignal,
}: Props) {
  const arrowRef = useRef<HTMLButtonElement>(null);

  // D-44 chip-click flow: parent increments focusArrowSignal after setDraft.
  // We focus the arrow here so the user can press Enter (or click) without
  // any further reach. Note: the textarea is NOT auto-focused — the chip
  // visibly populated the box; the arrow is the deliberate next action.
  useEffect(() => {
    if (focusArrowSignal > 0) {
      arrowRef.current?.focus();
    }
  }, [focusArrowSignal]);

  const canSubmit = value.trim().length > 0 && !isSubmitting;

  const doSubmit = () => {
    if (!canSubmit) return;
    const hypothesis = value.trim();
    onSubmit(hypothesis);
    onChange("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSubmit();
    }
  };

  return (
    <section
      className="flex flex-col border-r border-borderwarm bg-paper"
      aria-label="Chat"
    >
      <div className="flex-1 min-h-0">
        <ChatThread messages={messages} />
      </div>
      <div className="border-t border-borderwarm p-4 flex flex-col gap-3">
        <ExampleChips onPick={onChipPick} />
        <div className="flex items-end gap-2 border-b border-borderwarm">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Frame a hypothesis…"
            rows={3}
            aria-label="Hypothesis input"
            disabled={isSubmitting}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none bg-transparent font-sans text-base text-ink p-2 min-h-[72px] disabled:opacity-60"
          />
          <Button
            ref={arrowRef}
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Send hypothesis"
            onClick={doSubmit}
            disabled={!canSubmit}
            className={canSubmit ? "text-forest" : "text-muted-foreground"}
          >
            <ArrowUp size={18} strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </section>
  );
}
