import type {
  AreaKey,
  PrivateGuideActivity,
  PrivateGuideViewModel,
  ProposedValue,
  ApprovedValue,
} from "@/contracts";
import { routeHref } from "../routes";
import { getHowItWorksFlows } from "./howItWorks";
import { approved } from "@/contracts";
import { PRIVATE_GUIDE_V1_SOURCE } from "./privateGuidePolicy";
import { approvedText, cta, pageName, pageSeo, proposed, tbd } from "./shared";

const PAGE_SOURCE = "Private Guide product page (Human Decision 2026-10-25: Private Guide Page = Product Introduction). PROPOSED copy";
const EXAMPLE_SOURCE = "EXAMPLE / DEMO: illustrative private day, not a product or a fixed route";
const ENTRY_SOURCE = "Private Guide Unified Booking Flow v1 (Human brief 2026-10-25). PROPOSED copy";

const AREA_SOURCE = "Website v1 Decision Log W1-D04";

/** Private Guide destinations: Osaka / Kyoto / Kobe / Nara / Other (APPROVED, W1-D04). */
export const AREA_LABELS: Record<AreaKey, ApprovedValue<string>> = {
  osaka: approvedText("Osaka", AREA_SOURCE),
  kyoto: approvedText("Kyoto", AREA_SOURCE),
  kobe: approvedText("Kobe", AREA_SOURCE),
  nara: approvedText("Nara", AREA_SOURCE),
  other: approvedText("Other", AREA_SOURCE),
};

const INTEREST_BASELINE = "Private Guide interests WORKING_BASELINE (W1-D06). Copy TBD";

/**
 * Interest candidates, one list for Home, the Private Guide page and the
 * Inquiry form (W1-D06). Key order is display order.
 */
export const ACTIVITY_LABELS: Record<PrivateGuideActivity, ProposedValue<string>> = {
  food: proposed("Food", INTEREST_BASELINE),
  culture: proposed("Culture", INTEREST_BASELINE),
  shopping: proposed("Shopping", INTEREST_BASELINE),
  famous_sights: proposed("Famous Sights", INTEREST_BASELINE),
  family_activities: proposed("Family Activities", INTEREST_BASELINE),
  hidden_gems: proposed("Hidden Gems", INTEREST_BASELINE),
  local_neighborhoods: proposed("Local neighborhoods", INTEREST_BASELINE),
  other: proposed("Other", INTEREST_BASELINE),
};

export function getPrivateGuideViewModel(): PrivateGuideViewModel {
  return {
    route: "privateGuide",
    seo: pageSeo("Private Guide", routeHref("privateGuide")),
    content: {
      // Product introduction (Human Decision 2026-10-25): understand it, then book.
      intro: {
        headline: proposed("Your Kansai. Your Way.", PAGE_SOURCE),
        supporting: proposed(
          "Book the time. Build the day together. Choose a private guide for 4, 6 or 8 hours, then shape the day with Connectrip after booking. Not a pre-made tour.",
          PAGE_SOURCE,
        ),
        image: tbd("Private Guide photo TBD"),
      },
      why: {
        heading: proposed("Why a Private Guide?", PAGE_SOURCE),
        points: [
          ["Your own private guide", "Just your group and a local guide, not a fixed group tour."],
          ["Explore at your own pace", "Linger where you like and skip what you don\u2019t."],
          ["Choose what interests you", "Food, culture, shopping or hidden gems: the day follows your interests."],
          ["A flexible private day", "Families, couples or friends: the day is shaped around your group."],
          ["Plan the details after booking", "Book your time first, then work out the places and route with Connectrip."],
        ].map(([title, description]) => ({ title: proposed(title, PAGE_SOURCE), description: proposed(description, PAGE_SOURCE) })),
      },
      // Private Guide v1 journey (HUMAN_DECISION 2026-10-25). Payment is not the final confirmation.
      bookingSteps: {
        heading: proposed("How It Works", PAGE_SOURCE),
        steps: [
          ["Choose Your Plan", "4, 6 or 8 hours, priced per private group."],
          ["Pick Date & Time", "Choose your date and an hourly start time."],
          ["Book & Pay", "Tell us who\u2019s coming and a little about your trip, then pay online."],
          ["Guide Confirmation", "Connectrip secures your guide and confirms your booking."],
          ["Private Day Planner", "Tell us the places, pace and requests you have in mind."],
          ["Planning Started", "We start shaping your day around your answers."],
          ["Plan Together", "We work out the places and route with you."],
          ["Final Plan", "You receive the final plan for your day."],
          ["Experience Kansai", "Meet your private guide and enjoy the day you built together."],
        ].map(([title, description]) => ({ title: approved(title, PRIVATE_GUIDE_V1_SOURCE), description: proposed(description, PAGE_SOURCE) })),
      },
      activities: (Object.keys(ACTIVITY_LABELS) as PrivateGuideActivity[]).map((key) => ({
        key,
        label: ACTIVITY_LABELS[key],
        description: tbd(),
      })),
      areas: (Object.keys(AREA_LABELS) as AreaKey[]).map((key) => ({ key, label: AREA_LABELS[key] })),
      // EXAMPLE / DEMO: what a private day could look like. Not products, not fixed routes.
      exampleDays: proposed(
        [
          {
            title: proposed("Osaka Food & Hidden Gems Day", EXAMPLE_SOURCE),
            itinerary: {
              isExample: true as const,
              steps: [
                { title: proposed("Morning", EXAMPLE_SOURCE), description: proposed("A local market and street snacks", EXAMPLE_SOURCE) },
                { title: proposed("Afternoon", EXAMPLE_SOURCE), description: proposed("Quiet backstreets and a neighborhood shrine", EXAMPLE_SOURCE) },
                { title: proposed("Evening", EXAMPLE_SOURCE), description: proposed("Dinner where locals eat", EXAMPLE_SOURCE) },
              ],
            },
          },
          {
            title: proposed("Kyoto Culture Day", EXAMPLE_SOURCE),
            itinerary: {
              isExample: true as const,
              steps: [
                { title: proposed("Morning", EXAMPLE_SOURCE), description: proposed("A temple visit before the crowds", EXAMPLE_SOURCE) },
                { title: proposed("Afternoon", EXAMPLE_SOURCE), description: proposed("Traditional crafts and a tea break", EXAMPLE_SOURCE) },
                { title: proposed("Late afternoon", EXAMPLE_SOURCE), description: proposed("A slow walk through old streets", EXAMPLE_SOURCE) },
              ],
            },
          },
          {
            title: proposed("Family Osaka Day", EXAMPLE_SOURCE),
            itinerary: {
              isExample: true as const,
              steps: [
                { title: proposed("Morning", EXAMPLE_SOURCE), description: proposed("Famous sights at a child-friendly pace", EXAMPLE_SOURCE) },
                { title: proposed("Afternoon", EXAMPLE_SOURCE), description: proposed("A hands-on food stop the kids will enjoy", EXAMPLE_SOURCE) },
                { title: proposed("Early evening", EXAMPLE_SOURCE), description: proposed("City lights before an early night", EXAMPLE_SOURCE) },
              ],
            },
          },
        ],
        EXAMPLE_SOURCE,
      ),
      flow: getHowItWorksFlows().privateGuide,
      pricingNote: approved("From \u00a544,800 per private group (4 hours), not per person. Up to 4 paying guests included; young children aged 0\u20135 join free.", PRIVATE_GUIDE_V1_SOURCE),
      // Meet Our Guides: HOLD until real guides are available (Human Decision 2026-10-25).
      // No placeholder or fictional guide cards; re-add `guides` with real, approved members only.
      faq: tbd("FAQ TBD"),
      // Secondary since W1-D16: questions before booking.
      inquiryCta: cta("v1_private_inquiry", "inquiry", routeHref("inquiry"), "section", "secondary", pageName("Inquiry")),
      // Unified flow: book on the booking page; questions go to Inquiry (kept separate).
      bookingEntry: {
        book: cta("v1_private_book", "privateGuideBooking", routeHref("privateGuideBooking"), "section", "primary", proposed("Book a Private Guide", ENTRY_SOURCE)),
        ask: cta("v1_private_ask_first", "inquiry", routeHref("inquiry"), "section", "secondary", approved("Have a question? Contact us", "Private Guide v1 secondary CTA (HUMAN_DECISION 2026-10-25)")),
      },
      experiencesCta: cta("v1_private_experiences", "experiences", routeHref("experiences"), "section", "secondary", pageName("Experiences")),
    },
  };
}
