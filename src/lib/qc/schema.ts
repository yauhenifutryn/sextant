/**
 * QC response Zod schema (D-40, D-36, D-43).
 *
 * Single source of truth for both the server route (`streamObject` schema:)
 * AND the client hook (`useObject` schema:). Discriminated on `ok` so the
 * model picks one of four mutually-exclusive shapes; the SDK serialises this
 * to JSON Schema for Gemini's structured-output mode.
 *
 * Verdict literals are kebab-case — DO NOT change without updating the
 * client render switch in src/components/qc/verdict-card.tsx (Plan 02-03).
 */
import { z } from "zod";

export const citationSchema = z.object({
  title: z
    .string()
    .min(1)
    .describe("Paper or protocol title from the Tavily result."),
  url: z
    .string()
    .url()
    .describe(
      "Source URL — MUST be one of the URLs in the supplied evidence block.",
    ),
  excerpt: z
    .string()
    .min(1)
    .max(280)
    .describe(
      "1-line excerpt grounding the citation, drawn from the Tavily content field.",
    ),
  source: z.enum(["arxiv", "semantic-scholar", "protocols-io", "other"]),
});

export const qcResponseSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal("verdict"),
    verdict: z
      .enum(["not-found", "similar-work-exists", "exact-match-found"])
      .describe(
        "Conservative novelty label. Bias toward 'similar-work-exists' under uncertainty (D-35).",
      ),
    reasoning: z.string().min(1).max(600),
    citations: z.array(citationSchema).min(2).max(3), // D-36: floor=2 (LITQC-03), ceiling=3
  }),
  z.object({
    ok: z.literal("clarify"),
    clarify_question: z.string().min(1).max(280), // D-46/D-47
  }),
  z.object({
    ok: z.literal("no-evidence"),
    message: z.string().min(1),
  }),
  z.object({
    ok: z.literal("error"),
    message: z.string().min(1),
    retryable: z.boolean(),
  }),
]);

export type QCResponse = z.infer<typeof qcResponseSchema>;
