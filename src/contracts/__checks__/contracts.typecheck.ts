// Compile-time checks for the Interface Contract. Not imported anywhere; it is
// type-checked by `tsc --noEmit` and `next build`. Each @ts-expect-error line
// must stay an error, otherwise the contract has lost a guarantee.
import type { ApprovedValue, CtaSpec, HomeContent, HomeViewModel, Tbd } from "..";
import { experienceDetailFixture, homeFixture, homeFixtureTbd, inquiryFormFixture } from "../fixtures";

// APPROVED values must carry the source of the human decision.
// @ts-expect-error source is required
export const approvedWithoutSource: ApprovedValue<string> = { status: "APPROVED", value: "x" };

// TBD values carry no value.
// @ts-expect-error TBD has no value
export const tbdWithValue: Tbd<string> = { status: "TBD", value: "x" };

// H-01 / WD-002: the Home primary CTA cannot point to Inquiry.
export const homePrimaryCtaToInquiry: HomeContent["primaryCta"] = {
  ...homeFixture.content.primaryCta,
  // @ts-expect-error Home primary CTA destination is "experiences" only
  destination: "inquiry",
};

// Reviews are NOT_AVAILABLE: Home has no review slot.
export const homeWithReviews: HomeContent = {
  ...homeFixture.content,
  // @ts-expect-error reviews cannot be set
  reviews: [],
};

// Itineraries are always illustrative.
export const fixedItinerary: typeof experienceDetailFixture.itinerary = {
  status: "PROPOSED",
  // @ts-expect-error isExample must be true
  value: { steps: [], isExample: false },
};

// Header CTA always leads to Inquiry.
// @ts-expect-error header CTA destination is "inquiry" only
export const headerCtaToAbout: CtaSpec<"inquiry"> = { ...homeFixture.content.secondaryCta };

// Fixtures satisfy the contracts.
export const fixturesTypecheck = [
  homeFixture satisfies HomeViewModel,
  homeFixtureTbd satisfies HomeViewModel,
  inquiryFormFixture,
  experienceDetailFixture,
] as const;
