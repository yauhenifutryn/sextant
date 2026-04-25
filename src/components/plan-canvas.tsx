"use client";

import { ExampleChips } from "@/components/example-chips";

type Props = {
  onChipPick: (text: string) => void;
};

/**
 * Plan canvas — Phase 1 empty-state hero (D-18).
 *
 * Centered hero in the canvas column with the brief's heading from
 * §"Required key screens" §1 and the same 4 chips repeated as the primary
 * CTA. Chip picks here flow through to the chat-panel textarea via the
 * lifted-state `onChipPick` callback owned by `app/app/page.tsx`.
 *
 * Subtle horizontal rule above the chips per the brief's "Empty state".
 */
export function PlanCanvas({ onChipPick }: Props) {
  return (
    <section
      className="flex flex-col items-center justify-center p-12 bg-paper"
      aria-label="Plan canvas"
    >
      <div className="max-w-xl text-center flex flex-col items-center gap-8">
        <h2 className="font-display text-3xl font-medium tracking-tight text-ink leading-tight">
          Frame a scientific question. Get a fundable plan in 3 minutes.
        </h2>
        <div className="h-px w-12 bg-borderwarm" aria-hidden />
        <ExampleChips onPick={onChipPick} className="justify-center" />
      </div>
    </section>
  );
}
