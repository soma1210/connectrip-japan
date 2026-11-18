import { createHash } from "node:crypto";
import type { AreaKey } from "@/contracts/experience";
import type {
  BookingRequest,
  BookingRequestFailure,
  BookingRequestFieldErrors,
  BookingRequestLocale,
  BookingRequestUnavailableReason,
  PrivateGuideBookingRequest,
  PrivateGuideDurationMinutes,
  ReadyMadeBookingRequest,
} from "@/contracts/bookingRequest";
import type { PrivateGuideActivity } from "@/contracts/inquiry";
import { bookableTour } from "./tours";

/**
 * Normative Private Guide checks for Contract 0.3 / Booking Rules V1.1.
 * Next.js and Apps Script both apply these rules. The browser clock is not an input.
 */

export const LEAD_MS = 48 * 60 * 60 * 1000;
export const MAX_CALENDAR_DAYS = 90;
export const CLOSE_MINUTES = 20 * 60;
export const MAX_PARTY = 6;

/** 08:00 through 17:00, every 30 minutes. Nineteen candidates. */
export const PRIVATE_GUIDE_START_TIMES = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
] as const;

export const PRIVATE_GUIDE_DURATIONS = [240, 360, 480] as const;

const LOCALES = ["ja", "en", "zh-TW", "ko"] as const;
const AREAS: readonly AreaKey[] = ["osaka", "kyoto", "kobe", "nara", "other"];
const INTERESTS: readonly PrivateGuideActivity[] = [
  "food",
  "local_neighborhoods",
  "culture",
  "famous_sights",
  "shopping",
  "family_activities",
  "hidden_gems",
  "other",
];
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[0-9 ()-]{6,30}$/;
const MONEY_KEYS = ["amount", "price", "currency"] as const;

export type ValidationResult =
  | { ok: true; booking: BookingRequest }
  | { ok: false; status: 400 | 422; body: BookingRequestFailure };

/**
 * Honeypot. A filled or non-text value stores nothing and must not receive a booking reference.
 * The route answers `{ ok: true, accepted: false }`.
 */
export function honeypotTripped(raw: unknown): boolean {
  if (!isRecord(raw) || raw.website == null) return false;
  if (typeof raw.website !== "string") return true;
  return raw.website.trim() !== "";
}

export function tokyoDate(now: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
}

/** Calendar addition in proleptic Gregorian dates. Japan has no daylight-saving shift. */
export function addCalendarDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utc.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function tokyoInstant(date: string, time: string): number {
  return Date.parse(`${date}T${time}:00+09:00`);
}

/** End minute-of-day. Greater than 20:00 is past the same-day close. Exactly 20:00 is allowed. */
export function endMinute(startTime: string, durationMinutes: number): number {
  const [hour, minute] = startTime.split(":").map(Number);
  return hour * 60 + minute + durationMinutes;
}

export function bookingBodyHash(booking: BookingRequest): string {
  if (booking.productType === "ready_made") {
    const tour = {
      adults: booking.adults,
      children: booking.children,
      consent: booking.consent,
      country: booking.country,
      date: booking.date,
      durationMinutes: booking.durationMinutes,
      email: booking.email,
      experienceId: booking.experienceId,
      language: booking.language,
      locale: booking.locale,
      name: booking.name,
      notes: booking.notes,
      phone: booking.phone,
      planId: booking.planId,
      productType: booking.productType,
      startTime: booking.startTime,
    };
    return createHash("sha256").update(JSON.stringify(tour)).digest("hex");
  }
  // Private Guide: unchanged field set, so hashes of stored requests stay valid.
  const payload = {
    adults: booking.adults,
    alternateDate: booking.alternateDate,
    alternateStartTime: booking.alternateStartTime,
    areas: booking.areas,
    children: booking.children,
    consent: booking.consent,
    country: booking.country,
    date: booking.date,
    durationMinutes: booking.durationMinutes,
    email: booking.email,
    experienceId: booking.experienceId,
    interests: booking.interests,
    locale: booking.locale,
    name: booking.name,
    notes: booking.notes,
    phone: booking.phone,
    planId: booking.planId,
    productType: booking.productType,
    startTime: booking.startTime,
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function validateBookingRequest(
  raw: unknown,
  now: number,
  idempotencyKey: string | null,
): ValidationResult {
  if (!isRecord(raw)) return invalid({ submissionId: "invalid_format" });

  const money = moneyError(raw);
  if (money) return invalid(money);

  const submissionId = readUuid(raw.submissionId);
  const key = idempotencyKey?.trim().toLowerCase() ?? "";
  if (!submissionId || !key) return invalid({ submissionId: "required" });
  if (submissionId !== key || !UUID_V4.test(key)) return invalid({ submissionId: "invalid_format" });

  const productType = raw.productType;
  if (productType !== "private_guide" && productType !== "ready_made") {
    return invalid({ productType: raw.productType == null ? "required" : "invalid_format" });
  }

  const contact = readContact(raw);
  if (!contact.ok) return contact.result;

  if (productType === "ready_made") return validateReadyMade(raw, contact.value, submissionId, now);

  return validatePrivateGuide(raw, contact.value, submissionId, now);
}

function validatePrivateGuide(
  raw: Record<string, unknown>,
  contact: Contact,
  submissionId: string,
  now: number,
): ValidationResult {
  const errors: BookingRequestFieldErrors = {};
  if (present(raw.experienceId)) errors.experienceId = "invalid_format";
  if (present(raw.planId)) errors.planId = "invalid_format";
  const locale = readLocale(raw.locale);
  if (!locale) errors.locale = raw.locale == null ? "required" : "invalid_format";

  const date = readDate(raw.date);
  if (!date) errors.date = raw.date == null || raw.date === "" ? "required" : "invalid_format";
  const startTime = readStartTime(raw.startTime);
  if (!startTime) errors.startTime = raw.startTime == null || raw.startTime === "" ? "required" : "invalid_format";
  const duration = readDuration(raw.durationMinutes);
  if (!duration) {
    errors.durationMinutes = raw.durationMinutes == null ? "required" : "invalid_format";
  }

  const alternate = readAlternate(raw);
  if (!alternate.ok) Object.assign(errors, alternate.errors);

  const party = readParty(raw, true);
  if (!party.ok) Object.assign(errors, party.errors);

  const areas = readEnumList(raw.areas, AREAS);
  if (!areas.ok) errors.areas = areas.code;
  const interests = readEnumList(raw.interests, INTERESTS);
  if (!interests.ok) errors.interests = interests.code;

  if (Object.keys(errors).length > 0 || !locale || !date || !startTime || !duration || !alternate.ok || !party.ok || !areas.ok || !interests.ok) {
    return invalid(errors);
  }

  const slotError = checkSlot(date, startTime, duration, now, "date", "startTime");
  if (slotError) return slotError;

  if (alternate.value) {
    const altError = checkSlot(
      alternate.value.date,
      alternate.value.time,
      duration,
      now,
      "alternateDate",
      "alternateStartTime",
    );
    if (altError) return altError;
    if (alternate.value.date === date && alternate.value.time === startTime) {
      return unavailable("same_choice", { alternateStartTime: "invalid_format" });
    }
  }

  const booking: PrivateGuideBookingRequest = {
    submissionId,
    locale,
    productType: "private_guide",
    experienceId: null,
    planId: null,
    date,
    startTime,
    durationMinutes: duration,
    alternateDate: alternate.value?.date ?? null,
    alternateStartTime: alternate.value?.time ?? null,
    adults: party.value.adults,
    children: party.value.children,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    country: contact.country,
    areas: areas.value,
    interests: interests.value,
    notes: contact.notes,
    consent: true,
  };
  return { ok: true, booking };
}

/**
 * Ready-made uses each product's own window, start list and party size
 * (src/lib/booking-request/tours.ts). A well-formed request for a tour that is
 * not listed, or not open, is `booking_closed`.
 */
function validateReadyMade(
  raw: Record<string, unknown>,
  contact: Contact,
  submissionId: string,
  now: number,
): ValidationResult {
  const errors: BookingRequestFieldErrors = {};
  const experienceId = typeof raw.experienceId === "string" ? raw.experienceId.trim() : "";
  if (!experienceId) errors.experienceId = "required";
  else if (!/^GP-[A-Za-z0-9][A-Za-z0-9-]*$/.test(experienceId)) errors.experienceId = "invalid_format";
  if (present(raw.alternateDate) || present(raw.alternateStartTime)) errors.alternateDate = "invalid_format";
  if (raw.date != null && raw.date !== "" && !readDate(raw.date)) errors.date = "invalid_format";
  if (raw.startTime != null && raw.startTime !== "" && !/^\d{2}:\d{2}$/.test(String(raw.startTime))) {
    errors.startTime = "invalid_format";
  }
  const party = readParty(raw, false);
  if (!party.ok) Object.assign(errors, party.errors);
  const locale = readLocale(raw.locale);
  if (!locale) errors.locale = raw.locale == null ? "required" : "invalid_format";
  if (Object.keys(errors).length > 0 || !party.ok || !locale) return invalid(errors);

  const tour = bookableTour(experienceId);
  if (!tour || !tour.open) return unavailable("booking_closed");

  // An open tour: its own start list, party size, languages and window.
  const date = readDate(raw.date);
  if (!date) errors.date = raw.date == null || raw.date === "" ? "required" : "invalid_format";
  const startTime = typeof raw.startTime === "string" && tour.startTimes.includes(raw.startTime) ? raw.startTime : null;
  if (!startTime) errors.startTime = raw.startTime == null || raw.startTime === "" ? "required" : "invalid_format";
  const language = typeof raw.language === "string" && tour.languages.some((l) => l.code === raw.language) ? raw.language : null;
  if (!language) errors.language = raw.language == null || raw.language === "" ? "required" : "invalid_format";
  const guests = party.value.adults + party.value.children;
  if (guests < tour.minGuests || guests > tour.maxGuests) errors.adults = "out_of_range";
  if (Object.keys(errors).length > 0 || !date || !startTime || !language) return invalid(errors);

  const receipt = tokyoDate(now);
  if (date < receipt) return unavailable("too_soon", { date: "out_of_range" });
  if (date > addCalendarDays(receipt, tour.maxDaysAhead)) return unavailable("too_far", { date: "out_of_range" });
  const start = tokyoInstant(date, startTime);
  if (!Number.isFinite(start) || start < now + tour.leadHours * 60 * 60 * 1000) {
    return unavailable("too_soon", { date: "out_of_range" });
  }

  const booking: ReadyMadeBookingRequest = {
    submissionId,
    locale,
    productType: "ready_made",
    experienceId: tour.experienceId,
    planId: null,
    date,
    startTime,
    durationMinutes: tour.durationMinutes,
    adults: party.value.adults,
    children: party.value.children,
    language,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    country: contact.country,
    notes: contact.notes,
    consent: true,
  };
  return { ok: true, booking };
}

function checkSlot(
  date: string,
  startTime: string,
  duration: PrivateGuideDurationMinutes,
  now: number,
  dateField: "date" | "alternateDate",
  timeField: "startTime" | "alternateStartTime",
): ValidationResult | null {
  if (endMinute(startTime, duration) > CLOSE_MINUTES) {
    return unavailable("ends_after_close", { [timeField]: "out_of_range" });
  }
  const receipt = tokyoDate(now);
  const latest = addCalendarDays(receipt, MAX_CALENDAR_DAYS);
  if (date < receipt) return unavailable("too_soon", { [dateField]: "out_of_range" });
  if (date > latest) return unavailable("too_far", { [dateField]: "out_of_range" });
  const start = tokyoInstant(date, startTime);
  if (!Number.isFinite(start) || start < now + LEAD_MS) {
    return unavailable("too_soon", { [timeField]: "out_of_range" });
  }
  return null;
}

type Contact = { name: string; email: string; phone: string | null; country: string | null; notes: string | null };

function readContact(
  raw: Record<string, unknown>,
): { ok: true; value: Contact } | { ok: false; result: ValidationResult } {
  const errors: BookingRequestFieldErrors = {};
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name) errors.name = raw.name == null ? "required" : "invalid_format";
  else if (name.length > 100) errors.name = "too_long";

  const emailRaw = typeof raw.email === "string" ? raw.email.trim() : "";
  if (!emailRaw) errors.email = raw.email == null ? "required" : "invalid_format";
  else if (emailRaw.length > 254 || !EMAIL.test(emailRaw)) errors.email = "invalid_format";

  let phone: string | null = null;
  if (present(raw.phone)) {
    if (typeof raw.phone !== "string") errors.phone = "invalid_format";
    else {
      const value = raw.phone.trim();
      if (value.length > 30 || !PHONE.test(value)) errors.phone = "invalid_format";
      else phone = value;
    }
  }

  let country: string | null = null;
  if (present(raw.country)) {
    if (typeof raw.country !== "string") errors.country = "invalid_format";
    else {
      const value = raw.country.trim();
      if (value.length > 60) errors.country = "too_long";
      else country = value;
    }
  }

  let notes: string | null = null;
  if (present(raw.notes)) {
    if (typeof raw.notes !== "string") errors.notes = "invalid_format";
    else if (raw.notes.length > 2000) errors.notes = "too_long";
    else notes = raw.notes.trim() || null;
  }

  if (raw.consent !== true) errors.consent = "required";

  if (Object.keys(errors).length > 0 || !name || !emailRaw || errors.email || errors.phone || errors.country || errors.notes) {
    return { ok: false, result: invalid(errors) };
  }
  return { ok: true, value: { name, email: emailRaw.toLowerCase(), phone, country, notes } };
}

function readParty(
  raw: Record<string, unknown>,
  capPrivateGuide: boolean,
): { ok: true; value: { adults: number; children: number } } | { ok: false; errors: BookingRequestFieldErrors } {
  const errors: BookingRequestFieldErrors = {};
  const adults = readInt(raw.adults);
  if (adults == null) errors.adults = raw.adults == null ? "required" : "invalid_format";
  else if (adults < 1) errors.adults = "out_of_range";

  const children = raw.children == null || raw.children === "" ? 0 : readInt(raw.children);
  if (children == null) errors.children = "invalid_format";
  else if (children < 0) errors.children = "out_of_range";

  if (adults != null && children != null && adults >= 1 && children >= 0 && capPrivateGuide && adults + children > MAX_PARTY) {
    errors.adults = "out_of_range";
    errors.children = "out_of_range";
  }
  if (Object.keys(errors).length > 0 || adults == null || children == null) return { ok: false, errors };
  return { ok: true, value: { adults, children } };
}

function readAlternate(
  raw: Record<string, unknown>,
):
  | { ok: true; value: { date: string; time: string } | null }
  | { ok: false; errors: BookingRequestFieldErrors } {
  const hasDate = present(raw.alternateDate);
  const hasTime = present(raw.alternateStartTime);
  if (!hasDate && !hasTime) return { ok: true, value: null };
  const errors: BookingRequestFieldErrors = {};
  const date = hasDate ? readDate(raw.alternateDate) : null;
  const time = hasTime ? readStartTime(raw.alternateStartTime) : null;
  if (!hasDate || !date) errors.alternateDate = hasDate ? "invalid_format" : "required";
  if (!hasTime || !time) errors.alternateStartTime = hasTime ? "invalid_format" : "required";
  if (Object.keys(errors).length > 0 || !date || !time) return { ok: false, errors };
  return { ok: true, value: { date, time } };
}

function readLocale(value: unknown): BookingRequestLocale | null {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value) ? (value as BookingRequestLocale) : null;
}

function readDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) return null;
  return value;
}

function readStartTime(value: unknown): string | null {
  return typeof value === "string" && (PRIVATE_GUIDE_START_TIMES as readonly string[]).includes(value) ? value : null;
}

function readDuration(value: unknown): PrivateGuideDurationMinutes | null {
  return typeof value === "number" && (PRIVATE_GUIDE_DURATIONS as readonly number[]).includes(value)
    ? (value as PrivateGuideDurationMinutes)
    : null;
}

function readUuid(value: unknown): string | null {
  if (typeof value !== "string" || !UUID_V4.test(value.trim())) return null;
  return value.trim().toLowerCase();
}

function readInt(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function readEnumList<T extends string>(
  value: unknown,
  allowed: readonly T[],
): { ok: true; value: T[] } | { ok: false; code: "invalid_format" } {
  if (value == null) return { ok: true, value: [] };
  if (!Array.isArray(value)) return { ok: false, code: "invalid_format" };
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !allowed.includes(item as T) || seen.has(item)) return { ok: false, code: "invalid_format" };
    seen.add(item);
    result.push(item as T);
  }
  return { ok: true, value: result };
}

function present(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  return true;
}

function moneyError(raw: Record<string, unknown>): BookingRequestFieldErrors | null {
  const errors: BookingRequestFieldErrors = {};
  for (const key of MONEY_KEYS) {
    if (key in raw && raw[key] != null) errors[key] = "invalid_format";
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

function invalid(fieldErrors: BookingRequestFieldErrors): ValidationResult {
  const body: BookingRequestFailure = { ok: false, kind: "validation", fieldErrors };
  return { ok: false, status: 400, body };
}

function unavailable(
  reason: BookingRequestUnavailableReason,
  fieldErrors?: BookingRequestFieldErrors,
): ValidationResult {
  const body: BookingRequestFailure = fieldErrors
    ? { ok: false, kind: "unavailable", reason, fieldErrors }
    : { ok: false, kind: "unavailable", reason };
  return { ok: false, status: 422, body };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
