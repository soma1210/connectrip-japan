import type { PrivateGuideAvailability, PrivateGuideBookingModel, PrivateGuidePlan } from "@/contracts";
import { routeHref } from "../routes";
import { addDays, jstToday } from "./guides/freshness";
import { cta, proposed, tbd } from "./shared";

/**
 * Private Guide slot booking (W1-D16): prototype data for the UI review.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ DEMO / PROTOTYPE DATA — NOT A PRODUCT DECISION                       │
 * │ Plans (4 h / 8 h), prices, start times, selling window, lead time    │
 * │ and every unavailable date or time below are invented for the UI.    │
 * │ Book Now never creates a booking or opens a payment (`prototype`).   │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const DEMO_SOURCE = "DEMO / PROTOTYPE product data (not a Human Decision)";
const FLOW_SOURCE = "Private Guide slot booking flow (W1-D16)";

const DEMO_PLANS: PrivateGuidePlan[] = [
  {
    id: "demo-private-guide-4h",
    name: proposed("4-Hour Private Guide", DEMO_SOURCE),
    summary: proposed("A half day with a local guide. Plan it together after booking.", DEMO_SOURCE),
    durationMinutes: 240,
    pricing: proposed({ kind: "per_group", amount: { amount: 30000, currency: "JPY" } }, DEMO_SOURCE),
    demo: true,
  },
  {
    id: "demo-private-guide-8h",
    name: proposed("8-Hour Private Guide", DEMO_SOURCE),
    summary: proposed("A full day with a local guide. Plan it together after booking.", DEMO_SOURCE),
    durationMinutes: 480,
    pricing: proposed({ kind: "per_group", amount: { amount: 55000, currency: "JPY" } }, DEMO_SOURCE),
    demo: true,
  },
];

/** Mock start times every 30 minutes, 08:00–15:00 (UI review only). */
const MOCK_START_TIMES = Array.from({ length: 15 }, (_, i) => {
  const minutes = 8 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${minutes % 60 === 0 ? "00" : "30"}`;
});

/** Repeating patterns so every UI state (closed day, partly blocked day) can be reviewed. */
const MOCK_BLOCKED_PATTERNS: { from: string; to: string }[][] = [
  [],
  [{ from: "12:00", to: "13:30" }],
  [
    { from: "09:00", to: "10:00" },
    { from: "15:00", to: "16:30" },
  ],
  [{ from: "13:00", to: "15:00" }],
];

/**
 * Mock availability for the next 10 weeks: no same-day or next-day slots,
 * every 9th day closed, partly blocked days in rotation. Generated from
 * today's Japan date so the prototype never shows only past dates.
 */
function mockAvailability(now: Date): PrivateGuideAvailability {
  const today = jstToday(now);
  const dates: string[] = [];
  const blocked: PrivateGuideAvailability["blocked"] = {};
  for (let i = 2; i < 72; i++) {
    if (i % 9 === 4) continue;
    const date = addDays(today, i);
    dates.push(date);
    const pattern = MOCK_BLOCKED_PATTERNS[i % MOCK_BLOCKED_PATTERNS.length];
    if (pattern.length > 0) blocked[date] = pattern;
  }
  return { source: "mock", dates, startTimes: MOCK_START_TIMES, windowStart: "08:00", windowEnd: "19:00", blocked };
}

export function getPrivateGuideBookingModel(now: Date = new Date()): PrivateGuideBookingModel {
  return {
    mode: "prototype",
    plans: DEMO_PLANS,
    availability: mockAvailability(now),
    steps: [
      proposed("Book your time slot and pay online", FLOW_SOURCE),
      proposed("Connectrip confirms your booking", FLOW_SOURCE),
      proposed("We plan your day together", FLOW_SOURCE),
      proposed("Explore with your local guide", FLOW_SOURCE),
    ],
    cancellationNote: tbd("Cancellation policy for Private Guide bookings TBD"),
    bookLabel: proposed("Book Now", FLOW_SOURCE),
    questions: {
      prompt: proposed("Have questions before booking?", FLOW_SOURCE),
      cta: cta("v1_private_booking_questions", "inquiry", routeHref("inquiry"), "section", "secondary", proposed("Contact us", FLOW_SOURCE)),
    },
  };
}

