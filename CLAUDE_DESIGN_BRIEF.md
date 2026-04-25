# Claude Design brief — AI CRO Co-Pilot

**Paste the section between the markers below into Claude Design.** Above-marker content is for your reference; do not include it in the prompt.

---

## Reference notes (do not paste)

Working name: AI CRO Co-Pilot (also acceptable: "Lila", "Scopus")
Stack we will port to: Next.js 15 + TypeScript + Tailwind + shadcn/ui + Framer Motion
Inspiration boards: Future House, Lila Sciences, Linear, Anthropic.com, Notion AI but document-first not chat-first

When Claude Design produces the result, share the output back. I will adapt component-by-component into our Next.js codebase. Prefer outputs that:
- Use Tailwind utility classes (not custom CSS)
- Use shadcn/ui component primitives where applicable
- Avoid heavy gradients, glassmorphism, neon, or generic SaaS aesthetics

---

## === BEGIN PASTE INTO CLAUDE DESIGN ===

Design a polished, minimalistic, scientific-feeling web application called **AI CRO Co-Pilot**. It turns a scientific hypothesis into a fully grounded experiment plan. The aesthetic should feel like a precision lab instrument crossed with a long-form scientific document — calm, confident, citation-rich. Reference points: Future House, Lila Sciences, Linear, Anthropic.com. Avoid: Silicon Valley SaaS gradients, glassmorphism, neon, "AI startup" clichés.

### Design system tokens

Typography:
- Headings: Inter Tight (or Söhne if available), tight letter-spacing, weights 500/600
- Body: Inter, weight 400/500, comfortable line-height (1.55)
- Mono: Geist Mono (or JetBrains Mono) for catalog numbers, citations, IDs, prices, code

Color palette (warm, document-feel — not pure white):
- Background: `#FAFAF7` (warm off-white)
- Surface: `#F2F1EC` (raised cards, sidebars)
- Surface hover: `#EDECE6`
- Border: `#E2E0D8`
- Ink (primary text): `#1A1A1A`
- Muted text: `#5A5A52`
- Primary accent: `#0F4C3A` (deep forest green — lab coat, not Silicon Valley blue)
- Secondary accent: `#B85C38` (clay/rust — used sparingly for "novel finding" / corrections)
- Citation link: `#1F4FB6` (trustworthy blue, underlined)
- Test pass: `#15803D`
- Test fail / warning: `#B91C1C`
- Caution / pending: `#A16207`

Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px

Radius: 6px on cards, 4px on inputs and buttons, 999px on pills/badges

Shadow: one subtle layered shadow only — `0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)`. No glassmorphism. No neumorphism.

Density: information-rich but breathable. Citations and metadata stay visible, never hidden behind hover-only.

Iconography: Lucide icons, stroke 1.5px, never filled.

Motion: Framer-Motion-style — 200ms ease-out for state changes, 400ms spring for panel reveals. No bounce. Streaming text uses cursor-blink.

### Layout — desktop primary, 1440px target

Three-column layout, header row, no traditional nav rail:

1. **Header bar** (56px tall, full width)
   - Left: small wordmark "AI CRO Co-Pilot" in Inter Tight 500
   - Center: breadcrumb showing current hypothesis (truncated, monospace)
   - Right: lab profile avatar + corrections-counter pill ("12 lab rules") + settings cog

2. **Chat panel** (left, ~32% width, ~460px)
   - Chat history scroll
   - Message bubbles are NOT bubbles — they are flat blocks with a 2px left border in the speaker's color (user = ink, assistant = forest green)
   - Agent thinking shown inline as collapsible "Working..." rows with shimmer
   - Input at bottom: large textarea, no border except a 1px bottom rule, send button is just an arrow glyph
   - Above input: 4 chip-style example hypotheses (faint pills) you can click to populate

3. **Plan canvas** (center, ~50% width, ~720px)
   - Tabbed interface at top: Protocol / Materials / Budget / Timeline / Validation
   - Each tab is a long-form document with section headings, paragraphs, and inline citations
   - Citations are mono-font superscripted numbers in citation-blue, hover shows source URL + 1-line excerpt in a tooltip
   - The Materials tab is a structured table: Reagent | Catalog # | Supplier | Unit cost | Qty | Subtotal — every row clickable to source page
   - The Budget tab shows a clean horizontal bar chart of cost by category with running total
   - The Timeline tab shows a phase Gantt with dependencies (subtle, not Microsoft Project)
   - The Validation tab lists success criteria with measurement methods

4. **Trace + Tests rail** (right, ~18% width, ~260px)
   - Top half: live agent activity as a vertical timeline. Each agent has a colored dot:
     - Researcher (forest green)
     - Skeptic (clay/rust)
     - CRO Operator (ink black)
     - Compliance (muted blue)
   - Each agent's current task is one short line of text, animated with shimmer when active, checkmark when done
   - Bottom half: "Validation grid" — a list of 6-8 named tests with a status indicator (pending/running/pass/fail). Tests visibly tick green as plan stabilizes. Examples:
     - "Every reagent has a catalog URL"
     - "Budget sums correctly"
     - "No orphan protocol step"
     - "Compliance pipeline passes"
     - "Citations resolve to real sources"
     - "Timeline dependencies valid"

### Required key screens

1. **Empty state** — chat panel only on the left half, large centered heading on the right: "Frame a scientific question. Get a fundable plan in 3 minutes." with 4 example chips.

2. **Generating state** — plan canvas skeleton appears in center, agents stream in trace rail, tests start as pending and tick green over ~30 seconds.

3. **Plan ready state** — full plan canvas filled in, all tests green, hypothesis pinned at top of canvas with novelty verdict ("Similar work exists, novel angle here") and 2 cited papers below.

4. **Inline correction state** — user clicks any line in the protocol. A small popover appears with three actions: "Challenge", "Correct", "Annotate". Selecting "Correct" opens a focused editor with a "lab rule" capture field ("always include sham control here").

5. **Lab profile drawer** — slides in from right when the corrections-counter pill is clicked. Shows accumulated typed lab rules (e.g., "Always include sham control in mouse studies", "Prefer EU suppliers", "Never use compound X with cell line Y"). Each rule is editable and removable, with a count of times applied.

6. **Side-by-side propagation diff** (the demo moment) — a full-screen modal with two plans on left and right, with the corrected lines on the right highlighted in clay/rust and labeled "applied lab rule: sham control". Bottom of modal shows the correction that triggered the change.

### Component library to deliver

- Header bar
- Chat message block (user / assistant variants)
- Chat input with example chips
- Tabbed plan canvas with tab headers
- Inline citation chip (number, hover-tooltip)
- Materials table row
- Budget bar chart
- Timeline Gantt segment
- Validation criterion row
- Agent activity row (with colored dot, shimmer when active)
- Validation test row (name + status indicator)
- Correction popover (3-action)
- Lab rule card (in drawer)
- Side-by-side diff layout
- Empty state hero
- Toast / status notification

### Tone of all microcopy

Plain, precise, scientifically literate. No exclamations. No emojis. Examples:
- "Drafting protocol. 4 agents working in parallel."
- "Similar work exists. 2 papers cited below."
- "Lab rule captured: always include sham control in mouse studies."
- "Plan updated based on 1 lab rule."

### Accessibility

WCAG AA contrast minimum. All interactive elements keyboard reachable. Citation tooltips also accessible via focus.

Deliverable: the full component library and the 6 key screens above as a single cohesive design.

## === END PASTE INTO CLAUDE DESIGN ===

---

## After Claude Design returns

Drop the output (HTML / JSX / screenshots / Figma URL — whatever Claude Design produces) back in our chat. I will:
1. Audit it against this brief and the `web-interface-guidelines` skill
2. Cherry-pick what to port directly vs what to rebuild in shadcn/ui primitives
3. Build the Next.js component library matching the design tokens above
4. Plug it into our agent pipeline
