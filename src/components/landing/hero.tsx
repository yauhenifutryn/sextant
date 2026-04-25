import Link from "next/link";

import { AsciiBackdrop } from "./ascii-backdrop";

/**
 * Hero — full-bleed `<AsciiBackdrop />` paper-flow + left-aligned copy
 * column over it. Single column (no more 2-col with a contained ASCII card);
 * the backdrop carries the visual centerpiece and the copy reads against it.
 *
 * Stacking: `.l-hero` is `position: relative`, the backdrop is absolute at
 * z-index 0 inside it, and the copy is z-index 1. When the user scrolls past
 * the hero, the backdrop fades (handled in ascii-backdrop.tsx via a scroll
 * listener) and the solid-bg sections below take over.
 */
export function LandingHero() {
  return (
    <header className="l-hero" id="top">
      <AsciiBackdrop />
      <div className="wrap">
        <div className="l-hero-copy">
          <div className="l-hero-eyebrow l-reveal">
            <span className="bar" />
            <span>An instrument for experiment design</span>
          </div>

          <h1 className="l-hero-title l-reveal delay-1">
            <span className="stack">From hypothesis</span>
            <span className="stack">
              to <em>fundable plan</em>
            </span>
            <span className="stack">in three minutes.</span>
          </h1>

          <p className="l-hero-sub l-reveal delay-2">
            Frame a scientific question. Four agents draft a{" "}
            <strong>citation-grounded</strong> protocol, sourced materials, budget, and timeline —
            every claim cited, every reagent linked, every test green before the document is called
            ready.
          </p>

          <div className="l-hero-actions l-reveal delay-3">
            <Link href="/app" className="l-btn-primary">
              Open Sextant
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </Link>
            <a href="#method" className="l-btn-secondary">
              See the method
            </a>
          </div>

          <div className="l-hero-keys l-reveal delay-4">
            <div>
              <kbd>⌘</kbd>
              <kbd>K</kbd> open command palette
            </div>
            <div>
              <kbd>⌥</kbd>
              <kbd>↵</kbd> stream a plan
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
