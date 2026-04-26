"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { LottieAccent } from "./lottie-accent";
import { Magnetic } from "./magnetic";
import { SextantMark } from "./sextant-mark";

/**
 * SvgCartoonHero — alternative hero used at /v2.
 *
 * The user wanted /v2 to drop the real video and replace it with an
 * "SVG-style cartoon of the video, plus a Lottie." Concretely this is an
 * illustrated lab scene (researcher silhouette at a desk, lamp arc,
 * shelved beakers, a notebook page that flips on a CSS keyframe loop)
 * paired with a Lottie research-lens accent.
 *
 * The illustration is pure inline <svg> so it ships zero KB at runtime
 * (it inlines into the HTML), and is animated entirely via CSS keyframes
 * with prefers-reduced-motion fallbacks. The Lottie sits beside the
 * scene as an accent — see <LottieAccent /> for that.
 *
 * Composition lives in cinematic-hero.css under a separate `.l-cartoon`
 * namespace so it can re-use the cinematic page chrome (dark glass nav)
 * without colliding.
 */
export function SvgCartoonHero() {
  const [reduced, setReduced] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const onChange = () => setReduced(m.matches);
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);

  return (
    <header id="top" className="l-cine l-cartoon" data-reduced={reduced ? "true" : "false"}>
      {/* Soft tinted backdrop — replaces the video on /v2. Same forest-clay
       * glow used by the cinematic fallback so the page identity is
       * coherent across the hero variants. */}
      <div className="l-cartoon-bg" aria-hidden="true">
        <div className="l-cartoon-bg-glow" />
        <div className="l-cartoon-bg-grid" />
      </div>

      <nav className="l-cine-nav">
        <div className="l-cine-nav-inner">
          <Link href="#top" className="l-cine-brand" aria-label="Sextant home">
            <SextantMark size={22} className="text-white" />
            <span>Sextant</span>
          </Link>
          <div className="l-cine-links">
            <a href="#problem">Problem</a>
            <a href="#method">Method</a>
            <a href="#loop">Lab rules</a>
            <Link href="/app" className="l-cine-cta">
              Open Sextant
            </Link>
          </div>
        </div>
      </nav>

      <div className="l-cartoon-grid">
        <div className="l-cine-stage l-cartoon-stage">
          <div className="l-cine-eyebrow">
            <span className="bar" />
            <span>An illustrated build of the instrument</span>
          </div>
          <h1 className="l-cine-title">
            From hypothesis to <em>fundable plan</em>
            <br />
            in three minutes.
          </h1>
          <p className="l-cine-sub">
            Frame a scientific question. Four agents draft a citation-grounded protocol — every claim
            cited, every reagent linked, every test green before the document is called ready.
          </p>
          <div className="l-cine-actions">
            <Magnetic strength={10} radius={140}>
              <Link href="/app" className="l-cine-btn primary">
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
            <a href="#method" className="l-cine-btn ghost">
              See the method
            </a>
          </div>
        </div>

        <div className="l-cartoon-scene-col">
          <div className="l-cartoon-scene" ref={stageRef} aria-hidden="true">
            {/* Hand-illustrated lab scene — an SVG cartoon of the same beat
             * the live video shows on /. Layers are animated independently
             * via CSS keyframes (defined in cinematic-hero.css under the
             * `.l-cartoon-scene` namespace). All decorative; aria-hidden. */}
            <svg viewBox="0 0 480 360" preserveAspectRatio="xMidYMid meet" role="img">
              {/* Floor + wall split */}
              <rect className="cs-wall" x="0" y="0" width="480" height="240" />
              <rect className="cs-floor" x="0" y="240" width="480" height="120" />

              {/* Window with soft daylight */}
              <g className="cs-window">
                <rect x="40" y="48" width="120" height="120" rx="4" />
                <line x1="100" y1="48" x2="100" y2="168" />
                <line x1="40" y1="108" x2="160" y2="108" />
                {/* Sun glow */}
                <circle className="cs-sun" cx="130" cy="76" r="14" />
              </g>

              {/* Bookshelf */}
              <g className="cs-shelf">
                <rect x="320" y="60" width="120" height="86" rx="3" />
                <line x1="320" y1="103" x2="440" y2="103" />
                {/* Books on top shelf */}
                <rect className="cs-book b1" x="328" y="68" width="9" height="32" />
                <rect className="cs-book b2" x="340" y="64" width="9" height="36" />
                <rect className="cs-book b3" x="352" y="70" width="9" height="30" />
                <rect className="cs-book b4" x="364" y="66" width="9" height="34" />
                <rect className="cs-book b5" x="378" y="72" width="9" height="28" />
                <rect className="cs-book b6" x="390" y="68" width="9" height="32" />
                {/* Beaker on the lower shelf */}
                <g className="cs-beaker">
                  <path d="M338 138 L 338 112 L 358 112 L 358 138 Q 348 144 338 138 Z" />
                  <path className="cs-beaker-liquid" d="M339 134 L 357 134 L 357 138 Q 348 143 339 138 Z" />
                  <line x1="340" y1="115" x2="356" y2="115" />
                </g>
                {/* Microscope silhouette */}
                <g className="cs-microscope">
                  <path d="M390 144 L 390 130 L 396 124 L 410 124 L 416 130 L 416 144 Z" />
                  <circle cx="403" cy="118" r="4" />
                  <line x1="395" y1="144" x2="411" y2="144" />
                </g>
              </g>

              {/* Desk */}
              <g className="cs-desk">
                <rect x="140" y="240" width="220" height="8" rx="2" />
                <rect x="148" y="248" width="6" height="60" />
                <rect x="346" y="248" width="6" height="60" />
              </g>

              {/* Notebook with flipping page */}
              <g className="cs-notebook" transform="translate(186 198)">
                <rect className="cs-nb-base" x="0" y="0" width="92" height="44" rx="2" />
                <line className="cs-nb-line" x1="6" y1="12" x2="86" y2="12" />
                <line className="cs-nb-line" x1="6" y1="22" x2="86" y2="22" />
                <line className="cs-nb-line" x1="6" y1="32" x2="62" y2="32" />
                {/* Page that flips on loop */}
                <g className="cs-nb-page">
                  <rect x="0" y="0" width="46" height="44" rx="2" />
                  <line x1="6" y1="12" x2="40" y2="12" />
                  <line x1="6" y1="22" x2="40" y2="22" />
                  <line x1="6" y1="32" x2="32" y2="32" />
                </g>
              </g>

              {/* Researcher silhouette */}
              <g className="cs-figure">
                <circle className="cs-head" cx="240" cy="156" r="14" />
                <path className="cs-body" d="M218 240 Q 220 196 240 188 Q 260 196 262 240 Z" />
                <path
                  className="cs-arm"
                  d="M252 200 Q 274 208 286 222"
                />
              </g>

              {/* Desk lamp */}
              <g className="cs-lamp">
                <line className="cs-lamp-arm-1" x1="304" y1="240" x2="318" y2="208" />
                <line className="cs-lamp-arm-2" x1="318" y1="208" x2="296" y2="186" />
                <path className="cs-lamp-shade" d="M283 178 L 308 178 L 302 196 L 290 196 Z" />
                <circle className="cs-lamp-base" cx="304" cy="240" r="4" />
                <circle className="cs-lamp-glow" cx="296" cy="200" r="22" />
              </g>

              {/* Floating idea bubbles */}
              <g className="cs-ideas">
                <circle className="cs-idea cs-i1" cx="178" cy="148" r="3" />
                <circle className="cs-idea cs-i2" cx="200" cy="128" r="2" />
                <circle className="cs-idea cs-i3" cx="222" cy="118" r="2.5" />
              </g>
            </svg>

            <div className="l-cartoon-lottie" aria-hidden="true">
              <LottieAccent />
              <span className="l-cartoon-lottie-cap">live · scanning sources</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
