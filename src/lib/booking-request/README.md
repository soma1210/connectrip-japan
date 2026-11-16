# Booking request API

`POST /api/v1/booking-requests` accepts Private Guide requests according to the
wire types in `src/contracts/bookingRequest.ts`. It returns a request reference,
not a confirmed booking or a held slot. Ready-made products remain closed.

> **Phase 1 (2026-11-16): storage moved to Postgres.** The API now stores into
> `inquiries` (kind `booking_request`, status `received`) with its history event
> and staff-email outbox row (`src/lib/inquiries`, `sql/migrations`). The Apps
> Script / Google Sheets sections below describe the previous backend: the
> Sheets data is kept, but the API no longer reads or writes it.

## Local verification

Run `bun run check:booking` for validation, recovery, signed transport and route
checks. These use simulated Apps Script responses and do not write to Google
Sheets. For a fresh checkout, run `bunx next typegen` before `bunx tsc --noEmit`.

## Configuration and backend dependency

Set server-only `BOOKING_GAS_URL` to the booking Apps Script `/exec` deployment
and `BOOKING_GAS_SECRET` to its shared secret (at least 32 characters). The
interview deployment must not be used. Missing configuration returns HTTP 503;
there is no success fallback to console logging or email.

## Staff email (2026-11-16)

After Apps Script confirms a new row (not a replay), the route emails the team
through SMTP (`src/lib/notify/email.ts`, `notification.ts`): subject
`[Connectrip Japan] New Booking Request (CR-…)`, the request fields, the line
`Status: Booking Request Received — Not Confirmed`, Reply-To = the guest.
The email never changes the API answer: a stored request is a success even if
the email fails (logged with the reference only, no personal data). Settings:
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, optional `NOTIFY_FROM`
and `NOTIFY_TO` (default `contact@connectripjapan.com`). The Inquiry form uses
the same pattern (`POST /api/v1/inquiries`, action `inquiries.create`, sheet
`Inquiries`; `src/lib/inquiry`). Checks: `bun src/lib/notify/forms.test.ts`.

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
