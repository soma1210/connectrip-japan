import type { ParameterizedRouteKey, RouteKey } from "@/contracts";

/**
 * Route Registry for the Website v1 preview. The only place that knows URLs.
 *
 * Every path here is PROPOSED (final URLs, slugs and redirects are TBD). The
 * preview lives under `/v1` so it can run next to the current site without
 * touching it. Moving v1 to the site root later means changing
 * `V1_BASE_PATH` and the `src/app/v1` folder, not components.
 *
 * Keep `STATIC_PATHS` in sync with the folders under `src/app/v1`.
 */
export const V1_BASE_PATH = "/v1";

export type StaticRouteKey = Exclude<RouteKey, ParameterizedRouteKey>;

const STATIC_PATHS: Record<StaticRouteKey, string> = {
  home: "",
  experiences: "/experiences",
  privateGuide: "/private-guide",
  travelGuide: "/osaka-travel-guide",
  howItWorks: "/how-it-works",
  about: "/about",
  inquiry: "/inquiry",
  privacy: "/privacy",
  terms: "/terms",
};

function withBase(path: string) {
  return `${V1_BASE_PATH}${path}` || "/";
}

export function routeHref(key: StaticRouteKey): string {
  return withBase(STATIC_PATHS[key]);
}

export function experienceHref(slug: string): string {
  return withBase(`${STATIC_PATHS.experiences}/${slug}`);
}

/** Booking Flow page. Not built in the preview (booking backend is out of scope). */
export function bookingHref(slug: string): string {
  return withBase(`${STATIC_PATHS.experiences}/${slug}/book`);
}

export function articleHref(slug: string): string {
  return withBase(`${STATIC_PATHS.travelGuide}/${slug}`);
}
