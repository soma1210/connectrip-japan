import type { CtaSpec } from "./cta";
import type { Experience, ExperienceSummary } from "./experience";
import type { HowItWorksFlows } from "./howItWorks";
import type { InquiryFormModel } from "./inquiry";
import type { ImageAsset } from "./media";
import type { Person, PersonPreview } from "./person";
import type { PrivateGuideActivityItem, PrivateGuideAreaItem } from "./privateGuide";
import type { RouteKey } from "./routes";
import type { SeoMeta } from "./seo";
import type { SocialProofContent } from "./socialProof";
import type { Tbd } from "./status";
import type { SelectMapContent } from "./select";
import type { GuideArticleGroup, TravelGuideArticleSummary } from "./travelGuide";

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
  /** Connectrip Select — Explore Osaka map (Human instruction 2026-10-24). */
  | "connectripSelect"
  | "featuredExperiences"
  | "privateGuide"
  | "whyConnectrip"
  | "guides"
  | "howItWorks"
  | "travelGuide"
  | "socialProof"
  /** SNS accounts section (W1-D08). Not Social Proof: no follower counts. */
  | "sns"
  | "finalCta";

export type SnsAccountPlatform = "tiktok" | "instagram" | "facebook" | "whatsapp";

/** One SNS account card. Links only; never follower / view counts. */
export type SnsAccount = {
  platform: SnsAccountPlatform;
  label: Tbd<string>;
  handle: Tbd<string>;
  href: string;
};

export type SnsSectionContent = {
  heading: Tbd<string>;
  supporting?: Tbd<string>;
  followLabel: Tbd<string>;
  accounts: SnsAccount[];
};

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
  /**
   * Connectrip Select — Osaka illustrated map, its own section between the
   * Hero and Featured Experiences (Human instruction 2026-10-24).
   */
  connectripSelect?: SelectMapContent;
  /** Connectrip / Osaka / Local Experience / Guide must be understood here. */
  hero: {
    headline: Tbd<string>;
    supporting: Tbd<string>;
    core: OrientationCoreItem[];
    /** Kansai Specialist × Local Friend — direction approved, wording TBD. Optional since T-05. */
    positioning?: Tbd<string>;
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
    /** T-05: "Plan a Private Day" → Private Guide page. */
    cta: CtaSpec<"inquiry" | "privateGuide">;
    learnMore?: CtaSpec<"privateGuide">;
    /** T-05: areas the Private Guide accepts (Osaka / Kyoto / Kobe / Nara / Other). */
    areas?: PrivateGuideAreaItem[];
    /** T-05: interest candidates, same set as the Inquiry form. */
    interests?: PrivateGuideActivityItem[];
  };
  /** Value section. Since W1-D07 it carries the current site's OUR VALUE (Working Baseline). */
  whyConnectrip: {
    heading: Tbd<string>;
    supporting?: Tbd<string>;
    items: Tbd<WhyItem[]>;
  };
  /**
   * H-02 / WD-003: real guides, face + name + profile. No fake people.
   * On hold since T-05 (W1-D05): omitted until a real guide network exists.
   */
  guides?: {
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
    /** Latest in Osaka / Explore Osaka. When present, rendered instead of `articles`. */
    groups?: GuideArticleGroup[];
    viewAll: CtaSpec<"travelGuide">;
  };
  /** On hold since T-05 (W1-D05): omitted until real reviews / track record exist. */
  socialProof?: SocialProofContent;
  /** W1-D08: the current site's SNS section, ported as a Working Baseline. */
  sns?: SnsSectionContent;
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

/** One row of company information. Company / legal claims are TBD. */
export type CompanyFact = {
  label: Tbd<string>;
  value: Tbd<string>;
};

/** About: real people's detailed profiles (WD-003) and company information. */
export type AboutContent = {
  intro: {
    headline: Tbd<string>;
    supporting: Tbd<string>;
  };
  guides: {
    heading: Tbd<string>;
    /** Real people only. Never invented. */
    people: Person[];
  };
  company: {
    heading: Tbd<string>;
    facts: Tbd<CompanyFact[]>;
  };
  experiencesCta: CtaSpec<"experiences">;
  privateGuideCta: CtaSpec<"privateGuide">;
};

export type AboutViewModel = PageViewModel<"about", AboutContent>;

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

/** Privacy Policy / Terms. Legal text is TBD until a human approves it. */
export type LegalPageContent = {
  title: Tbd<string>;
  /** ISO date of the last update. */
  updatedAt: Tbd<string>;
  sections: Tbd<LegalSection[]>;
};

export type LegalPageViewModel<K extends "privacy" | "terms" = "privacy" | "terms"> = PageViewModel<
  K,
  LegalPageContent
>;

// ---------------------------------------------------------------------------
// Pages ported from the current site as a Working Baseline (W1-D09). Each
// page's content travels as one Tbd value: PROPOSED (ported, not approved)
// until a human approves it, TBD if removed.

export type CompanyProfileRow = {
  label: string;
  value: string | string[];
  note?: string;
};

export type CompanyProfileData = {
  heading: string;
  subheading: string;
  rows: CompanyProfileRow[];
  footerSignature?: string;
};

export type CompanyProfileViewModel = PageViewModel<"company", Tbd<CompanyProfileData>>;

export type CancellationPolicySection = {
  number: number;
  title: string;
  body: string;
  note?: string;
  table?: { headers: [string, string]; rows: [string, string][] };
};

export type CancellationPolicyData = {
  heading: string;
  subheading: string;
  intro: string;
  sections: CancellationPolicySection[];
  footerSignature?: string;
};

export type CancellationPolicyViewModel = PageViewModel<"cancelPolicy", Tbd<CancellationPolicyData>>;

export type BusinessInquiryCopy = {
  eyebrow: string;
  heading: string;
  description: string;
  companyLabel: string;
  companyPlaceholder: string;
  contactNameLabel: string;
  contactNamePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  typeLabel: string;
  typeOptions: string[];
  messageLabel: string;
  messagePlaceholder: string;
  note: string;
  noteLink: string;
  submit: string;
  sending: string;
  success: string;
  successHeading: string;
  backToTop: string;
  error: string;
};

export type BusinessInquiryContent = {
  copy: Tbd<BusinessInquiryCopy>;
  /** Target of the note link (current site: the reservation form). */
  noteLinkHref: string;
  homeHref: string;
};

export type BusinessInquiryViewModel = PageViewModel<"businessInquiry", BusinessInquiryContent>;
