import type { AreaKey, PrivateGuideActivity } from "@/contracts";

/**
 * Private Day choices (Human instruction 2026-11-13): the option lists shown as
 * text on Home and chosen in the request form, plus an optional deep link
 * (`/private-guide?where=…&interests=…&duration=…&style=…#request`) that the
 * form reads once on load. Only the choices travel in the URL (no personal
 * data). Nothing is booked: the form is still sent as a request.
 *
 * Travel style has no field in the request API (Booking Request Contract 0.3),
 * so the form sends it as the first line of the notes (`requestNotes`).
 */

export const PLAN_AREAS: readonly AreaKey[] = ["osaka", "kyoto", "kobe", "nara", "other"];
export const PLAN_INTERESTS: readonly PrivateGuideActivity[] = [
  "food",
  "culture",
  "shopping",
  "famous_sights",
  "family_activities",
  "hidden_gems",
  "local_neighborhoods",
  "other",
];

/** Hours shown to the traveller; the form stores minutes ("240" / "360" / "480"). */
export const PLAN_DURATIONS = [
  { value: "4", label: "4 Hours", minutes: "240" },
  { value: "6", label: "6 Hours", minutes: "360" },
  { value: "8", label: "8 Hours", minutes: "480" },
] as const;

export const PLAN_STYLES = [
  { value: "solo", label: "Solo" },
  { value: "couple", label: "Couple" },
  { value: "friends", label: "Friends" },
  { value: "family", label: "Family" },
  { value: "group", label: "Group" },
] as const;

export type PlanDuration = (typeof PLAN_DURATIONS)[number]["value"];
export type PlanStyle = (typeof PLAN_STYLES)[number]["value"];

export type PrivateDayPlan = {
  areas: AreaKey[];
  interests: PrivateGuideActivity[];
  duration?: PlanDuration;
  style?: PlanStyle;
};

export const EMPTY_PLAN: PrivateDayPlan = { areas: [], interests: [] };

const pick = <T extends string>(allowed: readonly T[], raw: string | null): T[] =>
  raw ? allowed.filter((v) => raw.split(",").includes(v)) : [];

const one = <T extends string>(allowed: readonly T[], raw: string | null): T | undefined =>
  allowed.find((v) => v === raw);

/** `?where=osaka,kyoto&interests=food&duration=4&style=couple` (empty choices left out). */
export function planQuery(plan: PrivateDayPlan): string {
  const params = new URLSearchParams();
  if (plan.areas.length) params.set("where", plan.areas.join(","));
  if (plan.interests.length) params.set("interests", plan.interests.join(","));
  if (plan.duration) params.set("duration", plan.duration);
  if (plan.style) params.set("style", plan.style);
  const query = params.toString().replaceAll("%2C", ",");
  return query ? `?${query}` : "";
}

/** Reads a plan from a query string. Unknown values are ignored. */
export function readPlan(search: string): PrivateDayPlan {
  const params = new URLSearchParams(search);
  return {
    areas: pick(PLAN_AREAS, params.get("where")),
    interests: pick(PLAN_INTERESTS, params.get("interests")),
    duration: one(PLAN_DURATIONS.map((d) => d.value), params.get("duration")),
    style: one(PLAN_STYLES.map((s) => s.value), params.get("style")),
  };
}

export function hasPlan(plan: PrivateDayPlan): boolean {
  return plan.areas.length > 0 || plan.interests.length > 0 || plan.duration !== undefined || plan.style !== undefined;
}

export function durationMinutes(duration: PlanDuration): string {
  return PLAN_DURATIONS.find((d) => d.value === duration)?.minutes ?? "";
}

/** The message line that carries the travel style, e.g. "Travel style: Couple". */
export function travelStyleLine(style: PlanStyle): string {
  return `Travel style: ${PLAN_STYLES.find((s) => s.value === style)?.label ?? style}`;
}
