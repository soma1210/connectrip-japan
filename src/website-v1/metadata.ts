import type { Metadata } from "next";
import type { SeoMeta } from "@/contracts";
import { SITE_URL } from "@/lib/site";
import { ORGANIZATION_NAME, V1_PREVIEW } from "./config";
import { publicPath } from "./routes";

/** Contract `SeoMeta` → Next.js metadata. The whole preview is noindex. */
export function toMetadata(seo: SeoMeta): Metadata {
  return {
    title: seo.title.status === "TBD" ? "TBD" : seo.title.value,
    description: seo.description.status === "TBD" ? undefined : seo.description.value,
    robots: { index: false, follow: false },
  };
}

/** Production URL of a Route Registry href (the `/v1` preview base removed). */
export function absoluteUrl(href: string): string {
  return `${SITE_URL}${publicPath(href)}`;
}

/**
 * Travel Guide metadata (Phase 1, W1-D10): title, description, canonical,
 * Open Graph, X, index control. Canonical / OG URLs are the production URLs
 * (`/travel-guide/osaka/...`); the preview itself stays noindex.
 */
export function toGuideMetadata(seo: SeoMeta): Metadata {
  const title = seo.title.status === "TBD" ? "TBD" : `${seo.title.value} | ${ORGANIZATION_NAME}`;
  const description = seo.description.status === "TBD" ? undefined : seo.description.value;
  const canonical = absoluteUrl(seo.canonicalPath);
  const image = seo.ogImage && seo.ogImage.status !== "TBD" ? seo.ogImage.value : undefined;
  const images = image ? [{ url: `${SITE_URL}${image.src}`, width: image.width, height: image.height, alt: image.alt }] : undefined;
  const index = !V1_PREVIEW && !seo.noindex;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: { index, follow: index },
    openGraph:
      seo.ogType === "article"
        ? {
            type: "article",
            url: canonical,
            title,
            description,
            siteName: ORGANIZATION_NAME,
            locale: "en_US",
            images,
            publishedTime: seo.publishedTime,
            modifiedTime: seo.modifiedTime,
            authors: [ORGANIZATION_NAME],
          }
        : { type: "website", url: canonical, title, description, siteName: ORGANIZATION_NAME, locale: "en_US", images },
    twitter: { card: images ? "summary_large_image" : "summary", title, description, images: images?.map((i) => i.url) },
  };
}
