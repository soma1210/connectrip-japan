import type { BookingRequestFailure, BookingRequestSuccess, PrivateGuideBookingRequest } from "@/contracts/bookingRequest";
import { bookingBodyHash } from "./rules";

/** What Apps Script stored for one submission id. The sheet remains the source of truth. */
export type StoredSubmission = {
  idempotencyState: "IN_PROGRESS" | "COMMITTED" | "ABANDONED";
  bodyHash: string;
  bookingRef: string;
  /** Milliseconds. Absent when the row was left incomplete before the rules were recorded. */
  rulesCheckedAt: number | null;
};

export type CreateOutcome =
  | { type: "created"; bookingRef: string; replayed: boolean }
  | { type: "conflict" }
  | { type: "rejected"; body: BookingRequestFailure; status: 400 | 401 | 422 }
  | { type: "unknown" }
  | { type: "not_configured" };

export type GetOutcome =
  | { type: "row"; row: StoredSubmission | null }
  | { type: "unknown" }
  | { type: "not_configured" };

export type BookingGas = {
  create(booking: PrivateGuideBookingRequest, bodyHash: string): Promise<CreateOutcome>;
  get(submissionId: string): Promise<GetOutcome>;
};

export type SubmitResult = {
  status: number;
  body: BookingRequestSuccess | BookingRequestFailure;
};

const STALE_IN_PROGRESS_MS = 15 * 60 * 1000;

/**
 * One automatic recovery after an unknown create. The submission id never changes here.
 * A different body with the same id is a conflict and is not retried.
 */
export async function submitBookingRequest(booking: PrivateGuideBookingRequest, gas: BookingGas, now = Date.now()): Promise<SubmitResult> {
  const bodyHash = bookingBodyHash(booking);
  const first = await gas.create(booking, bodyHash);
  if (first.type === "not_configured") return server();
  if (first.type !== "unknown") return toResult(first);

  const loaded = await gas.get(booking.submissionId);
  if (loaded.type === "not_configured" || loaded.type === "unknown") return server();
  const decision = decideReplay(loaded.row, bodyHash, now);
  if (decision === "return") {
    return accepted(loaded.row!.bookingRef, true);
  }
  if (decision === "conflict") return conflict();
  const second = await gas.create(booking, bodyHash);
  if (second.type === "unknown" || second.type === "not_configured") return server();
  return toResult(second);
}

export function decideReplay(row: StoredSubmission | null, bodyHash: string, now: number): "create" | "return" | "conflict" | "resume" {
  if (!row) return "create";
  if (row.bodyHash !== bodyHash) return "conflict";
  if (row.idempotencyState === "COMMITTED") return "return";
  if (row.idempotencyState === "IN_PROGRESS") {
    const fresh = row.rulesCheckedAt != null && now - row.rulesCheckedAt <= STALE_IN_PROGRESS_MS;
    return fresh ? "resume" : "create";
  }
  return "create";
}

function toResult(outcome: Exclude<CreateOutcome, { type: "unknown" | "not_configured" }>): SubmitResult {
  if (outcome.type === "created") return accepted(outcome.bookingRef, outcome.replayed);
  if (outcome.type === "conflict") return conflict();
  return { status: outcome.status, body: outcome.body };
}

function accepted(bookingRef: string, replayed: boolean): SubmitResult {
  return { status: 200, body: { ok: true, accepted: true, bookingRef, status: "REQUESTED", replayed } };
}

function conflict(): SubmitResult {
  return { status: 409, body: { ok: false, kind: "conflict" } };
}

function server(): SubmitResult {
  return { status: 503, body: { ok: false, kind: "server" } };
}
