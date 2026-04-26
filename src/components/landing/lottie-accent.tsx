"use client";

import Lottie from "lottie-react";
import { useEffect, useState } from "react";

/**
 * LottieAccent — small accent animation rendered via lottie-react.
 *
 * The Lottie data lives at `public/researcher.json` (a hand-authored
 * minimal Lottie: orbiting clay dot + scaling forest-green ring +
 * pulsing center dot). We load it client-side rather than baking the
 * JSON into the bundle so the initial JS payload stays small.
 *
 * Falls back to a simple SVG pulse if the fetch fails (e.g. asset 404
 * or content blocking) — design intent is "always show something",
 * never an empty box.
 *
 * prefers-reduced-motion: still renders the Lottie but uses Lottie's
 * built-in `loop={false}` + `autoplay={false}` so the user sees a
 * static first frame.
 */
type LottieData = Record<string, unknown>;

export function LottieAccent() {
  const [data, setData] = useState<LottieData | null>(null);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    let cancelled = false;
    fetch("/researcher.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not ok"))))
      .then((j) => {
        if (!cancelled) setData(j as LottieData);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed || !data) {
    // Minimal fallback — a static SVG ring + dot in the brand colors.
    return (
      <div className="l-cartoon-lottie-fallback" role="presentation">
        <svg viewBox="0 0 100 100" width="80" height="80" aria-hidden="true">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#0F4C3A" strokeOpacity="0.35" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="6" fill="#0F4C3A" />
          <circle cx="86" cy="50" r="4" fill="#B85C38" />
        </svg>
      </div>
    );
  }

  return (
    <Lottie
      animationData={data}
      loop={!reduced}
      autoplay={!reduced}
      style={{ width: 96, height: 96 }}
      aria-hidden="true"
    />
  );
}
