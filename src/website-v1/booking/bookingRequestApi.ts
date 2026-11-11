import {
  BOOKING_REF,
  BOOKING_REQUEST_PATH,
  UUID_V4,
  type BookingRequestBody,
  type BookingRequestField,
} from "./bookingRequestContract";
import {
  parseDuration,
  validatePrivateGuideRequest,
  type PrivateGuideRequestErrors,
  type PrivateGuideRequestField,
  type PrivateGuideRequestResult,
  type PrivateGuideRequestSubmitHandler,
  type PrivateGuideRequestValues,
} from "./privateGuideRequest";

/**
 * Form ⇄ Booking Request Contract 0.3. NOT WIRED.
 *
 * The form uses this only when the request model is in `live` mode, which
 * it is not: today it always runs the mock and nothing is sent. Contract
 * types come from `bookingRequestContract.ts` (a local stand-in until
 * `src/contracts/bookingRequest.ts` exists).
 *
 * Retry rules (Contract 0.3 §4):
 * - one submissionId (UUID v4) per request body, also the Idempotency-Key;
 * - 503 / network error / timeout → result unknown: re-send the SAME body
 *   with the SAME submissionId, never a new UUID;
 * - only a changed form gets a new submissionId.
 */

/**
 * A fresh UUID v4 for a new submission. `crypto.randomUUID` (v4) needs a
 * secure context; plain-HTTP previews (LAN dev) fall back to the same layout
 * built from `crypto.getRandomValues`.
 */
export function newSubmissionId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // RFC 4122 variant
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * Builds the Contract 0.3 body from form values that already passed
 * `validatePrivateGuideRequest`. Returns `undefined` when a required value is
 * missing or the submissionId is not a UUID v4 (never sends a half-built body).
 */
export function toBookingRequestBody(v: PrivateGuideRequestValues, submissionId: string): BookingRequestBody | undefined {
  const durationMinutes = parseDuration(v.duration);
  if (!UUID_V4.test(submissionId) || !durationMinutes || !v.preferredDate || !v.startTime || !v.consent) return undefined;
  const hasAlternate = Boolean(v.alternateDate && v.alternateStartTime);
  const optional = (s: string) => (s.trim() ? s.trim() : null);

  return {
    submissionId,
    locale: "en",
    productType: "private_guide",
    experienceId: null,
    planId: null,
    date: v.preferredDate,
    startTime: v.startTime,
    durationMinutes,
    alternateDate: hasAlternate ? v.alternateDate : null,
    alternateStartTime: hasAlternate ? v.alternateStartTime : null,
    adults: v.adults,
    children: v.children,
    name: v.fullName.trim(),
    email: v.email.trim(),
    phone: optional(v.phone),
    country: optional(v.country),
    areas: [...v.areas],
    interests: [...v.interests],
    notes: v.message.trim(),
    consent: true,
    website: v.website,
  };
}

/**
 * What to send on "Send Booking Request" / "Send again".
 * - a kept attempt (form unchanged since it was built) → the SAME body and
 *   submissionId, without re-validating (the server may already hold it);
 * - otherwise validate, then build a new body with a new submissionId.
 * The form drops the kept attempt whenever a value changes.
 */
export function prepareSubmission(
  attempt: BookingRequestBody | null,
  values: PrivateGuideRequestValues,
  now: number,
  makeId: () => string = newSubmissionId,
): { kind: "reuse" | "new"; body: BookingRequestBody } | { kind: "invalid"; errors: PrivateGuideRequestErrors } | { kind: "error" } {
  if (attempt) return { kind: "reuse", body: attempt };
  const errors = validatePrivateGuideRequest(values, now);
  if (Object.keys(errors).length > 0) return { kind: "invalid", errors };
  const body = toBookingRequestBody(values, makeId());
  return body ? { kind: "new", body } : { kind: "error" };
}

/**
 * Which body to keep after a result. Kept for every result except a 409
 * (that submissionId belongs to another body on the server) and success.
 */
export function attemptAfter(result: PrivateGuideRequestResult, attempt: BookingRequestBody): BookingRequestBody | null {
  if (result.ok && result.kind === "received") return null;
  if (!result.ok && result.kind === "conflict") return null;
  return attempt;
}

/** Contract field → form field, for field errors from the server. */
const CONTRACT_TO_FORM: Partial<Record<BookingRequestField, PrivateGuideRequestField>> = {
  date: "preferredDate",
  startTime: "startTime",
  durationMinutes: "duration",
  alternateDate: "alternateDate",
  alternateStartTime: "alternateStartTime",
  adults: "adults",
  children: "children",
  name: "fullName",
  email: "email",
  phone: "phone",
  country: "country",
  areas: "areas",
  interests: "interests",
  notes: "message",
  consent: "consent",
};

/**
 * Field errors from an error body. Contract 0.3's error body is not known
 * here; both `{ fieldErrors: { date: "…" } }` and
 * `{ errors: [{ field: "date", message: "…" }] }` are read. CHECK against the
 * contract. Unknown fields are dropped (the form shows a general notice).
 */
export function toFormErrors(body: unknown): PrivateGuideRequestErrors {
  const out: PrivateGuideRequestErrors = {};
  const b = (body ?? {}) as { fieldErrors?: unknown; errors?: unknown };
  const pairs: [string, unknown][] = [];
  if (b.fieldErrors && typeof b.fieldErrors === "object" && !Array.isArray(b.fieldErrors)) {
    pairs.push(...Object.entries(b.fieldErrors as Record<string, unknown>));
  }
  if (Array.isArray(b.errors)) {
    for (const e of b.errors) if (e && typeof e === "object") pairs.push([String((e as { field?: unknown }).field), (e as { message?: unknown }).message]);
  }
  for (const [key, message] of pairs) {
    const field = CONTRACT_TO_FORM[key as BookingRequestField];
    if (field && typeof message === "string" && message) out[field] = SERVER_ERROR_TEXT[message] ?? message;
  }
  return out;
}

/** The API sends field error codes (`FieldErrorCode`), not sentences: show words, never the code. */
const SERVER_ERROR_TEXT: Record<string, string> = {
  required: "Please fill in this field.",
  invalid_format: "Please check this value.",
  too_long: "This is too long.",
  out_of_range: "This choice isn't available. Please check our booking conditions.",
};

/**
 * HTTP status + parsed body → form result. Success only for HTTP 200 with
 * ok, accepted, a `CR-YYYYMMDD-XXXXXX` bookingRef and status REQUESTED.
 * Anything that may have been stored but is not clearly accepted is
 * `unknown`, so the form never claims "not sent" when it cannot know.
 */
export function fromBookingRequestResponse(status: number, body: unknown): PrivateGuideRequestResult {
  const b = (body ?? {}) as Partial<{ ok: unknown; accepted: unknown; bookingRef: unknown; status: unknown }>;

  if (status === 200) {
    if (b.ok === true && b.accepted === true && typeof b.bookingRef === "string" && BOOKING_REF.test(b.bookingRef) && b.status === "REQUESTED") {
      return { ok: true, kind: "received", bookingRef: b.bookingRef };
    }
    if (b.accepted === false) return { ok: false, kind: "not_accepted" };
    // 200 but not a valid answer: the server may have stored it.
    return { ok: false, kind: "unknown", cause: "unexpected" };
  }
  if (status === 400) return { ok: false, kind: "invalid", errors: toFormErrors(body) };
  if (status === 409) return { ok: false, kind: "conflict" };
  if (status === 422) return { ok: false, kind: "rule_violation", errors: toFormErrors(body) };
  if (status === 429) return { ok: false, kind: "rate_limited" };
  if (status === 503) return { ok: false, kind: "unknown", cause: "unavailable" };
  // Other 5xx (and odd 2xx / 3xx): cannot tell whether it was stored.
  if (status >= 500 || status < 400) return { ok: false, kind: "unknown", cause: "unexpected" };
  return { ok: false, kind: "error" };
}

/**
 * Contract 0.3 submit handler. Not used yet: pass it to the form only once
 * the API is approved and the request model is switched to `live`.
 * `baseUrl` defaults to same-origin (`/api/v1/booking-requests`).
 */
export function createBookingRequestSubmitHandler({
  baseUrl = "",
  fetchImpl = fetch,
  timeoutMs = 20_000,
}: {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
} = {}): PrivateGuideRequestSubmitHandler {
  return async (body) => {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    try {
      let response: Response;
      try {
        response = await fetchImpl(`${baseUrl}${BOOKING_REQUEST_PATH}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Idempotency-Key": body.submissionId },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch {
        return { ok: false, kind: "unknown", cause: timedOut ? "timeout" : "network" };
      }
      let parsed: unknown;
      try {
        parsed = await response.json();
      } catch {
        // A timeout while reading the body leaves the result unknown too.
        if (timedOut) return { ok: false, kind: "unknown", cause: "timeout" };
        parsed = undefined;
      }
      return fromBookingRequestResponse(response.status, parsed);
    } finally {
      clearTimeout(timer);
    }
  };
}
