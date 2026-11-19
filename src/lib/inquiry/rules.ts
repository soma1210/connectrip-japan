import { createHash } from "node:crypto";
import type { AreaKey, FieldErrors, InquiryFieldName, PrivateGuideActivity } from "@/contracts";

/**
 * Inquiry API wire format and server checks (2026-11-16). The fields are the
 * ones the Inquiry form already has (content/inquiry.ts); nothing is added.
 * The form leaves required / optional TBD, so the server decides: name and
 * email are required (a reply needs them), everything else is optional with
 * length limits. Price or booking data is not accepted here.
 */

export type InquiryRecord = {
  submissionId: string;
  kind: "private_guide";
  name: string;
  email: string;
  preferredDate: string | null;
  adults: number | null;
  children: number | null;
  destinations: AreaKey[];
  activities: PrivateGuideActivity[];
  placesToVisit: string | null;
  idealDay: string | null;
  notes: string | null;
};

export type InquirySuccess = { ok: true; accepted: true; inquiryRef: string; replayed: boolean };
export type InquiryHoneypot = { ok: true; accepted: false };
export type InquiryFailure =
  | { ok: false; kind: "validation"; fieldErrors: FieldErrors<InquiryFieldName> }
  | { ok: false; kind: "conflict" | "rate_limited" | "server" };
export type InquiryResponse = InquirySuccess | InquiryHoneypot | InquiryFailure;

export const INQUIRY_REF = /^CQ-\d{8}-[A-Z0-9]{6}$/;
export const HONEYPOT_FIELD = "website";
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@<>()",;:\\[\]]+@[^\s@<>()",;:\\[\]]+\.[^\s@<>()",;:\\[\]]{2,}$/;
const AREAS: readonly AreaKey[] = ["osaka", "kyoto", "kobe", "nara", "other"];
const ACTIVITIES: readonly PrivateGuideActivity[] = ["food", "local_neighborhoods", "culture", "famous_sights", "shopping", "family_activities", "hidden_gems", "other"];
const LIMITS = { name: 100, email: 254, text: 2000 };

export function inquiryHoneypotTripped(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const v = (raw as Record<string, unknown>)[HONEYPOT_FIELD];
  return typeof v === "string" && v.trim() !== "";
}

/** Control characters out (newlines and tabs kept in free text), trimmed. */
function clean(value: unknown, multiline: boolean): string | null {
  if (typeof value !== "string") return null;
  const stripped = value.replace(multiline ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g : /[\u0000-\u001f\u007f]/g, multiline ? "" : " ").trim();
  return stripped === "" ? null : stripped;
}

function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function count(value: unknown): number | null | "invalid" {
  if (value == null || value === "") return null;
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 50 ? value : "invalid";
}

export function validateInquiry(raw: unknown, idempotencyKey: string | null):
  | { ok: true; inquiry: InquiryRecord }
  | { ok: false; status: 400; body: InquiryFailure } {
  const errors: FieldErrors<InquiryFieldName> = {};
  const bad = (status: 400 = 400) => ({ ok: false as const, status, body: { ok: false as const, kind: "validation" as const, fieldErrors: errors } });
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return bad();
  const r = raw as Record<string, unknown>;

  const submissionId = typeof r.submissionId === "string" ? r.submissionId : "";
  if (!UUID_V4.test(submissionId) || (idempotencyKey !== null && idempotencyKey !== submissionId)) return bad();

  const name = clean(r.name, false);
  if (!name) errors.name = "required";
  else if (name.length > LIMITS.name) errors.name = "too_long";

  const email = clean(r.email, false);
  if (!email) errors.email = "required";
  else if (email.length > LIMITS.email || !EMAIL.test(email)) errors.email = "invalid_format";

  const preferredDate = clean(r.preferredDate, false);
  if (preferredDate && !isRealDate(preferredDate)) errors.preferredDate = "invalid_format";

  const adults = count((r.partySize as { adults?: unknown } | undefined)?.adults);
  if (adults === "invalid") errors.partySize = "out_of_range";
  const children = count((r.children as { count?: unknown } | undefined)?.count);
  if (children === "invalid") errors.children = "out_of_range";

  const list = <T extends string>(value: unknown, allowed: readonly T[], field: InquiryFieldName): T[] => {
    if (value == null) return [];
    if (!Array.isArray(value) || value.some((v) => !allowed.includes(v as T))) {
      errors[field] = "invalid_format";
      return [];
    }
    return [...new Set(value as T[])];
  };
  const destinations = list(r.destinations, AREAS, "destinations");
  const activities = list(r.activities, ACTIVITIES, "activities");

  const text = (field: "placesToVisit" | "idealDay" | "notes") => {
    const v = clean(r[field], true);
    if (v && v.length > LIMITS.text) errors[field] = "too_long";
    return v;
  };
  const placesToVisit = text("placesToVisit");
  const idealDay = text("idealDay");
  const notes = text("notes");

  if (Object.keys(errors).length > 0) return bad();
  return {
    ok: true,
    inquiry: {
      submissionId,
      kind: "private_guide",
      name: name!,
      email: email!,
      preferredDate,
      adults: adults as number | null,
      children: children as number | null,
      destinations,
      activities,
      placesToVisit,
      idealDay,
      notes,
    },
  };
}

/** SHA-256 over the normalized record in a fixed field order: the same id with different content is a conflict. */
export function inquiryBodyHash(i: InquiryRecord): string {
  const ordered = [i.submissionId, i.kind, i.name, i.email, i.preferredDate, i.adults, i.children, i.destinations, i.activities, i.placesToVisit, i.idealDay, i.notes];
  return createHash("sha256").update(JSON.stringify(ordered)).digest("hex");
}
