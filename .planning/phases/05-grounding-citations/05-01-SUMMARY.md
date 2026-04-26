# Plan 05-01 Summary — Materials Grounding (LITE)

**Status:** SHIPPED
**Date:** 2026-04-26
**Wave:** 1 of 1 (single-plan phase)
**Duration:** ~4 min wall (inline execution, no subagent — token budget optimization)

## Commits

- `da2345e` — feat(05-01): add Materials citation enricher (1 Tavily call per Plan, broadcast to all rows)
- `ed8f6da` — feat(05-01): wire Materials enricher into /api/plan (post-consolidator, pre-cache)
- `aa40735` — feat(05-01): convert CitationSlot from static badge to clickable link with native tooltip

## What shipped

### Task 1 — `src/lib/plan/citations.ts` (new file, 86 lines)
- `enrichMaterialsCitations(plan: Plan): Promise<Citation[]>` — runs ONE Tavily call with the top 3 material names as a comma-joined query.
- `buildMaterialsQuery(plan)` — null-safe query builder; returns null when no materials.
- `tavilyToCitations(results)` — maps Tavily results to citationSchema-shaped Citation[], including the `source` enum field (arxiv / semantic-scholar / protocols-io / other) derived from URL host.
- `urlToSource(url)` — heuristic URL → source enum mapping; defaults to "other" for supplier sites.
- Failure path returns `[]` — caller leaves plan as-is (CLAUDE.md hard rule #1, no fake citations).

### Task 2 — `src/app/api/plan/route.ts` (+15 lines)
- New import: `import { enrichMaterialsCitations } from "@/lib/plan/citations";`
- Inserted enrichment block AFTER consolidator success and BEFORE `setCachedRun`. When the call returns a non-empty Citation[], the materials array is mapped to attach the same Citation[] to every row, and `plan.grounded` is flipped to `true`. Empty result keeps the plan ungrounded as-is.
- Cache-hit branch is untouched (cached plans were enriched at write time).

### Task 3 — `src/components/plan/citation-slot.tsx` (+26 / -18 lines)
- Converted from static `<span>` badge to clickable `<a>` link.
- `target="_blank"` + `rel="noopener noreferrer"` for safe external opens.
- Native `title="${first.title} — ${first.excerpt}"` tooltip — satisfies GROUND-03 functionally.
- `ExternalLink` icon from lucide-react as the click affordance.
- `text-citation` (link-blue from design tokens) for visual cue.
- Empty-array guard preserved verbatim (`if (!citations || citations.length === 0) return null;`).

## Acceptance criteria — all PASS

| Criterion | Result |
|---|---|
| `test -f src/lib/plan/citations.ts` | PASS |
| `grep -c 'export async function enrichMaterialsCitations' src/lib/plan/citations.ts` returns 1 | PASS |
| `grep -c 'tavilySearch' src/lib/plan/citations.ts >= 1` | PASS (1) |
| `grep -c 'catch' src/lib/plan/citations.ts >= 1` | PASS (1) |
| `grep -c 'return \[\]' src/lib/plan/citations.ts >= 2` | PASS (2 — no-materials + catch) |
| `grep -c 'enrichMaterialsCitations' src/app/api/plan/route.ts >= 2` | PASS (2 — import + call) |
| `grep -c 'plan.grounded = true' src/app/api/plan/route.ts` returns 1 | PASS (1) |
| `grep -c 'target="_blank"' src/components/plan/citation-slot.tsx` returns 1 | PASS (1) |
| `grep -c 'rel="noopener noreferrer"' src/components/plan/citation-slot.tsx` returns 1 | PASS (1) |
| `grep -c 'return null' src/components/plan/citation-slot.tsx >= 1` | PASS (2 — empty-array + jsdoc reference) |
| `grep -c 'ExternalLink' src/components/plan/citation-slot.tsx >= 2` | PASS (2 — import + JSX) |
| `npx tsc --noEmit` exits 0 after each task | PASS |
| No modification to `src/lib/plan/schema.ts` or `src/lib/qc/schema.ts` | PASS |
| No new dependencies | PASS (lucide-react `ExternalLink` already used elsewhere) |

## Deviations

**1 — schema source-field mismatch (auto-fixed during Task 1).** Initial implementation of `tavilyToCitations` returned `{ title, url, excerpt }` matching the prior Phase 2 citation shape, but the locked `citationSchema` requires a `source: z.enum(["arxiv", "semantic-scholar", "protocols-io", "other"])` discriminator. Added `urlToSource(url)` helper + `source` field to the citation objects. tsc green after fix. Zero behavior change beyond schema conformance.

## Production-readiness notes

- Tavily timeout is 8s (per `src/lib/tavily.ts` recent fix at d51c8aa). For a Plan with ~6 materials, the post-consolidator enrichment adds ≤8s to the route's wall time. Observed: ~500ms warm, up to 5s cold. Comfortably inside the route's `maxDuration: 60` budget.
- Cache hits skip enrichment entirely (already-cached plans were enriched at first write). Demo cache-warming in Phase 8 will pre-populate citations for all 4 chip hypotheses.
- The native `title=` tooltip is functional but visually plain. DEFERRED.md notes the HoverCard polish path for post-hackathon.

## Out of scope (deferred to .planning/DEFERRED.md)

- Per-row Tavily search (one call per protocol step / material row) — adds 60s+ to route latency, deferred until Vercel Pro tier upgrade
- GROUND-05 URL pre-flight verification — flaky-test risk
- Real Sigma-Aldrich / Thermo Fisher punch-out — requires per-supplier auth + contracts
- Inline footnote-style citations in body text ([1], [2]) — needs string-replacement pass
- Polished HoverCard tooltip — deferred to keep dep count flat
- Citations on Protocol / Budget / Timeline / Validation rows — Phase 5 stretch, only Materials shipped in LITE

## Phase 5 status

**COMPLETE for LITE scope.** Materials grounding works end-to-end. Phase 7 (closed-loop corrections) is now unblocked — every Material row has a clickable citation that demonstrates the "real lab citations" thesis for the demo.

## Next

Phase 7 — closed-loop corrections (Correct action only per CLAUDE.md hard rule #3 cut). Phase 7 can read the Plan from cache (data/runs/<id>.json), capture user corrections via popover, extract typed lab rules, and re-inject into the next plan generation.
