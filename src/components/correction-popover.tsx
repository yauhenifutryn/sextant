"use client";

/**
 * CorrectionPopover (D7-12, D7-13).
 *
 * Wraps a row trigger in a Radix Popover. On Submit, POSTs the user's
 * correction to /api/lab-rules and (on 201) calls onSuccess() so the parent
 * can refresh the lab-rules pill count.
 *
 * Anti-pattern guard: textarea content is local state — it does NOT survive
 * a popover close. If the user closes without submitting, the text is lost
 * (acceptable for hackathon demo; multi-step editing is post-MVP).
 *
 * Hard rule #1: textarea is never sent until the user clicks Submit. We
 * do not auto-extract or auto-persist on each keystroke — single explicit
 * Submit only.
 *
 * Pass-through fallback: when planContext is undefined (Wave 4 hasn't wired
 * the dashboard yet), the popover still RENDERS for keyboard / focus QA but
 * the Submit button is disabled with a placeholder hint.
 */
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { LabRuleScope } from "@/lib/lab-rules/schema";

export type CorrectionTarget = {
  kind: LabRuleScope;
  label: string;
};

export type CorrectionPlanContext = {
  hypothesis: string;
  sliceJson: string;
};

type Props = {
  /** Element rendered as the popover trigger (the row body). */
  children: ReactNode;
  /** Description of the row being corrected. */
  target: CorrectionTarget;
  /**
   * Surrounding plan context — passed verbatim to the extractor.
   * Optional during Wave 3 because Wave 4 wires the dashboard threading.
   * When undefined, the popover renders but Submit is disabled.
   */
  planContext?: CorrectionPlanContext;
  /** Called on successful capture (201) — caller refreshes the pill. */
  onSuccess?: () => void | Promise<void>;
};

export function CorrectionPopover({
  children,
  target,
  planContext,
  onSuccess,
}: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const trimmed = text.trim();
  const hasContext = planContext !== undefined;
  const canSubmit = trimmed.length > 0 && !submitting && hasContext;

  async function handleSubmit() {
    if (!canSubmit || !planContext) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/lab-rules", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          correction: trimmed,
          planContext,
          targetLine: target,
        }),
      });
      if (!res.ok) {
        toast.error("Could not capture rule — try again.");
        return;
      }
      toast.success("Lab rule captured.");
      setText("");
      setOpen(false);
      if (onSuccess) await onSuccess();
    } catch {
      toast.error("Could not capture rule — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-96"
        onOpenAutoFocus={(e) => {
          // Prevent default focus jump; we rely on the textarea autofocus below.
          e.preventDefault();
        }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Correct · {target.kind.replace(/_/g, " ")}
            </span>
            <span className="font-sans text-xs text-ink leading-snug truncate">
              {target.label}
            </span>
          </div>
          <Textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              hasContext
                ? "Describe the correction. e.g., Every validation check must include both positive and negative controls."
                : "diff pre-flight pending"
            }
            rows={4}
            className="resize-none text-sm"
            aria-label="Correction text"
            disabled={!hasContext}
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setText("");
                setOpen(false);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={!canSubmit}
              aria-busy={submitting}
            >
              {submitting ? "Capturing…" : "Submit"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
