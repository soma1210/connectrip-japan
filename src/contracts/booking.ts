import type { CtaSpec } from "./cta";
import type { Experience, ExperienceId } from "./experience";
import type { FieldErrors, FieldSpec } from "./form";
import type { ImageAsset } from "./media";
import type { Money, PaymentCurrency } from "./money";
import type { PageViewModel } from "./pages";
import type { RecordStatus, Tbd } from "./status";

/**
 * Ready-made booking flow (Working Decision, T-03):
 * Experience Detail → Booking Flow, one page with steps.
 *
 *   selection (date / time / guests) → customer → payment (hosted checkout) → result
 *
 * Presentation components never talk to the payment provider. They call the
 * handlers they receive and render `BookingFlowState`. Price, availability
 * rules, confirmation mode and the payment implementation are TBD.
 */
export type BookingStepKey = "selection" | "customer" | "payment" | "result";

/** Steps the traveller fills in on the page. */
export type BookingEditableStep = Extract<BookingStepKey, "selection" | "customer">;

export type BookingStepSpec = {
  key: BookingStepKey;
  label: Tbd<string>;
};

export type BookingSelectionFieldName = "optionId" | "date" | "startTime" | "guests";

export type BookingCustomerFieldName = "name" | "email" | "phone" | "country" | "notes" | "consent";

export type BookingFieldName = BookingSelectionFieldName | BookingCustomerFieldName;

export type GuestCount = {
  adults: number;
  children: number;
};

export type BookingFormValues = {
  experienceId: ExperienceId;
  optionId?: string;
  /** ISO date (YYYY-MM-DD), Japan time. */
  date?: string;
  /** "HH:mm", Japan time. Absent when the product has no start-time choice. */
  startTime?: string;
  guests?: Partial<GuestCount>;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
    notes?: string;
    consent?: boolean;
  };
};

// ---------------------------------------------------------------------------
// Availability

export type AvailabilityQuery = {
  experienceId: ExperienceId;
  optionId?: string;
  /** Inclusive ISO date range to show (e.g. the visible calendar month). */
  from: string;
  to: string;
  guests?: Partial<GuestCount>;
};

export type SlotStatus = "available" | "limited" | "unavailable";

export type AvailabilitySlot = {
  /** "HH:mm", Japan time. */
  startTime: string;
  status: SlotStatus;
  /** Only when the server chooses to expose it. */
  remaining?: number;
};

export type AvailabilityDay = {
  date: string;
  status: SlotStatus;
  /** Empty when the product is booked by date only. */
  slots: AvailabilitySlot[];
};

export type AvailabilityResult =
  | { ok: true; days: AvailabilityDay[] }
  | { ok: false; kind: "server" | "network" };

/** Availability rules are TBD and live on the server. */
export type BookingAvailabilityHandler = (query: AvailabilityQuery) => Promise<AvailabilityResult>;

// ---------------------------------------------------------------------------
// Submit → payment → result

export type BookingSummary = {
  experience: { id: ExperienceId; title: Tbd<string>; image: Tbd<ImageAsset> };
  option?: { id: string; label: Tbd<string> };
  date: string;
  startTime?: string;
  guests: GuestCount;
  /** Calculated by the server. v1 is JPY only. */
  total: Tbd<Money<PaymentCurrency>>;
};

export type BookingUnavailableReason =
  /** The chosen date / time can no longer be booked. */
  | "slot_unavailable"
  /** The party does not fit the remaining capacity or guest limits. */
  | "capacity_exceeded"
  /** Booking is not open for this Experience. */
  | "booking_closed";

export type BookingSubmitResult =
  | {
      ok: true;
      /** Opaque reference, safe to show to the traveller. */
      bookingRef: string;
      /** Hosted checkout. The UI navigates to `url`; it never builds it. */
      payment: { kind: "redirect"; url: string };
    }
  | {
      ok: false;
      kind: "validation";
      /** Step to return the traveller to. */
      step: BookingEditableStep;
      fieldErrors: FieldErrors<BookingFieldName>;
    }
  | { ok: false; kind: "unavailable"; reason: BookingUnavailableReason }
  | { ok: false; kind: "rate_limited" | "server" | "network" };

/**
 * Supplied by the integration layer (real API) or by fixtures (mock).
 * Creates a pending booking and returns where to pay. No payment logic in UI.
 */
export type BookingSubmitHandler = (values: BookingFormValues) => Promise<BookingSubmitResult>;

/**
 * Status after returning from checkout. Whether a paid booking is confirmed
 * immediately or after a human review is TBD; the UI renders whatever
 * status it gets and may poll while `payment_completed_pending_confirmation`.
 */
export type BookingPaymentStatus =
  | "payment_pending"
  | "payment_cancelled"
  | "payment_completed_pending_confirmation"
  | "confirmed";

export type BookingStatusResult =
  | { ok: true; bookingRef: string; status: BookingPaymentStatus; summary: BookingSummary }
  | { ok: false; kind: "not_found" | "server" | "network" };

export type BookingStatusHandler = (bookingRef: string) => Promise<BookingStatusResult>;

export type BookingFlowHandlers = {
  getAvailability: BookingAvailabilityHandler;
  submit: BookingSubmitHandler;
  getStatus: BookingStatusHandler;
};

// ---------------------------------------------------------------------------
// UI state

/**
 * UI state machine for the booking page. Every phase must have a designed
 * state; fixtures cover each one (`bookingStateFixtures`).
 */
export type BookingFlowState =
  /** Editing a step (fresh page, or moving between steps). */
  | { phase: "initial"; step: BookingEditableStep }
  | { phase: "submitting" }
  | { phase: "validation_error"; step: BookingEditableStep; fieldErrors: FieldErrors<BookingFieldName> }
  | { phase: "unavailable"; reason: BookingUnavailableReason }
  | { phase: "error"; kind: "rate_limited" | "server" | "network" | "not_found" }
  /** Booking created, traveller is being sent to (or is at) checkout. */
  | { phase: "payment_pending"; bookingRef: string; redirectUrl?: string }
  | { phase: "payment_cancelled"; bookingRef: string; summary: BookingSummary }
  | { phase: "payment_completed_pending_confirmation"; bookingRef: string; summary: BookingSummary }
  | { phase: "confirmed"; bookingRef: string; summary: BookingSummary };

export type BookingFlowPhase = BookingFlowState["phase"];

/** Phases that end on the `result` step and need a message block. */
export type BookingResultPhase = Extract<
  BookingFlowPhase,
  "payment_cancelled" | "payment_completed_pending_confirmation" | "confirmed" | "unavailable"
>;

export type BookingMessage = {
  title: Tbd<string>;
  body: Tbd<string>;
};

export type BookingFlowContent = {
  experience: Pick<
    Experience,
    "id" | "title" | "image" | "href" | "price" | "bookingConditions" | "bookingState"
  >;
  /** Rendered as a progress indicator, in order. */
  steps: BookingStepSpec[];
  fieldsStatus: RecordStatus;
  selectionFields: FieldSpec<BookingSelectionFieldName>[];
  customerFields: FieldSpec<BookingCustomerFieldName>[];
  consent: {
    label: Tbd<string>;
    privacyHref: string;
    termsHref: string;
  };
  /** Explains the hand-off to secure payment (copy TBD). */
  paymentNote: Tbd<string>;
  submitLabel: Tbd<string>;
  messages: Record<BookingResultPhase, BookingMessage>;
  backToExperience: CtaSpec<"experienceDetail">;
  /** Shown when unavailable / closed, as an alternative path. */
  privateGuideCta?: CtaSpec<"privateGuide">;
  /**
   * Starting state, set by the route (e.g. `payment_cancelled` when the
   * traveller comes back from checkout without paying).
   */
  initialState: BookingFlowState;
  /** Spam trap, same rules as the Inquiry form. */
  honeypotFieldName: string;
};

export type BookingFlowViewModel = PageViewModel<"booking", BookingFlowContent>;
