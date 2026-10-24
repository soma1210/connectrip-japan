import type { CtaSpec } from "./cta";
import type { AreaKey, FaqItem, Itinerary } from "./experience";
import type { HowItWorksFlow } from "./howItWorks";
import type { PrivateGuideActivity } from "./inquiry";
import type { ImageAsset } from "./media";
import type { PageViewModel } from "./pages";
import type { PersonPreview } from "./person";
import type { Tbd } from "./status";

/**
 * Private Guide: a custom, consultation-based guide service (Website v1 §3B).
 * Not instantly bookable: Inquiry → consultation → proposal and price →
 * approval → individual payment → confirmed. Product details, duration and
 * pricing are TBD.
 */
export type PrivateGuideActivityItem = {
  key: PrivateGuideActivity;
  label: Tbd<string>;
  description?: Tbd<string>;
  image?: Tbd<ImageAsset>;
};

export type PrivateGuideAreaItem = {
  key: AreaKey;
  label: Tbd<string>;
  image?: Tbd<ImageAsset>;
};

/** An illustrative day. Never a fixed plan or a promise. */
export type ExampleDay = {
  title: Tbd<string>;
  itinerary: Itinerary;
};

export type PrivateGuideContent = {
  intro: {
    headline: Tbd<string>;
    supporting: Tbd<string>;
    image: Tbd<ImageAsset>;
  };
  activities: PrivateGuideActivityItem[];
  areas: PrivateGuideAreaItem[];
  exampleDays?: Tbd<ExampleDay[]>;
  flow: HowItWorksFlow<"private_guide">;
  /** Price is given per request after consultation (amounts TBD). */
  pricingNote: Tbd<string>;
  /** Real guides only (WD-003). */
  guides?: PersonPreview[];
  faq?: Tbd<FaqItem[]>;
  /** Primary CTA: Inquiry (Private Guide form). */
  inquiryCta: CtaSpec<"inquiry">;
  /** For travellers who prefer a ready-made experience. */
  experiencesCta?: CtaSpec<"experiences">;
};

export type PrivateGuideViewModel = PageViewModel<"privateGuide", PrivateGuideContent>;
