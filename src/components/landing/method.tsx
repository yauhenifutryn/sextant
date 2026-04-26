export function LandingMethod() {
  return (
    <section className="l-solve" id="method">
      <div className="wrap">
        <span className="l-section-label l-reveal">
          <span className="num">02</span>
          <span>The method</span>
        </span>
        <h2 className="l-section-title l-reveal delay-1">
          Four agents, working in parallel against the <em>same plan document</em>.
        </h2>
        <p className="l-section-lede l-reveal delay-2">
          Sextant is not a chatbot. It writes — and watches itself write. Each agent owns a slice of
          the plan, every edit is grounded in a fetched source, and a validation grid blocks the
          document from being called ready until every test passes.
        </p>

        <div className="l-solve-stage l-reveal delay-2" data-anim="solve">
          <svg
            className="l-solve-svg"
            viewBox="0 0 1000 460"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path className="link" pathLength={100} d="M 195 230 Q 350 230 500 230" />
            <path className="link" pathLength={100} d="M 500 110 Q 500 170 500 230" />
            <path className="link" pathLength={100} d="M 500 350 Q 500 290 500 230" />
            <path className="link" pathLength={100} d="M 805 230 Q 650 230 500 230" />
          </svg>

          <div className="l-agent-node" data-i="0">
            <div className="row">
              <span className="l-agent-dot researcher" />
              <span className="l-agent-name">Researcher</span>
              <span className="l-agent-tag">01</span>
            </div>
            <p className="l-agent-task">
              Surveys the literature, anchors every claim to a citation, flags prior art.
            </p>
            <span className="l-agent-pulse" aria-hidden="true" />
          </div>
          <div className="l-agent-node" data-i="1">
            <div className="row">
              <span className="l-agent-dot skeptic" />
              <span className="l-agent-name">Skeptic</span>
              <span className="l-agent-tag">02</span>
            </div>
            <p className="l-agent-task">
              Challenges assumptions, demands controls, marks novelty vs. duplication.
            </p>
          </div>
          <div className="l-agent-node" data-i="2">
            <div className="row">
              <span className="l-agent-dot operator" />
              <span className="l-agent-name">Operator</span>
              <span className="l-agent-tag">03</span>
            </div>
            <p className="l-agent-task">
              Sources reagents, prices the plan, lays a feasible timeline with dependencies.
            </p>
          </div>
          <div className="l-agent-node" data-i="3">
            <div className="row">
              <span className="l-agent-dot compliance" />
              <span className="l-agent-name">Compliance</span>
              <span className="l-agent-tag">04</span>
            </div>
            <p className="l-agent-task">
              Enforces ethics, biosafety, and lab-specific rules. Blocks unsafe drafts.
            </p>
          </div>

          <div className="l-stage-center" aria-hidden="true">
            <span className="label">Plan</span>
            <span className="doc">live · streaming</span>
            <span className="ticks">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
        </div>

        <div className="l-solve-grid l-reveal delay-3">
          <div className="cell">
            <div className="row">
              <span className="l-agent-dot researcher" />
              <h4>Researcher</h4>
            </div>
            <p>
              Pulls primary sources, attaches a citation chip to every claim, surfaces prior work and
              the novel angle.
            </p>
          </div>
          <div className="cell">
            <div className="row">
              <span className="l-agent-dot skeptic" />
              <h4>Skeptic</h4>
            </div>
            <p>
              Argues against the protocol. Forces sham controls, statistical power checks, and
              falsifiable success criteria.
            </p>
          </div>
          <div className="cell">
            <div className="row">
              <span className="l-agent-dot operator" />
              <h4>Operator</h4>
            </div>
            <p>
              Fills the materials table with catalog numbers, real prices, lead times, and a Gantt
              that respects dependencies.
            </p>
          </div>
          <div className="cell">
            <div className="row">
              <span className="l-agent-dot compliance" />
              <h4>Compliance</h4>
            </div>
            <p>
              Runs ethics, biosafety, and your lab&rsquo;s typed rules. The plan can&rsquo;t be
              marked ready until this gate is green.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
