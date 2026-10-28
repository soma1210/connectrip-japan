import type { CtaSpec } from "./cta";
import type { Money, PaymentCurrency } from "./money";
import type { PageViewModel } from "./pages";
import type { PrivateGuideBookingModel, PrivateGuidePlanId, ClockTime } from "./privateGuide";
import type { Tbd } from "./status";
import type { IsoDate } from "./travelGuide";

/**
 * Private Guide Unified Booking Flow v1 — PROTOTYPE / PENDING HUMAN VISUAL REVIEW.
 *
 * One booking flow on screen (plan → date → start time → guests → about your
 * trip → summary → Continue to Payment), but not one big object: the request
 * is split by responsibility so a future Admin / CRM can show Customers,
 * Bookings, Trip Preferences, Acquisition and Payments separately.
 *
 * Booking ≠ Inquiry (questions before booking) ≠ Private Day Planner
 * (optional, more detailed itinerary wishes after booking).
 * All shapes are PROPOSED; the backend schema is decided with the Booking design.
 */

/** What the traveller wants to do on the Private Guide day (booking preferences). */
export type BookingInterest =
  | "food_dining"
  | "culture_heritage"
  | "shopping"
  | "famous_sights"
  | "hidden_gems"
  | "local_neighborhoods"
  | "family_activities"
  | "active_experiences"
  | "other";

/**
 * Self-reported discovery source ("How did you find us?"). Separate from the
 * measured source (UTM / referrer / GA4), which the server attaches later.
 */
export type SelfReportedSource =
  | "google"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "ai_chatgpt"
  | "friend_family"
  | "travel_agent"
  | "hotel"
  | "other";

/** ISO 3166-1 alpha-2, e.g. "US". */
export type CountryCode = string;

// --- What the flow submits (one request, separate parts) --------------------

export type BookingSelectionInput = {
  planId: PrivateGuidePlanId;
  bookingDate: IsoDate;
  startTime: ClockTime;
  adults: number;
  children: number;
};

export type CustomerProfileInput = {
  fullName: string;
  email: string;
  countryOfResidence: CountryCode;
};

/** The traveller's Japan / Kansai trip window and wishes. Not the booking date. */
export type TripPreferencesInput = {
  arriving: IsoDate;
  leaving: IsoDate;
  interests: BookingInterest[];
  tripDescription?: string;
};

export type AcquisitionInput = {
  selfReportedSource?: SelfReportedSource;
};

/** Consent wording and what is consented to are a Human / legal decision (TBD). */
export type BookingConsentInput = {
  /** ISO timestamp when the (PROPOSED) booking consent box was ticked. */
  acceptedAt: string;
};

export type PrivateGuideBookingRequest = {
  selection: BookingSelectionInput;
  customer: CustomerProfileInput;
  trip: TripPreferencesInput;
  acquisition: AcquisitionInput;
  consent: BookingConsentInput;
};

/** Prototype: validates and resolves locally. Live: creates PENDING_PAYMENT and returns a payment URL. */
export type PrivateGuideBookingSubmitHandler = (
  request: PrivateGuideBookingRequest,
) => Promise<{ ok: true; paymentUrl?: string } | { ok: false; message: string }>;

// --- Form content -----------------------------------------------------------

export type BookingFormOption<V extends string> = { value: V; label: Tbd<string> };

export type AboutYourTripContent = {
  heading: Tbd<string>;
  supporting: Tbd<string>;
  countries: { value: CountryCode; label: string }[];
  interests: BookingFormOption<BookingInterest>[];
  tripDescription: { label: Tbd<string>; help: Tbd<string>; placeholder: Tbd<string>; maxLength: number };
  sources: BookingFormOption<SelfReportedSource>[];
  /** PROPOSED / LEGAL REVIEW REQUIRED. Not the Inquiry or marketing consent. */
  consent: { label: Tbd<string>; termsHref: string; privacyHref: string };
};

export type PrivateGuideBookingPageContent = {
  intro: { headline: Tbd<string>; supporting: Tbd<string> };
  booking: PrivateGuideBookingModel;
  details: AboutYourTripContent;
  /** Shown after Continue to Payment while payment is not connected. */
  paymentNotice: Tbd<string>;
  backCta: CtaSpec<"privateGuide">;
};

export type PrivateGuideBookingPageViewModel = PageViewModel<"privateGuideBooking", PrivateGuideBookingPageContent>;

// --- Future records (Architecture reference only; no DB / migration yet) ----

export type CustomerRecord = {
  customerId: string;
  fullName: string;
  email: string;
  countryOfResidence: CountryCode;
};

export type PrivateGuideBookingRecord = {
  bookingId: string;
  customerId: string;
  service: "private_guide";
  planId: PrivateGuidePlanId;
  bookingDate: IsoDate;
  startTime: ClockTime;
  durationMinutes: number;
  adults: number;
  children: number;
  total: Money<PaymentCurrency>;
  bookingStatus: "PENDING_PAYMENT" | "PENDING_CONFIRMATION" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "EXPIRED";
};

export type TripPreferencesRecord = TripPreferencesInput & { bookingId: string };

/** Self-reported and measured sources side by side. Never holds PII. */
export type AcquisitionRecord = {
  bookingId: string;
  selfReportedSource?: SelfReportedSource;
  measuredSource?: string;
  medium?: string;
  campaign?: string;
  landingPage?: string;
  firstTouch?: string;
};

export type PaymentRecord = {
  bookingId: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  amount: Money<PaymentCurrency>;
};
