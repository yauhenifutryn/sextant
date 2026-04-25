"use client";

/**
 * Sextant loader — a multi-line flowing indicator for "agents working"
 * states in the dashboard. Inspired by the gunnargray multi-bar loader
 * (the Twitter video reference), styled to match Sextant's forest+ink
 * palette and monospace agent labels.
 *
 * Visual: four short bars, each labeled by an agent (Researcher / Skeptic
 * / Operator / Compliance), pulsing at slightly different cadences so the
 * group reads as "four parallel processes" rather than a metronome. Above
 * them, a status caption that the dashboard can override via prop.
 *
 * Usage:
 *   <SextantLoader status="surveying literature · 12 papers anchored" />
 *
 * Standalone — no dependencies, no global state. Drop it anywhere a
 * "thinking" indicator is needed.
 */

type Props = {
  status?: string;
  /** Visual size variant. `sm` for inline, `md` for empty-state hero. */
  size?: "sm" | "md";
};

const AGENTS = [
  { key: "researcher", label: "Researcher", color: "var(--primary)", delay: "0s" },
  { key: "skeptic", label: "Skeptic", color: "var(--secondary)", delay: "0.18s" },
  { key: "operator", label: "Operator", color: "hsl(var(--foreground))", delay: "0.36s" },
  { key: "compliance", label: "Compliance", color: "#4a6fa5", delay: "0.54s" },
];

export function SextantLoader({ status = "agents working…", size = "md" }: Props) {
  return (
    <div className={`sx-loader sx-loader--${size}`} role="status" aria-live="polite">
      <span className="sx-loader__caption">{status}</span>
      <div className="sx-loader__bars" aria-hidden="true">
        {AGENTS.map((a) => (
          <div
            key={a.key}
            className="sx-loader__bar"
            style={{
              ["--bar-color" as string]: a.color,
              ["--bar-delay" as string]: a.delay,
            }}
          >
            <span className="sx-loader__bar-fill" />
            <span className="sx-loader__bar-label">{a.label}</span>
          </div>
        ))}
      </div>

      <style>{`
        .sx-loader {
          display: inline-flex;
          flex-direction: column;
          gap: 12px;
          font-family: var(--font-geist-mono), ui-monospace, monospace;
        }
        .sx-loader--sm { gap: 6px; }
        .sx-loader__caption {
          font-size: 11.5px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: hsl(var(--muted-foreground));
        }
        .sx-loader--sm .sx-loader__caption { font-size: 10.5px; }
        .sx-loader__bars {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          min-width: 360px;
        }
        .sx-loader--sm .sx-loader__bars {
          min-width: 240px;
          gap: 8px;
        }
        .sx-loader__bar {
          position: relative;
          height: 3px;
          border-radius: 999px;
          background: hsl(var(--muted) / 0.6);
          overflow: visible;
        }
        .sx-loader__bar-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 30%;
          border-radius: 999px;
          background: var(--bar-color);
          opacity: 0.85;
          animation: sx-loader-flow 1.6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          animation-delay: var(--bar-delay);
          box-shadow: 0 0 10px var(--bar-color);
        }
        .sx-loader__bar-label {
          position: absolute;
          top: 8px;
          left: 0;
          font-size: 10px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: hsl(var(--muted-foreground));
          white-space: nowrap;
        }
        .sx-loader--sm .sx-loader__bar-label { font-size: 9px; top: 6px; }
        @keyframes sx-loader-flow {
          0%   { left: -30%; width: 30%; opacity: 0.4; }
          50%  { width: 45%; opacity: 1; }
          100% { left: 100%; width: 30%; opacity: 0.4; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sx-loader__bar-fill {
            animation: none;
            left: 0;
            width: 35%;
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
