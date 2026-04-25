"use client";

import { Button } from "@/components/ui/button";
import { EXAMPLE_HYPOTHESES } from "@/lib/example-hypotheses";
import { cn } from "@/lib/utils";

type Props = {
  onPick: (text: string) => void;
  className?: string;
};

/**
 * Reusable keyboard-accessible chip row (D-19, DESIGN-04).
 *
 * Renders the 4 example hypotheses as faint pill-style buttons. Clicking or
 * activating (Enter/Space) any chip emits its text via `onPick`. Phase 1 only
 * populates the textarea draft — no LLM submission, no network call (D-19).
 *
 * Visible focus ring uses the forest accent for WCAG-AA contrast against paper.
 */
export function ExampleChips({ onPick, className }: Props) {
  return (
    <ul
      className={cn("flex flex-wrap gap-2", className)}
      aria-label="Example hypotheses"
    >
      {EXAMPLE_HYPOTHESES.map((h) => (
        <li key={h.id}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPick(h.text)}
            title={h.text}
            className="rounded-full border-borderwarm bg-surface hover:bg-surface-hover hover:border-forest/30 font-sans text-xs text-ink h-auto px-3 py-1.5 focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 transition-colors"
          >
            {h.label}
          </Button>
        </li>
      ))}
    </ul>
  );
}
