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
          <div className="h">
            <span>Validation grid</span>
            <span className="pill">6 / 6 pass</span>
          </div>
          <div className="list">
            {[
              "Every reagent has a catalog URL",
              "Budget sums correctly",
              "No orphan protocol step",
              "Citations resolve to real sources",
              "Timeline dependencies valid",
              "Compliance pipeline passes",
            ].map((line) => (
              <div className="item" key={line}>
                <span className="check" aria-hidden="true">
                  ✓
                </span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
