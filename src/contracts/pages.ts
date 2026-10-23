import type { CtaSpec } from "./cta";
import type { ExperienceSummary } from "./experience";
import type { ImageAsset } from "./media";
import type { SocialLink } from "./navigation";
import type { PersonPreview } from "./person";
import type { RouteKey } from "./routes";
import type { SeoMeta } from "./seo";
import type { Tbd } from "./status";

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

export type HowItWorksStep = {
  title: Tbd<string>;
  description?: Tbd<string>;
};

/**
 * Home content (Home Page Requirements, WORKING_BASELINE + H-01 / H-02).
 * Required vs optional mirrors MUST vs SHOULD / COULD. Section order and
 * layout are not part of the contract.
 */
export type HomeContent = {
  orientation: {
    headline: Tbd<string>;
    supporting: Tbd<string>;
    core: OrientationCoreItem[];
    /** Kansai Specialist × Local Friend — direction approved, wording TBD. */
    positioning: Tbd<string>;
  };
  /** H-01 / WD-002: the Home primary CTA leads to Experiences. */
  primaryCta: CtaSpec<"experiences">;
  /** Trust check path (Sitemap Flow C). */
  secondaryCta: CtaSpec<"about">;
  /** H-02 / WD-003: real people's face + name. */
  people: PersonPreview[];
  guideOnly: {
    statement: Tbd<string>;
    learnMore: CtaSpec<"howItWorks">;
  };
  howItWorksPreview: {
    /** Outline: Inquiry → review together → confirmed (Website Brain §9). */
    steps: Tbd<HowItWorksStep[]>;
    inquiryIsNotBooking: Tbd<string>;
    link: CtaSpec<"howItWorks">;
  };
  aboutPreview: {
    link: CtaSpec<"about">;
  };
  /** COULD, only after products are approved. */
  experiencesTeaser?: {
    items: ExperienceSummary[];
  };
  /** SHOULD. Real Osaka photos with confirmed rights. */
  imagery?: Tbd<ImageAsset[]>;
  /** SHOULD. Account status NOT_VERIFIED. */
  social?: Tbd<SocialLink[]>;
  /** Reviews are NOT_AVAILABLE. Home has no review slot (Foundation §7). */
  reviews?: never;
};

export type HomeViewModel = PageViewModel<"home", HomeContent>;
