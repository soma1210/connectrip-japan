import type { GuideArea, ParameterizedRouteKey, RouteKey } from "@/contracts";
import { V1_PREVIEW } from "./config";

/**
 * Route Registry for Website v1. The only place that knows URLs.
 *
 * Preview mode (config.ts): pages live under `/v1` next to the current site.
 * Public mode: the same pages are served at the site root (src/proxy.ts
 * rewrites `/x` to the `src/app/v1/x` folder), so links carry no base.
 *
 * Keep `STATIC_PATHS` in sync with the folders under `src/app/v1`.
 */
export const V1_BASE_PATH = V1_PREVIEW ? "/v1" : "";

/**
 * Pages served in public mode (2026-11-11 launch scope). Everything else under
 * `src/app/v1` (Experiences, Travel Guide DEMO, Connectrip Select, How It Works,
 * About until it has approved copy, Business Inquiry, Partner) answers 404, and
 * links to it are not rendered.
 */
export const PUBLIC_PATHS: readonly string[] = ["/", "/private-guide", "/inquiry", "/privacy", "/terms", "/cancel-policy", "/company"];

/**
 * Partner application (W1-D23: the official form is the Partner Google Form).
 * Same URL as the `/partner/apply` redirects in next.config.ts.
 */
export const PARTNER_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfl91wJlinZ4i178QnBE_zS4Rd3O4JPXerJT4LT8_MQgz2_0g/viewform";

/**
 * Guide application (2026-11-11: the official form is the Guide Google Form).
 * Same URL as the `/guide-community` redirect in next.config.ts. The in-site
 * form (src/app/guide-community), its API and data are kept, not served.
 */
export const GUIDE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScUcnWv2X9W64-UyRaPi_e6-rXVRD8AnzCh5C6CSjfbXZ_lIA/viewform";

/**
 * Whether a link target exists for visitors. External URLs and the Guide
 * Community redirect always do; in preview mode every page does.
 */
export function isPublicHref(href: string): boolean {
  if (V1_PREVIEW || /^https?:\/\//.test(href) || href.startsWith("mailto:")) return true;
  const path = href.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  return path === GUIDE_COMMUNITY_PATH || PUBLIC_PATHS.includes(path);
}

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

/**
 * Recruiting pages (Human instruction 2026-10-27). Website-local, so the shared
 * `RouteKey` contract stays unchanged. Partner pages follow the base path
 * (`/v1/partner` now, `/partner` at launch). Guide Community is a standalone
 * page with its own root layout outside `/v1`, so its path never changes.
 */
export type RecruitRouteKey = "guideCommunity" | "partner" | "partnerApply";

const GUIDE_COMMUNITY_PATH = "/guide-community";
const PARTNER_PATH = "/partner";

export function recruitHref(key: RecruitRouteKey): string {
  // Applications are taken by Google Forms (2026-11-11), never by the in-site surveys.
  if (key === "guideCommunity") return GUIDE_FORM_URL;
  if (key === "partnerApply") return PARTNER_FORM_URL;
  // Public mode has no Partner page (Japanese, outside the launch scope): go straight to the form.
  if (!V1_PREVIEW) return PARTNER_FORM_URL;
  return withBase(PARTNER_PATH);
}

/** Link attributes for a recruit target: Google Forms open in a new tab. */
export function externalLinkProps(href: string): { target?: "_blank"; rel?: string } {
  return /^https?:\/\//.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
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
