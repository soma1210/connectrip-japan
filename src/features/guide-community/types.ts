// Data shapes for a Guide Community application. Field names match the
// database columns in sql/schema.sql (guide_applications) one-to-one.

export type LanguageSkill = {
  /** A LANGUAGES value, e.g. "English". "Other" means see `custom_name`. */
  language: string;
  /** A LANGUAGE_LEVELS value, e.g. "Guide/Customer Service". */
  level: string;
  /** Only for language "Other": the language the applicant typed in. */
  custom_name?: string;
};

/** What the public form submits — validated and normalized by validateApplication. */
export type GuideApplicationInput = {
  name: string;
  age_range: string | null;

  prefecture: string;
  city: string;

  email: string;
  phone: string;

  languages: LanguageSkill[];

  guide_experience: string;
  guide_experience_detail: string | null;
  guide_experience_years: string | null;

  available_areas: string[];
  available_areas_other: string | null;
  available_days: string[];
  available_times: string[];
  monthly_availability: string;

  employment_status: string;
  employment_status_other: string | null;
  occupation_detail: string | null;

  guide_purposes: string[];
  guide_purposes_other: string | null;
  commitment_period: string;

  international_experience: string;

  interests: string[];
  interests_other: string | null;

  motivation: string;
  desired_guide_type: string | null;
  self_introduction: string;

  interview_preference: string;

  privacy_consent: true;
};

/** Fields only Connectrip staff can set, from the admin detail screen. */
export type GuideApplicationAdminFields = {
  pipeline_status: string;
  internal_rating: number | null;
  internal_notes: string;
};

export type GuideApplication = GuideApplicationInput &
  GuideApplicationAdminFields & {
    id: string;
    privacy_consented_at: string;
    created_at: string;
    updated_at: string;
  };

/** Admin list filters. Every key is optional; empty means "no filter". */
export type GuideApplicationFilters = {
  language?: string;
  /** Minimum level — matches this level or higher (see LANGUAGE_LEVELS order). */
  min_level?: string;
  area?: string;
  guide_experience?: string;
  employment_status?: string;
  day?: string;
  monthly_availability?: string;
  pipeline_status?: string;
  /** Free text: matches name, email, phone or city. */
  q?: string;
};

export type FieldErrors = Partial<Record<string, string>>;
