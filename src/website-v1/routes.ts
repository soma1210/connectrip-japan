import type { GuideArea, ParameterizedRouteKey, RouteKey } from "@/contracts";
import { V1_CONTENT, V1_PREVIEW } from "./config";

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
 *
 * `/cancel-policy` is out of the public scope for now (2026-11-18): the
 * Cancellation & Refund Policy V1 is a draft pending legal review, so the public
 * page would be empty. Until it is approved, cancellation terms are given to
 * each guest before the booking is confirmed (Terms of Service, Articles 3–4).
 * Add it back here once `CANCELLATION_POLICY_VISIBLE` is approved for public mode.
 */
export const PUBLIC_PATHS: readonly string[] = ["/", "/private-guide", "/inquiry", "/privacy", "/terms", "/company"];

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
  return path === GUIDE_COMMUNITY_PATH || isServedPath(path);
}

/**
 * Stay preview-only even when V1_SHOW_ALL is on: an unapproved cancellation
 * policy (conflicts with the Terms), mock forms, the reviewers' editorial
 * dashboard and the retired DEMO Travel Guide hub.
 */
export const PREVIEW_ONLY_PATHS: readonly string[] = ["/cancel-policy", "/business-inquiry", "/explore/editorial", "/travel-guide", "/privacy-policy", "/partner/apply"];

/** Whether a public-mode path (no `/v1` prefix) is served to visitors. */
export function isServedPath(path: string): boolean {
  if (PUBLIC_PATHS.includes(path)) return true;
  if (!V1_CONTENT) return false;
  return !PREVIEW_ONLY_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

export type StaticRouteKey = Exclude<RouteKey, ParameterizedRouteKey>;

const STATIC_PATHS: Record<StaticRouteKey, string> = {
  home: "",
  experiences: "/experiences",
  privateGuide: "/private-guide",
  /**
   * The travel media hub: Explore Kansai (2026-11-14). The old Travel Guide
   * hub stays at `travelGuideHref(area)` (DEMO content, no longer linked).
   */
  travelGuide: "/explore",
  /**
   * How It Works: its own page again (Human instruction 2026-11-22: removed
   * from Home, reached from the menu).
   */
  howItWorks: "/how-it-works",
  about: "/about",
  inquiry: "/inquiry",
  /**
   * Privacy Policy V1 (2026-11-14) lives at `/privacy-policy`, preview only
   * while it is a draft (content/privacyPolicy.ts). Public mode keeps the
   * existing `/privacy` (PUBLIC_PATHS) until the new policy is approved; moving
   * the public URL is a separate decision (PUBLIC_PATHS, sitemap, redirect).
   */
  privacy: V1_PREVIEW ? "/privacy-policy" : "/privacy",
  terms: "/terms",
  company: "/company",
  cancelPolicy: "/cancel-policy",
  businessInquiry: "/business-inquiry",
  /** Connectrip Select, Osaka map (v0.1). Other areas later: `/connectrip-select/{area}`. */
  /** Connectrip Japan Select map, Osaka (2026-11-14; was `/connectrip-select/osaka`). */
  connectripSelect: "/explore/map/osaka",
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
  if (!V1_CONTENT) return PARTNER_FORM_URL;
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

/**
 * Kansai Travel Journal (2026-11-13, preview only: not in PUBLIC_PATHS yet).
 * Page 1 is `/kansai-travel-journal`, later pages `/kansai-travel-journal/page/{n}`,
 * articles `/kansai-travel-journal/{slug}` ("page" is never a slug).
 */
export const JOURNAL_ROOT = "/kansai-travel-journal";

export function journalPageHref(page: number): string {
  return withBase(page <= 1 ? JOURNAL_ROOT : `${JOURNAL_ROOT}/page/${page}`);
}

export function journalArticleHref(slug: string): string {
  return withBase(`${JOURNAL_ROOT}/${slug}`);
}

/**
 * Explore Kansai (2026-11-14, preview only): travel media. Not in PUBLIC_PATHS,
 * so every page answers 404 in public mode until it is approved for launch.
 */
const EXPLORE_ROOT = "/explore";

export function exploreHref(): string {
  return withBase(EXPLORE_ROOT);
}

/** Connectrip Japan Select: the list, or one article. */
export function exploreSelectHref(slug?: string): string {
  return withBase(slug ? `${EXPLORE_ROOT}/select/${slug}` : `${EXPLORE_ROOT}/select`);
}

/** Kansai Travel Updates: the list, or one update. */
export function exploreUpdatesHref(slug?: string): string {
  return withBase(slug ? `${EXPLORE_ROOT}/updates/${slug}` : `${EXPLORE_ROOT}/updates`);
}

/** Area page: every Select guide and update for one area. */
export function exploreAreaHref(area: string): string {
  return withBase(`${EXPLORE_ROOT}/area/${area}`);
}

/** How Explore Kansai is written, checked and updated (linked from every article's author box). */
export function exploreEditorialPolicyHref(): string {
  return withBase(`${EXPLORE_ROOT}/editorial-policy`);
}

/** Editorial list (preview only, never public): status, checks and photo rights of every article. */
export function exploreEditorialDashboardHref(): string {
  return withBase(`${EXPLORE_ROOT}/editorial`);
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
