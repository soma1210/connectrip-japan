// Fixed booking rules for guide applicant interviews.
//
// Every check (the slots shown to applicants, the request endpoint and the
// admin approval) reads these values, so a rule changes in one place only.

/** Interviews are scheduled in Japan time. Asia/Tokyo has no DST, so a fixed offset is exact. */
export const INTERVIEW_TIME_ZONE = "Asia/Tokyo";
export const JST_OFFSET = "+09:00";
export const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** Monday–Friday (Date#getUTCDay numbering on the JST wall clock). Public holidays are bookable. */
export const BOOKABLE_WEEKDAYS: readonly number[] = [1, 2, 3, 4, 5];

/** Earliest interview start, JST wall clock. */
export const DAY_START = "10:00";
/** The interview plus its after-buffer must end by this time, JST wall clock (last start 20:15). */
export const DAY_END = "21:00";

export const SLOT_STEP_MINUTES = 15;
export const INTERVIEW_MINUTES = 30;
export const BUFFER_BEFORE_MINUTES = 15;
export const BUFFER_AFTER_MINUTES = 15;

/**
 * Minimum gap between two interviews. Matches the database exclusion
 * constraint on tstzrange(start, end + 15 minutes).
 */
export const MIN_GAP_BETWEEN_INTERVIEWS_MINUTES = 15;

/** PENDING_APPROVAL and CONFIRMED interviews together. */
export const MAX_INTERVIEWS_PER_DAY = 5;

/** Requests must be made at least this long before the interview starts. */
export const MIN_LEAD_HOURS = 24;

/** Slots are offered for this many calendar days, starting today (JST). */
export const BOOKING_WINDOW_DAYS = 14;

/** Booking links stop working after this many days. */
export const BOOKING_TOKEN_TTL_DAYS = 14;

export const MINUTE_MS = 60 * 1000;
