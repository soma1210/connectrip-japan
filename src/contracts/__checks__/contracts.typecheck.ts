// Compile-time checks for the Interface Contract. Not imported anywhere; it is
// type-checked by `tsc --noEmit` and `next build`. Each @ts-expect-error line
// must stay an error, otherwise the contract has lost a guarantee.
import type {
  ApprovedValue,
  BookingFlowPhase,
  BookingSummary,
  CtaSpec,
  Experience,
  ExperienceId,
  HomeContent,
  HomeSectionKey,
  HomeViewModel,
  HowItWorksFlows,
  InquiryFieldSpec,
  PriceStructure,
  SiteNav,
  SocialMetric,
  LocalInsight,
  Tbd,
  TravelGuideArticle,
  TravelGuideArticleRecord,
  VerificationRecord,
  VerifiedReview,
} from "..";
import {
  bookingFlowFixture,
  bookingStateFixtures,
  experienceDetailClosedFixture,
  experienceDetailFixture,
  homeFixture,
  homeFixtureTbd,
  howItWorksFixture,
  inquiryFormFixture,
  layoutFixture,
  privateGuideFixture,
  privateGuideInquiryFormFixture,
  socialProofFixture,
  travelGuideArticleFixture,
  travelGuideArticleRecordFixture,
  travelGuideListFixture,
} from "../fixtures";

/** Compiles only when `T` is `never` (i.e. nothing is missing). */
type AssertNever<T extends never> = T;

// --- Status -----------------------------------------------------------------

// APPROVED values must carry the source of the human decision.
// @ts-expect-error source is required
export const approvedWithoutSource: ApprovedValue<string> = { status: "APPROVED", value: "x" };

// TBD values carry no value.
// @ts-expect-error TBD has no value
export const tbdWithValue: Tbd<string> = { status: "TBD", value: "x" };

// --- Routes / CTAs ----------------------------------------------------------

// H-01 / WD-002: the Home primary CTA cannot point to Inquiry.
export const homePrimaryCtaToInquiry: HomeContent["hero"]["primaryCta"] = {
  ...homeFixture.content.hero.primaryCta,
  // @ts-expect-error Home primary CTA destination is "experiences" only
  destination: "inquiry",
};

// T-03: the Header primary CTA leads to Experiences, not Inquiry.
export const headerCtaToInquiry: SiteNav["headerCta"] = {
  ...layoutFixture.nav.headerCta,
  // @ts-expect-error header CTA destination is "experiences" only
  destination: "inquiry",
};

// T-03: Experience Detail → Booking Flow (Book Now), not Inquiry.
export const detailCtaToInquiry: Experience["cta"] = {
  ...experienceDetailFixture.cta,
  // @ts-expect-error Detail primary CTA destination is "booking" only
  destination: "inquiry",
};

// Private Guide is not instantly bookable: its flow CTA cannot lead to Booking.
export const privateFlowToBooking: HowItWorksFlows["privateGuide"]["cta"] = {
  ...howItWorksFixture.content.flows.privateGuide.cta,
  // @ts-expect-error Private Guide CTA leads to privateGuide / inquiry only
  destination: "booking",
};

// CTAs never point to legal pages.
// @ts-expect-error privacy is not a CTA destination
export const ctaToPrivacy: CtaSpec = { ...homeFixture.content.hero.primaryCta, destination: "privacy" };

// Every Travel Guide article leads to Private Guide.
export const articleWithoutPrivateGuideCta: TravelGuideArticle = {
  ...travelGuideArticleFixture.content,
  // @ts-expect-error privateGuideCta is required
  privateGuideCta: undefined,
};

// --- Travel Guide Phase 1 (W1-D10) -------------------------------------------

// "Checked on site" needs who and when.
// @ts-expect-error verifiedBy / verifiedAt are required for on-site checks
export const onSiteWithoutRecord: VerificationRecord = { verificationMethod: "on_site" };

// Connectrip Local Insight only exists with an on-site record (K-3).
export const insightFromOfficialSource: LocalInsight = {
  id: "x",
  kind: "tip",
  text: "x",
  // @ts-expect-error a Local Insight cannot rest on an official source alone
  verification: { verificationMethod: "official_source", sourceId: "s", verifiedBy: { id: "a" }, verifiedAt: "2099-01-01" },
};

// The public author is the organization (K-3).
export const articleWithPersonAuthor: TravelGuideArticleRecord = {
  ...travelGuideArticleRecordFixture,
  // @ts-expect-error author is Connectrip Japan
  author: { kind: "person", name: "Someone" },
};

// --- Experience / money -----------------------------------------------------

// v1 is Osaka-first, but Experience ids are not Osaka-only.
export const nonOsakaExperienceId: ExperienceId = "GP-KYO-01";
// @ts-expect-error Experience ids keep the GP- prefix
export const nonGpExperienceId: ExperienceId = "OSA-01";

// Itineraries are always illustrative.
export const fixedItinerary: Experience["itinerary"] = {
  status: "PROPOSED",
  // @ts-expect-error isExample must be true
  value: { steps: [], isExample: false },
};

// v1 prices and charges are JPY only.
export const usdPrice: PriceStructure["amount"] = {
  status: "PROPOSED",
  // @ts-expect-error price currency is JPY in v1
  value: { amount: 50, currency: "USD" },
};
export const usdBookingTotal: BookingSummary["total"] = {
  status: "PROPOSED",
  // @ts-expect-error booking total currency is JPY in v1
  value: { amount: 50, currency: "USD" },
};

// --- Booking states ---------------------------------------------------------

/** T-03: states Astra must be able to render from fixtures. */
type RequiredBookingPhase =
  | "initial"
  | "validation_error"
  | "unavailable"
  | "payment_pending"
  | "payment_cancelled"
  | "payment_completed_pending_confirmation"
  | "confirmed";

export type BookingPhasesInContract = AssertNever<Exclude<RequiredBookingPhase, BookingFlowPhase>>;

type FixturePhase = (typeof bookingStateFixtures)[keyof typeof bookingStateFixtures]["phase"];
export type BookingPhasesInFixtures = AssertNever<Exclude<RequiredBookingPhase, FixturePhase>>;

// --- Inquiry ----------------------------------------------------------------

// Required / optional is a decision value, not a bare boolean.
// @ts-expect-error required must be Tbd<boolean>
export const bareRequired: InquiryFieldSpec = { name: "name", kind: "text", label: { status: "TBD" }, required: true };

// --- Social proof -----------------------------------------------------------

const verification = {
  status: "VERIFIED_BY_HUMAN",
  verifiedBy: "check",
  verifiedAt: "2099-01-01",
} as const;

// @ts-expect-error a review needs its source
export const reviewWithoutSource: VerifiedReview = {
  id: "check",
  verification,
  author: { displayName: "check" },
  quote: "check",
};

// @ts-expect-error a review needs a human verification
export const reviewWithoutVerification: VerifiedReview = {
  id: "check",
  source: { platform: "google", capturedAt: "2099-01-01" },
  author: { displayName: "check" },
  quote: "check",
};

export const reviewNotVerified: VerifiedReview = {
  id: "check",
  source: { platform: "google", capturedAt: "2099-01-01" },
  // @ts-expect-error only VERIFIED_BY_HUMAN is accepted
  verification: { ...verification, status: "NOT_VERIFIED" },
  author: { displayName: "check" },
  quote: "check",
};

// @ts-expect-error an SNS metric needs a human verification
export const metricWithoutVerification: SocialMetric = {
  platform: "instagram",
  metric: "followers",
  value: 1,
  asOf: "2099-01-01",
  sourceUrl: "https://example.com",
  label: { status: "TBD" },
};

// Fixtures contain no reviews or metrics at all.
export type FixtureHasNoReviews = AssertNever<Exclude<(typeof socialProofFixture)["reviews"]["status"], "TBD">>;
export type FixtureHasNoMetrics = AssertNever<Exclude<(typeof socialProofFixture)["metrics"]["status"], "TBD">>;

// --- Home -------------------------------------------------------------------

// Every Home section key has a content slot.
export type HomeSectionsHaveSlots = AssertNever<Exclude<HomeSectionKey, keyof HomeContent>>;

// --- Fixtures satisfy the contracts -----------------------------------------

export const fixturesTypecheck = [
  homeFixture satisfies HomeViewModel,
  homeFixtureTbd satisfies HomeViewModel,
  layoutFixture,
  experienceDetailFixture,
  experienceDetailClosedFixture,
  bookingFlowFixture,
  privateGuideFixture,
  howItWorksFixture,
  travelGuideListFixture,
  travelGuideArticleFixture,
  travelGuideArticleRecordFixture,
  inquiryFormFixture,
  privateGuideInquiryFormFixture,
] as const;
