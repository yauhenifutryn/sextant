"use client";

import { useState } from "react";

import { ChatPanel } from "@/components/chat-panel";
import { PlanCanvas } from "@/components/plan-canvas";
import { TraceRail } from "@/components/trace-rail";

/**
 * Sextant dashboard shell (D-16, D-18, DESIGN-02).
 *
 * Three-column grid sized 32fr / 50fr / 18fr per the brief's
 * §"Layout — desktop primary". Owns the textarea draft state so chip
 * picks from EITHER the chat panel OR the canvas hero flow into a single
 * source of truth (D-19, INPUT-03).
 *
 * Phase 1 makes ZERO model calls — chip clicks only populate the textarea
 * (no submit, no LLM). Phase 2 wires the send arrow to the lit-QC backend.
 */
export default function Dashboard() {
  const [draft, setDraft] = useState("");
  return (
    <div
      className="flex-1 grid"
      style={{ gridTemplateColumns: "32fr 50fr 18fr" }}
    >
      <ChatPanel value={draft} onChange={setDraft} />
      <PlanCanvas onChipPick={setDraft} />
      <TraceRail />
    </div>
  );
}
