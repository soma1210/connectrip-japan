import type { MetadataRoute } from "next";
import { V1_PREVIEW } from "./config";
import { visibleRecords } from "./content/guides";
import { jstToday } from "./content/guides/freshness";
import { absoluteUrl } from "./metadata";
import { articleHref, travelGuideHref } from "./routes";

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
      url: absoluteUrl(articleHref(r.slug, r.area)),
      lastModified: lastModified(r.updatedAt ?? r.publishedAt ?? today),
      changeFrequency: (r.articleType === "roundup" || r.articleType === "seasonal" ? "weekly" : "monthly") as "weekly" | "monthly",
    })),
  ];
}
