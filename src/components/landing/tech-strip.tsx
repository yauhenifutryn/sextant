export function LandingTechStrip() {
  return (
    <section className="l-tech">
      <div className="wrap">
        <div className="l-tech-label">Built on</div>
        <div className="l-tech-row">
          <span className="mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M14.4 4h3.2L24 20h-3.4l-1.3-3.4h-6.6L11.4 20H8L14.4 4Zm.5 9.6h4.4L17.1 7.5l-2.2 6.1ZM6.4 4 0 20h3.4l1.3-3.4H6.4V4Z" />
            </svg>
            Anthropic
          </span>
          <span className="mark">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2 L 14 10 L 22 12 L 14 14 L 12 22 L 10 14 L 2 12 L 10 10 Z" />
            </svg>
            Gemini
          </span>
          <span className="mark">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx={11} cy={11} r={6.5} />
              <path d="m20 20-4.2-4.2" />
            </svg>
            Tavily
          </span>
          <span className="mark">
            <svg width="18" height="14" viewBox="0 0 24 18" fill="currentColor" aria-hidden="true">
              <path d="M12 0 24 18H0Z" />
            </svg>
            Vercel
          </span>
        </div>
      </div>
    </section>
  );
}
