import type { AreaKey, ExperienceId } from "./experience";
import type { FieldErrors, FieldSpec } from "./form";
import type { RecordStatus, Tbd } from "./status";

/**
 * Inquiry ≠ Booking (Website Brain §9).
 *
 * - private_guide: Private Guide consultation (Website v1 §4). Main use in v1.
 * - general: any other question. Whether the Inquiry page keeps a general
 *   form is TBD; the kind exists so both can share one contract.
 *
 * Field sets are PROPOSED: a human decides the final fields, required /
 * optional and validation. UI renders whatever `fields` it receives.
 */
export type InquiryKind = "private_guide" | "general";

export type InquiryFieldName =
  | "name"
  | "email"
  | "country"
  /** Private Guide: one preferred date. */
  | "preferredDate"
  /** General (T-02): a date range. */
  | "travelDate"
  /** Adults. */
  | "partySize"
  | "children"
  /** Private Guide: "Where would you like to go?" */
  | "destinations"
  /** Private Guide: "What would you like to do?" */
  | "activities"
  /** Private Guide: "Places you already want to visit". */
  | "placesToVisit"
  /** Private Guide: "Tell us about your ideal day in Kansai". */
  | "idealDay"
  /** Private Guide: "Anything we should know?" */
  | "notes"
  | "interests"
  | "selectedExperience"
  | "message"
  | "consent";

/** Option values from the Website v1 baseline. Labels come from content. */
export type PrivateGuideDestination = AreaKey;

export type PrivateGuideActivity =
  | "food"
  | "local_neighborhoods"
  | "culture"
  | "famous_sights"
  | "shopping"
  | "family_activities"
  | "hidden_gems"
  | "other";

export type InquiryFieldSpec = FieldSpec<InquiryFieldName>;

export type InquiryFormValues = {
  name?: string;
  email?: string;
  country?: string;
  /** ISO date (YYYY-MM-DD). */
  preferredDate?: string;
  travelDate?: { start?: string; end?: string; flexible?: boolean };
  partySize?: { adults?: number };
  /** Collecting children's ages is TBD (consent). */
  children?: { count?: number; ages?: number[] };
  destinations?: PrivateGuideDestination[];
  /** Free text when `destinations` includes "other" (TBD whether collected). */
  destinationsOther?: string;
  activities?: PrivateGuideActivity[];
  activitiesOther?: string;
  placesToVisit?: string;
  idealDay?: string;
  notes?: string;
  interests?: string[];
  selectedExperience?: ExperienceId;
  message?: string;
  consent?: boolean;
};

export type InquirySubmitResult =
  | { ok: true }
  | {
      ok: false;
      kind: "validation" | "rate_limited" | "server" | "network";
      fieldErrors?: FieldErrors<InquiryFieldName>;
    };

/**
 * Supplied by the integration layer (real API) or by fixtures (mock).
 * Presentation components call this and nothing else to submit. The kind is
 * fixed by the form model, so values never carry it.
 */
export type InquirySubmitHandler = (values: InquiryFormValues) => Promise<InquirySubmitResult>;

/** UI state machine for the form. */
export type InquiryFormState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "submitted" }
  | { phase: "error"; result: Extract<InquirySubmitResult, { ok: false }> };

export type InquiryFormModel = {
  kind: InquiryKind;
  fieldsStatus: RecordStatus;
  fields: InquiryFieldSpec[];
  /** Set when arriving from an Experience CTA (general inquiries only). */
  preselectedExperience?: { id: ExperienceId; title: Tbd<string> };
  consent: {
    label: Tbd<string>;
    /** Privacy content is NOT_VERIFIED (L-03); the link target still exists. */
    privacyHref: string;
  };
  submitLabel: Tbd<string>;
  /** Explains Inquiry ≠ Booking and what happens next (reply timing is TBD). */
  expectationNote: Tbd<string>;
  /** Shown after a successful submit (copy TBD). */
  successMessage: Tbd<string>;
  /**
   * Spam trap. Render a visually hidden text input with this name, not
   * focusable (tabIndex -1, autoComplete off), and include its value as-is.
   */
  honeypotFieldName: string;
};
