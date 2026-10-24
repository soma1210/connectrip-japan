/**
 * Page identities from the Website v1 Sitemap Baseline (WORKING_BASELINE, not
 * approved).
 *
 * UI code refers to pages by `RouteKey` and renders the `href` it is given.
 * URLs, slugs and redirects are TBD and owned by the routing layer — never
 * hard-code paths in components.
 */
export type RouteKey =
  | "home"
  | "experiences"
  | "experienceDetail"
  /** Ready-made booking flow: one page, step-based (Working Decision, T-03). */
  | "booking"
  | "privateGuide"
  | "travelGuide"
  | "guideArticle"
  | "howItWorks"
  | "about"
  | "inquiry"
  | "privacy"
  | "terms";

/** Routes whose href depends on a record (an experience, an article). */
export type ParameterizedRouteKey = "experienceDetail" | "booking" | "guideArticle";
