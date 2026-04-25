import Link from "next/link";

import { SextantMark } from "./sextant-mark";

export function LandingNav() {
  return (
    <nav className="l-nav" id="sx-nav">
      <div className="l-nav-inner">
        <Link href="#top" className="l-nav-brand" aria-label="Sextant home">
          <SextantMark size={22} className="text-forest" />
          <span className="l-nav-brand-text">Sextant</span>
        </Link>
        <div className="l-nav-links">
          <a href="#problem">Problem</a>
          <a href="#method">Method</a>
          <a href="#loop">Lab rules</a>
          <Link href="/app" className="l-nav-cta">
            Open Sextant
          </Link>
        </div>
      </div>
    </nav>
  );
}
