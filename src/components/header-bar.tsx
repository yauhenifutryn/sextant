import { Settings } from "lucide-react";

/**
 * Header bar (D-17). 56px tall, full-width, only rendered on `/app/*`
 * routes via the nested layout — never on `/` (landing).
 *
 * Phase 1 placeholder: text wordmark "Sextant". Phase 8 replaces with
 * `public/logo.svg` from the Claude Design output (D-28a).
 *
 * Right-side controls (avatar, lab-rules pill, settings cog) are stubs —
 * clicking them does nothing in Phase 1. They have aria-labels for
 * keyboard / screen-reader accessibility (DESIGN-04).
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
        <button
          type="button"
          aria-label="Lab profile"
          className="h-9 w-9 rounded-full bg-surface border border-borderwarm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
        />
        <button
          type="button"
          aria-label="Settings"
          className="text-muted-foreground hover:text-ink rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
        >
          <Settings size={20} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
