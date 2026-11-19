// Admin list filters: parsing from the URL, and the two equivalent
// implementations used by the storage backends — a parameterized SQL WHERE
// clause for Postgres, and an in-memory predicate for the local dev file store.
// Keep the two in step when adding a filter.

import {
  AREAS,
  DAYS,
  EMPLOYMENT_STATUSES,
  GUIDE_EXPERIENCE,
  LANGUAGE_LEVELS,
  LANGUAGES,
  MONTHLY_AVAILABILITY,
  valuesOf,
  type Option,
} from "./config/options";
import type { GuideApplication, GuideApplicationFilters } from "./types";
import { levelRank } from "./validation";

type FilterKey = keyof GuideApplicationFilters;

/** Option lists the filter values are checked against (pipeline_status is checked against the DB list). */
const FILTER_OPTIONS: Partial<Record<FilterKey, readonly Option[]>> = {
  language: LANGUAGES,
  min_level: LANGUAGE_LEVELS,
  area: AREAS,
  guide_experience: GUIDE_EXPERIENCE,
  employment_status: EMPLOYMENT_STATUSES,
  day: DAYS,
  monthly_availability: MONTHLY_AVAILABILITY,
};

const FILTER_KEYS: FilterKey[] = [
  "language",
  "min_level",
  "area",
  "guide_experience",
  "employment_status",
  "day",
  "monthly_availability",
  "pipeline_status",
  "q",
];

/** Read filters from Next.js searchParams, ignoring unknown keys and values not in the option lists. */
export function parseFilters(
  params: Record<string, string | string[] | undefined>,
  pipelineStatuses: string[],
): GuideApplicationFilters {
  const filters: GuideApplicationFilters = {};
  for (const key of FILTER_KEYS) {
    const raw = params[key];
    const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
    if (!value) continue;
    const options = FILTER_OPTIONS[key];
    if (options && !valuesOf(options).includes(value)) continue;
    if (key === "pipeline_status" && !pipelineStatuses.includes(value)) continue;
    filters[key] = key === "q" ? value.slice(0, 100) : value;
  }
  return filters;
}

export function hasActiveFilters(filters: GuideApplicationFilters) {
  return Object.values(filters).some(Boolean);
}

/** Build `WHERE …` (or "") with $1… placeholders for guide_applications. */
export function buildWhereClause(filters: GuideApplicationFilters) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  const param = (value: unknown) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (filters.language || filters.min_level) {
    const parts: string[] = [];
    if (filters.language) parts.push(`l->>'language' = ${param(filters.language)}`);
    if (filters.min_level) {
      // array_position is 1-based, so rank r maps to position r + 1.
      const levels = param(valuesOf(LANGUAGE_LEVELS));
      parts.push(
        `array_position(${levels}::text[], l->>'level') >= ${param(levelRank(filters.min_level) + 1)}`,
      );
    }
    conditions.push(
      `EXISTS (SELECT 1 FROM jsonb_array_elements(languages) AS l WHERE ${parts.join(" AND ")})`,
    );
  }
  if (filters.area) conditions.push(`${param(filters.area)} = ANY(available_areas)`);
  if (filters.day) conditions.push(`${param(filters.day)} = ANY(available_days)`);
  if (filters.guide_experience) conditions.push(`guide_experience = ${param(filters.guide_experience)}`);
  if (filters.employment_status) conditions.push(`employment_status = ${param(filters.employment_status)}`);
  if (filters.monthly_availability)
    conditions.push(`monthly_availability = ${param(filters.monthly_availability)}`);
  if (filters.pipeline_status) conditions.push(`pipeline_status = ${param(filters.pipeline_status)}`);
  if (filters.q) {
    const pattern = param(`%${filters.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
    conditions.push(
      `(name ILIKE ${pattern} OR email ILIKE ${pattern} OR phone ILIKE ${pattern} OR city ILIKE ${pattern})`,
    );
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
}

/** In-memory equivalent of buildWhereClause. */
export function matchesFilters(app: GuideApplication, filters: GuideApplicationFilters) {
  if (filters.language || filters.min_level) {
    const minRank = filters.min_level ? levelRank(filters.min_level) : -1;
    const match = app.languages.some(
      (skill) =>
        (!filters.language || skill.language === filters.language) &&
        (!filters.min_level || levelRank(skill.level) >= minRank),
    );
    if (!match) return false;
  }
  if (filters.area && !app.available_areas.includes(filters.area)) return false;
  if (filters.day && !app.available_days.includes(filters.day)) return false;
  if (filters.guide_experience && app.guide_experience !== filters.guide_experience) return false;
  if (filters.employment_status && app.employment_status !== filters.employment_status) return false;
  if (filters.monthly_availability && app.monthly_availability !== filters.monthly_availability)
    return false;
  if (filters.pipeline_status && app.pipeline_status !== filters.pipeline_status) return false;
  if (filters.q) {
    const q = filters.q.toLowerCase();
    if (![app.name, app.email, app.phone, app.city].some((v) => v.toLowerCase().includes(q)))
      return false;
  }
  return true;
}
