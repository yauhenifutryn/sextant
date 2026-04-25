/**
 * Trace + Tests rail (D-18, skeleton).
 *
 * Phase 1 placeholder: centered "Awaiting hypothesis…" text in mono font.
 * Phase 6 builds the real agent rows + validation grid that tick green
 * as the plan stabilizes.
 */
export function TraceRail() {
  return (
    <aside
      className="border-l border-borderwarm bg-paper flex items-center justify-center p-6"
      aria-label="Agent activity"
    >
      <div className="font-mono text-xs text-muted-foreground">
        Awaiting hypothesis…
      </div>
    </aside>
  );
}
