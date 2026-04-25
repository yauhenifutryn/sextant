import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Landing-page placeholder (D-18a, D-26a).
 *
 * Phase 1 ships a token-correct, animation-free placeholder: centered
 * Sextant wordmark, tagline, single forest-green "Open Sextant" CTA that
 * links to `/app`. No header bar (the header lives in the nested
 * `/app/layout.tsx`, not in the root layout).
 *
 * Phase 8 replaces this entire file with the Claude Design output —
 * animated, scroll-driven landing using Framer Motion (D-27, D-28a).
 */
export default function Landing() {
  return (
    <main className="min-h-screen bg-paper text-ink flex items-center justify-center px-6">
      <div className="flex flex-col items-center text-center gap-8 max-w-2xl">
        <h1 className="font-display text-6xl md:text-8xl font-semibold tracking-tight text-ink">
          Sextant
        </h1>
        <p className="font-sans text-lg text-muted-foreground max-w-xl">
          From hypothesis to fundable, citation-grounded experiment plan in
          three minutes.
        </p>
        <Link href="/app">
          <Button
            type="button"
            size="lg"
            className="bg-forest text-primary-foreground hover:bg-forest/90 font-sans px-6 py-3"
          >
            Open Sextant
          </Button>
        </Link>
      </div>
    </main>
  );
}
