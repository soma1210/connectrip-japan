import type {
  BookingInterest,
  PrivateGuideAvailability,
  PrivateGuideBookingModel,
  PrivateGuideBookingPageViewModel,
  PrivateGuidePlan,
  SelfReportedSource,
} from "@/contracts";
import { approved } from "@/contracts";
import { fromMinutes, toMinutes } from "../booking/privateGuideSlots";
import { routeHref } from "../routes";
import { addDays, jstToday } from "./guides/freshness";
import { getCountryOptions } from "./countries";
import { PRIVATE_GUIDE_V1, PRIVATE_GUIDE_V1_SOURCE } from "./privateGuidePolicy";
import { cta, pageSeo, proposed } from "./shared";

/**
 * Private Guide slot booking (W1-D16) with the Private Guide v1 product
 * conditions (HUMAN_DECISION 2026-10-25, Working Baseline — see
 * `privateGuidePolicy.ts`): 4 h / 6 h / 8 h plans and prices, hourly starts
 * inside 08:00–20:00.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ PROTOTYPE — open dates are MOCK availability, not real guide         │
 * │ capacity. Continue to Payment never creates a booking or a payment.  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const FLOW_SOURCE = "Private Guide slot booking flow (W1-D16) / Private Guide v1 journey (HUMAN_DECISION 2026-10-25). PROPOSED copy";
const UNIFIED_SOURCE = "Private Guide Unified Booking Flow v1 (Human brief 2026-10-25). PROPOSED copy";

const PLANS: PrivateGuidePlan[] = PRIVATE_GUIDE_V1.plans.map((p) => ({
  id: p.id,
  name: approved(`${p.hours}-Hour Private Guide`, PRIVATE_GUIDE_V1_SOURCE),
  summary: approved([p.tagline, p.spots.replace(/^approx\./, "Approx.")].filter(Boolean).join(" \u00b7 "), PRIVATE_GUIDE_V1_SOURCE),
  durationMinutes: p.hours * 60,
  pricing: approved({ kind: "per_group", amount: { amount: p.price, currency: "JPY" } }, PRIVATE_GUIDE_V1_SOURCE),
  demo: false,
}));

/** Hourly candidates from the window start; each plan keeps only starts that end by the window end. */
function hourlyStartTimes(): string[] {
  const { windowStart, windowEnd, startIntervalMinutes } = PRIVATE_GUIDE_V1.hours;
  const shortest = Math.min(...PRIVATE_GUIDE_V1.plans.map((p) => p.hours)) * 60;
  const times: string[] = [];
  for (let m = toMinutes(windowStart); m + shortest <= toMinutes(windowEnd); m += startIntervalMinutes) times.push(fromMinutes(m));
  return times;
}

/**
 * MOCK availability for the next 10 weeks (not real guide capacity): every
 * 9th day closed, no blocked ranges. Starts today so the 48 h / 24 h booking
 * cutoff can be seen; the cutoff itself is applied in the booking UI.
 */
function mockAvailability(now: Date): PrivateGuideAvailability {
  const today = jstToday(now);
  const dates: string[] = [];
  for (let i = 0; i < 72; i++) {
    if (i % 9 === 4) continue;
    dates.push(addDays(today, i));
  }
  const { windowStart, windowEnd } = PRIVATE_GUIDE_V1.hours;
  return { source: "mock", dates, startTimes: hourlyStartTimes(), windowStart, windowEnd, blocked: {} };
}

export function getPrivateGuideBookingModel(now: Date = new Date()): PrivateGuideBookingModel {
  return {
    mode: "prototype",
    plans: PLANS,
    availability: mockAvailability(now),
    steps: [
      proposed("Choose your plan, date and start time, then book and pay online", FLOW_SOURCE),
      proposed("Connectrip secures your guide and confirms your booking", FLOW_SOURCE),
      proposed("Tell us your wishes in the Private Day Planner", FLOW_SOURCE),
      proposed("We plan the day together and share your final plan", FLOW_SOURCE),
      proposed("Experience Kansai with your private guide", FLOW_SOURCE),
    ],
    // Shown from PRIVATE_GUIDE_V1.cancellation by the booking UI (Working Baseline).
    cancellationNote: approved("See the current cancellation policy.", PRIVATE_GUIDE_V1_SOURCE),
    // Payment is not connected yet: the primary CTA says what comes next.
    bookLabel: proposed("Continue to Payment", UNIFIED_SOURCE),
    questions: {
      prompt: proposed("Have questions before booking?", FLOW_SOURCE),
      cta: cta("v1_private_booking_questions", "inquiry", routeHref("inquiry"), "section", "secondary", proposed("Contact us", FLOW_SOURCE)),
    },
    // Prototype only: lets reviewers see the step after booking.
    plannerPreview: cta(
      "v1_private_booking_planner_preview",
      "privateDayPlanner",
      routeHref("privateDayPlanner"),
      "inline",
      "secondary",
      proposed("Preview the Private Day Planner", "Private Day Planner v1 (PROTOTYPE)"),
    ),
  };
}


const INTEREST_SOURCE = "Booking preferences v1 (Human brief 2026-10-25). Not the Inquiry service interests";
const SOURCE_SOURCE = "Self-reported discovery source v1 (Human brief 2026-10-25)";

/**
 * What the traveller wants to do on their Private Guide day. A different list
 * from the Inquiry service interests (Private Tours, Planning, Interpreter
 * Only, ...): do not merge the two taxonomies.
 */
export const BOOKING_INTEREST_LABELS: Record<BookingInterest, string> = {
  food_dining: "Food & Dining",
  culture_heritage: "Culture & Heritage",
  shopping: "Shopping",
  famous_sights: "Famous Sights",
  hidden_gems: "Hidden Gems",
  local_neighborhoods: "Local Neighborhoods",
  family_activities: "Family Activities",
  active_experiences: "Active Experiences",
  other: "Other",
};

export const SELF_REPORTED_SOURCE_LABELS: Record<SelfReportedSource, string> = {
  google: "Google",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  ai_chatgpt: "AI / ChatGPT",
  friend_family: "Friend or Family",
  travel_agent: "Travel Agent",
  hotel: "Hotel",
  other: "Other",
};

/** Private Guide booking page: the unified flow (PROTOTYPE / PENDING HUMAN VISUAL REVIEW). */
export function getPrivateGuideBookingPageViewModel(now: Date = new Date()): PrivateGuideBookingPageViewModel {
  return {
    route: "privateGuideBooking",
    seo: pageSeo("Book a Private Guide", routeHref("privateGuideBooking")),
    content: {
      intro: {
        headline: proposed("Book a Private Guide", UNIFIED_SOURCE),
        supporting: proposed(
          "Choose your plan, date and start time, tell us a little about your trip, then continue to payment. After payment, Connectrip secures your guide and confirms your booking, then we plan the day together.",
          UNIFIED_SOURCE,
        ),
      },
      booking: getPrivateGuideBookingModel(now),
      details: {
        heading: proposed("About your trip", UNIFIED_SOURCE),
        supporting: proposed("So we can confirm your booking and start planning your day.", UNIFIED_SOURCE),
        countries: getCountryOptions(),
        interests: (Object.keys(BOOKING_INTEREST_LABELS) as BookingInterest[]).map((value) => ({
          value,
          label: proposed(BOOKING_INTEREST_LABELS[value], INTEREST_SOURCE),
        })),
        tripDescription: {
          label: proposed("Tell us about your trip", UNIFIED_SOURCE),
          help: proposed(
            "Tell us what you\u2019re hoping to experience, where you\u2019re planning to visit, or anything else that would help us understand your trip.",
            UNIFIED_SOURCE,
          ),
          placeholder: proposed("e.g. First time in Japan with our two kids. We love food markets and quiet temples\u2026", UNIFIED_SOURCE),
          maxLength: 1000,
        },
        sources: (Object.keys(SELF_REPORTED_SOURCE_LABELS) as SelfReportedSource[]).map((value) => ({
          value,
          label: proposed(SELF_REPORTED_SOURCE_LABELS[value], SOURCE_SOURCE),
        })),
        consent: {
          label: proposed(
            "I agree to the Booking Terms and the Privacy Policy, and understand Connectrip will use these details to confirm and plan my booking.",
            "PROPOSED / LEGAL REVIEW REQUIRED. Booking consent only: not the Inquiry or marketing consent",
          ),
          termsHref: routeHref("terms"),
          privacyHref: routeHref("privacy"),
        },
      },
      paymentNotice: proposed("Payment is not connected in this prototype.", UNIFIED_SOURCE),
      backCta: cta("v1_booking_back_private_guide", "privateGuide", routeHref("privateGuide"), "section", "secondary", proposed("Back to Private Guide", UNIFIED_SOURCE)),
    },
  };
}
