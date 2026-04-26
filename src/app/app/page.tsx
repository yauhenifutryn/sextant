"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ChatPanel } from "@/components/chat-panel";
import { PlanCanvas } from "@/components/plan-canvas";
import { TraceRail } from "@/components/trace-rail";
import { useQc } from "@/components/qc/use-qc";
import { usePlan } from "@/components/plan/use-plan";
import { useLabRules } from "@/hooks/use-lab-rules";
import type { ChatMessage } from "@/components/qc/chat-thread";
import type { QCResponse } from "@/lib/qc/schema";
import type { Plan } from "@/lib/plan/schema";

/**
 * Sextant dashboard shell (D-16, D-18, DESIGN-02).
 *
 * Phase 2 lifts QC orchestration to this page so a single useQc() drives
 * BOTH the chat thread (assistant turn per response) AND the canvas-column
 * VerdictCard (streamed object).
 *
 * D-42: chat thread persists across submissions; canvas verdict replaces.
 * D-44: chip click populates textarea + auto-focuses arrow (no auto-submit).
 *       Both chip mount points (chat panel + canvas hero) flow through
 *       the SAME onChipPick handler defined here.
 * D-46: at-most-one clarification per session — after the first clarify,
 *       subsequent submissions append a "treat as final" hint to the prompt.
 * D-48: error retryable=false → Sonner toast + chat-thread error message.
 */
export default function Dashboard() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [focusArrowSignal, setFocusArrowSignal] = useState(0);
  const [clarifyConsumed, setClarifyConsumed] = useState(false);
  const [submittedHypothesis, setSubmittedHypothesis] = useState<string | null>(null);
  const lastCommittedHash = useRef<string | null>(null);
  const lastSubmittedRef = useRef<string>("");

  const qc = useQc();
  const plan = usePlan();
  const labRules = useLabRules();
  const [previousPlan, setPreviousPlan] = useState<Plan | null>(null);
  const lastSeenPlanRef = useRef<Plan | null>(null);

  // Unified chip-click handler shared by ChatPanel + PlanCanvas (D-44).
  const onChipPick = (text: string) => {
    setDraft(text);
    // D-44: deliberate two-step — chip populates, user presses Enter/arrow.
    setFocusArrowSignal((n) => n + 1);
  };

  const submitHypothesis = (hypothesis: string) => {
    // D-42: append the user turn immediately.
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: hypothesis,
    };
    setMessages((prev) => [...prev, userMsg]);

    // D-46: after one clarify, suffix the prompt to disable further clarifies.
    const finalHypothesis = clarifyConsumed
      ? `${hypothesis}\n\n[Treat this as final — emit verdict, no-evidence, or error. Do not request further clarification.]`
      : hypothesis;

    // Reset the previous response state on the canvas; new stream begins.
    qc.clear();
    lastCommittedHash.current = null;
    // D-63: capture the typed text so the auto-fire useEffect can re-submit it
    // to /api/plan once the QC verdict resolves. `draft` may have been cleared
    // by the user typing again before the verdict settles.
    lastSubmittedRef.current = finalHypothesis;
    setSubmittedHypothesis(finalHypothesis);
    plan.clear(); // reset previous plan state on a new submission
    qc.submit({ hypothesis: finalHypothesis });
  };

  // Commit assistant turn when the stream resolves to a typed discriminant.
  useEffect(() => {
    const obj = qc.object;
    if (!obj?.ok || qc.isLoading) return;
    // De-dupe: only commit once per terminal object.
    const hash = JSON.stringify(obj);
    if (lastCommittedHash.current === hash) return;
    lastCommittedHash.current = hash;

    if (obj.ok === "verdict" && obj.verdict && obj.reasoning) {
      queueMicrotask(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            variant: "verdict",
            verdict: obj.verdict as "not-found" | "similar-work-exists" | "exact-match-found",
            reasoning: obj.reasoning ?? "",
          },
        ]);
      });
    } else if (obj.ok === "clarify" && obj.clarify_question) {
      queueMicrotask(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            variant: "clarify",
            question: obj.clarify_question ?? "",
          },
        ]);
        setClarifyConsumed(true); // D-46
      });
    } else if (obj.ok === "no-evidence" && obj.message) {
      queueMicrotask(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            variant: "no-evidence",
            message: obj.message ?? "",
          },
        ]);
      });
    } else if (obj.ok === "error") {
      const message = obj.message ?? "Lit-QC service hit a hiccup — retry?";
      const retryable = obj.retryable ?? true;
      queueMicrotask(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            variant: "error",
            message,
            retryable,
          },
        ]);
      });
      if (!retryable) {
        // D-48: explicit retryable=false copy.
        toast.error("Service unavailable — check API keys.");
      }
    }
  }, [qc.object, qc.isLoading]);

  // D-63: auto-chain plan generation when verdict is "not-found" or
  // "similar-work-exists". For "exact-match-found", the user must click
  // the "Generate anyway →" button (clay accent) on the verdict card.
  useEffect(() => {
    const obj = qc.object;
    if (!obj?.ok || qc.isLoading) return;
    if (obj.ok !== "verdict") return;
    if (
      obj.verdict !== "not-found" &&
      obj.verdict !== "similar-work-exists"
    ) {
      return;
    }
    // De-dupe: don't re-fire if a plan is already streaming for this submission.
    if (plan.isLoading || plan.plan) return;
    plan.submit({
      hypothesis: lastSubmittedRef.current,
      qc_run_id: null,
      qcContext: obj as QCResponse,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc.object, qc.isLoading]);

  // D7-17: snapshot the most recent plan as `previousPlan` whenever the
  // current plan transitions into a NEW value. Sequence:
  //   - First run: plan.plan transitions null → A. lastSeenPlanRef captures A.
  //     previousPlan stays null (no prior plan to compare against).
  //   - Second run: plan.plan transitions null → B (after a clear() and a fresh
  //     stream). lastSeenPlanRef has A. We promote A → previousPlan, then
  //     update lastSeenPlanRef to B.
  // The user can now click "Compare with previous plan" on Plan B.
  useEffect(() => {
    const next = plan.plan;
    if (!next) return;
    // De-dupe — only trigger on actual run_id change.
    if (lastSeenPlanRef.current?.run_id === next.run_id) return;
    if (lastSeenPlanRef.current) {
      setPreviousPlan(lastSeenPlanRef.current);
    }
    lastSeenPlanRef.current = next;
  }, [plan.plan]);

  // Generic fetch failure (network / 500) — treated as retryable error in chat.
  useEffect(() => {
    if (!qc.error) return;
    queueMicrotask(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-err-${Date.now()}`,
          role: "assistant",
          variant: "error",
          message: "Lit-QC service hit a hiccup — retry?",
          retryable: true,
        },
      ]);
    });
  }, [qc.error]);

  return (
    <div
      className="flex-1 grid"
      style={{ gridTemplateColumns: "32fr 50fr 18fr" }}
    >
      <ChatPanel
        value={draft}
        onChange={setDraft}
        onChipPick={onChipPick}
        onSubmit={submitHypothesis}
        isSubmitting={qc.isLoading}
        messages={messages}
        focusArrowSignal={focusArrowSignal}
      />
      <PlanCanvas
        onChipPick={onChipPick}
        qcObject={qc.object}
        qcIsLoading={qc.isLoading}
        plan={plan.plan}
        planIsLoading={plan.isLoading}
        previousPlan={previousPlan}
        hypothesis={submittedHypothesis}
        onRuleCaptured={labRules.refresh}
      />
      <TraceRail
        agentEvents={plan.agentEvents}
        plan={plan.plan}
        isLoading={plan.isLoading}
      />
    </div>
  );
}
