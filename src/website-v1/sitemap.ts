import type { MetadataRoute } from "next";
import { V1_PREVIEW } from "./config";
import { visibleRecords } from "./content/guides";
import { jstToday } from "./content/guides/freshness";
import { absoluteUrl } from "./metadata";
import { articleHref as guideArticleHref, exploreAreaHref, exploreEditorialPolicyHref, exploreHref, exploreSelectHref, exploreUpdatesHref, routeHref, travelGuideHref } from "./routes";
import { EXPLORE_AREAS, EXPLORE_PUBLIC, articleHref, getAreaArticles, getSelectArticles, getUpdateArticles, isIndexable } from "./content/explore";

/**
 * Travel Guide sitemap entries (Phase 1 preparation, W1-D10 K-1). Not wired
 * into `src/app/sitemap.ts` yet: that happens when Website v1 launches.
 * Only published, non-demo, indexable articles; `lastModified` is the
 * content's `updatedAt`, never the build time.
 */
export function getTravelGuideSitemapEntries(now: Date = new Date()): MetadataRoute.Sitemap {
  if (V1_PREVIEW) return [];
  const today = jstToday(now);
  // Outside the preview, visible = published and through the publish gate.
  const articles = visibleRecords(today).filter((r) => !r.demo && !r.seo?.noindex && r.publishedAt && r.publishedAt <= today);
  if (articles.length === 0) return [];
  const lastModified = (date: string) => new Date(`${date}T00:00:00+09:00`);
  const updated = articles.map((r) => r.updatedAt ?? r.publishedAt ?? today).sort();

  return [
    { url: absoluteUrl(travelGuideHref("osaka")), lastModified: lastModified(updated[updated.length - 1]), changeFrequency: "weekly" },
    ...articles.map((r) => ({
      url: absoluteUrl(guideArticleHref(r.slug, r.area)),
      lastModified: lastModified(r.updatedAt ?? r.publishedAt ?? today),
      changeFrequency: (r.articleType === "roundup" || r.articleType === "seasonal" ? "weekly" : "monthly") as "weekly" | "monthly",
    })),
  ];
}

/**
 * Explore Kansai sitemap entries (2026-11-14), wired into `src/app/sitemap.ts`.
 * Empty until Explore is approved for the public site (EXPLORE_PUBLIC) and in
 * the preview. Then: the hub, lists, map and editorial policy, area pages
 * with at least one indexable article (empty areas are noindex), plus
 * articles that are live and indexable (past updates are left out). Filtered
 * list URLs (`?area=`) and the editorial list are never listed. `lastModified` is the article's own
 * updated date, never the build time.
 */
export function getExploreSitemapEntries(): MetadataRoute.Sitemap {
  if (V1_PREVIEW || !EXPLORE_PUBLIC) return [];
  const articles = [...getSelectArticles(), ...getUpdateArticles()].filter(isIndexable);
  const lastModified = (date: string) => new Date(`${date}T00:00:00+09:00`);
  return [
    { url: absoluteUrl(exploreHref()) },
    { url: absoluteUrl(exploreSelectHref()) },
    { url: absoluteUrl(exploreUpdatesHref()) },
    { url: absoluteUrl(routeHref("connectripSelect")) },
    { url: absoluteUrl(exploreEditorialPolicyHref()) },
    ...EXPLORE_AREAS.filter((area) => {
      const { select, updates } = getAreaArticles(area);
      return [...select, ...updates].some(isIndexable);
    }).map((area) => ({ url: absoluteUrl(exploreAreaHref(area)) })),
    ...articles.map((a) => ({ url: absoluteUrl(articleHref(a)), lastModified: lastModified(a.updatedAt ?? a.publishedAt ?? "") })),
  ];
}
