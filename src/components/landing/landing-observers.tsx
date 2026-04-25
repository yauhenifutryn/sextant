"use client";

import { useEffect } from "react";

/**
 * Single client component that owns:
 *   1. IntersectionObserver — adds `.visible` to any `.l-reveal` or
 *      `[data-anim]` element when it scrolls into view (one-shot).
 *   2. Scroll listener — adds `.scrolled` to `#sx-nav` when scrollY > 8px,
 *      so the fixed nav grows a 1px bottom border once you leave the hero.
 *
 * Server components emit the markup; this enhances behavior. No state,
 * no React reconciliation per scroll tick.
 */
export function LandingObservers() {
  useEffect(() => {
    const nav = document.getElementById("sx-nav");
    const onScroll = () => {
      if (!nav) return;
      if (window.scrollY > 8) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    };
    onScroll();
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

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  return null;
}
