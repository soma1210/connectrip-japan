-- ---------------------------------------------------------------------------
-- Connectrip Japan partner survey (/partner/apply) — partner application tables
--
-- Additive only: creates two new tables and seeds the pipeline stages. It does
-- not touch guide_applications, guide_pipeline_statuses or any other table.
-- Safe to run more than once (IF NOT EXISTS / ON CONFLICT DO NOTHING).
--
-- Apply with: node scripts/init-db.mjs sql/partner-applications.sql
-- (Statements are split on semicolons, so comments here must not contain one.)
-- ---------------------------------------------------------------------------

-- Sales pipeline stages. Add, rename or reorder stages here, not in code.
-- Renaming a stage (UPDATE ... SET name) cascades to every application.
CREATE TABLE IF NOT EXISTS partner_pipeline_statuses (
  name TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO partner_pipeline_statuses (name, sort_order) VALUES
  ('新規', 10),
  ('確認中', 20),
  ('連絡予定', 30),
  ('連絡済み', 40),
  ('商談予定', 50),
  ('商談済み', 60),
  ('提携検討', 70),
  ('提携済み', 80),
  ('保留', 90),
  ('見送り', 100)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- One id per filled-in form, sent by the browser: a retried submit is saved once.
  submission_id UUID NOT NULL UNIQUE,
  -- Shown to the partner, e.g. P-20261027-4821.
  receipt_no TEXT NOT NULL UNIQUE CHECK (receipt_no ~ '^P-[0-9]{8}-[0-9]{4}$'),

  -- STEP 1 基本情報
  company_name TEXT NOT NULL,
  -- Stable English key, labels in src/features/partner-survey/config/questions.ts
  industry TEXT NOT NULL,
  area TEXT NOT NULL,
  website_url TEXT,

  -- STEP 2 体験・サービス
  experience TEXT NOT NULL,
  languages TEXT NOT NULL,
  capacity TEXT NOT NULL,
  duration TEXT NOT NULL,

  -- STEP 3 料金・提携条件
  price TEXT NOT NULL,
  commission TEXT NOT NULL,
  conditions TEXT NOT NULL,
  booking TEXT NOT NULL,
  cancellation TEXT NOT NULL,

  -- STEP 4 ご連絡先
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  next_contact_date DATE,
  notes TEXT,

  privacy_consent BOOLEAN NOT NULL CHECK (privacy_consent),
  privacy_consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Where the answer came from: 'hp' = /partner/apply.
  source TEXT NOT NULL DEFAULT 'hp',

  -- Admin-only fields
  pipeline_status TEXT NOT NULL DEFAULT '新規'
    REFERENCES partner_pipeline_statuses (name) ON UPDATE CASCADE,
  internal_rating SMALLINT CHECK (internal_rating BETWEEN 1 AND 5),
  internal_notes TEXT NOT NULL DEFAULT '',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_applications_created_at_idx ON partner_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS partner_applications_pipeline_status_idx ON partner_applications (pipeline_status);
CREATE INDEX IF NOT EXISTS partner_applications_industry_idx ON partner_applications (industry);
CREATE INDEX IF NOT EXISTS partner_applications_email_idx ON partner_applications (lower(email));
