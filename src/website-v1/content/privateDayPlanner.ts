import type {
  PrivateDayPlannerViewModel,
  PrivateGuideFieldSpec,
  PrivateGuideInfoField,
} from "@/contracts";
import { routeHref } from "../routes";
import { addDays, jstToday } from "./guides/freshness";
import { cta, pageSeo, proposed } from "./shared";

/**
 * Private Day Planner v1 — PROTOTYPE / PENDING HUMAN VISUAL REVIEW.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ DEMO / PROTOTYPE — the booking shown is invented, and Send My        │
 * │ Preferences sends and stores nothing (no API, no DB).                │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const PLANNER_SOURCE = "Private Day Planner v1 (Human brief 2026-10-25). PROPOSED copy";
const CONSENT_SOURCE = "PROPOSED COPY — not legal-approved; Privacy Policy and consent wording are decided before launch (M-I3 / M-3)";

/**
 * The 11-field v1 information model and where each field is collected, so the
 * traveller never types the same thing twice. Booking fields reach the
 * Planner from the booking record (by booking id) later.
 */
export const PRIVATE_GUIDE_FIELDS: Record<PrivateGuideInfoField, PrivateGuideFieldSpec> = {
  name: { owner: "booking", required: true },
  email: { owner: "booking", required: true },
  travelDate: { owner: "booking", required: true },
  adults: { owner: "booking", required: true },
  children: { owner: "booking", required: false },
  area: { owner: "booking", required: true },
  // Moved to Booking (Private Guide v1 HUMAN_DECISION 2026-10-25): never asked again in the Planner.
  interests: { owner: "booking", required: false },
  places: { owner: "planner", required: false },
  idealDay: { owner: "planner", required: false },
  anythingElse: { owner: "planner", required: false },
  // Structure only: when and how consent is taken is a Human / legal decision.
  consent: { owner: "consent_tbd", required: true },
};

/** Free-text limit for the prototype (PROPOSED; final limits come with the backend). */
const TEXT_MAX = 1000;

export function getPrivateDayPlannerViewModel(now: Date = new Date()): PrivateDayPlannerViewModel {
  return {
    route: "privateDayPlanner",
    seo: pageSeo("Private Day Planner", routeHref("privateDayPlanner")),
    content: {
      mode: "prototype",
      eyebrow: proposed("YOUR PRIVATE DAY", PLANNER_SOURCE),
      heading: proposed("Let’s shape your day in Kansai.", PLANNER_SOURCE),
      supporting: proposed(
        "Tell us the places, pace and requests you have in mind. We\u2019ll use your answers to start planning your day with you.",
        PLANNER_SOURCE,
      ),
      // DEMO booking. Later: read from the booking record by booking id.
      booking: {
        demo: true,
        bookingId: "DEMO-PG-0001",
        customerName: "Demo Guest",
        travelDate: addDays(jstToday(now), 3),
        areas: ["osaka"],
        adults: 2,
        children: 1,
      },
      questions: [
        // No Interests question: Booking owns Interests (Private Guide v1 HUMAN_DECISION 2026-10-25).
        {
          key: "places",
          kind: "textarea",
          heading: proposed("Any places you’d love to visit?", PLANNER_SOURCE),
          supporting: proposed("Tell us any sights, neighborhoods or places already on your list.", PLANNER_SOURCE),
          placeholder: proposed("e.g. Osaka Castle, Dotonbori, a local market…", PLANNER_SOURCE),
          maxLength: TEXT_MAX,
        },
        {
          key: "idealDay",
          kind: "textarea",
          heading: proposed("What would your ideal day feel like?", PLANNER_SOURCE),
          supporting: proposed("Tell us the pace and kind of experience you\u2019re hoping for.", PLANNER_SOURCE),
          placeholder: proposed(
            "A relaxed day with great local food, a few famous sights and places that aren’t too touristy…",
            PLANNER_SOURCE,
          ),
          maxLength: TEXT_MAX,
        },
        {
          key: "anythingElse",
          kind: "textarea",
          heading: proposed("Anything else we should know?", PLANNER_SOURCE),
          supporting: proposed("Share anything that would help us plan your day.", PLANNER_SOURCE),
          placeholder: proposed(
            "Special requests, accessibility needs, food preferences, celebrations or anything else…",
            PLANNER_SOURCE,
          ),
          maxLength: TEXT_MAX,
        },
      ],
      consent: {
        label: proposed(
          "I agree to the Privacy Policy and understand that this information will be used to help plan my private guide experience.",
          CONSENT_SOURCE,
        ),
        privacyHref: routeHref("privacy"),
      },
      submitLabel: proposed("Send My Preferences", PLANNER_SOURCE),
      successMessage: proposed("Thank you. We’ll use your answers to help shape your private day.", PLANNER_SOURCE),
      backCta: cta("v1_planner_back_private_guide", "privateGuide", routeHref("privateGuide"), "section", "secondary", proposed("Back to Private Guide", PLANNER_SOURCE)),
    },
  };
}
