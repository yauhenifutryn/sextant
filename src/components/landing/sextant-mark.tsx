type Props = {
  size?: number;
  className?: string;
  ariaLabel?: string;
};

/**
 * Minimal sextant mark — 4 strokes total.
 *
 *   ●          pivot
 *  ╱ ╲         frame arms
 * ─────        limb arc
 *
 * The earlier 8-stroke version (telescope + horizon mirror + tick marks +
 * eyepiece bracket) was too dense at 20px and read as visual noise. Stripped
 * back to the minimum that still says "angle-measuring instrument": one
 * arc, two frame arms from apex to limb, one filled pivot dot. Stroke uses
 * `currentColor` so callers can recolor via text-* utilities.
 */
export function SextantMark({ size = 22, className, ariaLabel = "Sextant" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label={ariaLabel}
      role="img"
      className={className}
    >
      <path d="M3 18 A 9 9 0 0 1 21 18" />
      <path d="M12 5 L 4 17" />
      <path d="M12 5 L 20 17" />
      <circle cx={12} cy={5} r={1.4} fill="currentColor" stroke="none" />
    </svg>
  );
}
