export function LandingClosedLoop() {
  return (
    <section className="l-loop" id="loop">
      <div className="wrap">
        <span className="l-section-label l-reveal">
          <span className="num">03</span>
          <span>The closed loop</span>
        </span>
        <h2 className="l-section-title l-reveal delay-1">
          Every correction becomes a typed lab rule.{" "}
          <em>Applied to every plan after it.</em>
        </h2>
        <p className="l-section-lede l-reveal delay-2">
          When you correct a line in the protocol, Sextant captures the rule, names it, and
          re-applies it the next time a plan touches the same shape. The agents learn your lab —
          not the average lab.
        </p>

        <div className="l-loop-canvas" data-anim="loop">
          <div className="l-loop-row" data-arrows>
            <div className="l-loop-card" data-i="0">
              <div className="step">Step 01 · Correction</div>
              <h4>You edit the protocol.</h4>
              <div className="doc-line">
                <span style={{ textDecoration: "line-through", color: "var(--muted-2)" }}>
                  Inject 200 μL vehicle into n=8 mice; observe at 24h.
                </span>
                <br />
                <span style={{ color: "var(--ink)" }}>
                  Inject 200 μL vehicle into{" "}
                  <strong style={{ color: "var(--clay)" }}>n=8 sham + n=8 dosed</strong>; observe at
                  24h.
                </span>
              </div>
            </div>
            <div className="l-loop-arrow" aria-hidden="true">
              {/* pathLength=100 lets us drive stroke-dashoffset from a 0..100
               * scale in CSS regardless of the SVG's actual length, so the
               * --loop-progress var (0..1) maps cleanly to dash. data-arrow
               * indexes the slice of progress this arrow consumes — see
               * .l-loop-canvas .l-loop-arrow rules in landing.css. */}
              <svg
                viewBox="0 0 36 12"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.25}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path className="loop-arrow-line" pathLength={100} d="M0 6h32" />
                <path className="loop-arrow-tip" pathLength={100} d="m28 2 4 4-4 4" />
              </svg>
            </div>
            <div className="l-loop-card" data-i="1">
              <div className="step">Step 02 · Typed lab rule</div>
              <h4>Sextant captures the pattern.</h4>
              <div className="rule">
                <span className="tag">Rule · LR-12</span>
                Always include a sham control arm in <em>in vivo</em> mouse studies, matched n.
                <div
                  style={{
                    marginTop: 10,
                    color: "var(--muted-2)",
                    fontSize: 11,
                  }}
                >
                  applies&nbsp;to:{" "}
                  <span style={{ color: "var(--ink)" }}>
                    study.species == &ldquo;mouse&rdquo; ∧ design.has_dose
                  </span>
                </div>
              </div>
            </div>
            <div className="l-loop-arrow" aria-hidden="true">
              {/* pathLength=100 lets us drive stroke-dashoffset from a 0..100
               * scale in CSS regardless of the SVG's actual length, so the
               * --loop-progress var (0..1) maps cleanly to dash. data-arrow
               * indexes the slice of progress this arrow consumes — see
               * .l-loop-canvas .l-loop-arrow rules in landing.css. */}
              <svg
                viewBox="0 0 36 12"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.25}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path className="loop-arrow-line" pathLength={100} d="M0 6h32" />
                <path className="loop-arrow-tip" pathLength={100} d="m28 2 4 4-4 4" />
              </svg>
            </div>
            <div className="l-loop-card" data-i="2">
              <div className="step">Step 03 · Applied to next plan</div>
              <h4>Next mouse plan, drafted with it.</h4>
              <div className="applied">
                Vehicle injection arm: <span className="new">n=8 sham + n=8 dosed</span>,
                observation at 24h.
                <br />
                <span style={{ color: "var(--muted-2)", fontSize: 11 }}>
                  — rule LR-12 applied automatically
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
