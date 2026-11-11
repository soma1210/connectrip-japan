import assert from "node:assert/strict";
import { POST } from "@/app/api/v1/booking-requests/route";
import { bookingGasFromEnv, createBookingGas, signBookingEnvelope } from "./gas";
import { addCalendarDays, bookingBodyHash, tokyoDate, validateBookingRequest } from "./rules";
import { submitBookingRequest, type BookingGas } from "./submit";

const id = "8f0c1c3e-6b1a-4e3a-9c2d-1a2b3c4d5e6f";
const url = "https://script.google.com/macros/s/test-deployment/exec";
const secret = "test-only-secret-with-at-least-32-characters";
const bookingRef = "CR-20261110-7K2MQP";
const raw = {
  submissionId: id, locale: "en", productType: "private_guide",
  date: addCalendarDays(tokyoDate(Date.now()), 10), startTime: "09:00",
  durationMinutes: 240, adults: 2, children: 0,
  name: "Test Guest", email: "test@example.com", consent: true,
};
const validated = validateBookingRequest(raw, Date.now(), id);
assert.ok(validated.ok);
const booking = validated.booking;
const hash = bookingBodyHash(booking);
const calls: { url: string; init: RequestInit }[] = [];
const fakeFetch = (handler: (url: string, init: RequestInit) => Response | Promise<Response>) =>
  (async (input, init) => handler(String(input), init ?? {})) as typeof fetch;
const success = () => Response.json({ ok: true, data: { bookingRef, replayed: false } });

assert.equal(bookingGasFromEnv({}), null);
assert.equal(bookingGasFromEnv({ BOOKING_GAS_URL: url, BOOKING_GAS_SECRET: "short" }), null);
assert.equal(bookingGasFromEnv({ BOOKING_GAS_URL: "https://example.com/exec", BOOKING_GAS_SECRET: secret }), null);

const gas = createBookingGas(url, secret, fakeFetch((target, init) => {
  calls.push({ url: target, init });
  if (calls.length === 1) return new Response(null, {
    status: 302, headers: { location: "https://script.googleusercontent.com/macros/echo?test=1" },
  });
  return success();
}));
assert.deepEqual(await gas.create(booking, hash), { type: "created", bookingRef, replayed: false });
assert.equal(calls.length, 2);
assert.equal(calls[0].init.redirect, "manual");
assert.equal(calls[1].init.method, "GET");
assert.equal(calls[1].init.body, undefined);
assert.equal(calls[1].init.headers, undefined);
const envelope = JSON.parse(String(calls[0].init.body));
assert.equal(envelope.sig, signBookingEnvelope(secret, envelope.action, envelope.ts, envelope.nonce, envelope.payload));
assert.deepEqual(JSON.parse(envelope.payload), { booking, bodyHash: hash });

let redirects = 0;
const unsafeRedirect = createBookingGas(url, secret, fakeFetch(() => {
  redirects++;
  return new Response(null, { status: 302, headers: { location: "https://example.com/leak" } });
}));
assert.deepEqual(await unsafeRedirect.create(booking, hash), { type: "unknown" });
assert.equal(redirects, 1);

for (const data of [undefined, {}, [], "invalid", { bookingRef }, { bookingRef, replayed: "false" }]) {
  const malformed = createBookingGas(url, secret, fakeFetch(() => Response.json({ ok: true, data })));
  assert.deepEqual(await malformed.create(booking, hash), { type: "unknown" });
  assert.deepEqual(await malformed.get(id), { type: "unknown" });
}
const missing = createBookingGas(url, secret, fakeFetch(() => Response.json({ ok: true, data: { row: null } })));
assert.deepEqual(await missing.get(id), { type: "row", row: null });
const conflict = createBookingGas(url, secret, fakeFetch(() => Response.json({ ok: false, error: { code: "DUPLICATE_CONFLICT" } })));
assert.deepEqual(await conflict.create(booking, hash), { type: "conflict" });

let creates = 0;
const retryGas: BookingGas = {
  async create(value, bodyHash) {
    creates++;
    assert.equal(value.submissionId, id);
    assert.equal(bodyHash, hash);
    return { type: "unknown" };
  },
  async get() { return { type: "row", row: null }; },
};
assert.equal((await submitBookingRequest(booking, retryGas)).status, 503);
assert.equal(creates, 2);
creates = 0;
assert.equal((await submitBookingRequest(booking, { ...retryGas, async get() { return { type: "unknown" }; } })).status, 503);
assert.equal(creates, 1);

// Exercise the actual route without contacting Google or writing a sheet row.
const originalFetch = globalThis.fetch;
const originalUrl = process.env.BOOKING_GAS_URL;
const originalSecret = process.env.BOOKING_GAS_SECRET;
let sequence = 0;
function request(body: unknown, key: string | null = id, ip = `booking-test-${sequence++}`) {
  const headers: Record<string, string> = { "content-type": "application/json", "x-nf-client-connection-ip": ip };
  if (key !== null) headers["idempotency-key"] = key;
  return new Request("http://localhost/api/v1/booking-requests", {
    method: "POST", headers, body: JSON.stringify(body),
  });
}
try {
  delete process.env.BOOKING_GAS_URL;
  delete process.env.BOOKING_GAS_SECRET;
  assert.equal((await POST(request(raw))).status, 503);
  assert.equal((await POST(request(raw, null))).status, 400);
  assert.equal((await POST(request({ ...raw, amount: 1000 }))).status, 400);
  assert.deepEqual(await (await POST(request({ ...raw, website: "spam" }))).json(), { ok: true, accepted: false });
  const closed = await POST(request({ ...raw, productType: "ready_made", experienceId: "GP-OSA-01" }));
  assert.equal(closed.status, 422);
  assert.equal((await closed.json()).reason, "booking_closed");
  process.env.BOOKING_GAS_URL = url;
  process.env.BOOKING_GAS_SECRET = secret;
  let writes = 0;
  globalThis.fetch = fakeFetch(() => { writes++; return success(); });
  const accepted = await POST(request(raw));
  assert.equal(accepted.status, 200);
  assert.deepEqual(await accepted.json(), { ok: true, accepted: true, bookingRef, status: "REQUESTED", replayed: false });
  assert.equal(writes, 1);
  for (let index = 0; index < 5; index++) {
    assert.equal((await POST(request({}, id, "booking-test-rate-limit"))).status, 400);
  }
  assert.equal((await POST(request({}, id, "booking-test-rate-limit"))).status, 429);
  assert.equal(writes, 1);
} finally {
  globalThis.fetch = originalFetch;
  if (originalUrl === undefined) delete process.env.BOOKING_GAS_URL;
  else process.env.BOOKING_GAS_URL = originalUrl;
  if (originalSecret === undefined) delete process.env.BOOKING_GAS_SECRET;
  else process.env.BOOKING_GAS_SECRET = originalSecret;
}
console.log("booking-request transport, recovery and API checks ok");
