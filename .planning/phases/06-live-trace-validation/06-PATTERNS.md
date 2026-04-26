# Phase 6: Live Trace Rail + Validation Grid — Pattern Map

**Mapped:** 2026-04-26
**Files analyzed:** 4 (1 MODIFY + 3 NEW)
**Analogs found:** 4 / 4 (every Phase 6 file has a closely related Phase 1/2 sibling)

---

## File Classification

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/trace-rail.tsx` (MODIFY) | client component (live render) | streaming-event-driven (consumes `AgentEvent[]` + `Plan["plan"]["validation"]`) | self (current placeholder) + `src/components/qc/verdict-card.tsx` | role-match (`<aside>` shell preserved; props + child composition new) |
| `src/components/trace/agent-row.tsx` (NEW) | client component leaf | discriminated-union narrowing (per-event status conditional render) | `src/components/qc/citation-card.tsx` (compact card w/ Lucide icon + tinted badge) | exact (single-row card with status-tinted accent + meta line) |
| `src/components/trace/validation-grid.tsx` (NEW) | client component (list-of-rows) | streaming-event-driven (status derives from `Plan["plan"]["validation"]` + Plan-level conditions) | `src/components/qc/chat-thread.tsx` (list-of-rows render w/ status switch) + current `trace-rail.tsx` `VALIDATION_SKELETON` block | role-match (preserve 6 strings verbatim; add ≥0 dynamic rows from Skeptic) |
| `src/components/trace/trace.css` (NEW, OPTIONAL) | stylesheet | n/a | `src/components/sextant-loader.tsx` lines 54-122 (inline `<style>` w/ `@keyframes`) | role-match (likely defer to Tailwind v4 `animate-pulse` + arbitrary keyframes; only create the file if the shimmer truly needs custom CSS) |

**Notes on classification:**
- The `<TraceRail>` shell at `src/components/trace-rail.tsx` lines 25-53 already establishes the `<aside className="border-l border-borderwarm bg-paper flex flex-col gap-6 p-6">` outer container + the `text-[10.5px] font-mono uppercase tracking-[0.08em] text-muted-foreground` section-header type style. **Preserve both.** The MODIFY swaps the body of the two `<div>` blocks: the first becomes `<AgentRow />` × 5; the second becomes `<ValidationGrid />`.
- `src/components/sextant-loader.tsx` is the established inline-`<style>` + CSS-keyframe pattern in this codebase. Reuse the `sx-loader-flow` keyframe directly inside an inner `<AgentRow>` for the "working" state, OR copy the keyframe into a new local `<style>` block in `trace-rail.tsx`. Avoid creating `trace.css` unless Tailwind v4's `animate-pulse` is genuinely insufficient.
- `src/components/qc/chat-thread.tsx` lines 71-178 is the closest list-of-rows analog: `messages.map((m) => { ... if (m.variant === "verdict") return <div ...> ... })`. Validation-grid maps the same way over `[...VALIDATION_SKELETON, ...skepticChecks]`.

---

## Pattern Assignments

### `src/components/trace-rail.tsx` (MODIFY)

**Role / data flow:** Right-column `<aside>` shell; consumes 3 props from `usePlan()` and renders 5 `<AgentRow>` items + a `<ValidationGrid>`. Currently a 53-line placeholder with no props.

**Closest analog:** itself (lines 25-53 — keep the `<aside>` outer + the two-section `Activity` / `Validation grid` layout) + `src/components/qc/verdict-card.tsx` for the `"use client"` + props-destructuring + `aria-live` discipline.

**Code excerpt to copy from current file** (`src/components/trace-rail.tsx:25-53` — outer shell + section-header type):

```tsx
const VALIDATION_SKELETON = [
  "Every reagent has a catalog URL",
  "Budget sums correctly",
  "No orphan protocol step",
  "Citations resolve to real sources",
  "Timeline dependencies valid",
  "Compliance pipeline passes",
];

export function TraceRail() {
  return (
    <aside
      className="border-l border-borderwarm bg-paper flex flex-col gap-6 p-6"
      aria-label="Agent activity"
    >
      <div>
        <div className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-muted-foreground mb-3">
          Activity
        </div>
        <SextantLoader status="awaiting hypothesis…" size="sm" />
      </div>

      <div>
        <div className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-muted-foreground mb-3">
          Validation grid
        </div>
        <ul className="grid gap-2 font-mono text-[11.5px]">
          {VALIDATION_SKELETON.map((line) => (
            <li key={line} className="flex items-center gap-2 text-muted-foreground/70">
              <span className="inline-flex w-3 h-3 rounded-full border border-borderwarm" aria-hidden="true" />
              <span className="truncate">{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
```

**What to copy:**
- Outer `<aside className="border-l border-borderwarm bg-paper flex flex-col gap-6 p-6" aria-label="Agent activity">` verbatim.
- Two-section structure: first `<div>` for "Activity" (agent rows), second `<div>` for "Validation grid".
- Section-header className verbatim: `text-[10.5px] font-mono uppercase tracking-[0.08em] text-muted-foreground mb-3`.
- The `VALIDATION_SKELETON` 6-string array — **strings are exact match per 06-CONTEXT.md and Phase 3 D-67 footnote**; Skeptic emits these 6 names verbatim, so the validation-grid component matches against them.
- The faint-pending visual: `border border-borderwarm` on a `w-3 h-3 rounded-full` dot, with `text-muted-foreground/70` row text. Carry this into the new `pending` row state in `<ValidationGrid>`.

**What to deviate from:**
- Add `"use client";` at line 1 (current file has no directive — Next.js infers from no `"use client"` that it's a server component shell, but consuming props from a hook makes it a client component).
- Replace `export function TraceRail()` with the typed-props signature:
  ```tsx
  import type { AgentEvent } from "@/lib/plan/trace";
  import type { Plan } from "@/lib/plan/schema";

  type Props = {
    agentEvents: AgentEvent[];
    validationChecks?: Plan["plan"]["validation"];
    isLoading: boolean;
  };

  export function TraceRail({ agentEvents, validationChecks, isLoading }: Props) { ... }
  ```
- Replace the `<SextantLoader status="awaiting hypothesis…" />` body with 5 `<AgentRow>` items (one per `agent_id`: researcher, skeptic, operator, compliance, consolidator). Iterate the AgentId enum, derive each row's status from the latest `AgentEvent` for that `agent_id` (last-write-wins reduction over `agentEvents` filtered by `agent_id`).
- **Idle fallback:** if `agentEvents.length === 0` AND `isLoading === false`, render the original `<SextantLoader status="awaiting hypothesis…" size="sm" />` as the empty-state placeholder. Once `isLoading === true` OR events arrive, swap to the 5 `<AgentRow>` items. This preserves the "demo before chip click" landing state.
- Replace `VALIDATION_SKELETON.map(...)` with `<ValidationGrid baseline={VALIDATION_SKELETON} skepticChecks={validationChecks} plan={...} />`. Pass the full Plan into ValidationGrid so it can compute the 6 baseline check statuses; ValidationGrid owns the derivation.
- **Strict scope reminder:** do NOT modify the parent that renders `<TraceRail />` (e.g., `src/app/app/page.tsx`). Per 06-CONTEXT.md "Forbidden — main chat owns these", the dashboard wire-in is the main chat's job; you only change the props signature of this component, and the main chat passes the props down.

**Coordination concern:** the `Plan` type's `plan.validation[]` shape is owned by Phase 3 (`src/lib/plan/schema.ts`). Per 06-CONTEXT.md handover line 132-134, if Phase 3 hasn't shipped the file by execution time, stub these types locally:

```tsx
// fallback stub — replace with import once Phase 3 lands src/lib/plan/{trace,schema}.ts
type AgentId = "researcher" | "skeptic" | "operator" | "compliance" | "consolidator";
type AgentEvent =
  | { stage: "started"; run_id: string; agent_id: AgentId; task: string; ts: string }
  | { stage: "working"; run_id: string; agent_id: AgentId; activity: string; ts: string }
  | { stage: "done"; run_id: string; agent_id: AgentId; elapsed_ms: number; token_count?: number; output_preview?: string; ts: string }
  | { stage: "error"; run_id: string; agent_id: AgentId; error_message: string; retryable: boolean; ts: string };
```

Place the stub at the top of `trace-rail.tsx` behind a clear comment so it's grep-able during the post-Phase-3-merge cleanup. **Do NOT create files under `src/lib/plan/**`** — that path is forbidden per 06-CONTEXT.md "Forbidden zone".

---

### `src/components/trace/agent-row.tsx` (NEW)

**Role / data flow:** Single-agent row component. Props: `{ agentId: AgentId; label: string; status: "idle" | "working" | "done" | "error"; currentTask?: string; elapsedMs?: number; errorMessage?: string }`. Renders one row inside `<TraceRail>`'s "Activity" section. Pure presentational — no hooks, no fetch.

**Closest analog:** `src/components/qc/citation-card.tsx` (compact 1-row card with Lucide icon top-right + tinted badge + truncated title + meta line in muted-foreground).

**Code excerpt to copy** (`src/components/qc/citation-card.tsx:36-72`):

```tsx
const SOURCE_TINT: Record<Source, string> = {
  "arxiv": "bg-forest/10 text-forest",
  "semantic-scholar": "bg-ink/10 text-ink",
  "protocols-io": "bg-clay/10 text-clay",
  "other": "bg-muted/10 text-muted-foreground",
};

export function CitationCard({ title, url, excerpt, source }: Props) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-md border border-borderwarm bg-paper p-3 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
      aria-label={`Open citation: ${title}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "rounded-full font-mono text-[11px] px-2 py-0.5",
                SOURCE_TINT[source],
              )}
            >
              {SOURCE_LABEL[source]}
            </span>
          </div>
          <div className="font-display text-sm font-medium text-ink truncate">
            {title}
          </div>
          <div className="font-sans text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {excerpt}
          </div>
        </div>
        <ExternalLink
          size={14}
          strokeWidth={1.5}
          className="text-muted-foreground group-hover:text-ink shrink-0 mt-0.5"
          aria-hidden
        />
      </div>
    </a>
  );
}
```

**Secondary excerpt — verdict tint per state** (`src/components/qc/chat-thread.tsx:40-47` — color-table-by-discriminator pattern):

```tsx
const VERDICT_BADGE_TINT: Record<
  "not-found" | "similar-work-exists" | "exact-match-found",
  string
> = {
  "not-found": "bg-forest/10 text-forest",
  "similar-work-exists": "bg-ink/10 text-ink",
  "exact-match-found": "bg-clay/10 text-clay",
};
```

**What to copy:**
- The `Record<DiscriminatorLiteral, ClassNameString>` lookup-table pattern. For agent-row, build:
  ```tsx
  const STATUS_PILL_TINT: Record<"idle" | "working" | "done" | "error", string> = {
    "idle": "bg-muted/10 text-muted-foreground",
    "working": "bg-ink/10 text-ink",          // active accent — neutral while shimmering
    "done": "bg-forest/10 text-forest",       // success accent
    "error": "bg-clay/10 text-clay",          // stop-and-look accent
  };
  ```
- Outer container shape: `block rounded-md border border-borderwarm bg-paper p-3` (replace `<a>` with `<div>` since the row is not clickable).
- Two-column layout: `flex items-start gap-3` with `flex-1 min-w-0` left column for label + task, and a fixed-width right slot for the icon (Lucide `Check` for `done`, `AlertTriangle` for `error`).
- `font-display text-sm font-medium text-ink truncate` for the agent name (mirrors citation-card's title style).
- `font-sans text-xs text-muted-foreground line-clamp-1 mt-0.5` for the 1-line current-task string (mirrors citation-card's excerpt).
- The status pill: `cn("rounded-full font-mono text-[11px] px-2 py-0.5", STATUS_PILL_TINT[status])`.
- `cn(...)` import from `@/lib/utils` (verdict-card.tsx:4 establishes this import path).
- `aria-label` on the row root for accessibility (e.g., `aria-label={`${label} agent: ${status}`}`).

**What to deviate from:**
- **No `<a>` anchor** — agent rows are not clickable. Use `<div>` (or `<li>` if rendered inside the `<ul>` agent list).
- **Status discriminator, not source.** Lookup table keys are `"idle" | "working" | "done" | "error"`, not the citation `Source` union. The 4 statuses derive from `AgentEvent.stage` plus an `idle` synthesis (no event yet for that agent_id).
- **Lucide icons differ.** Replace `ExternalLink` with conditional render based on status:
  ```tsx
  import { Check, AlertTriangle, Loader2 } from "lucide-react";

  const StatusIcon = status === "done" ? Check
    : status === "error" ? AlertTriangle
    : status === "working" ? Loader2  // optional spinning fallback if shimmer unavailable
    : null;
  ```
  Use `size={14} strokeWidth={1.5}` to match citation-card. For `done` use `text-forest`, for `error` use `text-clay`.
- **Working-state shimmer.** Apply a `data-status="working"` attribute and animate via either:
  1. Tailwind `animate-pulse` on the row background (cheap, consistent with `verdict-card.tsx:57` skeleton state).
  2. The `sx-loader-flow` keyframe pattern from `src/components/sextant-loader.tsx:109-113` if a fancier moving shimmer is needed. **Prefer option 1** to avoid creating `trace.css`.
- **Elapsed time meta.** When `status === "done"`, render `<span className="font-mono text-[10px] text-muted-foreground tabular-nums">{elapsedMs}ms</span>` after the task line. Mirrors the `font-mono text-[10px]` rhythm seen in `chat-thread.tsx:81` (`"font-mono text-[10px] uppercase tracking-wider text-muted-foreground"`) but drops the uppercase + tracking since this is numeric data, not a label.
- **Error tooltip.** The 06-CONTEXT.md spec asks for an error_message tooltip on hover. Use a `title={errorMessage}` attribute on the row for v1 (native browser tooltip — zero deps, consistent with hackathon scope). If the user requests fancier later, swap to `@/components/ui/tooltip` from shadcn — but the hard cuts in 06-CONTEXT.md ("NO new dependencies") mean stick with native.
- **Idle visual.** Per 06-CONTEXT.md: muted dot + faint text. Apply `text-muted-foreground/70` to the row content and use `bg-muted/10` for the status pill (no animation). This matches the validation-grid baseline pending styling already established at `src/components/trace-rail.tsx:44-48`.

---

### `src/components/trace/validation-grid.tsx` (NEW)

**Role / data flow:** List-of-rows component. Props: `{ baseline: readonly string[]; skepticChecks?: Plan["plan"]["validation"]; plan?: Plan | null }`. Renders the 6 baseline strings PLUS any hypothesis-specific checks Skeptic produced, each with a status pill. Computes baseline statuses from Plan-level conditions (per the 6 deterministic rules in 06-CONTEXT.md lines 64-71).

**Closest analog:** `src/components/qc/chat-thread.tsx:71-178` (list-of-rows mapper with discriminated rendering) + the existing `<ul className="grid gap-2 font-mono text-[11.5px]">` block at `src/components/trace-rail.tsx:42-48` (list shape + token vocabulary).

**Code excerpt to copy from current trace-rail** (`src/components/trace-rail.tsx:42-48`):

```tsx
<ul className="grid gap-2 font-mono text-[11.5px]">
  {VALIDATION_SKELETON.map((line) => (
    <li key={line} className="flex items-center gap-2 text-muted-foreground/70">
      <span className="inline-flex w-3 h-3 rounded-full border border-borderwarm" aria-hidden="true" />
      <span className="truncate">{line}</span>
    </li>
  ))}
</ul>
```

**Secondary excerpt — list-of-rows-with-discriminator pattern** (`src/components/qc/chat-thread.tsx:74-118`):

```tsx
<div className="flex flex-col gap-3 p-4" aria-label="Conversation">
  {messages.map((m) => {
    if (m.role === "user") {
      return (
        <div
          key={m.id}
          className="rounded-md bg-surface border border-borderwarm p-3"
        >
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            You
          </div>
          ...
        </div>
      );
    }
    if (m.variant === "verdict") {
      const firstSentence = m.reasoning.split(/(?<=[.!?])\s+/)[0] ?? m.reasoning;
      return (
        <div
          key={m.id}
          className="rounded-md bg-paper border border-borderwarm p-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "rounded-full font-mono text-[10px] uppercase tracking-wider px-2 py-0.5",
                VERDICT_BADGE_TINT[m.verdict],
              )}
            >
              {VERDICT_BADGE_LABEL[m.verdict]}
            </span>
          </div>
          ...
        </div>
      );
    }
    ...
  })}
</div>
```

**What to copy:**
- The outer `<ul className="grid gap-2 font-mono text-[11.5px]">` shape verbatim — the type rhythm (12px-ish mono, 8px row gap) is the established right-column type style.
- Per-row pattern: `<li key={...} className="flex items-center gap-2 ...">` with a leading `<span className="inline-flex w-3 h-3 rounded-full ...">` dot + a `<span className="truncate">` label. Carry `aria-hidden="true"` on the dot.
- The pending visual: `border border-borderwarm` on the dot + `text-muted-foreground/70` on the row (this IS the current placeholder — keep it for the `pending` state).
- Status-tint table pattern from chat-thread:
  ```tsx
  const STATUS_DOT_CLASS: Record<"pending" | "running" | "pass" | "fail", string> = {
    "pending": "border border-borderwarm",                      // hollow ring
    "running": "border-2 border-ink animate-pulse",             // shimmer ring
    "pass":    "bg-forest border border-forest",                 // filled forest
    "fail":    "bg-clay border border-clay",                     // filled clay
  };
  const STATUS_TEXT_CLASS: Record<"pending" | "running" | "pass" | "fail", string> = {
    "pending": "text-muted-foreground/70",
    "running": "text-ink",
    "pass":    "text-forest",
    "fail":    "text-clay",
  };
  ```
- Lucide icons inline in the row for terminal states. Per 06-CONTEXT.md: pass uses `Check` (forest), fail uses `X` (clay). Render icon to the right of the label, `size={12} strokeWidth={1.75}` to fit the 12px mono row height.

**What to deviate from:**
- The current placeholder hard-codes `VALIDATION_SKELETON` inside the component. The new component receives it as a `baseline` prop OR as a module-level export from a shared location. **Recommended:** export the constant from `validation-grid.tsx` itself and re-import in the parent if needed; do NOT create a new shared file under `src/lib/`.
- **Source of truth for the 6 strings:** copy the `VALIDATION_SKELETON` array from `src/components/trace-rail.tsx:16-23` verbatim. Per 06-CONTEXT.md and Phase 3 03-CONTEXT.md "Claude's Discretion" footnote, Skeptic is required to emit these 6 names verbatim in `plan.validation[]`. So the merging logic is:
  ```tsx
  // Render baseline 6 (always present), then any extra Skeptic checks not in the baseline list.
  const baselineNames = new Set(baseline);
  const extras = (skepticChecks ?? []).filter((c) => !baselineNames.has(c.name));
  const rows = [
    ...baseline.map((name) => ({ name, kind: "baseline" as const })),
    ...extras.map((c) => ({ name: c.name, kind: "skeptic" as const, check: c })),
  ];
  ```
- **Status derivation for the 6 baseline checks** (from 06-CONTEXT.md lines 64-71). Implement as a pure function:
  ```tsx
  function deriveBaselineStatus(name: string, plan: Plan | null | undefined, isLoading: boolean): "pending" | "running" | "pass" | "fail" {
    if (!plan) return isLoading ? "running" : "pending";
    switch (name) {
      case "Every reagent has a catalog URL":
        if (plan.materials.every((m) => m.citations.length > 0)) return "pass";
        return plan.grounded ? "fail" : "pending";
      case "Budget sums correctly": {
        const sum = plan.budget.reduce((s, b) => s + (b.amount_usd ?? 0), 0);
        // 06-CONTEXT.md says "sum(plan.budget.line_total) === plan.budget_total OR whatever Phase 3's schema names this"
        // Phase 3 D-58 names line totals as `amount_usd` and there is no top-level `budget_total` field.
        // Falls back to: pass if every budget line has a non-negative amount_usd. Coordination concern logged below.
        return sum >= 0 && plan.budget.length > 0 ? "pass" : "pending";
      }
      case "No orphan protocol step":
        // pass if every protocol[].step_number is referenced by at least one validation check
        // OR has at least one citation slot. Conservative read of 06-CONTEXT.md line 67.
        return plan.plan.protocol.every(
          (s) => s.citations.length > 0 || plan.plan.validation.some((v) => v.description.includes(String(s.step_number))),
        ) ? "pass" : "fail";
      case "Citations resolve to real sources":
        return plan.grounded ? "pass" : "pending";
      case "Timeline dependencies valid": {
        const phaseNames = new Set(plan.plan.timeline.map((t) => t.phase));
        return plan.plan.timeline.every((t) => t.depends_on.every((d) => phaseNames.has(d))) ? "pass" : "fail";
      }
      case "Compliance pipeline passes":
        return plan.compliance_summary.length > 0 && plan.agent_artifacts.compliance && !plan.agent_artifacts.compliance.error ? "pass" : "pending";
      default:
        return "pending";
    }
  }
  ```
- **For Skeptic-emitted extra checks:** Phase 3 schema for `validationCheckSchema` has only `{ name, description, measurement_method, pass_criteria }` (no live status field). Until Phase 7 wires per-check live results, display Skeptic-emitted extras as `pending` with a `title={check.pass_criteria}` tooltip. Coordination concern logged below.
- **Section-header copy.** Currently the placeholder reads "Validation grid". Keep that string; it's already in the current file at line 40 and 06-CONTEXT.md does not redefine it.

**Coordination concerns (append to 06-CONTEXT.md "Coordination Concerns" section after Phase 3 ships its schema):**
- The 06-CONTEXT.md baseline check #2 ("Budget sums correctly") expects fields `plan.budget.line_total` and `plan.budget_total`. Phase 3 D-58 names line totals as `amount_usd` and does NOT define a top-level `budget_total`. The PATTERNS.md derivation falls back to "every line has a non-negative amount_usd"; if main chat exposes a `budget_total` later, tighten the check to `Math.abs(sum - plan.budget_total) < 0.01`.
- Phase 3 D-58 has `validationCheckSchema` without a runtime status field. Skeptic-emitted extras render as `pending`. If Phase 7 needs per-check pass/fail rendering, the schema needs an additive `status?: "pending" | "running" | "pass" | "fail"` field — main chat call.

---

### `src/components/trace/trace.css` (NEW, OPTIONAL)

**Role / data flow:** Static stylesheet for shimmer keyframes that Tailwind utilities can't express compactly. **Likely not needed.**

**Closest analog:** `src/components/sextant-loader.tsx:54-122` (inline `<style>` block with `@keyframes sx-loader-flow`).

**Code excerpt to copy** (`src/components/sextant-loader.tsx:85-113`):

```tsx
.sx-loader__bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 30%;
  border-radius: 999px;
  background: var(--bar-color);
  opacity: 0.85;
  animation: sx-loader-flow 1.6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
  animation-delay: var(--bar-delay);
  box-shadow: 0 0 10px var(--bar-color);
}
@keyframes sx-loader-flow {
  0%   { left: -30%; width: 30%; opacity: 0.4; }
  50%  { width: 45%; opacity: 1; }
  100% { left: 100%; width: 30%; opacity: 0.4; }
}
@media (prefers-reduced-motion: reduce) {
  .sx-loader__bar-fill {
    animation: none;
    left: 0;
    width: 35%;
    opacity: 0.7;
  }
}
```

**What to copy if this file is created:**
- The `@keyframes` declaration verbatim (renamed to e.g. `trace-row-shimmer`).
- The `prefers-reduced-motion: reduce` override block — non-negotiable accessibility detail this codebase already honors.
- `animation-delay: var(--bar-delay)` pattern, so each agent row can offset its shimmer by ~0.18s × index, producing the same parallax read as the existing landing-page sextant loader (visual continuity per `trace-rail.tsx:11-14` comment: "MUST stay aligned with landing-page demo blocks").

**What to deviate from / why this file is optional:**
- `src/components/sextant-loader.tsx` already inlines its CSS via `<style>{...}</style>` inside the JSX. This codebase has **no existing standalone `.css` files for components** (verified via the directory listing — only `globals.css` at the app level + per-component inline `<style>` blocks). Creating `trace.css` introduces a new convention.
- **Default decision:** do NOT create `trace.css`. Instead:
  1. For the working-state pulse, use Tailwind `animate-pulse` on the row background (already used by `verdict-card.tsx:57` skeleton).
  2. If the visual is too subtle, copy the `sx-loader-flow` keyframe verbatim into an inline `<style>` block at the top of `<AgentRow>`. This matches the `sextant-loader.tsx` pattern and keeps the Phase 6 component tree self-contained.
- **Only create `trace.css`** if the planner / executor finds Tailwind v4's `@keyframes` support (via `@theme` directives in `globals.css`) is more legible for this animation than an inline `<style>` block. If created, place it next to the components at `src/components/trace/trace.css` and import via `import "./trace.css"` from `agent-row.tsx`.

---

## Shared Patterns

### 1. `"use client"` directive on every leaf

**Source:** `src/components/qc/verdict-card.tsx:1`, `src/components/qc/citation-card.tsx:1`, `src/components/qc/chat-thread.tsx:1`, `src/components/sextant-loader.tsx:1`.

**Apply to:** ALL three new files (`agent-row.tsx`, `validation-grid.tsx`, the modified `trace-rail.tsx`). The trace rail consumes props from a client hook (`usePlan()`), so it must be a client component.

```tsx
"use client";
```

### 2. Token vocabulary (CLAUDE.md hard rule #7 — no token deviation)

**Source:** `CLAUDE_DESIGN_BRIEF.md` + recurring usage across the QC components.

**Apply to:** every Phase 6 file. Token cheat-sheet from confirmed in-codebase usage:

| Token | Confirmed usage |
|---|---|
| `bg-paper` | `verdict-card.tsx:57, 85, 124`, `citation-card.tsx:42`, `chat-thread.tsx:96`, `trace-rail.tsx:28` |
| `border-borderwarm` | `verdict-card.tsx:57, 124`, `citation-card.tsx:42`, `chat-thread.tsx:79, 96, 124, 140`, `trace-rail.tsx:28, 45` |
| `border-forest` | `verdict-card.tsx:33` (verdict tinting) — for `pass`/`done` accents |
| `border-clay` | `verdict-card.tsx:35`, `chat-thread.tsx:155` — for `fail`/`error` accents |
| `text-ink` | `verdict-card.tsx:93`, `citation-card.tsx:57`, `chat-thread.tsx:84` — primary body text |
| `text-forest` | `chat-thread.tsx:114, 167` — success accent (the "See sources" link, retry button) |
| `text-clay` | `chat-thread.tsx:157` — error accent |
| `text-muted-foreground` | everywhere — secondary / meta text |
| `text-muted-foreground/70` | `trace-rail.tsx:44` — pending / faint state |
| `font-display` | `verdict-card.tsx:62, 93, 130`, `citation-card.tsx:57` — large headings + names |
| `font-mono` | `verdict-card.tsx:59, 90, 127`, `citation-card.tsx:50`, `chat-thread.tsx:81, 102, 127`, `trace-rail.tsx:32, 39, 42` — meta labels + status pills + numeric |
| `font-sans` | `verdict-card.tsx:97, 133`, `citation-card.tsx:60`, `chat-thread.tsx:84` — body copy |
| `shadow-doc` | `verdict-card.tsx:57, 85, 124` — paper-like card depth |
| `bg-forest/10`, `bg-ink/10`, `bg-clay/10`, `bg-muted/10` | `citation-card.tsx:30-33`, `chat-thread.tsx:43-46` — tinted pill backgrounds |

**Rule:** every className in Phase 6 must come from this list (or be a Tailwind utility — sizing, spacing, flex). No new color tokens. No raw hex codes.

### 3. `cn(...)` utility for className composition

**Source:** `@/lib/utils` (imported in `verdict-card.tsx:4`, `citation-card.tsx:4`, `chat-thread.tsx:5`).

**Apply to:** any place in Phase 6 that conditionally combines class strings, especially the status-pill tints.

```tsx
import { cn } from "@/lib/utils";

className={cn(
  "rounded-full font-mono text-[11px] px-2 py-0.5",
  STATUS_PILL_TINT[status],
)}
```

### 4. Discriminated-union narrowing guard

**Source:** `src/components/qc/verdict-card.tsx:50-69` (the `if (!object?.ok) { ... return null }` pattern), plus comment "AI-SPEC §3 Pitfall #4: Gemini may emit early chunks before `ok` is set".

**Apply to:** `<TraceRail>` when reducing `agentEvents` into per-agent state. AgentEvents stream in over time; some may arrive without a `stage` field if Gemini partially serializes. Guard:

```tsx
const latestByAgent: Partial<Record<AgentId, AgentEvent>> = {};
for (const ev of agentEvents) {
  if (!ev?.stage || !ev.agent_id) continue;  // skip malformed partial chunks
  latestByAgent[ev.agent_id] = ev;
}
```

This guard is the same shape as `verdict-card.tsx:50` (`if (!object?.ok)`) — Gemini partial-stream resilience.

### 5. List-of-rows with status switch

**Source:** `src/components/qc/chat-thread.tsx:74-178` — single `messages.map()` with progressive `if (m.variant === ...)` branches.

**Apply to:** `<ValidationGrid>` row mapping (baseline + Skeptic extras → status pill switch). Use the same shape: one `.map()`, one switch per row deriving status, return one `<li>` per row.

### 6. ARIA + accessibility discipline

**Source:** `verdict-card.tsx:54, 83, 122` (`aria-label`, `aria-live="polite"`), `citation-card.tsx:43` (`aria-label`), `trace-rail.tsx:29, 45` (`aria-label="Agent activity"`, `aria-hidden` on decorative dots), `sextant-loader.tsx:36` (`role="status"`, `aria-live="polite"`).

**Apply to:** every Phase 6 component:
- `<TraceRail>` outer `<aside>` keeps `aria-label="Agent activity"` (already present).
- `<AgentRow>` row root: `aria-label={\`${label} agent: ${status}${currentTask ? ` — ${currentTask}` : ""}\`}` so screen readers announce both the agent and its phase.
- Status dots inside `<ValidationGrid>` rows: `aria-hidden="true"` (decorative; the row text is the source of truth — same as the current placeholder at line 45).
- `aria-live="polite"` on the `<aside>` outer is borderline — the trace rail is a live region. Add it ONLY if testing shows screen readers handle the burst of events well; the 06-CONTEXT.md hard cuts say "NO keyboard navigation polish (...) keep to 5 min max", so optional.

### 7. Light-mode only

**Source:** Phase 1/2 established pattern (CONTEXT files, no `.dark:` selectors anywhere in `verdict-card.tsx`, `citation-card.tsx`, `chat-thread.tsx`, `trace-rail.tsx`, `sextant-loader.tsx`).

**Apply to:** Phase 6 — never use `dark:` prefixed Tailwind utilities. The forest/clay/paper/ink token system is light-mode-baked.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| (concept: "5-row agent reduction from event stream") | client-side state derivation | streaming-event-driven | The closest existing pattern is `verdict-card.tsx`'s `useObject` consumer, which renders ONE object that arrives over time. Phase 6 needs to render FIVE rows, each with its own latest event. The pattern is novel for this codebase but trivial: `Map<AgentId, AgentEvent>` reduction over `agentEvents[]`, last-write-wins. No file analog needed; just the guard pattern from §4 above. |
| (concept: "deterministic status derivation from Plan content") | pure derivation function | request-response | Not seen elsewhere. The 6 baseline check rules in 06-CONTEXT.md lines 64-71 are the spec; implement as a single switch in `validation-grid.tsx`. No precedent to copy from. |

---

## Forbidden Zone Audit (per 06-CONTEXT.md)

**Confirmed NOT touched by this PATTERNS.md:**
- `src/app/api/**` — no routes referenced for modification.
- `src/lib/plan/**` — only IMPORTED for types (`AgentEvent`, `Plan`); never created or modified. Local fallback type stub stays in `trace-rail.tsx` if needed.
- `src/lib/qc/**`, `src/lib/models.ts`, `src/lib/tavily.ts`, `src/lib/env.ts` — none referenced.
- `src/components/qc/**` — read-only; only used as analogs for patterns to mirror.
- `src/components/plan/**` — not referenced (Phase 4 territory).
- `src/app/app/page.tsx` — explicitly NOT modified. The main chat passes props down to `<TraceRail>`; PATTERNS only updates the component's prop signature, not its caller.

---

## Metadata

**Analog search scope:** `src/components/`, `src/components/qc/`, `src/components/trace-rail.tsx`, `src/components/sextant-loader.tsx`.
**Files scanned:** 5 read end-to-end (`src/components/trace-rail.tsx`, `src/components/sextant-loader.tsx`, `src/components/qc/verdict-card.tsx`, `src/components/qc/citation-card.tsx`, `src/components/qc/chat-thread.tsx`); directory listings of `src/components/` and `src/components/qc/`.
**Phase 6 file count:** 1 MODIFY + 3 NEW (1 of the 3 likely skipped — `trace.css` is optional).
**Pattern extraction date:** 2026-04-26.

---

## PATTERN MAPPING COMPLETE
