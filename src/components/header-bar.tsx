"use client";

import { useLabRules } from "@/hooks/use-lab-rules";

/**
 * Header bar (D-17, D7-14). 56px tall, full-width, only rendered on `/app/*`
 * routes via the nested layout — never on `/` (landing).
 *
 * Phase 7: lab-rules pill is now LIVE — driven by useLabRules().
 * Text is "N lab rule" / "N lab rules" with correct singular/plural form.
 * Updates without page reload via the CorrectionPopover -> POST /api/lab-rules
 * -> useLabRules.refresh() chain wired in Wave 4.
 *
 * Avatar and Settings buttons were removed pre-demo (dead stubs); a
 * non-working button under judges' eyes hurts more than a missing one. The
 * lab profile drawer (LOOP-05) is in DEFERRED.md.
 *
 * The pill itself is intentionally not a button — Phase 7 cuts the lab-profile
 * drawer. Phase 8+ can promote it to a Sheet trigger.
 */
export function HeaderBar() {
  const { count, isLoading } = useLabRules();
  const pillText = isLoading
    ? "… lab rules"
    : `${count} lab rule${count === 1 ? "" : "s"}`;
  const ariaLabel = isLoading
    ? "Loading lab rules count"
    : `${count} lab rule${count === 1 ? "" : "s"} captured`;

  return (
    <header className="h-14 border-b border-borderwarm bg-paper flex items-center justify-between px-6">
      <div className="font-display text-base font-medium text-ink">Sextant</div>
      <div className="font-mono text-xs text-muted-foreground truncate max-w-md text-center">
        Awaiting hypothesis…
      </div>
      <div className="flex items-center gap-3">
        <span
          className="font-mono text-xs text-ink rounded-full border border-borderwarm bg-surface px-3 py-1 tabular-nums"
          aria-live="polite"
          aria-label={ariaLabel}
        >
          {pillText}
        </span>
      </div>
    </header>
  );
}
