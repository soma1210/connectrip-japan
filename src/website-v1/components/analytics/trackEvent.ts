import { analyticsConsentGranted } from "../../consent/consent";

/**
 * GA4 events for booking requests and inquiries (owner instruction 2026-11-24).
 *
 * Sent only when the visitor has accepted analytics cookies and the Google tag
 * is loaded (Vercel Production); otherwise every call does nothing.
 *
 *   booking_request_start   a booking form is opened (fixed tour dialog) or first
 *                           used (Private Guide form on the page); once per page load
 *   booking_request_submit  the API accepted a booking request (never on click)
 *   contact_submit          the API stored an inquiry (never on click)
 *   generate_lead           with either success above: the one key event to count
 *
 * Successes are counted once per accepted request: a retry of the same request
 * (same booking reference / submission id) is not counted again. The key used
 * to tell them apart stays in this page's memory and is never sent.
 *
 * Parameters are fixed values chosen here. Never add personal information
 * (names, email addresses, phone numbers, message text, health information,
 * booking references or anything else that identifies a guest).
 */
export type AnalyticsEvent = "booking_request_start" | "booking_request_submit" | "contact_submit" | "generate_lead";

export type BookingForm = "private_guide" | "fixed_tour";

type Params = Record<string, string>;
type Gtag = (command: "event", name: AnalyticsEvent, params?: Params) => void;

export function trackEvent(name: AnalyticsEvent, params?: Params) {
  if (typeof window === "undefined" || !analyticsConsentGranted()) return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag === "function") gtag("event", name, params);
}

const counted = new Set<string>();

/** True the first time a key is seen on this page. */
function firstTime(key: string): boolean {
  if (counted.has(key)) return false;
  counted.add(key);
  return true;
}

/** A booking form was opened / first used. `tourId` is the product id (`GP-…`) of a fixed tour. */
export function trackBookingRequestStart(form: BookingForm, tourId?: string) {
  if (!analyticsConsentGranted() || !firstTime(`start:${form}:${tourId ?? ""}`)) return;
  trackEvent("booking_request_start", tourId ? { form_type: form, tour_id: tourId } : { form_type: form });
}

/** The booking API accepted the request. `dedupeKey`: its booking reference (kept here, never sent). */
export function trackBookingRequestReceived(form: BookingForm, dedupeKey: string, tourId?: string) {
  if (!analyticsConsentGranted() || !firstTime(`lead:${dedupeKey}`)) return;
  const params: Params = tourId ? { form_type: form, tour_id: tourId } : { form_type: form };
  trackEvent("booking_request_submit", params);
  trackEvent("generate_lead", { ...params, lead_source: "booking_request" });
}

/** The inquiry API stored the message. `dedupeKey`: its submission id (kept here, never sent). */
export function trackContactReceived(dedupeKey: string) {
  if (!analyticsConsentGranted() || !firstTime(`lead:${dedupeKey}`)) return;
  trackEvent("contact_submit", { form_type: "inquiry" });
  trackEvent("generate_lead", { form_type: "inquiry", lead_source: "contact_form" });
}
