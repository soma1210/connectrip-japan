/**
 * Database checks for the inquiry system (Phase 1, 2026-11-16).
 * Run: `bun src/lib/inquiries/db.test.ts`. In-memory PGlite (real Postgres engine), nothing external.
 */
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { destructiveStatement, runMigrations } from "@/lib/migrations";
import { createNotifier, type MailTransport } from "@/lib/notify/email";
import { migrationFiles, pgliteDb } from "@/lib/testing/pgliteDb";
import { backoffMinutes, deliverNotifications, MAX_ATTEMPTS } from "./outbox";
import { createSubmission, newRef, type NewSubmission } from "./store";

console.error = () => {};

// --- Migrations ------------------------------------------------------------------------
const pg = await PGlite.create();
const db = pgliteDb(pg);
const files = migrationFiles();
{
  // Existing tables and rows are left alone (a stand-in for the production back-office tables).
  await db.query(`CREATE TABLE reviews (id SERIAL PRIMARY KEY, name TEXT NOT NULL)`);
  await db.query(`INSERT INTO reviews (name) VALUES ($1)`, ["kept"]);

  const dry = await runMigrations(db, files, { apply: false });
  assert.deepEqual(dry.pending, ["0001_inquiry_management.sql", "0002_inquiry_admin.sql"]);
  assert.equal((await db.query<{ t: string | null }>(`SELECT to_regclass('public.inquiries')::text AS t`)).rows[0].t, null, "dry run changes nothing");

  const first = await runMigrations(db, files, { apply: true });
  assert.deepEqual(first.applied, ["0001_inquiry_management.sql", "0002_inquiry_admin.sql"]);
  const again = await runMigrations(db, files, { apply: true });
  assert.deepEqual(again.applied, []);
  assert.deepEqual(again.alreadyApplied, ["0001_inquiry_management.sql", "0002_inquiry_admin.sql"]);

  const tables = (await db.query<{ t: string }>(`SELECT table_name AS t FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1`)).rows.map((r) => r.t);
  for (const t of ["inquiries", "inquiry_events", "notification_outbox", "admin_sessions", "admin_login_attempts", "schema_migrations", "reviews"]) assert.ok(tables.includes(t), t);
  assert.deepEqual((await db.query(`SELECT name FROM reviews`)).rows, [{ name: "kept" }]);

  await assert.rejects(runMigrations(db, files.map((f) => ({ ...f, sql: `${f.sql}\n-- edited` })), { apply: true }), /another checksum/);
  for (const bad of ["DROP TABLE reviews", "TRUNCATE inquiries", "DELETE FROM reviews", "UPDATE reviews SET name = 'x'", "ALTER TABLE reviews RENAME TO r2", "ALTER TABLE reviews ALTER COLUMN name TYPE int"]) {
    assert.ok(destructiveStatement(bad), bad);
    await assert.rejects(runMigrations(db, [...files, { name: "0099_bad.sql", sql: bad }], { apply: true }), /destructive/, bad);
  }
  for (const f of files) assert.equal(destructiveStatement(f.sql), null, f.name);
  assert.equal(destructiveStatement("-- DROP TABLE x (only a comment)\nCREATE TABLE IF NOT EXISTS y (id int)"), null);
  console.log("ok  migrations: dry run changes nothing; apply once, idempotent; existing tables / rows untouched; edited file and destructive SQL refused");
}

// --- Constraints -------------------------------------------------------------------------
const base = (over: Partial<NewSubmission> = {}): NewSubmission => ({
  kind: "contact", service: "private_guide", submissionId: crypto.randomUUID(), bodyHash: "a".repeat(64),
  customerName: "Ada", customerEmail: "ada@example.com", preferredDate: "2027-03-01", adults: 2, children: 0, payload: { name: "Ada" }, ...over,
});
{
  const r = await createSubmission(db, base());
  assert.equal(r.type, "created");
  const id = r.type === "created" ? r.id : "";
  await assert.rejects(db.query(`UPDATE inquiries SET status = 'auto_confirmed' WHERE id = $1`, [id]), "status outside the list is refused");
  await assert.rejects(db.query(`INSERT INTO notification_outbox (inquiry_id, channel) VALUES ($1, 'staff_email')`, [id]), "one staff email per inquiry");
  await assert.rejects(db.query(`DELETE FROM inquiries WHERE id = $1`, [id]), "history rows protect the inquiry (ON DELETE RESTRICT)");
  assert.equal((await createSubmission(db, base({ kind: "other" as never }))).type, "unavailable");
  assert.equal((await createSubmission(db, base({ bodyHash: "not-a-hash" }))).type, "unavailable");
  const events = (await db.query<{ event_type: string; to_status: string; actor: string }>(`SELECT event_type, to_status, actor FROM inquiry_events WHERE inquiry_id = $1`, [id])).rows;
  assert.deepEqual(events, [{ event_type: "received", to_status: "received", actor: "website" }]);
  console.log("ok  constraints: unknown status / kind / bad hash refused; one outbox row per channel; inquiries cannot be deleted while history exists; 'received' event recorded");
}

// --- References ----------------------------------------------------------------------------
{
  assert.match(newRef("contact", new Date("2026-11-16T15:30:00Z")), /^CQ-20261117-[A-Z0-9]{6}$/, "Japan date (UTC+9)");
  assert.match(newRef("booking_request"), /^CR-\d{8}-[A-Z0-9]{6}$/);
  // Collision on the reference: a new one is drawn and the submission is still stored once.
  const fixed = "CQ-20261116-AAAAAA";
  assert.equal((await createSubmission(db, base(), () => fixed)).type, "created");
  let calls = 0;
  const r = await createSubmission(db, base(), () => (++calls === 1 ? fixed : "CQ-20261116-BBBBBB"));
  assert.equal(r.type === "created" && r.ref, "CQ-20261116-BBBBBB");
  console.log("ok  references: CQ / CR + Japan date; a reference collision draws a new one");
}

// --- Outbox ---------------------------------------------------------------------------------
function notifier(mode: "ok" | "fail") {
  const sent: string[] = [];
  const transport: MailTransport = async (m) => {
    if (mode === "fail") throw new Error("down");
    sent.push(m.subject);
    return { messageId: `<${sent.length}@test>` };
  };
  return { sent, notifier: createNotifier({ from: "a@connectripjapan.com", to: "contact@connectripjapan.com", transport, timeoutMs: 200 }) };
}
const contactPayload = { submissionId: "x", kind: "private_guide", name: "Ada", email: "ada@example.com", preferredDate: null, adults: 1, children: null, destinations: [], activities: [], placesToVisit: null, idealDay: null, notes: null };
const count = async (sql: string) => Number((await db.query<{ n: number }>(sql)).rows[0].n);
const outboxOf = async (inquiryId: string) =>
  (await db.query<{ status: string; attempts: number; last_error: string | null; due: boolean | null; next_attempt_at: Date | null }>(
    `SELECT status, attempts, last_error, next_attempt_at, next_attempt_at <= now() AS due FROM notification_outbox WHERE inquiry_id = $1`,
    [inquiryId],
  )).rows[0];
{
  const r = await createSubmission(db, base({ payload: contactPayload }));
  assert.ok(r.type === "created");
  const id = r.id;

  assert.deepEqual(await deliverNotifications(db, null, { inquiryId: id }), { sent: 0, failed: 0, pending: 1 });
  assert.equal((await outboxOf(id)).last_error, "not_configured");
  assert.equal((await outboxOf(id)).attempts, 0, "not configured is not an attempt");

  const down = notifier("fail");
  assert.deepEqual(await deliverNotifications(db, down.notifier, { inquiryId: id }), { sent: 0, failed: 1, pending: 0 });
  let row = await outboxOf(id);
  assert.equal(row.status, "failed");
  assert.equal(row.attempts, 1);
  assert.equal(row.due, false, "next attempt is scheduled later (back-off)");
  // Not due yet → nothing is claimed.
  const up = notifier("ok");
  assert.deepEqual(await deliverNotifications(db, up.notifier, { inquiryId: id }), { sent: 0, failed: 0, pending: 0 });
  // Due now → sent once; a second run sends nothing.
  await db.query(`UPDATE notification_outbox SET next_attempt_at = now() - interval '1 second' WHERE inquiry_id = $1`, [id]);
  assert.deepEqual(await deliverNotifications(db, up.notifier, { inquiryId: id }), { sent: 1, failed: 0, pending: 0 });
  assert.deepEqual(await deliverNotifications(db, up.notifier, { inquiryId: id }), { sent: 0, failed: 0, pending: 0 });
  assert.equal(up.sent.length, 1);
  row = await outboxOf(id);
  assert.deepEqual([row.status, row.attempts, row.last_error, row.next_attempt_at], ["sent", 2, null, null]);
  const ev = (await db.query<{ event_type: string }>(`SELECT event_type FROM inquiry_events WHERE inquiry_id = $1 ORDER BY id`, [id])).rows.map((e) => e.event_type);
  assert.deepEqual(ev, ["received", "notification_failed", "notification_sent"]);
  console.log("ok  outbox: not configured → pending; failure → failed + back-off; due retry → sent exactly once; history events recorded");
}
{
  // A crashed sender leaves 'sending' behind: reclaimed after the lock expires, not before.
  const r = await createSubmission(db, base({ payload: contactPayload }));
  assert.ok(r.type === "created");
  await db.query(`UPDATE notification_outbox SET status = 'sending', attempts = 1, locked_until = now() + interval '1 minute' WHERE inquiry_id = $1`, [r.id]);
  const up = notifier("ok");
  assert.equal((await deliverNotifications(db, up.notifier, { inquiryId: r.id })).sent, 0);
  await db.query(`UPDATE notification_outbox SET locked_until = now() - interval '1 second' WHERE inquiry_id = $1`, [r.id]);
  assert.equal((await deliverNotifications(db, up.notifier, { inquiryId: r.id })).sent, 1);
  // Give up after MAX_ATTEMPTS: failed, no next attempt.
  const r2 = await createSubmission(db, base({ payload: contactPayload }));
  assert.ok(r2.type === "created");
  await db.query(`UPDATE notification_outbox SET attempts = $2 WHERE inquiry_id = $1`, [r2.id, MAX_ATTEMPTS - 1]);
  await deliverNotifications(db, notifier("fail").notifier, { inquiryId: r2.id });
  const dead = await outboxOf(r2.id);
  assert.deepEqual([dead.status, dead.attempts, dead.next_attempt_at], ["failed", MAX_ATTEMPTS, null]);
  // Without an inquiry id, due rows of any inquiry are processed (the retry job of Phase 2).
  const r3 = await createSubmission(db, base({ payload: contactPayload }));
  assert.ok(r3.type === "created");
  assert.ok((await deliverNotifications(db, up.notifier)).sent >= 1);
  // Rows whose saved payload cannot build an email (the constraint tests above stored { name } only) fail safely.
  const unreadable = await count(`SELECT count(*) AS n FROM notification_outbox WHERE last_error = 'inquiry_unreadable' AND status = 'failed'`);
  assert.ok(unreadable >= 1);
  assert.equal(await count(`SELECT count(*) AS n FROM notification_outbox WHERE status = 'sending'`), 0, "nothing left stuck in 'sending'");
  assert.deepEqual([backoffMinutes(1), backoffMinutes(2), backoffMinutes(5), backoffMinutes(20)], [1, 2, 16, 360]);
  console.log("ok  outbox: stale 'sending' lock reclaimed only after expiry; gives up after MAX_ATTEMPTS; batch retry of due rows; back-off 1→2→4…≤360 min");
}
console.log("\nall inquiry database checks passed");
