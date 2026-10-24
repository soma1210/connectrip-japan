import type { DurationRange, Money } from "@/contracts";

export function formatDuration({ minMinutes, maxMinutes }: DurationRange): string {
  const h = (m: number) => `${Math.round((m / 60) * 10) / 10}`;
  return minMinutes === maxMinutes ? `${h(minMinutes)} h` : `${h(minMinutes)}–${h(maxMinutes)} h`;
}

/** JPY has no minor unit; `amount` is already in yen. */
export function formatMoney({ amount, currency }: Money): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(currency === "JPY" ? amount : amount / 100);
}

const day = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
const dayNoYear = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" });

/** `YYYY-MM-DD` (a Japan calendar date) → "3 Nov 2026". */
export function formatIsoDate(date: string): string {
  return day.format(new Date(`${date}T00:00:00Z`));
}

/** "3 Nov 2026", or "3 Nov – 10 Nov 2026". */
export function formatIsoRange(start: string, end: string): string {
  if (start === end) return formatIsoDate(start);
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  const from = sameYear ? dayNoYear.format(new Date(`${start}T00:00:00Z`)) : formatIsoDate(start);
  return `${from} – ${formatIsoDate(end)}`;
}
