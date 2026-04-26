"use client";

import Link from "next/link";

import { Magnetic } from "./magnetic";
import { PapersRain } from "./papers-rain";
import { ProtocolStream } from "./protocol-stream";
import { SextantMark } from "./sextant-mark";

/**
 * AsciiHero — three-layer editorial hero.
 *
 *   Layer 0  PapersRain         full-bleed ASCII paper-rain (procedural
 *                               physics, low opacity, ambient texture)
 *   Layer 1  ProtocolStream     left-column typed agent log (what the
 *                               four agents actually do — cite, challenge,
 *                               source, gate). Soft right-edge mask so it
 *                               dissolves into paper before the headline.
 *   Layer 2  Stage              right-column eyebrow + headline + sub +
 *                               CTAs on clean warm paper.
 *
 * Replaces the prior video→ASCII sampler, which produced noisy human
 * shapes that read as artifact. Now nothing is recorded — every glyph
 * on screen is generated, either by the protocol-stream typing engine
 * or the papers-rain physics simulation.
 */
export function AsciiHero() {
  return (
    <header id="top" className="l-ascii-hero">
      <PapersRain className="l-ascii-hero-papers" />
      <div className="l-ascii-hero-bg" aria-hidden="true">
        <ProtocolStream />
      </div>
      <div className="l-ascii-hero-scrim" aria-hidden="true" />

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
