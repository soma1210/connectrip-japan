/**
 * Content status for every business-facing value in the Website contracts.
 *
 * - TBD:      not decided. No value exists; the UI must render a placeholder.
 * - PROPOSED: a draft value exists (e.g. a Working Baseline or a product note
 *             awaiting human review). Safe for previews, never for production.
 * - APPROVED: decided by a human. `source` must point to where the decision is
 *             recorded (e.g. "Website Brain WD-002").
 *
 * Only humans move a value to APPROVED (Website Foundation §3, §7).
 */
export type ContentStatus = "TBD" | "PROPOSED" | "APPROVED";

export type TbdValue = {
  status: "TBD";
  /** What is missing, for reviewers. Never rendered as public copy. */
  note?: string;
};

export type ProposedValue<T> = {
  status: "PROPOSED";
  value: T;
  /** Where the draft comes from (note + section). */
  source?: string;
};

export type ApprovedValue<T> = {
  status: "APPROVED";
  value: T;
  /** Where the human decision is recorded. Required. */
  source: string;
};

/** A business value whose decision state travels with it. */
export type Tbd<T> = TbdValue | ProposedValue<T> | ApprovedValue<T>;

/** Status of a whole record (an Experience, a route, a form field set). */
export type RecordStatus = "PROPOSED" | "APPROVED";

export function tbd(note?: string): TbdValue {
  return note ? { status: "TBD", note } : { status: "TBD" };
}

export function proposed<T>(value: T, source?: string): ProposedValue<T> {
  return source ? { status: "PROPOSED", value, source } : { status: "PROPOSED", value };
}

export function approved<T>(value: T, source: string): ApprovedValue<T> {
  return { status: "APPROVED", value, source };
}

export function isApproved<T>(field: Tbd<T>): field is ApprovedValue<T> {
  return field.status === "APPROVED";
}

/** True when a draft or approved value exists (useful for previews). */
export function hasValue<T>(field: Tbd<T>): field is ProposedValue<T> | ApprovedValue<T> {
  return field.status !== "TBD";
}
