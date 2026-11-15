import { exploreSelectHref, exploreUpdatesHref } from "../../routes";
import { articleSpotIds } from "./rules";
import { SELECT_ARTICLES } from "./select";
import type { ExploreArticle } from "./types";

/** Page of an Explore article. */
export function articleHref(a: ExploreArticle): string {
  return a.kind === "select" ? exploreSelectHref(a.slug) : exploreUpdatesHref(a.slug);
}

/**
 * The Select article section that describes a spot (map popup → article).
 * The first spots article that features it; undefined when none does.
 */
export function selectSpotSectionHref(spotId: string): { href: string; label: string } | undefined {
  const article = SELECT_ARTICLES.find((a) => a.content.type === "spots" && a.content.spots.some((s) => s.spotId === spotId));
  return article ? { href: `${exploreSelectHref(article.slug)}#${spotId}`, label: `Read more in “${article.seoTitle}”` } : undefined;
}

/** The itinerary that includes a spot (spot section → "part of our day plan" link). */
export function itineraryWithSpot(spotId: string): { href: string; label: string } | undefined {
  const article = SELECT_ARTICLES.find((a) => a.content.type === "itinerary" && articleSpotIds(a).includes(spotId));
  return article ? { href: exploreSelectHref(article.slug), label: `Part of our plan: ${article.seoTitle}` } : undefined;
}
