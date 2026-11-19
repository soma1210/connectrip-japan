-- ---------------------------------------------------------------------------
-- 事業者アンケート管理画面 (/admin/partner-registrations) の管理用カラム
--
-- Additive only: adds three nullable columns and one index to
-- partner_registrations. Existing rows get NULL (= 未設定). The survey form and
-- /api/partner-registrations do not write these columns, so they are unaffected.
-- It does not touch guide_applications, partner_applications or any other table.
-- Safe to run more than once (IF NOT EXISTS).
--
-- Run after sql/partner-registrations.sql, with:
--   node scripts/init-db.mjs sql/partner-registrations-admin.sql
-- (Statements are split on semicolons, so comments here must not contain one.)
--
-- status keeps its existing TEXT column with no CHECK: the allowed keys live in
-- src/features/partner-registration/admin.ts and are checked when saving.
-- ---------------------------------------------------------------------------

ALTER TABLE partner_registrations
  ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('A', 'B', 'C')),
  ADD COLUMN IF NOT EXISTS next_action TEXT,
  ADD COLUMN IF NOT EXISTS next_action_at DATE;

CREATE INDEX IF NOT EXISTS partner_registrations_next_action_at_idx ON partner_registrations (next_action_at)
