/**
 * Header bar (D-17). 56px tall, full-width, only rendered on `/app/*`
 * routes via the nested layout — never on `/` (landing).
 *
 * Avatar and Settings buttons were removed pre-demo: they were dead stubs and
 * a non-working button under judges' eyes hurts more than a missing one.
 * The lab profile drawer (LOOP-05) is in DEFERRED.md.
 *
 * The "lab rules" pill goes live in Phase 7 via useLabRules().
 */
export function HeaderBar() {
  return (
    <header className="h-14 border-b border-borderwarm bg-paper flex items-center justify-between px-6">
      <div className="font-display text-base font-medium text-ink">Sextant</div>
      <div className="font-mono text-xs text-muted-foreground truncate max-w-md text-center">
        Awaiting hypothesis…
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-ink rounded-full border border-borderwarm bg-surface px-3 py-1">
          0 lab rules
        </span>
      </div>
    </header>
  );
}
