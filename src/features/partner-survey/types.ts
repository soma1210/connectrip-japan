import type { FieldKey } from "./config/questions";

/** What the API stores for one submission. Optional answers left blank are null. */
export interface PartnerApplicationInput {
  company_name: string;
  industry: string;
  area: string;
  website_url: string | null;
  experience: string;
  languages: string;
  capacity: string;
  duration: string;
  price: string;
  commission: string;
  conditions: string;
  booking: string;
  cancellation: string;
  contact_name: string;
  email: string;
  phone: string;
  /** YYYY-MM-DD */
  next_contact_date: string | null;
  notes: string | null;
  privacy_consent: true;
}

export interface PartnerApplicationAdminFields {
  pipeline_status: string;
  internal_rating: number | null;
  internal_notes: string;
}

export interface PartnerApplication extends PartnerApplicationInput, PartnerApplicationAdminFields {
  id: string;
  submission_id: string;
  receipt_no: string;
  source: string;
  privacy_consented_at: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerApplicationFilters {
  q?: string;
  pipeline_status?: string;
  industry?: string;
}

export type FieldErrors = Partial<Record<FieldKey | "privacy_consent" | "submission_id", string>>;
