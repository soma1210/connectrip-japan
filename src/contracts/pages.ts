import type { CtaSpec } from "./cta";
import type { Experience, ExperienceSummary } from "./experience";
import type { HowItWorksFlows } from "./howItWorks";
import type { InquiryFormModel } from "./inquiry";
import type { ImageAsset } from "./media";
import type { PersonPreview } from "./person";
import type { RouteKey } from "./routes";
import type { SeoMeta } from "./seo";
import type { SocialProofContent } from "./socialProof";
import type { Tbd } from "./status";
import type { TravelGuideArticleSummary } from "./travelGuide";

/** What a page-level View component receives from its route. */
export type PageViewModel<K extends RouteKey, C> = {
  route: K;
  seo: SeoMeta;
  content: C;
};

/** The five Orientation Core items (Home Page Requirements §6). */
export type OrientationCoreKey = "osaka" | "local_guide" | "families" | "english" | "guide_only";

export type OrientationCoreItem = {
  key: OrientationCoreKey;
  label: Tbd<string>;
};

/**
 * Home sections (Website v1 §6). Header and Footer come from
 * `LayoutViewModel`. The order is a Working Baseline that Astra / Human review
 * may change, so it travels as data (`HomeContent.sectionOrder`).
 */
export type HomeSectionKey =
  | "hero"
  | "featuredExperiences"
  | "privateGuide"
  | "whyConnectrip"
  | "guides"
  | "howItWorks"
  | "travelGuide"
  | "socialProof"
  | "finalCta";

export type WhyItem = {
  title: Tbd<string>;
  description: Tbd<string>;
  image?: Tbd<ImageAsset>;
};

/**
 * Home content v1. All copy is TBD; slots are fixed, order and layout are
 * not. Section headings are content, never hard-coded in UI.
 */
export type HomeContent = {
  /** Render sections in this order. While TBD, use the baseline order. */
  sectionOrder: Tbd<HomeSectionKey[]>;
  /** Connectrip / Osaka / Local Experience / Guide must be understood here. */
  hero: {
    headline: Tbd<string>;
    supporting: Tbd<string>;
    core: OrientationCoreItem[];
    /** Kansai Specialist × Local Friend — direction approved, wording TBD. */
    positioning: Tbd<string>;
    images: Tbd<ImageAsset[]>;
    /** H-01 / WD-002: the Home primary CTA leads to Experiences. */
    primaryCta: CtaSpec<"experiences">;
    secondaryCta?: CtaSpec<"privateGuide" | "about">;
  };
  featuredExperiences: {
    heading: Tbd<string>;
    supporting?: Tbd<string>;
    /** Ready-made only. May be empty: design the empty state. */
    items: ExperienceSummary[];
    viewAll: CtaSpec<"experiences">;
  };
  privateGuide: {
    heading: Tbd<string>;
    supporting: Tbd<string>;
    points?: Tbd<string[]>;
    image: Tbd<ImageAsset>;
    /** "Plan your Osaka day" direction; copy TBD. */
    cta: CtaSpec<"inquiry" | "privateGuide">;
    learnMore?: CtaSpec<"privateGuide">;
  };
  whyConnectrip: {
    heading: Tbd<string>;
    items: Tbd<WhyItem[]>;
  };
  /** H-02 / WD-003: real guides, face + name + profile. No fake people. */
  guides: {
    heading: Tbd<string>;
    people: PersonPreview[];
    aboutLink?: CtaSpec<"about">;
  };
  howItWorks: {
    heading: Tbd<string>;
    flows: HowItWorksFlows;
    link: CtaSpec<"howItWorks">;
  };
  travelGuide: {
    heading: Tbd<string>;
    supporting?: Tbd<string>;
    /** May be empty: design the empty state. */
    articles: TravelGuideArticleSummary[];
    viewAll: CtaSpec<"travelGuide">;
  };
  socialProof: SocialProofContent;
  finalCta: {
    heading: Tbd<string>;
    supporting?: Tbd<string>;
    image?: Tbd<ImageAsset>;
    browseExperiences: CtaSpec<"experiences">;
    planPrivateDay: CtaSpec<"privateGuide" | "inquiry">;
  };
};

export type HomeViewModel = PageViewModel<"home", HomeContent>;

export type ExperiencesListContent = {
  intro: {
    headline: Tbd<string>;
    supporting: Tbd<string>;
  };
  /** Ready-made only. May be empty. */
  items: ExperienceSummary[];
  /** For travellers who want something custom. */
  privateGuideCta?: CtaSpec<"privateGuide">;
};

export type ExperiencesListViewModel = PageViewModel<"experiences", ExperiencesListContent>;

/** `Experience.seo` (T-02) is carried by the page model here. */
export type ExperienceDetailViewModel = PageViewModel<"experienceDetail", Omit<Experience, "seo">>;

export type InquiryPageContent = {
  intro: {
    headline: Tbd<string>;
    supporting: Tbd<string>;
  };
  form: InquiryFormModel;
};

export type InquiryViewModel = PageViewModel<"inquiry", InquiryPageContent>;
