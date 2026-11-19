import { formStoreFromEnv, type FormStore, type NewSubmission } from "@/lib/inquiries/store";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { inquiryBodyHash, inquiryHoneypotTripped, validateInquiry, type InquiryRecord, type InquiryResponse } from "./rules";

export { inquiryEmail } from "./notification";

/**
 * `POST /api/v1/inquiries` (2026-11-16): the Inquiry form.
 *
 * Phase 1 (2026-11-16): stored in Postgres (`inquiries`, kind 'contact'),
 * together with its history event and a staff-email outbox row, then the
 * outbox is sent (src/lib/inquiries). No storage, no success: without a
 * database the API answers 503 and the form asks the visitor to try again.
 * Once stored, a failed email never turns into an error for the visitor; the
 * outbox keeps it for a retry.
 */

const RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };

/** Null when POSTGRES_URL is not set (the page then renders the form in mock mode). */
export function inquiryStoreFromEnv(env: Record<string, string | undefined> = process.env): FormStore | null {
  return formStoreFromEnv(env);
}

const json = (body: InquiryResponse, status = 200) => Response.json(body, { status });

export function inquirySubmission(i: InquiryRecord, bodyHash: string): NewSubmission {
  return {
    kind: "contact",
    service: i.kind,
    submissionId: i.submissionId,
    bodyHash,
    customerName: i.name,
    customerEmail: i.email,
    preferredDate: i.preferredDate,
    adults: i.adults,
    children: i.children,
    payload: i,
  };
}

export async function handleInquiry(request: Request, deps: { store: FormStore | null }): Promise<Response> {
  const raw = await request.json().catch(() => null);
  const ip = clientIp(request);
  if (isRateLimited(`inquiry:${ip ?? "unknown"}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs)) return json({ ok: false, kind: "rate_limited" }, 429);
  if (inquiryHoneypotTripped(raw)) return json({ ok: true, accepted: false });

  const validated = validateInquiry(raw, request.headers.get("idempotency-key"));
  if (!validated.ok) return json(validated.body, validated.status);
  if (!deps.store) return json({ ok: false, kind: "server" }, 503);

  const submission = inquirySubmission(validated.inquiry, inquiryBodyHash(validated.inquiry));
  // One retry with the same id and body: if the first commit did happen, the retry returns the stored row.
  let stored = await deps.store.create(submission);
  if (stored.type === "unavailable") stored = await deps.store.create(submission);
  if (stored.type === "conflict") return json({ ok: false, kind: "conflict" }, 409);
  if (stored.type === "unavailable") return json({ ok: false, kind: "server" }, 503);

  // Also on a replay: a notification left pending by an earlier attempt is sent now (the outbox sends each once).
  await deps.store.notify(stored.id);
  return json({ ok: true, accepted: true, inquiryRef: stored.ref, replayed: stored.replayed });
}
