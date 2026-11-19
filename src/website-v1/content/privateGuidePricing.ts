import type { CtaSpec, Money } from "@/contracts";
import { V1_PREVIEW } from "../config";
import { routeHref } from "../routes";
import { cta, proposed } from "./shared";

/**
 * Private Guide Pricing V1 (Human instruction 2026-11-14): indicative base
 * prices per private group, JPY, tax included. Guide service only.
 *
 * These are reference prices shown before a request. The booking request flow
 * is unchanged: the request sends no price, and Connectrip confirms the final
 * price by quote before payment (Stripe invoice in JPY).
 *
 * Shown in the preview only until the owner approves publication
 * (`PRIVATE_GUIDE_PRICING_VISIBLE`); public mode is unchanged.
 *
 * Note: the booking form (Booking Rules V1.1) also offers 6 hours, which has
 * no published price here, and takes at most 6 people (7+ → Inquiry).
 */
export const PRIVATE_GUIDE_PRICING_SOURCE = "Private Guide Pricing V1, owner's instruction of 2026-11-14 (JPY, per group, tax included)";

export const PRIVATE_GUIDE_PRICING_VISIBLE = V1_PREVIEW;

export type PricingDuration = { key: "half" | "full"; label: string; hours: string };

export const PRICING_DURATIONS: PricingDuration[] = [
  { key: "half", label: "Half Day", hours: "4 Hours" },
  { key: "full", label: "Full Day", hours: "8 Hours" },
];

/** `null` = Custom Quote. */
export type PricingTier = { guests: string; prices: Record<PricingDuration["key"], Money<"JPY"> | null> };

const jpy = (amount: number): Money<"JPY"> => ({ amount, currency: "JPY" });

export const PRIVATE_GUIDE_PRICE_TIERS: PricingTier[] = [
  { guests: "1–2 Guests", prices: { half: jpy(25000), full: jpy(40000) } },
  { guests: "3–6 Guests", prices: { half: jpy(32000), full: jpy(50000) } },
  { guests: "7+ Guests", prices: { half: null, full: null } },
];

export type PrivateGuidePricingModel = {
  heading: string;
  description: string;
  basis: string;
  customQuote: string;
  included: string[];
  notIncluded: string[];
  note: string;
  cta: CtaSpec<"privateGuide">;
  ctaSupporting: string;
  /** Groups of 7 or more can't use the request form (max 6): they ask for a quote here. */
  largeGroupCta: CtaSpec<"inquiry">;
  durations: PricingDuration[];
  tiers: PricingTier[];
};

export function getPrivateGuidePricing(): PrivateGuidePricingModel {
  return {
    heading: "Private Guide Pricing",
    description:
      "Explore Osaka and the Kansai region with your own dedicated local guide. Enjoy a personalized experience at your own pace, with flexible sightseeing based on your interests.",
    basis: "Per private group · tax included",
    customQuote: "Custom Quote",
    included: ["Dedicated English-speaking local guide", "Flexible sightseeing based on your interests", "4-hour or 8-hour private guide service"],
    notIncluded: ["Transportation costs", "Meals and drinks", "Admission fees", "Personal expenses"],
    note:
      "All prices are in Japanese yen (JPY), per group, including tax. Prices are indicative and may vary depending on location, language, travel dates, and special requests. Final pricing and availability will be confirmed before payment.",
    // Same page: scrolls to the booking request form (#request).
    cta: cta(
      "v1_private_pricing_request",
      "privateGuide",
      `${routeHref("privateGuide")}#request`,
      "section",
      "primary",
      proposed("Request Your Private Guide", PRIVATE_GUIDE_PRICING_SOURCE),
    ),
    ctaSupporting: "Share your preferred date, time, and group details. Our team will review your request and send you a personalized quote.",
    largeGroupCta: cta(
      "v1_private_pricing_large_group",
      "inquiry",
      routeHref("inquiry"),
      "section",
      "secondary",
      proposed("Contact us about a special request", "Same label as the request form's special-request link"),
    ),
    durations: PRICING_DURATIONS,
    tiers: PRIVATE_GUIDE_PRICE_TIERS,
  };
}
