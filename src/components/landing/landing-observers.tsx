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
 *
 * Server components emit the markup; this enhances behavior. No state,
 * no React reconciliation per scroll tick.
 */
export function LandingObservers() {
  useEffect(() => {
    const nav = document.getElementById("sx-nav");
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    };
    const onScroll = () => {
      if (pending) return;
      pending = true;
      rafId = requestAnimationFrame(updateScrollVars);
    };
    updateScrollVars();
    window.addEventListener("scroll", onScroll, { passive: true });

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
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onAnchorClick);
      io.disconnect();
    };
  }, []);

  return null;
}
