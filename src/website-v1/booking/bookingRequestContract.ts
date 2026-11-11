/**
 * Booking Request Contract 0.3 — LOCAL STAND-IN.
 *
 * The shared contract lives in `src/contracts/bookingRequest.ts`, owned by
 * the API side (Cursor). It does not exist on this branch yet, so the shapes
 * the website needs are written here from the Contract 0.3 instruction
 * (2026-11-10). Nothing else in the website declares them: the adapter
 * (`bookingRequestApi.ts`) imports from this file only.
 *
 * When `src/contracts/bookingRequest.ts` lands, replace this whole file with
 *
 *   export type { … } from "@/contracts/bookingRequest";
 *
 * (and the constants, if the contract exports them), then fix any name that
 * differs. Do not edit `src/contracts/**` from the website side.
 */

/** POST, JSON body, `Idempotency-Key` header = body `submissionId`. */
export const BOOKING_REQUEST_PATH = "/api/v1/booking-requests";

/** UUID v4 (lower or upper case). */
export const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * `CR-YYYYMMDD-XXXXXX`. The X characters are taken as uppercase letters or
 * digits: CHECK against Contract 0.3 (the instruction does not say).
 */
export const BOOKING_REF = /^CR-\d{8}-[A-Z0-9]{6}$/;

export type BookingRequestDurationMinutes = 240 | 360 | 480;

/** Request body. Flat: no `customer` / `preferences` objects, no `timeZone`. */
export type BookingRequestBody = {
  /** UUID v4, also sent as the `Idempotency-Key` header. */
  submissionId: string;
  locale: "en";
  productType: "private_guide";
  experienceId: null;
  planId: null;
  /** `YYYY-MM-DD`, Japan date. */
  date: string;
  /** `HH:MM`, Japan time. */
  startTime: string;
  durationMinutes: BookingRequestDurationMinutes;
  alternateDate: string | null;
  alternateStartTime: string | null;
  adults: number;
  children: number;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  areas: string[];
  interests: string[];
  /** Free text; "" when empty. */
  notes: string;
  consent: true;
  /** Honeypot; "" for real people. */
  website: string;
};

/** The only accepted-success shape (HTTP 200). */
export type BookingRequestAccepted = {
  ok: true;
  accepted: true;
  bookingRef: string;
  status: "REQUESTED";
};

/** Request body field names, as the server reports them in field errors. */
export type BookingRequestField = keyof BookingRequestBody;
