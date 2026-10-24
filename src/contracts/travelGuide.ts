import type { CtaSpec } from "./cta";
import type { ExperienceSummary } from "./experience";
import type { ImageAsset } from "./media";
import type { PageViewModel } from "./pages";
import type { PersonPreview } from "./person";
import type { RecordStatus, Tbd } from "./status";

/**
 * Osaka Travel Guide: an acquisition asset (SNS / Google / AI search →
 * article → Experience or Private Guide). Categories, target queries, topic
 * clusters, schema and article content are TBD (AIO/SEO Requirements).
 * Structured data is produced by the metadata layer, not by UI.
 */
export type TravelGuideArticleId = string;

/** Categories are TBD; the shape only lets the UI show one. */
export type TravelGuideCategoryRef = {
  key: string;
  label: Tbd<string>;
};

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
  cta: CtaSpec<"guideArticle">;
};

/**
 * Article body as typed blocks. Text is plain (rich text format is TBD).
 * Block-level CTAs let articles link into products inside the body.
 */
export type ArticleBlock =
  | { type: "heading"; level: 2 | 3; text: string; anchorId?: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "image"; image: ImageAsset; caption?: string }
  | { type: "callout"; text: string }
  | { type: "experience"; experience: ExperienceSummary }
  | { type: "privateGuide"; cta: CtaSpec<"privateGuide" | "inquiry"> };

export type TravelGuideArticle = Omit<TravelGuideArticleSummary, "cta"> & {
  /** A real person only (WD-003). */
  author?: Tbd<PersonPreview>;
  body: Tbd<ArticleBlock[]>;
  relatedExperiences: ExperienceSummary[];
  /** Always present: every article leads to Private Guide. */
  privateGuideCta: CtaSpec<"privateGuide" | "inquiry">;
  experiencesCta?: CtaSpec<"experiences">;
  relatedArticles?: TravelGuideArticleSummary[];
};

export type TravelGuideListContent = {
  intro: {
    headline: Tbd<string>;
    supporting: Tbd<string>;
  };
  featured?: TravelGuideArticleSummary;
  articles: TravelGuideArticleSummary[];
  categories?: Tbd<TravelGuideCategoryRef[]>;
  experiencesCta?: CtaSpec<"experiences">;
  privateGuideCta?: CtaSpec<"privateGuide" | "inquiry">;
};

export type TravelGuideListViewModel = PageViewModel<"travelGuide", TravelGuideListContent>;

export type TravelGuideArticleViewModel = PageViewModel<"guideArticle", TravelGuideArticle>;
