# Booking request API

`POST /api/v1/booking-requests` accepts Private Guide requests according to the
wire types in `src/contracts/bookingRequest.ts`. It returns a request reference,
not a confirmed booking or a held slot. Ready-made products remain closed.

## Local verification

Run `bun run check:booking` for validation, recovery, signed transport and route
checks. These use simulated Apps Script responses and do not write to Google
Sheets. For a fresh checkout, run `bunx next typegen` before `bunx tsc --noEmit`.

## Configuration and backend dependency

Set server-only `BOOKING_GAS_URL` to the booking Apps Script `/exec` deployment
and `BOOKING_GAS_SECRET` to its shared secret (at least 32 characters). The
interview deployment must not be used. Missing configuration returns HTTP 503;
there is no success fallback to console logging or email.

The Apps Script implementation and deployment are outside this directory and
have not been verified by these tests. Before connecting the public form, verify
that the backend implements the following protocol and persists rows atomically:

- POST envelope: `{ v: 1, action, ts, nonce, payload, sig }`. `payload` is a JSON
  string. `sig` is base64url HMAC-SHA256 of
  `v1\n${action}\n${ts}\n${nonce}\n${payload}` using the shared secret.
- `bookingRequests.create`: payload `{ booking, bodyHash }`; successful response
  `{ ok: true, data: { bookingRef, replayed } }`, where `replayed` is boolean.
- `bookingRequests.getBySubmissionId`: payload `{ submissionId }`; response
  `{ ok: true, data: { row: null } }` for an absent row, or a row with
  `idempotencyState`, `bodyHash`, `bookingRef`, and nullable `rulesCheckedAt`
  (Unix milliseconds). States: `IN_PROGRESS`, `COMMITTED`, `ABANDONED`.
- References match `CR-YYYYMMDD-XXXXXX` (six uppercase letters/digits).
- Refusals: `{ ok: false, error: { code } }`; recognized codes are
  `DUPLICATE_CONFLICT`, `VALIDATION`, `TOO_SOON`, `TOO_FAR`, `ENDS_AFTER_CLOSE`,
  `SAME_CHOICE`, and `BOOKING_CLOSED`.

The backend must authenticate the envelope, prevent envelope replay, validate the
booking rules independently, and enforce submission-ID uniqueness under a lock.
The body hash uses the exact normalized field order in `bookingBodyHash`.
An unknown create result triggers one lookup and at most one retry with the same
ID and body. Only a matching `COMMITTED` row can be returned as recovered success.
The backend must handle resuming or restarting incomplete rows without duplicates.

## Client behavior

Send the same UUID v4 in `submissionId` and the `Idempotency-Key` header. Preserve
both the ID and request content when retrying an uncertain result. Show a receipt
only for `ok: true, accepted: true`; a honeypot response has `accepted: false` and
no reference. Price, amount and currency are not accepted from the client.

HTTP responses: 200 accepted/honeypot, 400 invalid input, 409 conflicting content
for the same ID, 422 unavailable slot/product, 429 rate limit, 503 backend
unavailable or uncertain. The shared rate limiter is per-process best effort,
not a distributed quota.
