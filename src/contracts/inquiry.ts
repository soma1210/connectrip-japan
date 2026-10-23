import type { ExperienceId } from "./experience";
import type { RecordStatus, Tbd } from "./status";

/**
 * Inquiry ≠ Booking (Website Brain §9). The field set is PROPOSED: a human
 * decides the final fields (Website Brain §9, L-03). UI renders whatever
 * `fields` it receives, in order, and must not add or drop fields itself.
 */
export type InquiryFieldName =
  | "name"
  | "email"
  | "country"
  | "travelDate"
  | "partySize"
  | "children"
  | "interests"
  | "selectedExperience"
  | "message"
  | "consent";

export type InquiryFieldKind =
  | "text"
  | "email"
  | "textarea"
  | "select"
  | "multiselect"
  | "dateRange"
  | "number"
  | "children"
  | "checkbox";

export type FieldOption = {
  value: string;
  label: Tbd<string>;
};

export type FieldSpec = {
  name: InquiryFieldName;
  kind: InquiryFieldKind;
  label: Tbd<string>;
  helpText?: Tbd<string>;
  placeholder?: Tbd<string>;
  required: boolean;
  maxLength?: number;
  options?: FieldOption[];
};

export type InquiryFormValues = {
  name?: string;
  email?: string;
  country?: string;
  travelDate?: { start?: string; end?: string; flexible?: boolean };
  partySize?: { adults?: number };
  children?: { count?: number; ages?: number[] };
  interests?: string[];
  selectedExperience?: ExperienceId;
  message?: string;
  consent?: boolean;
};

/** Error codes only. The UI maps codes to copy (copy is TBD). */
export type FieldErrorCode = "required" | "invalid_format" | "too_long" | "out_of_range";

export type InquirySubmitResult =
  | { ok: true }
  | {
      ok: false;
      kind: "validation" | "rate_limited" | "server" | "network";
      fieldErrors?: Partial<Record<InquiryFieldName, FieldErrorCode>>;
    };

/**
 * Supplied by the integration layer (real API) or by fixtures (mock).
 * Presentation components call this and nothing else to submit.
 */
export type InquirySubmitHandler = (values: InquiryFormValues) => Promise<InquirySubmitResult>;

/** UI state machine for the form. */
export type InquiryFormState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "submitted" }
  | { phase: "error"; result: Extract<InquirySubmitResult, { ok: false }> };

export type InquiryFormModel = {
  fieldsStatus: RecordStatus;
  fields: FieldSpec[];
  /** Set when arriving from an Experience Detail CTA. */
  preselectedExperience?: { id: ExperienceId; title: Tbd<string> };
  consent: {
    label: Tbd<string>;
    /** Privacy content is NOT_VERIFIED (L-03); the link target still exists. */
    privacyHref: string;
  };
  submitLabel: Tbd<string>;
  /** Explains Inquiry ≠ Booking and what happens next (reply timing is TBD). */
  expectationNote: Tbd<string>;
  /**
   * Spam trap. Render a visually hidden text input with this name, not
   * focusable (tabIndex -1, autoComplete off), and include its value as-is.
   */
  honeypotFieldName: string;
};
