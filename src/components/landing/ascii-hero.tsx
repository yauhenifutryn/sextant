"use client";

import Link from "next/link";

import { Magnetic } from "./magnetic";
import { SextantMark } from "./sextant-mark";
import { VideoAscii } from "./video-ascii";

/**
 * AsciiHero — full-bleed ASCII backdrop, headline + CTA overlaid centered.
 *
 * The user direction after pivoting away from the cinematic-video hero:
 * the same live video→ASCII renderer used in the side-by-side /v1
 * variant, blown up to fill the entire hero viewport. The scientist
 * writing in a notebook (public/hero.mp4) is sampled frame-by-frame and
 * mapped to a forest-green character density ramp, then a soft warm-
 * white scrim sits on top to keep the headline readable without
 * obscuring the ASCII pattern.
 *
 * Palette: warm off-white background, forest green ASCII chars, dark ink
 * for the headline. Same vocabulary as the rest of the landing — the
 * cinematic dark hero is now retired.
 *
 * Composition:
 *   .l-ascii-hero
 *     .l-ascii-hero-bg            ← VideoAscii, expanded to fill 100vh
 *       .l-vascii (overridden)
 *     .l-ascii-hero-scrim         ← warm-white radial gradient
 *     <nav>                       ← brand + sections + CTA
 *     .l-ascii-stage              ← eyebrow + headline + sub + buttons
 */
export function AsciiHero() {
  return (
    <header id="top" className="l-ascii-hero">
      <div className="l-ascii-hero-bg" aria-hidden="true">
        {/* Soft colored video wash — same /hero.mp4 source as the ASCII
         * sampler, played at low opacity + blur so the original colors
         * (white coats, colored petri dishes, lab fixtures) bleed through
         * and tint the ASCII pattern. The two playheads desync slightly
         * over a few seconds; that's fine — it just adds a subtle
         * shimmer instead of locked-step rendering. */}
        <video
          className="l-ascii-hero-color"
          src="/hero.mp4"
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
          aria-hidden="true"
        />
        <VideoAscii className="l-ascii-hero-vascii" />
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
