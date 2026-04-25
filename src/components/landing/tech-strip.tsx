/**
 * Tech strip — "Built on" row with the four AI/infra brands powering Sextant.
 *
 * Marks below are monochrome SVG paths derived from each brand's
 * publicly-published logo (Simple Icons style — the canonical
 * single-color brand glyphs). They render in `currentColor` so they
 * inherit the muted/forest-green palette and the row reads as a
 * deliberate brand band, not a decoration row of generic icons.
 *
 *   - Anthropic — stripe-A (their 2024 wordmark mark)
 *   - Google Gemini — four-point sparkle
 *   - Tavily — magnifying-lens with offset dot (their search-API motif)
 *   - Vercel — official triangle
 *
 * Sizing is consistent at 20px so optical weight matches across marks.
 * The text alongside is set in Inter Tight — same family used for the
 * landing display type — at a tighter letter-spacing to evoke a logotype
 * rather than a UI label.
 */
export function LandingTechStrip() {
  return (
    <section className="l-tech">
      <div className="wrap">
        <div className="l-tech-label">Built on</div>
        <div className="l-tech-row">
          <span className="mark" aria-label="Anthropic">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5527h3.7442L10.5363 3.541ZM6.3249 13.7642l2.2914-5.9447 2.2914 5.9447Z" />
            </svg>
            <span className="mark-text">Anthropic</span>
          </span>
          <span className="mark" aria-label="Google Gemini">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0c0 3.3-1.36 6.43-3.79 8.85C5.79 11.27 2.66 12 0 12c2.66 0 5.79.73 8.21 3.15C10.64 17.57 12 20.7 12 24c0-3.3 1.36-6.43 3.79-8.85C18.21 12.73 21.34 12 24 12c-2.66 0-5.79-.73-8.21-3.15C13.36 6.43 12 3.3 12 0Z" />
            </svg>
            <span className="mark-text">Gemini</span>
          </span>
          <span className="mark" aria-label="Tavily">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx={10.5} cy={10.5} r={6.5} />
              <path d="m20.5 20.5-5-5" />
              <circle cx={10.5} cy={10.5} r={1.6} fill="currentColor" stroke="none" />
            </svg>
            <span className="mark-text">Tavily</span>
          </span>
          <span className="mark" aria-label="Vercel">
            <svg
              width="20"
              height="18"
              viewBox="0 0 24 22"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 1 23.5 21H0.5Z" />
            </svg>
            <span className="mark-text">Vercel</span>
          </span>
        </div>
      </div>
    </section>
  );
}
