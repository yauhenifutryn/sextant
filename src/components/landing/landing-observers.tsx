"use client";

import { useEffect } from "react";

const NAV_OFFSET_PX = 80;

/**
 * Single client component that owns:
 *   1. IntersectionObserver — adds `.visible` to any `.l-reveal` or
 *      `[data-anim]` element when it scrolls into view (one-shot).
 *   2. Scroll listener — adds `.scrolled` to `#sx-nav` when scrollY > 8px,
 *      so the fixed nav grows a 1px bottom border once you leave the hero.
 *   3. Smooth-scroll click handler for `<a href="#section">` links. JS-based
 *      because CSS `scroll-behavior: smooth` respects `prefers-reduced-motion`
 *      and gets disabled on most macOS users by default — the design intent
 *      here is to ALWAYS smooth-scroll on landing nav clicks. Also applies a
 *      proper offset so anchored sections don't tuck under the 60px fixed nav.
 *   4. Mouse parallax on the method radial — pointer over `.l-solve-stage`
 *      writes --pmx, --pmy (-1..+1) onto the stage so each agent node can
 *      drift slightly via CSS. RAF-throttled, no state, zeroed on leave.
 *   5. Scroll-progress on the closed-loop canvas — writes --loop-progress
 *      (0..1) onto `.l-loop-canvas` as the section traverses the viewport,
 *      so the connecting arrows can stroke-dash themselves into existence.
 *
 * Server components emit the markup; this enhances behavior. No state,
 * no React reconciliation per scroll tick.
 */
export function LandingObservers() {
  useEffect(() => {
    const nav = document.getElementById("sx-nav");
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const loopCanvas = document.querySelector<HTMLElement>(".l-loop-canvas");

    let rafId = 0;
    let pending = false;
    const updateScrollVars = () => {
      pending = false;
      if (nav) {
        if (window.scrollY > 8) nav.classList.add("scrolled");
        else nav.classList.remove("scrolled");
      }
      // Hero parallax progress — 0 at top of page, 1 once we've scrolled
      // a full viewport past it. Drives the cinematic hero fade-out.
      if (!reduced) {
        const progress = Math.max(0, Math.min(1, window.scrollY / window.innerHeight));
        root.style.setProperty("--hero-progress", progress.toFixed(3));
      }
      // Closed-loop arrows draw — progress is 0 when the canvas top is at
      // the viewport bottom, and 1 when it's at the viewport top. We slice
      // the section's traversal so the two arrows fill in sequentially as
      // the user reads through the three cards.
      if (loopCanvas && !reduced) {
        const rect = loopCanvas.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        // Map traversal start = top reaches 80% of viewport, end = bottom
        // crosses 30%. Tuned so progress maxes out before the section
        // scrolls fully off-screen.
        const start = vh * 0.8;
        const end = -rect.height + vh * 0.3;
        const raw = (start - rect.top) / Math.max(1, start - end);
        const progress = Math.max(0, Math.min(1, raw));
        loopCanvas.style.setProperty("--loop-progress", progress.toFixed(3));
      }
    };
    const onScroll = () => {
      if (pending) return;
      pending = true;
      rafId = requestAnimationFrame(updateScrollVars);
    };
    updateScrollVars();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Mouse parallax on method radial — pointer position normalized to
    // -1..+1 across the stage, written to CSS vars on the stage element.
    // CSS handles the per-node offset (each agent gets a different
    // multiplier, see .l-agent-node[data-i] rules).
    const stage = document.querySelector<HTMLElement>(".l-solve-stage");
    let stageRaf = 0;
    let stagePending = false;
    let pendingX = 0;
    let pendingY = 0;
    const flushStage = () => {
      stagePending = false;
      stage?.style.setProperty("--pmx", pendingX.toFixed(3));
      stage?.style.setProperty("--pmy", pendingY.toFixed(3));
    };
    const onStageMove = (e: MouseEvent) => {
      if (!stage || reduced) return;
      const r = stage.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      pendingX = Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width / 2)));
      pendingY = Math.max(-1, Math.min(1, (e.clientY - cy) / (r.height / 2)));
      if (stagePending) return;
      stagePending = true;
      stageRaf = requestAnimationFrame(flushStage);
    };
    const onStageLeave = () => {
      pendingX = 0;
      pendingY = 0;
      if (stagePending) return;
      stagePending = true;
      stageRaf = requestAnimationFrame(flushStage);
    };
    if (stage && !reduced) {
      stage.addEventListener("mousemove", onStageMove);
      stage.addEventListener("mouseleave", onStageLeave);
    }

    const targets = document.querySelectorAll<HTMLElement>(".l-reveal, [data-anim]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach((el) => io.observe(el));

    const onAnchorClick = (e: MouseEvent) => {
      // ignore modified clicks (cmd/ctrl/shift/alt + click should keep native
      // behavior so users can open in a new tab etc).
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const link = target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href === "#") return;
      const dest = document.querySelector<HTMLElement>(href);
      if (!dest) return;
      e.preventDefault();
      const top = dest.getBoundingClientRect().top + window.scrollY - NAV_OFFSET_PX;
      window.scrollTo({ top, behavior: "smooth" });
      // keep the URL hash in sync so refresh / share lands at the right spot
      history.pushState(null, "", href);
    };
    document.addEventListener("click", onAnchorClick);

    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(stageRaf);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onAnchorClick);
      if (stage) {
        stage.removeEventListener("mousemove", onStageMove);
        stage.removeEventListener("mouseleave", onStageLeave);
      }
      io.disconnect();
    };
  }, []);

  return null;
}
