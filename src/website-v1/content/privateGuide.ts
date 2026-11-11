import type {
  AreaKey,
  PrivateGuideActivity,
  PrivateGuideViewModel,
  ProposedValue,
  ApprovedValue,
} from "@/contracts";
import { routeHref } from "../routes";
import { getHowItWorksFlows } from "./howItWorks";
import { approvedText, cta, pageName, pageSeo, proposed, tbd } from "./shared";

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
      intro: {
        headline: pageName("Private Guide"),
        supporting: tbd("Private Guide intro copy TBD"),
        image: tbd("Private Guide photo TBD"),
      },
      activities: (Object.keys(ACTIVITY_LABELS) as PrivateGuideActivity[]).map((key) => ({
        key,
        label: ACTIVITY_LABELS[key],
        description: tbd(),
      })),
      areas: (Object.keys(AREA_LABELS) as AreaKey[]).map((key) => ({ key, label: AREA_LABELS[key] })),
      exampleDays: tbd("Example days TBD (illustrative only)"),
      flow: getHowItWorksFlows().privateGuide,
      // Request flow (Human instruction 2026-11-09): the price is given per request, paid by Stripe invoice in JPY.
      pricingNote: proposed(
        "We confirm the price for your day when we reply to your request. Payment is in Japanese yen (JPY) by Stripe invoice.",
        "Private Guide booking request flow (Human instruction 2026-11-09). Copy PROPOSED",
      ),
      faq: tbd("FAQ TBD"),
      // Secondary: questions before sending a booking request.
      inquiryCta: cta("v1_private_inquiry", "inquiry", routeHref("inquiry"), "section", "secondary", pageName("Inquiry")),
      // `booking` (W1-D16 slot booking: demo plans, prices, availability, pay online) is
      // intentionally unset: replaced by the booking request form (content/privateGuideRequest.ts).
      experiencesCta: cta("v1_private_experiences", "experiences", routeHref("experiences"), "section", "secondary", pageName("Experiences")),
    },
  };
}
