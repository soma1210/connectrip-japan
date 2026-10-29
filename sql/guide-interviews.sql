-- ---------------------------------------------------------------------------
-- Connectrip Guide Community — applicant interview booking (/interview/[token])
--
-- Additive only: enables btree_gist and creates guide_interviews. It does not
-- change guide_applications, guide_pipeline_statuses or any other table.
-- Safe to run more than once (IF NOT EXISTS).
--
-- Apply with: node scripts/init-db.mjs sql/guide-interviews.sql
-- (Statements are split on semicolons, so comments here must not contain one.)
--
-- Booking rules live in src/features/guide-interviews/rules.ts. The two rules
-- the database also enforces, so concurrent requests cannot break them:
--   * at most one open interview per application (partial unique index)
--   * at least 15 minutes between held interviews (exclusion constraint)
-- The 5-per-day limit is enforced in a transaction under an advisory lock.
--
-- No Google Calendar content is stored here: only our own event id and the
-- Meet URL created for the interview after approval.
-- ---------------------------------------------------------------------------

-- Needed to combine "interviewer =" with a time-range overlap in one constraint.
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS guide_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_application_id UUID NOT NULL REFERENCES guide_applications (id),
  interviewer TEXT NOT NULL DEFAULT 'soma',

  -- INVITED          link sent, no time chosen yet
  -- PENDING_APPROVAL time requested and held, waiting for an admin
  -- APPROVING        an admin is approving right now (calendar event being created)
  -- CONFIRMED / REJECTED / CANCELLED / COMPLETED
  status TEXT NOT NULL DEFAULT 'INVITED' CHECK (status IN (
    'INVITED', 'PENDING_APPROVAL', 'APPROVING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'
  )),
  -- Free-text reason for REJECTED / CANCELLED, admin-only.
  status_reason TEXT,

  -- sha256 (hex) of the random token in the booking URL. The token itself is never stored.
  booking_token_hash TEXT NOT NULL UNIQUE,
  token_expires_at TIMESTAMPTZ NOT NULL,

  requested_start_at TIMESTAMPTZ,
  requested_end_at TIMESTAMPTZ,
  -- requested_end_at + 15 minutes: the end of the time this interview keeps
  -- from other interviews. A real column because index expressions must be
  -- IMMUTABLE and timestamptz + interval is not.
  hold_end_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ,

  google_event_id TEXT,
  meet_url TEXT,

  invitation_email_sent_at TIMESTAMPTZ,
  confirmation_email_sent_at TIMESTAMPTZ,

  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- A requested time is always a whole 30-minute interview.
  CONSTRAINT guide_interviews_requested_time_check CHECK (
    (requested_start_at IS NULL AND requested_end_at IS NULL AND hold_end_at IS NULL)
    OR (
      requested_end_at = requested_start_at + interval '30 minutes'
      AND hold_end_at = requested_end_at + interval '15 minutes'
    )
  ),
  -- Every status past INVITED carries a time, except a cancelled invitation.
  CONSTRAINT guide_interviews_time_required_check CHECK (
    status IN ('INVITED', 'CANCELLED') OR requested_start_at IS NOT NULL
  ),
  -- A Meet URL exists only once an interview has been approved.
  CONSTRAINT guide_interviews_meet_after_approval_check CHECK (
    meet_url IS NULL OR status IN ('CONFIRMED', 'COMPLETED', 'CANCELLED')
  ),
  -- Two held interviews need at least 15 minutes between them:
  -- [start, hold_end) may not overlap for the same interviewer.
  CONSTRAINT guide_interviews_no_overlap EXCLUDE USING gist (
    interviewer WITH =,
    tstzrange(requested_start_at, hold_end_at) WITH &&
  ) WHERE (status IN ('PENDING_APPROVAL', 'APPROVING', 'CONFIRMED'))
);

-- One open interview per application. Ended rows (REJECTED / CANCELLED / COMPLETED) stay as history.
CREATE UNIQUE INDEX IF NOT EXISTS guide_interviews_one_open_per_application_idx
  ON guide_interviews (guide_application_id)
  WHERE status IN ('INVITED', 'PENDING_APPROVAL', 'APPROVING', 'CONFIRMED');

CREATE INDEX IF NOT EXISTS guide_interviews_application_idx ON guide_interviews (guide_application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS guide_interviews_status_idx ON guide_interviews (status);
CREATE INDEX IF NOT EXISTS guide_interviews_requested_start_idx ON guide_interviews (requested_start_at);
