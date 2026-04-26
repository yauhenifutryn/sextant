"use client";

import Link from "next/link";

import { Magnetic } from "./magnetic";
import { ProtocolStream } from "./protocol-stream";
import { SextantMark } from "./sextant-mark";

/**
 * AsciiHero — editorial hero with a typed agent-log column on the left.
 *
 * Replaces the prior live-video → ASCII rendering. The video sampler
 * produced shapes that read as artifact, not as the product. This hero
 * is text-as-design: a slow-typed monospace transcript of what the four
 * agents actually do (cite a reagent, demand a sham control, swap a
 * supplier, run compliance), occupying the left half of the viewport.
 * The headline + CTA sit in the right half on clean paper. The two
 * columns face each other rather than the headline floating on noise.
 *
 * Composition:
 *   .l-ascii-hero
 *     .l-ascii-hero-bg            ← ProtocolStream column (left half)
 *     <nav>                       ← brand + sections + CTA
 *     .l-ascii-stage              ← eyebrow + headline + sub + buttons (right)
 */
export function AsciiHero() {
  return (
    <header id="top" className="l-ascii-hero">
      <div className="l-ascii-hero-bg" aria-hidden="true">
        <ProtocolStream />
      </div>

      <nav id="sx-nav" className="l-ascii-nav">
        <div className="wrap l-ascii-nav-inner">
          <Link href="#top" className="l-ascii-brand" aria-label="Sextant home">
            <SextantMark size={22} />
            <span>Sextant</span>
          </Link>
          <div className="l-ascii-links">
            <a href="#problem">Problem</a>
            <a href="#method">Method</a>
            <a href="#loop">Lab rules</a>
            <Link href="/app" className="l-ascii-cta">
              Open Sextant
            </Link>
          </div>
        </div>
      </nav>

      <div className="l-ascii-stage">
        <span className="l-ascii-eyebrow">
          <span className="bar" />
          <span>An instrument for experiment design</span>
        </span>
        <h1 className="l-ascii-title">
          From hypothesis to <em>fundable plan</em>
          <br />
          in three minutes.
        </h1>
        <p className="l-ascii-sub">
          Frame a scientific question. Four agents draft a citation-grounded protocol — every claim
          cited, every reagent linked, every test green before the document is called ready.
        </p>
        <div className="l-ascii-actions">
          <Magnetic strength={10} radius={140}>
            <Link href="/app" className="l-ascii-btn primary">
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
          </Magnetic>
          <a href="#method" className="l-ascii-btn ghost">
            See the method
          </a>
        </div>
      </div>
    </header>
  );
}
