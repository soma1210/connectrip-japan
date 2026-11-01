// Guide Admin (Google Sheets): turn sheet rows into applications, and the list filters.

import { FIELDS, REQUIRED_KEYS, type FieldKey } from "./config";
import type { InterviewRequest, SheetAnswer, SheetApplication } from "./types";

const normalizeHeader = (header: string) => header.replace(/\s+/g, " ").trim();

/** Google Forms joins checkbox answers with ", ". */
export function splitChoices(value: string) {
  return value
    .split(", ")
    .map((choice) => choice.trim())
    .filter(Boolean);
}

/**
 * Rows of the applications tab → applications, newest first. Row 1 is the
 * header; columns are found by header text. Fully empty rows are skipped.
 */
export function parseApplications(values: string[][]): {
  applications: SheetApplication[];
  missingHeaders: string[];
} {
  const [headerRow = [], ...rows] = values;
  const headers = headerRow.map(normalizeHeader);
  const indexOf = new Map<string, number>();
  headers.forEach((header, index) => {
    if (header && !indexOf.has(header)) indexOf.set(header, index);
  });

  const known = new Set(FIELDS.map((field) => normalizeHeader(field.header)));
  const extraColumns = headers.flatMap((header, index) => (header && !known.has(header) ? [{ header, index }] : []));
  const missingHeaders = FIELDS.filter((field) => !indexOf.has(normalizeHeader(field.header))).map((field) => field.header);

  const applications: SheetApplication[] = [];
  rows.forEach((row, rowIndex) => {
    if (!row.some((cell) => cell.trim())) return;
    const cell = (index: number | undefined) => (index === undefined ? "" : (row[index] ?? "").trim());
    const fields = Object.fromEntries(
      FIELDS.map((field) => [field.key, cell(indexOf.get(normalizeHeader(field.header)))]),
    ) as Record<FieldKey, string>;
    const extraAnswers: SheetAnswer[] = extraColumns.map(({ header, index }) => ({ header, value: cell(index) }));
    const rowNumber = rowIndex + 2;
    applications.push({
      key: fields.applicationId || `row-${rowNumber}`,
      rowNumber,
      fields,
      languages: splitChoices(fields.languages),
      areas: splitChoices(fields.areas),
      extraAnswers,
    });
  });

  return { applications: applications.reverse(), missingHeaders };
}

export function missingRequiredHeaders(missingHeaders: string[]) {
  const required = new Set(FIELDS.filter((field) => REQUIRED_KEYS.includes(field.key)).map((field) => field.header));
  return missingHeaders.filter((header) => required.has(header));
}

const REQUEST_HEADERS = {
  requestId: "Request ID",
  applicationId: "Application ID",
  requestedStart: "Requested Start",
  requestedEnd: "Requested End",
  approvalStatus: "Approval Status",
  confirmedAt: "Confirmed At",
  createdAt: "Created At",
  notes: "Notes",
} as const satisfies Record<keyof InterviewRequest, string>;

/** Rows of the interview requests tab, matched by header text like the applications. */
export function parseInterviewRequests(values: string[][]): InterviewRequest[] {
  const [headerRow = [], ...rows] = values;
  const headers = headerRow.map(normalizeHeader);
  return rows
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row) => {
      const entries = Object.entries(REQUEST_HEADERS).map(([key, header]) => {
        const index = headers.indexOf(header);
        return [key, index === -1 ? "" : (row[index] ?? "").trim()];
      });
      return Object.fromEntries(entries) as InterviewRequest;
    });
}

// --- list filters --------------------------------------------------------------

/** Filter value for "not filled in yet" (interview status, evaluation). */
export const NOT_SET = "__none";

export type GuideSheetFilters = {
  q: string;
  status: string;
  interview: string;
  evaluation: string;
  language: string;
  area: string;
};

export const EMPTY_FILTERS: GuideSheetFilters = {
  q: "",
  status: "",
  interview: "",
  evaluation: "",
  language: "",
  area: "",
};

const FILTER_KEYS = Object.keys(EMPTY_FILTERS) as (keyof GuideSheetFilters)[];

export function parseFilters(params: Record<string, string | string[] | undefined>): GuideSheetFilters {
  const filters = { ...EMPTY_FILTERS };
  for (const key of FILTER_KEYS) {
    const value = params[key];
    filters[key] = (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  }
  return filters;
}

export function hasActiveFilters(filters: GuideSheetFilters) {
  return FILTER_KEYS.some((key) => filters[key] !== "");
}

/** Query string for the list URL. Empty filters are left out to keep it short. */
export function filtersToQuery(filters: GuideSheetFilters) {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) if (filters[key]) params.set(key, filters[key]);
  return params.toString();
}

const matchesValue = (filter: string, value: string) => !filter || (filter === NOT_SET ? value === "" : value === filter);

export function filterApplications(rows: SheetApplication[], filters: GuideSheetFilters) {
  const q = filters.q.toLowerCase();
  return rows.filter((row) => {
    const { fields } = row;
    if (q && ![fields.name, fields.email, fields.applicationId].some((value) => value.toLowerCase().includes(q))) {
      return false;
    }
    if (filters.status && fields.status !== filters.status) return false;
    if (!matchesValue(filters.interview, fields.interviewStatus)) return false;
    if (!matchesValue(filters.evaluation, fields.evaluation)) return false;
    if (filters.language && !row.languages.includes(filters.language) && fields.mainLanguage !== filters.language) {
      return false;
    }
    if (filters.area && !row.areas.includes(filters.area)) return false;
    return true;
  });
}

/** Distinct non-empty values, in the order they first appear. */
export function distinctValues(values: Iterable<string>) {
  return [...new Set([...values].filter(Boolean))];
}

/** "2026/11/01 11:10:10" → "2026/11/01". Anything else is returned as written. */
export function datePart(value: string) {
  return value.split(" ")[0] ?? value;
}
