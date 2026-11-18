/**
 * Ready-made tours that accept Booking Requests (2026-11-17).
 *
 * One entry per tour, shared by the API checks (rules.ts), the request form
 * (website-v1/booking/tourBookingRequest.ts), the staff email and the admin
 * view. Pure data: safe to import on the server and in the browser.
 *
 * A request is never a booking: it is stored as 'received' and an admin
 * confirms it by hand. Prices are never part of a request.
 *
 * To open another tour, add an entry here with `open: true` (and its own
 * start times, party size and languages). A tour id that is not listed, or is
 * listed with `open: false`, keeps the API answer `booking_closed`.
 */

export type TourLanguage = { code: string; label: string };

export type BookableTour = {
  /** Product id carried by the request (`experienceId`), `GP-…`. */
  experienceId: `GP-${string}`;
  /** Tour name shown in the form, the staff email and the admin view. */
  title: string;
  /** False = requests are refused with `booking_closed`. */
  open: boolean;
  /** `HH:mm`, Japan time. The form offers exactly these. */
  startTimes: readonly string[];
  durationMinutes: number;
  minGuests: number;
  maxGuests: number;
  /** Guide languages the guest can choose from. */
  languages: readonly TourLanguage[];
  /** Earliest request: the tour must start at least this many hours after the request. */
  leadHours: number;
  /** Latest date: this many calendar days after today (Japan). */
  maxDaysAhead: number;
};

/**
 * Osaka Like a Local (content/featuredTour.ts, Home "Featured Experience"):
 * 3-hour private walking tour in Tenma, 9:30 AM – 12:30 PM, 1–6 guests,
 * English. Lead time and window follow the Private Guide rules (48 h, 90 days).
 */
export const OSAKA_LIKE_A_LOCAL_ID = "GP-OSA-LIKE-A-LOCAL" as const;

export const BOOKABLE_TOURS: readonly BookableTour[] = [
  {
    experienceId: OSAKA_LIKE_A_LOCAL_ID,
    title: "Osaka Like a Local: Shrine Traditions & Unique Japanese Souvenirs",
    open: true,
    startTimes: ["09:30"],
    durationMinutes: 180,
    minGuests: 1,
    maxGuests: 6,
    languages: [{ code: "en", label: "English" }],
    leadHours: 48,
    maxDaysAhead: 90,
  },
];

export function bookableTour(experienceId: unknown): BookableTour | null {
  if (typeof experienceId !== "string") return null;
  return BOOKABLE_TOURS.find((t) => t.experienceId === experienceId) ?? null;
}

/** "09:30" → "9:30 AM". */
export function timeLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function languageLabel(tour: BookableTour | null, code: unknown): string | null {
  if (typeof code !== "string") return null;
  return tour?.languages.find((l) => l.code === code)?.label ?? code;
}
