import "@/components/landing/landing.css";

import { LandingClosedLoop } from "@/components/landing/closed-loop";
import { LandingFinalCta } from "@/components/landing/final-cta";
import { LandingFooter } from "@/components/landing/site-footer";
import { LandingHero } from "@/components/landing/hero";
import { LandingMethod } from "@/components/landing/method";
import { LandingNav } from "@/components/landing/nav";
import { LandingObservers } from "@/components/landing/landing-observers";
import { LandingProblem } from "@/components/landing/problem";
import { LandingTechStrip } from "@/components/landing/tech-strip";

/**
 * Sextant landing — porting Claude Design output (Sextant Landing.html).
 *
 * Composition:
 *   - LandingNav      fixed, scroll-aware (toggles `.scrolled` border)
 *   - LandingHero     copy + live ASCII sextant instrument (12 FPS)
 *   - LandingProblem  one-line strikethrough headline
 *   - LandingMethod   four-agent radial diagram + 4-cell explainer grid
 *   - LandingClosedLoop  three-step correction → rule → applied diagram
 *   - LandingTechStrip   Anthropic / Gemini / Tavily / Vercel marks
 *   - LandingFinalCta   secondary CTA + validation-grid sidecar
 *   - LandingFooter   minimal mark + meta line
 *   - LandingObservers   single client component owning IntersectionObserver
 *                        + nav scroll listener; enhances static markup.
 *
 * Reduced-motion: handled in landing.css; ASCII renders one static frame
 * (see ascii-stage.tsx). Per project CLAUDE.md the locked palette is
 * forest green / warm off-white — design tweaks-panel + tone presets dropped.
 */
export default function Landing() {
  return (
    <div className="landing-root">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingProblem />
        <LandingMethod />
        <LandingClosedLoop />
        <LandingTechStrip />
        <LandingFinalCta />
      </main>
      <LandingFooter />
      <LandingObservers />
    </div>
  );
}
