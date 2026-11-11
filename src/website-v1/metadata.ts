import type { Metadata } from "next";
import type { SeoMeta } from "@/contracts";
import { SITE_URL } from "@/lib/site";
import { ORGANIZATION_NAME, V1_PREVIEW } from "./config";
import { publicPath } from "./routes";

/** Default share image: the brand logo (the site's photos have NOT_VERIFIED rights). */
export const OG_IMAGE = { url: `${SITE_URL}/images/logo/logo.png`, width: 1254, height: 1254, alt: ORGANIZATION_NAME };

/**
 * Title / description of the launch pages (2026-11-11), keyed by public path.
 * Only facts the pages themselves show: Booking Rules V1.1 (W1-D24), the
 * Private Guide areas (W1-D04) and the Company profile. No prices, reviews
 * or unapproved promises. `title` replaces the page name only where set.
 */
const PUBLIC_PAGE_META: Record<string, { title?: { absolute: string }; description: string }> = {
  "/": {
    title: { absolute: "Private Guides in Osaka, Kyoto, Nara & Kobe | Connectrip Japan" },
    description:
      "Connectrip Japan is an Osaka-based company offering private guides in Osaka, Kyoto, Nara and Kobe. Choose 4, 6 or 8 hours and send a booking request; we reply after checking our guides' availability.",
  },
  "/private-guide": {
    title: { absolute: "Private Guide in Osaka, Kyoto, Nara & Kobe | Connectrip Japan" },
    description:
      "Request a private guide for 4, 6 or 8 hours in Osaka, Kyoto, Nara or Kobe, for up to 6 people. Days end by 20:00 Japan time. A request is not a confirmed booking: we check availability and reply.",
  },
  "/inquiry": { description: "Questions before you request a private guide? Contact Connectrip Japan." },
  "/privacy": { description: "How Connectrip Japan handles the personal information you send us." },
  "/terms": { description: "Terms for using the Connectrip Japan website." },
  "/cancel-policy": { description: "Cancellation and refund policy of Connectrip Japan." },
  "/company": {
    description:
      "Company profile of Connectrip Japan Inc., founded on September 7, 2026 in Nishiyodogawa-ku, Osaka: private guide services and travel support for visitors to Japan.",
  },
};

/**
 * Contract `SeoMeta` → Next.js metadata. Preview: noindex, as before.
 * Public: title, description, canonical and Open Graph / X for the page;
 * site defaults (share image, site name) come from the v1 layout.
 */
export function toMetadata(seo: SeoMeta): Metadata {
  const name = seo.title.status === "TBD" ? "TBD" : seo.title.value;
  if (V1_PREVIEW) {
    return {
      title: name,
      description: seo.description.status === "TBD" ? undefined : seo.description.value,
      robots: { index: false, follow: false },
    };
  }
  const path = publicPath(seo.canonicalPath);
  const page = PUBLIC_PAGE_META[path];
  const title = page?.title ?? name;
  const shareTitle = typeof title === "string" ? `${title} | ${ORGANIZATION_NAME}` : title.absolute;
  const description = page?.description ?? (seo.description.status === "TBD" ? undefined : seo.description.value);
  const canonical = absoluteUrl(seo.canonicalPath);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title: shareTitle, description, siteName: ORGANIZATION_NAME, locale: "en_US", images: [OG_IMAGE] },
    twitter: { card: "summary", title: shareTitle, description, images: [OG_IMAGE.url] },
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
