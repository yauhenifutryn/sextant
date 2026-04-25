import Link from "next/link";

export function LandingFinalCta() {
  return (
    <section className="l-cta">
      <div className="wrap l-cta-inner">
        <div>
          <h2 className="l-reveal">
            A plan that <em>cites itself</em>, prices itself, and learns your lab.
          </h2>
          <p className="l-reveal delay-1">
            Three minutes from question to fundable. Every reagent links to a real catalog page.
            Every test must pass.
          </p>
          <Link href="/app" className="l-btn-primary l-reveal delay-2">
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
        </div>
        <div className="l-cta-side l-reveal delay-3">
          <div className="h">Validation grid</div>
          <div className="list">
            <div>✓&nbsp;&nbsp;Every reagent has a catalog URL</div>
            <div>✓&nbsp;&nbsp;Budget sums correctly</div>
            <div>✓&nbsp;&nbsp;No orphan protocol step</div>
            <div>✓&nbsp;&nbsp;Citations resolve to real sources</div>
            <div>✓&nbsp;&nbsp;Timeline dependencies valid</div>
            <div>✓&nbsp;&nbsp;Compliance pipeline passes</div>
          </div>
        </div>
      </div>
    </section>
  );
}
