import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { refusalToOutcome, signBookingEnvelope } from "./gas";
import { addCalendarDays, bookingBodyHash, endMinute, honeypotTripped, tokyoDate, validateBookingRequest } from "./rules";
import { decideReplay, submitBookingRequest, type BookingGas, type CreateOutcome, type StoredSubmission } from "./submit";

const ID = "8f0c1c3e-6b1a-4e3a-9c2d-1a2b3c4d5e6f";
const NOW = Date.parse("2026-11-10T03:00:00+09:00");

function body(overrides: Record<string, unknown> = {}) {
  return {
    submissionId: ID,
    locale: "en",
    productType: "private_guide",
    date: "2026-11-20",
    startTime: "09:00",
    durationMinutes: 240,
    adults: 2,
    children: 1,
    name: "Alex Kim",
    email: "Alex@Example.com",
    consent: true,
    ...overrides,
  };
}

function accept(overrides: Record<string, unknown> = {}, now = NOW) {
  const result = validateBookingRequest(body(overrides), now, ID);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok || result.booking.productType !== "private_guide") throw new Error("unreachable");
  return result.booking;
}

const failures: string[] = [];
const checks: Promise<void>[] = [];

function check(name: string, fn: () => void | Promise<void>) {
  checks.push(
    Promise.resolve()
      .then(fn)
      .catch((error: unknown) => {
        failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
      }),
  );
}

check("90 calendar days from 10 Nov 2026 is 8 Feb 2027", () => {
  assert.equal(addCalendarDays("2026-11-10", 90), "2027-02-08");
  assert.equal(tokyoDate(Date.parse("2026-11-10T23:59:59+09:00")), "2026-11-10");
  assert.equal(tokyoDate(Date.parse("2026-11-11T00:00:00+09:00")), "2026-11-11");
});

check("accepts exactly 48 hours and the three approved durations that end by 20:00", () => {
  const start = Date.parse("2026-11-20T09:00:00+09:00");
  accept({ date: "2026-11-20", startTime: "09:00" }, start - 48 * 60 * 60 * 1000);
  accept({ startTime: "16:00", durationMinutes: 240 });
  accept({ startTime: "14:00", durationMinutes: 360 });
  accept({ startTime: "12:00", durationMinutes: 480 });
  assert.equal(endMinute("16:00", 240), 20 * 60);
  assert.equal(endMinute("14:00", 360), 20 * 60);
  assert.equal(endMinute("12:00", 480), 20 * 60);
});

check("rejects one millisecond inside 48 hours", () => {
  const start = Date.parse("2026-11-20T09:00:00+09:00");
  const result = validateBookingRequest(body({ date: "2026-11-20", startTime: "09:00" }), start - 48 * 60 * 60 * 1000 + 1, ID);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.status, 422);
  assert.equal(result.body.kind, "unavailable");
  if (result.body.kind === "unavailable") assert.equal(result.body.reason, "too_soon");
});

check("rejects the day after the 90th calendar day", () => {
  const result = validateBookingRequest(body({ date: "2027-02-09", startTime: "08:00" }), NOW, ID);
  assert.equal(result.ok, false);
  if (result.ok || result.body.kind !== "unavailable") return;
  assert.equal(result.body.reason, "too_far");
});

check("accepts the 90th calendar day", () => {
  accept({ date: "2027-02-08", startTime: "08:00" });
});

check("rejects starts that finish after 20:00", () => {
  for (const [startTime, durationMinutes] of [
    ["16:30", 240],
    ["14:30", 360],
    ["12:30", 480],
    ["17:00", 240],
  ] as const) {
    const result = validateBookingRequest(body({ startTime, durationMinutes }), NOW, ID);
    assert.equal(result.ok, false, startTime);
    if (result.ok || result.body.kind !== "unavailable") continue;
    assert.equal(result.body.reason, "ends_after_close");
  }
});

check("party of 6 is accepted and 7 is rejected", () => {
  assert.equal(accept({ adults: 2, children: 4 }).children, 4);
  assert.equal(accept({ adults: 6, children: 0 }).adults, 6);
  const result = validateBookingRequest(body({ adults: 2, children: 5 }), NOW, ID);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.status, 400);
});

check("second choice uses the same rules and cannot repeat the first", () => {
  accept({ alternateDate: "2026-11-21", alternateStartTime: "13:30", durationMinutes: 360 });
  const same = validateBookingRequest(body({ alternateDate: "2026-11-20", alternateStartTime: "09:00" }), NOW, ID);
  assert.equal(same.ok, false);
  if (same.ok || same.body.kind !== "unavailable") return;
  assert.equal(same.body.reason, "same_choice");
  const early = validateBookingRequest(
    body({ alternateDate: "2026-11-11", alternateStartTime: "08:00" }),
    NOW,
    ID,
  );
  assert.equal(early.ok, false);
  if (early.ok || early.body.kind !== "unavailable") return;
  assert.equal(early.body.reason, "too_soon");
  const half = validateBookingRequest(body({ alternateDate: "2026-11-21" }), NOW, ID);
  assert.equal(half.ok, false);
  if (!half.ok) assert.equal(half.status, 400);
});

check("does not apply private guide time or party rules to ready-made", () => {
  const result = validateBookingRequest(
    body({
      productType: "ready_made",
      experienceId: "GP-OSA-01",
      startTime: "07:00",
      durationMinutes: 100,
      adults: 7,
      children: 0,
      date: "2030-01-01",
    }),
    NOW,
    ID,
  );
  assert.equal(result.ok, false);
  if (result.ok || result.body.kind !== "unavailable") return;
  assert.equal(result.body.reason, "booking_closed");
});

check("rejects a price on the request and a tripped honeypot has no booking ref", () => {
  const priced = validateBookingRequest(body({ amount: 1000 }), NOW, ID);
  assert.equal(priced.ok, false);
  if (!priced.ok) assert.equal(priced.status, 400);
  assert.equal(honeypotTripped(body({ website: "https://spam.example" })), true);
  assert.equal(honeypotTripped(body({ website: "" })), false);
});

check("same canonical content has one hash", () => {
  const first = accept();
  const second = accept({ email: "alex@example.com" });
  assert.equal(bookingBodyHash(first), bookingBodyHash(second));
  assert.equal(first.email, "alex@example.com");
});

check("timeout keeps the submission id and returns the stored booking ref", async () => {
  const booking = accept();
  const calls: string[] = [];
  const gas: BookingGas = {
    async create(value) {
      calls.push(value.submissionId);
      const outcome: CreateOutcome = calls.length === 1 ? { type: "unknown" } : { type: "created", bookingRef: "CR-20261110-7K2MQP", replayed: true };
      return outcome;
    },
    async get(submissionId) {
      assert.equal(submissionId, ID);
      const row: StoredSubmission = {
        idempotencyState: "COMMITTED",
        bodyHash: bookingBodyHash(booking),
        bookingRef: "CR-20261110-7K2MQP",
        rulesCheckedAt: NOW,
      };
      return { type: "row", row };
    },
  };
  const result = await submitBookingRequest(booking, gas, NOW);
  assert.equal(calls.length, 1);
  assert.equal(result.status, 200);
  if (result.body.ok && result.body.accepted) {
    assert.equal(result.body.bookingRef, "CR-20261110-7K2MQP");
    assert.equal(result.body.replayed, true);
  } else {
    assert.fail("expected the stored booking");
  }
});

check("a different body with the same id conflicts", async () => {
  const booking = accept();
  const gas: BookingGas = {
    async create() {
      return { type: "unknown" };
    },
    async get() {
      return {
        type: "row",
        row: { idempotencyState: "COMMITTED", bodyHash: "other", bookingRef: "CR-20261110-AAAAAA", rulesCheckedAt: NOW },
      };
    },
  };
  const result = await submitBookingRequest(booking, gas, NOW);
  assert.equal(result.status, 409);
});

check("gas auth failure is HTTP 401 and conflict is not a success", () => {
  const unauthorized = refusalToOutcome("UNAUTHORIZED");
  assert.equal(unauthorized.type, "rejected");
  if (unauthorized.type === "rejected") assert.equal(unauthorized.status, 401);
  assert.equal(refusalToOutcome("DUPLICATE_CONFLICT").type, "conflict");
  assert.equal(refusalToOutcome("INTERNAL").type, "unknown");
});

check("signature covers the payload string exactly", () => {
  const secret = "0123456789abcdef0123456789abcdef";
  const payload = "{\"submissionId\":\"abc\"}";
  const expected = createHmac("sha256", secret)
    .update(`v1\nbookingRequests.create\n1762700000000\nabc\n${payload}`)
    .digest("base64url");
  assert.equal(signBookingEnvelope(secret, "bookingRequests.create", 1762700000000, "abc", payload), expected);
});

check("stale in-progress is not treated as a committed booking", () => {
  const row: StoredSubmission = {
    idempotencyState: "IN_PROGRESS",
    bodyHash: "hash",
    bookingRef: "CR-20261110-7K2MQP",
    rulesCheckedAt: NOW - 16 * 60 * 1000,
  };
  assert.equal(decideReplay(row, "hash", NOW), "create");
  assert.equal(decideReplay({ ...row, rulesCheckedAt: NOW - 60 * 1000 }, "hash", NOW), "resume");
  assert.equal(decideReplay({ ...row, idempotencyState: "COMMITTED" }, "hash", NOW), "return");
  assert.equal(decideReplay({ ...row, bodyHash: "nope" }, "hash", NOW), "conflict");
});

// --- Ready-made tour requests (src/lib/booking-request/tours.ts, 2026-11-17) ---
const TOUR = "GP-OSA-LIKE-A-LOCAL";
function tourBody(overrides: Record<string, unknown> = {}) {
  return body({
    productType: "ready_made",
    experienceId: TOUR,
    date: "2026-11-20",
    startTime: "09:30",
    durationMinutes: undefined,
    adults: 3,
    children: 0,
    language: "en",
    notes: "Vegetarian snacks, please",
    ...overrides,
  });
}
const tourResult = (overrides: Record<string, unknown> = {}, now = NOW) => validateBookingRequest(tourBody(overrides), now, ID);
const reasonOf = (r: ReturnType<typeof validateBookingRequest>) => (!r.ok && r.body.kind === "unavailable" ? r.body.reason : r.ok ? "ok" : r.body.kind);
const fieldErrorsOf = (r: ReturnType<typeof validateBookingRequest>) => (!r.ok && "fieldErrors" in r.body ? r.body.fieldErrors ?? {} : {});

check("an open tour accepts a request with its own start time, party size and language", () => {
  const r = tourResult();
  assert.equal(r.ok, true, JSON.stringify(r));
  if (!r.ok || r.booking.productType !== "ready_made") return;
  assert.equal(r.booking.experienceId, TOUR);
  assert.equal(r.booking.durationMinutes, 180);
  assert.equal(r.booking.adults, 3);
  assert.equal(r.booking.language, "en");
  assert.equal(r.booking.email, "alex@example.com");
  assert.equal(r.booking.notes, "Vegetarian snacks, please");
  assert.match(bookingBodyHash(r.booking), /^[0-9a-f]{64}$/);
});

check("an open tour requires date, start time, language and a name / email", () => {
  for (const [field, override] of [
    ["date", { date: "" }],
    ["startTime", { startTime: "" }],
    ["language", { language: "" }],
    ["name", { name: "" }],
    ["email", { email: "not-an-email" }],
    ["consent", { consent: false }],
  ] as const) {
    const r = tourResult(override);
    assert.equal(r.ok, false, field);
    if (!r.ok) assert.equal(r.status, 400, field);
    assert.ok(field in fieldErrorsOf(r), `${field}: ${JSON.stringify(r)}`);
  }
});

check("an open tour refuses times, languages and party sizes outside its entry", () => {
  assert.equal(fieldErrorsOf(tourResult({ startTime: "09:00" })).startTime, "invalid_format");
  assert.equal(fieldErrorsOf(tourResult({ language: "ja" })).language, "invalid_format");
  assert.equal(fieldErrorsOf(tourResult({ adults: 7 })).adults, "out_of_range");
  assert.equal(fieldErrorsOf(tourResult({ adults: 4, children: 3 })).adults, "out_of_range");
  assert.equal(fieldErrorsOf(tourResult({ adults: 0 })).adults, "out_of_range");
  assert.equal(tourResult({ adults: 6 }).ok, true);
});

check("an open tour enforces its booking window (no past dates, 48 h lead, 90 days)", () => {
  // NOW = 2026-11-10 03:00 JST. 09:30 on 11-11 is < 48 h away, 11-12 09:30 is 54.5 h away.
  assert.equal(reasonOf(tourResult({ date: "2026-11-09" })), "too_soon");
  assert.equal(reasonOf(tourResult({ date: "2026-11-11" })), "too_soon");
  assert.equal(reasonOf(tourResult({ date: "2026-11-12" })), "ok");
  assert.equal(reasonOf(tourResult({ date: addCalendarDays(tokyoDate(NOW), 90) })), "ok");
  assert.equal(reasonOf(tourResult({ date: addCalendarDays(tokyoDate(NOW), 91) })), "too_far");
  assert.equal(reasonOf(tourResult({ date: "2026-02-30" })), "validation");
});

check("unknown and not-open tours stay closed; alternates and prices are refused", () => {
  assert.equal(reasonOf(tourResult({ experienceId: "GP-OSA-TENMANGU-DRAFT" })), "booking_closed");
  assert.equal(reasonOf(tourResult({ experienceId: "GP-OSA-01" })), "booking_closed");
  assert.equal(reasonOf(tourResult({ alternateDate: "2026-11-21", alternateStartTime: "09:30" })), "validation");
  assert.equal(reasonOf(tourResult({ amount: 19800 })), "validation");
});

check("Private Guide hashes do not change with the tour support", () => {
  // Fixed vector computed with the code before 2026-11-17: stored Private Guide rows must still replay.
  const pg = accept();
  assert.equal(bookingBodyHash(pg), "3eabd5da9544eb6304c485235fa5d13a6374468970aaaed8b1706b3d1e54675d");
  assert.equal("language" in pg, false);
});

await Promise.all(checks);
if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("booking-request rules ok");
