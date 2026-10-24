import type { ClockTime, Money, PaymentCurrency, PrivateGuideAvailability, PrivateGuidePlan } from "@/contracts";

/**
 * Pure Private Guide slot and price helpers, shared by the content layer and
 * the booking UI. The rule mirrors the future Availability API: a start time
 * is bookable only if the whole range `start → start + duration` sits inside
 * the selling window and overlaps no blocked range.
 */

export function toMinutes(time: ClockTime): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(minutes: number): ClockTime {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function endTime(start: ClockTime, durationMinutes: number): ClockTime {
  return fromMinutes(toMinutes(start) + durationMinutes);
}

export function isRangeAvailable(
  availability: PrivateGuideAvailability,
  date: string,
  start: ClockTime,
  durationMinutes: number,
): boolean {
  if (!availability.dates.includes(date)) return false;
  const from = toMinutes(start);
  const to = from + durationMinutes;
  if (from < toMinutes(availability.windowStart) || to > toMinutes(availability.windowEnd)) return false;
  return (availability.blocked[date] ?? []).every((b) => to <= toMinutes(b.from) || from >= toMinutes(b.to));
}

export type StartTimeOption = { time: ClockTime; end: ClockTime; available: boolean };

export function startTimeOptions(
  availability: PrivateGuideAvailability,
  date: string,
  durationMinutes: number,
): StartTimeOption[] {
  return availability.startTimes.map((time) => ({
    time,
    end: endTime(time, durationMinutes),
    available: isRangeAvailable(availability, date, time, durationMinutes),
  }));
}

/** True when at least one start time works for this date and duration. */
export function hasAvailability(availability: PrivateGuideAvailability, date: string, durationMinutes: number): boolean {
  return availability.startTimes.some((time) => isRangeAvailable(availability, date, time, durationMinutes));
}

/**
 * Price for a selection. Replaced by the Product / Pricing contract once
 * prices are decided; the UI only needs a total.
 */
export function quote(plan: PrivateGuidePlan): Money<PaymentCurrency> | undefined {
  if (plan.pricing.status === "TBD") return undefined;
  return plan.pricing.value.amount;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hours` : `${h} h ${m} min`;
}
