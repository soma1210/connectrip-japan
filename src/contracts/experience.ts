import type { CtaSpec } from "./cta";
import type { ImageAsset } from "./media";
import type { Money, PaymentCurrency } from "./money";
import type { SeoMeta } from "./seo";
import type { RecordStatus, Tbd } from "./status";

/**
 * Guide Product id, e.g. "GP-OSA-01" (Website Brain §8). The area segment is
 * a naming convention, not part of the type: v1 is Osaka-first, and other
 * areas (e.g. Kyoto, Kobe, Nara) must fit without a contract change.
 */
export type ExperienceId = `GP-${string}`;

/**
 * Area keys. Used for Experience markets and for Private Guide destinations.
 * Labels are rendered from content, never from these keys.
 */
export type AreaKey = "osaka" | "kyoto" | "kobe" | "nara" | "other";

export type DurationRange = {
  minMinutes: number;
  maxMinutes: number;
};

export type AgeFit = {
  /** Youngest recommended age in years. 0 = all ages. */
  minAge: number;
  maxAge?: number;
};

export type WalkingIntensity = "low" | "low_medium" | "medium" | "medium_high";

/**
 * Who shares the experience. Not to be confused with the Private Guide
 * product (a custom, consultation-based service).
 */
export type ParticipationFormat = "private_party" | "shared";

export type VisitExperience = "first_visit" | "repeat_visit" | "any";

export type PriceUnit = "per_group" | "per_person";

/**
 * Price is shown as a structure, not a bare number: what the fee covers and
 * per what unit. Everything stays TBD until a human approves it. v1 prices
 * are JPY (Working Decision, T-03).
 */
export type PriceStructure = {
  unit: Tbd<PriceUnit>;
  amount: Tbd<Money<PaymentCurrency>>;
  notes?: Tbd<string>;
};

export type ItineraryStep = {
  title: Tbd<string>;
  description?: Tbd<string>;
};

export type Itinerary = {
  steps: ItineraryStep[];
  /** Route plans are illustrative, never a fixed route promise. */
  isExample: true;
};

export type FaqItem = {
  question: Tbd<string>;
  answer: Tbd<string>;
};

/**
 * A bookable variant of one Experience (e.g. a shorter and a longer version).
 * Whether variants such as 4h / 8h exist, and whether they are options of one
 * Experience or separate Experiences, is TBD.
 */
export type BookingOption = {
  id: string;
  label: Tbd<string>;
  duration: Tbd<DurationRange>;
  price: PriceStructure;
};

export type ChildrenPolicy = {
  allowed: boolean;
  /** Youngest age accepted, in years. */
  minAge?: number;
  /** Whether children count toward `maxGuests`. */
  countsTowardCapacity?: boolean;
  notes?: string;
};

export type CancellationPolicySummary = {
  summary: string;
  /** Full policy page, when one exists. */
  href?: string;
};

/**
 * What happens after a successful payment. Not decided (T-03): the Booking
 * Flow supports both through `payment_completed_pending_confirmation`.
 */
export type ConfirmationMode = "automatic_on_payment" | "human_review";

/**
 * Booking conditions of a Ready-made Experience. Every value is TBD until a
 * human decides it. Availability itself is never in this object: it comes
 * from `BookingAvailabilityHandler` (rules are TBD and owned by the server).
 */
export type BookingConditions = {
  options: Tbd<BookingOption[]>;
  minGuests: Tbd<number>;
  maxGuests: Tbd<number>;
  childrenPolicy: Tbd<ChildrenPolicy>;
  /** Display text only (e.g. start time window). Not used for logic. */
  operatingHours: Tbd<string>;
  cancellationPolicy: Tbd<CancellationPolicySummary>;
  confirmationMode: Tbd<ConfirmationMode>;
};

/**
 * Whether the booking flow accepts bookings for this Experience. Set by the
 * content layer (e.g. "closed" while product, price or Stripe are not ready).
 */
export type BookingAvailabilityState = "open" | "closed";

/** What the Experiences list, Home and Travel Guide cards need. */
export type ExperienceSummary = {
  id: ExperienceId;
  /** Ready-made only. Private Guide is a separate product (`privateGuide.ts`). */
  productType: "ready_made";
  /**
   * PROPOSED: product notes are under human review; APPROVED: may be listed
   * publicly. Production rendering of PROPOSED records is blocked by the
   * content layer, not by UI code.
   */
  status: RecordStatus;
  /** v1 is Osaka-first (Working Decision, T-03). */
  market: AreaKey;
  href: string;
  title: Tbd<string>;
  summary: Tbd<string>;
  duration: Tbd<DurationRange>;
  ageFit: Tbd<AgeFit>;
  walkingIntensity: Tbd<WalkingIntensity>;
  participation: Tbd<ParticipationFormat>;
  visitExperience: Tbd<VisitExperience>;
  /** Neighbourhood / area display text. */
  area: Tbd<string>;
  image: Tbd<ImageAsset>;
  /** Display price ("from"); the charged amount comes from the booking quote. */
  price: PriceStructure;
  cta: CtaSpec<"experienceDetail">;
  /** Optional "Book Now" directly from a card. */
  bookCta?: CtaSpec<"booking">;
};

/** Everything the Experience Detail template needs. */
export type Experience = Omit<ExperienceSummary, "cta" | "bookCta"> & {
  highlights: Tbd<string[]>;
  itinerary: Tbd<Itinerary>;
  /** Guide-only: arrangements (hotel, transport, tickets) are never included. */
  included: Tbd<string[]>;
  excluded: Tbd<string[]>;
  meetingPoint: Tbd<string>;
  images: Tbd<ImageAsset[]>;
  faq: Tbd<FaqItem[]>;
  bookingConditions: BookingConditions;
  bookingState: BookingAvailabilityState;
  /** Primary CTA of the Detail page: Book Now → Booking Flow. */
  cta: CtaSpec<"booking">;
  /** Optional path for travellers who want something custom. */
  privateGuideCta?: CtaSpec<"privateGuide">;
  seo: SeoMeta;
};
