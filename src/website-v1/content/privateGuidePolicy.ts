/**
 * Private Guide v1 product conditions — HUMAN_DECISION (2026-10-25),
 * Website v1 Working Baseline. NOT final legal Terms & Conditions.
 *
 * One place for the plans, group pricing, service hours, booking cutoff,
 * cancellation / weather summary and included items, used by the Private
 * Guide page and the booking prototype. Website-only for now: the shared
 * contracts, DB, API, payment and real availability come later.
 * Do not add pricing, fees, rules or states that are not listed here.
 */
export const PRIVATE_GUIDE_V1_SOURCE = "HUMAN_DECISION 2026-10-25: Private Guide v1 (Website v1 Working Baseline, not final legal Terms)";

export type PrivateGuideV1Plan = {
  id: string;
  hours: 4 | 6 | 8;
  /** Price for the whole private group (1–4 guests), JPY. */
  price: number;
  tagline?: string;
  /** Approximate number of spots in the day. */
  spots: string;
  popular?: boolean;
};

export const PRIVATE_GUIDE_V1 = {
  positioning: "Book the time. Build the day together.",
  plans: [
    { id: "pg-4h", hours: 4, price: 44800, tagline: "Half Day", spots: "approx. 2–3 spots" },
    { id: "pg-6h", hours: 6, price: 59800, spots: "approx. 3–4 spots", popular: true },
    { id: "pg-8h", hours: 8, price: 74800, tagline: "Full Day", spots: "approx. 4–6 spots" },
  ] satisfies PrivateGuideV1Plan[],
  /**
   * Group size and child pricing (HUMAN_DECISION 2026-10-25, child pricing).
   * Adults (13+) and children (6–12) are paying guests; young children (0–5)
   * join free and never count as paying guests, but do count as participants.
   */
  group: {
    /** Paying guests covered by the plan price. */
    includedGuests: 4,
    /** Per additional adult beyond `includedGuests`, JPY. */
    extraGuestFee: 7500,
    /** Per additional child (6–12) beyond `includedGuests`, JPY. */
    extraChildFee: 3750,
    /** Largest group that can book online, in total participants (young children included); 7+ is a group request. */
    maxOnlineGuests: 6,
  },
  ageGroups: {
    adults: "Adults (13+)",
    children: "Children (6–12)",
    youngChildren: "Young Children (0–5)",
  },
  hours: {
    /** The guide day must start and end inside this window (Japan time). */
    windowStart: "08:00",
    windowEnd: "20:00",
    startIntervalMinutes: 60,
  },
  cutoff: {
    /** More than this many hours before the start: normal online booking. */
    onlineBookingHours: 48,
    /** From this many hours up to `onlineBookingHours`: Request Availability. Below: contact only. */
    requestHours: 24,
  },
  /** Customer cancellation. The fee applies only after planning has actually started. */
  cancellation: [
    { when: "7+ days before, planning not started", refund: "100% refund" },
    { when: "7+ days before, planning started", refund: "90% refund (10% Planning & Coordination Fee)" },
    { when: "48 hours to 7 days before", refund: "50% refund" },
    { when: "Within 48 hours", refund: "No refund" },
    { when: "No-show", refund: "No refund" },
    { when: "If Connectrip can’t provide the confirmed service", refund: "100% refund" },
  ],
  cancellationNote: "The 10% Planning & Coordination Fee applies only once planning work on your day has started.",
  weather: [
    "Rain: the day usually goes ahead, and we adjust the route where needed.",
    "Severe weather, official warnings, major transport disruption or a natural disaster that makes the day unsafe: we offer a new date or a 100% refund.",
  ],
  included: ["Private guide service", "Pre-trip communication", "Custom day planning", "Itinerary coordination"],
  notIncluded: ["Your transportation", "Food and drinks", "Admission fees", "Personal expenses", "Other separately booked services"],
} as const;

export function v1Plan(id: string): PrivateGuideV1Plan | undefined {
  return PRIVATE_GUIDE_V1.plans.find((p) => p.id === id);
}
