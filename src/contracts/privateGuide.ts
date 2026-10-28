import type { CtaSpec } from "./cta";
import type { AreaKey, FaqItem, Itinerary } from "./experience";
import type { HowItWorksFlow } from "./howItWorks";
import type { PrivateGuideActivity } from "./inquiry";
import type { ImageAsset } from "./media";
import type { Money, PaymentCurrency } from "./money";
import type { PageViewModel } from "./pages";
import type { PersonPreview } from "./person";
import type { Tbd } from "./status";

/**
 * Private Guide (Website v1 §3B). Since W1-D16 the standard flow is slot
 * booking: choose a plan, date, start time and guests → Book Now → payment →
 * Connectrip final confirmation → confirmed → plan the day together → tour.
 * The traveller buys a Connectrip time slot first and shapes the day with us
 * afterwards. Inquiry stays as a secondary flow for questions before booking.
 * Plans, durations, prices, selling hours and limits are TBD.
 */
export type PrivateGuideActivityItem = {
  key: PrivateGuideActivity;
  label: Tbd<string>;
  description?: Tbd<string>;
  image?: Tbd<ImageAsset>;
};

export type PrivateGuideAreaItem = {
  key: AreaKey;
  label: Tbd<string>;
  image?: Tbd<ImageAsset>;
};

/** An illustrative day. Never a fixed plan or a promise. */
export type ExampleDay = {
  title: Tbd<string>;
  itinerary: Itinerary;
};

export type PrivateGuideContent = {
  intro: {
    headline: Tbd<string>;
    supporting: Tbd<string>;
    image: Tbd<ImageAsset>;
  };
  activities: PrivateGuideActivityItem[];
  areas: PrivateGuideAreaItem[];
  exampleDays?: Tbd<ExampleDay[]>;
  /** Shared Private Guide flow (Home / How It Works). The product page shows `bookingSteps` instead when present. */
  flow: HowItWorksFlow<"private_guide">;
  /** Why a private guide rather than a fixed tour (product page). */
  why?: { heading: Tbd<string>; points: { title: Tbd<string>; description: Tbd<string> }[] };
  /**
   * Booking-first steps for the product page (Human Decision 2026-10-25):
   * choose plan → date & time → book → plan the day together → explore.
   */
  bookingSteps?: { heading: Tbd<string>; steps: { title: Tbd<string>; description: Tbd<string> }[] };
  /** Price is given per request after consultation (amounts TBD). */
  pricingNote: Tbd<string>;
  /** Real guides only (WD-003). */
  guides?: PersonPreview[];
  faq?: Tbd<FaqItem[]>;
  /** Questions before booking (secondary since W1-D16). */
  inquiryCta: CtaSpec<"inquiry">;
  /**
   * The page's next step: book (primary → booking page) or ask first
   * (secondary → Inquiry). Booking and Inquiry stay separate routes.
   */
  bookingEntry?: { book: CtaSpec<"privateGuideBooking">; ask: CtaSpec<"inquiry"> };
  /** Slot booking UI (W1-D16), embedded. Since the unified flow it lives on the booking page. */
  booking?: PrivateGuideBookingModel;
  /** For travellers who prefer a ready-made experience. */
  experiencesCta?: CtaSpec<"experiences">;
};

export type PrivateGuideViewModel = PageViewModel<"privateGuide", PrivateGuideContent>;

// --- Slot booking (W1-D16) ---------------------------------------------------

/**
 * Connectrip-wide selling slots (W1-D16): the site sells time slots Connectrip
 * can serve, never a specific guide's calendar. Guides are assigned after
 * booking.
 */
export type PrivateGuidePlanId = string;

/** Pricing shape. Replaced by the Product / Pricing contract when prices are decided. */
export type PrivateGuidePricing = {
  /** One price for the whole private group, whatever the party size. */
  kind: "per_group";
  amount: Money<PaymentCurrency>;
};

export type PrivateGuidePlan = {
  id: PrivateGuidePlanId;
  name: Tbd<string>;
  summary?: Tbd<string>;
  durationMinutes: number;
  pricing: Tbd<PrivateGuidePricing>;
  /** DEMO / PROTOTYPE product data: never sold. */
  demo: boolean;
};

/** `HH:MM` in Japan time. */
export type ClockTime = string;

/**
 * Availability as data the booking UI can evaluate. Prototype: mock data from
 * the content layer. Later: an Availability API answering the same questions
 * (bookable dates, and whether start + duration fits a free window).
 */
export type PrivateGuideAvailability = {
  source: "mock" | "api";
  /** Bookable dates (YYYY-MM-DD, Japan). Other dates render disabled. */
  dates: string[];
  /** Candidate start times offered on every bookable date. */
  startTimes: ClockTime[];
  /** Selling window: a slot must start and end inside it. */
  windowStart: ClockTime;
  windowEnd: ClockTime;
  /** Unavailable ranges per date (half-open `[from, to)`). */
  blocked: Record<string, { from: ClockTime; to: ClockTime }[]>;
};

/** Private Guide booking states (W1-D16). Differs from ready-made (no final confirmation step). */
export type PrivateGuideBookingStatus =
  | "PENDING_PAYMENT"
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "COMPLETED";

export type PrivateGuideBookingModel = {
  /** `prototype`: Book Now never creates a booking or opens a payment. */
  mode: "prototype" | "live";
  plans: PrivateGuidePlan[];
  availability: PrivateGuideAvailability;
  /** Steps after Book Now, shown so payment is not mistaken for the final confirmation. */
  steps: Tbd<string>[];
  cancellationNote: Tbd<string>;
  bookLabel: Tbd<string>;
  /** "Have questions before booking?" → Inquiry. Must stay less prominent than Book Now. */
  questions: { prompt: Tbd<string>; cta: CtaSpec<"inquiry"> };
  /** Prototype only: after the demo Book Now, a link to preview the Private Day Planner. */
  plannerPreview?: CtaSpec<"privateDayPlanner">;
};
