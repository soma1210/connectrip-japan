import type { CtaSpec } from "./cta";
import type { ImageAsset } from "./media";
import type { SeoMeta } from "./seo";
import type { RecordStatus, Tbd } from "./status";

/** Guide Product id, e.g. "GP-OSA-01" (Website Brain §8). */
export type ExperienceId = `GP-OSA-${string}`;

export type DurationRange = {
  minMinutes: number;
  maxMinutes: number;
};

export type AgeFit = {
  /** Youngest recommended age in years. 0 = all ages. */
  minAge: number;
  maxAge?: number;
};

export type WalkingIntensity = "low" | "low_medium" | "medium" | "medium_high";

export type ExperienceFormat = "private" | "group";

export type VisitExperience = "first_visit" | "repeat_visit" | "any";

export type Money = {
  amount: number;
  currency: "JPY" | "USD";
};

/**
 * Price is shown as a structure, not a bare number: what the fee covers and
 * per what unit. Amounts stay TBD until a human approves them.
 */
export type PriceStructure = {
  unit: "per_group" | "per_person";
  amount: Tbd<Money>;
  maxPartySize?: Tbd<number>;
  notes?: Tbd<string>;
};

export type ItineraryStep = {
  title: Tbd<string>;
  description?: Tbd<string>;
};

export type Itinerary = {
  steps: ItineraryStep[];
  /** Route plans are illustrative, never a fixed route promise. */
  isExample: true;
};

export type FaqItem = {
  question: Tbd<string>;
  answer: Tbd<string>;
};

/** What the Experiences list and teasers need. */
export type ExperienceSummary = {
  id: ExperienceId;
  /**
   * PROPOSED: product notes are under human review; APPROVED: may be listed
   * publicly. Production rendering of PROPOSED records is blocked by the
   * content layer, not by UI code.
   */
  status: RecordStatus;
  href: string;
  title: Tbd<string>;
  summary: Tbd<string>;
  duration: Tbd<DurationRange>;
  ageFit: Tbd<AgeFit>;
  walkingIntensity: Tbd<WalkingIntensity>;
  format: Tbd<ExperienceFormat>;
  visitExperience: Tbd<VisitExperience>;
  area: Tbd<string>;
  image: Tbd<ImageAsset>;
  cta: CtaSpec<"experienceDetail">;
};

/** Everything the Experience Detail template needs (Sitemap §4). */
export type Experience = Omit<ExperienceSummary, "cta"> & {
  highlights: Tbd<string[]>;
  itinerary: Tbd<Itinerary>;
  /** Guide-only: arrangements (hotel, transport, tickets) are never included. */
  included: Tbd<string[]>;
  excluded: Tbd<string[]>;
  price: PriceStructure;
  meetingPoint: Tbd<string>;
  images: Tbd<ImageAsset[]>;
  faq: Tbd<FaqItem[]>;
  /** Primary CTA of the Detail page is Inquiry (Sitemap §4). */
  cta: CtaSpec<"inquiry">;
  seo: SeoMeta;
};
