import "@/components/landing/landing.css";
import "@/components/landing/cinematic-hero.css";

import { CinematicHero } from "@/components/landing/cinematic-hero";
import { LandingClosedLoop } from "@/components/landing/closed-loop";
import { LandingFinalCta } from "@/components/landing/final-cta";
import { LandingFooter } from "@/components/landing/site-footer";
import { LandingMethod } from "@/components/landing/method";
import { LandingObservers } from "@/components/landing/landing-observers";
import { LandingProblem } from "@/components/landing/problem";
import { LandingTechStrip } from "@/components/landing/tech-strip";

/**
 * Landing — Option B (cinematic video hero).
 *
 * Same below-fold sections as `/`, but the hero is replaced with a
 * Velorah-style fullscreen looping video + glassmorphic nav. Use this
 * route to A/B against the default landing hero (lab notebook on right).
 *
 * The cinematic hero owns its own nav (dark/glassmorphic), so we drop the
 * default <LandingNav /> for this route.
 *
 * To pick the winning hero, copy whichever component into `src/app/page.tsx`.
 * The other one stays parked here as a switchable variant.
 */
export default function LandingV2() {
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
    </div>
  );
}
