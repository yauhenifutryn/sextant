"use client";

import { ExampleChips } from "@/components/example-chips";

type Props = {
  onChipPick: (text: string) => void;
};

/**
 * Plan canvas — Phase 1 empty-state hero (D-18).
 *
 * Centered hero in the canvas column. This is the ONLY surface that
 * renders the example-hypothesis chips — chat panel was deduplicated to
 * a clean input-only empty state so chips don't appear twice on the same
 * screen. Chip clicks populate the chat-panel textarea via lifted state.
 *
 * Phase 2+ replaces this with the tabbed plan canvas (Protocol / Materials
 * / Budget / Timeline / Validation).
 */
export function PlanCanvas({ onChipPick }: Props) {
  return (
    <section
      className="flex flex-col items-center justify-center px-8 py-12 bg-paper"
      aria-label="Plan canvas"
    >
      <div className="max-w-md text-center flex flex-col items-center gap-7">
        <span className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
          <span className="inline-block w-6 h-px bg-forest" aria-hidden />
          <span>Empty state</span>
        </span>
        <h2 className="font-display text-2xl font-medium tracking-tight text-ink leading-[1.15] text-balance">
          Frame a scientific question.<br />Get a fundable plan in three minutes.
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          Pick an example below or type your own hypothesis in the chat on the left. Four agents will draft a citation-grounded protocol.
        </p>
        <ExampleChips onPick={onChipPick} className="justify-center" />
      </div>
    </section>
  );
}
