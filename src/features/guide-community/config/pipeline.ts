// Recruiting pipeline stages.
//
// The source of truth at runtime is the `guide_pipeline_statuses` table — add,
// rename or reorder stages there (see sql/schema.sql) and the admin screens
// pick them up without a code change. Renaming a row cascades to every
// application that uses it.
//
// This list is only the initial seed and the fallback used when no database is
// connected (local development).

export const DEFAULT_PIPELINE_STATUSES = [
  "応募",
  "アンケート回答",
  "確認中",
  "面談予定",
  "面談済み",
  "登録ガイド",
  "稼働中",
] as const;

/** Status every new form submission starts in. */
export const INITIAL_PIPELINE_STATUS = "アンケート回答";

export const INTERNAL_RATING_MIN = 1;
export const INTERNAL_RATING_MAX = 5;
