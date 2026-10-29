"use client";

// Date picker: only dates that still have free slots are listed.

import type { DaySlots } from "@/features/guide-interviews/availability";

const label = (date: string) => {
  const day = new Date(`${date}T00:00:00Z`);
  return {
    weekday: new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(day),
    monthDay: new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(day),
  };
};

export function BookingCalendar({
  days,
  selected,
  onSelect,
}: {
  days: DaySlots[];
  selected: string | null;
  onSelect: (date: string) => void;
}) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5" aria-label="Available dates">
      {days.map((day) => {
        const { weekday, monthDay } = label(day.date);
        const active = day.date === selected;
        return (
          <li key={day.date}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(day.date)}
              className={`flex w-full flex-col items-center rounded-md border px-2 py-2.5 text-sm transition-colors ${
                active ? "border-navy bg-navy text-white" : "border-navy/20 bg-white hover:border-navy/50"
              }`}
            >
              <span className={`text-xs ${active ? "text-white/70" : "text-navy/55"}`}>{weekday}</span>
              <span className="font-semibold">{monthDay}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
