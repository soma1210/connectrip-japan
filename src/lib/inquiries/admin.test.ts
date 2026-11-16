/**
 * Inquiry admin, retry job and fail-safe checks (Phase 2, 2026-11-16).
 * Run: `bun src/lib/inquiries/admin.test.ts`. In-memory PGlite with the real migrations; nothing external.
 */
import assert from "node:assert/strict";
import { attemptLogin, postgresAdminAuthStore, validateSession } from "@/lib/admin/session";
import { createNotifier, type MailTransport } from "@/lib/notify/email";
import type { Db } from "@/lib/pg";
import { migratedTestDb } from "@/lib/testing/pgliteDb";
import { addNote, changeStatus, dashboardCounts, getInquiry, listInquiries, resendStaffEmail } from "./admin";
import { handleRetryJob } from "./retryJob";
import { allowedNextStatuses } from "./status";
import { createSubmission, postgresFormStore, type NewSubmission } from "./store";

console.error = () => {};
const { db } = await migratedTestDb();

function notifier(mode: "ok" | "fail" | "slow" = "ok") {
  const sent: string[] = [];
  const transport: MailTransport = async (m) => {
    if (mode === "fail") throw new Error("down");
    if (mode === "slow") await new Promise((r) => setTimeout(r, 50));
    sent.push(m.subject);
    return { messageId: `<${sent.length}@test>` };
  };
  return { sent, notifier: createNotifier({ from: "a@connectripjapan.com", to: "contact@connectripjapan.com", transport, timeoutMs: 500 }) };
}
const contact = { kind: "private_guide", name: "Ada", email: "ada@example.com", preferredDate: "2027-03-01", adults: 2, children: 0, destinations: ["nara"], activities: ["food"], placesToVisit: null, idealDay: null, notes: "hello" };
const booking = { locale: "en", productType: "private_guide", date: "2027-04-01", startTime: "09:00", durationMinutes: 240, alternateDate: null, alternateStartTime: null, adults: 2, children: 1, name: "Ben", email: "ben@example.com", phone: null, country: "AU", areas: ["osaka"], interests: ["food"], notes: null, consent: true };
async function make(kind: "contact" | "booking_request", over: Partial<NewSubmission> = {}) {
  const submissionId = crypto.randomUUID();
  const r = await createSubmission(db, {
    kind, service: "private_guide", submissionId, bodyHash: "b".repeat(64), customerName: kind === "contact" ? "Ada" : "Ben",
    customerEmail: kind === "contact" ? "ada@example.com" : "ben@example.com", preferredDate: "2027-04-01", adults: 2, children: 0,
    payload: kind === "contact" ? { ...contact, submissionId } : { ...booking, submissionId }, ...over,
  });
  assert.ok(r.type === "created");
  return r.id;
}

// --- Migrations 0001 + 0002 -------------------------------------------------------------
{
  const cols = (await db.query<{ c: string }>(`SELECT column_name AS c FROM information_schema.columns WHERE table_name = 'inquiries'`)).rows.map((r) => r.c);
  assert.ok(cols.includes("version"));
  const applied = (await db.query<{ name: string }>(`SELECT name FROM schema_migrations ORDER BY name`)).rows.map((r) => r.name);
  assert.deepEqual(applied, ["0001_inquiry_management.sql", "0002_inquiry_admin.sql"]);
  console.log("ok  migrations 0001 + 0002 applied (version column for optimistic locking)");
}

// --- Dashboard + list ----------------------------------------------------------------------
const c1 = await make("contact");
const b1 = await make("booking_request");
const b2 = await make("booking_request");
{
  const counts = await dashboardCounts(db);
  assert.deepEqual(counts, { total: 3, fresh: 3, bookingRequests: 2, inProgress: 0, emailFailed: 0, emailWaiting: 3 });
  const all = await listInquiries(db);
  assert.equal(all.total, 3);
  assert.deepEqual(new Set(all.items.map((i) => i.id)), new Set([c1, b1, b2]));
  assert.equal((await listInquiries(db, { kind: "booking_request" })).total, 2);
  assert.equal((await listInquiries(db, { status: "in_review" })).total, 0);
  assert.equal((await listInquiries(db, { page: 2 })).items.length, 0);
  const detail = await getInquiry(db, b1);
  assert.ok(detail);
  assert.equal(detail.kind, "booking_request");
  assert.equal(detail.payload.name, "Ben");
  assert.equal(detail.version, 0);
  assert.equal(detail.events[0].type, "received");
  assert.equal(detail.outbox[0].status, "pending");
  assert.equal(await getInquiry(db, "not-a-uuid"), null);
  assert.equal(await getInquiry(db, crypto.randomUUID()), null);
  console.log("ok  dashboard counts (total, new, booking requests, in progress, email failed / waiting); list filters + paging; detail with history and outbox");
}

// --- Status changes ------------------------------------------------------------------------
{
  const actor = "admin:abcd1234";
  assert.deepEqual(await changeStatus(db, { id: b1, to: "in_review", expectedVersion: 0, actor }), { ok: true, version: 1 });
  // Stale version (someone else changed it) → conflict, nothing written.
  assert.deepEqual(await changeStatus(db, { id: b1, to: "declined", expectedVersion: 0, actor }), { ok: false, reason: "conflict" });
  // Confirm needs the reference number typed again.
  const ref = (await getInquiry(db, b1))!.ref;
  assert.deepEqual(await changeStatus(db, { id: b1, to: "confirmed", expectedVersion: 1, actor }), { ok: false, reason: "confirmation_required" });
  assert.deepEqual(await changeStatus(db, { id: b1, to: "confirmed", expectedVersion: 1, actor, confirmRef: "CR-00000000-XXXXXX" }), { ok: false, reason: "confirmation_required" });
  assert.deepEqual(await changeStatus(db, { id: b1, to: "confirmed", expectedVersion: 1, actor, confirmRef: ref.toLowerCase(), note: "Agreed by email" }), { ok: true, version: 2 });
  // Confirmed can only be cancelled; a contact inquiry can never be confirmed.
  assert.deepEqual(await changeStatus(db, { id: b1, to: "in_review", expectedVersion: 2, actor }), { ok: false, reason: "not_allowed" });
  assert.deepEqual(allowedNextStatuses("booking_request", "confirmed"), ["cancelled"]);
  assert.ok(!allowedNextStatuses("contact", "received").includes("confirmed"));
  const cref = (await getInquiry(db, c1))!.ref;
  assert.deepEqual(await changeStatus(db, { id: c1, to: "confirmed", expectedVersion: 0, actor, confirmRef: cref }), { ok: false, reason: "not_allowed" });
  // Input validation.
  assert.deepEqual(await changeStatus(db, { id: b2, to: "auto_confirmed", expectedVersion: 0, actor }), { ok: false, reason: "invalid_status" });
  assert.deepEqual(await changeStatus(db, { id: "x", to: "in_review", expectedVersion: 0, actor }), { ok: false, reason: "not_found" });
  assert.deepEqual(await changeStatus(db, { id: b2, to: "in_review", expectedVersion: Number.NaN, actor }), { ok: false, reason: "conflict" });
  assert.deepEqual(await changeStatus(db, { id: b2, to: "in_review", expectedVersion: 0, actor, note: "x".repeat(5001) }), { ok: false, reason: "note_too_long" });
  // Two admins at once on the same version: exactly one wins.
  const both = await Promise.all([
    changeStatus(db, { id: b2, to: "in_review", expectedVersion: 0, actor: "admin:aaaa" }),
    changeStatus(db, { id: b2, to: "declined", expectedVersion: 0, actor: "admin:bbbb" }),
  ]);
  assert.equal(both.filter((r) => r.ok).length, 1);
  assert.equal(both.filter((r) => !r.ok && r.reason === "conflict").length, 1);
  // History: who, from, to, note.
  const ev = (await getInquiry(db, b1))!.events.filter((e) => e.type === "status_changed");
  assert.deepEqual(ev.map((e) => [e.fromStatus, e.toStatus, e.actor, e.note]), [["in_review", "confirmed", actor, "Agreed by email"], ["received", "in_review", actor, null]]);
  console.log("ok  status: allowed transitions only; confirm needs the reference typed again (server-side); contact never confirmed; stale version → conflict; parallel edits → one wins; history with actor");
}

// --- Notes ---------------------------------------------------------------------------------
{
  assert.deepEqual(await addNote(db, { id: c1, note: "  Called back <b>tomorrow</b>  ", actor: "admin:abcd1234" }), { ok: true });
  assert.deepEqual(await addNote(db, { id: c1, note: "   ", actor: "admin:abcd1234" }), { ok: false, reason: "empty" });
  assert.deepEqual(await addNote(db, { id: c1, note: "x".repeat(5001), actor: "admin:abcd1234" }), { ok: false, reason: "note_too_long" });
  assert.deepEqual(await addNote(db, { id: crypto.randomUUID(), note: "x", actor: "admin:abcd1234" }), { ok: false, reason: "not_found" });
  const note = (await getInquiry(db, c1))!.events.find((e) => e.type === "note_added");
  assert.equal(note?.note, "Called back <b>tomorrow</b>");
  console.log("ok  notes: trimmed, stored as-is (escaped when shown), empty / too long / unknown inquiry refused, actor recorded");
}

// --- Manual resend ----------------------------------------------------------------------------
{
  assert.deepEqual(await resendStaffEmail(db, null, { id: c1, actor: "admin:x" }), { ok: false, reason: "not_configured" });
  const down = notifier("fail");
  const failed = await resendStaffEmail(db, down.notifier, { id: c1, actor: "admin:x" });
  assert.ok(failed.ok && failed.report.failed === 1);
  let d = await getInquiry(db, c1);
  assert.equal(d!.outbox[0].status, "failed");
  assert.equal(d!.events.find((e) => e.type === "notification_failed")?.actor, "admin:x");
  // Manual resend works even before the back-off is due; a double click sends once.
  const up = notifier("slow");
  const [a, b] = await Promise.all([resendStaffEmail(db, up.notifier, { id: c1, actor: "admin:x" }), resendStaffEmail(db, up.notifier, { id: c1, actor: "admin:y" })]);
  assert.equal(up.sent.length, 1, "double click → one email");
  assert.equal([a, b].filter((r) => r.ok && r.report.sent === 1).length, 1);
  d = await getInquiry(db, c1);
  assert.equal(d!.outbox[0].status, "sent");
  assert.ok(d!.outbox[0].sentAt);
  assert.deepEqual(await resendStaffEmail(db, up.notifier, { id: c1, actor: "admin:x" }), { ok: false, reason: "already_sent" });
  assert.equal(up.sent.length, 1, "a sent email is never sent again");
  // Another sender holds the row → left alone.
  await db.query(`UPDATE notification_outbox SET status = 'sending', locked_until = now() + interval '1 minute' WHERE inquiry_id = $1`, [b2]);
  assert.deepEqual(await resendStaffEmail(db, up.notifier, { id: b2, actor: "admin:x" }), { ok: false, reason: "in_progress" });
  await db.query(`UPDATE notification_outbox SET status = 'pending', locked_until = NULL WHERE inquiry_id = $1`, [b2]);
  console.log("ok  manual resend: not configured / failure recorded with the admin as actor; double click → one email; sent never resent; row held by another sender left alone");
}

// --- Retry job ----------------------------------------------------------------------------------
{
  const secret = "s".repeat(40);
  const call = (auth: string | null, deps: { db: Db | null; secret: string | undefined }, n = notifier().notifier) =>
    handleRetryJob(new Request("http://localhost/api/internal/notifications/retry", { method: "POST", headers: auth ? { authorization: auth } : {} }), { ...deps, notifier: n });
  assert.equal((await call(`Bearer ${secret}`, { db, secret: undefined })).status, 404, "disabled without CRON_SECRET");
  assert.equal((await call(`Bearer short`, { db, secret: "short" })).status, 404, "disabled with a short secret");
  assert.equal((await call(null, { db, secret })).status, 401);
  assert.equal((await call(`Bearer ${"x".repeat(40)}`, { db, secret })).status, 401);
  assert.equal((await call(`Bearer ${secret}`, { db: null, secret })).status, 503);
  const up = notifier();
  const res = await call(`Bearer ${secret}`, { db, secret }, up.notifier);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.sent, 2, "the two waiting booking emails (b1, b2)");
  assert.equal(up.sent.length, 2);
  const again = await (await call(`Bearer ${secret}`, { db, secret }, up.notifier)).json();
  assert.equal(again.sent, 0, "nothing left to send → no duplicates");
  assert.equal((await dashboardCounts(db)).emailWaiting, 0);
  const ev = (await getInquiry(db, b2))!.events.find((e) => e.type === "notification_sent");
  assert.equal(ev?.actor, "system:retry-job");
  console.log("ok  retry job: 404 without / with short CRON_SECRET, 401 on wrong token, 503 without DB; sends due emails once, second run sends nothing");
}

// --- Fail-safe when the database is down ---------------------------------------------------------
{
  const broken: Db = {
    query: async () => {
      throw Object.assign(new Error("connection refused"), { code: "ECONNREFUSED" });
    },
    transaction: async () => {
      throw Object.assign(new Error("connection refused"), { code: "ECONNREFUSED" });
    },
  };
  const store = postgresAdminAuthStore(broken);
  const pw = "a-test-only-password-12345";
  assert.deepEqual(await attemptLogin({ password: pw, adminPassword: pw, ip: "10.0.0.1", userAgent: null, store }), { ok: false, reason: "unavailable" }, "even the right password does not log in");
  assert.equal(await validateSession({ token: "x".repeat(43), adminPassword: pw, store }), null, "no session can be validated → treated as logged out");
  assert.deepEqual(await changeStatus(broken, { id: b1, to: "cancelled", expectedVersion: 2, actor: "admin:x" }), { ok: false, reason: "unavailable" });
  assert.deepEqual(await addNote(broken, { id: b1, note: "x", actor: "admin:x" }), { ok: false, reason: "unavailable" });
  assert.deepEqual(await resendStaffEmail(broken, notifier().notifier, { id: b1, actor: "admin:x" }), { ok: false, reason: "unavailable" });
  const formStore = postgresFormStore(broken, notifier().notifier);
  assert.equal((await formStore.create({ kind: "contact", service: "private_guide", submissionId: crypto.randomUUID(), bodyHash: "c".repeat(64), customerName: "A", customerEmail: "a@example.com", preferredDate: null, adults: null, children: null, payload: {} })).type, "unavailable");
  await assert.rejects(dashboardCounts(broken));
  console.log("ok  database down: login refused even with the right password, sessions invalid (= logged out), admin writes and form saves report unavailable, never bypass");
}
console.log("\nall inquiry admin checks passed");
