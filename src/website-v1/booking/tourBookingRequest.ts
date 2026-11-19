import type { IsoDate } from "@/contracts";
import { addDays, isIsoDate, jstToday } from "../content/guides/freshness";
import type { BookableTour } from "@/lib/booking-request/tours";
import { UUID_V4, type TourBookingRequestBody } from "./bookingRequestContract";
import { jstInstant, type PrivateGuideRequestErrors } from "./privateGuideRequest";

/**
 * Ready-made tour Booking Request form logic (2026-11-17). The tour's own
 * rules (start times, party size, languages, window) come from its entry in
 * `src/lib/booking-request/tours.ts`, the same entry the API checks against.
 * The browser checks only help the guest; the API decides.
 */

export type TourRequestValues = {
  preferredDate: string;
  startTime: string;
  guests: number;
  language: string;
  fullName: string;
  email: string;
  message: string;
  consent: boolean;
  /** Honeypot (hidden). */
  website: string;
};

export type TourRequestField = Exclude<keyof TourRequestValues, "website">;
export type TourRequestErrors = Partial<Record<TourRequestField, string>>;

export const TOUR_FIELD_ORDER: TourRequestField[] = ["preferredDate", "startTime", "guests", "language", "fullName", "email", "message", "consent"];

export const TOUR_LIMITS = { fullName: 100, email: 254, message: 2000 } as const;

/** Same pattern as the API (src/lib/booking-request/rules.ts). */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HOUR = 60 * 60 * 1000;

/** The required wording (Human instruction 2026-11-17). */
export const TOUR_REQUEST_NOTICE =
  "This is a booking request, not a confirmed reservation. Our team will review your request and contact you by email.";

export function emptyTourRequest(tour: BookableTour): TourRequestValues {
  return {
    preferredDate: "",
    // One start time or one language: chosen already (the guest can still see it).
    startTime: tour.startTimes.length === 1 ? tour.startTimes[0] : "",
    guests: tour.minGuests,
    language: tour.languages.length === 1 ? tour.languages[0].code : "",
    fullName: "",
    email: "",
    message: "",
    consent: false,
    website: "",
  };
}

/** True when the tour can start at `time` on `date` (Japan time) at least `leadHours` after `now`. */
function startsLateEnough(tour: BookableTour, date: IsoDate, time: string, now: number): boolean {
  const start = jstInstant(date, time);
  return Number.isFinite(start) && start >= now + tour.leadHours * HOUR;
}

/**
 * Date picker range (Japan dates): the first date with at least one start
 * time far enough ahead, to today + maxDaysAhead. Past dates are never in it.
 */
export function tourDateRange(tour: BookableTour, now: number): { min: IsoDate; max: IsoDate } {
  const today = jstToday(new Date(now));
  const max = addDays(today, tour.maxDaysAhead);
  let min = jstToday(new Date(now + tour.leadHours * HOUR));
  if (!tour.startTimes.some((t) => startsLateEnough(tour, min, t, now))) min = addDays(min, 1);
  return { min, max };
}

/** Start times still possible on `date` (all of them when no date is chosen yet). */
export function tourStartTimes(tour: BookableTour, date: string, now: number): string[] {
  if (!isIsoDate(date)) return [...tour.startTimes];
  return tour.startTimes.filter((t) => startsLateEnough(tour, date, t, now));
}

export function validateTourRequest(tour: BookableTour, v: TourRequestValues, now: number): TourRequestErrors {
  const e: TourRequestErrors = {};
  const range = tourDateRange(tour, now);

  if (!v.preferredDate) e.preferredDate = "Choose your preferred date.";
  else if (!isIsoDate(v.preferredDate)) e.preferredDate = "Choose a date from the calendar.";
  else if (v.preferredDate < range.min) e.preferredDate = `Requests close ${tour.leadHours} hours before the tour starts (Japan time). Choose a later date.`;
  else if (v.preferredDate > range.max) e.preferredDate = `You can request dates up to ${tour.maxDaysAhead} days ahead. Choose an earlier date.`;

  if (!v.startTime) e.startTime = "Choose a start time.";
  else if (!tour.startTimes.includes(v.startTime)) e.startTime = "Choose a start time from the list.";
  else if (!e.preferredDate && v.preferredDate && !startsLateEnough(tour, v.preferredDate, v.startTime, now)) {
    e.startTime = `Requests close ${tour.leadHours} hours before the tour starts (Japan time). Choose a later date.`;
  }

  if (!Number.isInteger(v.guests) || v.guests < tour.minGuests || v.guests > tour.maxGuests) {
    e.guests = `Choose ${tour.minGuests}–${tour.maxGuests} guests. For a larger group, please contact us.`;
  }

  if (!v.language) e.language = "Choose a language.";
  else if (!tour.languages.some((l) => l.code === v.language)) e.language = "Choose a language from the list.";

  const name = v.fullName.trim();
  if (!name) e.fullName = "Enter your full name.";
  else if (name.length > TOUR_LIMITS.fullName) e.fullName = `Use ${TOUR_LIMITS.fullName} characters or fewer.`;

  const email = v.email.trim();
  if (!email) e.email = "Enter your email address.";
  else if (email.length > TOUR_LIMITS.email || !EMAIL.test(email)) e.email = "Enter a valid email address, e.g. name@example.com.";

  if (v.message.length > TOUR_LIMITS.message) e.message = `Use ${TOUR_LIMITS.message} characters or fewer.`;
  if (!v.consent) e.consent = "Please agree before sending your request.";
  return e;
}

/** The API body for values that passed `validateTourRequest`. Undefined when something required is missing. */
export function toTourRequestBody(tour: BookableTour, v: TourRequestValues, submissionId: string): TourBookingRequestBody | undefined {
  if (!UUID_V4.test(submissionId) || !v.preferredDate || !v.startTime || !v.language || !v.consent) return undefined;
  return {
    submissionId,
    locale: "en",
    productType: "ready_made",
    experienceId: tour.experienceId,
    planId: null,
    date: v.preferredDate,
    startTime: v.startTime,
    adults: v.guests,
    children: 0,
    language: v.language,
    name: v.fullName.trim(),
    email: v.email.trim(),
    phone: null,
    country: null,
    notes: v.message.trim(),
    consent: true,
    website: v.website,
  };
}

/** Field errors from the API (already mapped to the Private Guide field names by bookingRequestApi) → this form's fields. */
export function tourErrorsFromServer(errors: PrivateGuideRequestErrors): TourRequestErrors {
  const out: TourRequestErrors = {};
  if (errors.preferredDate) out.preferredDate = errors.preferredDate;
  if (errors.startTime) out.startTime = errors.startTime;
  if (errors.adults) out.guests = errors.adults;
  if (errors.fullName) out.fullName = errors.fullName;
  if (errors.email) out.email = errors.email;
  if (errors.message) out.message = errors.message;
  if (errors.consent) out.consent = errors.consent;
  return out;
}
