import Link from "next/link";

import { VideoAscii } from "./video-ascii";

/**
 * Hero — two-column composition. Copy on the left, live video-ASCII
 * rendering on the right. The same hero MP4 that plays on / is sampled
 * frame-by-frame and rendered as monospace ASCII characters here, so the
 * right column reads as "the lab footage, but seen through the agent's
 * eye" — a literal interpretation of the user's "use the lab video as
 * reference for ASCII" request. On mobile it stacks below the copy.
 */
export function LandingHero() {
  return (
    <header className="l-hero" id="top">
      <div className="wrap l-hero-grid">
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

        <div className="l-hero-stage l-reveal delay-2">
          <VideoAscii />
        </div>
      </div>
    </header>
  );
}
