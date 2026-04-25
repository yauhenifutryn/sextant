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
 * Landing — Option A (lab notebook hero), parked at /v1.
 *
 * The default landing at / now ships the cinematic video hero. This route
 * keeps the lab-notebook variant accessible for A/B comparison and as a
 * fallback if the video CDN ever goes down or autoplay gets blocked on
 * a specific platform.
 */
export default function LandingV1() {
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
