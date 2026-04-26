/**
 * Centralized Gemini model IDs (D-22a..D-22c, D-53).
 *
 * The fallback ladder is a one-line swap: edit LIT_QC_MODEL_ID below from
 * "gemini-3.1-flash-lite-preview" to "gemini-2.5-flash-lite" if the preview
 * model misbehaves on structured output during build / rehearsal.
 *
 * Both models share the same env key (GOOGLE_GENERATIVE_AI_API_KEY) and the
 * same @ai-sdk/google provider — no other code change is needed.
 */
export const LIT_QC_MODEL_ID = "gemini-3.1-flash-lite-preview" as const;

/**
 * GA fallback for D-53. Imported only if the swap is taken.
 */
export const LIT_QC_MODEL_ID_FALLBACK = "gemini-2.5-flash-lite" as const;
