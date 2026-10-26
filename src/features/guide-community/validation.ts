// Validation shared by the browser (instant error messages) and the API route
// (the authoritative check before anything is saved). Rules come from the
// question definitions in config/questions.ts, so they cannot drift apart.

import { NO_GUIDE_EXPERIENCE, OTHER, LANGUAGE_LEVELS, type Option } from "./config/options";
import {
  INITIAL_VALUES,
  SECTIONS,
  isVisible,
  type FormValues,
  type Question,
} from "./config/questions";
import type { FieldErrors, GuideApplicationInput, LanguageSkill } from "./types";

export const MESSAGES = {
  required: "この項目は必須です",
  requiredChoice: "選択してください",
  requiredMulti: "1つ以上選択してください",
  invalidOption: "選択肢から選んでください",
  otherRequired: "「その他」の内容を入力してください",
  email: "メールアドレスの形式が正しくありません",
  phone: "電話番号の形式が正しくありません（数字7〜15桁、+ - ( ) とスペースが使えます）",
  levelRequired: "レベルを選択してください",
  consent: "送信するには同意が必要です",
  tooLong: (max: number) => `${max}文字以内で入力してください`,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS = /^\+?[\d\s\-().]+$/;

export function isValidEmail(value: string) {
  return value.length <= 254 && EMAIL_PATTERN.test(value);
}

/** Accepts Japanese and international numbers; counts digits rather than enforcing a national format. */
export function isValidPhone(value: string) {
  if (!PHONE_CHARS.test(value)) return false;
  const digits = value.replace(/\D/g, "").length;
  return digits >= 7 && digits <= 15;
}

const allowed = (options: readonly Option[], value: string) =>
  options.some((option) => option.value === value);

/** Errors for one question, keyed by field name. Hidden questions never error. */
export function validateQuestion(question: Question, values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!isVisible(question, values)) return errors;

  switch (question.type) {
    case "text":
    case "email":
    case "tel":
    case "textarea": {
      const value = values[question.field].trim();
      if (!value) {
        if (question.required) errors[question.field] = MESSAGES.required;
      } else if (value.length > question.maxLength) {
        errors[question.field] = MESSAGES.tooLong(question.maxLength);
      } else if (question.type === "email" && !isValidEmail(value)) {
        errors[question.field] = MESSAGES.email;
      } else if (question.type === "tel" && !isValidPhone(value)) {
        errors[question.field] = MESSAGES.phone;
      }
      break;
    }
    case "radio":
    case "select": {
      const value = values[question.field];
      if (!value) {
        if (question.required) errors[question.field] = MESSAGES.requiredChoice;
      } else if (!allowed(question.options, value)) {
        errors[question.field] = MESSAGES.invalidOption;
      } else if (question.otherField && value === OTHER && !values[question.otherField].trim()) {
        errors[question.otherField] = MESSAGES.otherRequired;
      }
      break;
    }
    case "checkbox": {
      const selected = values[question.field];
      if (selected.length === 0) {
        if (question.required) errors[question.field] = MESSAGES.requiredMulti;
      } else if (!selected.every((value) => allowed(question.options, value))) {
        errors[question.field] = MESSAGES.invalidOption;
      } else if (
        question.otherField &&
        selected.includes(OTHER) &&
        !values[question.otherField].trim()
      ) {
        errors[question.otherField] = MESSAGES.otherRequired;
      }
      break;
    }
    case "location": {
      const { prefecture, city } = question;
      if (!values.prefecture) {
        if (question.required) errors.prefecture = MESSAGES.requiredChoice;
      } else if (!allowed(prefecture.options, values.prefecture)) {
        errors.prefecture = MESSAGES.invalidOption;
      }
      const cityValue = values.city.trim();
      if (!cityValue) {
        if (question.required) errors.city = MESSAGES.required;
      } else if (cityValue.length > city.maxLength) {
        errors.city = MESSAGES.tooLong(city.maxLength);
      }
      break;
    }
    case "languageLevels": {
      for (const language of values[question.sourceField]) {
        const level = values.language_levels[language];
        if (!level) {
          if (question.required) errors[`language_levels.${language}`] = MESSAGES.levelRequired;
        } else if (!allowed(question.levels, level)) {
          errors[`language_levels.${language}`] = MESSAGES.invalidOption;
        }
      }
      break;
    }
  }
  return errors;
}

export const ALL_QUESTIONS: Question[] = SECTIONS.flatMap((section) => section.questions);

/** Every error in the form, including the privacy consent checkbox. */
export function validateValues(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  for (const question of ALL_QUESTIONS) {
    Object.assign(errors, validateQuestion(question, values));
  }
  if (values.privacy_consent !== true) errors.privacy_consent = MESSAGES.consent;
  return errors;
}

// ---------------------------------------------------------------------------
// Server side: untrusted JSON → FormValues → normalized GuideApplicationInput
// ---------------------------------------------------------------------------

/** Coerce an untrusted request body into FormValues, dropping unknown keys and wrong types. */
export function coerceFormValues(body: unknown): FormValues {
  const source = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const values = { ...INITIAL_VALUES, language_levels: {} } as FormValues;
  const target = values as Record<string, unknown>;

  for (const key of Object.keys(INITIAL_VALUES) as (keyof FormValues)[]) {
    const initial = INITIAL_VALUES[key];
    const raw = source[key];
    if (typeof initial === "string") {
      target[key] = typeof raw === "string" ? raw : "";
    } else if (typeof initial === "boolean") {
      target[key] = raw === true;
    } else if (Array.isArray(initial)) {
      target[key] = Array.isArray(raw)
        ? [...new Set(raw.filter((item): item is string => typeof item === "string"))]
        : [];
    }
  }

  const levels = source.language_levels;
  if (levels && typeof levels === "object" && !Array.isArray(levels)) {
    for (const [language, level] of Object.entries(levels)) {
      if (typeof level === "string") values.language_levels[language] = level;
    }
  }
  return values;
}

const optional = (value: string) => value.trim() || null;

/** Keep stored arrays in the same order as the option list. */
function ordered(selected: string[], options: readonly Option[]) {
  return options.map((option) => option.value).filter((value) => selected.includes(value));
}

function findOptions(field: keyof FormValues): readonly Option[] {
  for (const question of ALL_QUESTIONS) {
    if ((question.type === "checkbox" || question.type === "radio" || question.type === "select") && question.field === field) {
      return question.options;
    }
  }
  return [];
}

/**
 * Turn valid FormValues into the shape stored in the database: trims text,
 * nulls out empty optional answers, clears answers to hidden conditional
 * questions and "Other" text whose "Other" box isn't ticked, and pairs each
 * language with its level.
 */
export function normalizeValues(values: FormValues): GuideApplicationInput {
  const otherText = (selected: boolean, text: string) => (selected ? optional(text) : null);
  const hasExperience = values.guide_experience !== NO_GUIDE_EXPERIENCE;

  const languages: LanguageSkill[] = ordered(values.languages, findOptions("languages")).map(
    (language) => ({
      language,
      level: values.language_levels[language],
      ...(language === OTHER ? { custom_name: values.languages_other.trim() } : {}),
    }),
  );

  return {
    name: values.name.trim(),
    age_range: optional(values.age_range),
    prefecture: values.prefecture,
    city: values.city.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim().replace(/\s+/g, " "),
    languages,
    guide_experience: values.guide_experience,
    guide_experience_detail: hasExperience ? optional(values.guide_experience_detail) : null,
    guide_experience_years: hasExperience ? optional(values.guide_experience_years) : null,
    available_areas: ordered(values.available_areas, findOptions("available_areas")),
    available_areas_other: otherText(values.available_areas.includes(OTHER), values.available_areas_other),
    available_days: ordered(values.available_days, findOptions("available_days")),
    available_times: ordered(values.available_times, findOptions("available_times")),
    monthly_availability: values.monthly_availability,
    employment_status: values.employment_status,
    employment_status_other: otherText(values.employment_status === OTHER, values.employment_status_other),
    occupation_detail: optional(values.occupation_detail),
    guide_purposes: ordered(values.guide_purposes, findOptions("guide_purposes")),
    guide_purposes_other: otherText(values.guide_purposes.includes(OTHER), values.guide_purposes_other),
    commitment_period: values.commitment_period,
    international_experience: values.international_experience,
    interests: ordered(values.interests, findOptions("interests")),
    interests_other: otherText(values.interests.includes(OTHER), values.interests_other),
    motivation: values.motivation.trim(),
    desired_guide_type: optional(values.desired_guide_type),
    self_introduction: values.self_introduction.trim(),
    interview_preference: values.interview_preference,
    privacy_consent: true,
  };
}

export type ParseResult =
  | { ok: true; data: GuideApplicationInput; isSpam: boolean }
  | { ok: false; errors: FieldErrors };

/** Full server-side pipeline for a submitted body. */
export function parseApplication(body: unknown): ParseResult {
  const values = coerceFormValues(body);
  const errors = validateValues(values);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: normalizeValues(values), isSpam: values.website.trim() !== "" };
}

/** Rank of a level in LANGUAGE_LEVELS (0 = lowest), or -1 if unknown. */
export function levelRank(level: string) {
  return LANGUAGE_LEVELS.findIndex((option) => option.value === level);
}
