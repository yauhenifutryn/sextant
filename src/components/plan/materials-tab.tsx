"use client";

import { cloneElement } from "react";
import type { MaterialRow } from "@/lib/plan/schema";
import { CitationSlot } from "@/components/plan/citation-slot";
import { formatCurrency, computeSubtotal } from "@/lib/plan/format";
import { CorrectionPopover } from "@/components/correction-popover";

type Props = {
  materials: MaterialRow[];
  planContext?: { hypothesis: string; sliceJson: string };
  onRuleCaptured?: () => void | Promise<void>;
};

/**
 * Materials tab (PLAN-02) — 6-column structured table.
 *
 * D4-05: Reagent / Catalog # / Supplier / Unit cost / Qty / Subtotal.
 *        Sticky header. Em-dash for null cells. Right-align Unit cost / Qty / Subtotal.
 *        font-mono tabular-nums on numeric cells.
 * D4-14: width assumption is desktop-only; horizontal scroll fallback.
 * D4-13: no second scroll container — overflow-x only.
 * D4-10 via CitationSlot: empty citations[] renders nothing.
 *
 * D7-13 (Phase 7): each <tr> wraps in <CorrectionPopover> when planContext
 * is supplied. Radix PopoverTrigger asChild attaches handlers + ref to the
 * existing <tr> — table semantics preserved.
 */
export function MaterialsTab({ materials, planContext, onRuleCaptured }: Props) {
  return (
    <div className="overflow-x-auto rounded-md border border-borderwarm bg-paper shadow-doc">
      <table className="w-full text-sm" aria-label="Materials table">
        <thead className="sticky top-0 bg-surface border-b border-borderwarm">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Reagent</th>
            <th scope="col" className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Catalog #</th>
            <th scope="col" className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Supplier</th>
            <th scope="col" className="px-3 py-2 text-right font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Unit cost</th>
            <th scope="col" className="px-3 py-2 text-right font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Qty</th>
            <th scope="col" className="px-3 py-2 text-right font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((row, idx) => {
            const subtotal = computeSubtotal(row.unit_price_usd, row.quantity);
            const tr = (
              <tr
                className={`border-b border-borderwarm last:border-b-0 hover:bg-surface/40 transition-colors${
                  planContext
                    ? " cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-inset"
                    : ""
                }`}
                tabIndex={planContext ? 0 : -1}
                role={planContext ? "button" : undefined}
                aria-label={
                  planContext ? `Correct material ${row.name}` : undefined
                }
              >
                <td className="px-3 py-2 font-sans text-ink align-top">
                  <span>{row.name}</span>
                  <CitationSlot citations={row.citations} />
                </td>
                <td className="px-3 py-2 font-mono text-xs text-ink align-top">
                  {row.catalog_number ?? "—"}
                </td>
                <td className="px-3 py-2 font-sans text-xs text-muted-foreground align-top">
                  {row.supplier ?? "—"}
                </td>
                <td className="px-3 py-2 font-mono text-sm tabular-nums text-ink text-right align-top">
                  {row.unit_price_usd === null ? "—" : formatCurrency(row.unit_price_usd)}
                </td>
                <td className="px-3 py-2 font-mono text-sm tabular-nums text-ink text-right align-top">
                  {row.quantity}
                </td>
                <td className="px-3 py-2 font-mono text-sm tabular-nums text-ink text-right align-top">
                  {subtotal === null ? "—" : formatCurrency(subtotal)}
                </td>
              </tr>
            );
            const k = `${row.name}-${idx}`;
            if (!planContext) {
              return cloneElement(tr, { key: k });
            }
            return (
              <CorrectionPopover
                key={k}
                target={{
                  kind: "material_row",
                  label: `${row.name} · ${row.quantity}`,
                }}
                planContext={planContext}
                onSuccess={onRuleCaptured}
              >
                {tr}
              </CorrectionPopover>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
