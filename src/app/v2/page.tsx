import "@/components/landing/landing.css";
import "@/components/landing/cinematic-hero.css";

import { LandingClosedLoop } from "@/components/landing/closed-loop";
import { LandingFinalCta } from "@/components/landing/final-cta";
import { LandingFooter } from "@/components/landing/site-footer";
import { LandingMethod } from "@/components/landing/method";
import { LandingObservers } from "@/components/landing/landing-observers";
import { LandingProblem } from "@/components/landing/problem";
import { LandingTechStrip } from "@/components/landing/tech-strip";
import { SvgCartoonHero } from "@/components/landing/svg-cartoon-hero";

/**
 * /v2 — illustrated cartoon variant.
 *
 * Drops the real video. Replaces it with a hand-drawn SVG lab scene
 * (researcher silhouette at desk, page-flipping notebook, beaker on a
 * shelf, lamp with a flickering glow, floating idea bubbles) plus a
 * Lottie accent showing a research-lens scanning loop. Same below-fold
 * sections as /, so this is a pure hero-variant A/B against the
 * cinematic-video hero on /.
 *
 * Per user direction: /v2 is "lottie + svg-style cartoon of the video,
 * not the real video". The cinematic-video variant lives at /. The
 * live video-ASCII variant lives at /v1.
 */
export default function LandingV2() {
  return (
    <div className="landing-root">
      <main>
        <SvgCartoonHero />
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
