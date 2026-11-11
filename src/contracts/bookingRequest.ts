import type { AreaKey } from "./experience";
import type { FieldErrorCode, FieldErrors } from "./form";
import type { PrivateGuideActivity } from "./inquiry";

/**
 * Booking Request Contract 0.3 (Private Guide Booking Rules V1.1).
 *
 * Wire types for `POST /api/v1/booking-requests`. This is a request, not a
 * held slot and not a confirmed booking. Price is never part of the request.
 * Runtime checks live in `src/lib/booking-request/` and must match Apps Script.
 * The hosted-checkout types in `booking.ts` stay as they are.
 */

export type BookingRequestLocale = "ja" | "en" | "zh-TW" | "ko";

export type PrivateGuideDurationMinutes = 240 | 360 | 480;

export type BookingRequestField =
  | "submissionId"
  | "locale"
  | "productType"
  | "experienceId"
  | "planId"
  | "date"
  | "startTime"
  | "durationMinutes"
  | "alternateDate"
  | "alternateStartTime"
  | "adults"
  | "children"
  | "name"
  | "email"
  | "phone"
  | "country"
  | "areas"
  | "interests"
  | "notes"
  | "consent"
  | "amount"
  | "price"
  | "currency";

export type BookingRequestFieldErrors = FieldErrors<BookingRequestField>;

export type BookingRequestErrorCode = FieldErrorCode;

/** Reasons the server refuses a syntactically readable request. */
export type BookingRequestUnavailableReason =
  | "too_soon"
  | "too_far"
  | "ends_after_close"
  | "same_choice"
  | "booking_closed";

/** A Private Guide request that has passed Contract 0.3 checks. */
export type PrivateGuideBookingRequest = {
  submissionId: string;
  locale: BookingRequestLocale;
  productType: "private_guide";
  experienceId: null;
  planId: null;
  /** `YYYY-MM-DD` in Asia/Tokyo. */
  date: string;
  /** `HH:mm` from the 08:00–17:00 list. */
  startTime: string;
  durationMinutes: PrivateGuideDurationMinutes;
  alternateDate: string | null;
  alternateStartTime: string | null;
  adults: number;
  children: number;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  areas: AreaKey[];
  interests: PrivateGuideActivity[];
  notes: string | null;
  consent: true;
};

export type BookingRequestSuccess = {
  ok: true;
  accepted: true;
  bookingRef: string;
  status: "REQUESTED";
  replayed: boolean;
};

/** Honeypot answer. No booking reference, so the UI must not show a confirmation. */
export type BookingRequestHoneypotResponse = {
  ok: true;
  accepted: false;
};

export type BookingRequestFailure =
  | { ok: false; kind: "validation"; fieldErrors: BookingRequestFieldErrors }
  | {
      ok: false;
      kind: "unavailable";
      reason: BookingRequestUnavailableReason;
      fieldErrors?: BookingRequestFieldErrors;
    }
  | { ok: false; kind: "conflict" }
  | { ok: false; kind: "rate_limited" }
  | { ok: false; kind: "server" };

export type BookingRequestResponse =
  | BookingRequestSuccess
  | BookingRequestHoneypotResponse
  | BookingRequestFailure;
