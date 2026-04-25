import { NextResponse } from "next/server";
import { env } from "@/lib/env";

/**
 * GET /api/health (D-22).
 *
 * Returns presence booleans for the required API keys. Never returns the key
 * values themselves (T-01-06 mitigation). The route reads env via the typed
 * `env` singleton from `@/lib/env`, never via raw runtime variables (D-21, T-01-07).
 */
export async function GET() {
  const tavily = !!env.TAVILY_API_KEY;
  const gemini = !!env.GOOGLE_GENERATIVE_AI_API_KEY;
  return NextResponse.json({ tavily, gemini, ok: tavily && gemini });
}
