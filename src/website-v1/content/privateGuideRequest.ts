import type { AreaKey, CtaSpec, PrivateGuideActivity, Tbd } from "@/contracts";
import { routeHref } from "../routes";
import {
  DAY_END,
  DURATION_MINUTES,
  MAX_DAYS_AHEAD,
  MAX_PARTY_SIZE,
  REQUEST_LEAD_HOURS,
  START_TIMES,
  type DurationMinutes,
  type PrivateGuideRequestMode,
  type RejectedReason,
} from "../booking/privateGuideRequest";
import { CANCELLATION_POLICY_SOURCE, CANCELLATION_POLICY_VISIBLE } from "./cancellationPolicy";
import { ACTIVITY_LABELS, AREA_LABELS } from "./privateGuide";
import { approvedText, cta, proposed, tbd } from "./shared";
import { PRIVACY_FORM_NOTICE, PRIVACY_POLICY_VISIBLE } from "./privacyPolicy";

/**
 * Private Guide booking request (Human instruction 2026-11-09). Replaces the
 * W1-D16 slot-booking prototype (plans, demo prices, availability calendar,
 * Book Now → pay online), which no longer matches the operating flow:
 *
 *   request → Connectrip checks the request and guide availability →
 *   Stripe invoice (JPY) → booking confirmed by hand after payment.
 *   Reply target: 2 business days. Payment terms (full / advance payment,
 *   payment deadline, guide hold) are NOT approved and are not shown
 *   (removed 2026-11-11).
 *
 * Booking rules (durations, start times, 20:00 end, party size, 48-hour
 * cut-off, 90-day window) follow the APPROVED Private Guide Booking Rules
 * V1.1; see booking/privateGuideRequest.ts. Copy is PROPOSED, not approved.
 *
 * Website-local model (not in `src/contracts`): the shared request contract
 * is not decided yet.
 */
const SOURCE = "Private Guide booking request flow (Human instruction 2026-11-09). Copy PROPOSED";
const RULES = "Private Guide Booking Rules V1.1 (APPROVED)";
const RULES_COPY = `${RULES}; wording PROPOSED`;
const p = (text: string) => proposed(text, SOURCE);
const r = (text: string) => proposed(text, RULES_COPY);

export type RequestStep = { title: Tbd<string>; text: Tbd<string> };
export type RequestOption<V extends string> = { value: V; label: Tbd<string> };

/** Copy for what happens after Send Booking Request. */
export type RequestOutcomeCopy = {
  /** Mock: nothing was sent. */
  notSent: { title: Tbd<string>; body: Tbd<string>; live: Tbd<string> };
  /** API stored the request (live mode only). Never says "confirmed". */
  received: { title: Tbd<string>; refLabel: Tbd<string>; notConfirmed: Tbd<string>; next: Tbd<string>[]; keepRef: Tbd<string> };
  /** Not accepted (Contract 0.3: 400 / 409 / 422 / 429, 200 with accepted:false, other 4xx). */
  rejected: Record<RejectedReason, Tbd<string>> & { stillInForm: Tbd<string> };
  /**
   * Result unknown (503, network error, timeout). The request MAY have been
   * stored: never say "not sent". Retry re-sends the same request.
   */
  unknown: { title: Tbd<string>; body: Tbd<string>; editWarning: Tbd<string>; idLabel: Tbd<string>; retryLabel: Tbd<string> };
  /** Shown above the form when the server rejected fields. */
  fieldsRejected: Tbd<string>;
};

export type PrivateGuideRequestModel = {
  /**
   * `mock`: the form sends nothing (no API yet) and has no success screen.
   * Switch to `live` only together with the API handler, once Contract 0.3
   * and the endpoint are approved.
   */
  mode: PrivateGuideRequestMode;
  outcomes: RequestOutcomeCopy;
  eyebrow: string;
  heading: Tbd<string>;
  supporting: Tbd<string>;
  /** The operating flow, in order. */
  steps: RequestStep[];
  /** Short terms shown next to the submit button. */
  keyTerms: Tbd<string>[];
  /**
   * Server render time (ms). The form starts from it so the server and the
   * first client render match, then switches to the browser clock: the
   * 48-hour cut-off is always checked against the current time.
   */
  renderedAt: number;
  /** Booking rules shown above the date fields. */
  rulesNotes: Tbd<string>[];
  /** Shown when a date change makes the chosen start time less than 48 h away. */
  clearedTooSoonNote: Tbd<string>;
  /** Shown when a duration change makes the chosen start time end after 20:00. */
  clearedEndsLateNote: Tbd<string>;
  /** 08:00–17:00, 30-minute steps. Not availability. */
  startTimes: RequestOption<string>[];
  /** Values are minutes ("240" / "360" / "480"), the API values. */
  durations: RequestOption<string>[];
  areas: RequestOption<AreaKey>[];
  interests: RequestOption<PrivateGuideActivity>[];
  consent: { label: Tbd<string>; privacyLabel: string; privacyHref: string };
  /** How the details are used, shown above the consent box (preview only while the Privacy Policy V1 is a draft). */
  privacyNotice: string | null;
  submitLabel: Tbd<string>;
  cancellationNote: Tbd<string>;
  /** Link to the Cancellation & Refund Policy; null while the policy is not shown (public mode until legally approved). */
  cancellationPolicy: { label: string; href: string } | null;
  /** Later finish than 20:00, or more than 6 people → individual inquiry. */
  specialRequest: { prompt: Tbd<string>; cta: CtaSpec<"inquiry"> };
  questions: { prompt: Tbd<string>; cta: CtaSpec<"inquiry"> };
};

/** The existing Inquiry page (Route Registry); v1 has no separate Contact page. */
const inquiryCta = (id: string, label: string) => cta(id, "inquiry", routeHref("inquiry"), "section", "secondary", p(label));

/**
 * `mode` is "live" only when the page passes it, i.e. when the server has the
 * booking backend configured (see `app/v1/private-guide/page.tsx`).
 */
export function getPrivateGuideRequestModel(now: Date = new Date(), mode: PrivateGuideRequestMode = "mock"): PrivateGuideRequestModel {
  return {
    mode,
    outcomes: {
      notSent: {
        title: p("Preview only: your request was NOT sent."),
        body: p("This form is not connected yet. Nothing was sent, saved or emailed, and no booking was made. Your details stay only on this page."),
        live: p("When the form goes live, Connectrip Japan will review each request and reply within 2 business days."),
      },
      received: {
        title: p("We've received your booking request"),
        refLabel: p("Your request reference"),
        notConfirmed: p("Your booking is not confirmed yet. Please don't make final travel plans around this date until we confirm."),
        next: [
          p("We check your request and our guides' availability, and reply within 2 business days."),
          p("If we can arrange your day, we send you a Stripe invoice in Japanese yen (JPY)."),
          p("We confirm your booking once your payment has been received."),
        ],
        keepRef: p("Keep this reference and quote it if you contact us about your request."),
      },
      rejected: {
        invalid: p("We couldn't accept some details. Please check the form and send it again."),
        rule_violation: p(
          "This request doesn't meet our booking conditions (for example, it is now less than 48 hours away, or ends after 20:00). Please check the date, time and group.",
        ),
        conflict: p("Your request changed while it was being sent. Please check your details and send it again."),
        rate_limited: p("Too many attempts in a short time. Please wait a few minutes, then send again."),
        not_accepted: p("We couldn't accept this request online. Please contact us and we'll help you."),
        error: p("We couldn't accept your request. Please try again, or contact us."),
        stillInForm: p("Your request has not been accepted. Your details are still in the form."),
      },
      unknown: {
        title: p("We couldn't confirm whether your request reached us."),
        body: p(
          "Please don't start a new request. Press “Send again” to resend this same request: if it already reached us, it won't be duplicated.",
        ),
        editWarning: p("If you change any details now, they will be sent as a new request."),
        idLabel: p("Request ID"),
        retryLabel: p("Send again"),
      },
      fieldsRejected: p("We couldn't accept some details. Please check the highlighted fields."),
    },
    eyebrow: "BOOKING REQUEST",
    heading: p("Request Your Private Guide"),
    supporting: p(
      "Tell us when you'd like to explore and who's coming. This is a request, not an instant booking: we check your plans and our guides' availability, then reply within 2 business days.",
    ),
    steps: [
      {
        title: p("Send your request"),
        text: p(
          `Share your preferred date, start time and length, your group and how to reach you, at least ${REQUEST_LEAD_HOURS} hours before your preferred start time. Nothing is charged.`,
        ),
      },
      {
        title: p("We check your request"),
        text: p("Our team reviews your plans and confirms a guide is available. We reply within 2 business days."),
      },
      {
        title: p("We send you a Stripe invoice"),
        text: p("If we can arrange your day, we send you a secure Stripe invoice in Japanese yen (JPY)."),
      },
      {
        title: p("Your booking is confirmed"),
        text: p("Once we have received your payment, we confirm your booking with you. Your booking is not confirmed until then."),
      },
    ],
    keyTerms: [
      p("Sending a request does not confirm a booking. You will not be charged now."),
      r(`Requests close ${REQUEST_LEAD_HOURS} hours before your preferred start time (Japan time).`),
      p("We reply within 2 business days."),
      p("If we can arrange your day, we send you a Stripe invoice in Japanese yen (JPY)."),
    ],
    renderedAt: now.getTime(),
    rulesNotes: [
      r(`Choose 4, 6 or 8 hours, starting between 08:00 and 17:00. Your day ends by ${DAY_END}. All times are Japan time (JST).`),
      r(`Requests close ${REQUEST_LEAD_HOURS} hours before your preferred start time. You can request dates up to ${MAX_DAYS_AHEAD} days ahead.`),
      r(`Up to ${MAX_PARTY_SIZE} people per request, including at least 1 adult.`),
    ],
    clearedTooSoonNote: r(`Your start time was cleared: it is less than ${REQUEST_LEAD_HOURS} hours away on the new date. Please choose another time.`),
    clearedEndsLateNote: r(`Your start time was cleared: with this length, your day would end after ${DAY_END}. Please choose an earlier time.`),
    startTimes: START_TIMES.map((t) => ({ value: t, label: approvedText(t, RULES) })),
    durations: DURATION_MINUTES.map((m: DurationMinutes) => ({ value: String(m), label: approvedText(`${m / 60} hours`, RULES) })),
    areas: (Object.keys(AREA_LABELS) as AreaKey[]).map((value) => ({ value, label: AREA_LABELS[value] })),
    interests: (Object.keys(ACTIVITY_LABELS) as PrivateGuideActivity[]).map((value) => ({ value, label: ACTIVITY_LABELS[value] })),
    consent: {
      // Final wording is a Human / legal decision (Privacy Policy is TBD).
      label: p("I agree that Connectrip Japan may use these details to reply to my request, as described in the"),
      privacyLabel: "Privacy Policy",
      privacyHref: routeHref("privacy"),
    },
    privacyNotice: PRIVACY_POLICY_VISIBLE ? PRIVACY_FORM_NOTICE : null,
    submitLabel: p("Send Booking Request"),
    // Summary of the Cancellation & Refund Policy V1 draft (content/cancellationPolicy.ts): preview only until legally approved.
    cancellationNote: CANCELLATION_POLICY_VISIBLE
      ? proposed(
          "Free cancellation 7 or more days before the tour. 3–6 days before: 30%. 1–2 days before: 50%. On the tour date or no-show: 100%. Japan time (JST).",
          CANCELLATION_POLICY_SOURCE,
        )
      : tbd("Cancellation policy for Private Guide bookings: pending legal review"),
    cancellationPolicy: CANCELLATION_POLICY_VISIBLE ? { label: "Cancellation & Refund Policy", href: routeHref("cancelPolicy") } : null,
    specialRequest: {
      prompt: r(`Need to finish after ${DAY_END}, or travelling with more than ${MAX_PARTY_SIZE} people? This form can't take those requests.`),
      cta: inquiryCta("v1_private_request_special", "Contact us about a special request"),
    },
    questions: {
      prompt: p("Have questions first?"),
      cta: inquiryCta("v1_private_request_questions", "Contact us"),
    },
  };
}
