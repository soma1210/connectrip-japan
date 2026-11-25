import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { V1_PREVIEW } from "@/website-v1/config";
import { getExperienceSlugs } from "@/website-v1/content/experiences";
import { FEATURED_TOUR_SLUG } from "@/website-v1/content/featuredTour";
import { experienceHref, PUBLIC_PATHS, publicPath, routeHref } from "@/website-v1/routes";
import { getExploreSitemapEntries } from "@/website-v1/sitemap";

/**
 * Website v1 launch pages only (English, no hreflang). Explore Kansai adds
 * its entries once it is approved for the public site. No `lastModified`:
 * the build time is not a content date. The preview is not indexed, so it
 * lists nothing.
 */
/**
 * Pages served and indexable on the public site since the launch decision of
 * 2026-11-19 (config.ts V1_SHOW_ALL) that are not in PUBLIC_PATHS: About,
 * How It Works and the experiences (2026-11-25, SEO audit).
 */
function launchedPagePaths(): string[] {
  const experiences = [FEATURED_TOUR_SLUG, ...getExperienceSlugs()].map((slug) => publicPath(experienceHref(slug)));
  return [routeHref("about"), routeHref("howItWorks"), routeHref("experiences")].map(publicPath).concat(experiences);
}

export default function sitemap(): MetadataRoute.Sitemap {
  if (V1_PREVIEW) return [];
  const paths = [...new Set([...PUBLIC_PATHS, ...launchedPagePaths()])];
  return [
    ...paths.map((path) => ({ url: path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}` })),
    // Explore Kansai: nothing until it is approved for the public site (content/explore EXPLORE_PUBLIC).
    ...getExploreSitemapEntries(),
  ];
}
