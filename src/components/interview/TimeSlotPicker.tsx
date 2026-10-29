"use client";

// Start times for one date (Japan time). Each interview lasts 30 minutes.

export function TimeSlotPicker({
  slots,
  selected,
  onSelect,
}: {
  slots: string[];
  selected: string | null;
  onSelect: (time: string) => void;
}) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Available times">
      {slots.map((time) => {
        const active = time === selected;
        return (
          <li key={time}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(time)}
              className={`w-full rounded-md border px-2 py-2 text-sm font-medium tabular-nums transition-colors ${
                active ? "border-navy bg-navy text-white" : "border-navy/20 bg-white hover:border-navy/50"
              }`}
            >
              {time}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
