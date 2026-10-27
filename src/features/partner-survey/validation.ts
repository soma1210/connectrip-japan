// Validation shared by the browser (instant error messages) and the API route
// (the authoritative check before anything is saved). Rules come from the
// field definitions in config/questions.ts, so they cannot drift apart.

import { isValidEmail, isValidPhone } from "@/features/guide-community/validation";
import {
  FIELD_KEYS,
  FIELDS,
  INDUSTRIES,
  MAX_LENGTH,
  STEPS,
  type FieldDef,
  type FormValues,
} from "./config/questions";
import type { FieldErrors, PartnerApplicationInput } from "./types";

export const MESSAGES = {
  required: "この項目は必須です",
  requiredChoice: "選択してください",
  invalidOption: "選択肢から選んでください",
  email: "メールアドレスの形式が正しくありません",
  phone: "電話番号の形式が正しくありません（数字7〜15桁、+ - ( ) とスペースが使えます）",
  url: "https:// または http:// から始まるURLを入力してください",
  date: "日付の形式が正しくありません",
  consent: "送信するには同意が必要です",
  tooLong: `${MAX_LENGTH}文字以内で入力してください`,
} as const;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

/** A real calendar date in YYYY-MM-DD form. */
export function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Error message for one field, or null when the answer is fine. */
export function validateField(def: FieldDef, raw: string): string | null {
  const value = raw.trim();
  if (!value) {
    if (!def.required) return null;
    return def.kind === "select" ? MESSAGES.requiredChoice : MESSAGES.required;
  }
  if (value.length > MAX_LENGTH) return MESSAGES.tooLong;

  switch (def.kind) {
    case "select":
      return INDUSTRIES.some((option) => option.value === value) ? null : MESSAGES.invalidOption;
    case "email":
      return isValidEmail(value) ? null : MESSAGES.email;
    case "tel":
      return isValidPhone(value) ? null : MESSAGES.phone;
    case "url":
      return isValidUrl(value) ? null : MESSAGES.url;
    case "date":
      return isValidDate(value) ? null : MESSAGES.date;
    default:
      return null;
  }
}

export function validateStep(stepIndex: number, values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  for (const key of STEPS[stepIndex]?.fields ?? []) {
    const message = validateField(FIELDS[key], values[key]);
    if (message) errors[key] = message;
  }
  return errors;
}

export function validateAll(values: FormValues): FieldErrors {
  return STEPS.reduce<FieldErrors>((errors, _, index) => ({ ...errors, ...validateStep(index, values) }), {});
}

/** Index of the first step that has an error, or -1. */
export function firstStepWithError(errors: FieldErrors) {
  return STEPS.findIndex((step) => step.fields.some((key) => errors[key]));
}

export type ParseResult =
  | { ok: true; isSpam: boolean; submissionId: string; data: PartnerApplicationInput }
  | { ok: false; errors: FieldErrors };

/**
 * Server-side check of a raw JSON body. Only known fields are read; anything
 * else is ignored. Non-string answers are rejected rather than coerced.
 */
export function parsePartnerApplication(body: unknown): ParseResult {
  const input = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const errors: FieldErrors = {};

  const submissionId = typeof input.submission_id === "string" ? input.submission_id.trim() : "";
  if (!UUID_PATTERN.test(submissionId)) errors.submission_id = "送信情報が正しくありません。ページを再読み込みしてください。";

  const values = {} as FormValues;
  for (const key of FIELD_KEYS) {
    const raw = input[key];
    if (raw !== undefined && raw !== null && typeof raw !== "string") {
      errors[key] = MESSAGES.invalidOption;
      values[key] = "";
      continue;
    }
    values[key] = typeof raw === "string" ? raw : "";
  }
  Object.assign(errors, { ...validateAll(values), ...errors });

  if (input.privacy_consent !== true) errors.privacy_consent = MESSAGES.consent;

  if (Object.keys(errors).length) return { ok: false, errors };

  const text = (key: keyof FormValues) => values[key].trim();
  const optional = (key: keyof FormValues) => text(key) || null;

  return {
    ok: true,
    // Honeypot: a hidden field people never see. Bots that fill it are dropped.
    isSpam: typeof input.website_confirm === "string" && input.website_confirm.trim() !== "",
    submissionId: submissionId.toLowerCase(),
    data: {
      company_name: text("company_name"),
      industry: text("industry"),
      area: text("area"),
      website_url: optional("website_url"),
      experience: text("experience"),
      languages: text("languages"),
      capacity: text("capacity"),
      duration: text("duration"),
      price: text("price"),
      commission: text("commission"),
      conditions: text("conditions"),
      booking: text("booking"),
      cancellation: text("cancellation"),
      contact_name: text("contact_name"),
      email: text("email"),
      phone: text("phone"),
      next_contact_date: optional("next_contact_date"),
      notes: optional("notes"),
      privacy_consent: true,
    },
  };
}
