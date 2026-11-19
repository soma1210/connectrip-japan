import type { CtaSpec } from "./cta";
import type { ExperienceSummary } from "./experience";
import type { ImageAsset } from "./media";
import type { PageViewModel } from "./pages";
import type { PersonPreview } from "./person";
import type { RecordStatus, Tbd } from "./status";

/**
 * Osaka Travel Guide: an acquisition asset (SNS / Google / AI search →
 * article → Experience or Private Guide). Target queries, keywords and
 * article content are TBD. Structured data is produced by the metadata layer,
 * not by UI.
 *
 * Phase 1 data model: Travel Guide Content Platform (W1-D10, Phase 1 scope
 * approved 2026-10-24). Two layers:
 * - `TravelGuideArticleRecord`: what an author / CMS stores.
 * - `TravelGuideArticle` (view model): what the UI renders. Freshness and
 *   verification labels are computed by the content layer, never stored.
 */
export type TravelGuideArticleId = string;

/** ISO calendar date, `YYYY-MM-DD`, read as a Japan (Asia/Tokyo) date. */
export type IsoDate = string;

/** Kansai areas with the same URL shape (W1-D10 K-2). v1 ships Osaka only. */
export type GuideArea = "osaka";

export type GuideArticleType =
  /** Fresh: a period roundup, e.g. Osaka Events This Month. Implemented in Phase 1. */
  | "roundup"
  /** Fresh in season, evergreen-like off season (autumn leaves, cherry blossoms). */
  | "seasonal"
  /** Evergreen guide (food, family, hidden gems). */
  | "guide"
  /** Evergreen day-by-day itinerary. */
  | "itinerary";

/**
 * The two pillars of the Travel Guide (WORKING_BASELINE, 2026-10-24), derived
 * from `GuideArticleType` — never stored separately:
 * - fresh:     what is happening in Osaka now (roundup, seasonal)
 * - evergreen: long-term planning guides (guide, itinerary)
 * Internal terms: the UI says "Latest in Osaka" / "Explore Osaka".
 */
export type GuideFreshnessClass = "fresh" | "evergreen";

/** Set by people. Temporal states (ended, needs review) are computed instead. */
export type EditorialState = "draft" | "in_review" | "published" | "archived";

export type GuideTopicKey =
  | "events"
  | "seasonal"
  | "food"
  | "family"
  | "hidden_gems"
  | "itineraries"
  | "things_to_do";

/** Categories are topics; they never appear in article URLs (W1-D10 K-2). */
export type TravelGuideCategoryRef = {
  key: string;
  label: Tbd<string>;
};

// --- Verification (W1-D10 K-3) ---------------------------------------------

/** An internal staff member. Public pages never require a personal name. */
export type StaffRef = {
  id: string;
  /** Only set when the person agreed to be named on the page. */
  displayName?: string;
};

export type VerificationMethod = "unverified" | "official_source" | "contacted" | "on_site";

export type OnSiteVerification = {
  verificationMethod: "on_site";
  verifiedBy: StaffRef;
  verifiedAt: IsoDate;
  /** Optional photo / video id taken during the visit. */
  evidenceMediaId?: string;
};

/**
 * How one fact was checked. Every method except `unverified` names who
 * checked it and when, so "Checked on site" can only come from a record.
 */
export type VerificationRecord =
  | { verificationMethod: "unverified" }
  | { verificationMethod: "official_source"; sourceId: string; verifiedBy: StaffRef; verifiedAt: IsoDate }
  | { verificationMethod: "contacted"; verifiedBy: StaffRef; verifiedAt: IsoDate }
  | OnSiteVerification;

/** Display label computed from a `VerificationRecord`. Absent = show nothing. */
export type VerificationBadge = {
  method: Exclude<VerificationMethod, "unverified">;
  label: string;
};

// --- Facts ------------------------------------------------------------------

export type GuideSource = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  kind: "official" | "press" | "other";
  accessedAt: IsoDate;
};

export type GuideEventItem = {
  id: string;
  name: string;
  venue: string;
  area?: string;
  startDate: IsoDate;
  endDate: IsoDate;
  timeNote?: string;
  summary?: string;
  price?: string;
  access?: string;
  officialUrl?: string;
  mapUrl?: string;
  bestFor?: string[];
  familyFriendly?: boolean;
  verification: VerificationRecord;
};

export type CrowdObservation = {
  level: "low" | "moderate" | "high";
  /** Crowd levels are shown only when someone was there. */
  verification: OnSiteVerification;
};

export type GuideSpotItem = {
  id: string;
  name: string;
  area: string;
  address?: string;
  hours?: string;
  price?: string;
  access?: string;
  officialUrl?: string;
  mapUrl?: string;
  bestFor?: string[];
  familyFriendly?: boolean;
  crowd?: CrowdObservation;
  verification: VerificationRecord;
};

/**
 * Connectrip Local Insight. Requires an on-site record, so unobserved
 * information cannot be presented as local (W1-D10 K-3).
 */
export type LocalInsight = {
  id: string;
  kind: "tip" | "observation" | "current_status";
  text: string;
  verification: OnSiteVerification;
};

export type EventState = "upcoming" | "live" | "ended";

/** Where today sits relative to the article's `coversFrom`–`coversTo`. */
export type ArticlePeriodState = "not_applicable" | "upcoming" | "current" | "out_of_period";

// --- Body -------------------------------------------------------------------

/**
 * Article body as typed blocks (view model). Text is plain. Event / spot /
 * insight blocks carry labels computed by the content layer.
 */
export type ArticleBlock =
  | { type: "heading"; level: 2 | 3; text: string; anchorId?: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "image"; image: ImageAsset; caption?: string }
  | { type: "callout"; text: string }
  | { type: "experience"; experience: ExperienceSummary }
  | { type: "privateGuide"; cta: CtaSpec<"privateGuide" | "inquiry"> }
  | { type: "event"; event: GuideEventItem; state: EventState; badge?: VerificationBadge }
  | { type: "spot"; spot: GuideSpotItem; badge?: VerificationBadge; crowdLabel?: string }
  | { type: "localInsight"; insight: LocalInsight; badge: VerificationBadge };

/** Body blocks as stored. Products and CTAs come from `conversion`, not the body. */
export type GuideRecordBlock =
  | Extract<ArticleBlock, { type: "heading" | "paragraph" | "list" | "image" | "callout" }>
  | { type: "event"; event: GuideEventItem }
  | { type: "spot"; spot: GuideSpotItem }
  | { type: "localInsight"; insight: LocalInsight };

export type GuideFaqItem = { question: string; answer: string };

export type GuideConversion = {
  /** Chosen by a person with a reason. May be empty (no invented products). */
  relatedExperiences: { experienceId: string; reason: string }[];
  /** `soft` = one line + text link (events, seasonal). `standard` = panel. */
  privateGuide: { intensity: "soft" | "standard"; angle?: string };
  /**
   * Chosen by a person, e.g. fresh ⇄ evergreen (Autumn Leaves → 3-Day
   * Itinerary). The rest is filled automatically, other pillar first.
   */
  relatedArticleIds: TravelGuideArticleId[];
};

export type SnsDistribution = {
  platform: "tiktok" | "instagram" | "youtube" | "facebook";
  format: "short_video" | "reel" | "carousel" | "post";
  state: "planned" | "published";
  url?: string;
  publishedAt?: IsoDate;
  mediaIds: string[];
  utmCampaign: string;
};

/** The public author is the organization (W1-D10 K-3). */
export type OrganizationAuthor = { kind: "organization"; name: "Connectrip Japan" };

// --- Record (stored) --------------------------------------------------------

export type TravelGuideArticleRecord = {
  /** Stable id: analytics and SNS key. Never changes. */
  id: TravelGuideArticleId;
  /** Lowercase, hyphenated. Never changes after publishing (W1-D10 K-2). */
  slug: string;
  area: GuideArea;
  locale: "en";
  translationOf?: TravelGuideArticleId;
  articleType: GuideArticleType;
  /** First topic is the primary category. */
  topics: GuideTopicKey[];
  editorialState: EditorialState;
  /**
   * DEMO / PLACEHOLDER / NOT FOR PRODUCTION content. Fails the publish gate
   * whatever its editorial state.
   */
  demo?: true;
  featured?: boolean;

  title: string;
  quickAnswer: string;
  summary: string;
  hero: ImageAsset;
  author: OrganizationAuthor;
  /** Internal only. */
  internalAuthor?: StaffRef;

  /** Set when published. Never a build time. */
  publishedAt?: IsoDate;
  /** Changed only when the content really changes. Never a build time. */
  updatedAt?: IsoDate;
  lastVerifiedAt?: IsoDate;
  /** Defaults by article type (content layer). */
  reviewIntervalDays?: number;
  /** Period the article covers (roundup / seasonal). */
  coversFrom?: IsoDate;
  coversTo?: IsoDate;
  /** Monthly editions reuse the same URL (W1-D10 K-4). */
  edition?: { label: string; previous?: { label: string; summary: string } };

  body: GuideRecordBlock[];
  faq?: GuideFaqItem[];
  sources: GuideSource[];
  conversion: GuideConversion;
  seo?: { title?: string; description?: string; ogImage?: ImageAsset; noindex?: boolean };
  /** Phase 3 (SNS). Data only. */
  distributions?: SnsDistribution[];
};

// --- View models ------------------------------------------------------------

/** Preview-only markers. Production never lists drafts, demos or out-of-period articles. */
export type ArticlePreviewFlag = "demo" | "draft" | "out_of_period" | "needs_review";

export type TravelGuideArticleSummary = {
  id: TravelGuideArticleId;
  /** PROPOSED drafts are blocked from production by the content layer. */
  status: RecordStatus;
  href: string;
  title: Tbd<string>;
  excerpt: Tbd<string>;
  image: Tbd<ImageAsset>;
  category?: Tbd<TravelGuideCategoryRef>;
  /** ISO dates. */
  publishedAt: Tbd<string>;
  updatedAt?: Tbd<string>;
  readingMinutes?: Tbd<number>;
  /** Derived from the article type. */
  freshnessClass?: GuideFreshnessClass;
  previewFlags?: ArticlePreviewFlag[];
  cta: CtaSpec<"guideArticle">;
};

/**
 * A titled group of article cards: "Latest in Osaka" (fresh) / "Explore
 * Osaka" (evergreen) on the Hub and Home. Groups may be empty: render the
 * empty note, never invent articles.
 */
export type GuideArticleGroup = {
  key: "latest" | "explore" | "previewOnly";
  heading: Tbd<string>;
  supporting?: Tbd<string>;
  articles: TravelGuideArticleSummary[];
  emptyNote?: Tbd<string>;
};

export type ArticleFreshness = {
  period: ArticlePeriodState;
  /** Human-readable period, e.g. "November 2026". */
  periodLabel?: string;
  needsReview: boolean;
  reviewDueAt?: IsoDate;
};

/** Phase 1 article page data (W1-D10). */
export type GuideArticleDetails = {
  articleType: GuideArticleType;
  freshnessClass: GuideFreshnessClass;
  area: GuideArea;
  editorialState: EditorialState;
  demo: boolean;
  quickAnswer: string;
  byline: {
    author: OrganizationAuthor;
    publishedAt?: IsoDate;
    /** Shown only when later than `publishedAt`. */
    updatedAt?: IsoDate;
    lastCheckedAt?: IsoDate;
  };
  freshness: ArticleFreshness;
  heroCredit?: string;
  toc: { id: string; text: string }[];
  /** Ended events, moved out of the main flow. */
  endedEvents: Extract<ArticleBlock, { type: "event" }>[];
  faq?: GuideFaqItem[];
  sources: GuideSource[];
  privateGuide: { intensity: "soft" | "standard"; angle?: string };
  /** `relatedArticles` grouped by pillar, the other pillar first. */
  relatedGroups: GuideArticleGroup[];
};

export type TravelGuideArticle = Omit<TravelGuideArticleSummary, "cta"> & {
  /**
   * @deprecated for Travel Guide articles since W1-D10 K-3: the public
   * author is the organization (`guide.byline.author`).
   */
  author?: Tbd<PersonPreview>;
  body: Tbd<ArticleBlock[]>;
  relatedExperiences: ExperienceSummary[];
  /** Always present: every article leads to Private Guide. */
  privateGuideCta: CtaSpec<"privateGuide" | "inquiry">;
  experiencesCta?: CtaSpec<"experiences">;
  relatedArticles?: TravelGuideArticleSummary[];
  /** Phase 1 data model. Absent only in T-03 fixtures. */
  guide?: GuideArticleDetails;
};

export type TravelGuideListContent = {
  intro: {
    headline: Tbd<string>;
    supporting: Tbd<string>;
  };
  featured?: TravelGuideArticleSummary;
  /** Every article this page lists (latest + guides + preview-only). */
  articles: TravelGuideArticleSummary[];
  /** Fresh articles in their period. */
  latest?: TravelGuideArticleSummary[];
  /** Evergreen articles. */
  guides?: TravelGuideArticleSummary[];
  /** Drafts, demos, out-of-period articles. Preview only, never in production. */
  previewOnly?: TravelGuideArticleSummary[];
  /** Latest in Osaka / Explore Osaka (/ preview only), in display order. */
  groups?: GuideArticleGroup[];
  categories?: Tbd<TravelGuideCategoryRef[]>;
  experiencesCta?: CtaSpec<"experiences">;
  privateGuideCta?: CtaSpec<"privateGuide" | "inquiry">;
};

export type TravelGuideListViewModel = PageViewModel<"travelGuide", TravelGuideListContent>;

export type TravelGuideArticleViewModel = PageViewModel<"guideArticle", TravelGuideArticle>;
