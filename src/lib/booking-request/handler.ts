import type { BookingRequestHoneypotResponse, BookingRequestSuccess, PrivateGuideBookingRequest } from "@/contracts/bookingRequest";
import { formStoreFromEnv, type FormStore, type NewSubmission } from "@/lib/inquiries/store";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { bookingBodyHash, honeypotTripped, validateBookingRequest } from "./rules";

const RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };

export type BookingHandlerDeps = {
  /** Postgres form store. Null = no database configured (503, nothing stored). */
  store: FormStore | null;
};

/** Null when POSTGRES_URL is not set (the Private Guide page then renders the form in mock mode). */
export function bookingStoreFromEnv(env: Record<string, string | undefined> = process.env): FormStore | null {
  return formStoreFromEnv(env);
}

export function bookingSubmission(booking: PrivateGuideBookingRequest, bodyHash: string): NewSubmission {
  return {
    kind: "booking_request",
    service: booking.productType,
    submissionId: booking.submissionId,
    bodyHash,
    customerName: booking.name,
    customerEmail: booking.email,
    preferredDate: booking.date,
    adults: booking.adults,
    children: booking.children,
    payload: booking,
  };
}

/**
 * `POST /api/v1/booking-requests` (Booking Request Contract 0.3).
 *
 * Order: rate limit → honeypot → validation → Postgres stores the request
 * (with its history event and staff-email outbox row, one transaction) →
 * the outbox sends the staff email. Phase 1 (2026-11-16): Postgres replaces
 * the booking Apps Script as the system of record; the Sheets data is kept.
 *
 * A request is never a booking: it is stored as 'received' and the answer
 * keeps the contract's "REQUESTED". Only an admin can move it on.
 * A replayed / double submit returns the same reference and sends no second
 * email. Once stored, a failed email never changes the answer; the outbox
 * keeps it for a retry. Logs carry codes only, no personal data.
 */
export async function handleBookingRequest(request: Request, deps: BookingHandlerDeps): Promise<Response> {
  const raw = await request.json().catch(() => null);
  const ip = clientIp(request);
  if (isRateLimited(`booking-request:${ip ?? "unknown"}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs)) {
    return Response.json({ ok: false, kind: "rate_limited" }, { status: 429 });
  }
  if (honeypotTripped(raw)) {
    const body: BookingRequestHoneypotResponse = { ok: true, accepted: false };
    return Response.json(body);
  }

  const validated = validateBookingRequest(raw, Date.now(), request.headers.get("idempotency-key"));
  if (!validated.ok) return Response.json(validated.body, { status: validated.status });
  if (!deps.store) return Response.json({ ok: false, kind: "server" }, { status: 503 });

  const submission = bookingSubmission(validated.booking, bookingBodyHash(validated.booking));
  // One retry with the same id and body: if the first commit did happen, the retry returns the stored row.
  let stored = await deps.store.create(submission);
  if (stored.type === "unavailable") stored = await deps.store.create(submission);
  if (stored.type === "conflict") return Response.json({ ok: false, kind: "conflict" }, { status: 409 });
  if (stored.type === "unavailable") return Response.json({ ok: false, kind: "server" }, { status: 503 });

  await deps.store.notify(stored.id);
  const body: BookingRequestSuccess = { ok: true, accepted: true, bookingRef: stored.ref, status: "REQUESTED", replayed: stored.replayed };
  return Response.json(body);
}
