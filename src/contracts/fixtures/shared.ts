import type { CtaDestination, CtaPosition, CtaSpec } from "../cta";
import type { ImageAsset } from "../media";
import type { ParameterizedRouteKey, RouteKey } from "../routes";
import { proposed, type ProposedValue } from "../status";

/**
 * Fixture-only helpers. Every fixture string starts with "[FIXTURE]" so it
 * can never be mistaken for real copy or a business fact.
 */
export const FIXTURE_SOURCE = "FIXTURE — not a business fact";

export function fixtureText(text: string): ProposedValue<string> {
  return proposed(`[FIXTURE] ${text}`, FIXTURE_SOURCE);
}

/** Fixture URLs only. Final URLs, slugs and redirects are TBD. */
export const fixtureHrefs: Record<Exclude<RouteKey, ParameterizedRouteKey>, string> = {
  home: "/",
  experiences: "/experiences",
  privateGuide: "/private-guide",
  travelGuide: "/osaka-travel-guide",
  howItWorks: "/how-it-works",
  about: "/about",
  inquiry: "/inquiry",
  privacy: "/privacy",
  terms: "/terms",
};

export function fixtureExperienceHref(slug: string) {
  return `/experiences/${slug}`;
}

export function fixtureBookingHref(slug: string) {
  return `/experiences/${slug}/book`;
}

export function fixtureArticleHref(slug: string) {
  return `/osaka-travel-guide/${slug}`;
}

export function fixtureCta<D extends CtaDestination>(
  destination: D,
  href: string,
  position: CtaPosition,
  emphasis: CtaSpec["emphasis"],
  label: string,
): CtaSpec<D> {
  return {
    id: `fixture_${destination}_${position}`,
    destination,
    href,
    label: fixtureText(label),
    position,
    emphasis,
  };
}

/** Neutral SVG placeholder (data URI). Use `unoptimized` with next/image. */
export function fixtureImage(width: number, height: number, alt: string): ImageAsset {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#d9d4c7"/></svg>`;
  return {
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    alt: `[FIXTURE] ${alt}`,
    width,
    height,
    rights: "NOT_VERIFIED",
    consent: "NOT_APPLICABLE",
  };
}
