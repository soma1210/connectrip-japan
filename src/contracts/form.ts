import type { Tbd } from "./status";

/**
 * Field primitives shared by the Inquiry and Booking forms. UI renders the
 * `fields` it receives, in order, and must not add or drop fields itself.
 */
export type FieldKind =
  | "text"
  | "email"
  | "tel"
  | "textarea"
  | "select"
  | "multiselect"
  | "date"
  | "dateRange"
  | "number"
  | "guests"
  | "children"
  | "checkbox";

export type FieldOption = {
  value: string;
  label: Tbd<string>;
};

export type FieldSpec<N extends string = string> = {
  name: N;
  kind: FieldKind;
  label: Tbd<string>;
  helpText?: Tbd<string>;
  placeholder?: Tbd<string>;
  /**
   * Required / optional is a human decision. While TBD, render the field as
   * optional; the server is the source of truth for validation.
   */
  required: Tbd<boolean>;
  maxLength?: number;
  options?: FieldOption[];
};

/** Error codes only. The UI maps codes to copy (copy is TBD). */
export type FieldErrorCode = "required" | "invalid_format" | "too_long" | "out_of_range";

export type FieldErrors<N extends string> = Partial<Record<N, FieldErrorCode>>;
