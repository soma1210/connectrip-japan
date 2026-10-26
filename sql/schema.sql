-- Run once after connecting Vercel Postgres (see scripts/init-db.mjs).

CREATE TABLE IF NOT EXISTS gallery_items (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  alt_ja TEXT NOT NULL DEFAULT '',
  alt_en TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vlog_posts (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  title_ja TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  description_ja TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  alt_ja TEXT NOT NULL DEFAULT '',
  alt_en TEXT NOT NULL DEFAULT '',
  link_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT '',
  country_code TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 5,
  tag TEXT NOT NULL DEFAULT '',
  review_date TEXT NOT NULL DEFAULT '',
  quote_ja TEXT NOT NULL DEFAULT '',
  quote_en TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Connectrip Guide Community — guide applicant database
-- Stored option values are stable English keys defined in
-- src/features/guide-community/config/options.ts (labels live in code).
-- ---------------------------------------------------------------------------

-- Recruiting pipeline stages. Add, rename or reorder stages here, not in code.
-- Renaming a stage (UPDATE ... SET name) cascades to every application.
CREATE TABLE IF NOT EXISTS guide_pipeline_statuses (
  name TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO guide_pipeline_statuses (name, sort_order) VALUES
  ('応募', 10),
  ('アンケート回答', 20),
  ('確認中', 30),
  ('面談予定', 40),
  ('面談済み', 50),
  ('登録ガイド', 60),
  ('稼働中', 70)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS guide_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  age_range TEXT,

  prefecture TEXT NOT NULL,
  city TEXT NOT NULL,

  email TEXT NOT NULL,
  phone TEXT NOT NULL,

  -- [{"language": "English", "level": "Guide/Customer Service"}, ...]
  -- language "Other" also carries "custom_name".
  languages JSONB NOT NULL DEFAULT '[]'::jsonb,

  guide_experience TEXT NOT NULL,
  guide_experience_detail TEXT,
  guide_experience_years TEXT,

  available_areas TEXT[] NOT NULL DEFAULT '{}',
  available_areas_other TEXT,
  available_days TEXT[] NOT NULL DEFAULT '{}',
  available_times TEXT[] NOT NULL DEFAULT '{}',
  monthly_availability TEXT NOT NULL,

  employment_status TEXT NOT NULL,
  employment_status_other TEXT,
  occupation_detail TEXT,

  guide_purposes TEXT[] NOT NULL DEFAULT '{}',
  guide_purposes_other TEXT,
  commitment_period TEXT NOT NULL,

  international_experience TEXT NOT NULL,

  interests TEXT[] NOT NULL DEFAULT '{}',
  interests_other TEXT,

  motivation TEXT NOT NULL,
  desired_guide_type TEXT,
  self_introduction TEXT NOT NULL,

  interview_preference TEXT NOT NULL,

  privacy_consent BOOLEAN NOT NULL CHECK (privacy_consent),
  privacy_consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Admin-only fields
  pipeline_status TEXT NOT NULL DEFAULT 'アンケート回答'
    REFERENCES guide_pipeline_statuses (name) ON UPDATE CASCADE,
  internal_rating SMALLINT CHECK (internal_rating BETWEEN 1 AND 5),
  internal_notes TEXT NOT NULL DEFAULT '',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guide_applications_created_at_idx ON guide_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS guide_applications_pipeline_status_idx ON guide_applications (pipeline_status);
CREATE INDEX IF NOT EXISTS guide_applications_email_idx ON guide_applications (lower(email));
CREATE INDEX IF NOT EXISTS guide_applications_languages_idx ON guide_applications USING GIN (languages jsonb_path_ops);
CREATE INDEX IF NOT EXISTS guide_applications_areas_idx ON guide_applications USING GIN (available_areas);
CREATE INDEX IF NOT EXISTS guide_applications_days_idx ON guide_applications USING GIN (available_days)
