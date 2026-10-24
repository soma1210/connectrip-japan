import type { GuideArea, ParameterizedRouteKey, RouteKey } from "@/contracts";

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
  /** Osaka hub (W1-D10 K-2). Other areas: `travelGuideHref(area)`. */
  travelGuide: "/travel-guide/osaka",
  howItWorks: "/how-it-works",
  about: "/about",
  inquiry: "/inquiry",
  privacy: "/privacy",
  terms: "/terms",
  company: "/company",
  cancelPolicy: "/cancel-policy",
  businessInquiry: "/business-inquiry",
  /** Connectrip Select, Osaka map (v0.1). Other areas later: `/connectrip-select/{area}`. */
  connectripSelect: "/connectrip-select/osaka",
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

/**
 * Travel Guide (APPROVED, W1-D10 K-2): `/travel-guide/{area}` and
 * `/travel-guide/{area}/{slug}`. Categories and years never go in the URL.
 */
export const TRAVEL_GUIDE_ROOT = "/travel-guide";

export function travelGuideRootHref(): string {
  return withBase(TRAVEL_GUIDE_ROOT);
}

export function travelGuideHref(area: GuideArea = "osaka"): string {
  return withBase(`${TRAVEL_GUIDE_ROOT}/${area}`);
}

export function articleHref(slug: string, area: GuideArea = "osaka"): string {
  return withBase(`${TRAVEL_GUIDE_ROOT}/${area}/${slug}`);
}

/** Kept free for future topic hubs (`/travel-guide/osaka/events`). Articles may not use them. */
export const RESERVED_GUIDE_SLUGS = [
  "events",
  "seasonal",
  "food",
  "family",
  "hidden-gems",
  "itineraries",
  "things-to-do",
  "latest",
  "topics",
] as const;

/**
 * Public redirects (production paths, without the preview base). Add an entry
 * when a published slug changes or an article is merged (W1-D10). Wired into
 * Next.js when v1 launches.
 */
export const REDIRECTS: { source: string; destination: string; permanent: boolean }[] = [];

/** The production path of a preview href (`/v1/x` → `/x`). Used for canonical URLs. */
export function publicPath(href: string): string {
  if (href === V1_BASE_PATH) return "/";
  return href.startsWith(`${V1_BASE_PATH}/`) ? href.slice(V1_BASE_PATH.length) : href;
}
