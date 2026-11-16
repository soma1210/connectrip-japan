import { createHmac, randomBytes } from "node:crypto";
import type { BookingRequestFailure } from "@/contracts/bookingRequest";
import type { BookingGas, CreateOutcome, GetOutcome, StoredSubmission } from "./submit";

/**
 * Client for the booking Apps Script Web App. This deployment is not the
 * interview Web App: only BOOKING_GAS_URL and BOOKING_GAS_SECRET are read.
 *
 * Apps Script cannot see request headers, so the signature travels in the body.
 * A POST answers with one 302. The result is fetched with GET and without the signed body.
 */

const PROTOCOL_VERSION = 1;
const REQUEST_TIMEOUT_MS = 20_000;
const MIN_SECRET_LENGTH = 32;
const EXEC_HOST = "script.google.com";
const RESULT_HOST = "script.googleusercontent.com";
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const BOOKING_REF = /^CR-\d{8}-[A-Z0-9]{6}$/;

type GasData = {
  bookingRef?: unknown;
  replayed?: unknown;
  row?: unknown;
};

export function bookingGasFromEnv(env: Record<string, string | undefined> = process.env): BookingGas | null {
  const url = env.BOOKING_GAS_URL?.trim() ?? "";
  const secret = env.BOOKING_GAS_SECRET ?? "";
  if (!isExecUrl(url) || secret.length < MIN_SECRET_LENGTH) return null;
  return createBookingGas(url, secret);
}

export function createBookingGas(url: string, secret: string, fetchImpl: typeof fetch = fetch): BookingGas {
  return {
    create: async (booking, bodyHash) => {
      try {
        return readCreate(await call(url, secret, fetchImpl, "bookingRequests.create", { booking, bodyHash }));
      } catch (error) {
        return error instanceof GasRefusal ? refusalToOutcome(error.code) : { type: "unknown" };
      }
    },
    get: async (submissionId) => {
      try {
        return readGet(await call(url, secret, fetchImpl, "bookingRequests.getBySubmissionId", { submissionId }));
      } catch {
        return { type: "unknown" };
      }
    },
  };
}

/** HMAC-SHA256 base64url over the exact payload string. Apps Script must reproduce this message. */
export function signBookingEnvelope(secret: string, action: string, ts: number, nonce: string, payload: string): string {
  return sign(secret, action, ts, nonce, payload);
}

/**
 * One signed call to the booking Apps Script. Shared with the inquiry API
 * (src/lib/inquiry), which uses the same deployment, secret and envelope.
 * Resolves the `data` object, null when the answer is unreadable; throws
 * GasRefusal for `{ ok: false }`.
 */
export async function callBookingGas(url: string, secret: string, fetchImpl: typeof fetch, action: string, payload: unknown): Promise<Record<string, unknown> | null> {
  return call(url, secret, fetchImpl, action, payload) as Promise<Record<string, unknown> | null>;
}

/** The deployment URL and secret, when both are valid (same rules as `bookingGasFromEnv`). */
export function bookingGasSettings(env: Record<string, string | undefined> = process.env): { url: string; secret: string } | null {
  const url = env.BOOKING_GAS_URL?.trim() ?? "";
  const secret = env.BOOKING_GAS_SECRET ?? "";
  return isExecUrl(url) && secret.length >= MIN_SECRET_LENGTH ? { url, secret } : null;
}

async function call(url: string, secret: string, fetchImpl: typeof fetch, action: string, payload: unknown): Promise<GasData | null> {
  const body = JSON.stringify(payload);
  const ts = Date.now();
  const nonce = randomBytes(16).toString("base64url");
  const envelope = {
    v: PROTOCOL_VERSION,
    action,
    ts,
    nonce,
    payload: body,
    sig: sign(secret, action, ts, nonce, body),
  };
  let response = await request(fetchImpl, url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(envelope),
  });
  if (!response) return null;
  if (REDIRECT_STATUSES.has(response.status)) {
    const location = resultLocation(response);
    if (!location) return null;
    response = await request(fetchImpl, location, { method: "GET" });
    if (!response || REDIRECT_STATUSES.has(response.status)) return null;
  }
  if (!response.ok) return null;
  const parsed = await response.json().catch(() => null);
  if (!parsed || typeof parsed !== "object") return null;
  const record = parsed as { ok?: unknown; data?: unknown; error?: { code?: unknown } };
  if (record.ok === true) {
    return record.data && typeof record.data === "object" && !Array.isArray(record.data)
      ? record.data as GasData
      : null;
  }
  if (record.ok === false) {
    const code = typeof record.error?.code === "string" ? record.error.code : "INTERNAL";
    throw new GasRefusal(code);
  }
  return null;
}

function readCreate(data: GasData | null): CreateOutcome {
  if (!data) return { type: "unknown" };
  if (typeof data.bookingRef !== "string" || !BOOKING_REF.test(data.bookingRef)) return { type: "unknown" };
  if (typeof data.replayed !== "boolean") return { type: "unknown" };
  return { type: "created", bookingRef: data.bookingRef, replayed: data.replayed };
}

function readGet(data: GasData | null): GetOutcome {
  if (!data) return { type: "unknown" };
  if (data.row === null) return { type: "row", row: null };
  const row = readRow(data.row);
  return row ? { type: "row", row } : { type: "unknown" };
}

function readRow(value: unknown): StoredSubmission | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const state = row.idempotencyState;
  if (state !== "IN_PROGRESS" && state !== "COMMITTED" && state !== "ABANDONED") return null;
  if (typeof row.bodyHash !== "string" || typeof row.bookingRef !== "string" || !BOOKING_REF.test(row.bookingRef)) return null;
  const rulesCheckedAt = row.rulesCheckedAt == null ? null : typeof row.rulesCheckedAt === "number" ? row.rulesCheckedAt : null;
  if (row.rulesCheckedAt != null && rulesCheckedAt == null) return null;
  return { idempotencyState: state, bodyHash: row.bodyHash, bookingRef: row.bookingRef, rulesCheckedAt };
}

export function refusalToOutcome(code: string): CreateOutcome {
  if (code === "UNAUTHORIZED") {
    return { type: "rejected", status: 401, body: { ok: false, kind: "server" } };
  }
  if (code === "DUPLICATE_CONFLICT") return { type: "conflict" };
  const reason = reasonFor(code);
  if (reason) {
    const body: BookingRequestFailure = { ok: false, kind: "unavailable", reason };
    return { type: "rejected", status: 422, body };
  }
  if (code === "VALIDATION") {
    return { type: "rejected", status: 400, body: { ok: false, kind: "validation", fieldErrors: {} } };
  }
  return { type: "unknown" };
}

function reasonFor(code: string) {
  if (code === "TOO_SOON") return "too_soon";
  if (code === "TOO_FAR") return "too_far";
  if (code === "ENDS_AFTER_CLOSE") return "ends_after_close";
  if (code === "SAME_CHOICE") return "same_choice";
  if (code === "BOOKING_CLOSED") return "booking_closed";
  return null;
}

function sign(secret: string, action: string, ts: number, nonce: string, payload: string): string {
  return createHmac("sha256", secret).update(`v${PROTOCOL_VERSION}\n${action}\n${ts}\n${nonce}\n${payload}`).digest("base64url");
}

function isExecUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.host === EXEC_HOST && /^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname);
  } catch {
    return false;
  }
}

function resultLocation(response: Response): string | null {
  try {
    const url = new URL(response.headers.get("location") ?? "");
    if (url.protocol === "https:" && url.host === RESULT_HOST) return url.toString();
  } catch {
    return null;
  }
  return null;
}

async function request(fetchImpl: typeof fetch, url: string, init: RequestInit): Promise<Response | null> {
  try {
    return await fetchImpl(url, { ...init, redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch {
    return null;
  }
}

export class GasRefusal extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}
