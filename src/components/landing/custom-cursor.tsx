"use client";

import { useEffect, useRef } from "react";

/**
 * Custom cursor — a small dot that follows the pointer plus a larger ring
 * that lags slightly behind. The ring grows when the cursor is over an
 * interactive element (a, button, [role=button]).
 *
 *   - Hidden on touch / no-hover devices (the cursor is fake; mobile
 *     users don't see it anyway, but skipping the listeners saves CPU).
 *   - Hidden when prefers-reduced-motion is set (the constant micro-motion
 *     of a custom cursor is the kind of thing reduced-motion users disable).
 *   - Native cursor stays visible; this is a layered enhancement, not a
 *     replacement. We don't `cursor: none` the body so users with
 *     accessibility tools (cursor magnifiers, system-level tracking) keep
 *     working.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;
    let stopped = false;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
    };

    const loop = () => {
      if (stopped) return;
      // ease the ring toward the cursor for a soft-trail feel
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(var(--ring-scale, 1))`;
      raf = requestAnimationFrame(loop);
    };

    const onOver = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const interactive = t.closest("a, button, input, textarea, [role='button']");
      ring.style.setProperty("--ring-scale", interactive ? "1.7" : "1");
    };

    const onShow = () => {
      dot.style.opacity = "1";
      ring.style.opacity = "1";
    };
    const onHide = () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerenter", onShow);
    document.addEventListener("pointerleave", onHide);
    raf = requestAnimationFrame(loop);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerenter", onShow);
      document.removeEventListener("pointerleave", onHide);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="l-cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="l-cursor-dot" aria-hidden="true" />
    </>
  );
}
