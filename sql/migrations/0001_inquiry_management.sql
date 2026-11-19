-- ---------------------------------------------------------------------------
-- 0001 Inquiry management (Phase 1, 2026-11-16)
--
-- Postgres becomes the system of record for the Website v1 forms:
--   inquiries            one row per form submission (contact inquiry or booking request)
--   inquiry_events       history: received, status changes, internal notes, email results
--   notification_outbox  emails to send (staff notification first), with retries
--   admin_sessions       server-side admin sessions (only a hash of the cookie token is kept)
--   admin_login_attempts failed / successful admin logins, for the login rate limit
--
-- Additive only: creates new tables and indexes, never drops, renames or
-- rewrites anything. Google Sheets data (booking Apps Script) is not touched.
-- Safe to run more than once (IF NOT EXISTS). Applied by scripts/migrate.mjs,
-- which records it in schema_migrations together with a checksum.
--
-- A booking request is never confirmed automatically: every row starts as
-- 'received' and only an explicit admin action may move it on (Phase 2).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Public reference shown to the visitor: CQ-YYYYMMDD-XXXXXX (contact), CR-YYYYMMDD-XXXXXX (booking request)
  ref TEXT NOT NULL UNIQUE CHECK (ref ~ '^C[QR]-[0-9]{8}-[A-Z0-9]{6}$'),
  kind TEXT NOT NULL CHECK (kind IN ('contact', 'booking_request')),
  -- What the visitor asked about, e.g. 'private_guide' or an Experience id
  service TEXT NOT NULL CHECK (length(service) BETWEEN 1 AND 100),
  -- Double-submit protection: one row per submission id, same id + other body = conflict
  submission_id UUID NOT NULL UNIQUE,
  body_hash TEXT NOT NULL CHECK (body_hash ~ '^[0-9a-f]{64}$'),
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'in_review', 'proposed', 'confirmed', 'declined', 'cancelled')),
  customer_name TEXT NOT NULL CHECK (length(customer_name) BETWEEN 1 AND 100),
  customer_email TEXT NOT NULL CHECK (length(customer_email) BETWEEN 3 AND 254),
  preferred_date DATE,
  adults SMALLINT CHECK (adults IS NULL OR adults BETWEEN 0 AND 99),
  children SMALLINT CHECK (children IS NULL OR children BETWEEN 0 AND 99),
  -- The validated submission exactly as accepted by the API (used for the detail view and to rebuild emails)
  payload JSONB NOT NULL,
  payload_version SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS inquiries_status_created_at_idx ON inquiries (status, created_at DESC);
CREATE INDEX IF NOT EXISTS inquiries_kind_created_at_idx ON inquiries (kind, created_at DESC);

CREATE TABLE IF NOT EXISTS inquiry_events (
  id BIGSERIAL PRIMARY KEY,
  inquiry_id UUID NOT NULL REFERENCES inquiries (id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('received', 'status_changed', 'note_added', 'notification_sent', 'notification_failed')),
  from_status TEXT,
  to_status TEXT,
  note TEXT CHECK (note IS NULL OR length(note) <= 5000),
  -- 'website' (form), 'system' (outbox) or 'admin'
  actor TEXT NOT NULL CHECK (length(actor) BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inquiry_events_inquiry_id_idx ON inquiry_events (inquiry_id, created_at);

CREATE TABLE IF NOT EXISTS notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES inquiries (id) ON DELETE RESTRICT,
  channel TEXT NOT NULL CHECK (channel IN ('staff_email', 'customer_auto_reply')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  -- A short code ('not_configured', 'send_failed', ...), never message content or personal data
  last_error TEXT CHECK (last_error IS NULL OR length(last_error) <= 100),
  provider_message_id TEXT,
  next_attempt_at TIMESTAMPTZ DEFAULT now(),
  locked_until TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inquiry_id, channel)
);

CREATE INDEX IF NOT EXISTS notification_outbox_due_idx ON notification_outbox (status, next_attempt_at);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- SHA-256 of the random cookie token: the token itself is never stored
  token_hash TEXT NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  -- Derived from ADMIN_PASSWORD: changing the password ends every session
  credential_fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  ip_hash TEXT,
  user_agent TEXT CHECK (user_agent IS NULL OR length(user_agent) <= 300)
);

CREATE INDEX IF NOT EXISTS admin_sessions_expires_at_idx ON admin_sessions (expires_at);

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id BIGSERIAL PRIMARY KEY,
  -- Keyed hash of the client IP (not reversible without the key)
  ip_hash TEXT NOT NULL,
  succeeded BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_login_attempts_ip_idx ON admin_login_attempts (ip_hash, attempted_at);
CREATE INDEX IF NOT EXISTS admin_login_attempts_at_idx ON admin_login_attempts (attempted_at);
