import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { ORGANIZATION_NAME } from "./config";
import {
  AREA_INFO,
  EXPLORE_COPY,
  EXPLORE_PUBLIC,
  areaName,
  articleHref,
  articleSpotIds,
  isIndexable,
  type ExploreArea,
  type ExploreArticle,
  type SelectArticle,
} from "./content/explore";
import { displayPhoto, spotById } from "./content/spots";
import { absoluteUrl, toGuideMetadata } from "./metadata";
import { exploreAreaHref, exploreEditorialPolicyHref, exploreHref, exploreSelectHref, exploreUpdatesHref, routeHref } from "./routes";

/**
 * Explore Kansai SEO (metadata, breadcrumbs, structured data). Everything is
 * read from the record the page renders (H1 = title, description = the
 * page's own summary, dates = the dates shown, FAQ = the visible FAQ), so
 * markup never says more than the page. Structured data describes the page;
 * it is not a promise of any special search result.
 * - Preview: always noindex (toGuideMetadata). Canonical / OG URLs are the
 *   production URLs (no `/v1`), so the public URL is canonical from day one.
 * - Article / NewsArticle, FAQPage and ItemList only for indexable records
 *   (live, Explore public, updates still current). `articleGraph` builds them
 *   without the gate, for checks.
 */
const value = (v: string) => ({ status: "APPROVED" as const, value: v, source: "Explore Kansai record" });
const page = (title: string, description: string, canonicalPath: string, noindex = false): Metadata =>
  toGuideMetadata({ title: value(title), description: value(description), canonicalPath, noindex });

export const exploreHubMetadata = () => page(EXPLORE_COPY.title, EXPLORE_COPY.intro, exploreHref());
export const exploreSelectListMetadata = () => page(EXPLORE_COPY.select.label, EXPLORE_COPY.select.description, exploreSelectHref());
export const exploreUpdatesListMetadata = () => page(EXPLORE_COPY.updates.label, EXPLORE_COPY.updates.description, exploreUpdatesHref());
export const exploreMapMetadata = () =>
  page(`${EXPLORE_COPY.map.label}: Connectrip Japan Select`, "A map of the places in Osaka picked by Connectrip Japan, from Osaka Castle and Dotonbori to local shrines and markets, linked to our guides.", routeHref("connectripSelect"));
/** Area page: noindex while it has no live article (an empty page is not worth a search result). */
export const exploreAreaMetadata = (area: ExploreArea, hasArticles: boolean) =>
  page(`${AREA_INFO[area].name} Travel Guides`, AREA_INFO[area].intro, exploreAreaHref(area), !hasArticles);
export const exploreEditorialPolicyMetadata = () =>
  page("Editorial Policy", "How the Connectrip Japan Editorial Team researches, checks and updates the guides and travel updates in Explore Kansai.", exploreEditorialPolicyHref());
/** Never indexed, never in the sitemap. */
export const exploreEditorialDashboardMetadata = (): Metadata => ({ ...page("Editorial list", "Preview only", exploreHref(), true), alternates: undefined });

function leadPhoto(a: ExploreArticle) {
  if (a.kind !== "select") return undefined;
  if (a.content.type === "guide") {
    const h = a.content.hero;
    return h.rightsConfirmed ? { src: h.src, alt: h.alt, width: h.width, height: h.height, rights: "CONFIRMED_BY_HUMAN" as const, consent: "NOT_VERIFIED" as const } : undefined;
  }
  for (const id of articleSpotIds(a)) {
    const photo = displayPhoto(spotById(id));
    if (photo && !photo.unverified) return photo;
  }
  return undefined;
}

export function exploreArticleMetadata(a: ExploreArticle): Metadata {
  const indexed = isIndexable(a);
  // Only rights-confirmed photos are offered for sharing.
  const image = leadPhoto(a);
  return toGuideMetadata({
    title: value(a.kind === "select" ? a.seoTitle : a.title),
    description: value(a.kind === "select" ? a.description : a.summary),
    canonicalPath: articleHref(a),
    noindex: !indexed,
    ogType: "article",
    ogImage: image ? { status: "APPROVED", value: image, source: "Explore Kansai record" } : undefined,
    publishedTime: indexed ? a.publishedAt : undefined,
    modifiedTime: indexed ? a.updatedAt : undefined,
  });
}

export type Crumb = { name: string; href: string };

/** Home › Explore Kansai › … (also the visible breadcrumb). */
export function exploreCrumbs(...tail: Crumb[]): Crumb[] {
  return [{ name: "Home", href: routeHref("home") }, { name: EXPLORE_COPY.title, href: exploreHref() }, ...tail];
}

/** Article breadcrumb: Home › Explore Kansai › Series › Title. */
export function articleCrumbs(a: ExploreArticle): Crumb[] {
  const series = a.kind === "select" ? { name: EXPLORE_COPY.select.label, href: exploreSelectHref() } : { name: EXPLORE_COPY.updates.label, href: exploreUpdatesHref() };
  return exploreCrumbs(series, { name: a.title, href: articleHref(a) });
}

export function breadcrumbJsonLd(crumbs: Crumb[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absoluteUrl(c.href) })),
  };
}

/** Sources the article cites on the page. */
export function articleSources(a: ExploreArticle): { name: string; url: string }[] {
  if (a.kind === "update") return a.source ? [a.source] : [];
  const list: { name: string; url: string }[] = [];
  for (const id of articleSpotIds(a)) {
    const d = spotById(id).details;
    if (d) list.push(d.official);
    if (d?.access) list.push(d.access.source);
  }
  if (a.content.type === "itinerary") for (const s of a.content.stops) for (const src of s.nextLeg?.sources ?? []) list.push(src);
  if (a.content.type === "guide") for (const place of a.content.places) if (place.official) list.push(place.official);
  const seen = new Set<string>();
  return list.filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)));
}

const ORGANIZATION = { "@type": "Organization", name: ORGANIZATION_NAME, url: SITE_URL };

/** The places of a Select article, in page order (ItemList of TouristAttraction with verified coordinates). */
function placesList(a: SelectArticle): Record<string, unknown> {
  const url = absoluteUrl(articleHref(a));
  return {
    "@type": "ItemList",
    name: a.title,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: articleSpotIds(a).length,
    itemListElement: articleSpotIds(a).map((id, i) => {
      const s = spotById(id);
      return {
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "TouristAttraction",
          name: s.name,
          url: a.content.type === "spots" ? `${url}#${s.id}` : url,
          geo: { "@type": "GeoCoordinates", latitude: s.latitude, longitude: s.longitude },
          ...(s.details ? { address: { "@type": "PostalAddress", addressLocality: s.details.locality, addressCountry: "JP" }, sameAs: s.details.official.url } : {}),
        },
      };
    }),
  };
}

/** Article / NewsArticle + FAQPage (visible FAQ) + ItemList (places), without the publish gate. */
export function articleGraph(a: ExploreArticle): Record<string, unknown> {
  const url = absoluteUrl(articleHref(a));
  const image = leadPhoto(a);
  const sources = articleSources(a).map((s) => s.url);
  const faq = a.faq ?? [];
  const article = {
    "@type": a.kind === "update" ? "NewsArticle" : "Article",
    "@id": `${url}#article`,
    headline: a.title,
    description: a.kind === "select" ? a.description : a.summary,
    image: image ? [`${SITE_URL}${image.src}`] : undefined,
    datePublished: a.publishedAt,
    dateModified: a.updatedAt ?? a.publishedAt,
    author: { "@type": "Organization", name: EXPLORE_COPY.author.name, url: absoluteUrl(exploreEditorialPolicyHref()) },
    publisher: ORGANIZATION,
    mainEntityOfPage: url,
    isPartOf: { "@type": "WebSite", name: `${ORGANIZATION_NAME} ${EXPLORE_COPY.title}`, url: absoluteUrl(exploreHref()) },
    articleSection: a.kind === "select" ? EXPLORE_COPY.select.label : EXPLORE_COPY.updates.label,
    isBasedOn: sources.length > 0 ? sources : undefined,
    contentLocation: { "@type": "Place", name: `${areaName(a.area)}, Japan` },
    inLanguage: "en",
  };
  const graph: Record<string, unknown>[] = [article];
  if (faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
    });
  }
  if (a.kind === "select" && articleSpotIds(a).length > 0) graph.push(placesList(a));
  return { "@context": "https://schema.org", "@graph": graph };
}

/** Structured data for the article page; none for drafts, reviews, past news or while Explore isn't public. */
export function exploreArticleJsonLd(a: ExploreArticle): Record<string, unknown> | undefined {
  return isIndexable(a) ? articleGraph(a) : undefined;
}

/** Lists and area pages: a CollectionPage of the live articles shown (none while Explore isn't public). */
export function collectionJsonLd(name: string, href: string, articles: ExploreArticle[]): Record<string, unknown> | undefined {
  const items = articles.filter(isIndexable);
  if (!EXPLORE_PUBLIC || items.length === 0) return undefined;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: absoluteUrl(href),
    mainEntity: { "@type": "ItemList", itemListElement: items.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(articleHref(a)), name: a.title })) },
  };
}
