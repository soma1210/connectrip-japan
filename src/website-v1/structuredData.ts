import type { SeoMeta, TravelGuideArticleViewModel } from "@/contracts";
import { SITE_URL } from "@/lib/site";
import { ORGANIZATION_NAME } from "./config";
import { absoluteUrl } from "./metadata";

/**
 * JSON-LD for the Travel Guide (Phase 1, W1-D10): `Article` and
 * `BreadcrumbList` only, built from the same view model the page renders, so
 * the markup never says more than the page. No FAQPage / HowTo / Event.
 */
type JsonLd = Record<string, unknown>;

const organization = { "@type": "Organization", name: ORGANIZATION_NAME, url: SITE_URL };

export function breadcrumbJsonLd(seo: SeoMeta): JsonLd | undefined {
  const items = seo.breadcrumb?.filter((item) => item.name.status !== "TBD");
  if (!items || items.length === 0) return undefined;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name.status === "TBD" ? "" : item.name.value,
      item: absoluteUrl(item.href),
    })),
  };
}

export function articleJsonLd(vm: TravelGuideArticleViewModel): JsonLd | undefined {
  const a = vm.content;
  if (a.title.status === "TBD") return undefined;
  const image = a.image.status === "TBD" ? undefined : `${SITE_URL}${a.image.value.src}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title.value,
    description: a.excerpt.status === "TBD" ? undefined : a.excerpt.value,
    image: image ? [image] : undefined,
    // Dates only when the article is published (shown on the page as Published / Updated).
    datePublished: vm.seo.publishedTime,
    dateModified: vm.seo.modifiedTime,
    author: organization,
    publisher: organization,
    mainEntityOfPage: absoluteUrl(vm.seo.canonicalPath),
    inLanguage: "en",
  };
}
