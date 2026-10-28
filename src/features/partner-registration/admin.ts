// 事業者アンケート管理画面 (/admin/partner-registrations) — statuses, priorities,
// filters and sorting. Pure functions only, so the list can filter in the browser
// and the server can validate saves against the same definitions.

import type { PartnerRegistration } from "./types";

export const PARTNER_STATUSES = [
  { value: "new", label: "新規", tone: "bg-sky-50 text-sky-900 ring-sky-200" },
  { value: "reviewed", label: "確認済み", tone: "bg-slate-100 text-slate-700 ring-slate-300" },
  { value: "contacted", label: "連絡済み", tone: "bg-indigo-50 text-indigo-900 ring-indigo-200" },
  { value: "meeting_scheduled", label: "商談予定", tone: "bg-violet-50 text-violet-900 ring-violet-200" },
  { value: "meeting_done", label: "商談済み", tone: "bg-violet-100 text-violet-950 ring-violet-300" },
  { value: "considering", label: "提携検討中", tone: "bg-amber-50 text-amber-950 ring-amber-200" },
  { value: "partnered", label: "提携済み", tone: "bg-emerald-50 text-emerald-900 ring-emerald-200" },
  { value: "on_hold", label: "保留", tone: "bg-stone-100 text-stone-600 ring-stone-200" },
  { value: "rejected", label: "見送り", tone: "bg-white text-slate-400 ring-slate-200" },
] as const;

export type PartnerStatus = (typeof PARTNER_STATUSES)[number]["value"];

/** Statuses with a summary card above the list (after 総回答数). */
export const SUMMARY_STATUSES: PartnerStatus[] = ["new", "contacted", "meeting_scheduled", "partnered"];

export const PRIORITIES = [
  { value: "A", label: "A：優先", tone: "bg-red-50 text-red-800 ring-red-200" },
  { value: "B", label: "B：通常", tone: "bg-navy/5 text-navy ring-navy/20" },
  { value: "C", label: "C：低", tone: "bg-slate-50 text-slate-500 ring-slate-200" },
] as const;

export type PartnerPriority = (typeof PRIORITIES)[number]["value"];

/** Filter value for rows with no priority yet. */
export const NO_PRIORITY = "none";

export const NEXT_ACTION_SUGGESTIONS = ["メール返信", "オンライン商談", "提案資料送付", "店舗訪問", "再度連絡"];

export const SORTS = [
  { value: "newest", label: "回答日 新しい順" },
  { value: "oldest", label: "回答日 古い順" },
  { value: "priority", label: "優先度順" },
  { value: "next_action", label: "次回対応日が近い順" },
] as const;

export type PartnerSort = (typeof SORTS)[number]["value"];

export const ADMIN_LIMITS = { nextAction: 200, internalNotes: 20000 } as const;

/** Next action dates this many days away or fewer are highlighted. */
export const DUE_SOON_DAYS = 3;

export interface PartnerRegistrationFilters {
  q: string;
  business_category: string;
  status: string;
  priority: string;
  inbound_experience: string;
  collaboration: string;
  sort: PartnerSort;
}

export const EMPTY_FILTERS: PartnerRegistrationFilters = {
  q: "",
  business_category: "",
  status: "",
  priority: "",
  inbound_experience: "",
  collaboration: "",
  sort: "newest",
};

const FILTER_KEYS = ["q", "business_category", "status", "priority", "inbound_experience", "collaboration"] as const;

export function isPartnerStatus(value: string): value is PartnerStatus {
  return PARTNER_STATUSES.some((status) => status.value === value);
}

export function isPartnerPriority(value: string): value is PartnerPriority {
  return PRIORITIES.some((priority) => priority.value === value);
}

export function statusLabel(value: string) {
  return PARTNER_STATUSES.find((status) => status.value === value)?.label ?? value;
}

export function parseFilters(params: Record<string, string | string[] | undefined>): PartnerRegistrationFilters {
  const read = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  };
  const sort = read("sort");
  const filters = { ...EMPTY_FILTERS };
  for (const key of FILTER_KEYS) filters[key] = read(key);
  filters.sort = SORTS.some((item) => item.value === sort) ? (sort as PartnerSort) : "newest";
  return filters;
}

export function hasActiveFilters(filters: PartnerRegistrationFilters) {
  return FILTER_KEYS.some((key) => filters[key] !== "");
}

/** Query string for the list URL. Defaults are left out to keep it short. */
export function filtersToQuery(filters: PartnerRegistrationFilters) {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) if (filters[key]) params.set(key, filters[key]);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  return params.toString();
}

const PRIORITY_RANK: Record<string, number> = { A: 0, B: 1, C: 2 };

export function filterAndSort(rows: PartnerRegistration[], filters: PartnerRegistrationFilters) {
  const q = filters.q.toLowerCase();
  const visible = rows.filter((row) => {
    if (q && ![row.company_name, row.contact_name, row.area, row.email].some((value) => value.toLowerCase().includes(q))) {
      return false;
    }
    if (filters.business_category && row.business_category !== filters.business_category) return false;
    if (filters.status && row.status !== filters.status) return false;
    if (filters.priority === NO_PRIORITY ? row.priority !== null : filters.priority && row.priority !== filters.priority) {
      return false;
    }
    if (filters.inbound_experience && row.inbound_experience !== filters.inbound_experience) return false;
    if (filters.collaboration && !row.interested_collaborations.includes(filters.collaboration)) return false;
    return true;
  });

  const newestFirst = (a: PartnerRegistration, b: PartnerRegistration) => b.created_at.localeCompare(a.created_at);
  const compare: Record<PartnerSort, (a: PartnerRegistration, b: PartnerRegistration) => number> = {
    newest: newestFirst,
    oldest: (a, b) => a.created_at.localeCompare(b.created_at),
    priority: (a, b) => (PRIORITY_RANK[a.priority ?? ""] ?? 3) - (PRIORITY_RANK[b.priority ?? ""] ?? 3) || newestFirst(a, b),
    // Rows without a date go last.
    next_action: (a, b) =>
      (a.next_action_at ?? "9999-12-31").localeCompare(b.next_action_at ?? "9999-12-31") || newestFirst(a, b),
  };
  return visible.sort(compare[filters.sort]);
}

/** Today in Japan as YYYY-MM-DD. */
export function todayInJapan(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(now);
}

/** How close a next action date is, given today's YYYY-MM-DD. */
export function dueState(date: string | null, today: string): "overdue" | "soon" | "later" | null {
  if (!date) return null;
  if (date < today) return "overdue";
  const days = (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000;
  return days <= DUE_SOON_DAYS ? "soon" : "later";
}
