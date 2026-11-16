import { randomInt } from "node:crypto";
import { notifierFromEnv, type Notifier } from "@/lib/notify/email";
import { dbFromEnv, pgErrorCode, type Db } from "@/lib/pg";
import { deliverNotifications } from "./outbox";
import type { InquiryKind } from "./status";

/**
 * Postgres store for the Website v1 forms (Phase 1, 2026-11-16): contact
 * inquiries and booking requests in one `inquiries` table, told apart by
 * `kind`. Replaces the booking Apps Script as the system of record; the
 * Google Sheets data stays where it is and is not read or written here.
 *
 * One transaction per submission: the inquiry row, its 'received' event and
 * its staff-email outbox row are committed together, so a stored inquiry
 * always has a pending notification and an email can never go out for an
 * inquiry that was not stored. Email is sent after the commit (outbox.ts).
 *
 * Double submits: `submission_id` is UNIQUE. The same id with the same body
 * returns the stored row (`replayed`), the same id with another body is a
 * conflict. Concurrent duplicates are serialised by the unique index.
 */

export { INQUIRY_STATUSES, type InquiryKind, type InquiryStatus } from "./status";

export type NewSubmission = {
  kind: InquiryKind;
  /** 'private_guide' or an Experience id. */
  service: string;
  submissionId: string;
  bodyHash: string;
  customerName: string;
  customerEmail: string;
  /** YYYY-MM-DD or null. */
  preferredDate: string | null;
  adults: number | null;
  children: number | null;
  /** The validated submission, stored as JSONB (detail view, email rebuilds). */
  payload: unknown;
};

export type CreateResult = { type: "created"; id: string; ref: string; replayed: boolean } | { type: "conflict" } | { type: "unavailable" };

export type FormStore = {
  create(input: NewSubmission): Promise<CreateResult>;
  /** Sends the pending notifications of one inquiry. Never throws; results are recorded in the outbox. */
  notify(inquiryId: string): Promise<void>;
};

const REF_PREFIX: Record<InquiryKind, string> = { contact: "CQ", booking_request: "CR" };
const REF_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const REF_ATTEMPTS = 3;

/** CQ-20261116-7KQ2ZD: prefix, the Japan date, six random characters. */
export function newRef(kind: InquiryKind, at: Date = new Date()): string {
  const day = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(at).replaceAll("-", "");
  let tail = "";
  for (let i = 0; i < 6; i++) tail += REF_ALPHABET[randomInt(REF_ALPHABET.length)];
  return `${REF_PREFIX[kind]}-${day}-${tail}`;
}

type Inserted = { id: string; ref: string };
type Existing = { id: string; ref: string; kind: string; body_hash: string };

export async function createSubmission(db: Db, input: NewSubmission, makeRef: (kind: InquiryKind) => string = newRef): Promise<CreateResult> {
  for (let attempt = 0; attempt < REF_ATTEMPTS; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const inserted = await tx.query<Inserted>(
          `INSERT INTO inquiries (ref, kind, service, submission_id, body_hash, customer_name, customer_email, preferred_date, adults, children, payload)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
           ON CONFLICT (submission_id) DO NOTHING
           RETURNING id, ref`,
          [
            makeRef(input.kind),
            input.kind,
            input.service,
            input.submissionId,
            input.bodyHash,
            input.customerName,
            input.customerEmail,
            input.preferredDate,
            input.adults,
            input.children,
            JSON.stringify(input.payload),
          ],
        );
        const row = inserted.rows[0];
        if (row) {
          await tx.query(`INSERT INTO inquiry_events (inquiry_id, event_type, to_status, actor) VALUES ($1, 'received', 'received', 'website')`, [row.id]);
          await tx.query(`INSERT INTO notification_outbox (inquiry_id, channel) VALUES ($1, 'staff_email')`, [row.id]);
          return { type: "created", id: row.id, ref: row.ref, replayed: false } as const;
        }
        const existing = await tx.query<Existing>(`SELECT id, ref, kind, body_hash FROM inquiries WHERE submission_id = $1`, [input.submissionId]);
        const found = existing.rows[0];
        if (!found) throw Object.assign(new Error("submission vanished"), { code: "retry" });
        if (found.kind !== input.kind || found.body_hash !== input.bodyHash) return { type: "conflict" } as const;
        return { type: "created", id: found.id, ref: found.ref, replayed: true } as const;
      });
    } catch (error) {
      const code = pgErrorCode(error);
      // 23505 here can only be the ref (submission_id conflicts are DO NOTHING): draw a new ref.
      if ((code === "23505" || code === "retry") && attempt < REF_ATTEMPTS - 1) continue;
      // Code only: never the submitted values.
      console.error(`[inquiries] store failed (${code ?? "unknown"})`);
      return { type: "unavailable" };
    }
  }
  return { type: "unavailable" };
}

export function postgresFormStore(db: Db, notifier: Notifier | null): FormStore {
  return {
    create: (input) => createSubmission(db, input),
    async notify(inquiryId) {
      try {
        await deliverNotifications(db, notifier, { inquiryId });
      } catch (error) {
        console.error(`[inquiries] notification step failed (${pgErrorCode(error) ?? "unknown"}); the outbox keeps it for a retry`);
      }
    },
  };
}

/** Null when POSTGRES_URL is not set: the forms stay in mock mode and the APIs answer 503. */
export function formStoreFromEnv(env: Record<string, string | undefined> = process.env): FormStore | null {
  const db = dbFromEnv(env);
  return db ? postgresFormStore(db, notifierFromEnv(env)) : null;
}
