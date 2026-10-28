import type { CtaSpec } from "./cta";
import type { AreaKey } from "./experience";
import type { PrivateGuideActivity } from "./inquiry";
import type { PageViewModel } from "./pages";
import type { Tbd } from "./status";

/**
 * Private Day Planner v1 — PROTOTYPE / PENDING HUMAN VISUAL REVIEW.
 *
 * After a Private Guide booking (time slot bought, W1-D16), the traveller
 * tells Connectrip what they would like; Connectrip uses it to propose the
 * route, places and experiences. Not an Inquiry (questions before booking)
 * and not the Booking itself:  Inquiry ≠ Booking ≠ Planner.
 *
 * Every shape here is PROPOSED; the backend schema is decided with the
 * Booking design.
 */

/** The 11-field Private Guide information model (v1). */
export type PrivateGuideInfoField =
  // customer
  | "name"
  | "email"
  // trip
  | "travelDate"
  | "adults"
  | "children"
  | "area"
  // preferences
  | "interests"
  | "places"
  | "idealDay"
  | "anythingElse"
  // legal
  | "consent";

/** Where each field is collected, so nothing is asked twice. */
export type PrivateGuideFieldOwner = "booking" | "planner" | "consent_tbd";

export type PrivateGuideFieldSpec = {
  owner: PrivateGuideFieldOwner;
  required: boolean;
};

/** Preference questions answered in the Planner (the rest comes from the booking). */
export type PlannerQuestionKey = "interests" | "places" | "idealDay" | "anythingElse";

/**
 * Booking details shown read-only at the top of the Planner. Later read from
 * the booking record by `bookingId`; in the prototype it is demo data.
 */
export type PlannerBookingSummary = {
  /** DEMO data: never a real customer. */
  demo: boolean;
  bookingId: string;
  customerName: string;
  /** YYYY-MM-DD (Japan). */
  travelDate: string;
  areas: AreaKey[];
  adults: number;
  children: number;
};

type PlannerQuestionBase<K extends PlannerQuestionKey> = {
  key: K;
  heading: Tbd<string>;
  supporting: Tbd<string>;
};

export type PlannerQuestion =
  | (PlannerQuestionBase<"interests"> & {
      kind: "multiselect";
      options: { value: PrivateGuideActivity; label: Tbd<string> }[];
    })
  | (PlannerQuestionBase<"places" | "idealDay" | "anythingElse"> & {
      kind: "textarea";
      placeholder: Tbd<string>;
      maxLength: number;
    });

export type PlannerConsent = {
  /** PROPOSED COPY, not legal-approved (M-I3 / M-3: decided before launch). */
  label: Tbd<string>;
  privacyHref: string;
};

export type PrivateDayPlannerContent = {
  mode: "prototype" | "live";
  eyebrow: Tbd<string>;
  heading: Tbd<string>;
  supporting: Tbd<string>;
  booking: PlannerBookingSummary;
  questions: PlannerQuestion[];
  consent: PlannerConsent;
  submitLabel: Tbd<string>;
  successMessage: Tbd<string>;
  backCta: CtaSpec<"privateGuide">;
};

export type PrivateDayPlannerViewModel = PageViewModel<"privateDayPlanner", PrivateDayPlannerContent>;

/**
 * What a submitted Planner will hold (future; no DB yet). One booking has at
 * most one response: Booking 1 — 0..1 PlannerResponse. Together with the
 * booking's area, plan duration and guests, it is the input for an internal
 * "Recommended Itinerary Draft" (future; never sent to customers automatically).
 */
export type PlannerResponse = {
  bookingId: string;
  interests: PrivateGuideActivity[];
  places?: string;
  idealDay?: string;
  anythingElse?: string;
  /** ISO timestamps. */
  consentAt: string;
  submittedAt: string;
};

/** Prototype submit: validates and resolves locally; nothing is sent or stored. */
export type PlannerSubmitHandler = (response: PlannerResponse) => Promise<{ ok: true } | { ok: false; message: string }>;
