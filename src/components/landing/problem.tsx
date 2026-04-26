/**
 * Problem section — the editorial framing of WHY Sextant exists.
 *
 * The headline carries three strikethrough words ("slow", "expensive",
 * "ungrounded") whose cross-out lines paint in sequentially as the
 * section enters the viewport. Behind the headline, a low-opacity
 * "drift" of failure-mode tags (no citation, source missing, etc.)
 * floats upward — the visual unconscious of an ungrounded protocol.
 */

const DRIFT_TAGS = [
  { text: "[ no citation ]", col: 8 },
  { text: "[ source missing ]", col: 22 },
  { text: "[ unverified ]", col: 38 },
  { text: "[ catalog 404 ]", col: 54 },
  { text: "[ broken DOI ]", col: 70 },
  { text: "[ no reagent link ]", col: 84 },
];

export function LandingProblem() {
  return (
    <section className="l-problem" id="problem">
      <div className="l-problem-drift" aria-hidden="true">
        {DRIFT_TAGS.map((tag, i) => (
          <span
            key={tag.text}
            className="drift-tag"
            style={{
              ["--i" as string]: i,
              ["--col" as string]: `${tag.col}%`,
            }}
          >
            {tag.text}
          </span>
        ))}
      </div>
      <div className="wrap">
        <span className="l-section-label l-reveal">
          <span className="num">01</span>
          <span>The problem</span>
        </span>
        <h2 className="l-problem-headline l-reveal delay-1">
          Contract research is <span className="strike">slow</span>,{" "}
          <span className="strike">expensive</span>, and{" "}
          <span className="strike">ungrounded</span> — most experiment plans <em>cite nothing</em>,
          link to nothing, and arrive weeks late.
        </h2>
      </div>
    </section>
  );
}
