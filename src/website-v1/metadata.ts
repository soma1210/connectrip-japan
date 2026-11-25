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
export const PUBLIC_PAGE_META: Record<string, { title?: { absolute: string }; description: string }> = {
  "/": {
    title: { absolute: "Private Guides in Osaka, Kyoto, Nara & Kobe | Connectrip Japan" },
    description:
      "Explore Osaka, Kyoto, Nara and Kobe with a private English-speaking local guide. Choose 4, 6 or 8 hours and send a booking request to Connectrip Japan.",
  },
  "/private-guide": {
    title: { absolute: "Private Guide in Osaka, Kyoto, Nara & Kobe | Connectrip Japan" },
    description:
      "Request a private English-speaking guide in Osaka, Kyoto, Nara or Kobe for 4, 6 or 8 hours. We check guide availability and reply within 2 business days.",
  },
  "/inquiry": {
    description:
      "Have a question before requesting a private guide in Osaka, Kyoto, Nara or Kobe? Message Connectrip Japan on TikTok, Instagram, WhatsApp or Facebook.",
  },
  "/privacy": {
    description:
      "How Connectrip Japan Co., Ltd. collects, uses and protects the personal information you send in booking requests and inquiries, and how we use cookies.",
  },
  "/terms": {
    description:
      "The terms for using the Connectrip Japan website and private guide services: booking requests and confirmation, pricing, cancellations and liability.",
  },
  "/about": {
    description:
      "Meet the team behind Connectrip Japan, an Osaka-based private guide company founded in 2026: our founders, mission, values and the services we offer.",
  },
  "/experiences": {
    description:
      "Private guided experiences in Osaka with a local guide, starting with Osaka Tenmangu Shrine and Tenjinbashisuji, Japan's longest shopping street.",
  },
  "/experiences/osaka-like-a-local": {
    description:
      "Discover Osaka like a local on a 3-hour private walking tour for 1 to 6 guests: shrine traditions at Osaka Tenmangu, local crafts and Japanese souvenirs.",
  },
  "/cancel-policy": { description: "Cancellation and refund policy of Connectrip Japan." },
  "/company": {
    description:
      "Company profile of Connectrip Japan Co., Ltd., founded November 16, 2026 in Nishiyodogawa-ku, Osaka: private guide services and travel support in Japan.",
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
