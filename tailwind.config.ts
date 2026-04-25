/**
 * tailwind.config.ts — brief design tokens mirror.
 *
 * Tailwind v4 is the active engine; primary token wiring lives in
 * `src/app/globals.css` under `@theme inline {}`. This file is loaded
 * via the `@config` directive in globals.css for back-compat with
 * tooling that expects v3-style config (shadcn/ui CLI, IDE plugins).
 *
 * Source of truth for HSL hex equivalents: CLAUDE_DESIGN_BRIEF.md
 * §"Design system tokens". Decisions: D-05..D-12.
 */
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
    "./app/**/*.{ts,tsx,js,jsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // shadcn semantic defaults
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // friendly aliases (D-07)
        paper: "hsl(var(--background))",
        ink: "hsl(var(--foreground))",
        forest: "hsl(var(--primary))",
        clay: "hsl(var(--secondary))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          hover: "hsl(var(--surface-hover))",
        },
        borderwarm: "hsl(var(--border))",
        citation: "hsl(var(--citation))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "var(--font-inter-tight)",
          "var(--font-inter)",
          "sans-serif",
        ],
        mono: [
          "var(--font-geist-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 2px)",
        full: "9999px",
      },
      boxShadow: {
        doc: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
