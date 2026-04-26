/**
 * Centralized Gemini model IDs + availability fallback ladder (D-22a..D-22c, D-53).
 *
 * ## Why this exists
 *
 * Google's preview-tier hosts (`*-preview`, `*-lite`) flap between green and
 * 503 UNAVAILABLE several times an hour during the 2026-04 hackathon weekend.
 * Verified live on 2026-04-26: `gemini-3.1-flash-lite-preview` returned 503
 * on 10/10 sequential calls. The error body literally says
 * "This model is currently experiencing high demand. Spikes in demand are
 * usually temporary." Same key, same project — `gemini-2.5-flash` (non-Lite
 * GA) returns 200 in ~1.2s on the same window.
 *
 * The hackathon demo cannot afford a runtime that breaks when Google rebalances
 * preview-tier capacity. So every model call goes through `pickAvailableLitQcModel()`,
 * which probes the ladder in order and caches the first working model for 60s.
 *
 * ## The ladder (ordered cheapest → most reliable)
 *
 * 1. `gemini-3.1-flash-lite-preview` — cheapest + fastest when up. The original
 *    D-22a / D-34 choice. Currently 100% 503 on this key.
 * 2. `gemini-2.5-flash` — GA primary. The model that's actually serving Phase 2
 *    smoke tests at 3.4s end-to-end. ~3-4x the cost of (1) but stable.
 * 3. `gemini-2.0-flash` — older GA. Slowest of the three on structured output
 *    but rarely flaps. Last-resort.
 *
 * ## How the cache works
 *
 * Module-level `Map`-style cache (60s TTL). On each call:
 *   - Cache hit → return the cached model id immediately (zero latency).
 *   - Cache miss / expired → probe each model in order with a 1-token
 *     `generateText` call (`thinkingBudget: 0` so it's actually 1 token, not
 *     800 thinking tokens). First 200 wins; the rest are skipped.
 *   - All three fail → return the GA primary anyway and let the route surface
 *     the real error (D-49 — never silently substitute a verdict).
 *
 * ## Phase 3 reuse
 *
 * The 4-agent debate (Researcher / Skeptic / CRO Operator / Compliance) calls
 * Gemini 4 times per hypothesis. Without this wrapper, a single preview-tier
 * outage cascades to 4 broken agents. With this wrapper, all 4 agents share
 * the same cached pick → one probe, four resilient calls.
 */
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

/** Ordered fallback ladder. Cheapest first; most reliable last. */
export const MODEL_LADDER = [
  "gemini-3.1-flash-lite-preview",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
] as const;

export type LitQcModelId = (typeof MODEL_LADDER)[number];

/**
 * Default lit-QC model id. Used by callers that do NOT need fallback resilience
 * (e.g. logging, type inference). Set to the GA primary, NOT the preview, so
 * naive `google(LIT_QC_MODEL_ID)` calls still work even if `pickAvailableLitQcModel`
 * is not wired in. Live route handlers should use the picker.
 */
export const LIT_QC_MODEL_ID: LitQcModelId = "gemini-2.5-flash";

/**
 * Original preview ID (D-22a). Re-promote to LIT_QC_MODEL_ID once the
 * preview snapshot stabilizes; until then the picker probes it first.
 */
export const LIT_QC_MODEL_ID_PREVIEW: LitQcModelId =
  "gemini-3.1-flash-lite-preview";

/** Last-resort GA model id (D-53). */
export const LIT_QC_MODEL_ID_EMERGENCY: LitQcModelId = "gemini-2.0-flash";

// --- Picker cache --------------------------------------------------------

const CACHE_TTL_MS = 60_000; // Google capacity flaps fast — re-probe each minute.

let cachedModel: LitQcModelId | null = null;
let cachedAt = 0;
let inflightPick: Promise<LitQcModelId> | null = null;

/**
 * Probe `id` with a 1-token `generateText` call. Returns true on HTTP 200.
 * Uses `thinkingBudget: 0` so the probe is actually cheap (without it, Gemini
 * 2.5+ burns 800+ thinking tokens on a 1-token request).
 */
async function isAvailable(id: LitQcModelId): Promise<boolean> {
  try {
    await generateText({
      model: google(id),
      prompt: "ok",
      maxOutputTokens: 1,
      providerOptions: {
        google: {
          thinkingConfig: { thinkingBudget: 0 },
        },
      },
      // Keep the probe fast — 5s is more than enough for a 1-token round-trip
      // when the model is actually up.
      abortSignal: AbortSignal.timeout(5_000),
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Walk the ladder in order; return the first model id that responds 200.
 * If all fail, return the GA primary so the caller can surface a real error
 * downstream rather than masking it with a guess.
 *
 * Result is cached for 60s — concurrent requests during a probe wait on a
 * single in-flight promise so only ONE probe burst happens per minute.
 */
export async function pickAvailableLitQcModel(): Promise<LitQcModelId> {
  const now = Date.now();
  if (cachedModel && now - cachedAt < CACHE_TTL_MS) return cachedModel;
  if (inflightPick) return inflightPick;

  inflightPick = (async () => {
    for (const id of MODEL_LADDER) {
      const ok = await isAvailable(id);
      if (ok) {
        cachedModel = id;
        cachedAt = Date.now();
        return id;
      }
    }
    // All probes failed — return GA primary so the real call surfaces a real
    // error to onFinish (D-49: never silently substitute a verdict).
    cachedModel = LIT_QC_MODEL_ID;
    cachedAt = Date.now();
    return cachedModel;
  })();

  try {
    return await inflightPick;
  } finally {
    inflightPick = null;
  }
}

/** Test-only: clear the picker cache. Not exported in the production barrel. */
export function __resetModelPickerCache(): void {
  cachedModel = null;
  cachedAt = 0;
  inflightPick = null;
}
