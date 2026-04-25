import { SextantMark } from "./sextant-mark";

export function LandingFooter() {
  return (
    <footer className="l-foot">
      <div className="wrap l-foot-row">
        <div className="l-foot-brand">
          <SextantMark size={20} className="text-forest" />
          <span>Sextant</span>
        </div>
        <div className="l-foot-meta">An instrument for experiment design.</div>
      </div>
    </footer>
  );
}
