import type { FieldKey } from "./config";

/** What the API stores for one submission. Optional answers left blank are null (or [] for lists). */
export interface PartnerRegistrationInput {
  company_name: string;
  contact_name: string;
  business_category: string;
  business_category_other: string | null;
  area: string;
  website: string | null;
  social_accounts: string[];
  customer_types: string[];
  inbound_experience: string;
  strengths: string;
  current_challenges: string[];
  current_challenges_other: string | null;
  interested_collaborations: string[];
  interested_collaborations_other: string | null;
  email: string;
  phone: string | null;
  additional_notes: string | null;
}

/** One row of partner_registrations, as the admin screen reads it. */
export interface PartnerRegistration extends PartnerRegistrationInput, PartnerRegistrationAdminFields {
  id: string;
  submission_id: string;
  source: string;
  created_at: string;
  updated_at: string;
}

/** What only admins edit (/admin/partner-registrations). Keys and labels: ./admin.ts */
export interface PartnerRegistrationAdminFields {
  status: string;
  /** 'A' | 'B' | 'C', or null = 未設定. */
  priority: string | null;
  internal_notes: string;
  next_action: string | null;
  /** YYYY-MM-DD, no time. */
  next_action_at: string | null;
}

export type FieldErrors = Partial<Record<FieldKey | "submission_id", string>>;
