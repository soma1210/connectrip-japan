-- ---------------------------------------------------------------------------
-- 0002 Inquiry admin (Phase 2, 2026-11-16)
--
-- Additive only. `version` is the optimistic lock for admin updates: a
-- status change carries the version it was based on and is refused when
-- someone else changed the inquiry in the meantime (no lost updates).
-- Existing rows get 0.
-- ---------------------------------------------------------------------------

ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0);

-- Dashboard / list filters
CREATE INDEX IF NOT EXISTS notification_outbox_inquiry_idx ON notification_outbox (inquiry_id);
