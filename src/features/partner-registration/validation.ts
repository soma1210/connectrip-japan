// Validation shared by the browser (instant error messages) and the API route
// (the authoritative check before anything is saved).

import { isValidEmail, isValidPhone } from "@/features/guide-community/validation";
import {
  BUSINESS_CATEGORIES,
  CURRENT_CHALLENGES,
  CUSTOMER_TYPES,
  INBOUND_EXPERIENCE,
  INTERESTED_COLLABORATIONS,
  LIMITS,
  NO_CHALLENGES,
  OTHER,
  type ChoiceOption,
  type FormValues,
} from "./config";
import type { FieldErrors, PartnerRegistrationInput } from "./types";

export const MESSAGES = {
  company_name: "会社名・店舗名を入力してください",
  contact_name: "担当者名を入力してください",
  business_category: "事業カテゴリを1つ選択してください",
  business_category_other: "「その他」の事業内容を入力してください",
  area: "所在地または主な対応エリアを入力してください",
  website: "URLの形式が正しくありません（例：https://example.com）",
  customer_types: "主な顧客層を1つ以上選択してください",
  inbound_experience: "受け入れ実績に近いものを1つ選択してください",
  strengths: "強みやおすすめポイントを入力してください",
  current_challenges: "当てはまるものを1つ以上選択してください（「特にない」も選べます）",
  current_challenges_other: "「その他」の課題を入力してください",
  current_challenges_conflict: "「特にない」と他の課題は同時に選択できません",
  interested_collaborations: "興味のあるものを1つ以上選択してください（「まだ具体的には決まっていない」も選べます）",
  interested_collaborations_other: "「その他」の内容を入力してください",
  email_required: "ご連絡先メールアドレスを入力してください",
  email: "メールアドレスの形式が正しくありません（例：info@example.com）",
  phone: "電話番号の形式が正しくありません（数字7〜15桁、+ - ( ) とスペースが使えます）",
  invalidOption: "選択肢から選んでください",
  tooLong: (max: number) => `${max}文字以内で入力してください`,
  tooManyAccounts: `SNSアカウントは${LIMITS.socialAccounts}件まで入力できます`,
} as const;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * "example.com" and "https://example.com" both become "https://example.com".
 * Returns null when it cannot be a web address.
 */
export function normalizeUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value || /\s/.test(value)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".") || url.hostname.startsWith(".") || url.hostname.endsWith(".")) return null;
    return withScheme;
  } catch {
    return null;
  }
}

const isOption = (options: readonly ChoiceOption[], value: string) =>
  options.some((option) => option.value === value);

/** Every error in the form, keyed by field. Empty when the form can be sent. */
export function validateRegistration(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  const text = (key: keyof FormValues) => String(values[key] ?? "").trim();

  const requireText = (key: "company_name" | "contact_name" | "area" | "strengths", max: number) => {
    const value = text(key);
    if (!value) errors[key] = MESSAGES[key];
    else if (value.length > max) errors[key] = MESSAGES.tooLong(max);
  };
  const optionalText = (key: keyof FormValues, max: number) => {
    if (text(key).length > max) errors[key] = MESSAGES.tooLong(max);
  };
  const requireOther = (
    key: "business_category_other" | "current_challenges_other" | "interested_collaborations_other",
    selected: boolean,
  ) => {
    if (selected && !text(key)) errors[key] = MESSAGES[key];
    else optionalText(key, LIMITS.text);
  };
  const requireChoices = (
    key: "customer_types" | "current_challenges" | "interested_collaborations",
    options: readonly ChoiceOption[],
  ) => {
    const selected = values[key];
    if (!selected.length) errors[key] = MESSAGES[key];
    else if (!selected.every((value) => isOption(options, value))) errors[key] = MESSAGES.invalidOption;
  };

  // SECTION 01
  requireText("company_name", LIMITS.text);
  requireText("contact_name", LIMITS.text);
  if (!values.business_category) errors.business_category = MESSAGES.business_category;
  else if (!isOption(BUSINESS_CATEGORIES, values.business_category)) errors.business_category = MESSAGES.invalidOption;
  requireOther("business_category_other", values.business_category === OTHER);
  requireText("area", LIMITS.text);
  if (text("website") && !normalizeUrl(text("website"))) errors.website = MESSAGES.website;
  else optionalText("website", LIMITS.text);
  const accounts = values.social_accounts.map((account) => account.trim()).filter(Boolean);
  if (accounts.length > LIMITS.socialAccounts) errors.social_accounts = MESSAGES.tooManyAccounts;
  else if (accounts.some((account) => account.length > LIMITS.text)) errors.social_accounts = MESSAGES.tooLong(LIMITS.text);

  // SECTION 02
  requireChoices("customer_types", CUSTOMER_TYPES);
  if (!values.inbound_experience) errors.inbound_experience = MESSAGES.inbound_experience;
  else if (!isOption(INBOUND_EXPERIENCE, values.inbound_experience)) errors.inbound_experience = MESSAGES.invalidOption;
  requireText("strengths", LIMITS.textarea);
  requireChoices("current_challenges", CURRENT_CHALLENGES);
  if (!errors.current_challenges && values.current_challenges.includes(NO_CHALLENGES) && values.current_challenges.length > 1) {
    errors.current_challenges = MESSAGES.current_challenges_conflict;
  }
  requireOther("current_challenges_other", values.current_challenges.includes(OTHER));

  // SECTION 03
  requireChoices("interested_collaborations", INTERESTED_COLLABORATIONS);
  requireOther("interested_collaborations_other", values.interested_collaborations.includes(OTHER));
  const email = text("email");
  if (!email) errors.email = MESSAGES.email_required;
  else if (!isValidEmail(email)) errors.email = MESSAGES.email;
  if (text("phone") && !isValidPhone(text("phone"))) errors.phone = MESSAGES.phone;
  optionalText("additional_notes", LIMITS.textarea);

  return errors;
}

/** The cleaned-up answers to store. Only call after validateRegistration() found nothing. */
export function toRegistrationInput(values: FormValues): PartnerRegistrationInput {
  const text = (value: string) => value.trim();
  const optional = (value: string) => value.trim() || null;
  const unique = (list: string[]) => [...new Set(list)];
  // "Other" text is kept only when "other" is actually selected.
  const otherText = (selected: boolean, value: string) => (selected ? optional(value) : null);

  return {
    company_name: text(values.company_name),
    contact_name: text(values.contact_name),
    business_category: values.business_category,
    business_category_other: otherText(values.business_category === OTHER, values.business_category_other),
    area: text(values.area),
    website: values.website.trim() ? normalizeUrl(values.website) : null,
    social_accounts: unique(values.social_accounts.map(text).filter(Boolean)),
    customer_types: unique(values.customer_types),
    inbound_experience: values.inbound_experience,
    strengths: text(values.strengths),
    current_challenges: unique(values.current_challenges),
    current_challenges_other: otherText(values.current_challenges.includes(OTHER), values.current_challenges_other),
    interested_collaborations: unique(values.interested_collaborations),
    interested_collaborations_other: otherText(
      values.interested_collaborations.includes(OTHER),
      values.interested_collaborations_other,
    ),
    email: text(values.email),
    phone: optional(values.phone),
    additional_notes: optional(values.additional_notes),
  };
}

export type ParseResult =
  | { ok: true; isSpam: boolean; submissionId: string; data: PartnerRegistrationInput }
  | { ok: false; errors: FieldErrors };

const STRING_KEYS = [
  "company_name",
  "contact_name",
  "business_category",
  "business_category_other",
  "area",
  "website",
  "inbound_experience",
  "strengths",
  "current_challenges_other",
  "interested_collaborations_other",
  "email",
  "phone",
  "additional_notes",
] as const;

const LIST_KEYS = ["social_accounts", "customer_types", "current_challenges", "interested_collaborations"] as const;

/**
 * Server-side check of a raw JSON body. Only known fields are read; anything
 * else is ignored. Wrong types are rejected rather than coerced.
 */
export function parsePartnerRegistration(body: unknown): ParseResult {
  const input = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const typeErrors: FieldErrors = {};

  const submissionId = typeof input.submission_id === "string" ? input.submission_id.trim() : "";
  if (!UUID_PATTERN.test(submissionId)) {
    typeErrors.submission_id = "送信情報が正しくありません。ページを再読み込みしてください。";
  }

  const values = {} as FormValues;
  for (const key of STRING_KEYS) {
    const raw = input[key];
    if (raw !== undefined && raw !== null && typeof raw !== "string") typeErrors[key] = MESSAGES.invalidOption;
    values[key] = typeof raw === "string" ? raw : "";
  }
  for (const key of LIST_KEYS) {
    const raw = input[key];
    const isList = Array.isArray(raw) && raw.length <= 20 && raw.every((item) => typeof item === "string");
    if (raw !== undefined && raw !== null && !isList) typeErrors[key] = MESSAGES.invalidOption;
    values[key] = isList ? (raw as string[]) : [];
  }

  const errors = { ...validateRegistration(values), ...typeErrors };
  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    // Honeypot: a hidden field people never see. Bots that fill it are dropped.
    isSpam: typeof input.website_confirm === "string" && input.website_confirm.trim() !== "",
    submissionId: submissionId.toLowerCase(),
    data: toRegistrationInput(values),
  };
}
