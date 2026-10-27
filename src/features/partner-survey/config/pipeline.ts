// Partner sales pipeline stages.
//
// The source of truth at runtime is the `partner_pipeline_statuses` table — add,
// rename or reorder stages there (see sql/partner-applications.sql) and the
// admin screens pick them up without a code change. Renaming a row cascades to
// every application that uses it.
//
// This list is only the initial seed and the fallback used when no database is
// connected (local development).

export const DEFAULT_PARTNER_PIPELINE_STATUSES = [
  "新規",
  "確認中",
  "連絡予定",
  "連絡済み",
  "商談予定",
  "商談済み",
  "提携検討",
  "提携済み",
  "保留",
  "見送り",
] as const;

/** Status every new form submission starts in. */
export const INITIAL_PARTNER_STATUS = "新規";

export const INTERNAL_RATING_MIN = 1;
export const INTERNAL_RATING_MAX = 5;
