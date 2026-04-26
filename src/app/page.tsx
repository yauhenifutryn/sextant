import "@/components/landing/landing.css";

import { AsciiHero } from "@/components/landing/ascii-hero";
import { CustomCursor } from "@/components/landing/custom-cursor";
import { LandingClosedLoop } from "@/components/landing/closed-loop";
import { LandingFinalCta } from "@/components/landing/final-cta";
import { LandingFooter } from "@/components/landing/site-footer";
import { LandingMethod } from "@/components/landing/method";
import { LandingObservers } from "@/components/landing/landing-observers";
import { LandingProblem } from "@/components/landing/problem";
import { LandingTechStrip } from "@/components/landing/tech-strip";

/**
 * Sextant landing — full-bleed ASCII hero.
 *
 * Locked direction: the live video → ASCII renderer (hand-writing in a
 * notebook, sampled frame-by-frame to a 96×54 character grid) fills the
 * entire hero viewport at low opacity, with a warm-white scrim and the
 * headline + CTA centered on top. Same warm + forest palette as the rest
 * of the landing — the cinematic dark variant is retired.
 *
 * Composition:
 *   - AsciiHero          full-bleed ASCII backdrop + nav + headline + CTA
 *   - LandingProblem     one-line strikethrough headline
 *   - LandingMethod      four-agent radial diagram (mouse parallax) + grid
 *   - LandingClosedLoop  three-step diagram (scroll-driven arrow draw)
 *   - LandingTechStrip   Anthropic / Gemini / Tavily / Vercel wordmarks
 *   - LandingFinalCta    secondary CTA + validation-grid sidecar
 *   - LandingFooter      minimal mark + meta line
 *   - LandingObservers   IntersectionObserver + scroll + smooth-scroll +
 *                        radial mouse parallax + closed-loop scroll-progress
 *
 * Variants kept for comparison: /v1 (side-by-side ASCII), /v2 (SVG cartoon).
 */
export default function Landing() {
  return (
    <div className="landing-root">
      <main>
        <AsciiHero />
        <LandingProblem />
        <LandingMethod />
        <LandingClosedLoop />
        <LandingTechStrip />
        <LandingFinalCta />
      </main>
      <LandingFooter />
      <LandingObservers />
      <CustomCursor />
    </div>
  );
}
