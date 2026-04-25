import { z } from "zod";

/**
 * Server-only Zod-validated env loader (D-20, D-22a..D-22d).
 *
 * - GOOGLE_GENERATIVE_AI_API_KEY: required (Gemini brain model — multi-tier).
 * - TAVILY_API_KEY: required (literature QC and supplier scraping).
 * - OPENAI_API_KEY: optional (provider-level fallback per D-22d).
 *
 * Failure throws at module import = fail fast at boot, never at runtime (D-20).
 * All API code reads `env.X`, never `process.env.X` (D-21).
 */
const Env = z.object({
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
  TAVILY_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
});

export const env = Env.parse(process.env);
export type Env = z.infer<typeof Env>;
