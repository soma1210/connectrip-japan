/**
 * USD reference amounts for JPY prices (Human instruction 2026-11-14).
 *
 * JPY is the official price and the only payment currency (contracts/money.ts).
 * USD is shown on screen as an approximate reference only: it is never sent to
 * a form, quote, booking request or Stripe.
 *
 * The one place that holds the rate. To update it:
 * 1. Open the ECB euro foreign exchange reference rates
 *    (https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml).
 * 2. JPY per USD = (JPY rate) ÷ (USD rate) of the same day, rounded to 2 decimals.
 * 3. Set `jpyPerUsd`, `asOf` (the ECB reference date) and `source` below.
 *
 * A rate older than RATE_MAX_AGE_DAYS is not shown: the USD line and its note
 * disappear and only the JPY price remains, so an old rate is never presented
 * as current. Same when the rate is missing or invalid.
 */
export const USD_REFERENCE_RATE = {
  /** Japanese yen per 1 US dollar. */
  jpyPerUsd: 160.0,
  /** Reference date of the rate (YYYY-MM-DD). */
  asOf: "2026-11-13",
  /** Where the rate came from, for reviewers. */
  source: "ECB euro foreign exchange reference rates, 2026-11-13: EUR/JPY 176.83 ÷ EUR/USD 1.1052 = 160.00 (checked 2026-11-14)",
} as const;

/** After this many days the rate counts as out of date and USD is hidden. */
export const RATE_MAX_AGE_DAYS = 31;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whole US dollars for a JPY amount (`JPY ÷ JPY per USD`, nearest dollar),
 * or null when the rate is missing, invalid or out of date.
 */
export function usdReference(jpy: number, now: number = Date.now(), rate: { jpyPerUsd: number; asOf: string } = USD_REFERENCE_RATE): number | null {
  if (!Number.isFinite(jpy) || jpy <= 0) return null;
  if (!Number.isFinite(rate.jpyPerUsd) || rate.jpyPerUsd <= 0) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rate.asOf)) return null;
  const asOf = Date.parse(`${rate.asOf}T00:00:00Z`);
  if (!Number.isFinite(asOf) || asOf > now + DAY_MS || now - asOf > RATE_MAX_AGE_DAYS * DAY_MS) return null;
  return Math.round(jpy / rate.jpyPerUsd);
}
