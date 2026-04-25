"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Maximum offset in px the element can drift toward the cursor. */
  strength?: number;
  /** Pixel radius from the element center within which the magnet engages. */
  radius?: number;
  className?: string;
};

/**
 * Magnetic — wraps an interactive element so it subtly tilts toward the
 * cursor when the cursor is near. Useful for primary CTAs.
 *
 * Implementation: tracks pointer position globally, computes offset from
 * the wrapped element's center, applies a translate3d via CSS variable.
 * Stops responding when the cursor leaves the radius (smoothly returns to
 * 0,0 via CSS transition). Honors prefers-reduced-motion (no-op).
 */
export function Magnetic({ children, strength = 8, radius = 120, className }: Props) {
  const wrapRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return; // skip on touch

    const onMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) {
        wrap.style.setProperty("--mx", "0px");
        wrap.style.setProperty("--my", "0px");
        return;
      }
      const factor = (1 - dist / radius) * strength;
      wrap.style.setProperty("--mx", `${(dx / radius) * factor}px`);
      wrap.style.setProperty("--my", `${(dy / radius) * factor}px`);
    };
    const onLeave = () => {
      wrap.style.setProperty("--mx", "0px");
      wrap.style.setProperty("--my", "0px");
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [radius, strength]);

  return (
    <span ref={wrapRef} className={`l-magnetic ${className ?? ""}`}>
      {children}
    </span>
  );
}
