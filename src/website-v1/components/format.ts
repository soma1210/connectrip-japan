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
