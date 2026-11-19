import type {
  AvailabilityDay,
  BookingFlowHandlers,
  BookingFlowState,
  BookingFlowViewModel,
  BookingStatusResult,
  BookingSubmitResult,
  BookingSummary,
} from "../booking";
import { tbd } from "../status";
import { experienceDetailFixture } from "./experiences";
import { fixtureCta, fixtureHrefs, fixtureText } from "./shared";

/**
 * Booking flow fixtures. No payment provider, no network. Dates, start times
 * and references below are placeholders for UI only — operating hours,
 * availability rules and prices are TBD.
 */
const FIXTURE_BOOKING_REF = "FIXTURE-BOOKING-0001";

const exp = experienceDetailFixture;

export const bookingSummaryFixture: BookingSummary = {
  experience: { id: exp.id, title: exp.title, image: exp.image },
  date: "2099-01-15",
  startTime: "10:00",
  guests: { adults: 2, children: 1 },
  total: tbd("Price requires human approval"),
};

const message = (name: string) => ({ title: fixtureText(`${name} title`), body: fixtureText(`${name} body`) });

export const bookingFlowFixture: BookingFlowViewModel = {
  route: "booking",
  seo: {
    title: fixtureText("Booking SEO title"),
    description: tbd(),
    canonicalPath: exp.cta.href,
    noindex: true,
  },
  content: {
    experience: {
      id: exp.id,
      title: exp.title,
      image: exp.image,
      href: exp.href,
      price: exp.price,
      bookingConditions: exp.bookingConditions,
      bookingState: exp.bookingState,
    },
    steps: [
      { key: "selection", label: fixtureText("Date, time and guests") },
      { key: "customer", label: fixtureText("Your details") },
      { key: "payment", label: fixtureText("Payment") },
      { key: "result", label: fixtureText("Done") },
    ],
    fieldsStatus: "PROPOSED",
    selectionFields: [
      { name: "optionId", kind: "select", label: fixtureText("Option"), required: tbd(), options: [] },
      { name: "date", kind: "date", label: fixtureText("Date"), required: tbd() },
      { name: "startTime", kind: "select", label: fixtureText("Start time"), required: tbd() },
      { name: "guests", kind: "guests", label: fixtureText("Guests"), required: tbd() },
    ],
    customerFields: [
      { name: "name", kind: "text", label: fixtureText("Name"), required: tbd() },
      { name: "email", kind: "email", label: fixtureText("Email"), required: tbd() },
      { name: "phone", kind: "tel", label: fixtureText("Phone"), required: tbd() },
      { name: "country", kind: "text", label: fixtureText("Country"), required: tbd() },
      { name: "notes", kind: "textarea", label: fixtureText("Notes"), required: tbd() },
      { name: "consent", kind: "checkbox", label: fixtureText("Consent"), required: tbd("Consent policy TBD") },
    ],
    consent: {
      label: fixtureText("Consent label"),
      privacyHref: fixtureHrefs.privacy,
      termsHref: fixtureHrefs.terms,
    },
    paymentNote: fixtureText("You will be taken to a secure payment page"),
    submitLabel: fixtureText("Continue to payment"),
    messages: {
      unavailable: message("Unavailable"),
      payment_cancelled: message("Payment cancelled"),
      payment_completed_pending_confirmation: message("Payment received, pending confirmation"),
      confirmed: message("Booking confirmed"),
    },
    backToExperience: fixtureCta("experienceDetail", exp.href, "inline", "secondary", "Back to experience"),
    privateGuideCta: fixtureCta("privateGuide", fixtureHrefs.privateGuide, "inline", "secondary", "Private Guide CTA"),
    initialState: { phase: "initial", step: "selection" },
    honeypotFieldName: "website",
  },
};

/** The states Astra must design (T-03 Booking states), plus transient ones. */
export type BookingFixtureState =
  | "initial"
  | "initial_customer"
  | "submitting"
  | "validation_error"
  | "unavailable"
  | "error"
  | "payment_pending"
  | "payment_cancelled"
  | "payment_completed_pending_confirmation"
  | "confirmed";

export const bookingStateFixtures = {
  initial: { phase: "initial", step: "selection" },
  initial_customer: { phase: "initial", step: "customer" },
  submitting: { phase: "submitting" },
  validation_error: {
    phase: "validation_error",
    step: "customer",
    fieldErrors: { email: "invalid_format", consent: "required" },
  },
  unavailable: { phase: "unavailable", reason: "slot_unavailable" },
  error: { phase: "error", kind: "server" },
  payment_pending: { phase: "payment_pending", bookingRef: FIXTURE_BOOKING_REF },
  payment_cancelled: { phase: "payment_cancelled", bookingRef: FIXTURE_BOOKING_REF, summary: bookingSummaryFixture },
  payment_completed_pending_confirmation: {
    phase: "payment_completed_pending_confirmation",
    bookingRef: FIXTURE_BOOKING_REF,
    summary: bookingSummaryFixture,
  },
  confirmed: { phase: "confirmed", bookingRef: FIXTURE_BOOKING_REF, summary: bookingSummaryFixture },
} as const satisfies Record<BookingFixtureState, BookingFlowState>;

export type MockBookingScenario =
  | "success"
  | "validation_error"
  | "unavailable"
  | "server_error"
  | "network_error";

const submitResults: Record<MockBookingScenario, BookingSubmitResult> = {
  success: {
    ok: true,
    bookingRef: FIXTURE_BOOKING_REF,
    payment: { kind: "redirect", url: "#fixture-checkout" },
  },
  validation_error: {
    ok: false,
    kind: "validation",
    step: "customer",
    fieldErrors: { email: "invalid_format", consent: "required" },
  },
  unavailable: { ok: false, kind: "unavailable", reason: "slot_unavailable" },
  server_error: { ok: false, kind: "server" },
  network_error: { ok: false, kind: "network" },
};

/** Placeholder start times for the calendar UI. Not operating hours. */
const FIXTURE_START_TIMES = ["10:00", "14:00"];

function fixtureDays(from: string, to: string): AvailabilityDay[] {
  const days: AvailabilityDay[] = [];
  const end = new Date(`${to}T00:00:00Z`);
  for (let d = new Date(`${from}T00:00:00Z`); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const date = d.toISOString().slice(0, 10);
    // A repeating pattern so every slot state is visible.
    const pattern = d.getUTCDate() % 3;
    const status = pattern === 0 ? "unavailable" : pattern === 1 ? "available" : "limited";
    days.push({
      date,
      status,
      slots:
        status === "unavailable"
          ? []
          : FIXTURE_START_TIMES.map((startTime, i) => ({
              startTime,
              status: status === "limited" && i === 1 ? "unavailable" : status,
            })),
    });
  }
  return days;
}

function delay<T>(value: T, delayMs: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), delayMs));
}

/**
 * Mock handlers for UI work. Makes no network request.
 * `status` sets what `getStatus` reports (e.g. after returning from checkout).
 */
export function createMockBookingHandlers(
  scenario: MockBookingScenario = "success",
  status: Extract<BookingStatusResult, { ok: true }>["status"] = "confirmed",
  delayMs = 800,
): BookingFlowHandlers {
  return {
    getAvailability: (query) =>
      scenario === "network_error"
        ? delay({ ok: false, kind: "network" }, delayMs)
        : delay({ ok: true, days: fixtureDays(query.from, query.to) }, delayMs),
    submit: () => delay(submitResults[scenario], delayMs),
    getStatus: (bookingRef) =>
      delay({ ok: true, bookingRef, status, summary: bookingSummaryFixture }, delayMs),
  };
}
