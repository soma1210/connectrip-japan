import type { BookingRequest } from "@/contracts/bookingRequest";
import { bookingRequestEmail } from "@/lib/booking-request/notification";
import { inquiryEmail } from "@/lib/inquiry/notification";
import type { InquiryRecord } from "@/lib/inquiry/rules";
import type { NotificationEmail, Notifier } from "@/lib/notify/email";
import type { Db } from "@/lib/pg";

/**
 * Notification outbox (Phase 1, 2026-11-16). Every stored inquiry has one
 * `staff_email` row (created in the same transaction as the inquiry). This
 * module sends due rows and records what happened:
 *
 * - A row is claimed atomically (status 'sending' + a short lock), so two
 *   requests, or a request and a later retry job, never send it twice at once.
 * - sent   → status 'sent', provider message id, event 'notification_sent'.
 * - failed → status 'failed', `next_attempt_at` with back-off, event
 *   'notification_failed'. After MAX_ATTEMPTS the row stays 'failed' with no
 *   next attempt (an admin can resend it, Phase 2).
 * - No SMTP settings → the row stays 'pending' with last_error
 *   'not_configured' and is sent once the settings exist.
 *
 * Emails are rebuilt from the stored inquiry, so the outbox holds no personal
 * data; errors are stored as short codes only. Delivery is at-least-once: a
 * provider timeout after it accepted the message can lead to a second email.
 */

export const MAX_ATTEMPTS = 8;
const LOCK_SECONDS = 120;

/** Minutes to wait after the n-th failed attempt: 1, 2, 4 … capped at 6 hours. */
export function backoffMinutes(attempts: number): number {
  return Math.min(2 ** Math.max(0, attempts - 1), 360);
}

export type DeliveryReport = { sent: number; failed: number; pending: number };

type Claimed = { id: string; inquiry_id: string; channel: string; attempts: number };
type InquiryRow = { kind: string; ref: string; payload: unknown; created_at: Date | string };

export async function deliverNotifications(
  db: Db,
  notifier: Notifier | null,
  { inquiryId = null, limit = 10, actor = "system" }: { inquiryId?: string | null; limit?: number; actor?: string } = {},
): Promise<DeliveryReport> {
  if (!notifier) {
    const marked = await db.query<{ id: string }>(
      `UPDATE notification_outbox SET last_error = 'not_configured', updated_at = now()
       WHERE status = 'pending' AND channel = 'staff_email' AND ($1::uuid IS NULL OR inquiry_id = $1::uuid)
       RETURNING id`,
      [inquiryId],
    );
    return { sent: 0, failed: 0, pending: marked.rows.length };
  }

  const claimed = await db.query<Claimed>(
    `UPDATE notification_outbox o
     SET status = 'sending', attempts = o.attempts + 1, locked_until = now() + make_interval(secs => $3), updated_at = now()
     WHERE o.id IN (
       SELECT id FROM notification_outbox
       WHERE channel = 'staff_email'
         AND ($1::uuid IS NULL OR inquiry_id = $1::uuid)
         AND ((status IN ('pending', 'failed') AND next_attempt_at <= now())
              OR (status = 'sending' AND locked_until < now()))
       ORDER BY next_attempt_at
       LIMIT $2
       FOR UPDATE SKIP LOCKED
     )
     RETURNING o.id, o.inquiry_id, o.channel, o.attempts`,
    [inquiryId, limit, LOCK_SECONDS],
  );

  const report: DeliveryReport = { sent: 0, failed: 0, pending: 0 };
  for (const row of claimed.rows) {
    const email = await emailFor(db, row.inquiry_id);
    const result = email ? await notifier.send(email) : ({ status: "failed" } as const);
    const errorCode = email ? "send_failed" : "inquiry_unreadable";
    if (result.status === "sent") {
      await db.transaction(async (tx) => {
        await tx.query(
          `UPDATE notification_outbox SET status = 'sent', sent_at = now(), provider_message_id = $2, last_error = NULL, locked_until = NULL, next_attempt_at = NULL, updated_at = now() WHERE id = $1`,
          [row.id, result.messageId ?? null],
        );
        await tx.query(`INSERT INTO inquiry_events (inquiry_id, event_type, note, actor) VALUES ($1, 'notification_sent', $2, $3)`, [row.inquiry_id, row.channel, actor]);
      });
      report.sent++;
    } else {
      const giveUp = row.attempts >= MAX_ATTEMPTS;
      await db.transaction(async (tx) => {
        await tx.query(
          `UPDATE notification_outbox
           SET status = 'failed', last_error = $2, locked_until = NULL,
               next_attempt_at = CASE WHEN $3::boolean THEN NULL ELSE now() + make_interval(mins => $4) END, updated_at = now()
           WHERE id = $1`,
          [row.id, result.status === "not_configured" ? "not_configured" : errorCode, giveUp, backoffMinutes(row.attempts)],
        );
        await tx.query(`INSERT INTO inquiry_events (inquiry_id, event_type, note, actor) VALUES ($1, 'notification_failed', $2, $3)`, [
          row.inquiry_id,
          `${row.channel} attempt ${row.attempts}${giveUp ? " (no further automatic retries)" : ""}`,
          actor,
        ]);
      });
      console.error(`[inquiries] staff email failed (attempt ${row.attempts}) for outbox ${row.id}; the inquiry is stored`);
      report.failed++;
    }
  }
  return report;
}

/** The staff email for a stored inquiry, rebuilt from its saved payload. */
async function emailFor(db: Db, inquiryId: string): Promise<NotificationEmail | null> {
  const found = await db.query<InquiryRow>(`SELECT kind, ref, payload, created_at FROM inquiries WHERE id = $1`, [inquiryId]);
  const row = found.rows[0];
  if (!row || !row.payload || typeof row.payload !== "object") return null;
  const receivedAt = new Date(row.created_at);
  // A payload that no longer fits the builder must not stop the batch or leave the row in 'sending'.
  try {
    if (row.kind === "contact") return inquiryEmail(row.payload as InquiryRecord, row.ref, receivedAt);
    if (row.kind === "booking_request") return bookingRequestEmail(row.payload as BookingRequest, row.ref, receivedAt);
  } catch {
    return null;
  }
  return null;
}
