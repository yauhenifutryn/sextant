/**
 * Centralized Gemini model IDs (D-22a..D-22c, D-53).
 *
 * D-53 fallback TAKEN on 2026-04-26 during Plan 02-02 smoke-test, twice:
 *   1. `gemini-3.1-flash-lite-preview` returned HTTP 503 UNAVAILABLE on
 *      three consecutive AI-SDK retries.
 *   2. `gemini-2.5-flash-lite` (the documented D-53 GA fallback) returned
 *      200 in 2.1s but collapsed the discriminated-union schema — emitted
 *      `{ verdict, citations: [URLs] }` without the `ok` discriminator or
 *      full citation objects, failing Zod validation in onFinish (this is
 *      AI-SPEC §3 Pitfall #2 surfacing on the GA model too — Lite-tier
 *      structured-output adherence is weak for `discriminatedUnion`).
 *   3. Switched to `gemini-2.5-flash` (the larger sibling) — same env key,
 *      same provider, stronger structured-output discipline. ~2-3x cost
 *      per call but Phase 2 is single-shot per hypothesis with caching.
 *
 * The original preview ID is preserved in PREVIEW for future re-attempt;
 * the LITE_FALLBACK is preserved for any Phase 6 cost-experiments.
 */
export const LIT_QC_MODEL_ID = "gemini-2.5-flash" as const;

/**
 * Original preview ID (D-22a). Re-promote to LIT_QC_MODEL_ID once the
 * preview snapshot stabilizes; until then this is documentation-only.
 */
export const LIT_QC_MODEL_ID_PREVIEW = "gemini-3.1-flash-lite-preview" as const;

/**
 * Lite-tier GA option (D-53). Cheaper than 2.5-flash but currently fails
 * structured-output adherence on the discriminated-union schema; see notes
 * above. Available for cost experiments once the schema is flattened.
 */
export const LIT_QC_MODEL_ID_FALLBACK = "gemini-2.5-flash-lite" as const;
