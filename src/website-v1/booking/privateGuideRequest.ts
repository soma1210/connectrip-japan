import type { AreaKey, IsoDate, PrivateGuideActivity } from "@/contracts";
import { addDays, isIsoDate, jstToday } from "../content/guides/freshness";
import { BOOKING_REF, type BookingRequestBody } from "./bookingRequestContract";

/**
 * Private Guide booking request (Human instruction 2026-11-09): the traveller
 * sends a request; Connectrip checks it and guide availability, sends a Stripe
 * invoice in JPY and confirms the
 * booking by hand after payment. Nothing on the site books or charges.
 *
 * Private Guide Booking Rules V1.1 (APPROVED by management). All times are
 * Japan time (Asia/Tokyo, always UTC+9):
 * - duration: 4, 6 or 8 hours (API values 240 / 360 / 480 minutes)
 * - preferred start: 08:00–17:00, every 30 minutes
 * - the day ends by 20:00; a later finish is not taken by this form → individual inquiry
 * - party: at least 1 adult, adults + children at most 6
 * - requests close 48 hours before the preferred start (exactly 48 h is accepted)
 * - bookable up to 90 calendar days after the request date (Japan date)
 * - the second choice follows the same rules
 * - request only: no instant confirmation, no online payment, no prices yet
 *
 * Website-local on purpose: the shared request / API contract is being
 * designed by the API owner (Cursor). Until it lands, the form posts to
 * `mockSubmitPrivateGuideRequest`, which sends nothing anywhere. Swap the
 * handler, not the form, when the API is ready. The API must apply the same
 * rules again on the server.
 */

// ---------------------------------------------------------------------------
// Booking Rules V1.1

/** Duration options in minutes (API values). */
export const DURATION_MINUTES = [240, 360, 480] as const;
export type DurationMinutes = (typeof DURATION_MINUTES)[number];

/** Requests close this many hours before the preferred start. */
export const REQUEST_LEAD_HOURS = 48;

/** Bookable up to this many calendar days after the request date (Japan). */
export const MAX_DAYS_AHEAD = 90;

/** Latest end of a standard Private Guide day, Japan time. */
export const DAY_END = "20:00";

/** Adults + children, at most. At least one adult. */
export const MAX_PARTY_SIZE = 6;
export const MIN_ADULTS = 1;

/** 08:00–17:00 Japan time, 30-minute steps (19 options). */
export const START_TIMES: readonly string[] = Array.from({ length: 19 }, (_, i) => {
  const minutes = 8 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${minutes % 60 === 0 ? "00" : "30"}`;
});

const HOUR = 60 * 60 * 1000;
const SHORTEST: DurationMinutes = DURATION_MINUTES[0];

const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const fromMinutes = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** "240" → 240, or undefined when not one of the options. */
export function parseDuration(value: string): DurationMinutes | undefined {
  const n = Number(value);
  return (DURATION_MINUTES as readonly number[]).includes(n) ? (n as DurationMinutes) : undefined;
}

/** `HH:MM` end of a day that starts at `time` and lasts `duration` minutes. */
export function endTime(time: string, duration: DurationMinutes): string {
  return fromMinutes(toMinutes(time) + duration);
}

/** The instant a Japan-time date + `HH:MM` starts (Japan has no DST: always +09:00). */
export function jstInstant(date: IsoDate, time: string): number {
  return Date.parse(`${date}T${time}:00+09:00`);
}

/** Earliest instant a request may start: `now` + 48 h. */
export function requestCutoff(now: number): number {
  return now + REQUEST_LEAD_HOURS * HOUR;
}

/** Last bookable Japan date: request date (Japan) + 90 calendar days. */
export function latestRequestDate(now: number): IsoDate {
  return addDays(jstToday(new Date(now)), MAX_DAYS_AHEAD);
}

/** The day ends by 20:00 (an end of exactly 20:00 is allowed). */
export function fitsDayEnd(time: string, duration: DurationMinutes): boolean {
  return toMinutes(time) + duration <= toMinutes(DAY_END);
}

/** Why a date + start time (+ duration) cannot be requested, or `undefined` when it can. */
export type SlotProblem = "invalid" | "too_soon" | "too_far" | "ends_late";

/**
 * Checks one choice against the rules. Without a duration, the shortest
 * option is assumed (a start time no duration can fit is never allowed).
 */
export function slotProblem(date: string, time: string, now: number, duration: DurationMinutes = SHORTEST): SlotProblem | undefined {
  if (!isIsoDate(date) || !START_TIMES.includes(time)) return "invalid";
  if (date > latestRequestDate(now)) return "too_far";
  const start = jstInstant(date, time);
  if (!Number.isFinite(start)) return "invalid";
  if (start < requestCutoff(now)) return "too_soon";
  if (!fitsDayEnd(time, duration)) return "ends_late";
  return undefined;
}

export function isSlotAllowed(date: string, time: string, now: number, duration?: DurationMinutes): boolean {
  return slotProblem(date, time, now, duration) === undefined;
}

/** Start times that can still be requested on `date` for `duration`. */
export function allowedStartTimes(date: IsoDate, now: number, duration?: DurationMinutes): string[] {
  return START_TIMES.filter((t) => isSlotAllowed(date, t, now, duration));
}

/** First Japan date with at least one allowed start time for `duration`. */
export function earliestRequestDate(now: number, duration?: DurationMinutes): IsoDate {
  const cutoffDate = jstToday(new Date(requestCutoff(now)));
  return allowedStartTimes(cutoffDate, now, duration).length > 0 ? cutoffDate : addDays(cutoffDate, 1);
}

/** Date picker range for `duration` (shortest option when not chosen yet). */
export function requestDateRange(now: number, duration?: DurationMinutes): { min: IsoDate; max: IsoDate } {
  return { min: earliestRequestDate(now, duration), max: latestRequestDate(now) };
}

/**
 * After the date or duration changes (or time passes), keep the chosen start
 * time only if it is still allowed. `problem` tells the UI why it was cleared.
 */
export function reconcileStartTime(
  date: string,
  time: string,
  now: number,
  duration?: DurationMinutes,
): { time: string; cleared: boolean; problem?: SlotProblem } {
  if (!time) return { time, cleared: false };
  // Without a valid date only the day-end rule can be checked.
  if (!date || !isIsoDate(date)) {
    return duration && START_TIMES.includes(time) && !fitsDayEnd(time, duration)
      ? { time: "", cleared: true, problem: "ends_late" }
      : { time, cleared: false };
  }
  const problem = slotProblem(date, time, now, duration);
  // A date out of range is reported on the date field, not by clearing the time.
  if (problem === undefined || problem === "too_far" || problem === "invalid") return { time, cleared: false };
  return { time: "", cleared: true, problem };
}

// ---------------------------------------------------------------------------
// Form values

export type PrivateGuideRequestValues = {
  preferredDate: string;
  /** `HH:MM`, one of `START_TIMES`. */
  startTime: string;
  /** Minutes as a string: "240" | "360" | "480". Empty until chosen. */
  duration: string;
  alternateDate: string;
  /** Required when `alternateDate` is set. */
  alternateStartTime: string;
  adults: number;
  children: number;
  fullName: string;
  email: string;
  emailConfirm: string;
  country: string;
  phone: string;
  areas: AreaKey[];
  interests: PrivateGuideActivity[];
  message: string;
  consent: boolean;
  /** Honeypot. Real people leave it empty. */
  website: string;
};

export type PrivateGuideRequestField = Exclude<keyof PrivateGuideRequestValues, "website">;

export type PrivateGuideRequestErrors = Partial<Record<PrivateGuideRequestField, string>>;

/**
 * Result of a submit, whatever the handler (mock or API), following
 * Booking Request Contract 0.3:
 * - `not_sent_preview`: the mock. Nothing left the browser.
 * - `received`: HTTP 200, ok, accepted, `CR-YYYYMMDD-XXXXXX`, status REQUESTED.
 *   A request, NOT a confirmed booking.
 * - `invalid` (400) / `rule_violation` (422): not accepted; fix the form.
 *   `errors` holds the field errors the form can show (may be empty).
 * - `conflict` (409): the same submissionId came with a different body.
 * - `rate_limited` (429): not accepted; try again later.
 * - `not_accepted`: HTTP 200 with `accepted: false`. Never shown as success.
 * - `unknown` (503, network error, timeout, unreadable answer): the request
 *   MAY have been stored. Retry only with the same submissionId and body.
 * - `error`: any other answer that says it was not accepted.
 */
export type PrivateGuideRequestResult =
  | { ok: true; kind: "not_sent_preview" }
  | { ok: true; kind: "received"; bookingRef: string }
  | { ok: false; kind: "invalid" | "rule_violation"; errors: PrivateGuideRequestErrors }
  | { ok: false; kind: "conflict" | "rate_limited" | "not_accepted" | "error" }
  | { ok: false; kind: "unknown"; cause: "unavailable" | "network" | "timeout" | "unexpected" };

/**
 * Sends one prepared Contract 0.3 body. The form builds the body (and its
 * submissionId) once and re-sends the very same object on a retry.
 */
export type PrivateGuideRequestSubmitHandler = (body: BookingRequestBody) => Promise<PrivateGuideRequestResult>;

/** `mock`: nothing is sent and no success screen exists. `live`: the API handler is used. */
export type PrivateGuideRequestMode = "mock" | "live";

export type RejectedReason = "invalid" | "rule_violation" | "conflict" | "rate_limited" | "not_accepted" | "error";

/** What the form shows after a submit attempt. */
export type PrivateGuideRequestOutcome =
  | { name: "editing" }
  | { name: "not_sent_preview" }
  | { name: "received"; bookingRef: string }
  /** Not accepted: the traveller may change the form (a new submissionId is made then). */
  | { name: "rejected"; reason: RejectedReason }
  /** Result unknown: keep the same submissionId and body; never say "not sent". */
  | { name: "unknown" };

/**
 * Maps a submit result to what the form shows. The success screen needs
 * `live` mode AND a `CR-YYYYMMDD-XXXXXX` reference: in `mock` mode it is
 * never shown. A malformed success is treated as unknown (it may be stored).
 */
export function outcomeFor(result: PrivateGuideRequestResult, mode: PrivateGuideRequestMode): PrivateGuideRequestOutcome {
  if (result.ok) {
    if (result.kind === "received") {
      if (mode !== "live") return { name: "not_sent_preview" };
      return BOOKING_REF.test(result.bookingRef) ? { name: "received", bookingRef: result.bookingRef } : { name: "unknown" };
    }
    return { name: "not_sent_preview" };
  }
  if (result.kind === "unknown") return { name: "unknown" };
  return { name: "rejected", reason: result.kind };
}

export const REQUEST_LIMITS = {
  fullName: 100,
  email: 254,
  country: 60,
  phone: 30,
  message: 2000,
} as const;

/** Form field order, used to focus the first field with an error. */
export const REQUEST_FIELD_ORDER: PrivateGuideRequestField[] = [
  "duration",
  "preferredDate",
  "startTime",
  "alternateDate",
  "alternateStartTime",
  "adults",
  "children",
  "fullName",
  "email",
  "emailConfirm",
  "country",
  "phone",
  "areas",
  "interests",
  "message",
  "consent",
];

export const EMPTY_REQUEST: PrivateGuideRequestValues = {
  preferredDate: "",
  startTime: "",
  duration: "",
  alternateDate: "",
  alternateStartTime: "",
  adults: 1,
  children: 0,
  fullName: "",
  email: "",
  emailConfirm: "",
  country: "",
  phone: "",
  areas: [],
  interests: [],
  message: "",
  consent: false,
  website: "",
};

// Pragmatic check: something@domain.tld, no spaces. The server validates again.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[0-9 ()-]{6,}$/;

export const MESSAGES = {
  tooSoon: `Requests close ${REQUEST_LEAD_HOURS} hours before the start time (Japan time). Choose a later date or time.`,
  tooFar: `You can request dates up to ${MAX_DAYS_AHEAD} days ahead (Japan time). Choose an earlier date.`,
  endsLate: (duration: DurationMinutes) =>
    `With ${duration / 60} hours, this start time would end after ${DAY_END}. Choose an earlier time, or contact us about a later finish.`,
  party: `Up to ${MAX_PARTY_SIZE} people (adults and children) per request. For a larger group, please contact us.`,
} as const;

/** Date + start time pair, shared by the preferred and the alternative choice. */
function checkDateTime(
  date: string,
  time: string,
  now: number,
  duration: DurationMinutes | undefined,
): { date?: string; time?: string } {
  if (!isIsoDate(date)) return { date: "Choose a date from the calendar." };
  const range = requestDateRange(now, duration);
  if (date > range.max) return { date: MESSAGES.tooFar };
  // Before the first date that has any allowed time: the whole day is too soon.
  if (date < range.min) return { date: MESSAGES.tooSoon };
  if (!time) return { time: "Choose a start time." };
  const problem = slotProblem(date, time, now, duration);
  if (problem === "invalid") return { time: "Choose a start time from the list." };
  if (problem === "too_soon") return { time: MESSAGES.tooSoon };
  if (problem === "ends_late") return { time: MESSAGES.endsLate(duration ?? SHORTEST) };
  return {};
}

/**
 * Client-side validation, with `now` in milliseconds (the moment of submit).
 * The future API must validate again: this only helps the traveller fix
 * mistakes before sending.
 */
export function validatePrivateGuideRequest(v: PrivateGuideRequestValues, now: number): PrivateGuideRequestErrors {
  const e: PrivateGuideRequestErrors = {};

  const duration = parseDuration(v.duration);
  if (!v.duration) e.duration = "Choose how long you would like your guide.";
  else if (!duration) e.duration = "Choose 4, 6 or 8 hours.";

  if (!v.preferredDate) {
    e.preferredDate = "Choose your preferred date.";
    if (!v.startTime) e.startTime = "Choose a start time.";
  } else {
    const r = checkDateTime(v.preferredDate, v.startTime, now, duration);
    if (r.date) e.preferredDate = r.date;
    if (r.time) e.startTime = r.time;
  }

  if (v.alternateDate || v.alternateStartTime) {
    if (!v.alternateDate) {
      e.alternateDate = "Choose an alternative date, or clear the alternative start time.";
    } else {
      const r = checkDateTime(v.alternateDate, v.alternateStartTime, now, duration);
      if (r.date) e.alternateDate = r.date;
      if (r.time) e.alternateStartTime = r.time;
      if (!r.date && !r.time && v.alternateDate === v.preferredDate && v.alternateStartTime === v.startTime) {
        e.alternateStartTime = "Choose a different date or time from your first choice.";
      }
    }
  }

  if (!Number.isInteger(v.adults) || v.adults < MIN_ADULTS) e.adults = "At least 1 adult is required.";
  if (!Number.isInteger(v.children) || v.children < 0) e.children = "Enter 0 or more.";
  if (!e.adults && !e.children && v.adults + v.children > MAX_PARTY_SIZE) e.adults = MESSAGES.party;

  const name = v.fullName.trim();
  if (!name) e.fullName = "Enter your full name.";
  else if (name.length > REQUEST_LIMITS.fullName) e.fullName = `Use ${REQUEST_LIMITS.fullName} characters or fewer.`;

  const email = v.email.trim();
  if (!email) e.email = "Enter your email address.";
  else if (email.length > REQUEST_LIMITS.email || !EMAIL.test(email)) e.email = "Enter a valid email address, e.g. name@example.com.";
  if (!e.email) {
    if (!v.emailConfirm.trim()) e.emailConfirm = "Enter your email address again.";
    else if (v.emailConfirm.trim().toLowerCase() !== email.toLowerCase()) e.emailConfirm = "The email addresses don't match.";
  }

  if (v.country.trim().length > REQUEST_LIMITS.country) e.country = `Use ${REQUEST_LIMITS.country} characters or fewer.`;

  const phone = v.phone.trim();
  if (phone && (phone.length > REQUEST_LIMITS.phone || !PHONE.test(phone))) {
    e.phone = "Use digits, spaces, + ( ) or - only, including the country code.";
  }

  if (v.message.length > REQUEST_LIMITS.message) e.message = `Use ${REQUEST_LIMITS.message} characters or fewer.`;

  if (!v.consent) e.consent = "Please agree before sending your request.";

  return e;
}

/**
 * MOCK. Sends nothing: no network request, no storage, no logging of the
 * values. Always answers `not_sent_preview` so the UI cannot show success.
 */
export const mockSubmitPrivateGuideRequest: PrivateGuideRequestSubmitHandler = () =>
  new Promise((resolve) => setTimeout(() => resolve({ ok: true, kind: "not_sent_preview" }), 500));
