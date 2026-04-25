import "@/components/landing/landing.css";
import "@/components/landing/cinematic-hero.css";

import { CinematicHero } from "@/components/landing/cinematic-hero";
import { CustomCursor } from "@/components/landing/custom-cursor";
import { LandingClosedLoop } from "@/components/landing/closed-loop";
import { LandingFinalCta } from "@/components/landing/final-cta";
import { LandingFooter } from "@/components/landing/site-footer";
import { LandingMethod } from "@/components/landing/method";
import { LandingObservers } from "@/components/landing/landing-observers";
import { LandingProblem } from "@/components/landing/problem";
import { LandingTechStrip } from "@/components/landing/tech-strip";

/**
 * Sextant landing — Cinematic hero (promoted from /v2).
 *
 * Composition:
 *   - CinematicHero      fullscreen video bg + glassmorphic dark nav,
 *                        owns its own nav so we drop <LandingNav />
 *   - LandingProblem     one-line strikethrough headline
 *   - LandingMethod      four-agent radial diagram + 4-cell explainer grid
 *   - LandingClosedLoop  three-step correction → rule → applied diagram
 *   - LandingTechStrip   Anthropic / Gemini / Tavily / Vercel marks
 *   - LandingFinalCta    secondary CTA + validation-grid sidecar
 *   - LandingFooter      minimal mark + meta line
 *   - LandingObservers   IntersectionObserver + scroll listener +
 *                        JS smooth-scroll for nav anchors
 *
 * The lab-notebook variant lives at /v1 (legacy), the cinematic spec is
 * still mirrored at /v2 so we can A/B without re-promoting.
 */
export default function Landing() {
  return (
    <div className="landing-root">
      <main>
        <CinematicHero />
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
