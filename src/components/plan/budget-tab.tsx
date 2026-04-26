"use client";

import type { BudgetLine } from "@/lib/plan/schema";
import { CitationSlot } from "@/components/plan/citation-slot";
import { formatCurrency } from "@/lib/plan/format";

type Props = {
  lines: BudgetLine[];
};

/**
 * Budget tab (PLAN-03) — line-itemized budget with category bars + Total.
 *
 * D4-06: per-row name + amount + horizontal proportional bar (bg-forest/30,
 *        width = amount_usd / max * 100%). notes shown as muted line if present.
 *        Total row at bottom with top border, font-mono tabular-nums.
 * D4-15: currency via formatCurrency.
 */
export function BudgetTab({ lines }: Props) {
  const max = lines.reduce((acc, l) => (l.amount_usd > acc ? l.amount_usd : acc), 0);
  const total = lines.reduce((acc, l) => acc + l.amount_usd, 0);

  return (
    <div className="rounded-md border border-borderwarm bg-paper shadow-doc p-4">
      <ul className="flex flex-col gap-3" aria-label="Budget breakdown">
        {lines.map((line, idx) => {
          const pct = max > 0 ? (line.amount_usd / max) * 100 : 0;
          return (
            <li key={`${line.category}-${idx}`} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-center min-w-0">
                  <span className="font-display text-sm font-medium text-ink truncate">
                    {line.category}
                  </span>
                  <CitationSlot citations={line.citations} />
                </div>
                <span className="font-mono text-sm tabular-nums text-ink shrink-0">
                  {formatCurrency(line.amount_usd)}
                </span>
              </div>
              <div
                className="h-2 rounded-full bg-surface overflow-hidden"
                role="presentation"
              >
                <div
                  className="h-full bg-forest/30 rounded-full transition-[width] duration-200"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {line.notes && (
                <p className="font-sans text-xs text-muted-foreground leading-relaxed mt-0.5">
                  {line.notes}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-4 pt-3 border-t border-borderwarm flex items-baseline justify-between">
        <span className="font-display text-sm font-medium text-ink uppercase tracking-wider">
          Total
        </span>
        <span className="font-mono text-base tabular-nums text-ink font-medium">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
