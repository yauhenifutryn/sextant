"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Magnetic } from "./magnetic";
import { SextantMark } from "./sextant-mark";

/**
 * Cinematic hero (Option B). Fullscreen looping video background with a
 * glassmorphic nav, large display headline, and primary CTA. Inspired by
 * the Velorah spec — adapted for Sextant's "scientific instrument" tone
 * instead of the original aspirational "deep work" tone.
 *
 * Video source: REPLACE the placeholder URL below with a real Pexels (or
 * licensed) clip. Top picks for Sextant context — close-up science work,
 * NOT outdoor or person-at-field shots:
 *
 *   1. Pexels 8533372 — Male scientist looking at a volumetric flask
 *   2. Pexels 8531297 — Scientist putting specimen on microscope slide
 *   3. Pexels 8490414 — Person putting test tube on a rack
 *   4. Pexels 31005354 — Female scientist conducting laboratory tests
 *   5. Pexels 11218535 — Close-up on devices in laboratory
 *   6. Pexels 8852694 — Variety of laboratory glassware
 *
 * Pexels download URL pattern:
 *   https://videos.pexels.com/video-files/<ID>/<ID>-hd_1920_1080_24fps.mp4
 *
 * Drop the file in `public/hero.mp4` for fastest LCP, or paste a CDN URL
 * directly into VIDEO_SRC. The video must be muted + autoPlay + playsInline
 * to autoplay across browsers.
 *
 * Reduced-motion: video pauses, falls back to a single frame poster.
 */

/**
 * Video source — DROP A FILE INTO `public/hero.mp4` AND THIS LIGHTS UP.
 *
 * Hotlinking from Pexels / Pixabay / Mixkit is blocked by their CDNs (they
 * 403 cross-origin <video> requests). Either:
 *   1. Download a clip and save it as `public/hero.mp4` — fastest, ships
 *      with your deploy, no third-party request. Recommended.
 *   2. Upload to your own CDN / Vercel Blob and put the URL here.
 *   3. Use a Vimeo / YouTube embed instead — would require an iframe, not
 *      a <video> tag, and breaks the autoplay+muted+loop story.
 *
 * Top picks for the lab/research feel (search any of these on Pexels):
 *   - "Female Scientist Conducting Laboratory Tests" (id 31005354)
 *   - "Scientist Putting Specimen on Microscope Slide" (id 8531297)
 *   - "Male Scientist Looking at Volumetric Flask" (id 8533372)
 *   - "Close-up on Devices in Laboratory" (id 11218535)
 * Or Coverr.co / Mixkit have hotlink-friendly URLs for similar shots.
 *
 * If the file at VIDEO_SRC is missing, the hero falls back to a stylized
 * gradient backdrop (still looks intentional, just no video).
 */
const VIDEO_SRC = "/hero.mp4";

// Poster prop omitted — we have no static poster image and the fallback
// gradient backdrop already shows while the video buffers. Setting a
// non-existent poster src created a noisy 404 in the network panel during
// demos.

export function CinematicHero() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [reduced, setReduced] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const onChange = () => setReduced(m.matches);
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlaying = () => setVideoReady(true);
    const onError = () => setVideoReady(false);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("error", onError);
    if (reduced) v.pause();
    else v.play().catch(() => setVideoReady(false));
    return () => {
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("error", onError);
    };
  }, [reduced]);

  return (
    <header id="top" className="l-cine" data-video-ready={videoReady ? "true" : "false"}>
      {/* SVG filter defs are served as a static asset at /cine-filter.svg
       * and referenced from CSS via filter: url('/cine-filter.svg#...').
       * Inline JSX <svg width="0" height="0"> caused a hydration mismatch
       * in Safari (browser sanitizes the empty SVG differently than React
       * expects). Static public asset sidesteps the React tree entirely. */}
      {/* Fallback gradient backdrop — visible if the video file is absent
       * or fails to load. Looks intentional on its own; replaced by the
       * video the moment "playing" fires. */}
      <div className="l-cine-fallback" aria-hidden="true" />
      <video
        ref={videoRef}
        className="l-cine-video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>

      {/* Tint + vignette so the headline stays readable on any frame */}
      <div className="l-cine-scrim" aria-hidden="true" />

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

      <div className="l-cine-stage">
        <div className="l-cine-eyebrow">
          <span className="bar" />
          <span>An instrument for experiment design</span>
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
    </header>
  );
}
