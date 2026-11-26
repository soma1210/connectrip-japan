import type { SeoMeta, TravelGuideArticleViewModel } from "@/contracts";
import { SITE_URL } from "@/lib/site";
import { ORGANIZATION_NAME } from "./config";
import { absoluteUrl } from "./metadata";
import { socialLinks } from "@/data/social-links";
import { getCompanyProfileViewModel } from "./content/currentSitePages";
import { OFFICERS, type OfficerKey } from "./content/officers";
import { experienceHref, routeHref } from "./routes";
import { FEATURED_TOUR_SLUG, getFeaturedTour } from "./content/featuredTour";
import { PRICE_TIERS as TENMANGU_PRICE_TIERS, TENMANGU_SLUG, getTenmanguExperience } from "./content/experienceTenmangu";
import { PRIVATE_GUIDE_PRICING_VISIBLE, getPrivateGuidePricing } from "./content/privateGuidePricing";
import { PRIVATE_GUIDE_FAQ } from "./content/privateGuideFaq";

/** The Private Guide areas the Home and Private Guide pages name (2026-11-25). */
const SERVICE_AREAS = ["Osaka", "Kyoto", "Nara", "Kobe"] as const;

/** Built from what the pages state; no travel-agency wording (not registered). */
const ORGANIZATION_DESCRIPTION =
  "Connectrip Japan is a private guide company based in Osaka, Japan. We offer private tours with English-speaking local guides in Osaka, Kyoto, Nara and Kobe.";

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

function companyNote(label: string): string | undefined {
  const content = getCompanyProfileViewModel().content;
  if (content.status === "TBD") return undefined;
  const note = (content.value.rows.find((r) => r.label === label) as { note?: unknown } | undefined)?.note;
  return typeof note === "string" ? note : undefined;
}

/**
 * "1-15-25 Nakajima, Nishiyodogawa-ku, Osaka, Japan" (the Company page row) split into
 * PostalAddress parts. Only what the page shows: no postal code (not published).
 */
function postalAddress(address: string | undefined): JsonLd | undefined {
  if (!address) return undefined;
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.at(-1) === "Japan") parts.pop();
  if (parts.length < 3) return { "@type": "PostalAddress", streetAddress: address, addressCountry: "JP" };
  const region = parts.at(-1)!;
  return {
    "@type": "PostalAddress",
    streetAddress: parts[0],
    addressLocality: parts.slice(1).join(", "),
    addressRegion: region,
    addressCountry: "JP",
  };
}

/**
 * Official profiles, each linked from the site footer and checked on 2026-11-26:
 * TikTok and Instagram (@japan_travel_guide_ctj); Facebook "Connectrip Japan", the profile the
 * footer's share link opens (its og:url). WhatsApp is a chat link, not a profile.
 */
const FACEBOOK_PROFILE = "https://www.facebook.com/people/Connectrip-Japan/61590505293378/";

const OFFICER_ID = { representative: `${SITE_URL}/#riku-ohizumi`, deputy: `${SITE_URL}/#soma-beppu` } as const;

/** Officers with their official titles (content/officers.ts; shown on About and Company). */
function officerJsonLd(key: OfficerKey): JsonLd {
  const o = OFFICERS[key];
  return { "@type": "Person", "@id": OFFICER_ID[key], name: o.name, jobTitle: o.titleEn, worksFor: { "@id": ORGANIZATION_ID } };
}

/**
 * Organization (AIO / GEO audit 2026-11-26). Every value is on the site:
 * - name: the brand; legalName: the Japanese registered name; alternateName: the English company name
 *   (Company page: "Connectrip Japan Co., Ltd." / "Connectrip Japan 株式会社");
 * - description: facts the pages state (Osaka address, private guide services, English-speaking
 *   local guides, Osaka / Kyoto / Nara / Kobe). Not a travel agency: no TravelAgency / LocalBusiness;
 * - founders (About "The Founders") and officers with their titles (About / Company);
 * - contact: the Inquiry page (no e-mail address or phone number is published on the site);
 * - knowsLanguage: English, the guide language the pages state. Other languages: owner decision.
 */
export function organizationJsonLd(): JsonLd {
  const englishName = companyRow("Company Name");
  const japaneseName = companyNote("Company Name");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: ORGANIZATION_NAME,
        legalName: japaneseName ?? englishName,
        alternateName: japaneseName ? englishName : undefined,
        description: ORGANIZATION_DESCRIPTION,
        url: `${SITE_URL}/`,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/images/logo/logo.png`, width: 1254, height: 1254 },
        foundingDate: isoDate(companyRow("Founded")),
        address: postalAddress(companyRow("Address")),
        areaServed: SERVICE_AREAS.map((name) => ({ "@type": "City", name })),
        knowsLanguage: ["en"],
        founder: [{ "@id": OFFICER_ID.deputy }, { "@id": OFFICER_ID.representative }],
        employee: [{ "@id": OFFICER_ID.representative }, { "@id": OFFICER_ID.deputy }],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          url: absoluteUrl(routeHref("inquiry")),
          availableLanguage: ["English"],
        },
        sameAs: [socialLinks.tiktok, socialLinks.instagram.split("?")[0], FACEBOOK_PROFILE],
      },
      officerJsonLd("representative"),
      officerJsonLd("deputy"),
    ],
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

/*
 * Tours and the Private Guide service (AIO / GEO audit 2026-11-26). Built from the same records the
 * pages render: title, description, stops and the price table shown on the page. No reviews, ratings,
 * availability, images (photo rights are not confirmed) or anything the page doesn't show.
 * Schema.org validity only: Google shows no rich result for TouristTrip or Service, and FAQ rich
 * results ended on 2026-05-07; the markup describes the page for search engines and AI systems.
 */
const provider = { "@id": ORGANIZATION_ID };
const yen = (amount: number) => ({ price: amount, priceCurrency: "JPY" });

/** `stops`: only for a page that shows a visit order (the Tenmangu page lists places, not an itinerary). */
type TourInput = { name: string; description: string; href: string; stops?: string[]; tiers: { guests: string; amount: number }[]; priceNote: string };

/** A private tour page: TouristTrip with its stops and one Offer per group size shown in its price table. */
export function touristTripJsonLd(t: TourInput): JsonLd {
  const url = absoluteUrl(t.href);
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "@id": `${url}#trip`,
    name: t.name,
    description: t.description,
    url,
    provider,
    itinerary: t.stops?.length ? { "@type": "ItemList", itemListElement: t.stops.map((name, i) => ({ "@type": "ListItem", position: i + 1, name })) } : undefined,
    offers: t.tiers.map((tier) => ({ "@type": "Offer", name: tier.guests, description: t.priceNote, ...yen(tier.amount), url, offeredBy: provider })),
  };
}

export function featuredTourJsonLd(): JsonLd {
  const t = getFeaturedTour();
  return touristTripJsonLd({
    name: t.title,
    description: t.tagline,
    href: experienceHref(FEATURED_TOUR_SLUG),
    stops: t.schedule.map((s) => s.title),
    tiers: t.pricing.tiers.map((x) => ({ guests: x.guests, amount: x.price.amount })),
    priceNote: t.pricing.note,
  });
}

export function tenmanguTourJsonLd(): JsonLd | undefined {
  const e = getTenmanguExperience();
  // Same introduction the product page shows (ExperienceProductView).
  const description = e.introduction ?? (e.summary.status === "TBD" ? undefined : e.summary.value);
  if (e.title.status === "TBD" || !description || !e.priceNote) return undefined;
  return touristTripJsonLd({
    name: e.title.value,
    description,
    href: experienceHref(TENMANGU_SLUG),
    tiers: TENMANGU_PRICE_TIERS.map((x) => ({ guests: x.guests, amount: x.price.amount })),
    priceNote: e.priceNote,
  });
}

/** Private Guide: the service, its areas and the prices in its table (groups of 7+ are a custom quote: no Offer). */
export function privateGuideServiceJsonLd(): JsonLd | undefined {
  if (!PRIVATE_GUIDE_PRICING_VISIBLE) return undefined;
  const p = getPrivateGuidePricing();
  const url = absoluteUrl(routeHref("privateGuide"));
  const offers = p.tiers.flatMap((tier) =>
    p.durations.flatMap((d) => {
      const price = tier.prices[d.key];
      return price ? [{ "@type": "Offer", name: `${tier.guests} · ${d.label} · ${d.hours}`, description: p.note, ...yen(price.amount), url, offeredBy: provider }] : [];
    }),
  );
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: "Private Guide",
    serviceType: "Private guide service",
    description: p.description,
    url,
    provider,
    areaServed: SERVICE_AREAS.map((name) => ({ "@type": "City", name })),
    offers,
  };
}

/** The FAQ shown on the Private Guide page, word for word. */
export function privateGuideFaqJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${absoluteUrl(routeHref("privateGuide"))}#faq`,
    mainEntity: PRIVATE_GUIDE_FAQ.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
}
