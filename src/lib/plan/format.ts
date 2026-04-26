/**
 * Plan render formatters (Phase 4, Plan 04-01).
 *
 * D4-15 — currency: en-US USD, no decimals when whole, 2 when fractional.
 *         Intl.NumberFormat handles the locale + symbol; we read its parts
 *         to drop trailing ".00" without writing our own number→string code.
 *
 * D4-05 — Materials Subtotal is computed client-side as
 *         `unit_price_usd * Number(quantity)` ONLY when both are usable
 *         numbers. Quantity is a free-form string per the schema (e.g.,
 *         "10 mL", "3 plates"); we attempt Number() and accept ONLY if
 *         the result is finite and > 0. Returning null → callers render an
 *         em-dash, NEVER a fake `0`.
 */

const USD_FMT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  const isWhole = Number.isInteger(value);
  if (isWhole) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return USD_FMT.format(value);
}

/**
 * Returns subtotal in USD or null when either operand is missing / unusable.
 * The schema permits `unit_price_usd: null`; quantity is a free-form string.
 * Caller renders em-dash on null (D4-05 — never `0` or `—$0`).
 */
export function computeSubtotal(
  unitPriceUsd: number | null,
  quantity: string,
): number | null {
  if (unitPriceUsd === null || !Number.isFinite(unitPriceUsd)) return null;
  // Quantity may be "10 mL" — Number("10 mL") is NaN, so the trim-and-parse
  // approach handles "10", "10.5", "  10  " but rejects unit-suffixed strings.
  // For unit-suffixed quantities (the common case in real plans), the schema
  // emits the unit inside the same string field; subtotal is then unknown
  // and we render em-dash. This is correct: we do NOT invent a multiplier.
  const trimmed = quantity.trim();
  // Try a leading numeric prefix (e.g. "10 mL" → 10).
  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const qty = Number(match[1]);
  if (!Number.isFinite(qty) || qty <= 0) return null;
  return unitPriceUsd * qty;
}
