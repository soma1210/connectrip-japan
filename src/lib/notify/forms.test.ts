/**
 * Form API + notification checks. Run: `bun src/lib/notify/forms.test.ts`.
 * Phase 1 (2026-11-16): the handlers store into Postgres (an in-memory PGlite
 * test database with the real migrations) and email through the outbox.
 * Nothing leaves this machine: SMTP is a fake, or a throwaway server on 127.0.0.1.
 */
import assert from "node:assert/strict";
import { createServer, type Socket } from "node:net";
import { bookingStoreFromEnv, handleBookingRequest } from "@/lib/booking-request/handler";
import { BOOKING_STATUS_LINE } from "@/lib/booking-request/notification";
import { addCalendarDays, tokyoDate } from "@/lib/booking-request/rules";
import { handleInquiry, inquiryStoreFromEnv } from "@/lib/inquiry/handler";
import { INQUIRY_REF } from "@/lib/inquiry/rules";
import { postgresFormStore, type FormStore } from "@/lib/inquiries/store";
import { migratedTestDb } from "@/lib/testing/pgliteDb";
import { createNotifier, headerSafe, isSafeEmail, notifierFromEnv, type MailTransport, type NotificationEmail, type Notifier } from "./email";

let ipSeq = 0;
const req = (path: string, body: unknown, id?: string) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.0.${Math.floor(++ipSeq / 200)}.${ipSeq % 200}`, ...(id ? { "idempotency-key": id } : {}) },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const uuid = () => crypto.randomUUID();
const BOOKING_REF = /^CR-\d{8}-[A-Z0-9]{6}$/;

type Sent = NotificationEmail & { from: string; to: string };
function fakeNotifier(mode: "ok" | "fail" | "hang" = "ok") {
  const sent: Sent[] = [];
  const transport: MailTransport = async (m) => {
    if (mode === "fail") throw new Error("smtp down");
    if (mode === "hang") await new Promise(() => {});
    sent.push(m);
    return { messageId: "<test@local>" };
  };
  return { sent, notifier: createNotifier({ from: "Connectrip Japan <notifications@connectripjapan.com>", to: "contact@connectripjapan.com", transport, timeoutMs: 200 }) };
}

// Keep error logs of the handlers out of the output, but count them.
const logged: string[] = [];
console.error = (...args: unknown[]) => void logged.push(args.join(" "));

const { db } = await migratedTestDb();
const store = (notifier: Notifier | null): FormStore => postgresFormStore(db, notifier);
const count = async (sql: string, params: unknown[] = []) => Number((await db.query<{ n: number }>(sql, params)).rows[0].n);

// --- Header and address helpers ------------------------------------------------------
assert.equal(headerSafe("Hello\r\nBcc: victim@example.com"), "Hello Bcc: victim@example.com");
assert.equal(isSafeEmail("guest@example.com"), true);
for (const bad of ["guest@example.com\r\nBcc: x@y.com", "a b@example.com", "no-at", "x@y", "<x@y.com>"]) assert.equal(isSafeEmail(bad), false, bad);
assert.equal(notifierFromEnv({}), null);
assert.equal(notifierFromEnv({ SMTP_HOST: "smtp.example.com", SMTP_PORT: "587", SMTP_USER: "u" }), null);
assert.equal(inquiryStoreFromEnv({}), null);
assert.equal(bookingStoreFromEnv({}), null);
console.log("ok  header / address helpers; no SMTP / no POSTGRES_URL = not configured");

{
  const { sent, notifier } = fakeNotifier();
  const r = await notifier.send({ subject: "S\r\nX-Injected: 1", text: "t", html: "<p>t</p>", replyTo: "evil@example.com\r\nBcc: x@y.com" });
  assert.equal(r.status, "sent");
  assert.equal(sent[0].subject, "S X-Injected: 1");
  assert.equal(sent[0].replyTo, undefined);
  assert.equal(sent[0].from, "Connectrip Japan <notifications@connectripjapan.com>");
  assert.equal(sent[0].to, "contact@connectripjapan.com");
  assert.equal((await fakeNotifier("fail").notifier.send({ subject: "s", text: "t", html: "h" })).status, "failed");
  assert.equal((await fakeNotifier("hang").notifier.send({ subject: "s", text: "t", html: "h" })).status, "failed");
  console.log("ok  notifier: CR/LF stripped, bad Reply-To dropped, failure and timeout reported as failed");
}

// --- Booking requests ----------------------------------------------------------------
const date = addCalendarDays(tokyoDate(Date.now()), 10);
const booking = (id: string, extra: Record<string, unknown> = {}) => ({
  submissionId: id, locale: "en", productType: "private_guide", date, startTime: "09:00", durationMinutes: 240,
  adults: 2, children: 1, name: "Test <b>Guest</b>", email: "guest@example.com", phone: "+81 90 0000 0000",
  country: "Australia", areas: ["osaka", "kyoto"], interests: ["food"], notes: "Vegetarian.\nNo stairs please.", consent: true, ...extra,
});
{
  const { sent, notifier } = fakeNotifier();
  const id = uuid();
  const res = await handleBookingRequest(req("/api/v1/booking-requests", booking(id), id), { store: store(notifier) });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.match(body.bookingRef, BOOKING_REF);
  assert.deepEqual(body, { ok: true, accepted: true, bookingRef: body.bookingRef, status: "REQUESTED", replayed: false });
  const row = (await db.query<{ kind: string; status: string; service: string; customer_email: string; adults: number }>(`SELECT kind, status, service, customer_email, adults FROM inquiries WHERE ref = $1`, [body.bookingRef])).rows[0];
  assert.deepEqual(row, { kind: "booking_request", status: "received", service: "private_guide", customer_email: "guest@example.com", adults: 2 });
  assert.equal(sent.length, 1);
  const m = sent[0];
  assert.equal(m.subject, `[Connectrip Japan] New Booking Request (${body.bookingRef})`);
  assert.equal(m.replyTo, "guest@example.com");
  for (const line of [BOOKING_STATUS_LINE, `Request ID: ${body.bookingRef}`, `Preferred date: ${date} 09:00`, "Duration: 4 hours", "Adults: 2", "Children: 1", "Name: Test <b>Guest</b>", "Email: guest@example.com", "Areas: Osaka, Kyoto", "Interests: Food", "Tour: Private Guide (custom day)"]) {
    assert.ok(m.text.includes(line), `text has "${line}"`);
  }
  assert.match(m.text, /Received at: \d{4}-\d{2}-\d{2} \d{2}:\d{2} JST/);
  assert.ok(m.html.includes("Test &lt;b&gt;Guest&lt;/b&gt;") && !m.html.includes("<b>Guest</b>"), "HTML escapes guest input");
  assert.ok(m.html.includes("Vegetarian.<br>No stairs please."));
  console.log("ok  booking: stored as 'received' (answer REQUESTED, never confirmed) → one email rebuilt from the saved row");
}
{
  // Double submit, sequential and concurrent: one row, one email, same reference.
  const { sent, notifier } = fakeNotifier();
  const id = uuid();
  const a = await handleBookingRequest(req("/api/v1/booking-requests", booking(id), id), { store: store(notifier) });
  const [b, c] = await Promise.all([
    handleBookingRequest(req("/api/v1/booking-requests", booking(id), id), { store: store(notifier) }),
    handleBookingRequest(req("/api/v1/booking-requests", booking(id), id), { store: store(notifier) }),
  ]);
  const refs = await Promise.all([a, b, c].map(async (r) => (await r.json()).bookingRef));
  assert.equal(new Set(refs).size, 1);
  assert.equal(await count(`SELECT count(*) AS n FROM inquiries WHERE submission_id = $1`, [id]), 1);
  assert.equal(sent.length, 1);
  // Same id, different body → 409, nothing stored, no email.
  const conflict = await handleBookingRequest(req("/api/v1/booking-requests", booking(id, { adults: 3 }), id), { store: store(notifier) });
  assert.equal(conflict.status, 409);
  assert.equal(sent.length, 1);
  console.log("ok  booking: double submit (sequential + concurrent) → one row, same reference, one email; changed body → 409");
}
{
  // Email fails after the row is stored → the guest still gets the receipt; the outbox keeps it; the log has no personal data.
  logged.length = 0;
  const { notifier } = fakeNotifier("fail");
  const id = uuid();
  const res = await handleBookingRequest(req("/api/v1/booking-requests", booking(id), id), { store: store(notifier) });
  assert.equal(res.status, 200);
  const outbox = (await db.query<{ status: string; attempts: number; last_error: string }>(`SELECT o.status, o.attempts, o.last_error FROM notification_outbox o JOIN inquiries i ON i.id = o.inquiry_id WHERE i.submission_id = $1`, [id])).rows[0];
  assert.deepEqual(outbox, { status: "failed", attempts: 1, last_error: "send_failed" });
  assert.equal(logged.length, 1);
  assert.ok(!logged[0].includes("guest@example.com") && !logged[0].includes("Guest"));
  // SMTP not configured: stored, outbox stays pending with not_configured.
  const id2 = uuid();
  assert.equal((await handleBookingRequest(req("/api/v1/booking-requests", booking(id2), id2), { store: store(null) })).status, 200);
  const pending = (await db.query<{ status: string; last_error: string }>(`SELECT o.status, o.last_error FROM notification_outbox o JOIN inquiries i ON i.id = o.inquiry_id WHERE i.submission_id = $1`, [id2])).rows[0];
  assert.deepEqual(pending, { status: "pending", last_error: "not_configured" });
  console.log("ok  booking: email failure / SMTP missing → still 200 (stored); outbox records failed / pending for a retry");
}
{
  const { sent, notifier } = fakeNotifier();
  const id = uuid();
  const before = await count(`SELECT count(*) AS n FROM inquiries`);
  assert.equal((await handleBookingRequest(req("/api/v1/booking-requests", booking(id), id), { store: null })).status, 503);
  const down: FormStore = { create: async () => ({ type: "unavailable" }), notify: async () => {} };
  assert.equal((await handleBookingRequest(req("/api/v1/booking-requests", booking(id), id), { store: down })).status, 503);
  assert.equal((await handleBookingRequest(req("/api/v1/booking-requests", booking(id, { name: "" }), id), { store: store(notifier) })).status, 400);
  assert.equal((await handleBookingRequest(req("/api/v1/booking-requests", booking(id, { email: "not-an-email" }), id), { store: store(notifier) })).status, 400);
  assert.equal((await handleBookingRequest(req("/api/v1/booking-requests", "{broken"), { store: null })).status, 400);
  assert.equal(await count(`SELECT count(*) AS n FROM inquiries`), before);
  assert.equal(sent.length, 0);
  console.log("ok  booking: no database / store down → 503; missing name, bad email, broken JSON → 400; nothing stored, no email");
}

// --- Inquiries ---------------------------------------------------------------------
const inquiry = (id: string, extra: Record<string, unknown> = {}) => ({
  submissionId: id, name: "Ada <script>alert(1)</script>", email: "ada@example.com", preferredDate: "2027-03-01",
  partySize: { adults: 2 }, children: { count: 0 }, destinations: ["nara"], activities: ["culture", "food"],
  placesToVisit: "Todai-ji", idealDay: "Slow morning, temples.", notes: "=HYPERLINK(\"x\")", ...extra,
});
{
  const { sent, notifier } = fakeNotifier();
  const id = uuid();
  const res = await handleInquiry(req("/api/v1/inquiries", inquiry(id), id), { store: store(notifier) });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.match(body.inquiryRef, INQUIRY_REF);
  assert.deepEqual(body, { ok: true, accepted: true, inquiryRef: body.inquiryRef, replayed: false });
  const row = (await db.query<{ kind: string; status: string; preferred_date: string }>(`SELECT kind, status, preferred_date::text FROM inquiries WHERE ref = $1`, [body.inquiryRef])).rows[0];
  assert.deepEqual(row, { kind: "contact", status: "received", preferred_date: "2027-03-01" });
  assert.equal(sent.length, 1);
  const m = sent[0];
  assert.equal(m.subject, `[Connectrip Japan] New Contact Inquiry (${body.inquiryRef})`);
  assert.equal(m.replyTo, "ada@example.com");
  for (const line of [`Inquiry ID: ${body.inquiryRef}`, "Category: Private Guide inquiry", "Email: ada@example.com", "Preferred date: 2027-03-01", "Adults: 2", "Where would you like to go?: Nara", "What would you like to do?: Culture, Food", "Places you already want to visit: Todai-ji"]) {
    assert.ok(m.text.includes(line), `text has "${line}"`);
  }
  assert.ok(!m.html.includes("<script>") && m.html.includes("&lt;script&gt;"));
  console.log("ok  inquiry: stored as kind 'contact' → one email with the form fields, Reply-To, escaped HTML");
}
{
  // The old gap: stored, but the answer was lost before the email. The retry is a replay and now still sends the pending email.
  const { sent, notifier } = fakeNotifier();
  const id = uuid();
  const first = await store(notifier).create({
    kind: "contact", service: "private_guide", submissionId: id, bodyHash: "", customerName: "", customerEmail: "", preferredDate: null, adults: null, children: null, payload: {},
  }).catch(() => null);
  assert.equal(first?.type, "unavailable", "CHECK constraints reject an empty name / bad hash");
  // Store it the way the API does, but skip notify (simulates the lost response).
  const { inquirySubmission } = await import("@/lib/inquiry/handler");
  const { inquiryBodyHash, validateInquiry } = await import("@/lib/inquiry/rules");
  const v = validateInquiry(inquiry(id), id);
  assert.ok(v.ok);
  const stored = await store(notifier).create(inquirySubmission(v.inquiry, inquiryBodyHash(v.inquiry)));
  assert.equal(stored.type, "created");
  assert.equal(sent.length, 0);
  const res = await handleInquiry(req("/api/v1/inquiries", inquiry(id), id), { store: store(notifier) });
  assert.equal((await res.json()).replayed, true);
  assert.equal(sent.length, 1, "the pending email goes out on the replay");
  await handleInquiry(req("/api/v1/inquiries", inquiry(id), id), { store: store(notifier) });
  assert.equal(sent.length, 1, "and only once");
  assert.equal((await handleInquiry(req("/api/v1/inquiries", inquiry(id, { notes: "changed" }), id), { store: store(notifier) })).status, 409);
  console.log("ok  inquiry: lost answer → replay sends the pending email exactly once; changed body with same id → 409");
}
{
  const { sent, notifier } = fakeNotifier();
  const id = uuid();
  const cases: [string, unknown, number, Record<string, string>?][] = [
    ["missing name and email", inquiry(id, { name: "", email: undefined }), 400, { name: "required", email: "required" }],
    ["invalid email", inquiry(id, { email: "ada@example" }), 400, { email: "invalid_format" }],
    ["header injection in email", inquiry(id, { email: "ada@example.com\r\nBcc: x@y.com" }), 400],
    ["unknown area", inquiry(id, { destinations: ["tokyo"] }), 400, { destinations: "invalid_format" }],
    ["too long text", inquiry(id, { notes: "x".repeat(2001) }), 400, { notes: "too_long" }],
    ["bad date", inquiry(id, { preferredDate: "2027-02-30" }), 400, { preferredDate: "invalid_format" }],
    ["no submission id", inquiry("not-a-uuid"), 400],
  ];
  for (const [name, body, status, fieldErrors] of cases) {
    const res = await handleInquiry(req("/api/v1/inquiries", body, (body as { submissionId: string }).submissionId), { store: store(notifier) });
    assert.equal(res.status, status, name);
    if (fieldErrors) assert.deepEqual((await res.json()).fieldErrors, fieldErrors, name);
  }
  const before = await count(`SELECT count(*) AS n FROM inquiries`);
  assert.deepEqual(await (await handleInquiry(req("/api/v1/inquiries", inquiry(uuid(), { website: "spam" })), { store: store(notifier) })).json(), { ok: true, accepted: false });
  assert.equal(await count(`SELECT count(*) AS n FROM inquiries`), before, "honeypot stores nothing");
  assert.equal((await handleInquiry(req("/api/v1/inquiries", inquiry(uuid())), { store: null })).status, 503);
  logged.length = 0;
  assert.equal((await handleInquiry(req("/api/v1/inquiries", inquiry(uuid())), { store: store(fakeNotifier("fail").notifier) })).status, 200);
  assert.ok(logged.length === 1 && !logged[0].includes("ada@example.com") && !logged[0].includes("Ada"));
  assert.equal(sent.length, 0);
  console.log("ok  inquiry: required, email format, injection, enum, length, date, id checks → 400; honeypot stores nothing; no database → 503; email failure → 200 + safe log");
}
{
  // Rate limit: the 6th request from one address within 10 minutes → 429.
  const headers = { "content-type": "application/json", "x-forwarded-for": "10.9.9.9" };
  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) statuses.push((await handleInquiry(new Request("http://localhost/api/v1/inquiries", { method: "POST", headers, body: "{}" }), { store: null })).status);
  assert.deepEqual(statuses, [400, 400, 400, 400, 400, 429]);
  console.log("ok  inquiry: rate limit → 429 on the 6th request in 10 minutes");
}

// --- Real nodemailer → local SMTP server (127.0.0.1 only) -----------------------------
{
  let data = "";
  const server = createServer((socket: Socket) => {
    let inData = false;
    socket.write("220 local test\r\n");
    socket.on("data", (chunk) => {
      for (const line of chunk.toString().split("\r\n")) {
        if (inData) {
          if (line === ".") {
            inData = false;
            socket.write("250 queued\r\n");
          } else data += `${line}\n`;
          continue;
        }
        if (!line) continue;
        if (/^EHLO/i.test(line)) socket.write("250-local\r\n250 AUTH PLAIN LOGIN\r\n");
        else if (/^AUTH/i.test(line)) socket.write("235 ok\r\n");
        else if (/^DATA/i.test(line)) {
          inData = true;
          socket.write("354 go\r\n");
        }
        else if (/^QUIT/i.test(line)) socket.end("221 bye\r\n");
        else socket.write("250 ok\r\n");
      }
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;
  const notifier = notifierFromEnv({ SMTP_HOST: "127.0.0.1", SMTP_PORT: String(port), SMTP_USER: "test", SMTP_PASSWORD: "test", NOTIFY_FROM: "Connectrip Japan <notifications@connectripjapan.com>" })!;
  const id = uuid();
  const res = await handleInquiry(req("/api/v1/inquiries", inquiry(id), id), { store: store(notifier) });
  server.close();
  assert.equal(res.status, 200);
  const ref = (await res.json()).inquiryRef;
  assert.match(data, /^From: Connectrip Japan <notifications@connectripjapan\.com>$/m);
  assert.match(data, /^To: contact@connectripjapan\.com$/m);
  assert.match(data, /^Reply-To: ada@example\.com$/m);
  assert.match(data, new RegExp(`^Subject: \\[Connectrip Japan\\] New Contact Inquiry \\(${ref}\\)$`, "m"));
  assert.doesNotMatch(data, /^Bcc:/im);
  const sentRow = (await db.query<{ status: string; provider_message_id: string | null }>(`SELECT o.status, o.provider_message_id FROM notification_outbox o JOIN inquiries i ON i.id = o.inquiry_id WHERE i.ref = $1`, [ref])).rows[0];
  assert.equal(sentRow.status, "sent");
  assert.ok(sentRow.provider_message_id);
  console.log("ok  SMTP (local fake server): From = notifications@, To = contact@, Reply-To = visitor; outbox marked sent with the message id");
}
console.log("\nall form API / notification checks passed");
