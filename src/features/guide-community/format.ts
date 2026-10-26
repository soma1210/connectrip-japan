// Stored values → Japanese display text, shared by the admin screens and the
// notification email.

import { LANGUAGE_LEVELS, LANGUAGES, OTHER, labelOf, type Option } from "./config/options";
import type { LanguageSkill } from "./types";

export function languageName(skill: LanguageSkill) {
  return skill.language === OTHER && skill.custom_name
    ? skill.custom_name
    : labelOf(LANGUAGES, skill.language);
}

/** "英語（ガイド・接客可能）、日本語（ネイティブ…）" */
export function formatLanguages(skills: LanguageSkill[]) {
  return skills
    .map((skill) => `${languageName(skill)}（${labelOf(LANGUAGE_LEVELS, skill.level)}）`)
    .join("、");
}

/** Labels for a multi-choice answer, with the "その他" text appended in brackets. */
export function formatChoices(
  options: readonly Option[],
  values: string[],
  otherText?: string | null,
) {
  return values
    .map((value) =>
      value === OTHER && otherText ? `その他（${otherText}）` : labelOf(options, value),
    )
    .join("、");
}

export function formatChoice(options: readonly Option[], value: string | null, otherText?: string | null) {
  if (!value) return "";
  return formatChoices(options, [value], otherText);
}

export function formatDate(iso: string, withTime = false) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
