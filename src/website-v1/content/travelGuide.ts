import type {
  TravelGuideArticleSummary,
  TravelGuideArticleViewModel,
  TravelGuideListViewModel,
} from "@/contracts";
import { articleHref, routeHref } from "../routes";
import { getExperienceSummaries } from "./experiences";
import { cta, pageName, pageSeo, tbd } from "./shared";

/**
 * Article slots. No article, category, keyword or schema is decided
 * (AIO / SEO Requirements), so every slot is TBD.
 */
const SLUGS = ["preview-a", "preview-b", "preview-c"];

function fields(slug: string): Omit<TravelGuideArticleSummary, "cta"> {
  return {
    id: `v1-article-${slug}`,
    status: "PROPOSED",
    href: articleHref(slug),
    title: tbd("Article not decided"),
    excerpt: tbd("Excerpt TBD"),
    image: tbd("Article photo TBD"),
    category: tbd("Categories TBD"),
    publishedAt: tbd(),
    readingMinutes: tbd(),
  };
}

function summary(slug: string): TravelGuideArticleSummary {
  const base = fields(slug);
  return {
    ...base,
    cta: cta(`v1_article_${slug}`, "guideArticle", base.href, "card", "secondary", pageName("Guide Article")),
  };
}

export function getArticleSummaries(): TravelGuideArticleSummary[] {
  return SLUGS.map(summary);
}

export function getArticleSlugs(): string[] {
  return SLUGS;
}

const privateGuideCta = () =>
  cta("v1_article_private", "privateGuide", routeHref("privateGuide"), "section", "primary", pageName("Private Guide"));

const experiencesCta = () =>
  cta("v1_article_experiences", "experiences", routeHref("experiences"), "section", "secondary", pageName("Experiences"));

export function getTravelGuideListViewModel(): TravelGuideListViewModel {
  return {
    route: "travelGuide",
    seo: pageSeo("Osaka Travel Guide", routeHref("travelGuide")),
    content: {
      intro: { headline: pageName("Osaka Travel Guide"), supporting: tbd("Travel Guide intro copy TBD") },
      articles: getArticleSummaries(),
      categories: tbd("Travel Guide categories TBD"),
      experiencesCta: experiencesCta(),
      privateGuideCta: privateGuideCta(),
    },
  };
}

export function getArticleViewModel(slug: string): TravelGuideArticleViewModel | undefined {
  if (!SLUGS.includes(slug)) return undefined;
  const base = fields(slug);
  return {
    route: "guideArticle",
    seo: pageSeo("Guide Article", base.href),
    content: {
      ...base,
      author: tbd("Author must be a real person"),
      body: tbd("Article content TBD (AIO / SEO Requirements)"),
      relatedExperiences: getExperienceSummaries().slice(0, 2),
      privateGuideCta: privateGuideCta(),
      experiencesCta: experiencesCta(),
      relatedArticles: getArticleSummaries().filter((a) => a.href !== base.href),
    },
  };
}
