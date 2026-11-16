/**
 * Explore Kansai content types (2026-11-14). Plain data: no React, no
 * routing, so the records can move to a CMS later with the same shape.
 *
 * Editorial workflow (both kinds): draft → in_review → published → archived.
 * Publishing needs an editor's approval (`approval`) and passes the publish
 * gate (rules.ts). Nothing is collected or published automatically.
 */

export type IsoDate = string;
export type Source = { name: string; url: string };
export type EditorialStatus = "draft" | "in_review" | "published" | "archived";
/** A person at Connectrip who approved publication. */
export type Approval = { by: string; at: IsoDate };

/** The four Explore Kansai areas. Updates may also cover the whole region ("kansai"). */
export const EXPLORE_AREAS = ["osaka", "kyoto", "nara", "kobe"] as const;
export type ExploreArea = (typeof EXPLORE_AREAS)[number];
export type UpdateArea = ExploreArea | "kansai";

/**
 * A traveller question answered on the page. Shown as the article's FAQ and,
 * once the article is indexable, as FAQPage structured data with the same text.
 * Answers use only facts already in the article or its sources.
 */
export type FaqItem = { question: string; answer: string };

/** A short fact shown in the "At a glance" box (only verified, non-volatile facts). */
export type KeyFact = { label: string; value: string };

/**
 * Where the article's booking CTA points. Links only: the booking forms,
 * API and prices are not touched.
 * - featuredTour: the Osaka Like a Local fixed tour (its route covers spots in the article)
 * - privateGuide: the Private Guide request
 */
export type CtaTarget = "featuredTour" | "privateGuide";

/** Internal search planning (never rendered). Keeps one target query per article. */
export type SearchPlan = {
  /** What the reader wants to do or know. */
  intent: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
};

// --- Connectrip Japan Select -----------------------------------------------------

/** Article text about one spot. Names, coordinates, area and photo come from the spot master. */
export type SelectSpotText = {
  spotId: string;
  /** Short "Best for" line for the article's comparison table (from the article's own text; no hours or times). */
  bestFor?: string;
  overview: string;
  whyWeRecommend: string;
  /** Experience-based suggestions. */
  localTips: string[];
  /** Practical points (hours, crowds, etiquette). */
  thingsToKnow: string[];
  /** When the overview's facts were checked against the spot's official site; null = not yet. */
  checkedAt: IsoDate | null;
  /** Reviewers only: what was checked, what is still open. */
  checkNote: string;
};

export type ItineraryStop = {
  slot: string;
  spotId: string;
  /** Short "Best for" line for the route table. */
  bestFor?: string;
  plan: string;
  /** Suggested time at the stop, only when verified. Never estimated. */
  stay: string | null;
  /** Route to the next stop from official station / line information; null on the last stop. */
  nextLeg: { text: string; sources: Source[]; checkedAt: IsoDate } | null;
};

/** A photo used by a "guide" article (existing site file; rights tracked like spot photos). */
export type GuideImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** CSS object-position, when the subject is off-centre. */
  position?: string;
  /** false until a person confirms the rights: then the photo shows in the preview only, marked. */
  rightsConfirmed: boolean;
};

/** A place recommended in a "guide" article (places outside the spot master, e.g. Kyoto and Kobe). */
export type GuidePlace = {
  id: string;
  name: string;
  nameJa?: string;
  /** City / ward, e.g. "Higashiyama Ward, Kyoto". */
  locality?: string;
  /** Short "Best for" line for the comparison table. */
  bestFor?: string;
  text: string;
  tips: string[];
  official?: Source;
  image?: GuideImage;
  /** When the place's facts were checked against its official site; null = not yet. */
  checkedAt: IsoDate | null;
  /** Reviewers only: what was checked, what is still open. */
  checkNote: string;
};

/** A group of practical points ("Getting there", "Best time to visit", "Things to know"). Verified or general advice only: no unverified hours, fees or times. */
export type TipGroup = { heading: string; items: string[] };

/** A titled block of running text in a "guide" article. */
export type GuideSection = { id: string; heading: string; paragraphs: string[] };

export type SelectArticle = {
  kind: "select";
  slug: string;
  title: string;
  /** <title> (the H1 stays `title`). */
  seoTitle: string;
  description: string;
  summary: string;
  /** Select category shown on cards and used by the list filter, e.g. "Best places", "Day itinerary". */
  topic: string;
  area: ExploreArea;
  /** Label shown instead of the area name on labels and cards (e.g. "Hyogo" for a Kobe day trip). */
  areaLabel?: string;
  search: SearchPlan;
  status: EditorialStatus;
  approval?: Approval;
  publishedAt?: IsoDate;
  updatedAt: IsoDate;
  /** All facts checked on this date. */
  verifiedAt?: IsoDate;
  /** Last full editorial review, and when the next one is due. */
  lastReviewedAt: IsoDate;
  nextReviewDue: IsoDate;
  /** The direct answer to the reader's question, shown first (2–3 sentences). */
  quickAnswer: string;
  keyFacts: KeyFact[];
  intro: string[];
  content:
    | { type: "spots"; spots: SelectSpotText[] }
    | { type: "itinerary"; stops: ItineraryStop[]; whyThisOrder: string; thingsToKnow: string[] }
    /** Free-form guide (places not in the spot master): sections, recommended places, practical tips. No map. `hero` is the card photo (lists and Home), not shown in the article. */
    | { type: "guide"; hero: GuideImage; sections: GuideSection[]; places: GuidePlace[]; tips: string[] };
  /** Practical tips section (shown after the main content, only when set). Guide `tips` and itinerary `thingsToKnow` are shown there too. */
  practical?: TipGroup[];
  /** Lead line of the closing CTA. */
  closing?: string;
  faq: FaqItem[];
  cta: CtaTarget;
  /** Related article slugs, most relevant first. Filled up from the same area when short. */
  related: string[];
  /** Open items, preview only. Must be empty to publish. */
  editorialNotes: string[];
};

// --- Kansai Travel Updates -------------------------------------------------------

export const UPDATE_CATEGORIES = ["Events & Festivals", "Transportation Updates", "Seasonal Highlights", "Attraction Updates", "Travel Advisories"] as const;
export type UpdateCategory = (typeof UPDATE_CATEGORIES)[number];

/**
 * How long the information holds:
 * - `until`: a known end (event period, works schedule, closure).
 * - `open`: no fixed end (a new rule, a reopened site). Must be re-checked by
 *   `recheckBy`, at most OPEN_RECHECK_MAX_DAYS after the last verification;
 *   past that date it is no longer shown as current.
 */
export type Validity = { type: "until"; validFrom?: IsoDate; validUntil: IsoDate } | { type: "open"; validFrom?: IsoDate; recheckBy: IsoDate };

export type UpdateArticle = {
  kind: "update";
  title: string;
  slug: string;
  summary: string;
  category: UpdateCategory;
  area: UpdateArea;
  search: SearchPlan;
  status: EditorialStatus;
  approval?: Approval;
  publishedAt?: IsoDate;
  updatedAt?: IsoDate;
  verifiedAt?: IsoDate;
  /** Official / primary source. */
  source?: Source;
  validity?: Validity;
  /** The direct answer: what changed and what to do, in 1–2 sentences. */
  quickAnswer: string;
  content: {
    whatsChanged: string[];
    whoIsAffected: string[];
    whatTravelersShouldDo: string[];
  };
  faq?: FaqItem[];
  cta?: CtaTarget;
  related: string[];
};

export type ExploreArticle = SelectArticle | UpdateArticle;
