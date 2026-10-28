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

/**
 * Start times a plan can actually use: the day must end inside the selling
 * window, so later candidates are left out (not shown as unavailable).
 * Blocked ranges still show as unavailable.
 */
export function planStartTimeOptions(
  availability: PrivateGuideAvailability,
  date: string,
  durationMinutes: number,
): StartTimeOption[] {
  const close = toMinutes(availability.windowEnd);
  return startTimeOptions(availability, date, durationMinutes).filter((o) => toMinutes(o.end) <= close);
}

/**
 * How a start can be booked, by hours until it begins (Private Guide v1
 * cutoff): `online` more than 48 h ahead, `request` 24–48 h (Request
 * Availability), `contact` under 24 h (special request only), `past`.
 */
export type SlotBookingMode = "online" | "request" | "contact" | "past";

export function slotBookingMode(
  date: string,
  start: ClockTime,
  nowMs: number,
  cutoff: { onlineBookingHours: number; requestHours: number },
): SlotBookingMode {
  const hours = (Date.parse(`${date}T${start}:00+09:00`) - nowMs) / 3_600_000;
  if (hours <= 0) return "past";
  if (hours > cutoff.onlineBookingHours) return "online";
  if (hours >= cutoff.requestHours) return "request";
  return "contact";
}

/**
 * Who is joining, by age group (Website-local; the shared booking contract
 * has no young-children field yet). Adults 13+, children 6–12, young
 * children 0–5.
 */
export type Party = { adults: number; children: number; youngChildren: number };

/** Everyone who joins, young children included (the online booking limit). */
export function totalParticipants(p: Party): number {
  return p.adults + p.children + p.youngChildren;
}

/** Adults and children only: young children never count toward pricing. */
export function payingGuests(p: Party): number {
  return p.adults + p.children;
}

/**
 * Group price. The plan price covers `includedGuests` paying guests. Beyond
 * that, the surcharge goes to children first (the cheaper rate), then adults,
 * so the result is the most customer-friendly split and does not depend on
 * who "came fifth".
 */
export type GroupQuote = {
  base: Money<PaymentCurrency>;
  extraAdults: number;
  extraChildren: number;
  adultExtra: Money<PaymentCurrency>;
  childExtra: Money<PaymentCurrency>;
  extra: Money<PaymentCurrency>;
  total: Money<PaymentCurrency>;
};

export function groupQuote(
  plan: PrivateGuidePlan,
  party: Party,
  group: { includedGuests: number; extraGuestFee: number; extraChildFee: number; maxOnlineGuests: number },
): GroupQuote | undefined {
  const base = quote(plan);
  if (!base || totalParticipants(party) > group.maxOnlineGuests) return undefined;
  const extraGuests = Math.max(0, payingGuests(party) - group.includedGuests);
  const extraChildren = Math.min(party.children, extraGuests);
  const extraAdults = extraGuests - extraChildren;
  const money = (amount: number) => ({ amount, currency: base.currency });
  const adultExtra = money(extraAdults * group.extraGuestFee);
  const childExtra = money(extraChildren * group.extraChildFee);
  const extra = money(adultExtra.amount + childExtra.amount);
  return { base, extraAdults, extraChildren, adultExtra, childExtra, extra, total: money(base.amount + extra.amount) };
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
