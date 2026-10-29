import { describe, expect, test } from "bun:test";
import {
  availableSlots,
  bookingWindow,
  checkApproval,
  checkSlot,
  holdEnd,
  fromJst,
  interviewInterval,
  type AvailabilityInput,
  type Interval,
} from "./availability";

// Friday 2026-10-30 09:00 JST. Monday 2026-11-02 is the first full bookable day;
// Tuesday 2026-11-03 is a public holiday (Culture Day).
const NOW = fromJst("2026-10-30", "09:00")!;
const MONDAY = "2026-11-02";

const at = (date: string, time: string) => fromJst(date, time)!;
const span = (date: string, from: string, to: string): Interval => ({ start: at(date, from), end: at(date, to) });
const held = (date: string, time: string) => interviewInterval(at(date, time));

function input(overrides: Partial<AvailabilityInput> = {}): AvailabilityInput {
  return { now: NOW, calendarBusy: [], heldInterviews: [], ...overrides };
}

function slotsOn(date: string, overrides: Partial<AvailabilityInput> = {}) {
  return availableSlots(input(overrides)).find((day) => day.date === date)?.slots ?? [];
}

describe("fromJst", () => {
  test("converts JST wall clock to the right instant", () => {
    expect(at(MONDAY, "10:00").toISOString()).toBe("2026-11-02T01:00:00.000Z");
  });

  test("rejects malformed or rolled-over values", () => {
    expect(fromJst("2026-02-30", "10:00")).toBeNull();
    expect(fromJst(MONDAY, "24:00")).toBeNull();
    expect(fromJst("2026/11/02", "10:00")).toBeNull();
    expect(fromJst(MONDAY, "10:00; DROP")).toBeNull();
  });
});

describe("day bounds", () => {
  test("an empty weekday offers 10:00 through 20:15 in 15-minute steps", () => {
    const slots = slotsOn(MONDAY);
    expect(slots[0]).toBe("10:00");
    expect(slots.at(-1)).toBe("20:15");
    expect(slots).toHaveLength(42);
  });

  test("20:15 is the last start; 20:30 would end its buffer after 21:00", () => {
    expect(checkSlot(at(MONDAY, "20:15"), input())).toBeNull();
    expect(checkSlot(at(MONDAY, "20:30"), input())).toBe("OUTSIDE_HOURS");
  });

  test("nothing before 10:00", () => {
    expect(checkSlot(at(MONDAY, "09:45"), input())).toBe("OUTSIDE_HOURS");
  });

  test("starts must sit on the 15-minute grid", () => {
    expect(checkSlot(at(MONDAY, "10:05"), input())).toBe("NOT_ALIGNED");
    expect(checkSlot(new Date(at(MONDAY, "10:00").getTime() + 1000), input())).toBe("NOT_ALIGNED");
  });
});

describe("weekdays", () => {
  test("Saturday and Sunday are never bookable", () => {
    expect(checkSlot(at("2026-11-07", "10:00"), input())).toBe("WEEKEND");
    expect(checkSlot(at("2026-11-08", "14:00"), input())).toBe("WEEKEND");
    const dates = availableSlots(input()).map((day) => day.date);
    expect(dates).not.toContain("2026-11-07");
    expect(dates).not.toContain("2026-11-08");
  });

  test("a weekday public holiday is bookable", () => {
    expect(checkSlot(at("2026-11-03", "10:00"), input())).toBeNull();
  });
});

describe("24-hour lead time", () => {
  test("exactly 24 hours ahead is allowed, one slot earlier is not", () => {
    const now = at("2026-11-02", "14:00");
    expect(checkSlot(at("2026-11-03", "14:00"), input({ now }))).toBeNull();
    expect(checkSlot(at("2026-11-03", "13:45"), input({ now }))).toBe("TOO_SOON");
  });

  test("today and the next morning are hidden", () => {
    const now = at("2026-11-02", "14:00");
    const days = availableSlots(input({ now }));
    expect(days[0].date).toBe("2026-11-03");
    expect(days[0].slots[0]).toBe("14:00");
  });
});

describe("booking window", () => {
  test("covers 14 calendar days starting today", () => {
    const dates = availableSlots(input()).map((day) => day.date);
    expect(dates[0]).toBe(MONDAY);
    expect(dates.at(-1)).toBe("2026-11-12");
    expect(checkSlot(at("2026-11-13", "10:00"), input())).toBe("TOO_FAR");
  });

  test("the FreeBusy query spans the whole window", () => {
    const window = bookingWindow(NOW);
    expect(window.start.toISOString()).toBe(at("2026-10-30", "00:00").toISOString());
    expect(window.end.toISOString()).toBe(at("2026-11-13", "00:00").toISOString());
  });
});

describe("Google Calendar busy time", () => {
  // The example from the brief: busy 12:00–14:00.
  const calendarBusy = [span(MONDAY, "12:00", "14:00")];

  test("blocks the busy time and both buffers", () => {
    const slots = slotsOn(MONDAY, { calendarBusy });
    // 11:15–11:45 + after-buffer ends 12:00: allowed. 11:30 would overlap.
    expect(slots).toContain("11:15");
    expect(slots).not.toContain("11:30");
    expect(slots).not.toContain("13:45");
    // 14:15 has its before-buffer 14:00–14:15: allowed.
    expect(slots).not.toContain("14:00");
    expect(slots).toContain("14:15");
  });

  test("a busy block ending at 09:45 still allows 10:00 (buffer touches, no overlap)", () => {
    expect(checkSlot(at(MONDAY, "10:00"), input({ calendarBusy: [span(MONDAY, "09:00", "09:45")] }))).toBeNull();
  });

  test("a busy block ending at 09:50 blocks 10:00 through its before-buffer", () => {
    expect(checkSlot(at(MONDAY, "10:00"), input({ calendarBusy: [span(MONDAY, "09:00", "09:50")] }))).toBe(
      "CALENDAR_BUSY",
    );
  });

  test("an all-day busy block closes the day", () => {
    const allDay = [span(MONDAY, "00:00", "23:59")];
    expect(slotsOn(MONDAY, { calendarBusy: allDay })).toEqual([]);
  });
});

describe("other interviews", () => {
  const heldInterviews = [held(MONDAY, "14:00")];

  test("need at least 15 minutes between interviews", () => {
    const slots = slotsOn(MONDAY, { heldInterviews });
    expect(slots).toContain("13:15"); // ends 13:45, 15 min gap
    expect(slots).not.toContain("13:30");
    expect(slots).not.toContain("14:00");
    expect(slots).not.toContain("14:30");
    expect(slots).toContain("14:45"); // starts 15 min after 14:30
  });

  test("the exact held slot reports a conflict", () => {
    expect(checkSlot(at(MONDAY, "14:00"), input({ heldInterviews }))).toBe("INTERVIEW_CONFLICT");
  });
});

describe("daily limit", () => {
  const five = ["10:00", "11:00", "12:00", "13:00", "14:00"].map((time) => held(MONDAY, time));

  test("five held interviews close the day", () => {
    expect(slotsOn(MONDAY, { heldInterviews: five })).toEqual([]);
    expect(checkSlot(at(MONDAY, "18:00"), input({ heldInterviews: five }))).toBe("DAY_FULL");
  });

  test("four leave the rest of the day open", () => {
    expect(slotsOn(MONDAY, { heldInterviews: five.slice(0, 4) })).toContain("18:00");
  });

  test("interviews on other days do not count", () => {
    const otherDay = ["10:00", "11:00", "12:00", "13:00", "14:00"].map((time) => held("2026-11-04", time));
    expect(slotsOn(MONDAY, { heldInterviews: otherDay })).toHaveLength(42);
  });
});

describe("approval re-check", () => {
  const start = at(MONDAY, "14:00");

  test("still free: approve, even inside 24 hours", () => {
    expect(checkApproval(start, input({ now: at(MONDAY, "09:00") }))).toBeNull();
  });

  test("a calendar event added after the request blocks approval", () => {
    expect(checkApproval(start, input({ calendarBusy: [span(MONDAY, "14:30", "15:00")] }))).toBe("CALENDAR_BUSY");
  });

  test("another held interview blocks approval", () => {
    expect(checkApproval(start, input({ heldInterviews: [held(MONDAY, "14:30")] }))).toBe("INTERVIEW_CONFLICT");
  });

  test("a past interview cannot be approved", () => {
    expect(checkApproval(start, input({ now: at(MONDAY, "14:00") }))).toBe("IN_PAST");
  });

  test("hold end is interview end plus the 15-minute gap", () => {
    expect(holdEnd(start).toISOString()).toBe(at(MONDAY, "14:45").toISOString());
  });
});

describe("privacy", () => {
  test("the slot list holds only dates and start times", () => {
    const days = availableSlots(input({ calendarBusy: [span(MONDAY, "12:00", "14:00")] }));
    for (const day of days) {
      expect(Object.keys(day).sort()).toEqual(["date", "slots"]);
      for (const slot of day.slots) expect(slot).toMatch(/^\d{2}:\d{2}$/);
    }
  });
});
