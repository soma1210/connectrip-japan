-- ---------------------------------------------------------------------------
-- Connectrip Japan 事業者・パートナー向けアンケート (/partner/survey)
--
-- Additive only: creates one new table. It does not touch partner_applications
-- (the /partner/apply survey), guide_applications or any other table.
-- Safe to run more than once (IF NOT EXISTS).
--
-- Apply with: node scripts/init-db.mjs sql/partner-registrations.sql
-- (Statements are split on semicolons, so comments here must not contain one.)
--
-- Choice answers are stored as stable English keys. The Japanese labels live in
-- src/features/partner-registration/config.ts. Multi-select answers are TEXT[]
-- with GIN indexes, so an admin screen can filter with
--   WHERE customer_types @> ARRAY['inbound']      (has this option)
--   WHERE current_challenges && ARRAY['staffing', 'language']  (has any of these)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS partner_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- One id per filled-in form, sent by the browser: a retried submit is saved once.
  submission_id UUID NOT NULL UNIQUE,

  -- SECTION 01 基本情報
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  business_category TEXT NOT NULL,
  business_category_other TEXT,
  area TEXT NOT NULL,
  website TEXT,
  -- URLs or account names, any platform, in the order entered.
  social_accounts TEXT[] NOT NULL DEFAULT '{}',

  -- SECTION 02 現在の事業について
  customer_types TEXT[] NOT NULL CHECK (cardinality(customer_types) > 0),
  inbound_experience TEXT NOT NULL,
  strengths TEXT NOT NULL,
  current_challenges TEXT[] NOT NULL CHECK (cardinality(current_challenges) > 0),
  current_challenges_other TEXT,

  -- SECTION 03 今後の連携について
  interested_collaborations TEXT[] NOT NULL CHECK (cardinality(interested_collaborations) > 0),
  interested_collaborations_other TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  additional_notes TEXT,

  -- Where the answer came from: 'hp' = /partner/survey.
  source TEXT NOT NULL DEFAULT 'hp',

  -- For the future admin screen. Not shown to or set by respondents.
  status TEXT NOT NULL DEFAULT 'new',
  internal_notes TEXT NOT NULL DEFAULT '',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_registrations_created_at_idx ON partner_registrations (created_at DESC);
CREATE INDEX IF NOT EXISTS partner_registrations_status_idx ON partner_registrations (status);
CREATE INDEX IF NOT EXISTS partner_registrations_business_category_idx ON partner_registrations (business_category);
CREATE INDEX IF NOT EXISTS partner_registrations_inbound_experience_idx ON partner_registrations (inbound_experience);
CREATE INDEX IF NOT EXISTS partner_registrations_email_idx ON partner_registrations (lower(email));
CREATE INDEX IF NOT EXISTS partner_registrations_customer_types_idx ON partner_registrations USING GIN (customer_types);
CREATE INDEX IF NOT EXISTS partner_registrations_current_challenges_idx ON partner_registrations USING GIN (current_challenges);
CREATE INDEX IF NOT EXISTS partner_registrations_interested_collaborations_idx ON partner_registrations USING GIN (interested_collaborations)
