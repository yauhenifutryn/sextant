"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const CHECKS = [
  "Every reagent has a catalog URL",
  "Budget sums correctly",
  "No orphan protocol step",
  "Citations resolve to real sources",
  "Timeline dependencies valid",
  "Compliance pipeline passes",
];

const STAGGER_MS = 220;

export function LandingFinalCta() {
  const sideRef = useRef<HTMLDivElement | null>(null);
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    const el = sideRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setCompleted(CHECKS.length);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            // Stagger ticks one-by-one until all 6 are green.
            CHECKS.forEach((_, i) => {
              setTimeout(() => setCompleted((c) => Math.max(c, i + 1)), i * STAGGER_MS);
            });
            obs.disconnect();
            break;
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="cta" className="l-cta">
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
        <div className="l-cta-side l-reveal delay-3" ref={sideRef}>
          <div className="h">
            <span>Validation grid</span>
            <span
              className={`pill ${completed === CHECKS.length ? "pill-done" : ""}`}
              aria-live="polite"
            >
              {completed} / {CHECKS.length} pass
            </span>
          </div>
          <div className="list">
            {CHECKS.map((line, i) => (
              <div className={`item ${i < completed ? "is-passed" : ""}`} key={line}>
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
