# Phase 3: Multi-Agent Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `03-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-26
**Phase:** 03-multi-agent-pipeline
**Areas discussed:** Orchestration topology, JSON schema + agent ownership, Trace event protocol, Trigger + persistence

---

## Area selection

**Question:** Phase 3 is the demo's spine — 4 agents producing one JSON plan in <60s. Which areas do you want to pin down before planning?

| Option | Description | Selected |
|--------|-------------|----------|
| Orchestration topology | Parallel single-pass + consolidator vs debate + critique vs sequential pipeline | ✓ |
| JSON schema + agent ownership | Per-section ownership vs all-agents-review-all vs two-roles-per-agent | ✓ |
| Trace event protocol | AI SDK custom data parts vs side SSE vs in-memory store + polling | ✓ |
| Trigger + persistence | Auto-chain after verdict vs explicit button; in-memory + JSON file vs in-memory only vs file only | ✓ |

**User's choice:** All 4 areas selected. Multi-select.

---

## Orchestration topology

### Q1 — How do the 4 agents run under the 60s ceiling?

| Option | Description | Selected |
|--------|-------------|----------|
| Parallel + consolidator (Recommended) | All 4 in `Promise.all`, 5th merge call. ~35-45s total. | ✓ |
| Parallel debate + critique round | Round 1 drafts + round 2 critiques + consolidator. ~55s, against the ceiling. | |
| Sequential pipeline | Researcher → Skeptic → Operator → Compliance → Consolidator. Linear latency. | |

**User's choice:** Parallel + consolidator.

### Q2 — Model tier per agent?

| Option | Description | Selected |
|--------|-------------|----------|
| Uniform 2.5-flash via picker (Recommended) | All 5 calls through `pickAvailableLitQcModel()`. Single probe shared. | ✓ |
| Tiered: debaters Flash, consolidator Pro | Pro on consolidator. +8-15s latency risk. | |
| Flash everywhere, no consolidator picker variant | Same picker, consolidator gets `thinkingBudget: 4000`. | |

**User's choice:** Uniform 2.5-flash via picker. Note: the `thinkingBudget: 4000` for consolidator from option 3 was folded into D-55 anyway — best of both.

### Q3 — Where does each agent's evidence come from?

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid: lit-QC + targeted Tavily per agent (Recommended) | All agents see Phase 2 lit-QC. Researcher fires 1 fresh Tavily for protocols.io. | ✓ |
| Recycle Phase 2 only — no fresh Tavily | All agents on shared lit-QC context only. | |
| Fresh Tavily per agent | 4 extra Tavily calls per run. Burns budget + quota. | |

**User's choice:** Hybrid (Researcher only).

---

## JSON schema + agent ownership

### Q1 — How do the 4 agents split the 5 plan sections?

| Option | Description | Selected |
|--------|-------------|----------|
| Section ownership (Recommended) | Researcher→Protocol, Operator→Materials+Budget+Timeline, Skeptic→Validation, Compliance→annotations. | ✓ |
| All agents review all sections | Each produces a full draft; consolidator picks best paragraphs. | |
| Two roles per agent | Researcher=Protocol+Validation, Operator=Materials+Budget+Timeline, Skeptic=critiques, Compliance=annotations. | |

**User's choice:** Section ownership.

### Q2 — Top-level Plan JSON shape?

| Option | Description | Selected |
|--------|-------------|----------|
| Flat sections + per-line provenance (Recommended) | Sections at top level, each line has `citations: Citation[]`, `agent_artifacts` map alongside. | ✓ |
| Sections only, agent artifacts as side channel | Main Plan has only sections; artifacts written to disk separately. | |
| Nested by agent | `{ researcher: { protocol }, operator: { materials, budget, timeline }, ... }`. Phase 4 has to assemble. | |

**User's choice:** Flat sections + per-line provenance.

### Q3 — Citation slots in Phase 3?

| Option | Description | Selected |
|--------|-------------|----------|
| Empty array slots (Recommended) | Every line emits `citations: []` + top-level `grounded: false`. Phase 5 fills. | ✓ |
| Source-tagged placeholders | Lines reference Phase 2 lit-QC citations by index. | |
| Required citations from Phase 3 | Forces extra Tavily calls. Pulls Phase 5 work forward. Risks budget. | |

**User's choice:** Empty array slots.

---

## Trace event protocol

### Q1 — Transport for per-agent trace events?

| Option | Description | Selected |
|--------|-------------|----------|
| AI SDK custom data parts (Recommended) | `createUIMessageStream` + `writer.write({ type: 'data-trace', data: AgentEvent })`. Same SSE channel as Plan. | ✓ |
| Side SSE channel | Separate `/api/plan/trace?run_id=X` stream. Two connections. | |
| In-memory store + polling | Server writes, client polls every 200ms. Wasted requests. | |

**User's choice:** AI SDK custom data parts.

### Q2 — Event granularity?

| Option | Description | Selected |
|--------|-------------|----------|
| 3 lifecycle events per agent (Recommended) | `started` / `working` / `done`. ~12-15 events per run. | ✓ |
| Token-level streaming per agent | Forward `partial` parts. Heavy payload, render storms. | |
| Start + done only | 2 events per agent. Loses "currently doing X" demo signal. | |

**User's choice:** 3 lifecycle events.

### Q3 — `AgentEvent` payload shape?

| Option | Description | Selected |
|--------|-------------|----------|
| Discriminated union by stage (Recommended) | Same Zod-discriminated-union pattern as Phase 2 D-40. | ✓ |
| Flat record, optional fields | Simpler shape, looser typing. Phase 6 has to null-check. | |
| Two record types | AgentLifecycle + AgentProgress. More types to maintain. | |

**User's choice:** Discriminated union by stage.

---

## Trigger + persistence

### Q1 — When does the 4-agent pipeline fire?

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-chain after verdict (Recommended) | `not-found` and `similar-work-exists` auto-fire. `exact-match-found` shows "Generate anyway" button. | ✓ |
| Explicit "Generate plan" button always | Always requires a click. More deliberate; costs a click in the demo. | |
| Auto on chip clicks, manual on freeform | Hybrid. Adds a code branch. | |

**User's choice:** Auto-chain after verdict.

### Q2 — Persistence?

| Option | Description | Selected |
|--------|-------------|----------|
| In-memory + JSON file write (Recommended) | `Map<run_id, Plan>` + async write to `data/runs/<run_id>.json` (gitignored). | ✓ |
| In-memory only | Cold-start clears it. Phase 7 has to re-run. | |
| JSON file only — no in-memory map | Every read hits filesystem. Slower per-read. | |

**User's choice:** In-memory + JSON file.

### Q3 — Cache key behavior?

| Option | Description | Selected |
|--------|-------------|----------|
| Hash(hypothesis) — same key, replay (Recommended) | `SHA-256(hypothesis.trim().toLowerCase())`. Same as Phase 2 D-50. | ✓ |
| Hash(hypothesis + qc_run_id) | Each verdict produces unique run. Re-clicking chip cache-misses. | |
| Hash(hypothesis + lab_rules_hash) from day one | Bake Phase 7 invalidation now. Adds dead code paths. | |

**User's choice:** Hash(hypothesis).

---

## Closing question

**Q:** 12 decisions captured across all 4 areas. Anything else to pin down before I write CONTEXT.md, or are we good?

| Option | Selected |
|--------|----------|
| Ready for CONTEXT.md (Recommended) | ✓ |
| Explore more gray areas | |

**User's choice:** Ready for CONTEXT.md.

---

## Claude's Discretion (folded into CONTEXT.md)

Per CONTEXT.md `<decisions>` final subsection:
- Exact prompt wording for the 5 agent prompts.
- File layout under `src/lib/plan/` (single file vs per-agent split).
- Dashboard wire-in placement.
- `ulid` package vs hand-rolled ID for `run_id` (D-68).
- Skeptic's hypothesis-specific validation checks beyond the 6 from `trace-rail.tsx:VALIDATION_SKELETON`.

## Deferred Ideas (folded into CONTEXT.md `<deferred>`)

- Per-tier model selection (revisit Phase 8).
- Parallel debate with critique round (revisit if Phase 3 ships under budget).
- Token-level streaming per agent into the trace rail.
- Side SSE channel for trace events.
- Persistent Plan history list view.
- Fresh Tavily per agent for Operator/Skeptic/Compliance.
- Retry-with-backoff inside Phase 3.
- Pre-baking `lab_rules_hash` into the cache key (Phase 7's job).
