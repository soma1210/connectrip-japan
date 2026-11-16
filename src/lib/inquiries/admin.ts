import type { Notifier } from "@/lib/notify/email";
import { pgErrorCode, type Db } from "@/lib/pg";
import { deliverNotifications, type DeliveryReport } from "./outbox";
import { allowedNextStatuses, isInquiryStatus, NOTE_MAX, type InquiryKind, type InquiryStatus } from "./status";

/**
 * Admin data access for inquiries (Phase 2, 2026-11-16). Framework-free so it
 * can be tested; every caller (admin pages and Server Actions) must call
 * `requireAdmin()` first. All writes record an `inquiry_events` row with the
 * acting admin session, in the same transaction as the change.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isInquiryId = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

export type DashboardCounts = { total: number; fresh: number; bookingRequests: number; inProgress: number; emailFailed: number; emailWaiting: number };

export async function dashboardCounts(db: Db): Promise<DashboardCounts> {
  const r = await db.query<Record<string, number | string>>(
    `SELECT
       (SELECT count(*) FROM inquiries) AS total,
       (SELECT count(*) FROM inquiries WHERE status = 'received') AS fresh,
       (SELECT count(*) FROM inquiries WHERE kind = 'booking_request') AS booking_requests,
       (SELECT count(*) FROM inquiries WHERE status IN ('in_review', 'proposed')) AS in_progress,
       (SELECT count(*) FROM notification_outbox WHERE status = 'failed') AS email_failed,
       (SELECT count(*) FROM notification_outbox WHERE status IN ('pending', 'sending')) AS email_waiting`,
  );
  const row = r.rows[0] ?? {};
  const n = (k: string) => Number(row[k] ?? 0);
  return { total: n("total"), fresh: n("fresh"), bookingRequests: n("booking_requests"), inProgress: n("in_progress"), emailFailed: n("email_failed"), emailWaiting: n("email_waiting") };
}

export type InquiryListItem = {
  id: string;
  ref: string;
  kind: InquiryKind;
  service: string;
  status: InquiryStatus;
  customerName: string;
  customerEmail: string;
  preferredDate: string | null;
  createdAt: Date;
  emailStatus: string | null;
};

export type ListFilters = { status?: InquiryStatus; kind?: InquiryKind; emailFailed?: boolean; page?: number };
export const PAGE_SIZE = 50;

type ListRow = { id: string; ref: string; kind: InquiryKind; service: string; status: InquiryStatus; customer_name: string; customer_email: string; preferred_date: string | null; created_at: Date | string; email_status: string | null; total: number | string };

export async function listInquiries(db: Db, filters: ListFilters = {}): Promise<{ items: InquiryListItem[]; total: number; page: number }> {
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const r = await db.query<ListRow>(
    `SELECT i.id, i.ref, i.kind, i.service, i.status, i.customer_name, i.customer_email, i.preferred_date::text AS preferred_date, i.created_at,
            o.status AS email_status, count(*) OVER () AS total
     FROM inquiries i
     LEFT JOIN notification_outbox o ON o.inquiry_id = i.id AND o.channel = 'staff_email'
     WHERE ($1::text IS NULL OR i.status = $1::text)
       AND ($2::text IS NULL OR i.kind = $2::text)
       AND (NOT $3::boolean OR o.status = 'failed')
     ORDER BY i.created_at DESC, i.id
     LIMIT $4 OFFSET $5`,
    [filters.status ?? null, filters.kind ?? null, filters.emailFailed === true, PAGE_SIZE, (page - 1) * PAGE_SIZE],
  );
  return {
    page,
    total: Number(r.rows[0]?.total ?? 0),
    items: r.rows.map((row) => ({
      id: row.id,
      ref: row.ref,
      kind: row.kind,
      service: row.service,
      status: row.status,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      preferredDate: row.preferred_date,
      createdAt: new Date(row.created_at),
      emailStatus: row.email_status,
    })),
  };
}

export type InquiryEvent = { id: number; type: string; fromStatus: string | null; toStatus: string | null; note: string | null; actor: string; createdAt: Date };
export type OutboxEntry = { id: string; channel: string; status: string; attempts: number; lastError: string | null; nextAttemptAt: Date | null; sentAt: Date | null };
export type InquiryDetail = InquiryListItem & { adults: number | null; children: number | null; payload: Record<string, unknown>; version: number; updatedAt: Date; events: InquiryEvent[]; outbox: OutboxEntry[] };

export async function getInquiry(db: Db, id: string): Promise<InquiryDetail | null> {
  if (!isInquiryId(id)) return null;
  const r = await db.query<ListRow & { adults: number | null; children: number | null; payload: unknown; version: number; updated_at: Date | string }>(
    `SELECT id, ref, kind, service, status, customer_name, customer_email, preferred_date::text AS preferred_date, created_at, adults, children, payload, version, updated_at,
            NULL::text AS email_status, 1 AS total
     FROM inquiries WHERE id = $1`,
    [id],
  );
  const row = r.rows[0];
  if (!row) return null;
  const [events, outbox] = [
    await db.query<{ id: number | string; event_type: string; from_status: string | null; to_status: string | null; note: string | null; actor: string; created_at: Date | string }>(
      `SELECT id, event_type, from_status, to_status, note, actor, created_at FROM inquiry_events WHERE inquiry_id = $1 ORDER BY created_at DESC, id DESC`,
      [id],
    ),
    await db.query<{ id: string; channel: string; status: string; attempts: number; last_error: string | null; next_attempt_at: Date | string | null; sent_at: Date | string | null }>(
      `SELECT id, channel, status, attempts, last_error, next_attempt_at, sent_at FROM notification_outbox WHERE inquiry_id = $1 ORDER BY channel`,
      [id],
    ),
  ];
  const d = (v: Date | string | null) => (v == null ? null : new Date(v));
  return {
    id: row.id,
    ref: row.ref,
    kind: row.kind,
    service: row.service,
    status: row.status,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    preferredDate: row.preferred_date,
    createdAt: new Date(row.created_at),
    emailStatus: outbox.rows.find((o) => o.channel === "staff_email")?.status ?? null,
    adults: row.adults,
    children: row.children,
    payload: row.payload && typeof row.payload === "object" ? (row.payload as Record<string, unknown>) : {},
    version: Number(row.version),
    updatedAt: new Date(row.updated_at),
    events: events.rows.map((e) => ({ id: Number(e.id), type: e.event_type, fromStatus: e.from_status, toStatus: e.to_status, note: e.note, actor: e.actor, createdAt: new Date(e.created_at) })),
    outbox: outbox.rows.map((o) => ({ id: o.id, channel: o.channel, status: o.status, attempts: Number(o.attempts), lastError: o.last_error, nextAttemptAt: d(o.next_attempt_at), sentAt: d(o.sent_at) })),
  };
}

export type StatusChangeResult =
  | { ok: true; version: number }
  | { ok: false; reason: "not_found" | "conflict" | "invalid_status" | "not_allowed" | "confirmation_required" | "note_too_long" | "unavailable" };

/**
 * Status change with an optimistic lock: `expectedVersion` is the version the
 * admin was looking at. 'confirmed' also needs the reference number typed again.
 */
export async function changeStatus(
  db: Db,
  input: { id: string; to: unknown; expectedVersion: number; actor: string; note?: string | null; confirmRef?: string | null },
): Promise<StatusChangeResult> {
  if (!isInquiryId(input.id)) return { ok: false, reason: "not_found" };
  if (!isInquiryStatus(input.to)) return { ok: false, reason: "invalid_status" };
  const to = input.to;
  const note = input.note?.trim() || null;
  if (note && note.length > NOTE_MAX) return { ok: false, reason: "note_too_long" };
  if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 0) return { ok: false, reason: "conflict" };
  try {
    return await db.transaction(async (tx) => {
      const found = await tx.query<{ ref: string; kind: InquiryKind; status: InquiryStatus; version: number }>(`SELECT ref, kind, status, version FROM inquiries WHERE id = $1 FOR UPDATE`, [input.id]);
      const row = found.rows[0];
      if (!row) return { ok: false, reason: "not_found" } as const;
      if (Number(row.version) !== input.expectedVersion) return { ok: false, reason: "conflict" } as const;
      if (!allowedNextStatuses(row.kind, row.status).includes(to)) return { ok: false, reason: "not_allowed" } as const;
      if (to === "confirmed" && (input.confirmRef ?? "").trim().toUpperCase() !== row.ref) return { ok: false, reason: "confirmation_required" } as const;
      const updated = await tx.query<{ version: number }>(
        `UPDATE inquiries SET status = $2, version = version + 1, updated_at = now() WHERE id = $1 AND version = $3 RETURNING version`,
        [input.id, to, input.expectedVersion],
      );
      if (!updated.rows[0]) return { ok: false, reason: "conflict" } as const;
      await tx.query(`INSERT INTO inquiry_events (inquiry_id, event_type, from_status, to_status, note, actor) VALUES ($1, 'status_changed', $2, $3, $4, $5)`, [
        input.id,
        row.status,
        to,
        note,
        input.actor,
      ]);
      return { ok: true, version: Number(updated.rows[0].version) } as const;
    });
  } catch (error) {
    console.error(`[inquiries] status change failed (${pgErrorCode(error) ?? "unknown"})`);
    return { ok: false, reason: "unavailable" };
  }
}

export type NoteResult = { ok: true } | { ok: false; reason: "not_found" | "empty" | "note_too_long" | "unavailable" };

export async function addNote(db: Db, input: { id: string; note: unknown; actor: string }): Promise<NoteResult> {
  if (!isInquiryId(input.id)) return { ok: false, reason: "not_found" };
  const note = typeof input.note === "string" ? input.note.trim() : "";
  if (!note) return { ok: false, reason: "empty" };
  if (note.length > NOTE_MAX) return { ok: false, reason: "note_too_long" };
  try {
    const r = await db.query<{ id: number }>(
      `INSERT INTO inquiry_events (inquiry_id, event_type, note, actor) SELECT id, 'note_added', $2, $3 FROM inquiries WHERE id = $1 RETURNING id`,
      [input.id, note, input.actor],
    );
    return r.rows[0] ? { ok: true } : { ok: false, reason: "not_found" };
  } catch (error) {
    console.error(`[inquiries] note failed (${pgErrorCode(error) ?? "unknown"})`);
    return { ok: false, reason: "unavailable" };
  }
}

export type ResendResult =
  | { ok: true; report: DeliveryReport }
  | { ok: false; reason: "not_found" | "already_sent" | "in_progress" | "not_configured" | "unavailable" };

/**
 * Manual resend of the staff email. Only an unsent row (pending / failed) is
 * made due; a 'sent' row is never sent again, and a row another sender is
 * holding ('sending') is left alone. The send itself goes through the same
 * atomic claim as the retry job, so a double click or a parallel job cannot
 * send twice.
 */
export async function resendStaffEmail(db: Db, notifier: Notifier | null, input: { id: string; actor: string }): Promise<ResendResult> {
  if (!isInquiryId(input.id)) return { ok: false, reason: "not_found" };
  try {
    const current = await db.query<{ status: string; locked: boolean }>(
      `SELECT status, (locked_until IS NOT NULL AND locked_until > now()) AS locked FROM notification_outbox WHERE inquiry_id = $1 AND channel = 'staff_email'`,
      [input.id],
    );
    const row = current.rows[0];
    if (!row) return { ok: false, reason: "not_found" };
    if (row.status === "sent") return { ok: false, reason: "already_sent" };
    if (row.status === "sending" && row.locked) return { ok: false, reason: "in_progress" };
    if (!notifier) return { ok: false, reason: "not_configured" };
    await db.query(
      `UPDATE notification_outbox SET next_attempt_at = now(), updated_at = now() WHERE inquiry_id = $1 AND channel = 'staff_email' AND status IN ('pending', 'failed')`,
      [input.id],
    );
    const report = await deliverNotifications(db, notifier, { inquiryId: input.id, actor: input.actor });
    if (report.sent === 0 && report.failed === 0) return { ok: false, reason: "in_progress" };
    return { ok: true, report };
  } catch (error) {
    console.error(`[inquiries] resend failed (${pgErrorCode(error) ?? "unknown"})`);
    return { ok: false, reason: "unavailable" };
  }
}
