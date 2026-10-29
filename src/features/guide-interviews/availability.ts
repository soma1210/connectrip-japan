// Interview slot calculation. Pure functions only: callers pass in the current
// time, the busy intervals from Google Calendar FreeBusy (times only, never
// event details) and the interviews already holding a slot.

import {
  BOOKABLE_WEEKDAYS,
  BOOKING_WINDOW_DAYS,
  BUFFER_AFTER_MINUTES,
  BUFFER_BEFORE_MINUTES,
  DAY_END,
  DAY_START,
  INTERVIEW_MINUTES,
  JST_OFFSET,
  JST_OFFSET_MS,
  MAX_INTERVIEWS_PER_DAY,
  MIN_GAP_BETWEEN_INTERVIEWS_MINUTES,
  MIN_LEAD_HOURS,
  MINUTE_MS,
  SLOT_STEP_MINUTES,
} from "./rules";

/** Half-open time interval [start, end). */
export interface Interval {
  start: Date;
  end: Date;
}

export interface AvailabilityInput {
  now: Date;
  /** Google Calendar busy intervals. */
  calendarBusy: Interval[];
  /** Interviews in PENDING_APPROVAL, APPROVING or CONFIRMED. */
  heldInterviews: Interval[];
}

export type SlotRejection =
  | "NOT_ALIGNED"
  | "WEEKEND"
  | "OUTSIDE_HOURS"
  | "TOO_SOON"
  | "TOO_FAR"
  | "DAY_FULL"
  | "CALENDAR_BUSY"
  | "INTERVIEW_CONFLICT";

export interface DaySlots {
  /** JST date, YYYY-MM-DD. */
  date: string;
  /** JST start times, HH:mm. */
  slots: string[];
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * MINUTE_MS);

const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

/** JST date (YYYY-MM-DD) of an instant. */
export function jstDate(instant: Date): string {
  return new Date(instant.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

/** JST wall-clock time (HH:mm) of an instant. */
export function jstTime(instant: Date): string {
  return new Date(instant.getTime() + JST_OFFSET_MS).toISOString().slice(11, 16);
}

/** The instant for a JST date and wall-clock time, or null when malformed. */
export function fromJst(date: string, time: string): Date | null {
  if (!DATE_PATTERN.test(date) || !TIME_PATTERN.test(time)) return null;
  const instant = new Date(`${date}T${time}:00${JST_OFFSET}`);
  if (Number.isNaN(instant.getTime())) return null;
  // Reject dates that roll over (e.g. 2026-02-30) or times like 24:00.
  return jstDate(instant) === date && jstTime(instant) === time ? instant : null;
}

/** 0 = Sunday … 6 = Saturday, for a JST date. */
function jstWeekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function addDays(date: string, days: number): string {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}

/** The interview interval for a start time. */
export function interviewInterval(start: Date): Interval {
  return { start, end: addMinutes(start, INTERVIEW_MINUTES) };
}

/**
 * Why a start time cannot be booked, or null when it can. The single source of
 * truth for the slot list, the request endpoint and the approval re-check.
 */
export function checkSlot(start: Date, input: AvailabilityInput): SlotRejection | null {
  const date = jstDate(start);
  const time = jstTime(start);

  if (start.getUTCSeconds() !== 0 || start.getUTCMilliseconds() !== 0) return "NOT_ALIGNED";
  const minuteOfDay = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  if (minuteOfDay % SLOT_STEP_MINUTES !== 0) return "NOT_ALIGNED";

  if (!BOOKABLE_WEEKDAYS.includes(jstWeekday(date))) return "WEEKEND";

  const interview = interviewInterval(start);
  const dayStart = fromJst(date, DAY_START)!;
  const dayEnd = fromJst(date, DAY_END)!;
  if (start < dayStart || addMinutes(interview.end, BUFFER_AFTER_MINUTES) > dayEnd) {
    return "OUTSIDE_HOURS";
  }

  if (start.getTime() < input.now.getTime() + MIN_LEAD_HOURS * 60 * MINUTE_MS) return "TOO_SOON";
  if (date > addDays(jstDate(input.now), BOOKING_WINDOW_DAYS - 1)) return "TOO_FAR";

  const sameDay = input.heldInterviews.filter((held) => jstDate(held.start) === date);
  if (sameDay.length >= MAX_INTERVIEWS_PER_DAY) return "DAY_FULL";

  return checkConflicts(interview, input);
}

function checkConflicts(interview: Interval, input: AvailabilityInput): "CALENDAR_BUSY" | "INTERVIEW_CONFLICT" | null {
  const withBuffers: Interval = {
    start: addMinutes(interview.start, -BUFFER_BEFORE_MINUTES),
    end: addMinutes(interview.end, BUFFER_AFTER_MINUTES),
  };
  if (input.calendarBusy.some((busy) => overlaps(withBuffers, busy))) return "CALENDAR_BUSY";

  // Same rule as the DB exclusion constraint: [start, end + gap) must not overlap.
  const gap = MIN_GAP_BETWEEN_INTERVIEWS_MINUTES;
  const padded = { start: interview.start, end: addMinutes(interview.end, gap) };
  if (
    input.heldInterviews.some((held) =>
      overlaps(padded, { start: held.start, end: addMinutes(held.end, gap) }),
    )
  ) {
    return "INTERVIEW_CONFLICT";
  }

  return null;
}

/**
 * The re-check right before an admin approves a requested interview. The
 * request-time rules (24 hours, window, daily limit) were checked when the
 * slot was held; here only what can have changed since matters: the calendar,
 * other interviews, and whether the time has passed. heldInterviews must not
 * include the interview being approved.
 */
export function checkApproval(
  start: Date,
  input: AvailabilityInput,
): "IN_PAST" | "CALENDAR_BUSY" | "INTERVIEW_CONFLICT" | null {
  if (start <= input.now) return "IN_PAST";
  return checkConflicts(interviewInterval(start), input);
}

/** End of the time an interview keeps from other interviews (guide_interviews.hold_end_at). */
export function holdEnd(start: Date): Date {
  return addMinutes(interviewInterval(start).end, MIN_GAP_BETWEEN_INTERVIEWS_MINUTES);
}

/** The first and last instants the booking window can touch, for the FreeBusy query. */
export function bookingWindow(now: Date): Interval {
  const today = jstDate(now);
  return {
    start: fromJst(today, "00:00")!,
    end: fromJst(addDays(today, BOOKING_WINDOW_DAYS), "00:00")!,
  };
}

/** Every bookable slot in the booking window, grouped by JST date. Days without slots are omitted. */
export function availableSlots(input: AvailabilityInput): DaySlots[] {
  const today = jstDate(input.now);
  const days: DaySlots[] = [];

  for (let offset = 0; offset < BOOKING_WINDOW_DAYS; offset++) {
    const date = addDays(today, offset);
    const dayEnd = fromJst(date, DAY_END)!;
    const slots: string[] = [];

    for (let start = fromJst(date, DAY_START)!; start < dayEnd; start = addMinutes(start, SLOT_STEP_MINUTES)) {
      if (checkSlot(start, input) === null) slots.push(jstTime(start));
    }
    if (slots.length > 0) days.push({ date, slots });
  }
  return days;
}
