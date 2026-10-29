// guide_interviews storage (sql/guide-interviews.sql).
//
// Postgres only: the double-booking and daily-limit guarantees rely on the
// table's constraints and on transactions, so there is no local-file fallback.
// Every state change is a conditional UPDATE on the expected status, so two
// admins (or a double click) cannot move the same interview twice.

import { sql, isDbConfigured } from "@/lib/db";
import {
  fromJst,
  holdEnd,
  interviewInterval,
  jstDate,
  type Interval,
  type SlotRejection,
} from "@/features/guide-interviews/availability";
import { BOOKING_TOKEN_TTL_DAYS } from "@/features/guide-interviews/rules";
import { hashBookingToken, isWellFormedToken, newBookingToken } from "@/features/guide-interviews/token";
import {
  HELD_STATUSES,
  type GuideInterview,
  type GuideInterviewWithApplicant,
} from "@/features/guide-interviews/types";

export const INTERVIEWER = "soma";

/** Pipeline stages moved to on confirmation / completion (guide_pipeline_statuses). */
const PIPELINE_ON_CONFIRMED = "面談予定";
const PIPELINE_ON_COMPLETED = "面談済み";

/** An APPROVING row older than this is treated as an abandoned approval and may be retried. */
const STALE_APPROVAL_SECONDS = 120;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Postgres exclusion_violation: another held interview took the slot first. */
const EXCLUSION_VIOLATION = "23P01";
/** Postgres unique_violation. */
const UNIQUE_VIOLATION = "23505";
/** Postgres undefined_table: sql/guide-interviews.sql has not been applied yet. */
const UNDEFINED_TABLE = "42P01";

export class InterviewStorageUnavailableError extends Error {
  constructor() {
    super("Interview storage is not configured (POSTGRES_URL is missing).");
  }
}

/** The interview is not in a state that allows the operation. `code` is safe to show. */
export class InterviewStateError extends Error {
  constructor(
    readonly code:
      | "NOT_FOUND"
      | "EXPIRED"
      | "ALREADY_REQUESTED"
      | "OPEN_INTERVIEW_EXISTS"
      | "WRONG_STATUS",
  ) {
    super(code);
  }
}

/** The requested slot cannot be held. */
export class SlotRejectedError extends Error {
  constructor(readonly reason: SlotRejection) {
    super(reason);
  }
}

const COLUMNS = `
  i.id, i.guide_application_id, i.interviewer, i.status, i.status_reason, i.token_expires_at,
  i.requested_start_at, i.requested_end_at, i.requested_at, i.google_event_id, i.meet_url,
  i.invitation_email_sent_at, i.confirmation_email_sent_at,
  i.approved_at, i.rejected_at, i.cancelled_at, i.created_at, i.updated_at
`;
const WITH_APPLICANT = `${COLUMNS}, a.name AS applicant_name, a.email AS applicant_email`;
const FROM_WITH_APPLICANT = "guide_interviews i JOIN guide_applications a ON a.id = i.guide_application_id";

const TIMESTAMP_FIELDS = [
  "token_expires_at", "requested_start_at", "requested_end_at", "requested_at",
  "invitation_email_sent_at", "confirmation_email_sent_at",
  "approved_at", "rejected_at", "cancelled_at", "created_at", "updated_at",
] as const;

function fromRow<T extends GuideInterview>(row: Record<string, unknown>): T {
  const result = { ...row } as Record<string, unknown>;
  for (const field of TIMESTAMP_FIELDS) {
    const value = row[field];
    result[field] = value == null ? null : value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
  }
  return result as unknown as T;
}

function requireDb() {
  if (!isDbConfigured) throw new InterviewStorageUnavailableError();
}

function pgCode(error: unknown): string | undefined {
  return (error as { code?: string } | null)?.code;
}

/**
 * For admin screens that existed before interviews: if the migration has not
 * been applied yet, show no interviews instead of breaking the page.
 */
async function emptyIfNoTable<T>(read: () => Promise<T[]>): Promise<T[]> {
  try {
    return await read();
  } catch (error) {
    if (pgCode(error) === UNDEFINED_TABLE) {
      console.warn("[interviews] guide_interviews table is missing — apply sql/guide-interviews.sql");
      return [];
    }
    throw error;
  }
}

type Queryable = Pick<typeof sql, "query">;

/** Run fn inside one transaction on one pooled connection. */
async function transaction<T>(fn: (client: Queryable) => Promise<T>): Promise<T> {
  const client = await sql.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/** Move an application forward to `stage`, never backward, and only if the stage exists. */
async function advancePipeline(client: Queryable, applicationId: string, stage: string) {
  await client.query(
    `UPDATE guide_applications a
        SET pipeline_status = $2, updated_at = now()
       FROM guide_pipeline_statuses target, guide_pipeline_statuses current
      WHERE a.id = $1
        AND target.name = $2
        AND current.name = a.pipeline_status
        AND current.sort_order < target.sort_order`,
    [applicationId, stage],
  );
}

// --- admin: invitations ------------------------------------------------------

/**
 * Issue a booking link for an application. An unused earlier link is
 * cancelled. Refuses while an interview is requested or confirmed.
 * Returns the raw token: it is not stored and cannot be shown again.
 */
export async function createInvitation(
  applicationId: string,
): Promise<{ interview: GuideInterviewWithApplicant; token: string }> {
  requireDb();
  if (!UUID_PATTERN.test(applicationId)) throw new InterviewStateError("NOT_FOUND");

  const token = newBookingToken();
  try {
    return await transaction(async (client) => {
      // Lock the application so two "send invitation" clicks run one after the other.
      const app = await client.query("SELECT id FROM guide_applications WHERE id = $1 FOR UPDATE", [applicationId]);
      if (app.rows.length === 0) throw new InterviewStateError("NOT_FOUND");

      const held = await client.query(
        `SELECT 1 FROM guide_interviews WHERE guide_application_id = $1 AND status = ANY($2::text[])`,
        [applicationId, HELD_STATUSES],
      );
      if (held.rows.length > 0) throw new InterviewStateError("OPEN_INTERVIEW_EXISTS");

      await client.query(
        `UPDATE guide_interviews
            SET status = 'CANCELLED', status_reason = 'Booking link reissued', cancelled_at = now(), updated_at = now()
          WHERE guide_application_id = $1 AND status = 'INVITED'`,
        [applicationId],
      );

      const { rows } = await client.query(
        `WITH inserted AS (
           INSERT INTO guide_interviews (guide_application_id, interviewer, status, booking_token_hash, token_expires_at)
           VALUES ($1, $2, 'INVITED', $3, now() + make_interval(days => $4))
           RETURNING *
         )
         SELECT ${WITH_APPLICANT} FROM inserted i JOIN guide_applications a ON a.id = i.guide_application_id`,
        [applicationId, INTERVIEWER, hashBookingToken(token), BOOKING_TOKEN_TTL_DAYS],
      );
      return { interview: fromRow<GuideInterviewWithApplicant>(rows[0]), token };
    });
  } catch (error) {
    if (pgCode(error) === UNIQUE_VIOLATION) throw new InterviewStateError("OPEN_INTERVIEW_EXISTS");
    throw error;
  }
}

// --- applicant: booking ------------------------------------------------------

/** The interview a booking link belongs to, or null for an unknown / malformed token. */
export async function getInterviewByToken(token: string): Promise<GuideInterviewWithApplicant | null> {
  requireDb();
  if (!isWellFormedToken(token)) return null;
  const { rows } = await sql.query(
    `SELECT ${WITH_APPLICANT} FROM ${FROM_WITH_APPLICANT} WHERE i.booking_token_hash = $1`,
    [hashBookingToken(token)],
  );
  return rows[0] ? fromRow<GuideInterviewWithApplicant>(rows[0]) : null;
}

/** Interviews holding a slot that starts inside the window. */
export async function listHeldIntervals(window: Interval, excludeId?: string): Promise<Interval[]> {
  requireDb();
  return heldIntervals(sql, window, excludeId);
}

async function heldIntervals(client: Queryable, window: Interval, excludeId?: string): Promise<Interval[]> {
  const { rows } = await client.query(
    `SELECT requested_start_at FROM guide_interviews
      WHERE interviewer = $1
        AND status = ANY($2::text[])
        AND requested_start_at >= $3 AND requested_start_at < $4
        AND ($5::uuid IS NULL OR id <> $5::uuid)`,
    [INTERVIEWER, HELD_STATUSES, window.start.toISOString(), window.end.toISOString(), excludeId ?? null],
  );
  return rows.map((row) => interviewInterval(new Date(row.requested_start_at as string | Date)));
}

/**
 * Hold a slot for the token's interview: INVITED → PENDING_APPROVAL.
 *
 * `decide` receives the other interviews held on that JST day and returns why
 * the slot cannot be held (or null). It runs under a per-day advisory lock, so
 * two requests for the same day are checked one after the other and the daily
 * limit cannot be overshot. The exclusion constraint backs up the overlap rule.
 */
export async function holdSlot(
  token: string,
  start: Date,
  decide: (heldThatDay: Interval[]) => SlotRejection | null,
): Promise<GuideInterview> {
  requireDb();
  if (!isWellFormedToken(token)) throw new InterviewStateError("NOT_FOUND");

  const date = jstDate(start);
  const day: Interval = { start: fromJst(date, "00:00")!, end: new Date(fromJst(date, "00:00")!.getTime() + 86_400_000) };
  const interval = interviewInterval(start);

  try {
    return await transaction(async (client) => {
      const found = await client.query(
        `SELECT id, status, token_expires_at FROM guide_interviews WHERE booking_token_hash = $1 FOR UPDATE`,
        [hashBookingToken(token)],
      );
      const row = found.rows[0];
      if (!row) throw new InterviewStateError("NOT_FOUND");
      if (row.status !== "INVITED") throw new InterviewStateError("ALREADY_REQUESTED");
      if (new Date(row.token_expires_at as string | Date) <= new Date()) throw new InterviewStateError("EXPIRED");

      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`guide_interviews:${INTERVIEWER}:${date}`]);

      const rejection = decide(await heldIntervals(client, day, row.id as string));
      if (rejection) throw new SlotRejectedError(rejection);

      const { rows } = await client.query(
        `UPDATE guide_interviews i
            SET status = 'PENDING_APPROVAL', requested_start_at = $2, requested_end_at = $3, hold_end_at = $4,
                requested_at = now(), updated_at = now()
          WHERE i.id = $1 AND i.status = 'INVITED'
          RETURNING ${COLUMNS}`,
        [row.id, interval.start.toISOString(), interval.end.toISOString(), holdEnd(start).toISOString()],
      );
      return fromRow<GuideInterview>(rows[0]);
    });
  } catch (error) {
    if (pgCode(error) === EXCLUSION_VIOLATION) throw new SlotRejectedError("INTERVIEW_CONFLICT");
    throw error;
  }
}

// --- admin: review -----------------------------------------------------------

export async function getInterview(id: string): Promise<GuideInterviewWithApplicant | null> {
  requireDb();
  if (!UUID_PATTERN.test(id)) return null;
  const { rows } = await sql.query(`SELECT ${WITH_APPLICANT} FROM ${FROM_WITH_APPLICANT} WHERE i.id = $1`, [id]);
  return rows[0] ? fromRow<GuideInterviewWithApplicant>(rows[0]) : null;
}

/** Newest first. Empty when no database is connected, so the admin page still renders. */
export async function listInterviewsForApplication(applicationId: string): Promise<GuideInterview[]> {
  if (!isDbConfigured || !UUID_PATTERN.test(applicationId)) return [];
  return emptyIfNoTable(async () => {
    const { rows } = await sql.query(
      `SELECT ${COLUMNS} FROM guide_interviews i WHERE i.guide_application_id = $1 ORDER BY i.created_at DESC`,
      [applicationId],
    );
    return rows.map((row) => fromRow<GuideInterview>(row));
  });
}

/** Requests waiting for an admin, soonest first. */
export async function listPendingInterviews(): Promise<GuideInterviewWithApplicant[]> {
  if (!isDbConfigured) return [];
  return emptyIfNoTable(async () => {
    const { rows } = await sql.query(
      `SELECT ${WITH_APPLICANT} FROM ${FROM_WITH_APPLICANT}
        WHERE i.status IN ('PENDING_APPROVAL', 'APPROVING')
        ORDER BY i.requested_start_at ASC`,
    );
    return rows.map((row) => fromRow<GuideInterviewWithApplicant>(row));
  });
}

/**
 * PENDING_APPROVAL → APPROVING, recording the calendar event id about to be
 * created. Also takes over an approval abandoned mid-way (still APPROVING
 * after a while): `previousEventId` is then the event the earlier attempt may
 * have created, which the caller must delete first.
 */
export async function claimForApproval(
  id: string,
  eventId: string,
): Promise<{ interview: GuideInterviewWithApplicant; previousEventId: string | null }> {
  requireDb();
  if (!UUID_PATTERN.test(id)) throw new InterviewStateError("NOT_FOUND");
  const { rows } = await sql.query(
    `WITH previous AS (
       SELECT id, google_event_id FROM guide_interviews
        WHERE id = $1
          AND (status = 'PENDING_APPROVAL'
               OR (status = 'APPROVING' AND updated_at < now() - make_interval(secs => $3)))
        FOR UPDATE
     ), claimed AS (
       UPDATE guide_interviews i
          SET status = 'APPROVING', google_event_id = $2, updated_at = now()
         FROM previous
        WHERE i.id = previous.id
       RETURNING i.*, previous.google_event_id AS previous_event_id
     )
     SELECT ${WITH_APPLICANT}, i.previous_event_id FROM claimed i JOIN guide_applications a ON a.id = i.guide_application_id`,
    [id, eventId, STALE_APPROVAL_SECONDS],
  );
  if (rows.length === 0) throw new InterviewStateError("WRONG_STATUS");
  const { previous_event_id, ...row } = rows[0];
  return { interview: fromRow<GuideInterviewWithApplicant>(row), previousEventId: (previous_event_id as string | null) ?? null };
}

/** APPROVING → PENDING_APPROVAL after a failed approval. The slot stays held. */
export async function releaseApproval(id: string): Promise<void> {
  requireDb();
  await sql.query(
    `UPDATE guide_interviews SET status = 'PENDING_APPROVAL', google_event_id = NULL, updated_at = now()
      WHERE id = $1 AND status = 'APPROVING'`,
    [id],
  );
}

/** APPROVING → CONFIRMED with the created event, and move the application to 面談予定. */
export async function confirmInterview(id: string, eventId: string, meetUrl: string): Promise<GuideInterview> {
  requireDb();
  return transaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE guide_interviews i
          SET status = 'CONFIRMED', meet_url = $3, approved_at = now(), updated_at = now()
        WHERE i.id = $1 AND i.status = 'APPROVING' AND i.google_event_id = $2
        RETURNING ${COLUMNS}`,
      [id, eventId, meetUrl],
    );
    if (rows.length === 0) throw new InterviewStateError("WRONG_STATUS");
    const interview = fromRow<GuideInterview>(rows[0]);
    await advancePipeline(client, interview.guide_application_id, PIPELINE_ON_CONFIRMED);
    return interview;
  });
}

/** PENDING_APPROVAL → REJECTED. Frees the slot. */
export async function rejectInterview(id: string, reason: string | null): Promise<GuideInterviewWithApplicant> {
  requireDb();
  if (!UUID_PATTERN.test(id)) throw new InterviewStateError("NOT_FOUND");
  const { rows } = await sql.query(
    `WITH updated AS (
       UPDATE guide_interviews
          SET status = 'REJECTED', status_reason = $2, rejected_at = now(), updated_at = now()
        WHERE id = $1 AND status = 'PENDING_APPROVAL'
       RETURNING *
     )
     SELECT ${WITH_APPLICANT} FROM updated i JOIN guide_applications a ON a.id = i.guide_application_id`,
    [id, reason],
  );
  if (rows.length === 0) throw new InterviewStateError("WRONG_STATUS");
  return fromRow<GuideInterviewWithApplicant>(rows[0]);
}

/**
 * INVITED / PENDING_APPROVAL / CONFIRMED → CANCELLED. Frees the slot and
 * disables the link. For a confirmed interview the caller deletes the
 * calendar event afterwards (google_event_id is kept for that).
 */
export async function cancelInterview(id: string, reason: string | null): Promise<GuideInterviewWithApplicant> {
  requireDb();
  if (!UUID_PATTERN.test(id)) throw new InterviewStateError("NOT_FOUND");
  const { rows } = await sql.query(
    `WITH updated AS (
       UPDATE guide_interviews
          SET status = 'CANCELLED', status_reason = $2, cancelled_at = now(), updated_at = now()
        WHERE id = $1 AND status IN ('INVITED', 'PENDING_APPROVAL', 'CONFIRMED')
       RETURNING *
     )
     SELECT ${WITH_APPLICANT} FROM updated i JOIN guide_applications a ON a.id = i.guide_application_id`,
    [id, reason],
  );
  if (rows.length === 0) throw new InterviewStateError("WRONG_STATUS");
  return fromRow<GuideInterviewWithApplicant>(rows[0]);
}

/** CONFIRMED → COMPLETED once the interview has ended, and move the application to 面談済み. */
export async function completeInterview(id: string): Promise<void> {
  requireDb();
  if (!UUID_PATTERN.test(id)) throw new InterviewStateError("NOT_FOUND");
  await transaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE guide_interviews SET status = 'COMPLETED', updated_at = now()
        WHERE id = $1 AND status = 'CONFIRMED' AND requested_end_at <= now()
        RETURNING guide_application_id`,
      [id],
    );
    if (rows.length === 0) throw new InterviewStateError("WRONG_STATUS");
    await advancePipeline(client, rows[0].guide_application_id as string, PIPELINE_ON_COMPLETED);
  });
}

export async function markEmailSent(id: string, kind: "invitation" | "confirmation"): Promise<void> {
  requireDb();
  const column = kind === "invitation" ? "invitation_email_sent_at" : "confirmation_email_sent_at";
  await sql.query(`UPDATE guide_interviews SET ${column} = now(), updated_at = now() WHERE id = $1`, [id]);
}
