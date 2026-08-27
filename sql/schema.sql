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
