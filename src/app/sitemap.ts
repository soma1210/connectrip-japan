import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { V1_PREVIEW } from "@/website-v1/config";
import { PUBLIC_PATHS } from "@/website-v1/routes";
import { getExploreSitemapEntries } from "@/website-v1/sitemap";

/**
 * Website v1 launch pages only (English, no hreflang). Explore Kansai adds
 * its entries once it is approved for the public site. No `lastModified`:
 * the build time is not a content date. The preview is not indexed, so it
 * lists nothing.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (V1_PREVIEW) return [];
  return [
    ...PUBLIC_PATHS.map((path) => ({ url: path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}` })),
    // Explore Kansai: nothing until it is approved for the public site (content/explore EXPLORE_PUBLIC).
    ...getExploreSitemapEntries(),
  ];
}
