import type { SeoMeta, TravelGuideArticleViewModel } from "@/contracts";
import { SITE_URL } from "@/lib/site";
import { ORGANIZATION_NAME } from "./config";
import { absoluteUrl } from "./metadata";
import { socialLinks } from "@/data/social-links";
import { getCompanyProfileViewModel } from "./content/currentSitePages";

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

/*
 * Launch pages (STEP 13A, 2026-11-11): Organization, WebSite, BreadcrumbList.
 * Organization facts are read from the same Company profile rows the Company
 * page renders, so the markup never states more than the page. No prices,
 * offers, reviews, ratings or registration numbers.
 */
const ORGANIZATION_ID = `${SITE_URL}/#organization`;

function companyRow(label: string): string | undefined {
  const content = getCompanyProfileViewModel().content;
  if (content.status === "TBD") return undefined;
  const value = content.value.rows.find((r) => r.label === label)?.value;
  return typeof value === "string" ? value : undefined;
}

/** "November 16, 2026" → "2026-11-16" (undefined when it can't be read). */
function isoDate(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const ms = Date.parse(`${text} 00:00 UTC`);
  return Number.isNaN(ms) ? undefined : new Date(ms).toISOString().slice(0, 10);
}

export function organizationJsonLd(): JsonLd {
  const address = companyRow("Address");
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: companyRow("Company Name") ?? ORGANIZATION_NAME,
    alternateName: ORGANIZATION_NAME,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/images/logo/logo.png`,
    foundingDate: isoDate(companyRow("Founded")),
    address: address ? { "@type": "PostalAddress", streetAddress: address, addressCountry: "JP" } : undefined,
    // Profiles linked in the site footer (WhatsApp is a chat link, not a profile).
    sameAs: [socialLinks.tiktok, socialLinks.instagram.split("?")[0]],
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: ORGANIZATION_NAME,
    url: `${SITE_URL}/`,
    inLanguage: "en",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** Home › page, for a launch page one level below Home. */
export function pageBreadcrumbJsonLd(name: string, href: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name, item: absoluteUrl(href) },
    ],
  };
}
